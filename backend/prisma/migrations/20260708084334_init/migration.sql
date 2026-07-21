/*
  Warnings:

  - Added the required column `name` to the `EvaluationRounds` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EvaluationRounds" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_EvaluationRounds" ("createdAt", "id", "isActive", "updatedAt") SELECT "createdAt", "id", "isActive", "updatedAt" FROM "EvaluationRounds";
DROP TABLE "EvaluationRounds";
ALTER TABLE "new_EvaluationRounds" RENAME TO "EvaluationRounds";
CREATE INDEX "EvaluationRounds_name_idx" ON "EvaluationRounds"("name");
CREATE INDEX "EvaluationRounds_isActive_idx" ON "EvaluationRounds"("isActive");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
