-- CreateEnum
CREATE TYPE "ResidentStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'SUSPENDED');

-- AlterTable (OperationalEvent)
ALTER TABLE "OperationalEvent" ADD COLUMN "actorId" TEXT;

-- AlterTable (Resident)
-- Safe Enum cast without dropping column
ALTER TABLE "Resident" ADD COLUMN "bloodGroup" TEXT;
ALTER TABLE "Resident" ADD COLUMN "dateOfBirth" TIMESTAMP(3);
ALTER TABLE "Resident" ADD COLUMN "parentAddress" TEXT;
ALTER TABLE "Resident" ADD COLUMN "parentName" TEXT;
ALTER TABLE "Resident" ADD COLUMN "parentPhone" TEXT;

ALTER TABLE "Resident" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Resident" ALTER COLUMN "status" TYPE "ResidentStatus" USING "status"::text::"ResidentStatus";
ALTER TABLE "Resident" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable (User)
-- Step 1: Add the column. Existing rows are instantly populated with 'true'.
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT true;
-- Step 2: Custom Backfill. We immediately set all existing grandfathered rows to 'false'.
UPDATE "User" SET "mustChangePassword" = false;

-- CreateTable
CREATE TABLE "AdmissionDraft" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdmissionDraft_expiresAt_idx" ON "AdmissionDraft"("expiresAt");

-- CreateIndex
CREATE INDEX "Document_residentId_idx" ON "Document"("residentId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
