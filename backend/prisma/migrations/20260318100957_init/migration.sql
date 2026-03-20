-- CreateTable
CREATE TABLE "Team" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TeamSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "teamId" INTEGER NOT NULL,
    "activeDimensions" JSONB NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeamSettings_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamCurrentState" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "teamId" INTEGER NOT NULL,
    "latestSurveyRunId" INTEGER,
    "currentAnswers" JSONB,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeamCurrentState_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SurveyRun" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "teamId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" DATETIME NOT NULL,
    "dimensionId" TEXT,
    "handlungsfeldId" TEXT,
    "payload" JSONB NOT NULL,
    "isLatest" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "SurveyRun_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSettings_teamId_key" ON "TeamSettings"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamCurrentState_teamId_key" ON "TeamCurrentState"("teamId");

-- CreateIndex
CREATE INDEX "SurveyRun_teamId_submittedAt_idx" ON "SurveyRun"("teamId", "submittedAt");

-- CreateIndex
CREATE INDEX "SurveyRun_teamId_isLatest_idx" ON "SurveyRun"("teamId", "isLatest");
