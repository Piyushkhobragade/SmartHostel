/*
  Warnings:

  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `Resident` table. All the data in the column will be lost.
  - You are about to drop the column `guardianName` on the `Resident` table. All the data in the column will be lost.
  - You are about to drop the column `guardianPhone` on the `Resident` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Resident` table. All the data in the column will be lost.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `Resident` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomNumber" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "currentOccupancy" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Room" ("capacity", "createdAt", "currentOccupancy", "id", "roomNumber", "type", "updatedAt") SELECT "capacity", "createdAt", "currentOccupancy", "id", "roomNumber", "type", "updatedAt" FROM "Room";
DROP TABLE "Room";
ALTER TABLE "new_Room" RENAME TO "Room";
CREATE UNIQUE INDEX "Room_roomNumber_key" ON "Room"("roomNumber");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "id", "role", "updatedAt") SELECT "createdAt", "id", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE TABLE "new_Resident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "roomId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Resident_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Resident" ("createdAt", "email", "id", "phone", "roomId", "updatedAt") SELECT "createdAt", "email", "id", "phone", "roomId", "updatedAt" FROM "Resident";
DROP TABLE "Resident";
ALTER TABLE "new_Resident" RENAME TO "Resident";
CREATE UNIQUE INDEX "Resident_email_key" ON "Resident"("email");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
