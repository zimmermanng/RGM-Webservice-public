/*
  Warnings:

  - The primary key for the `TeamSessionLock` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `expiresAt` to the `TeamSessionLock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id` to the `TeamSessionLock` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TeamSessionLock" (
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
INSERT INTO "new_TeamSessionLock" ("lockedAt", "sessionId", "teamId", "updatedAt") SELECT "lockedAt", "sessionId", "teamId", "updatedAt" FROM "TeamSessionLock";
DROP TABLE "TeamSessionLock";
ALTER TABLE "new_TeamSessionLock" RENAME TO "TeamSessionLock";
CREATE UNIQUE INDEX "TeamSessionLock_teamId_key" ON "TeamSessionLock"("teamId");
CREATE INDEX "TeamSessionLock_sessionId_idx" ON "TeamSessionLock"("sessionId");
CREATE INDEX "TeamSessionLock_expiresAt_idx" ON "TeamSessionLock"("expiresAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
