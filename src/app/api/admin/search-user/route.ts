import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isUserAdmin } from '@/lib/admin';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

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
    const supabase = createServiceClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    try {
      const isAdmin = await isUserAdmin(user.id);
      
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    } catch (adminError) {
      console.error('Error checking admin status:', adminError);
      return NextResponse.json(
        { error: 'Failed to verify admin status' },
        { status: 500 }
      );
    }

    // Search for user by email
    let userData;
    try {
      const { data, error: searchError } = await supabase
        .from('users')
        .select('id, email, is_admin, created_at')
        .eq('email', email.toLowerCase())
        .single();

      if (searchError) {
        if (searchError.code === 'PGRST116') {
          // No rows found
          return NextResponse.json({ user: null });
        }
        console.error('Search error:', searchError);
        return NextResponse.json(
          { error: `Database error: ${searchError.message}` },
          { status: 500 }
        );
      }

      if (!data) {
        return NextResponse.json({ user: null });
      }

      userData = data;
    } catch (searchException) {
      console.error('Exception during search:', searchException);
      return NextResponse.json(
        { error: `Search exception: ${searchException instanceof Error ? searchException.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Get user's subscription info
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('plan, status, current_period_end')
      .eq('user_id', userData.id)
      .single();

    // Get user's recent usage
    const { data: usageData } = await supabase
      .from('usage_tracking')
      .select('recipes_parsed, customizations_used, date')
      .eq('user_id', userData.id)
      .order('date', { ascending: false })
      .limit(7);

    return NextResponse.json({ 
      user: {
        ...userData,
        subscription: subscriptionData,
        recent_usage: usageData
      }
    });
  } catch (error) {
    console.error('Error in search-user API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
