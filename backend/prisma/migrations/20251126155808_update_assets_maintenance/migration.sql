/*
  Warnings:

  - You are about to drop the column `roomId` on the `MaintenanceRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Asset" ADD COLUMN "purchasedAt" DATETIME;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MaintenanceRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT,
    "residentId" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaintenanceRequest_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceRequest_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MaintenanceRequest" ("category", "createdAt", "description", "id", "residentId", "status", "updatedAt") SELECT "category", "createdAt", "description", "id", "residentId", "status", "updatedAt" FROM "MaintenanceRequest";
DROP TABLE "MaintenanceRequest";
ALTER TABLE "new_MaintenanceRequest" RENAME TO "MaintenanceRequest";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
