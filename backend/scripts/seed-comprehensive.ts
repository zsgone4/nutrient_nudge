import { db } from "../src/db";

const e0 = { vitaminA:0,vitaminB1:0,vitaminB2:0,vitaminB3:0,vitaminB5:0,vitaminB6:0,vitaminB7:0,vitaminB9:0,vitaminB12:0,vitaminC:0,vitaminD:0,vitaminE:0,vitaminK:0,calcium:0,iron:0,magnesium:0,phosphorus:0,potassium:0,sodium:0,zinc:0,copper:0,manganese:0,selenium:0,chromium:0,iodine:0 };

const UK_BRANDS = ['Tesco','Sainsbury\'s','Waitrose','M&S','Aldi','Lidl','Nisa','Co-op','Morrisons','Iceland','Ocado','Asda'];
const VARIANTS = ['','Light','Extra','Value','Organic','Wholegrain','Reduced Fat','High Protein','Frozen','Fresh'];

type FoodTemplate = {
  name: string; category: string; servingSize: number; servingUnit: string;
  cal: number; pro: number; carb: number; fat: number; fib: number; sug: number;
  micros?: Partial<typeof e0>;
  brandVariants?: boolean;
};

const FOOD_TEMPLATES: FoodTemplate[] = [
  // FISH & SEAFOOD
  { name:'Sea Bass Fillet', category:'protein', servingSize:150, servingUnit:'g', cal:165, pro:26, carb:0, fat:6, fib:0, sug:0, micros:{vitaminD:4.5,vitaminB12:2.2,selenium:36,phosphorus:280,potassium:430,magnesium:40}, brandVariants:true },
  { name:'Sea Bass (Whole)', category:'protein', servingSize:300, servingUnit:'g', cal:138, pro:23, carb:0, fat:5, fib:0, sug:0, micros:{vitaminD:4.5,vitaminB12:2.2,selenium:36,phosphorus:250}, brandVariants:true },
  { name:'Tuna Steak', category:'protein', servingSize:170, servingUnit:'g', cal:296, pro:42, carb:0, fat:12, fib:0, sug:0, micros:{vitaminB12:2.1,selenium:108,vitaminD:5.7,vitaminB3:20,phosphorus:380,potassium:520,magnesium:60}, brandVariants:true },
  { name:'Tuna (Canned in Spring Water)', category:'protein', servingSize:100, servingUnit:'g', cal:109, pro:25, carb:0, fat:1, fib:0, sug:0, micros:{vitaminB12:2.1,selenium:108,vitaminD:3.2,phosphorus:280,potassium:300,sodium:320}, brandVariants:true },
  { name:'Tuna (Canned in Brine)', category:'protein', servingSize:100, servingUnit:'g', cal:99, pro:24, carb:0, fat:0.5, fib:0, sug:0, micros:{vitaminB12:2.0,selenium:90,phosphorus:250,sodium:400}, brandVariants:true },
  { name:'King Prawns (Raw)', category:'protein', servingSize:150, servingUnit:'g', cal:120, pro:26, carb:1, fat:1.5, fib:0, sug:0, micros:{vitaminB12:1.4,selenium:38,zinc:1.8,iron:1.5,phosphorus:240,iodine:55,potassium:280}, brandVariants:true },
  { name:'King Prawns (Cooked)', category:'protein', servingSize:150, servingUnit:'g', cal:131, pro:28, carb:1, fat:1.8, fib:0, sug:0, micros:{vitaminB12:1.4,selenium:38,zinc:1.8,phosphorus:250,iodine:55}, brandVariants:true },
  { name:'Tiger Prawns', category:'protein', servingSize:150, servingUnit:'g', cal:125, pro:24, carb:1.5, fat:2, fib:0, sug:0, micros:{selenium:35,zinc:1.5,iodine:45,phosphorus:230}, brandVariants:true },
  { name:'Shrimp (Small)', category:'protein', servingSize:100, servingUnit:'g', cal:99, pro:21, carb:1, fat:1.2, fib:0, sug:0, micros:{selenium:32,zinc:1.5,iodine:40,phosphorus:200}, brandVariants:true },
  { name:'Salmon Fillet (Baked)', category:'protein', servingSize:140, servingUnit:'g', cal:234, pro:32, carb:0, fat:12, fib:0, sug:0, micros:{vitaminD:14.2,vitaminB12:4.9,selenium:58,vitaminB3:12.6,vitaminB6:1.2,phosphorus:420,potassium:628}, brandVariants:true },
  { name:'Salmon Fillet (Raw)', category:'protein', servingSize:140, servingUnit:'g', cal:208, pro:28, carb:0, fat:10, fib:0, sug:0, micros:{vitaminD:12,vitaminB12:4.5,selenium:52,phosphorus:380}, brandVariants:true },
  { name:'Smoked Salmon', category:'protein', servingSize:80, servingUnit:'g', cal:120, pro:18, carb:0, fat:5, fib:0, sug:0, micros:{vitaminD:8,vitaminB12:3.2,selenium:40,sodium:900,phosphorus:320}, brandVariants:true },
  { name:'Cod Fillet', category:'protein', servingSize:150, servingUnit:'g', cal:131, pro:28, carb:0, fat:1, fib:0, sug:0, micros:{vitaminD:2.2,vitaminB12:1.0,selenium:33,phosphorus:285,potassium:440,iodine:112}, brandVariants:true },
  { name:'Haddock Fillet', category:'protein', servingSize:150, servingUnit:'g', cal:133, pro:29, carb:0, fat:1.2, fib:0, sug:0, micros:{vitaminD:1.5,vitaminB12:1.8,selenium:30,phosphorus:295,iodine:100}, brandVariants:true },
  { name:'Mackerel Fillet', category:'protein', servingSize:140, servingUnit:'g', cal:305, pro:30, carb:0, fat:20, fib:0, sug:0, micros:{vitaminD:8.3,vitaminB12:14,selenium:51,vitaminB3:9,phosphorus:360,potassium:487}, brandVariants:true },
  { name:'Sardines (Tinned)', category:'protein', servingSize:100, servingUnit:'g', cal:208, pro:25, carb:0, fat:11, fib:0, sug:0, micros:{vitaminD:4.8,vitaminB12:8.9,calcium:382,selenium:37,phosphorus:490}, brandVariants:true },
  { name:'Trout Fillet', category:'protein', servingSize:140, servingUnit:'g', cal:219, pro:30, carb:0, fat:10, fib:0, sug:0, micros:{vitaminD:6.5,vitaminB12:6.2,selenium:48,phosphorus:380}, brandVariants:true },
  { name:'Halibut Fillet', category:'protein', servingSize:150, servingUnit:'g', cal:158, pro:30, carb:0, fat:3.5, fib:0, sug:0, micros:{vitaminD:3.8,vitaminB12:1.2,selenium:55,phosphorus:400,magnesium:107}, brandVariants:true },
  { name:'Scallops', category:'protein', servingSize:120, servingUnit:'g', cal:112, pro:21, carb:5, fat:1, fib:0, sug:0, micros:{vitaminB12:1.2,selenium:25,zinc:1.5,phosphorus:200}, brandVariants:true },
  { name:'Mussels (Cooked)', category:'protein', servingSize:100, servingUnit:'g', cal:172, pro:24, carb:7, fat:4.5, fib:0, sug:0, micros:{vitaminB12:20,selenium:90,iron:6.7,zinc:2.7,phosphorus:285,iodine:140}, brandVariants:true },
  { name:'Squid (Calamari)', category:'protein', servingSize:120, servingUnit:'g', cal:103, pro:18, carb:3.5, fat:1.5, fib:0, sug:0, micros:{vitaminB12:1.3,selenium:44,zinc:1.5,copper:1.9}, brandVariants:true },

  // POULTRY
  { name:'Chicken Breast (Skinless)', category:'protein', servingSize:140, servingUnit:'g', cal:231, pro:43, carb:0, fat:5, fib:0, sug:0, micros:{vitaminB3:14.4,vitaminB6:0.87,vitaminB12:0.35,selenium:36,phosphorus:300,zinc:1.4}, brandVariants:true },
  { name:'Chicken Thigh (Skinless)', category:'protein', servingSize:140, servingUnit:'g', cal:250, pro:31, carb:0, fat:13, fib:0, sug:0, micros:{vitaminB3:9.2,vitaminB6:0.6,selenium:28,zinc:2,iron:1.2}, brandVariants:true },
  { name:'Chicken Drumstick', category:'protein', servingSize:130, servingUnit:'g', cal:230, pro:28, carb:0, fat:12, fib:0, sug:0, micros:{vitaminB3:8,vitaminB6:0.5,selenium:25,zinc:1.8}, brandVariants:true },
  { name:'Turkey Breast', category:'protein', servingSize:140, servingUnit:'g', cal:218, pro:41, carb:0, fat:4, fib:0, sug:0, micros:{vitaminB3:14,vitaminB6:0.8,selenium:32,phosphorus:290,zinc:2.5}, brandVariants:true },
  { name:'Duck Breast', category:'protein', servingSize:140, servingUnit:'g', cal:325, pro:35, carb:0, fat:20, fib:0, sug:0, micros:{vitaminB3:8,vitaminB2:0.4,iron:3.2,zinc:2.8}, brandVariants:true },

  // BEEF & LAMB
  { name:'Beef Sirloin Steak', category:'protein', servingSize:150, servingUnit:'g', cal:311, pro:40, carb:0, fat:16, fib:0, sug:0, micros:{vitaminB12:2.8,zinc:7.5,iron:3,vitaminB3:8,selenium:22}, brandVariants:true },
  { name:'Beef Mince (5% Fat)', category:'protein', servingSize:125, servingUnit:'g', cal:163, pro:24, carb:0, fat:7, fib:0, sug:0, micros:{vitaminB12:2.4,zinc:5.2,iron:2.5,vitaminB6:0.4,selenium:20}, brandVariants:true },
  { name:'Beef Mince (20% Fat)', category:'protein', servingSize:125, servingUnit:'g', cal:275, pro:20, carb:0, fat:21, fib:0, sug:0, micros:{vitaminB12:2.2,zinc:5,iron:2.2,vitaminB6:0.35}, brandVariants:true },
  { name:'Lamb Chop', category:'protein', servingSize:130, servingUnit:'g', cal:335, pro:28, carb:0, fat:24, fib:0, sug:0, micros:{vitaminB12:2.5,zinc:5.5,iron:2,vitaminB3:8,selenium:18}, brandVariants:true },
  { name:'Pork Chop', category:'protein', servingSize:140, servingUnit:'g', cal:278, pro:36, carb:0, fat:14, fib:0, sug:0, micros:{vitaminB1:0.8,vitaminB3:8,vitaminB6:0.7,selenium:32,zinc:2.4}, brandVariants:true },
  { name:'Pork Sausages', category:'protein', servingSize:100, servingUnit:'g', cal:319, pro:13, carb:7, fat:27, fib:0, sug:2, micros:{vitaminB1:0.5,vitaminB12:0.7,zinc:1.5,iron:0.8,sodium:720}, brandVariants:true },
  { name:'Bacon (Back)', category:'protein', servingSize:60, servingUnit:'g', cal:162, pro:14, carb:1, fat:11, fib:0, sug:0, micros:{vitaminB1:0.35,vitaminB12:0.5,zinc:1.2,selenium:14,sodium:1050}, brandVariants:true },
  { name:'Ham (Sliced)', category:'protein', servingSize:60, servingUnit:'g', cal:81, pro:10, carb:2, fat:3.5, fib:0, sug:1.5, micros:{vitaminB1:0.35,vitaminB12:0.4,zinc:0.9,selenium:12,sodium:800}, brandVariants:true },

  // DAIRY
  { name:'Cottage Cheese', category:'dairy', servingSize:113, servingUnit:'g', cal:110, pro:12, carb:6, fat:5, fib:0, sug:4, micros:{calcium:130,vitaminB12:0.5,phosphorus:160,selenium:11,iodine:30}, brandVariants:true },
  { name:'Cottage Cheese (Low Fat)', category:'dairy', servingSize:113, servingUnit:'g', cal:82, pro:14, carb:6, fat:1.5, fib:0, sug:4, micros:{calcium:140,vitaminB12:0.5,phosphorus:165,selenium:11,iodine:30}, brandVariants:true },
  { name:'Greek Yogurt (Plain Full Fat)', category:'dairy', servingSize:170, servingUnit:'g', cal:190, pro:17, carb:6, fat:10, fib:0, sug:5, micros:{calcium:200,vitaminB12:1.3,phosphorus:240,iodine:60}, brandVariants:true },
  { name:'Greek Yogurt (0% Fat)', category:'dairy', servingSize:170, servingUnit:'g', cal:100, pro:17, carb:6, fat:0.7, fib:0, sug:4, micros:{calcium:187,vitaminB12:1.3,phosphorus:229,iodine:50}, brandVariants:true },
  { name:'Natural Yogurt', category:'dairy', servingSize:150, servingUnit:'g', cal:86, pro:5, carb:10, fat:3, fib:0, sug:9, micros:{calcium:180,vitaminB2:0.18,phosphorus:155,iodine:50}, brandVariants:true },
  { name:'Skyr (Icelandic Yogurt)', category:'dairy', servingSize:150, servingUnit:'g', cal:84, pro:15, carb:5, fat:0.2, fib:0, sug:5, micros:{calcium:170,vitaminB12:1.0,phosphorus:220}, brandVariants:true },
  { name:'Cheddar Cheese', category:'dairy', servingSize:30, servingUnit:'g', cal:120, pro:7.4, carb:0.1, fat:10, fib:0, sug:0.1, micros:{calcium:216,vitaminA:75,vitaminB2:0.1,vitaminK:2.5,zinc:0.9,phosphorus:152}, brandVariants:true },
  { name:'Mozzarella (Fresh)', category:'dairy', servingSize:50, servingUnit:'g', cal:149, pro:11, carb:0.7, fat:11, fib:0, sug:0.7, micros:{calcium:215,vitaminA:85,phosphorus:152}, brandVariants:true },
  { name:'Feta Cheese', category:'dairy', servingSize:30, servingUnit:'g', cal:75, pro:4, carb:1.2, fat:6, fib:0, sug:1.2, micros:{calcium:140,vitaminB2:0.15,sodium:380,phosphorus:96}, brandVariants:true },
  { name:'Full Fat Milk', category:'dairy', servingSize:240, servingUnit:'ml', cal:149, pro:8, carb:12, fat:8, fib:0, sug:12, micros:{vitaminD:3.2,vitaminB12:1.1,calcium:276,phosphorus:205,vitaminB2:0.45,iodine:56}, brandVariants:true },
  { name:'Semi-Skimmed Milk', category:'dairy', servingSize:240, servingUnit:'ml', cal:108, pro:8, carb:12, fat:3.6, fib:0, sug:12, micros:{vitaminD:2.5,vitaminB12:0.9,calcium:260,phosphorus:190,iodine:55}, brandVariants:true },
  { name:'Skimmed Milk', category:'dairy', servingSize:240, servingUnit:'ml', cal:84, pro:8.3, carb:12, fat:0.5, fib:0, sug:12, micros:{vitaminD:2.2,vitaminB12:0.9,calcium:250,phosphorus:185,iodine:53}, brandVariants:true },
  { name:'Oat Milk', category:'dairy', servingSize:240, servingUnit:'ml', cal:130, pro:3, carb:24, fat:2.5, fib:1.5, sug:16, micros:{calcium:120,vitaminD:2,vitaminB12:0,vitaminB2:0.2}, brandVariants:true },
  { name:'Almond Milk (Unsweetened)', category:'dairy', servingSize:240, servingUnit:'ml', cal:35, pro:1.5, carb:2, fat:2.5, fib:0.5, sug:0, micros:{calcium:200,vitaminD:2.5,vitaminE:6.3}, brandVariants:true },
  { name:'Soy Milk (Unsweetened)', category:'dairy', servingSize:240, servingUnit:'ml', cal:80, pro:7, carb:4, fat:4, fib:0.5, sug:1, micros:{calcium:200,vitaminD:3,vitaminB12:1.2,vitaminB2:0.18}, brandVariants:true },
  { name:'Butter', category:'fats', servingSize:14, servingUnit:'g', cal:100, pro:0.1, carb:0, fat:11, fib:0, sug:0, micros:{vitaminA:97,vitaminD:0.5,vitaminE:0.3,vitaminK:0.7}, brandVariants:true },
  { name:'Cream Cheese', category:'dairy', servingSize:30, servingUnit:'g', cal:102, pro:1.8, carb:1, fat:10, fib:0, sug:0.9, micros:{vitaminA:72,calcium:35}, brandVariants:true },
  { name:'Sour Cream', category:'dairy', servingSize:30, servingUnit:'g', cal:56, pro:0.8, carb:1.6, fat:5.4, fib:0, sug:1.4, micros:{calcium:34,vitaminA:32}, brandVariants:true },
  { name:'Double Cream', category:'dairy', servingSize:30, servingUnit:'ml', cal:135, pro:0.6, carb:1, fat:14, fib:0, sug:0.9, micros:{vitaminA:120,vitaminD:0.7}, brandVariants:true },
  { name:'Creme Fraiche', category:'dairy', servingSize:30, servingUnit:'g', cal:114, pro:0.8, carb:1.6, fat:12, fib:0, sug:1.5, micros:{vitaminA:90,calcium:30}, brandVariants:true },
  { name:'Quark', category:'dairy', servingSize:150, servingUnit:'g', cal:89, pro:12, carb:7, fat:0.5, fib:0, sug:6, micros:{calcium:120,vitaminB12:0.6,phosphorus:180}, brandVariants:true },

  // EGGS
  { name:'Egg (Large)', category:'protein', servingSize:58, servingUnit:'g', cal:90, pro:7, carb:0.6, fat:6, fib:0, sug:0.6, micros:{vitaminB12:0.65,vitaminD:1.1,vitaminB2:0.23,selenium:15.4,vitaminA:80,vitaminB7:10,vitaminB5:0.7}, brandVariants:true },
  { name:'Egg White', category:'protein', servingSize:30, servingUnit:'g', cal:16, pro:3.6, carb:0.2, fat:0, fib:0, sug:0.2, micros:{vitaminB2:0.15,selenium:7} },
  { name:'Egg Yolk', category:'protein', servingSize:18, servingUnit:'g', cal:60, pro:2.7, carb:0.3, fat:5, fib:0, sug:0.3, micros:{vitaminD:1.4,vitaminA:65,vitaminB12:0.6,vitaminB7:9} },

  // PLANT PROTEINS
  { name:'Tofu (Firm)', category:'protein', servingSize:100, servingUnit:'g', cal:76, pro:8, carb:2, fat:4, fib:0.3, sug:0.5, micros:{calcium:350,iron:2,magnesium:30,zinc:0.8,manganese:0.6}, brandVariants:true },
  { name:'Tempeh', category:'protein', servingSize:100, servingUnit:'g', cal:193, pro:19, carb:9, fat:11, fib:0, sug:0, micros:{vitaminB2:0.36,vitaminB3:4.6,calcium:111,iron:2.7,magnesium:81,manganese:1.3,phosphorus:266,zinc:1.7}, brandVariants:true },
  { name:'Lentils (Red, Cooked)', category:'protein', servingSize:200, servingUnit:'g', cal:230, pro:18, carb:40, fat:0.8, fib:16, sug:3.6, micros:{vitaminB9:358,iron:6.6,vitaminB1:0.33,vitaminB6:0.35,phosphorus:356,potassium:731,manganese:1}, brandVariants:true },
  { name:'Chickpeas (Cooked)', category:'protein', servingSize:164, servingUnit:'g', cal:269, pro:15, carb:45, fat:4, fib:12.5, sug:8, micros:{iron:4.7,vitaminB9:282,phosphorus:276,zinc:2.5,copper:0.6,manganese:1.7}, brandVariants:true },
  { name:'Black Beans (Cooked)', category:'protein', servingSize:172, servingUnit:'g', cal:227, pro:15, carb:41, fat:0.9, fib:15, sug:0.6, micros:{iron:3.6,vitaminB9:256,vitaminB1:0.42,magnesium:120,phosphorus:241,potassium:611,manganese:0.8}, brandVariants:true },
  { name:'Kidney Beans (Cooked)', category:'protein', servingSize:177, servingUnit:'g', cal:225, pro:15, carb:40, fat:0.9, fib:11.3, sug:0.5, micros:{iron:3.9,vitaminB9:230,vitaminB1:0.28,magnesium:74,phosphorus:244,potassium:717,manganese:0.8,copper:0.4}, brandVariants:true },
  { name:'Edamame (Cooked)', category:'protein', servingSize:155, servingUnit:'g', cal:189, pro:17, carb:14, fat:8, fib:8, sug:3.4, micros:{iron:3.5,vitaminC:9.5,vitaminB9:482,calcium:98,magnesium:99,phosphorus:262,potassium:676,manganese:1.7}, brandVariants:true },

  // VEGETABLES
  { name:'Spinach (Raw)', category:'vegetables', servingSize:80, servingUnit:'g', cal:18, pro:2.3, carb:1.4, fat:0.4, fib:2.2, sug:0.4, micros:{vitaminA:353,vitaminK:363,vitaminB9:145,vitaminC:21,iron:2,magnesium:60,manganese:0.7,calcium:99}, brandVariants:true },
  { name:'Kale (Raw)', category:'vegetables', servingSize:67, servingUnit:'g', cal:33, pro:2.9, carb:6, fat:0.5, fib:1.3, sug:2.3, micros:{vitaminA:206,vitaminK:547,vitaminC:80,vitaminB9:19,calcium:91,manganese:0.54,copper:0.2,vitaminB6:0.18}, brandVariants:true },
  { name:'Broccoli (Cooked)', category:'vegetables', servingSize:156, servingUnit:'g', cal:55, pro:3.7, carb:11, fat:0.6, fib:5.1, sug:2.2, micros:{vitaminC:101,vitaminK:220,vitaminA:120,vitaminB9:168,potassium:457,chromium:22}, brandVariants:true },
  { name:'Carrots (Raw)', category:'vegetables', servingSize:128, servingUnit:'g', cal:52, pro:1.2, carb:12, fat:0.3, fib:3.6, sug:6, micros:{vitaminA:1069,vitaminK:16.9,vitaminC:7.6,potassium:410,vitaminB7:6.1}, brandVariants:true },
  { name:'Sweet Potato', category:'vegetables', servingSize:128, servingUnit:'g', cal:103, pro:2.3, carb:24, fat:0.1, fib:3.8, sug:7.4, micros:{vitaminA:1403,vitaminC:22.3,vitaminB6:0.3,potassium:438,manganese:0.3}, brandVariants:true },
  { name:'Bell Pepper (Red)', category:'vegetables', servingSize:119, servingUnit:'g', cal:37, pro:1.2, carb:7, fat:0.3, fib:2.5, sug:5, micros:{vitaminC:152,vitaminA:234,vitaminB6:0.29,vitaminB9:55,vitaminE:1.9,potassium:251}, brandVariants:true },
  { name:'Bell Pepper (Green)', category:'vegetables', servingSize:119, servingUnit:'g', cal:24, pro:1, carb:5.5, fat:0.2, fib:2, sug:2.9, micros:{vitaminC:95,vitaminA:18,vitaminB6:0.28,vitaminK:7.4,potassium:211} },
  { name:'Bell Pepper (Yellow)', category:'vegetables', servingSize:119, servingUnit:'g', cal:50, pro:1.9, carb:12, fat:0.2, fib:1.7, sug:6.7, micros:{vitaminC:183,vitaminA:18,vitaminB6:0.26,vitaminB9:48} },
  { name:'Courgette (Zucchini)', category:'vegetables', servingSize:124, servingUnit:'g', cal:21, pro:1.5, carb:4, fat:0.4, fib:1.1, sug:3, micros:{vitaminC:17,vitaminA:26,vitaminB6:0.15,vitaminB9:30,potassium:325,manganese:0.17} },
  { name:'Tomato (Fresh)', category:'vegetables', servingSize:123, servingUnit:'g', cal:22, pro:1.1, carb:4.8, fat:0.2, fib:1.5, sug:3.2, micros:{vitaminC:15,vitaminA:76,vitaminK:9.7,vitaminB9:18.5,potassium:292} },
  { name:'Cherry Tomatoes', category:'vegetables', servingSize:149, servingUnit:'g', cal:27, pro:1.3, carb:5.8, fat:0.3, fib:1.8, sug:3.9, micros:{vitaminC:21,vitaminA:90,vitaminK:11,potassium:353} },
  { name:'Cucumber', category:'vegetables', servingSize:119, servingUnit:'g', cal:16, pro:0.7, carb:3.6, fat:0.1, fib:0.5, sug:1.7, micros:{vitaminK:8.5,vitaminC:2.8,potassium:193} },
  { name:'Celery', category:'vegetables', servingSize:120, servingUnit:'g', cal:18, pro:0.8, carb:3.8, fat:0.2, fib:1.8, sug:1.8, micros:{vitaminK:29.6,vitaminA:27,vitaminC:3.1,potassium:286} },
  { name:'Asparagus', category:'vegetables', servingSize:134, servingUnit:'g', cal:27, pro:3, carb:5.2, fat:0.2, fib:2.8, sug:2.5, micros:{vitaminK:55.7,vitaminA:90,vitaminB9:70,vitaminC:7.5,iron:0.8,potassium:271} },
  { name:'Leek', category:'vegetables', servingSize:89, servingUnit:'g', cal:54, pro:1.3, carb:13, fat:0.3, fib:1.6, sug:3.5, micros:{vitaminA:47,vitaminK:31,vitaminC:10.4,vitaminB9:28,manganese:0.25} },
  { name:'Onion (Brown)', category:'vegetables', servingSize:110, servingUnit:'g', cal:44, pro:1.2, carb:10.3, fat:0.1, fib:1.9, sug:4.7, micros:{vitaminC:8,vitaminB9:20,vitaminB6:0.13,potassium:168,manganese:0.13} },
  { name:'Spring Onion', category:'vegetables', servingSize:100, servingUnit:'g', cal:32, pro:1.8, carb:7.3, fat:0.2, fib:2.6, sug:2.3, micros:{vitaminA:50,vitaminC:18.8,vitaminK:207,vitaminB9:64,calcium:72} },
  { name:'Garlic (Raw)', category:'vegetables', servingSize:9, servingUnit:'g', cal:13, pro:0.6, carb:3, fat:0.05, fib:0.2, sug:0.09, micros:{vitaminC:0.9,vitaminB6:0.11,manganese:0.15} },
  { name:'Ginger (Fresh)', category:'vegetables', servingSize:10, servingUnit:'g', cal:8, pro:0.18, carb:1.77, fat:0.08, fib:0.19, sug:0.17, micros:{vitaminB6:0.016,magnesium:10,manganese:0.05} },
  { name:'Mushrooms (Chestnut)', category:'vegetables', servingSize:100, servingUnit:'g', cal:22, pro:3, carb:3.3, fat:0.5, fib:1, sug:1.7, micros:{vitaminD:0.2,vitaminB3:4.5,vitaminB2:0.38,copper:0.5,selenium:9.3,phosphorus:86,potassium:448} },
  { name:'Mushrooms (Portobello)', category:'vegetables', servingSize:100, servingUnit:'g', cal:22, pro:2.2, carb:3.9, fat:0.3, fib:1.3, sug:2.5, micros:{vitaminD:0.3,vitaminB3:3.6,vitaminB2:0.3,copper:0.4,selenium:8} },
  { name:'Peas (Frozen)', category:'vegetables', servingSize:160, servingUnit:'g', cal:118, pro:8, carb:21, fat:0.5, fib:7.2, sug:6.8, micros:{vitaminC:38,vitaminA:54,vitaminK:36,vitaminB9:95,vitaminB1:0.3,iron:2.5,magnesium:38} },
  { name:'Sweetcorn (Canned)', category:'vegetables', servingSize:160, servingUnit:'g', cal:131, pro:4.9, carb:29, fat:2, fib:3.2, sug:5.7, micros:{vitaminC:7.2,vitaminB9:75,vitaminB3:3.1,magnesium:42,phosphorus:114,potassium:392} },
  { name:'Cabbage (Savoy)', category:'vegetables', servingSize:89, servingUnit:'g', cal:20, pro:1.3, carb:4.3, fat:0.1, fib:2.1, sug:2.5, micros:{vitaminC:22,vitaminK:57.5,vitaminB9:60,vitaminB6:0.17} },
  { name:'Brussels Sprouts', category:'vegetables', servingSize:156, servingUnit:'g', cal:56, pro:4, carb:11, fat:0.8, fib:4.1, sug:2.7, micros:{vitaminC:97,vitaminK:219,vitaminB9:93.5,vitaminA:60,potassium:494,manganese:0.33} },
  { name:'Cauliflower', category:'vegetables', servingSize:100, servingUnit:'g', cal:25, pro:1.9, carb:5, fat:0.3, fib:2, sug:1.9, micros:{vitaminC:48.2,vitaminB9:57,vitaminK:15.5,vitaminB6:0.18} },
  { name:'Aubergine (Eggplant)', category:'vegetables', servingSize:100, servingUnit:'g', cal:25, pro:1, carb:5.9, fat:0.2, fib:3, sug:3.5, micros:{vitaminB9:22,vitaminC:2.2,potassium:229,manganese:0.25} },
  { name:'Beetroot (Cooked)', category:'vegetables', servingSize:136, servingUnit:'g', cal:75, pro:2.9, carb:17, fat:0.2, fib:3.4, sug:13.5, micros:{vitaminB9:148,vitaminC:6.2,potassium:518,manganese:0.55,iron:1.1} },
  { name:'Parsnip (Roasted)', category:'vegetables', servingSize:160, servingUnit:'g', cal:142, pro:2.6, carb:34, fat:0.8, fib:6.4, sug:9.6, micros:{vitaminC:28.8,vitaminB9:92,vitaminK:37,potassium:760,manganese:0.7} },
  { name:'Butternut Squash', category:'vegetables', servingSize:205, servingUnit:'g', cal:82, pro:1.8, carb:21.5, fat:0.2, fib:6.6, sug:4, micros:{vitaminA:1144,vitaminC:31,vitaminE:2,potassium:582,magnesium:59,vitaminB6:0.25} },

  // FRUITS
  { name:'Banana', category:'fruits', servingSize:118, servingUnit:'g', cal:105, pro:1.3, carb:27, fat:0.4, fib:3.1, sug:14, micros:{vitaminB6:0.43,vitaminC:10.3,potassium:422,magnesium:32,manganese:0.32} },
  { name:'Apple (Gala)', category:'fruits', servingSize:182, servingUnit:'g', cal:95, pro:0.5, carb:25, fat:0.3, fib:4.4, sug:19, micros:{vitaminC:8.4,potassium:195,vitaminK:4} },
  { name:'Apple (Granny Smith)', category:'fruits', servingSize:182, servingUnit:'g', cal:87, pro:0.4, carb:23, fat:0.2, fib:3.7, sug:17, micros:{vitaminC:7.2,potassium:185,vitaminK:3.8} },
  { name:'Orange', category:'fruits', servingSize:131, servingUnit:'g', cal:62, pro:1.2, carb:15, fat:0.2, fib:3.1, sug:12, micros:{vitaminC:70,vitaminB9:40,potassium:237,calcium:52,vitaminB1:0.11} },
  { name:'Mandarin', category:'fruits', servingSize:84, servingUnit:'g', cal:47, pro:0.7, carb:12, fat:0.3, fib:1.6, sug:9.4, micros:{vitaminC:26,vitaminA:34,vitaminB9:14} },
  { name:'Grapefruit', category:'fruits', servingSize:154, servingUnit:'g', cal:64, pro:1.3, carb:16, fat:0.2, fib:2.2, sug:13.7, micros:{vitaminC:72,vitaminA:65,vitaminB9:22,potassium:311} },
  { name:'Strawberries', category:'fruits', servingSize:152, servingUnit:'g', cal:49, pro:1, carb:12, fat:0.5, fib:3, sug:7, micros:{vitaminC:89,manganese:0.6,vitaminB9:36,potassium:233} },
  { name:'Blueberries', category:'fruits', servingSize:148, servingUnit:'g', cal:84, pro:1.1, carb:21, fat:0.5, fib:3.6, sug:15, micros:{vitaminC:14.4,vitaminK:28.6,manganese:0.5,vitaminE:0.84} },
  { name:'Raspberries', category:'fruits', servingSize:123, servingUnit:'g', cal:64, pro:1.5, carb:15, fat:0.8, fib:8, sug:5.4, micros:{vitaminC:32,vitaminK:9.6,vitaminB9:26,manganese:0.8,copper:0.09} },
  { name:'Blackberries', category:'fruits', servingSize:144, servingUnit:'g', cal:62, pro:2, carb:14, fat:0.7, fib:7.6, sug:7, micros:{vitaminC:30.2,vitaminK:28.5,vitaminE:1.7,vitaminB9:36,manganese:0.9} },
  { name:'Avocado', category:'fruits', servingSize:100, servingUnit:'g', cal:160, pro:2, carb:9, fat:15, fib:7, sug:0.7, micros:{vitaminK:21,vitaminB9:81,vitaminB6:0.26,vitaminC:10,potassium:485,vitaminE:2.1,copper:0.19} },
  { name:'Mango', category:'fruits', servingSize:165, servingUnit:'g', cal:99, pro:1.4, carb:25, fat:0.6, fib:2.6, sug:23, micros:{vitaminC:60,vitaminA:89,vitaminB6:0.2,vitaminB9:71,potassium:277} },
  { name:'Pineapple', category:'fruits', servingSize:165, servingUnit:'g', cal:82, pro:0.9, carb:22, fat:0.2, fib:2.3, sug:16, micros:{vitaminC:78.9,manganese:1.5,vitaminB1:0.13,vitaminB6:0.18,potassium:180} },
  { name:'Watermelon', category:'fruits', servingSize:280, servingUnit:'g', cal:84, pro:1.7, carb:21, fat:0.4, fib:1.1, sug:17, micros:{vitaminC:23.2,vitaminA:43,vitaminB6:0.14,potassium:320} },
  { name:'Grapes (Red)', category:'fruits', servingSize:151, servingUnit:'g', cal:104, pro:1.1, carb:27, fat:0.2, fib:1.4, sug:23, micros:{vitaminC:16,vitaminK:22,vitaminB6:0.13,potassium:288,copper:0.19} },
  { name:'Peach', category:'fruits', servingSize:150, servingUnit:'g', cal:58, pro:1.4, carb:14, fat:0.4, fib:2.3, sug:13, micros:{vitaminC:9.9,vitaminA:28,vitaminB3:1.2,potassium:285} },
  { name:'Pear', category:'fruits', servingSize:178, servingUnit:'g', cal:101, pro:0.6, carb:27, fat:0.2, fib:5.5, sug:17, micros:{vitaminC:7.7,vitaminK:7.5,potassium:206,copper:0.13} },
  { name:'Kiwi', category:'fruits', servingSize:69, servingUnit:'g', cal:42, pro:0.8, carb:10, fat:0.4, fib:2.1, sug:6.2, micros:{vitaminC:64,vitaminK:27.8,vitaminE:1.1,vitaminB9:17.2,potassium:215} },
  { name:'Pomegranate', category:'fruits', servingSize:87, servingUnit:'g', cal:72, pro:1.5, carb:16.3, fat:1, fib:3.5, sug:11.3, micros:{vitaminC:10.2,vitaminK:16.4,vitaminB9:38,potassium:205,manganese:0.12} },
  { name:'Cherries', category:'fruits', servingSize:138, servingUnit:'g', cal:87, pro:1.5, carb:22, fat:0.3, fib:2.9, sug:17.7, micros:{vitaminC:10,vitaminA:18,potassium:306,copper:0.07} },
  { name:'Plum', category:'fruits', servingSize:66, servingUnit:'g', cal:30, pro:0.5, carb:7.5, fat:0.2, fib:0.9, sug:6.6, micros:{vitaminC:6.3,vitaminA:17,vitaminK:4.2,potassium:104} },
  { name:'Fig (Fresh)', category:'fruits', servingSize:50, servingUnit:'g', cal:37, pro:0.4, carb:9.6, fat:0.2, fib:1.5, sug:8.1, micros:{vitaminB6:0.06,calcium:18,potassium:116,manganese:0.06} },
  { name:'Dates (Medjool)', category:'fruits', servingSize:24, servingUnit:'g', cal:66, pro:0.4, carb:18, fat:0.1, fib:1.6, sug:16, micros:{vitaminB3:0.4,potassium:167,magnesium:13,manganese:0.06} },
  { name:'Lemon', category:'fruits', servingSize:29, servingUnit:'g', cal:8, pro:0.3, carb:2.6, fat:0.1, fib:0.8, sug:0.8, micros:{vitaminC:10.6,vitaminB6:0.04,vitaminB9:5} },

  // GRAINS & BREAD
  { name:'Brown Rice (Cooked)', category:'grains', servingSize:195, servingUnit:'g', cal:216, pro:5, carb:45, fat:1.8, fib:3.5, sug:0.7, micros:{manganese:1.8,magnesium:84,selenium:19,vitaminB3:3,vitaminB1:0.2,phosphorus:162} },
  { name:'White Rice (Cooked)', category:'grains', servingSize:186, servingUnit:'g', cal:242, pro:4.4, carb:53, fat:0.4, fib:0.6, sug:0, micros:{vitaminB3:1.7,selenium:11.3,manganese:0.7,phosphorus:68} },
  { name:'Basmati Rice (Cooked)', category:'grains', servingSize:195, servingUnit:'g', cal:194, pro:4, carb:43, fat:0.5, fib:0.7, sug:0, micros:{vitaminB1:0.15,selenium:8,manganese:0.5} },
  { name:'Oats (Rolled, Dry)', category:'grains', servingSize:40, servingUnit:'g', cal:152, pro:5.5, carb:26, fat:2.6, fib:3.6, sug:0.5, micros:{manganese:1.3,phosphorus:155,magnesium:44,iron:1.8,zinc:1.2,vitaminB1:0.22} },
  { name:'Porridge Oats (Cooked)', category:'grains', servingSize:250, servingUnit:'g', cal:150, pro:5.5, carb:26, fat:3, fib:3.8, sug:0.3, micros:{manganese:1.1,phosphorus:142,magnesium:40,iron:1.5,vitaminB1:0.2} },
  { name:'Wholemeal Bread', category:'grains', servingSize:40, servingUnit:'g', cal:86, pro:4, carb:15, fat:1.1, fib:2.4, sug:1.5, micros:{vitaminB1:0.12,vitaminB3:2,iron:1.4,selenium:12,manganese:0.8,zinc:0.7} },
  { name:'White Bread', category:'grains', servingSize:40, servingUnit:'g', cal:105, pro:3.6, carb:20, fat:1.1, fib:0.8, sug:2.5, micros:{vitaminB1:0.15,vitaminB3:1.8,iron:1.2,calcium:30,sodium:215} },
  { name:'Sourdough Bread', category:'grains', servingSize:45, servingUnit:'g', cal:115, pro:4, carb:22, fat:0.9, fib:1.5, sug:2, micros:{vitaminB1:0.12,iron:1.2,sodium:250,selenium:11} },
  { name:'Rye Bread', category:'grains', servingSize:30, servingUnit:'g', cal:65, pro:2.5, carb:12, fat:0.7, fib:2.1, sug:0.5, micros:{vitaminB1:0.1,iron:0.9,selenium:10,manganese:0.5} },
  { name:'Pita Bread (Wholemeal)', category:'grains', servingSize:64, servingUnit:'g', cal:165, pro:5.7, carb:33, fat:1.4, fib:2.6, sug:1.5, micros:{vitaminB1:0.22,vitaminB3:3,iron:2,selenium:21,manganese:0.7} },
  { name:'Pasta (Wholemeal, Cooked)', category:'grains', servingSize:140, servingUnit:'g', cal:175, pro:7, carb:35, fat:1.2, fib:5.6, sug:0.8, micros:{vitaminB3:2.5,vitaminB9:14,iron:2,magnesium:30,selenium:22,manganese:1.3} },
  { name:'Pasta (White, Cooked)', category:'grains', servingSize:140, servingUnit:'g', cal:221, pro:8, carb:43, fat:1.3, fib:2.5, sug:0.6, micros:{vitaminB3:1.9,vitaminB9:8,selenium:18,manganese:0.5} },
  { name:'Quinoa (Cooked)', category:'grains', servingSize:185, servingUnit:'g', cal:222, pro:8.1, carb:39, fat:3.5, fib:5, sug:1.6, micros:{manganese:1.2,phosphorus:281,magnesium:118,iron:2.8,zinc:2.0,copper:0.4,vitaminB9:78} },
  { name:'Couscous (Cooked)', category:'grains', servingSize:150, servingUnit:'g', cal:176, pro:6, carb:36, fat:0.3, fib:2.2, sug:0.2, micros:{vitaminB3:1.8,selenium:43,manganese:0.5,vitaminB1:0.1} },
  { name:'Bulgur Wheat (Cooked)', category:'grains', servingSize:182, servingUnit:'g', cal:151, pro:5.6, carb:34, fat:0.4, fib:8.2, sug:0.2, micros:{vitaminB3:1.8,vitaminB9:32,manganese:1.1,iron:1.7,magnesium:58} },
  { name:'Buckwheat (Cooked)', category:'grains', servingSize:168, servingUnit:'g', cal:155, pro:5.7, carb:34, fat:1, fib:4.5, sug:1.5, micros:{manganese:0.67,magnesium:86,phosphorus:118,copper:0.26} },
  { name:'Cornflakes', category:'grains', servingSize:30, servingUnit:'g', cal:111, pro:2, carb:26, fat:0.2, fib:0.9, sug:3, micros:{vitaminD:1.7,vitaminB12:0.8,iron:3.6,vitaminB1:0.36,vitaminB3:5,vitaminB6:0.5} },
  { name:'Bran Flakes', category:'grains', servingSize:30, servingUnit:'g', cal:95, pro:3, carb:20, fat:0.9, fib:4.5, sug:6.3, micros:{vitaminD:1.5,vitaminB12:0.75,iron:4.7,vitaminB1:0.35,vitaminB3:5.8,vitaminB9:100} },
  { name:'Granola', category:'grains', servingSize:50, servingUnit:'g', cal:210, pro:4.5, carb:33, fat:7, fib:3, sug:9, micros:{iron:1.8,manganese:1.2,magnesium:40,phosphorus:120} },
  { name:'Muesli (No Added Sugar)', category:'grains', servingSize:45, servingUnit:'g', cal:152, pro:4.9, carb:27, fat:3.1, fib:3.8, sug:9.2, micros:{iron:1.9,manganese:1.4,vitaminE:1.5,zinc:1.2,vitaminB1:0.2} },

  // NUTS & SEEDS
  { name:'Almonds', category:'fats', servingSize:28, servingUnit:'g', cal:164, pro:6, carb:6, fat:14, fib:3.5, sug:1.2, micros:{vitaminE:7.3,magnesium:76,manganese:0.6,vitaminB2:0.29,phosphorus:136,copper:0.3} },
  { name:'Walnuts', category:'fats', servingSize:28, servingUnit:'g', cal:185, pro:4.3, carb:3.9, fat:18.5, fib:1.9, sug:0.7, micros:{vitaminB6:0.15,vitaminB9:28,copper:0.45,manganese:0.96,phosphorus:98,magnesium:45} },
  { name:'Cashews', category:'fats', servingSize:28, servingUnit:'g', cal:157, pro:5.2, carb:9.2, fat:12.4, fib:0.9, sug:1.7, micros:{vitaminK:9.7,iron:1.9,magnesium:83,zinc:1.6,copper:0.62,selenium:3} },
  { name:'Brazil Nuts', category:'fats', servingSize:28, servingUnit:'g', cal:187, pro:4.1, carb:3.4, fat:19, fib:2.1, sug:0.7, micros:{selenium:544,magnesium:107,zinc:1.2,copper:0.5,phosphorus:206} },
  { name:'Peanuts', category:'fats', servingSize:28, servingUnit:'g', cal:161, pro:7.3, carb:4.6, fat:14, fib:2.4, sug:1.1, micros:{vitaminB3:3.8,vitaminB9:41,vitaminE:2.4,magnesium:48,phosphorus:107,zinc:0.9,copper:0.36} },
  { name:'Pumpkin Seeds', category:'fats', servingSize:28, servingUnit:'g', cal:151, pro:7, carb:5, fat:13, fib:1.7, sug:0.3, micros:{iron:2.7,zinc:2.2,magnesium:168,phosphorus:236,copper:0.4,manganese:0.85,vitaminK:1.6} },
  { name:'Sunflower Seeds', category:'fats', servingSize:28, servingUnit:'g', cal:165, pro:5.5, carb:5.5, fat:14, fib:2.4, sug:0.8, micros:{vitaminE:7.4,selenium:22.5,vitaminB1:0.55,copper:0.52,zinc:1.5,magnesium:91,phosphorus:195} },
  { name:'Flaxseeds (Ground)', category:'fats', servingSize:14, servingUnit:'g', cal:75, pro:2.6, carb:4, fat:6, fib:3.8, sug:0.2, micros:{vitaminB1:0.2,manganese:0.38,magnesium:39,phosphorus:84} },
  { name:'Chia Seeds', category:'fats', servingSize:28, servingUnit:'g', cal:138, pro:4.7, carb:12, fat:8.7, fib:9.8, sug:0, micros:{calcium:177,iron:2.2,magnesium:95,phosphorus:244,zinc:1,manganese:0.8,vitaminB3:2.5} },
  { name:'Peanut Butter (Smooth)', category:'fats', servingSize:32, servingUnit:'g', cal:191, pro:7.8, carb:7, fat:16, fib:1.5, sug:3, micros:{vitaminE:1.9,vitaminB3:3.7,magnesium:51,phosphorus:107,zinc:0.9,copper:0.17}, brandVariants:true },
  { name:'Almond Butter', category:'fats', servingSize:32, servingUnit:'g', cal:196, pro:6.7, carb:6, fat:18, fib:1.6, sug:1.5, micros:{vitaminE:7.7,magnesium:90,calcium:111,vitaminB2:0.21,phosphorus:164}, brandVariants:true },

  // FATS & OILS
  { name:'Olive Oil', category:'fats', servingSize:14, servingUnit:'ml', cal:119, pro:0, carb:0, fat:13.5, fib:0, sug:0, micros:{vitaminE:1.9,vitaminK:8.1} },
  { name:'Coconut Oil', category:'fats', servingSize:14, servingUnit:'ml', cal:121, pro:0, carb:0, fat:14, fib:0, sug:0, micros:{vitaminE:0.01} },
  { name:'Avocado Oil', category:'fats', servingSize:14, servingUnit:'ml', cal:124, pro:0, carb:0, fat:14, fib:0, sug:0, micros:{vitaminE:1.8,vitaminK:5.5} },
  { name:'Rapeseed Oil', category:'fats', servingSize:14, servingUnit:'ml', cal:124, pro:0, carb:0, fat:14, fib:0, sug:0, micros:{vitaminE:2.7,vitaminK:10,vitaminD:0} },

  // DRESSINGS & CONDIMENTS
  { name:'Caesar Dressing', category:'fats', servingSize:30, servingUnit:'ml', cal:79, pro:0.7, carb:1.5, fat:8, fib:0, sug:0.5, micros:{sodium:190,calcium:15,vitaminA:10}, brandVariants:true },
  { name:'Balsamic Vinaigrette', category:'fats', servingSize:30, servingUnit:'ml', cal:72, pro:0.2, carb:4.5, fat:6, fib:0, sug:3.8, micros:{sodium:120,iron:0.3}, brandVariants:true },
  { name:'Ranch Dressing', category:'fats', servingSize:30, servingUnit:'ml', cal:73, pro:0.4, carb:1.5, fat:7.5, fib:0, sug:1.1, micros:{sodium:220,calcium:10,vitaminA:15}, brandVariants:true },
  { name:'Honey Mustard Dressing', category:'fats', servingSize:30, servingUnit:'ml', cal:68, pro:0.3, carb:8, fat:3.5, fib:0, sug:6.5, micros:{sodium:175}, brandVariants:true },
  { name:'Thousand Island Dressing', category:'fats', servingSize:30, servingUnit:'ml', cal:60, pro:0.3, carb:5.5, fat:4, fib:0.2, sug:4.2, micros:{sodium:180}, brandVariants:true },
  { name:'French Dressing', category:'fats', servingSize:30, servingUnit:'ml', cal:90, pro:0.1, carb:3.5, fat:8.5, fib:0, sug:3, micros:{sodium:230}, brandVariants:true },
  { name:'Italian Dressing', category:'fats', servingSize:30, servingUnit:'ml', cal:45, pro:0.1, carb:2.5, fat:4, fib:0, sug:1.5, micros:{sodium:245}, brandVariants:true },
  { name:'Blue Cheese Dressing', category:'fats', servingSize:30, servingUnit:'ml', cal:77, pro:1.5, carb:1.2, fat:7.5, fib:0, sug:0.9, micros:{calcium:30,sodium:300}, brandVariants:true },
  { name:'Olive Oil & Lemon Dressing', category:'fats', servingSize:30, servingUnit:'ml', cal:90, pro:0.1, carb:1.5, fat:9.5, fib:0, sug:0.8, micros:{vitaminC:5,vitaminE:1.5}, brandVariants:true },
  { name:'Vinaigrette (Classic)', category:'fats', servingSize:30, servingUnit:'ml', cal:79, pro:0.1, carb:2, fat:8, fib:0, sug:1.5, micros:{sodium:200}, brandVariants:true },
  { name:'Mayonnaise', category:'fats', servingSize:14, servingUnit:'g', cal:95, pro:0.1, carb:0.3, fat:10.4, fib:0, sug:0.1, micros:{vitaminE:0.4,vitaminK:5}, brandVariants:true },
  { name:'Light Mayonnaise', category:'fats', servingSize:14, servingUnit:'g', cal:35, pro:0.3, carb:2.6, fat:2.5, fib:0, sug:2, micros:{vitaminE:0.2}, brandVariants:true },
  { name:'Tomato Ketchup', category:'snacks', servingSize:17, servingUnit:'g', cal:20, pro:0.2, carb:4.8, fat:0, fib:0.2, sug:4, micros:{vitaminA:9,vitaminC:2,sodium:177}, brandVariants:true },
  { name:'Brown Sauce', category:'snacks', servingSize:17, servingUnit:'g', cal:20, pro:0.2, carb:4.8, fat:0.1, fib:0.2, sug:3.5, micros:{sodium:225}, brandVariants:true },
  { name:'Mustard (Dijon)', category:'snacks', servingSize:5, servingUnit:'g', cal:5, pro:0.4, carb:0.3, fat:0.3, fib:0.3, sug:0.1, micros:{sodium:120,selenium:1} },
  { name:'Hummus', category:'protein', servingSize:60, servingUnit:'g', cal:140, pro:5, carb:11, fat:9, fib:4.5, sug:0.5, micros:{iron:1.9,vitaminB9:70,copper:0.2,manganese:0.4,magnesium:28}, brandVariants:true },
  { name:'Guacamole', category:'fats', servingSize:60, servingUnit:'g', cal:72, pro:0.9, carb:4.2, fat:6.6, fib:3, sug:0.3, micros:{vitaminK:13,vitaminB9:47,vitaminC:6,potassium:291}, brandVariants:true },

  // SNACKS & PROCESSED FOODS
  { name:'Crisps (Ready Salted)', category:'snacks', servingSize:25, servingUnit:'g', cal:130, pro:1.7, carb:14, fat:7.5, fib:1, sug:0.2, micros:{vitaminB3:1,sodium:280}, brandVariants:true },
  { name:'Rice Cakes', category:'snacks', servingSize:15, servingUnit:'g', cal:58, pro:1.2, carb:12, fat:0.4, fib:0.5, sug:0, micros:{selenium:4,manganese:0.3}, brandVariants:true },
  { name:'Protein Bar', category:'snacks', servingSize:60, servingUnit:'g', cal:230, pro:20, carb:22, fat:7, fib:4, sug:8, micros:{calcium:200,iron:2.5,vitaminD:2,vitaminB12:0.8}, brandVariants:true },
  { name:'Granola Bar', category:'snacks', servingSize:42, servingUnit:'g', cal:190, pro:4, carb:28, fat:7, fib:2, sug:12, micros:{iron:1.4,vitaminE:1.5,vitaminB1:0.2}, brandVariants:true },
  { name:'Dark Chocolate (70%)', category:'snacks', servingSize:28, servingUnit:'g', cal:163, pro:2.2, carb:14, fat:12, fib:3, sug:8, micros:{iron:3.4,magnesium:64,copper:0.5,manganese:0.5,zinc:0.9} },
  { name:'Milk Chocolate', category:'snacks', servingSize:28, servingUnit:'g', cal:148, pro:2.2, carb:18, fat:8, fib:0.7, sug:16, micros:{calcium:54,iron:0.8,vitaminA:15,vitaminB2:0.09,zinc:0.4} },
  { name:'Popcorn (Salted)', category:'snacks', servingSize:28, servingUnit:'g', cal:110, pro:3, carb:21, fat:1.5, fib:3.6, sug:0.1, micros:{vitaminB3:0.9,iron:0.9,manganese:0.15,phosphorus:70} },

  // BEVERAGES
  { name:'Green Tea', category:'beverages', servingSize:240, servingUnit:'ml', cal:2, pro:0, carb:0, fat:0, fib:0, sug:0, micros:{manganese:0.5} },
  { name:'Black Tea', category:'beverages', servingSize:240, servingUnit:'ml', cal:2, pro:0, carb:0.7, fat:0, fib:0, sug:0, micros:{manganese:0.4,potassium:88} },
  { name:'Black Coffee', category:'beverages', servingSize:240, servingUnit:'ml', cal:5, pro:0.3, carb:0, fat:0, fib:0, sug:0, micros:{vitaminB3:0.5,magnesium:7,potassium:116,manganese:0.07} },
  { name:'Orange Juice (Fresh)', category:'beverages', servingSize:240, servingUnit:'ml', cal:112, pro:1.7, carb:26, fat:0.5, fib:0.5, sug:21, micros:{vitaminC:124,vitaminB9:74,potassium:496,vitaminB1:0.22,calcium:22} },
  { name:'Protein Shake (Whey)', category:'beverages', servingSize:300, servingUnit:'ml', cal:150, pro:25, carb:8, fat:3, fib:0, sug:5, micros:{calcium:200,vitaminD:2,vitaminB12:0.9,iron:1.5,phosphorus:200}, brandVariants:true },

  // PREPARED / READY MEALS
  { name:'Chicken Tikka Masala', category:'prepared', servingSize:300, servingUnit:'g', cal:390, pro:22, carb:30, fat:19, fib:3, sug:8, micros:{vitaminA:80,vitaminC:15,iron:3.5,sodium:800,potassium:580}, brandVariants:true },
  { name:'Beef Lasagne', category:'prepared', servingSize:350, servingUnit:'g', cal:420, pro:22, carb:40, fat:17, fib:3, sug:5, micros:{calcium:250,iron:3,vitaminB12:1.2,sodium:780}, brandVariants:true },
  { name:'Vegetable Stir Fry', category:'prepared', servingSize:300, servingUnit:'g', cal:180, pro:8, carb:22, fat:6, fib:5, sug:8, micros:{vitaminA:210,vitaminC:55,iron:2,sodium:650}, brandVariants:true },
  { name:'Spaghetti Bolognese', category:'prepared', servingSize:350, servingUnit:'g', cal:385, pro:20, carb:45, fat:12, fib:4, sug:7, micros:{iron:3.5,vitaminB12:1,calcium:80,sodium:620}, brandVariants:true },
  { name:'Fish & Chips', category:'prepared', servingSize:350, servingUnit:'g', cal:560, pro:25, carb:62, fat:23, fib:5, sug:1, micros:{vitaminD:3.2,vitaminB12:1.5,phosphorus:350,iodine:80,sodium:750} },
];

