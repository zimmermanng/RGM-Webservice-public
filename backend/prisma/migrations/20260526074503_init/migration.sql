/*
  Warnings:

  - You are about to drop the `teamView` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "teamView";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "TeamView" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionTeamId" INTEGER NOT NULL,
    "viewingTeamId" INTEGER NOT NULL,
    CONSTRAINT "TeamView_sessionTeamId_fkey" FOREIGN KEY ("sessionTeamId") REFERENCES "TeamSessionLock" ("teamId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamView_viewingTeamId_fkey" FOREIGN KEY ("viewingTeamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamView_sessionTeamId_key" ON "TeamView"("sessionTeamId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamView_viewingTeamId_key" ON "TeamView"("viewingTeamId");

-- CreateIndex
CREATE INDEX "TeamView_sessionTeamId_idx" ON "TeamView"("sessionTeamId");
