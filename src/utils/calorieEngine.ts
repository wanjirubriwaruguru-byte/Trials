import { UserProfile, CalorieCalculation, FoodMacroReference, ActivityLevel, DeficitLevel } from '../types';

/**
 * Calculates BMI and category
 */
export function calculateBMI(weightKg: number, heightCm: number): { bmi: number; category: string } {
  if (heightCm <= 0 || weightKg <= 0) return { bmi: 0, category: 'N/A' };
  const heightM = heightCm / 100;
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));
  let category = 'Normal';
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25) category = 'Normal';
  else if (bmi < 30) category = 'Overweight';
  else category = 'Obese';
  return { bmi, category };
}

/**
 * Mifflin-St Jeor formula for BMR (Basal Metabolic Rate)
 * Men: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
 * Women: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
 */
export function calculateBMR(profile: Pick<UserProfile, 'currentWeightKg' | 'heightCm' | 'age' | 'sex'> | { currentWeightKg: number; heightCm: number; age: number; sex: 'female' | 'male' | 'other' }): number {
  const weight = profile.currentWeightKg;
  const { heightCm, age, sex } = profile;
  if (!weight || !heightCm || !age) return 1600;

  let base = 10 * weight + 6.25 * heightCm - 5 * age;
  if (sex === 'male') {
    base += 5;
  } else if (sex === 'female') {
    base -= 161;
  } else {
    base -= 78; // average offset for other/unspecified
  }
  return Math.round(base);
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

const DEFICIT_PERCENTAGES: Record<DeficitLevel, number> = {
  aggressive: -0.25, // 25% deficit
  moderate: -0.20,   // 20% deficit
  mild: -0.15,       // 15% deficit
  maintenance: 0,    // 0%
  lean_bulk: 0.10    // 10% surplus
};

/**
 * Full Calorie & Macro Engine
 */
export function calculateCalorieTargets(profile: UserProfile): CalorieCalculation {
  const { currentWeightKg, goalWeightKg, heightCm, age, sex, activityLevel, deficitGoal } = profile;
  const { bmi, category: bmiCategory } = calculateBMI(currentWeightKg, heightCm);
  const bmr = calculateBMR(profile);

  const actMultiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.4;
  const tdee = Math.round(bmr * actMultiplier);

  const deficitRatio = DEFICIT_PERCENTAGES[deficitGoal] ?? -0.20;
  let calorieTarget = Math.round(tdee * (1 + deficitRatio));

  // Safe floor for calories (1200 for females, 1500 for males)
  const safeFloor = sex === 'female' ? 1200 : 1450;
  if (calorieTarget < safeFloor && deficitGoal !== 'maintenance' && deficitGoal !== 'lean_bulk') {
    calorieTarget = safeFloor;
  }

  const deficitKcal = tdee - calorieTarget;

  // Macronutrient calculation:
  // High protein for body transformation: ~2.0g per kg of bodyweight
  const proteinGrams = Math.round(Math.min(currentWeightKg * 2.0, calorieTarget * 0.35 / 4));
  const proteinKcal = proteinGrams * 4;

  // Healthy Fats: 25-30% of total calories
  const fatsKcal = Math.round(calorieTarget * 0.25);
  const fatsGrams = Math.round(fatsKcal / 9);

  // Remaining calories to Carbs
  const carbsKcal = Math.max(0, calorieTarget - proteinKcal - fatsKcal);
  const carbsGrams = Math.round(carbsKcal / 4);

  // Fiber target: ~14g per 1000 kcal
  const fiberGrams = Math.round((calorieTarget / 1000) * 14);

  // Projections:
  // 1 kg of fat ~= 7700 kcal
  // Weekly deficit = deficitKcal * 7
  let weeklyLossKg = 0;
  let weeksToGoal = 0;
  let projectedGoalDate = 'N/A';

  if (deficitKcal > 0) {
    const weeklyDeficit = deficitKcal * 7;
    weeklyLossKg = Number((weeklyDeficit / 7700).toFixed(2));
    const totalToLose = Math.max(0, currentWeightKg - goalWeightKg);
    if (totalToLose > 0 && weeklyLossKg > 0) {
      weeksToGoal = Math.ceil(totalToLose / weeklyLossKg);
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + weeksToGoal * 7);
      projectedGoalDate = targetDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  } else if (deficitKcal < 0) {
    // Surplus / Lean bulk
    const weeklySurplus = Math.abs(deficitKcal) * 7;
    weeklyLossKg = Number((weeklySurplus / 7700).toFixed(2)); // gain rate
    const totalToGain = Math.max(0, goalWeightKg - currentWeightKg);
    if (totalToGain > 0 && weeklyLossKg > 0) {
      weeksToGoal = Math.ceil(totalToGain / weeklyLossKg);
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + weeksToGoal * 7);
      projectedGoalDate = targetDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  }

  return {
    bmi,
    bmiCategory,
    bmr,
    tdee,
    calorieTarget,
    deficitKcal,
    macros: {
      proteinGrams,
      proteinKcal,
      carbsGrams,
      carbsKcal,
      fatsGrams,
      fatsKcal,
      fiberGrams
    },
    weeklyLossKg,
    weeksToGoal,
    projectedGoalDate
  };
}

/**
 * Curated Nutritional Macro Reference Library
 * All items requested by the user, providing clean educational macro benchmarks.
 */
export const FOOD_DATABASE_REFERENCE: FoodMacroReference[] = [
  // Grains & Roots
  { name: 'Ugali (White Maize)', category: 'Grains & Roots', serving: '1 medium slice (150g)', calories: 240, protein: 5.5, carbs: 51, fat: 1.5, fiber: 4.2, notes: 'Staple Kenyan energy source; combine with dark leafy greens for balanced glycemic index.' },
  { name: 'Unga (Maize Flour)', category: 'Grains & Roots', serving: '100g dry', calories: 362, protein: 8.1, carbs: 76.9, fat: 2.1, fiber: 7.3, notes: 'Whole maize or sifted; rich in carbohydrates.' },
  { name: 'Brown / White Rice', category: 'Grains & Roots', serving: '1 cup cooked (160g)', calories: 215, protein: 4.5, carbs: 45, fat: 1.6, fiber: 3.5, notes: 'Easily digestible carbohydrate source for pre/post workout glycogen.' },
  { name: 'Chapati (Kenyan Style)', category: 'Grains & Roots', serving: '1 piece (80g)', calories: 230, protein: 5, carbs: 32, fat: 9, fiber: 2.5, notes: 'Pan-fried layered flatbread made with wheat flour and oil.' },
  { name: 'Mandazi', category: 'Grains & Roots', serving: '1 medium piece (60g)', calories: 210, protein: 4, carbs: 29, fat: 8.5, fiber: 1.2, notes: 'East African fried cardamom pastry; enjoy mindfully during transformation.' },
  { name: 'Arrowroots (Nduma)', category: 'Grains & Roots', serving: '1 piece boiled (140g)', calories: 155, protein: 2.8, carbs: 37, fat: 0.3, fiber: 5.8, notes: 'Complex low-GI carbohydrate, high potassium and dietary fiber.' },
  { name: 'Cassava (Mhogo)', category: 'Grains & Roots', serving: '1 cup boiled (150g)', calories: 240, protein: 2.1, carbs: 58, fat: 0.4, fiber: 2.7, notes: 'Sustained energy root, virtually fat-free.' },
  { name: 'Sweet Potatoes (Viazi Tamu)', category: 'Grains & Roots', serving: '1 medium boiled (130g)', calories: 112, protein: 2, carbs: 26, fat: 0.1, fiber: 3.9, notes: 'Rich in beta-carotene, Vitamin A, and slow-digesting starches.' },
  { name: 'Irish Potatoes (Viazi)', category: 'Grains & Roots', serving: '1 medium boiled (150g)', calories: 130, protein: 3, carbs: 30, fat: 0.2, fiber: 2.4, notes: 'Highest satiety index of any carbohydrate source.' },
  { name: 'Matoke (Cooked Green Bananas)', category: 'Grains & Roots', serving: '1 cup mashed/stewed (180g)', calories: 165, protein: 2, carbs: 41, fat: 0.5, fiber: 4.8, notes: 'High in prebiotic resistant starch, promoting gut microbiome health.' },
  { name: 'Boiled Maize', category: 'Grains & Roots', serving: '1 cob (150g)', calories: 160, protein: 5, carbs: 34, fat: 2.2, fiber: 4.5, notes: 'Nutrient-dense whole-grain snack high in lutein and fiber.' },
  { name: 'Roasted Maize', category: 'Grains & Roots', serving: '1 cob (140g)', calories: 175, protein: 5.4, carbs: 36, fat: 2.5, fiber: 5.1, notes: 'Charcoal-roasted Kenyan street staple; hearty chew and zero added oils.' },
  { name: 'Bread (Whole Wheat / White)', category: 'Grains & Roots', serving: '2 slices (60g)', calories: 150, protein: 6, carbs: 28, fat: 1.8, fiber: 3.8, notes: 'Convenient breakfast staple; opt for whole meal for added satiety.' },

  // Legumes
  { name: 'Githeri (Maize & Beans Mix)', category: 'Legumes', serving: '1 deep bowl (250g)', calories: 310, protein: 14.5, carbs: 55, fat: 3.2, fiber: 12.8, notes: 'Complete plant protein profile when maize is paired with kidney beans.' },
  { name: 'Mukimo (Maize, Beans, Potatoes, Greens)', category: 'Legumes', serving: '1 cup (220g)', calories: 290, protein: 11, carbs: 52, fat: 3.8, fiber: 9.5, notes: 'Central Kenya power mash packed with micronutrients and plant protein.' },
  { name: 'Irio', category: 'Legumes', serving: '1 cup (200g)', calories: 275, protein: 10, carbs: 50, fat: 3.1, fiber: 8.6, notes: 'Mashed potatoes with green peas and sweet corn; sustained complex fuel.' },
  { name: 'Yellow / Red Beans Stew', category: 'Legumes', serving: '1 cup cooked (180g)', calories: 220, protein: 15, carbs: 39, fat: 1, fiber: 14, notes: 'Exceptional protein and soluble fiber powerhouse for heart health.' },
  { name: 'Ndengu (Green Grams / Mung Beans)', category: 'Legumes', serving: '1 cup cooked (180g)', calories: 212, protein: 14.2, carbs: 38, fat: 0.8, fiber: 15.4, notes: 'Easy to digest, rich in folate, magnesium, and plant-based amino acids.' },
  { name: 'Lentils (Kamande)', category: 'Legumes', serving: '1 cup cooked (190g)', calories: 230, protein: 18, carbs: 40, fat: 0.8, fiber: 15.6, notes: 'Highest protein density among legumes; fast cooking.' },
  { name: 'Green Peas (Minji)', category: 'Legumes', serving: '1 cup cooked (160g)', calories: 134, protein: 8.6, carbs: 25, fat: 0.4, fiber: 8.8, notes: 'Sweet, low-calorie legume rich in Vitamin C, zinc, and antioxidants.' },
  { name: 'Groundnuts (Peanuts / Njugu)', category: 'Legumes', serving: '1 handful (35g)', calories: 200, protein: 9, carbs: 6, fat: 17, fiber: 3, notes: 'Healthy monounsaturated fats and arginine for muscle pump.' },

  // Vegetables
  { name: 'Sukuma Wiki (Collard Greens)', category: 'Vegetables', serving: '1 cup braised (130g)', calories: 55, protein: 3.5, carbs: 7, fat: 1.5, fiber: 4.8, notes: 'The ultimate Kenyan superfood, rich in calcium, Vitamin K, and lutein.' },
  { name: 'Managu (African Nightshade)', category: 'Vegetables', serving: '1 cup cooked (120g)', calories: 48, protein: 4.2, carbs: 6, fat: 1.2, fiber: 4.1, notes: 'Traditional indigenous vegetable; extraordinary iron and phenolic content.' },
  { name: 'Spinach', category: 'Vegetables', serving: '1 cup cooked (180g)', calories: 42, protein: 5.3, carbs: 6.8, fat: 0.5, fiber: 4.3, notes: 'High nitrates for endurance, magnesium for muscular recovery.' },
  { name: 'Kales (Tuscan / Curly)', category: 'Vegetables', serving: '1 cup steamed (120g)', calories: 40, protein: 3, carbs: 6, fat: 0.6, fiber: 3.6, notes: 'Dense cruciferous antioxidant profile with glucosinolates.' },
  { name: 'Cabbage (Sautéed)', category: 'Vegetables', serving: '1 cup (110g)', calories: 45, protein: 1.8, carbs: 8, fat: 1.2, fiber: 2.8, notes: 'Crunchy low-calorie volume builder for effortless caloric deficits.' },
  { name: 'Eggplant (Biringanya)', category: 'Vegetables', serving: '1 cup stewed (150g)', calories: 40, protein: 1.2, carbs: 9, fat: 0.2, fiber: 3.5, notes: 'Rich in nasunin anthocyanins; sponge-like texture ideal in curries.' },

  // Proteins & Meat
  { name: 'Tilapia Fish (Fried / Stewed)', category: 'Proteins & Meat', serving: '1 whole medium / fillet (180g)', calories: 230, protein: 36, carbs: 0, fat: 7.5, fiber: 0, notes: 'Lake Victoria delicacy; lean complete protein high in selenium and B12.' },
  { name: 'Nile Perch (Mbuta)', category: 'Proteins & Meat', serving: '1 steak (180g)', calories: 260, protein: 34, carbs: 0, fat: 11, fiber: 0, notes: 'Flavorful fresh-water fish packed with anti-inflammatory omega-3 fats.' },
  { name: 'Omena (Silver Cyprinid / Dagaa)', category: 'Proteins & Meat', serving: '1 cup cooked (100g)', calories: 195, protein: 32, carbs: 0, fat: 6.8, fiber: 0, notes: 'Superfood eaten whole with bones for immense bioavailable calcium and omega-3.' },
  { name: 'Chicken Breast (Kienyeji / Broiler)', category: 'Proteins & Meat', serving: '1 breast grilled (150g)', calories: 225, protein: 43, carbs: 0, fat: 4.5, fiber: 0, notes: 'The gold standard lean muscle fuel; zero carbohydrates.' },
  { name: 'Beef (Lean Steak / Stew)', category: 'Proteins & Meat', serving: '1 palm portion (150g)', calories: 280, protein: 38, carbs: 0, fat: 13, fiber: 0, notes: 'High natural creatine, zinc, and heme iron for peak physical strength.' },
  { name: 'Goat Meat (Mbuzi Choma / Stew)', category: 'Proteins & Meat', serving: '1 plate (150g)', calories: 215, protein: 33, carbs: 0, fat: 8.5, fiber: 0, notes: 'Naturally leaner than beef or lamb, highly flavorful.' },
  { name: 'Eggs (Whole)', category: 'Proteins & Meat', serving: '2 large eggs (100g)', calories: 144, protein: 12.6, carbs: 0.8, fat: 9.8, fiber: 0, notes: 'Highest biological value protein (score 100); rich in brain choline.' },

  // Dairy
  { name: 'Fresh Milk (Whole)', category: 'Dairy', serving: '1 glass (250ml)', calories: 152, protein: 8.1, carbs: 12, fat: 8, fiber: 0, notes: 'Natural whey and casein protein mix with calcium and Vitamin D.' },
  { name: 'Mala (Fermented Cultured Milk)', category: 'Dairy', serving: '1 cup (250ml)', calories: 135, protein: 8.5, carbs: 11, fat: 6, fiber: 0, notes: 'Traditional probiotic cultured milk; aids digestion and protein absorption.' },
  { name: 'Greek / Natural Yogurt', category: 'Dairy', serving: '1 cup (200g)', calories: 140, protein: 16, carbs: 8, fat: 4, fiber: 0, notes: 'High protein-to-calorie ratio; perfect snack with berries or seeds.' },

  // Street Food & Snacks
  { name: 'Samosa (Beef / Veg)', category: 'Street Food & Snacks', serving: '1 piece (50g)', calories: 145, protein: 5, carbs: 14, fat: 8, fiber: 1, notes: 'Crispy pastry with seasoned filling; great for occasional indulgence.' },
  { name: 'Smokie (Kenyan Sausage)', category: 'Street Food & Snacks', serving: '1 piece with kachumbari (65g)', calories: 160, protein: 8.5, carbs: 4, fat: 12, fiber: 0.8, notes: 'Street favourite; pair with raw tomato/onion kachumbari for freshness.' },
  { name: 'Chips (French Fries)', category: 'Street Food & Snacks', serving: '1 medium bag (150g)', calories: 420, protein: 5, carbs: 54, fat: 21, fiber: 4.5, notes: 'High energy density; fit within maintenance or post-endurance reload.' },
  { name: 'Popcorn (Air-popped / Light)', category: 'Street Food & Snacks', serving: '3 cups popped (30g)', calories: 115, protein: 3.5, carbs: 22, fat: 1.5, fiber: 4.2, notes: 'Outstanding volume snack that crushes cravings without sabotaging calories.' },
  { name: 'Biscuits / Cookies', category: 'Street Food & Snacks', serving: '3 standard biscuits (45g)', calories: 210, protein: 2.8, carbs: 32, fat: 8.2, fiber: 1.1, notes: 'High glycemic carbohydrates; best enjoyed with tea or post-intense cardio.' },
  { name: 'Cakes / Sponge', category: 'Street Food & Snacks', serving: '1 slice (80g)', calories: 290, protein: 4, carbs: 44, fat: 11, fiber: 0.8, notes: 'Dessert treat; account for total calories in your daily plan.' },

  // Beverages
  { name: 'Sweet Kenyan Tea (Chai ya Maziwa)', category: 'Beverages', serving: '1 mug with milk & sugar (250ml)', calories: 120, protein: 4.5, carbs: 17, fat: 4, fiber: 0, notes: 'Steeped black tea with spiced milk and sugar; hearty warmth.' },
  { name: 'Herbal Teas / Black Coffee', category: 'Beverages', serving: '1 mug (250ml)', calories: 2, protein: 0.2, carbs: 0.3, fat: 0, fiber: 0, notes: 'Zero calorie metabolic stimulator, rich in catechins and polyphenols.' },
  { name: 'Fresh Fruit Juice (Orange / Passion)', category: 'Beverages', serving: '1 glass (250ml)', calories: 115, protein: 1.5, carbs: 26, fat: 0.2, fiber: 0.5, notes: 'Fast-absorbing natural fruit sugars, rich in Vitamin C.' },
  { name: 'Green / Protein Smoothie', category: 'Beverages', serving: '1 tall glass (350ml)', calories: 220, protein: 22, carbs: 26, fat: 3.5, fiber: 5.5, notes: 'Nutrient-packed blend of fruits, greens, and clean protein powder.' }
];
