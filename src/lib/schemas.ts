import { z } from 'zod';

// ─── Resident ─────────────────────────────────────────────────────────────────
export const createResidentSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(7, 'Phone number is too short'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  roomId: z.string().uuid('Invalid room ID').nullable().optional(),
});

export const updateResidentSchema = createResidentSchema.partial();

// ─── Room ─────────────────────────────────────────────────────────────────────
export const createRoomSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required'),
  capacity: z.number().int().positive('Capacity must be a positive integer'),
  type: z.enum(['SINGLE', 'DOUBLE', 'TRIPLE', 'DORMITORY']),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED']).optional(),
  floor: z.string().optional(),
  block: z.string().optional(),
});

export const updateRoomSchema = createRoomSchema.partial();

// ─── Maintenance ──────────────────────────────────────────────────────────────
export const createMaintenanceSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  assetId: z.string().uuid('Invalid asset ID').nullable().optional(),
  residentId: z.string().uuid('Invalid resident ID').nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

export const updateMaintenanceSchema = z.object({
  status: z.enum(['OPEN', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

// ─── Fee / Invoice ────────────────────────────────────────────────────────────
export const createInvoiceSchema = z.object({
  residentId: z.string().uuid('Invalid resident ID'),
  amount: z.number().positive('Amount must be positive'),
  dueDate: z.string().datetime({ message: 'Invalid due date (use ISO format)' }),
  description: z.string().min(3, 'Description too short'),
});

export const createPaymentSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID'),
  amount: z.number().positive('Amount must be positive'),
  method: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'UPI', 'CHEQUE']),
  reference: z.string().optional(),
});

// ─── Visitor ──────────────────────────────────────────────────────────────────
export const createVisitorSchema = z.object({
  visitorName: z.string().min(2, 'Visitor name is required'),
  residentId: z.string().uuid('Invalid resident ID'),
  purpose: z.string().min(3, 'Purpose is required'),
  idType: z.string().min(1, 'ID type is required'),
  idLast4: z.string().length(4, 'Last 4 digits of ID are required'),
  preRegistered: z.boolean().optional(),
});

// ─── Attendance ───────────────────────────────────────────────────────────────
export const markAttendanceSchema = z.object({
  residentId: z.string().uuid('Invalid resident ID'),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE']),
  date: z.string().min(1, 'Date is required'),
  method: z.enum(['MANUAL', 'QR', 'BIOMETRIC']).optional(),
  checkInTime: z.string().optional(),
});

// ─── Asset ────────────────────────────────────────────────────────────────────
export const createAssetSchema = z.object({
  name: z.string().min(1, 'Asset name is required'),
  category: z.string().min(1, 'Category is required'),
  status: z.enum(['WORKING', 'UNDER_MAINTENANCE', 'RETIRED', 'LOST']),
  location: z.string().min(1, 'Location is required'),
  purchasedAt: z.string().optional(),
});

export const updateAssetSchema = createAssetSchema.partial();

// ─── Pagination ───────────────────────────────────────────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
