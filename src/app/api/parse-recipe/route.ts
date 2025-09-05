import { NextRequest, NextResponse } from 'next/server';
import { parseRecipeFromUrl } from '@/lib/recipe-parser';
import { createClient } from '@/lib/supabase/client';
import { headers } from 'next/headers';

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

    // Check authentication and usage limits
    const supabase = createClient();
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Check if user can parse recipe
    const { data: canParse, error: canParseError } = await supabase.rpc('can_parse_recipe', {
      user_uuid: user.id
    });

    if (canParseError) {
      console.error('Error checking parse permission:', canParseError);
      return NextResponse.json(
        { error: 'Failed to check usage limits' },
        { status: 500 }
      );
    }

    if (!canParse) {
      return NextResponse.json(
        { 
          error: 'Daily recipe limit reached',
          details: 'You have reached your daily limit of 3 recipes. Upgrade to premium for unlimited recipes.'
        },
        { status: 429 }
      );
    }

    // Check customization limits
    const customizationCount = instructions.trim() ? instructions.split(';').length : 0;
    if (customizationCount > 0) {
      const { data: canCustomize, error: canCustomizeError } = await supabase.rpc('can_use_customizations', {
        user_uuid: user.id,
        requested_count: customizationCount
      });

      if (canCustomizeError) {
        console.error('Error checking customization permission:', canCustomizeError);
        return NextResponse.json(
          { error: 'Failed to check customization limits' },
          { status: 500 }
        );
      }

      if (!canCustomize) {
        return NextResponse.json(
          { 
            error: 'Daily customization limit reached',
            details: 'You have reached your daily limit of 3 customizations. Upgrade to premium for unlimited customizations.'
          },
          { status: 429 }
        );
      }
    }

    const recipe = await parseRecipeFromUrl(url, locale, instructions);
    
    // Track usage
    await supabase.rpc('increment_usage', {
      user_uuid: user.id,
      recipes_count: 1,
      customizations_count: customizationCount
    });
    
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
