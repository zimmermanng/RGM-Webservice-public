-- CreateTable
CREATE TABLE "EvaluationRounds" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "isActive" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "EvaluationRounds_isActive_idx" ON "EvaluationRounds"("isActive");
