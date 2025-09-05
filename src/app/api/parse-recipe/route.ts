import { NextRequest, NextResponse } from 'next/server';
import { parseRecipeFromUrl } from '@/lib/recipe-parser';

export async function POST(request: NextRequest) {
  let url = '';
  let locale = 'en';
  let instructions = '';
  
  try {
    const body = await request.json();
    url = body.url || '';
    instructions = body.instructions || '';
    locale = body.locale || 'en';

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

    const recipe = await parseRecipeFromUrl(url, locale, instructions);
    
    return NextResponse.json({ recipe });
  } catch (error) {
    console.error('Recipe parsing error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      url: url || 'unknown',
      locale: locale || 'unknown',
      instructions: instructions || 'none'
    });
    return NextResponse.json(
      { 
        error: 'Failed to parse recipe',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
