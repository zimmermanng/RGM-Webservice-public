/*
  Warnings:

  - A unique constraint covering the columns `[evaluationRound]` on the table `EvaluationRoundsData` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EvaluationRoundsData_evaluationRound_key" ON "EvaluationRoundsData"("evaluationRound");
