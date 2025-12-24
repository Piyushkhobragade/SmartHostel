/*
  Warnings:

  - Added the required column `idLast4` to the `VisitorLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idType` to the `VisitorLog` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VisitorLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitorName" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "checkInTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutTime" DATETIME,
    "purpose" TEXT NOT NULL,
    "idType" TEXT NOT NULL,
    "idLast4" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VisitorLog_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_VisitorLog" ("checkInTime", "checkOutTime", "createdAt", "id", "purpose", "residentId", "updatedAt", "visitorName") SELECT "checkInTime", "checkOutTime", "createdAt", "id", "purpose", "residentId", "updatedAt", "visitorName" FROM "VisitorLog";
DROP TABLE "VisitorLog";
ALTER TABLE "new_VisitorLog" RENAME TO "VisitorLog";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
