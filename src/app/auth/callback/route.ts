import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const locale = searchParams.get('locale') || 'cs';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Redirect to the appropriate locale home page
      return NextResponse.redirect(`${origin}/${locale}/home`);
    }
  }

  // If there's an error or no code, redirect to home
  return NextResponse.redirect(`${origin}/${locale}/home`);
}