import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// Simple admin key check
const ADMIN_KEY = process.env.ADMIN_KEY || 'your-secret-admin-key';

export async function POST(request: NextRequest) {
  try {
    const { userId, adminKey, stripeCustomerId, stripeSubscriptionId } = await request.json();

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

    // Add subscription manually
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_customer_id: stripeCustomerId || `manual_${userId}`,
        stripe_subscription_id: stripeSubscriptionId || `manual_sub_${userId}`,
        status: 'active',
        plan: 'premium',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      });

    if (error) {
      console.error('Error adding subscription:', error);
      return NextResponse.json(
        { error: 'Failed to add subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription added successfully',
      data 
    });
  } catch (error) {
    console.error('Error in add-subscription API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
