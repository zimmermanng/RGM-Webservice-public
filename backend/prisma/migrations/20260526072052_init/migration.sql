/*
  Warnings:

  - You are about to drop the `AdminTeamView` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AdminTeamView";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "teamView" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "teamId" INTEGER NOT NULL,
    "viewingTeamId" INTEGER NOT NULL,
    CONSTRAINT "teamView_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "TeamSessionLock" ("teamId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "teamView_viewingTeamId_fkey" FOREIGN KEY ("viewingTeamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "teamView_teamId_key" ON "teamView"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "teamView_viewingTeamId_key" ON "teamView"("viewingTeamId");

-- CreateIndex
CREATE INDEX "teamView_teamId_idx" ON "teamView"("teamId");
