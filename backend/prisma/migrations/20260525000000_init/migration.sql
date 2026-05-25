-- CreateTable
CREATE TABLE "Signup" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "trainingGoal" TEXT,
    "goals" TEXT NOT NULL,
    "agreedToPolicy" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Signup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "heightCm" INTEGER NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "sex" TEXT NOT NULL,
    "activityLevel" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "isSetup" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Food" (
    "id" TEXT NOT NULL,
    "barcode" TEXT,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "servingSize" DOUBLE PRECISION NOT NULL,
    "servingUnit" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "image" TEXT,
    "calories" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "carbohydrates" DOUBLE PRECISION NOT NULL,
    "fat" DOUBLE PRECISION NOT NULL,
    "fiber" DOUBLE PRECISION NOT NULL,
    "sugar" DOUBLE PRECISION NOT NULL,
    "vitaminA" DOUBLE PRECISION NOT NULL,
    "vitaminB1" DOUBLE PRECISION NOT NULL,
    "vitaminB2" DOUBLE PRECISION NOT NULL,
    "vitaminB3" DOUBLE PRECISION NOT NULL,
    "vitaminB5" DOUBLE PRECISION NOT NULL,
    "vitaminB6" DOUBLE PRECISION NOT NULL,
    "vitaminB7" DOUBLE PRECISION NOT NULL,
    "vitaminB9" DOUBLE PRECISION NOT NULL,
    "vitaminB12" DOUBLE PRECISION NOT NULL,
    "vitaminC" DOUBLE PRECISION NOT NULL,
    "vitaminD" DOUBLE PRECISION NOT NULL,
    "vitaminE" DOUBLE PRECISION NOT NULL,
    "vitaminK" DOUBLE PRECISION NOT NULL,
    "calcium" DOUBLE PRECISION NOT NULL,
    "iron" DOUBLE PRECISION NOT NULL,
    "magnesium" DOUBLE PRECISION NOT NULL,
    "phosphorus" DOUBLE PRECISION NOT NULL,
    "potassium" DOUBLE PRECISION NOT NULL,
    "sodium" DOUBLE PRECISION NOT NULL,
    "zinc" DOUBLE PRECISION NOT NULL,
    "copper" DOUBLE PRECISION NOT NULL,
    "manganese" DOUBLE PRECISION NOT NULL,
    "selenium" DOUBLE PRECISION NOT NULL,
    "chromium" DOUBLE PRECISION NOT NULL,
    "iodine" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodLogEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "servings" DOUBLE PRECISION NOT NULL,
    "mealType" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutrientScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "micronutrients" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NutrientScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedMeal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedMeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedMealItem" (
    "id" TEXT NOT NULL,
    "savedMealId" TEXT NOT NULL,
    "foodData" TEXT NOT NULL,
    "servings" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SavedMealItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Signup_email_key" ON "Signup"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Food_barcode_key" ON "Food"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "NutrientScore_userId_date_key" ON "NutrientScore"("userId", "date");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Signup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodLogEntry" ADD CONSTRAINT "FoodLogEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Signup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodLogEntry" ADD CONSTRAINT "FoodLogEntry_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutrientScore" ADD CONSTRAINT "NutrientScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Signup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedMeal" ADD CONSTRAINT "SavedMeal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Signup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedMealItem" ADD CONSTRAINT "SavedMealItem_savedMealId_fkey" FOREIGN KEY ("savedMealId") REFERENCES "SavedMeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

