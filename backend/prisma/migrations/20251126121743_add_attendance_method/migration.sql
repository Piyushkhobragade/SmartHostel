-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AttendanceLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "residentId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'MANUAL',
    "checkInTime" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AttendanceLog_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AttendanceLog" ("checkInTime", "createdAt", "date", "id", "residentId", "status", "updatedAt") SELECT "checkInTime", "createdAt", "date", "id", "residentId", "status", "updatedAt" FROM "AttendanceLog";
DROP TABLE "AttendanceLog";
ALTER TABLE "new_AttendanceLog" RENAME TO "AttendanceLog";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
