-- DropIndex
DROP INDEX "TeamSessionLock_teamId_idx";

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TeamView" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionTeamId" INTEGER NOT NULL,
    "viewingTeamId" INTEGER NOT NULL,
    CONSTRAINT "TeamView_viewingTeamId_fkey" FOREIGN KEY ("viewingTeamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TeamView" ("id", "sessionTeamId", "viewingTeamId") SELECT "id", "sessionTeamId", "viewingTeamId" FROM "TeamView";
DROP TABLE "TeamView";
ALTER TABLE "new_TeamView" RENAME TO "TeamView";
CREATE UNIQUE INDEX "TeamView_sessionTeamId_key" ON "TeamView"("sessionTeamId");
CREATE UNIQUE INDEX "TeamView_viewingTeamId_key" ON "TeamView"("viewingTeamId");
CREATE INDEX "TeamView_sessionTeamId_idx" ON "TeamView"("sessionTeamId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