type MicroKeys = keyof typeof e0;
type FoodRow = typeof e0 & {
  name: string; brand?: string; servingSize: number; servingUnit: string;
  category: string; calories: number; protein: number; carbohydrates: number;
  fat: number; fiber: number; sugar: number;
};

function buildFoodRow(t: FoodTemplate, brand?: string, variant?: string): FoodRow {
  const brandStr = brand && variant ? `${brand} ${variant}` : brand;
  const nameParts = [brandStr, t.name].filter(Boolean);
  const name = nameParts.join(' ');

  // Apply slight variance for brand variants
  const factor = brand ? (0.92 + Math.random() * 0.16) : 1;

  return {
    name,
    brand: brand || undefined,
    servingSize: t.servingSize,
    servingUnit: t.servingUnit,
    category: t.category,
    calories: Math.round(t.cal * factor),
    protein: Math.round(t.pro * factor * 10) / 10,
    carbohydrates: Math.round(t.carb * factor * 10) / 10,
    fat: Math.round(t.fat * factor * 10) / 10,
    fiber: Math.round(t.fib * factor * 10) / 10,
    sugar: Math.round(t.sug * factor * 10) / 10,
    ...e0,
    ...(t.micros ? Object.fromEntries(
      Object.entries(t.micros)
        .filter(([k]) => k in e0)
        .map(([k, v]) => [k, Math.round((v as number) * factor * 100) / 100])
    ) : {}),
  };
}

