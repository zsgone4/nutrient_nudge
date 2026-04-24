-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "heightCm" INTEGER NOT NULL,
    "weightKg" REAL NOT NULL,
    "sex" TEXT NOT NULL,
    "activityLevel" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "isSetup" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Signup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Food" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "servingSize" REAL NOT NULL,
    "servingUnit" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "image" TEXT,
    "calories" REAL NOT NULL,
    "protein" REAL NOT NULL,
    "carbohydrates" REAL NOT NULL,
    "fat" REAL NOT NULL,
    "fiber" REAL NOT NULL,
    "sugar" REAL NOT NULL,
    "vitaminA" REAL NOT NULL,
    "vitaminB1" REAL NOT NULL,
    "vitaminB2" REAL NOT NULL,
    "vitaminB3" REAL NOT NULL,
    "vitaminB5" REAL NOT NULL,
    "vitaminB6" REAL NOT NULL,
    "vitaminB7" REAL NOT NULL,
    "vitaminB9" REAL NOT NULL,
    "vitaminB12" REAL NOT NULL,
    "vitaminC" REAL NOT NULL,
    "vitaminD" REAL NOT NULL,
    "vitaminE" REAL NOT NULL,
    "vitaminK" REAL NOT NULL,
    "calcium" REAL NOT NULL,
    "iron" REAL NOT NULL,
    "magnesium" REAL NOT NULL,
    "phosphorus" REAL NOT NULL,
    "potassium" REAL NOT NULL,
    "sodium" REAL NOT NULL,
    "zinc" REAL NOT NULL,
    "copper" REAL NOT NULL,
    "manganese" REAL NOT NULL,
    "selenium" REAL NOT NULL,
    "chromium" REAL NOT NULL,
    "iodine" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FoodLogEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "servings" REAL NOT NULL,
    "mealType" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FoodLogEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Signup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FoodLogEntry_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");
