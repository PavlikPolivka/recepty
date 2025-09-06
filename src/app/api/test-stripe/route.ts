import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_PRICE_ID } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    // Test if Stripe is configured correctly
    const testData: {
      stripeConfigured: boolean;
      priceId: string;
      priceIdValid: boolean | "";
      webhookSecret: boolean;
      publishableKey: boolean;
      priceExists?: boolean;
      priceDetails?: {
        id: string;
        active: boolean;
        unit_amount: number | null;
        currency: string;
      };
      priceError?: string;
    } = {
      stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
      priceId: STRIPE_PRICE_ID,
      priceIdValid: STRIPE_PRICE_ID && STRIPE_PRICE_ID.startsWith('price_'),
      webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      publishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    };

    // Try to retrieve the price to verify it exists
    if (STRIPE_PRICE_ID && STRIPE_PRICE_ID.startsWith('price_')) {
      try {
        const price = await stripe.prices.retrieve(STRIPE_PRICE_ID);
        testData.priceExists = true;
        testData.priceDetails = {
          id: price.id,
          active: price.active,
          unit_amount: price.unit_amount,
          currency: price.currency,
        };
      } catch (error) {
        testData.priceExists = false;
        testData.priceError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return NextResponse.json(testData);
  } catch (error) {
    console.error('Error testing Stripe:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test Stripe configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
