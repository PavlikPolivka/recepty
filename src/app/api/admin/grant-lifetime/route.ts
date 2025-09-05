import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// Simple admin key check (in production, use proper authentication)
const ADMIN_KEY = process.env.ADMIN_KEY || 'your-secret-admin-key';

export async function POST(request: NextRequest) {
  try {
    const { userId, adminKey } = await request.json();

    // Verify admin key
    if (adminKey !== ADMIN_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Grant lifetime access
    const { error } = await supabase.rpc('grant_lifetime_access', {
      user_uuid: userId,
      granted_by: 'admin'
    });

    if (error) {
      console.error('Error granting lifetime access:', error);
      return NextResponse.json(
        { error: 'Failed to grant lifetime access' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Lifetime access granted successfully' 
    });
  } catch (error) {
    console.error('Error in grant-lifetime API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
