#!/bin/bash

echo "Adding Stripe environment variables to .env.local..."

# Add Stripe variables to .env.local
cat >> .env.local << 'EOF'

# Stripe (get these from your Stripe dashboard)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_PRICE_ID=price_your_stripe_price_id_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here

# Admin access is now controlled via database (no env var needed)
EOF

echo "✅ Stripe environment variables added to .env.local"
echo ""
echo "🔧 Next steps:"
echo "1. Get your Stripe API keys from https://stripe.com"
echo "2. Replace the placeholder values in .env.local with your actual keys"
echo "3. Restart your development server: npm run dev"
echo ""
echo "📋 You need these Stripe keys:"
echo "   - STRIPE_SECRET_KEY (starts with sk_test_)"
echo "   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (starts with pk_test_)"
echo "   - STRIPE_PRICE_ID (starts with price_)"
echo "   - STRIPE_WEBHOOK_SECRET (starts with whsec_)"
