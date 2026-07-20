/*
  Warnings:

  - Added the required column `question` to the `PollSession` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PollSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "slideId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    CONSTRAINT "PollSession_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PollSession" ("closedAt", "code", "createdAt", "id", "partId", "slideId", "status") SELECT "closedAt", "code", "createdAt", "id", "partId", "slideId", "status" FROM "PollSession";
DROP TABLE "PollSession";
ALTER TABLE "new_PollSession" RENAME TO "PollSession";
CREATE UNIQUE INDEX "PollSession_code_key" ON "PollSession"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
