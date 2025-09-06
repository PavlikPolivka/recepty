import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/service';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  console.log(`🔔 Received Stripe webhook: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;

        console.log('Checkout session completed:', {
          sessionId: session.id,
          userId,
          customerId: session.customer,
          subscriptionId: session.subscription,
          mode: session.mode
        });

        if (!userId) {
          console.error('No user_id in session metadata');
          return NextResponse.json({ error: 'No user_id' }, { status: 400 });
        }

        if (!session.subscription) {
          console.error('No subscription ID in session');
          return NextResponse.json({ error: 'No subscription ID' }, { status: 400 });
        }

        // Get the subscription from Stripe
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

        console.log('Retrieved subscription:', {
          id: subscription.id,
          status: subscription.status,
          current_period_start: (subscription as any).current_period_start,
          current_period_end: (subscription as any).current_period_end,
          cancel_at_period_end: (subscription as any).cancel_at_period_end
        });

        // Update or create subscription in database
        const { error: upsertError } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            status: 'active',
            plan: 'premium',
            current_period_start: (subscription as any).current_period_start
              ? new Date((subscription as any).current_period_start * 1000).toISOString()
              : null,
            current_period_end: (subscription as any).current_period_end
              ? new Date((subscription as any).current_period_end * 1000).toISOString()
              : null,
          });

        if (upsertError) {
          console.error('Error upserting subscription:', upsertError);
          return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        console.log(`✅ Subscription created for user ${userId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        console.log('Subscription updated event:', {
          id: subscription.id,
          status: subscription.status,
          current_period_start: (subscription as any).current_period_start,
          current_period_end: (subscription as any).current_period_end,
          cancel_at_period_end: (subscription as any).cancel_at_period_end
        });
        
        // Find user by subscription ID
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (existingSub) {
          // Map Stripe status to our status
          let mappedStatus = subscription.status;
          if (subscription.status === 'canceled') {
            mappedStatus = 'canceled';
          } else if (subscription.status === 'active') {
            mappedStatus = 'active';
          } else if (subscription.status === 'past_due') {
            mappedStatus = 'past_due';
          } else {
            mappedStatus = 'canceled';
          }

          await supabase
            .from('subscriptions')
            .update({
              status: mappedStatus,
              current_period_start: (subscription as any).current_period_start
                ? new Date((subscription as any).current_period_start * 1000).toISOString()
                : null,
              current_period_end: (subscription as any).current_period_end
                ? new Date((subscription as any).current_period_end * 1000).toISOString()
                : null,
            })
            .eq('stripe_subscription_id', subscription.id);

          console.log(`Subscription updated for user ${existingSub.user_id}: ${mappedStatus}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find user by subscription ID
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (existingSub) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
            })
            .eq('stripe_subscription_id', subscription.id);

          console.log(`Subscription canceled for user ${existingSub.user_id}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if ((invoice as any).subscription) {
          // Find user by subscription ID
          const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', (invoice as any).subscription as string)
            .single();

          if (existingSub) {
            // Update subscription status to active
            await supabase
              .from('subscriptions')
              .update({
                status: 'active',
                plan: 'premium',
              })
              .eq('stripe_subscription_id', (invoice as any).subscription as string);

            console.log(`Payment succeeded for user ${existingSub.user_id}`);
          }
        }
        break;
      }


      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if ((invoice as any).subscription) {
          // Find user by subscription ID
          const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', (invoice as any).subscription as string)
            .single();

          if (existingSub) {
            // Update subscription status to past_due
            await supabase
              .from('subscriptions')
              .update({
                status: 'past_due',
              })
              .eq('stripe_subscription_id', (invoice as any).subscription as string);

            console.log(`Payment failed for user ${existingSub.user_id}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
