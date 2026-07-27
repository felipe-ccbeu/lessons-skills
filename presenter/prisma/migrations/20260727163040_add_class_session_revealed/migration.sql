-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ClassSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "currentSlideId" TEXT,
    "revealed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClassSession_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ClassSession" ("code", "createdAt", "currentSlideId", "id", "partId", "updatedAt") SELECT "code", "createdAt", "currentSlideId", "id", "partId", "updatedAt" FROM "ClassSession";
DROP TABLE "ClassSession";
ALTER TABLE "new_ClassSession" RENAME TO "ClassSession";
CREATE UNIQUE INDEX "ClassSession_code_key" ON "ClassSession"("code");
CREATE UNIQUE INDEX "ClassSession_partId_key" ON "ClassSession"("partId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
