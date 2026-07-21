/*
  Warnings:

  - You are about to drop the column `importedPackages` on the `EvaluationRoundsData` table. All the data in the column will be lost.
  - You are about to drop the column `leafResults` on the `EvaluationRoundsData` table. All the data in the column will be lost.
  - You are about to drop the column `organisation` on the `EvaluationRoundsData` table. All the data in the column will be lost.
  - Added the required column `payload` to the `EvaluationRoundsData` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EvaluationRoundsData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "evaluationRound" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    CONSTRAINT "EvaluationRoundsData_evaluationRound_fkey" FOREIGN KEY ("evaluationRound") REFERENCES "EvaluationRounds" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EvaluationRoundsData" ("evaluationRound", "id") SELECT "evaluationRound", "id" FROM "EvaluationRoundsData";
DROP TABLE "EvaluationRoundsData";
ALTER TABLE "new_EvaluationRoundsData" RENAME TO "EvaluationRoundsData";
CREATE INDEX "EvaluationRoundsData_evaluationRound_idx" ON "EvaluationRoundsData"("evaluationRound");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
