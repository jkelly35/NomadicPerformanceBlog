'use client';

import React from 'react';
import { FoodItem, NutritionInfo, calculatePortionNutrition } from '@/lib/nutrition-api';

interface NutritionFactsProps {
  food: FoodItem;
  customPortionGrams?: number;
  showPortionSelector?: boolean;
  onPortionChange?: (grams: number) => void;
  className?: string;
}

export default function NutritionFacts({
  food,
  customPortionGrams,
  showPortionSelector = false,
  onPortionChange,
  className = ""
}: NutritionFactsProps) {
  const [portionGrams, setPortionGrams] = React.useState(customPortionGrams || food.nutrition.servingSizeGrams);

  const nutrition = customPortionGrams !== undefined && customPortionGrams !== food.nutrition.servingSizeGrams
    ? calculatePortionNutrition(food, customPortionGrams)
    : portionGrams !== food.nutrition.servingSizeGrams
    ? calculatePortionNutrition(food, portionGrams)
    : food.nutrition;

  const handlePortionChange = (grams: number) => {
    setPortionGrams(grams);
    onPortionChange?.(grams);
  };

  const getDailyValue = (nutrient: keyof NutritionInfo, value: number): number => {
    const dailyValues: Record<string, number> = {
      calories: 2000,
      protein: 50,
      carbs: 300,
      fat: 65,
      fiber: 25,
      sugar: 50, // No official DV, using rough estimate
      sodium: 2300
    };

    const dv = dailyValues[nutrient];
    return dv ? Math.round((value / dv) * 100) : 0;
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="border-b-2 border-black pb-2 mb-4">
        <h3 className="text-lg font-bold text-gray-900">Nutrition Facts</h3>
        <p className="text-sm text-gray-600">{food.description}</p>
        {food.brandName && (
          <p className="text-xs text-gray-500">{food.brandName}</p>
        )}
      </div>

      {showPortionSelector && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Portion Size
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={portionGrams}
              onChange={(e) => handlePortionChange(Number(e.target.value))}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              min="1"
              max="2000"
            />
            <span className="text-sm text-gray-600">grams</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Original serving: {food.nutrition.servingSize} ({food.nutrition.servingSizeGrams}g)
          </p>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between items-center py-1 border-b border-gray-200">
          <span className="font-bold text-lg">Calories</span>
          <span className="font-bold text-lg">{nutrition.calories}</span>
        </div>

        <div className="border-b border-gray-300 py-1">
          <div className="font-bold">Total Fat {nutrition.fat}g</div>
        </div>

        <div className="border-b border-gray-300 py-1 ml-4">
          <div>Saturated Fat 0g</div>
        </div>

        <div className="border-b border-gray-300 py-1">
          <div className="flex justify-between">
            <span className="font-bold">Total Carbohydrate {nutrition.carbs}g</span>
            <span className="text-sm">{getDailyValue('carbs', nutrition.carbs)}%</span>
          </div>
        </div>

        <div className="border-b border-gray-300 py-1 ml-4">
          <div className="flex justify-between">
            <span>Dietary Fiber {nutrition.fiber}g</span>
            <span className="text-sm">{getDailyValue('fiber', nutrition.fiber)}%</span>
          </div>
        </div>

        <div className="border-b border-gray-300 py-1 ml-4">
          <div>Sugars {nutrition.sugar}g</div>
        </div>

        <div className="border-b border-gray-300 py-1">
          <div className="flex justify-between">
            <span className="font-bold">Protein {nutrition.protein}g</span>
            <span className="text-sm">{getDailyValue('protein', nutrition.protein)}%</span>
          </div>
        </div>

        <div className="py-1">
          <div className="flex justify-between">
            <span>Sodium {nutrition.sodium}mg</span>
            <span className="text-sm">{getDailyValue('sodium', nutrition.sodium)}%</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          * Percent Daily Values are based on a 2,000 calorie diet.
          Your daily values may be higher or lower depending on your calorie needs.
        </p>
      </div>
    </div>
  );
}
