-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_teamView" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "teamId" INTEGER NOT NULL,
    "viewingTeamId" INTEGER NOT NULL,
    CONSTRAINT "teamView_viewingTeamId_fkey" FOREIGN KEY ("viewingTeamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_teamView" ("id", "teamId", "viewingTeamId") SELECT "id", "teamId", "viewingTeamId" FROM "teamView";
DROP TABLE "teamView";
ALTER TABLE "new_teamView" RENAME TO "teamView";
CREATE UNIQUE INDEX "teamView_teamId_key" ON "teamView"("teamId");
CREATE UNIQUE INDEX "teamView_viewingTeamId_key" ON "teamView"("viewingTeamId");
CREATE INDEX "teamView_teamId_idx" ON "teamView"("teamId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
