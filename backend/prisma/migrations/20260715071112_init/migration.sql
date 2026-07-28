-- CreateTable
CREATE TABLE "EvaluationRoundsData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "evaluationRound" INTEGER NOT NULL,
    "importedPackages" JSONB NOT NULL,
    "organisation" JSONB NOT NULL,
    "leafResults" JSONB NOT NULL,
    CONSTRAINT "EvaluationRoundsData_evaluationRound_fkey" FOREIGN KEY ("evaluationRound") REFERENCES "EvaluationRounds" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "EvaluationRoundsData_evaluationRound_idx" ON "EvaluationRoundsData"("evaluationRound");
