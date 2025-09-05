// Test script to verify Stripe integration
const fetch = require('node-fetch');

async function testStripeFlow() {
  console.log('🧪 Testing Stripe Integration...\n');

  // Test 1: Check if Stripe configuration is working
  console.log('1. Testing Stripe configuration...');
  try {
    const response = await fetch('http://localhost:3000/api/test-stripe');
    const data = await response.json();
    
    if (data.stripeConfigured && data.priceExists) {
      console.log('✅ Stripe configuration is working');
      console.log(`   Price ID: ${data.priceId}`);
      console.log(`   Price Amount: $${(data.priceDetails.unit_amount / 100).toFixed(2)}`);
    } else {
      console.log('❌ Stripe configuration has issues');
      console.log(data);
    }
  } catch (error) {
    console.log('❌ Error testing Stripe configuration:', error.message);
  }

  // Test 2: Check webhook endpoint
  console.log('\n2. Testing webhook endpoint...');
  try {
    const response = await fetch('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test-signature'
      },
      body: JSON.stringify({ type: 'test' })
    });
    
    if (response.status === 400) {
      console.log('✅ Webhook endpoint is working (correctly rejected invalid signature)');
    } else {
      console.log('⚠️  Webhook endpoint returned unexpected status:', response.status);
    }
  } catch (error) {
    console.log('❌ Error testing webhook endpoint:', error.message);
  }

  console.log('\n🎯 Next steps:');
  console.log('1. Run: stripe listen --forward-to localhost:3000/api/webhooks/stripe');
  console.log('2. Copy the webhook secret to your .env.local file');
  console.log('3. Go to http://localhost:3000/en/upgrade');
  console.log('4. Complete a test payment with card: 4242 4242 4242 4242');
  console.log('5. Check if the subscription appears in your database');
}

testStripeFlow().catch(console.error);
