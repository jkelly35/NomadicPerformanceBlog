import { NextRequest, NextResponse } from 'next/server'

const OPEN_FOOD_FACTS_BASE_URL = 'https://world.openfoodfacts.org/api/v2'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const barcode = searchParams.get('barcode')

  if (!barcode) {
    return NextResponse.json({ error: 'Barcode parameter is required' }, { status: 400 })
  }

  try {
    const response = await fetch(`${OPEN_FOOD_FACTS_BASE_URL}/product/${barcode}.json`, {
      headers: {
        'User-Agent': 'NomadicPerformanceBlog/1.0 (https://nomadicperformanceblog.com)',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      throw new Error(`OpenFoodFacts API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Barcode API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product data' },
      { status: 500 }
    )
  }
}
