-- CreateTable
CREATE TABLE "MessSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "residentId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "monthlyFee" REAL NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MessSubscription_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MessSubscription_residentId_idx" ON "MessSubscription"("residentId");

-- CreateIndex
CREATE INDEX "MessSubscription_isActive_idx" ON "MessSubscription"("isActive");
