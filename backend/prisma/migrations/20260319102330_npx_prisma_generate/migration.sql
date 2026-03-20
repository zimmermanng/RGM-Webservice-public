-- CreateTable
CREATE TABLE "TeamSessionLock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "teamId" INTEGER NOT NULL,
    "sessionId" TEXT NOT NULL,
    "lockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeamSessionLock_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamSessionLock_teamId_key" ON "TeamSessionLock"("teamId");

-- CreateIndex
CREATE INDEX "TeamSessionLock_sessionId_idx" ON "TeamSessionLock"("sessionId");
