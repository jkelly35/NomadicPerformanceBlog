'use client';

import React, { useState, useEffect } from 'react';
import { searchFoods, FoodItem, FoodSearchResult } from '@/lib/nutrition-api';

interface FoodSearchProps {
  onFoodSelect: (food: FoodItem) => void;
  placeholder?: string;
  className?: string;
}

export default function FoodSearch({ onFoodSelect, placeholder = "Search for foods...", className = "" }: FoodSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const searchResults = await searchFoods(query, 1, 10);
        setResults(searchResults);

        // Check if we're in demo mode
        const hasApiKey = !!process.env.NEXT_PUBLIC_USDA_API_KEY;
        setIsDemoMode(!hasApiKey);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search foods');
        console.error('Food search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleFoodSelect = (food: FoodItem) => {
    onFoodSelect(food);
    setQuery('');
    setResults(null);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          ) : (
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      {error && (
        <div className="absolute z-10 w-full mt-1 bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-700 text-sm font-medium mb-2">Food Search Unavailable</p>
          <p className="text-red-600 text-sm">
            {error.includes('API key not configured') ? (
              <>
                To enable food search, please:
                <br />• Get a free API key from{' '}
                <a
                  href="https://fdc.nal.usda.gov/api-key-signup.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-red-800"
                >
                  USDA FoodData Central
                </a>
                <br />• Add it to your environment variables as <code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_USDA_API_KEY</code>
              </>
            ) : error.includes('Invalid API key') ? (
              'Please check your USDA API key configuration.'
            ) : error.includes('rate limit') ? (
              'Food search is temporarily busy. Please try again in a few minutes.'
            ) : (
              'Food search is currently unavailable. Please try again later.'
            )}
          </p>
        </div>
      )}

      {results && results.foods.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-y-auto">
          {results.foods.map((food) => (
            <button
              key={food.fdcId}
              onClick={() => handleFoodSelect(food)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {food.description}
                  </h4>
                  {food.brandName && (
                    <p className="text-xs text-gray-500 truncate">{food.brandName}</p>
                  )}
                  {food.category && (
                    <p className="text-xs text-blue-600 mt-1">{food.category}</p>
                  )}
                </div>
                <div className="ml-3 text-right text-xs text-gray-500">
                  <div>{food.nutrition.calories} cal</div>
                  <div>{food.nutrition.protein}g protein</div>
                </div>
              </div>
            </button>
          ))}

          {isDemoMode && (
            <div className="px-4 py-2 bg-amber-50 border-t border-amber-200">
              <p className="text-xs text-amber-700">
                Demo Mode - Add API key for live food data
              </p>
            </div>
          )}
        </div>
      )}

      {results && results.foods.length === 0 && !loading && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4">
          <p className="text-sm text-gray-500 text-center">No foods found matching "{query}"</p>
        </div>
      )}
    </div>
  );
}
