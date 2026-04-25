-- CreateTable
CREATE TABLE "NutrientScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "micronutrients" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NutrientScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Signup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "NutrientScore_userId_date_key" ON "NutrientScore"("userId", "date");
