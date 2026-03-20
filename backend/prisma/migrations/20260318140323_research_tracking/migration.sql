-- CreateTable
CREATE TABLE "TeamLoginEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "teamId" INTEGER NOT NULL,
    "sessionId" TEXT,
    "loggedInAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamLoginEvent_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SurveySnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "teamId" INTEGER NOT NULL,
    "snapshotType" TEXT NOT NULL,
    "dimensionId" TEXT,
    "handlungsfeldId" TEXT,
    "submittedAt" DATETIME NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SurveySnapshot_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TeamLoginEvent_teamId_loggedInAt_idx" ON "TeamLoginEvent"("teamId", "loggedInAt");

-- CreateIndex
CREATE INDEX "SurveySnapshot_teamId_submittedAt_idx" ON "SurveySnapshot"("teamId", "submittedAt");

-- CreateIndex
CREATE INDEX "SurveySnapshot_teamId_snapshotType_idx" ON "SurveySnapshot"("teamId", "snapshotType");
