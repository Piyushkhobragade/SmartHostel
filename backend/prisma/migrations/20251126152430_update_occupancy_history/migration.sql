/*
  Warnings:

  - You are about to drop the column `totalOccupancy` on the `OccupancyHistory` table. All the data in the column will be lost.
  - Added the required column `occupiedBeds` to the `OccupancyHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalBeds` to the `OccupancyHistory` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OccupancyHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "totalBeds" INTEGER NOT NULL,
    "occupiedBeds" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_OccupancyHistory" ("createdAt", "date", "id") SELECT "createdAt", "date", "id" FROM "OccupancyHistory";
DROP TABLE "OccupancyHistory";
ALTER TABLE "new_OccupancyHistory" RENAME TO "OccupancyHistory";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
