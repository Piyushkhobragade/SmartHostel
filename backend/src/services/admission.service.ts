import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ResidentStatus } from '@prisma/client';

export const admissionService = {
    async createDraft(payload: any) {
        // Draft expires in 7 days
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const draft = await prisma.admissionDraft.create({
            data: {
                payload: { ...payload, step: 1 },
                expiresAt
            }
        });
        return draft;
    },

    async updateDraft(draftId: string, step: number, data: any) {
        const draft = await prisma.admissionDraft.findUnique({ where: { id: draftId } });
        if (!draft) throw new Error('Draft not found');

        const currentPayload = draft.payload as Record<string, any>;
        if (currentPayload.completed) {
            throw new Error('This admission is already completed.');
        }

        const newPayload = { ...currentPayload, ...data, step };

        const updated = await prisma.admissionDraft.update({
            where: { id: draftId },
            data: { payload: newPayload }
        });
        return updated;
    },

    async getDrafts() {
        return prisma.admissionDraft.findMany({
            where: { expiresAt: { gt: new Date() } },
            orderBy: { updatedAt: 'desc' }
        });
    },

    async completeAdmission(draftId: string, actorId: string) {
        const draft = await prisma.admissionDraft.findUnique({ where: { id: draftId } });
        if (!draft) throw new Error('Draft not found');

        const payload = draft.payload as Record<string, any>;

        // IDEMPOTENCY CHECK
        if (payload.completed) {
            return {
                success: true,
                residentId: payload.residentId,
                message: 'Admission already completed. Credentials cannot be retrieved again.',
                credentials: null
            };
        }

        const roomId = payload.roomId;
        if (!roomId) throw new Error('Room selection is required to complete admission');

        // Execute Transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Pessimistic Locking on Room
            const rooms = await tx.$queryRaw<any[]>`SELECT * FROM "Room" WHERE id = ${roomId} FOR UPDATE`;
            if (!rooms || rooms.length === 0) {
                throw new Error('Room not found');
            }
            const room = rooms[0];

            // 2. Validate Capacity
            if (room.currentOccupancy >= room.capacity) {
                throw new Error('Room is at full capacity');
            }

            // 3. Create Resident
            const dateOfBirth = payload.dateOfBirth ? new Date(payload.dateOfBirth) : null;
            const resident = await tx.resident.create({
                data: {
                    fullName: payload.fullName,
                    email: payload.email,
                    phone: payload.phone,
                    status: ResidentStatus.ACTIVE,
                    roomId: roomId,
                    dateOfBirth: dateOfBirth,
                    bloodGroup: payload.bloodGroup,
                    parentName: payload.parentName,
                    parentPhone: payload.parentPhone,
                    parentAddress: payload.parentAddress
                }
            });

            // 4. Update Room Occupancy
            await tx.room.update({
                where: { id: roomId },
                data: { currentOccupancy: { increment: 1 } }
            });

            // 5. Generate Fee Invoice
            if (payload.feeAmount && payload.feeDescription) {
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 7);
                await tx.feeInvoice.create({
                    data: {
                        residentId: resident.id,
                        amount: parseFloat(payload.feeAmount),
                        description: payload.feeDescription,
                        dueDate,
                        status: 'PENDING'
                    }
                });
            }

            // 6. Attach Documents (if S3 keys exist in draft payload)
            if (payload.documents && Array.isArray(payload.documents)) {
                for (const doc of payload.documents) {
                    await tx.document.create({
                        data: {
                            residentId: resident.id,
                            type: doc.type,
                            s3Key: doc.s3Key
                        }
                    });
                }
            }

            // 7. Credential Generation
            // Username generation (firstname.lastname + numbers if collision)
            const baseUsername = payload.fullName.split(' ').join('.').toLowerCase().replace(/[^a-z0-9.]/g, '');
            let username = baseUsername;
            let counter = 1;
            while (true) {
                const existingUser = await tx.user.findUnique({ where: { username } });
                if (!existingUser) break;
                username = `${baseUsername}${counter}`;
                counter++;
            }

            const tempPassword = crypto.randomBytes(4).toString('hex'); // 8 char temp password
            const passwordHash = await bcrypt.hash(tempPassword, 10);

            const user = await tx.user.create({
                data: {
                    username,
                    passwordHash,
                    role: 'STUDENT',
                    residentId: resident.id,
                    mustChangePassword: true
                }
            });

            // 8. Audit Event
            await tx.operationalEvent.create({
                data: {
                    type: 'ADMISSION_COMPLETED',
                    actorId: actorId,
                    entityType: 'RESIDENT',
                    entityId: resident.id,
                    title: 'New Resident Admitted',
                    description: `Resident ${resident.fullName} admitted to room ${room.roomNumber}`,
                    severity: 'INFO'
                }
            });

            // 9. Update Draft to COMPLETED (Idempotency)
            await tx.admissionDraft.update({
                where: { id: draftId },
                data: {
                    payload: {
                        ...payload,
                        completed: true,
                        residentId: resident.id,
                        completedAt: new Date().toISOString()
                    }
                }
            });

            return { resident, user, tempPassword };
        }, {
            isolationLevel: 'Serializable',
            maxWait: 5000,
            timeout: 10000
        });

        return {
            success: true,
            residentId: result.resident.id,
            credentials: {
                username: result.user.username,
                tempPassword: result.tempPassword
            }
        };
    },

    async processBulkAdmission(rows: any[], actorId: string) {
        const results = {
            successfulCount: 0,
            failedCount: 0,
            errors: [] as any[]
        };

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                // To reuse completion logic, we can create a temporary draft and complete it
                const draft = await this.createDraft(row);
                await this.completeAdmission(draft.id, actorId);
                results.successfulCount++;
            } catch (err: any) {
                results.failedCount++;
                results.errors.push({
                    row: i + 1,
                    data: row,
                    reason: err.message
                });
            }
        }

        return results;
    }
};
