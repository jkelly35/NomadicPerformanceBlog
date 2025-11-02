import { NutritionInfo } from './nutrition-api'

export interface BarcodeFood {
  code: string
  product_name: string
  brands?: string
  categories?: string
  image_url?: string
  nutrition: NutritionInfo
  serving_size?: string
  serving_quantity?: number
}

export interface BarcodeSearchResult {
  products: BarcodeFood[]
  count: number
  page: number
  page_size: number
}

const OPEN_FOOD_FACTS_BASE_URL = 'https://world.openfoodfacts.org/api/v2'

// Demo data for when API is unavailable
const DEMO_BARCODE_FOODS: Record<string, BarcodeFood> = {
  '123456789012': {
    code: '123456789012',
    product_name: 'Demo Protein Bar',
    brands: 'Demo Brand',
    categories: 'Snacks, Protein bars',
    image_url: 'https://via.placeholder.com/200x200?text=Demo+Bar',
    nutrition: {
      calories: 220,
      protein: 20,
      carbs: 18,
      fat: 8,
      fiber: 3,
      sugar: 12,
      sodium: 180,
      servingSize: '45g',
      servingSizeGrams: 45
    },
    serving_size: '45g',
    serving_quantity: 45
  },
  '987654321098': {
    code: '987654321098',
    product_name: 'Demo Greek Yogurt',
    brands: 'Demo Dairy',
    categories: 'Dairy, Yogurt',
    image_url: 'https://via.placeholder.com/200x200?text=Demo+Yogurt',
    nutrition: {
      calories: 120,
      protein: 15,
      carbs: 8,
      fat: 3,
      fiber: 0,
      sugar: 6,
      sodium: 45,
      servingSize: '150g',
      servingSizeGrams: 150
    },
    serving_size: '150g',
    serving_quantity: 150
  },
  '111111111111': {
    code: '111111111111',
    product_name: 'Monster Energy Drink',
    brands: 'Monster',
    categories: 'Beverages, Energy drinks',
    image_url: 'https://via.placeholder.com/200x200?text=Monster+Energy',
    nutrition: {
      calories: 110,
      protein: 0,
      carbs: 28,
      fat: 0,
      fiber: 0,
      sugar: 27,
      sodium: 180,
      servingSize: '1 can (16 fl oz)',
      servingSizeGrams: 473
    },
    serving_size: '1 can',
    serving_quantity: 1
  }
}

export async function searchByBarcode(barcode: string): Promise<BarcodeFood | null> {
  try {
    // Check demo data first
    if (DEMO_BARCODE_FOODS[barcode]) {
      return DEMO_BARCODE_FOODS[barcode]
    }

    const response = await fetch(`/api/barcode?barcode=${encodeURIComponent(barcode)}`)

    if (!response.ok) {
      if (response.status === 404) {
        return null // Product not found
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error)
    }

    if (!data.product) {
      return null
    }

    const product = data.product

    // Extract nutrition data
    const nutriments = product.nutriments || {}
    const servingSize = parseFloat(product.serving_size || product.quantity || '100') || 100

    const nutrition: NutritionInfo = {
      calories: Math.round(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0),
      protein: nutriments['proteins_100g'] || 0,
      carbs: nutriments['carbohydrates_100g'] || 0,
      fat: nutriments['fat_100g'] || 0,
      fiber: nutriments['fiber_100g'] || 0,
      sugar: nutriments['sugars_100g'] || 0,
      sodium: nutriments['sodium_100g'] || 0,
      servingSize: product.serving_size || `${servingSize}g`,
      servingSizeGrams: servingSize
    }

    return {
      code: product.code || barcode,
      product_name: product.product_name || product.product_name_en || 'Unknown Product',
      brands: product.brands,
      categories: product.categories,
      image_url: product.image_url,
      nutrition,
      serving_size: product.serving_size,
      serving_quantity: servingSize
    }
  } catch (error) {
    console.error('Error searching by barcode:', error)
    // Return demo data if API fails
    return DEMO_BARCODE_FOODS[barcode] || null
  }
}

export async function searchProductsByName(query: string, page = 1, pageSize = 20): Promise<BarcodeSearchResult> {
  try {
    const response = await fetch(
      `/api/barcode/search?` +
      new URLSearchParams({
        q: query,
        page: page.toString(),
        page_size: pageSize.toString()
      })
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error)
    }

    const products: BarcodeFood[] = data.products?.map((product: any) => {
      const nutriments = product.nutriments || {}
      const servingSize = parseFloat(product.serving_size || product.quantity || '100') || 100

      const nutrition: NutritionInfo = {
        calories: Math.round(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0),
        protein: nutriments['proteins_100g'] || 0,
        carbs: nutriments['carbohydrates_100g'] || 0,
        fat: nutriments['fat_100g'] || 0,
        fiber: nutriments['fiber_100g'] || 0,
        sugar: nutriments['sugars_100g'] || 0,
        sodium: nutriments['sodium_100g'] || 0,
        servingSize: product.serving_size || `${servingSize}g`,
        servingSizeGrams: servingSize
      }

      return {
        code: product.code,
        product_name: product.product_name || product.product_name_en || 'Unknown Product',
        brands: product.brands,
        categories: product.categories,
        image_url: product.image_url,
        nutrition,
        serving_size: product.serving_size,
        serving_quantity: servingSize
      }
    }) || []

    return {
      products,
      count: data.count || products.length,
      page,
      page_size: pageSize
    }
  } catch (error) {
    console.error('Error searching products by name:', error)
    // Return empty result if API fails
    return {
      products: [],
      count: 0,
      page,
      page_size: pageSize
    }
  }
}
