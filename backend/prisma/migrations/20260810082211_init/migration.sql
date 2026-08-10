/*
  Warnings:

  - You are about to alter the column `childrenLevelsAllowed` on the `Team` table. The data in that column could be lost. The data in that column will be cast from `String` to `Boolean`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Team" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "parentId" INTEGER,
    "childrenLevelsAllowed" BOOLEAN NOT NULL,
    "isSelectable" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Team_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Team" ("childrenLevelsAllowed", "createdAt", "id", "isActive", "isSelectable", "name", "parentId", "passwordHash", "sortOrder", "updatedAt") SELECT "childrenLevelsAllowed", "createdAt", "id", "isActive", "isSelectable", "name", "parentId", "passwordHash", "sortOrder", "updatedAt" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");
CREATE INDEX "Team_parentId_idx" ON "Team"("parentId");
CREATE INDEX "Team_isSelectable_idx" ON "Team"("isSelectable");
CREATE INDEX "Team_isActive_idx" ON "Team"("isActive");
CREATE INDEX "Team_sortOrder_idx" ON "Team"("sortOrder");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
