-- Rollback for 20260611_phase81

-- Drop Foreign Keys and Indexes
ALTER TABLE "Document" DROP CONSTRAINT "Document_residentId_fkey";
DROP INDEX IF EXISTS "Document_residentId_idx";
DROP INDEX IF EXISTS "AdmissionDraft_expiresAt_idx";

-- Drop Models
DROP TABLE "Document";
DROP TABLE "AdmissionDraft";

-- Rollback User
ALTER TABLE "User" DROP COLUMN "mustChangePassword";

-- Rollback Resident
ALTER TABLE "Resident" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Resident" ALTER COLUMN "status" TYPE TEXT USING "status"::text;
ALTER TABLE "Resident" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

ALTER TABLE "Resident" DROP COLUMN "bloodGroup", 
  DROP COLUMN "dateOfBirth", 
  DROP COLUMN "parentAddress", 
  DROP COLUMN "parentName", 
  DROP COLUMN "parentPhone";

-- Rollback OperationalEvent
ALTER TABLE "OperationalEvent" DROP COLUMN "actorId";

-- Drop Enum
DROP TYPE "ResidentStatus";
