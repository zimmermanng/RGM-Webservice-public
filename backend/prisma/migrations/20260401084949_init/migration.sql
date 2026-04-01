-- CreateTable
CREATE TABLE "Team" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "parentId" INTEGER,
    "isSelectable" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Team_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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

-- CreateTable
CREATE TABLE "TeamSessionLock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "teamId" INTEGER NOT NULL,
    "sessionId" TEXT NOT NULL,
    "lockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeamSessionLock_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE INDEX "Team_parentId_idx" ON "Team"("parentId");

-- CreateIndex
CREATE INDEX "Team_isSelectable_idx" ON "Team"("isSelectable");

-- CreateIndex
CREATE INDEX "Team_isActive_idx" ON "Team"("isActive");

-- CreateIndex
CREATE INDEX "Team_sortOrder_idx" ON "Team"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSettings_teamId_key" ON "TeamSettings"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamCurrentState_teamId_key" ON "TeamCurrentState"("teamId");

-- CreateIndex
CREATE INDEX "SurveyRun_teamId_submittedAt_idx" ON "SurveyRun"("teamId", "submittedAt");

-- CreateIndex
CREATE INDEX "SurveyRun_teamId_isLatest_idx" ON "SurveyRun"("teamId", "isLatest");

-- CreateIndex
CREATE INDEX "TeamLoginEvent_teamId_loggedInAt_idx" ON "TeamLoginEvent"("teamId", "loggedInAt");

-- CreateIndex
CREATE INDEX "SurveySnapshot_teamId_submittedAt_idx" ON "SurveySnapshot"("teamId", "submittedAt");

-- CreateIndex
CREATE INDEX "SurveySnapshot_teamId_snapshotType_idx" ON "SurveySnapshot"("teamId", "snapshotType");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSessionLock_teamId_key" ON "TeamSessionLock"("teamId");

-- CreateIndex
CREATE INDEX "TeamSessionLock_sessionId_idx" ON "TeamSessionLock"("sessionId");

-- CreateIndex
CREATE INDEX "TeamSessionLock_expiresAt_idx" ON "TeamSessionLock"("expiresAt");
