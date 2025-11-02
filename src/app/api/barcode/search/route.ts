import { NextRequest, NextResponse } from 'next/server'

const OPEN_FOOD_FACTS_BASE_URL = 'https://world.openfoodfacts.org/api/v2'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const page = searchParams.get('page') || '1'
  const pageSize = searchParams.get('page_size') || '20'

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `${OPEN_FOOD_FACTS_BASE_URL}/search?` +
      new URLSearchParams({
        q: query,
        page: page,
        page_size: pageSize,
        fields: 'code,product_name,brands,categories,image_url,nutriments,serving_size,quantity'
      }),
      {
        headers: {
          'User-Agent': 'NomadicPerformanceBlog/1.0 (https://nomadicperformanceblog.com)',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`OpenFoodFacts API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Product search API error:', error)
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    )
  }
}