async function seedComprehensive() {
  console.log('🌱 Starting comprehensive food database seeding...');

  const allFoods: FoodRow[] = [];

  for (const template of FOOD_TEMPLATES) {
    // Generic version
    allFoods.push(buildFoodRow(template));

    if (template.brandVariants) {
      // Per brand
      for (const brand of UK_BRANDS) {
        allFoods.push(buildFoodRow(template, brand));

        // Variants for this brand
        const variantsToUse = ['Light','Extra','Value','Organic'];
        for (const variant of variantsToUse) {
          allFoods.push(buildFoodRow(template, brand, variant));
        }
      }

      // Additional UK supermarket-specific variants
      const premiumBrands = ['Waitrose Essential','M&S Select','Tesco Finest','Sainsbury\'s Taste the Difference'];
      for (const brand of premiumBrands) {
        allFoods.push(buildFoodRow(template, brand));
      }
    }
  }

  console.log(`📊 Generated ${allFoods.length} food items`);
  console.log('💾 Inserting into database (this may take a while)...');

  let created = 0;
  let skipped = 0;
  const BATCH_SIZE = 100;

  for (let i = 0; i < allFoods.length; i += BATCH_SIZE) {
    const batch = allFoods.slice(i, i + BATCH_SIZE);
    for (const food of batch) {
      try {
        await db.food.create({ data: food as any });
        created++;
      } catch (err: any) {
        if (err.code === 'P2002') {
          skipped++;
        }
      }
    }
    if (i % 1000 === 0) {
      console.log(`  Progress: ${i}/${allFoods.length} (${created} created, ${skipped} skipped)`);
    }
  }

  const total = await db.food.count();
  console.log(`\n✅ Seeding complete!`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped (duplicates): ${skipped}`);
  console.log(`   Total foods in DB: ${total}`);
}

seedComprehensive()
  .catch((err) => { console.error('Seeding failed:', err); process.exit(1); })
  .finally(() => process.exit(0));
