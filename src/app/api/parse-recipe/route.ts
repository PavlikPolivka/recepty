import { NextRequest, NextResponse } from 'next/server';
import { parseRecipeFromUrl } from '@/lib/recipe-parser';

export async function POST(request: NextRequest) {
  try {
    const { url, locale = 'en' } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const recipe = await parseRecipeFromUrl(url, locale);
    
    return NextResponse.json({ recipe });
  } catch (error) {
    console.error('Recipe parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse recipe' },
      { status: 500 }
    );
  }
}
