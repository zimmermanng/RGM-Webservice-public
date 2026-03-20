/*
  Warnings:

  - The primary key for the `TeamSessionLock` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `TeamSessionLock` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TeamSessionLock" (
    "teamId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" TEXT NOT NULL,
    "lockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeamSessionLock_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TeamSessionLock" ("lockedAt", "sessionId", "teamId", "updatedAt") SELECT "lockedAt", "sessionId", "teamId", "updatedAt" FROM "TeamSessionLock";
DROP TABLE "TeamSessionLock";
ALTER TABLE "new_TeamSessionLock" RENAME TO "TeamSessionLock";
CREATE INDEX "TeamSessionLock_sessionId_idx" ON "TeamSessionLock"("sessionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
