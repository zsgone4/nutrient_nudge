import { db } from "../src/db";

const emptyMicros = {
  vitaminA: 0, vitaminB1: 0, vitaminB2: 0, vitaminB3: 0, vitaminB5: 0,
  vitaminB6: 0, vitaminB7: 0, vitaminB9: 0, vitaminB12: 0, vitaminC: 0,
  vitaminD: 0, vitaminE: 0, vitaminK: 0, calcium: 0, iron: 0, magnesium: 0,
  phosphorus: 0, potassium: 0, sodium: 0, zinc: 0, copper: 0, manganese: 0,
  selenium: 0, chromium: 0, iodine: 0,
};

const m = (overrides: Partial<typeof emptyMicros>) => ({ ...emptyMicros, ...overrides });

async function seedFoods() {
  console.log("Starting food database seeding...");

  const foods = [
    // FRUITS
    { name: 'Banana', servingSize: 118, servingUnit: 'g', category: 'fruits', calories: 105, protein: 1.3, carbohydrates: 27, fat: 0.4, fiber: 3.1, sugar: 14, ...m({ vitaminB6: 0.43, vitaminC: 10.3, potassium: 422, magnesium: 32, manganese: 0.32 }) },
    { name: 'Apple', servingSize: 182, servingUnit: 'g', category: 'fruits', calories: 95, protein: 0.5, carbohydrates: 25, fat: 0.3, fiber: 4.4, sugar: 19, ...m({ vitaminC: 8.4, potassium: 195, vitaminK: 4 }) },
    { name: 'Orange', servingSize: 131, servingUnit: 'g', category: 'fruits', calories: 62, protein: 1.2, carbohydrates: 15, fat: 0.2, fiber: 3.1, sugar: 12, ...m({ vitaminC: 70, vitaminB9: 40, potassium: 237, calcium: 52, vitaminB1: 0.11 }) },
    { name: 'Blueberries', servingSize: 148, servingUnit: 'g', category: 'fruits', calories: 84, protein: 1.1, carbohydrates: 21, fat: 0.5, fiber: 3.6, sugar: 15, ...m({ vitaminC: 14.4, vitaminK: 28.6, manganese: 0.5, vitaminE: 0.84 }) },
    { name: 'Strawberries', servingSize: 152, servingUnit: 'g', category: 'fruits', calories: 49, protein: 1, carbohydrates: 12, fat: 0.5, fiber: 3, sugar: 7, ...m({ vitaminC: 89, manganese: 0.6, vitaminB9: 36, potassium: 233 }) },
    { name: 'Avocado', servingSize: 100, servingUnit: 'g', category: 'fruits', calories: 160, protein: 2, carbohydrates: 9, fat: 15, fiber: 7, sugar: 0.7, ...m({ vitaminK: 21, vitaminB9: 81, vitaminB6: 0.26, vitaminC: 10, potassium: 485, vitaminE: 2.1 }) },
    { name: 'Mango', servingSize: 165, servingUnit: 'g', category: 'fruits', calories: 99, protein: 1.4, carbohydrates: 25, fat: 0.6, fiber: 2.6, sugar: 23, ...m({ vitaminC: 60, vitaminA: 89, vitaminB6: 0.2, vitaminB9: 71, potassium: 277 }) },

    // VEGETABLES
    { name: 'Spinach (raw)', servingSize: 30, servingUnit: 'g', category: 'vegetables', calories: 7, protein: 0.9, carbohydrates: 1.1, fat: 0.1, fiber: 0.7, sugar: 0.1, ...m({ vitaminA: 141, vitaminK: 145, vitaminB9: 58, vitaminC: 8.4, iron: 0.8, magnesium: 24, manganese: 0.27 }) },
    { name: 'Broccoli (cooked)', servingSize: 156, servingUnit: 'g', category: 'vegetables', calories: 55, protein: 3.7, carbohydrates: 11, fat: 0.6, fiber: 5.1, sugar: 2.2, ...m({ vitaminC: 101, vitaminK: 220, vitaminA: 120, vitaminB9: 168, potassium: 457, chromium: 22 }) },
    { name: 'Carrots', servingSize: 128, servingUnit: 'g', category: 'vegetables', calories: 52, protein: 1.2, carbohydrates: 12, fat: 0.3, fiber: 3.6, sugar: 6, ...m({ vitaminA: 1069, vitaminK: 16.9, vitaminC: 7.6, potassium: 410, vitaminB7: 6.1 }) },

    // PROTEINS
    { name: 'Chicken Breast (grilled)', servingSize: 140, servingUnit: 'g', category: 'protein', calories: 231, protein: 43, carbohydrates: 0, fat: 5, fiber: 0, sugar: 0, ...m({ vitaminB3: 14.4, vitaminB6: 0.87, vitaminB12: 0.35, selenium: 36, phosphorus: 300, zinc: 1.4 }) },
    { name: 'Salmon (baked)', servingSize: 170, servingUnit: 'g', category: 'protein', calories: 367, protein: 39, carbohydrates: 0, fat: 22, fiber: 0, sugar: 0, ...m({ vitaminB12: 4.9, vitaminD: 14.2, vitaminB3: 12.6, vitaminB6: 1.2, selenium: 58, phosphorus: 420 }) },
    { name: 'Egg (large)', servingSize: 50, servingUnit: 'g', category: 'protein', calories: 78, protein: 6.3, carbohydrates: 0.6, fat: 5.3, fiber: 0, sugar: 0.6, ...m({ vitaminB12: 0.65, vitaminD: 1.1, vitaminB2: 0.23, selenium: 15.4, vitaminA: 80, vitaminB7: 10 }) },
    { name: 'Ground Beef (90% lean)', servingSize: 113, servingUnit: 'g', category: 'protein', calories: 199, protein: 23, carbohydrates: 0, fat: 11, fiber: 0, sugar: 0, ...m({ vitaminB12: 2.5, zinc: 5.7, iron: 2.6, vitaminB3: 5.3, vitaminB6: 0.4, selenium: 20 }) },
    { name: 'Lentils (cooked)', servingSize: 198, servingUnit: 'g', category: 'protein', calories: 230, protein: 18, carbohydrates: 40, fat: 0.8, fiber: 16, sugar: 3.6, ...m({ vitaminB9: 358, iron: 6.6, vitaminB1: 0.33, vitaminB6: 0.35, phosphorus: 356, potassium: 731, manganese: 1 }) },

    // DAIRY
    { name: 'Greek Yogurt (plain, nonfat)', servingSize: 170, servingUnit: 'g', category: 'dairy', calories: 100, protein: 17, carbohydrates: 6, fat: 0.7, fiber: 0, sugar: 4, ...m({ vitaminB12: 1.3, calcium: 187, phosphorus: 229, vitaminB2: 0.27, iodine: 50 }) },
    { name: 'Milk (whole)', servingSize: 244, servingUnit: 'g', category: 'dairy', calories: 149, protein: 8, carbohydrates: 12, fat: 8, fiber: 0, sugar: 12, ...m({ vitaminD: 3.2, vitaminB12: 1.1, calcium: 276, phosphorus: 205, vitaminB2: 0.45, potassium: 322, iodine: 56 }) },

    // GRAINS
    { name: 'Brown Rice (cooked)', servingSize: 195, servingUnit: 'g', category: 'grains', calories: 216, protein: 5, carbohydrates: 45, fat: 1.8, fiber: 3.5, sugar: 0.7, ...m({ manganese: 1.8, magnesium: 84, selenium: 19, vitaminB3: 3, vitaminB1: 0.2, phosphorus: 162 }) },
    { name: 'Oatmeal (cooked)', servingSize: 234, servingUnit: 'g', category: 'grains', calories: 158, protein: 6, carbohydrates: 27, fat: 3.2, fiber: 4, sugar: 1.1, ...m({ manganese: 1.4, phosphorus: 180, magnesium: 56, iron: 2.1, zinc: 1.5, vitaminB1: 0.26 }) },

    // FATS & SNACKS
    { name: 'Almonds', servingSize: 28, servingUnit: 'g', category: 'fats', calories: 164, protein: 6, carbohydrates: 6, fat: 14, fiber: 3.5, sugar: 1.2, ...m({ vitaminE: 7.3, magnesium: 76, manganese: 0.6, vitaminB2: 0.29, phosphorus: 136, copper: 0.3 }) },
    { name: 'Olive Oil', servingSize: 14, servingUnit: 'g', category: 'fats', calories: 119, protein: 0, carbohydrates: 0, fat: 13.5, fiber: 0, sugar: 0, ...m({ vitaminE: 1.9, vitaminK: 8.1 }) },
    { name: 'Green Tea', servingSize: 240, servingUnit: 'g', category: 'beverages', calories: 2, protein: 0, carbohydrates: 0, fat: 0, fiber: 0, sugar: 0, ...m({ manganese: 0.5 }) },
  ];

  for (const food of foods) {
    try {
      await db.food.create({ data: food });
      console.log(`✓ Created: ${food.name}`);
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`→ Already exists: ${food.name}`);
      } else {
        console.error(`✗ Error creating ${food.name}:`, error.message);
      }
    }
  }

  console.log("\n✓ Food seeding complete!");
}

seedFoods()
  .catch((error) => { console.error("Seeding failed:", error); process.exit(1); })
  .finally(async () => { process.exit(0); });
