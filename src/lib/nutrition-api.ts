// src/lib/nutrition-api.ts
export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  servingSize: string;
  servingSizeGrams: number;
}

export interface FoodItem {
  fdcId: number;
  description: string;
  brandName?: string;
  ingredients?: string;
  nutrition: NutritionInfo;
  category?: string;
}

export interface FoodSearchResult {
  foods: FoodItem[];
  totalHits: number;
  currentPage: number;
  totalPages: number;
}

// Demo/mock food data for when API is not configured
const DEMO_FOODS: FoodItem[] = [
  {
    fdcId: 1,
    description: "Banana",
    nutrition: {
      calories: 105,
      protein: 1.3,
      carbs: 27,
      fat: 0.4,
      fiber: 3.1,
      sugar: 14.4,
      sodium: 1,
      servingSize: "1 medium (118g)",
      servingSizeGrams: 118
    },
    category: "Fruits"
  },
  {
    fdcId: 2,
    description: "Chicken Breast, skinless",
    nutrition: {
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      fiber: 0,
      sugar: 0,
      sodium: 74,
      servingSize: "100g",
      servingSizeGrams: 100
    },
    category: "Poultry"
  },
  {
    fdcId: 3,
    description: "Brown Rice, cooked",
    nutrition: {
      calories: 216,
      protein: 5,
      carbs: 44,
      fat: 1.8,
      fiber: 3.5,
      sugar: 0.7,
      sodium: 10,
      servingSize: "1 cup cooked (195g)",
      servingSizeGrams: 195
    },
    category: "Grains"
  },
  {
    fdcId: 4,
    description: "Greek Yogurt, plain",
    nutrition: {
      calories: 100,
      protein: 17,
      carbs: 6,
      fat: 0,
      fiber: 0,
      sugar: 4,
      sodium: 55,
      servingSize: "6 oz (170g)",
      servingSizeGrams: 170
    },
    category: "Dairy"
  },
  {
    fdcId: 5,
    description: "Spinach, raw",
    nutrition: {
      calories: 23,
      protein: 2.9,
      carbs: 3.6,
      fat: 0.4,
      fiber: 2.2,
      sugar: 0.4,
      sodium: 79,
      servingSize: "1 cup (30g)",
      servingSizeGrams: 30
    },
    category: "Vegetables"
  }
];

export async function searchFoods(query: string, page: number = 1, pageSize: number = 10): Promise<FoodSearchResult> {
  const API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY;

  // If no API key is configured, return filtered demo data
  if (!API_KEY) {
    console.warn('USDA API key not configured. Using demo food data.');
    const filteredFoods = DEMO_FOODS.filter(food =>
      food.description.toLowerCase().includes(query.toLowerCase())
    );

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedFoods = filteredFoods.slice(startIndex, endIndex);

    return {
      foods: paginatedFoods,
      totalHits: filteredFoods.length,
      currentPage: page,
      totalPages: Math.ceil(filteredFoods.length / pageSize)
    };
  }

  try {
    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=${pageSize}&pageNumber=${page - 1}&api_key=${API_KEY}`
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid USDA API key. Please check your API key configuration.');
      } else if (response.status === 429) {
        throw new Error('USDA API rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Food search service temporarily unavailable (${response.status}). Please try again later.`);
      }
    }

    const data = await response.json();

    const foods: FoodItem[] = data.foods.map((food: any) => ({
      fdcId: food.fdcId,
      description: food.description,
      brandName: food.brandName,
      ingredients: food.ingredients,
      nutrition: extractNutritionInfo(food),
      category: food.foodCategory
    }));

    return {
      foods,
      totalHits: data.totalHits,
      currentPage: data.currentPage + 1, // API uses 0-based indexing
      totalPages: data.totalPages
    };
  } catch (error) {
    console.error('USDA API error:', error);
    throw error;
  }
}

export async function getFoodDetails(fdcId: number): Promise<FoodItem> {
  const API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY;

  // If no API key is configured, return demo data
  if (!API_KEY) {
    const demoFood = DEMO_FOODS.find(food => food.fdcId === fdcId);
    if (demoFood) {
      return demoFood;
    }
    throw new Error('Food not found in demo data.');
  }

  try {
    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${API_KEY}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Food not found.');
      } else if (response.status === 401) {
        throw new Error('Invalid USDA API key. Please check your API key configuration.');
      } else {
        throw new Error(`Food details service temporarily unavailable (${response.status}). Please try again later.`);
      }
    }

    const data = await response.json();

    return {
      fdcId: data.fdcId,
      description: data.description,
      brandName: data.brandName,
      ingredients: data.ingredients,
      nutrition: extractNutritionInfo(data),
      category: data.foodCategory
    };
  } catch (error) {
    console.error('USDA API error:', error);
    throw error;
  }
}

function extractNutritionInfo(foodData: any): NutritionInfo {
  const nutrients = foodData.foodNutrients || [];
  const servingSizeInfo = foodData.servingSize || foodData.householdServingFullText || '100g';
  const servingSizeGrams = foodData.servingSizeUnit === 'g' ? (foodData.servingSize || 100) : 100;

  // Helper function to find nutrient value
  const getNutrientValue = (nutrientId: number): number => {
    const nutrient = nutrients.find((n: any) => n.nutrientId === nutrientId);
    return nutrient ? Math.round(nutrient.value * 100) / 100 : 0;
  };

  return {
    calories: getNutrientValue(1008), // Energy (kcal)
    protein: getNutrientValue(1003), // Protein
    carbs: getNutrientValue(1005), // Carbohydrate
    fat: getNutrientValue(1004), // Total lipid (fat)
    fiber: getNutrientValue(1079), // Fiber
    sugar: getNutrientValue(2000), // Sugars
    sodium: getNutrientValue(1093), // Sodium
    servingSize: servingSizeInfo,
    servingSizeGrams: servingSizeGrams
  };
}

// Calculate nutrition for a custom portion size
export function calculatePortionNutrition(food: FoodItem, portionGrams: number): NutritionInfo {
  const ratio = portionGrams / food.nutrition.servingSizeGrams;

  return {
    calories: Math.round(food.nutrition.calories * ratio),
    protein: Math.round(food.nutrition.protein * ratio * 100) / 100,
    carbs: Math.round(food.nutrition.carbs * ratio * 100) / 100,
    fat: Math.round(food.nutrition.fat * ratio * 100) / 100,
    fiber: Math.round(food.nutrition.fiber * ratio * 100) / 100,
    sugar: Math.round(food.nutrition.sugar * ratio * 100) / 100,
    sodium: Math.round(food.nutrition.sodium * ratio),
    servingSize: `${portionGrams}g`,
    servingSizeGrams: portionGrams
  };
}
