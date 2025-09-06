import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/service';

// Extended Stripe subscription type for properties not in main types
interface StripeSubscriptionExtended {
  current_period_end: number;
  cancel_at_period_end: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user's subscription
    const serviceClient = createServiceClient();
    const { data: subscription, error: subError } = await serviceClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    if (!subscription.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No Stripe subscription ID found' },
        { status: 400 }
      );
    }

    // Cancel the subscription in Stripe
    const canceledSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        cancel_at_period_end: true,
      }
    );

    const canceledSubExtended = canceledSubscription as unknown as StripeSubscriptionExtended;
    console.log('Canceled subscription:', {
      subscriptionId: subscription.stripe_subscription_id,
      cancelAtPeriodEnd: canceledSubExtended.cancel_at_period_end,
      currentPeriodEnd: canceledSubExtended.current_period_end
    });

    // Update the subscription in our database
    const { error: updateError } = await serviceClient
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        current_period_end: canceledSubExtended.current_period_end
          ? new Date(canceledSubExtended.current_period_end * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Subscription canceled successfully. You will retain access until the end of your billing period.'
    });

  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
