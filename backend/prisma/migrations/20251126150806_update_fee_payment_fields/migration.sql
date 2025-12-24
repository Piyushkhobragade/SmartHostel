/*
  Warnings:

  - You are about to drop the column `type` on the `FeeInvoice` table. All the data in the column will be lost.
  - You are about to drop the column `paymentDate` on the `Payment` table. All the data in the column will be lost.
  - Added the required column `description` to the `FeeInvoice` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FeeInvoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "residentId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FeeInvoice_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FeeInvoice" ("amount", "createdAt", "dueDate", "id", "residentId", "status", "updatedAt") SELECT "amount", "createdAt", "dueDate", "id", "residentId", "status", "updatedAt" FROM "FeeInvoice";
DROP TABLE "FeeInvoice";
ALTER TABLE "new_FeeInvoice" RENAME TO "FeeInvoice";
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "paidAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "FeeInvoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "createdAt", "id", "invoiceId", "method", "residentId", "updatedAt") SELECT "amount", "createdAt", "id", "invoiceId", "method", "residentId", "updatedAt" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
