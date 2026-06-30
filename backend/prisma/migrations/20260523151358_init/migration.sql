-- CreateTable
CREATE TABLE "AdminTeamView" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "teamId" INTEGER NOT NULL,
    CONSTRAINT "AdminTeamView_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminTeamView_teamId_key" ON "AdminTeamView"("teamId");

-- CreateIndex
CREATE INDEX "AdminTeamView_teamId_idx" ON "AdminTeamView"("teamId");
