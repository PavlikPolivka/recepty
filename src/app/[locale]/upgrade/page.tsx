'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { ChefHat, Check, Star, Zap, Shield, Crown, Loader2 } from 'lucide-react';
import AuthButton from '@/components/AuthButton';
import { useState } from 'react';
import stripePromise from '@/lib/stripe-client';
import { createClient } from '@/lib/supabase/client';

export default function UpgradePage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const { subscription, usage, loading } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const switchLanguage = (newLocale: string) => {
    router.push(`/${newLocale}/upgrade`);
  };

  const handleUpgrade = async () => {
    if (checkoutLoading) return;
    
    setCheckoutLoading(true);
    
    try {
      // Get the session token for authentication
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert(t('home.signInToUpgrade'));
        return;
      }

      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ locale }),
      });

      const { sessionId, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (stripe) {
        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId,
        });

        if (stripeError) {
          throw new Error(stripeError.message);
        }
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert(t('upgrade.checkoutError'));
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('home.signInToUpgrade')}</h1>
          <button 
            onClick={() => router.push(`/${locale}/home`)}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
          >
            {t('auth.signIn')}
          </button>
        </div>
      </div>
    );
  }

  const isPremium = subscription?.is_premium || false;
  const recipesUsed = usage?.recipes_parsed || 0;
  const customizationsUsed = usage?.customizations_used || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-orange-600" />
              <h1 className="text-xl font-bold text-gray-900">
                {t('home.title')}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div key={locale} className="flex items-center space-x-2">
                <button
                  onClick={() => switchLanguage('en')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    locale === 'en'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => switchLanguage('cs')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    locale === 'cs'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  CS
                </button>
              </div>
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Current Status */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {isPremium ? t('home.yourePremium') : t('home.upgradeToPremiumTitle')}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {isPremium 
              ? t('home.enjoyPremium')
              : t('home.upgradeToPremiumSubtitle')
            }
          </p>
        </div>

        {/* Usage Stats */}
        {!isPremium && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('home.todaysUsage')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('home.recipesParsed')}</p>
                  <p className="text-2xl font-bold text-gray-900">{recipesUsed}/3</p>
                </div>
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <Zap className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('home.customizationsUsed')}</p>
                  <p className="text-2xl font-bold text-gray-900">{customizationsUsed}/3</p>
                </div>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Star className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Free Plan */}
          <div className={`bg-white rounded-lg shadow-md p-8 ${isPremium ? 'opacity-50' : 'border-2 border-gray-200'}`}>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('home.freePlan')}</h3>
              <p className="text-4xl font-bold text-gray-900 mb-4">$0<span className="text-lg text-gray-600">/month</span></p>
              <p className="text-gray-600 mb-6">{t('upgrade.freePlanDescription')}</p>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-700">3 {t('upgrade.recipesParsed').toLowerCase()}</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-700">3 {t('upgrade.customizationsUsed').toLowerCase()}</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-700">{t('upgrade.basicRecipeParsing')}</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-red-500 mr-3" />
                <span className="text-gray-500 line-through">{t('upgrade.noCookbookAccess')}</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-red-500 mr-3" />
                <span className="text-gray-500 line-through">{t('upgrade.noRecipeSaving')}</span>
              </li>
            </ul>
            {!isPremium && (
              <div className="text-center">
                <span className="text-sm text-gray-500">{t('home.currentPlan')}</span>
              </div>
            )}
          </div>

          {/* Premium Plan */}
          <div className={`bg-white rounded-lg shadow-md p-8 ${isPremium ? 'border-2 border-green-500' : 'border-2 border-orange-500'}`}>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Crown className="h-6 w-6 text-orange-600 mr-2" />
                <h3 className="text-2xl font-bold text-gray-900">{t('upgrade.premiumPlanTitle')}</h3>
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-4">$1<span className="text-lg text-gray-600">/month</span></p>
              <p className="text-gray-600 mb-6">{t('upgrade.premiumPlanDescription')}</p>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-700">{t('upgrade.unlimitedRecipes')}</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-700">{t('upgrade.unlimitedCustomizations')}</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-700">{t('upgrade.advancedAIParsing')}</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-700">{t('upgrade.fullCookbookAccess')}</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-700">{t('upgrade.saveUnlimitedRecipes')}</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-700">{t('upgrade.shareableRecipeLinks')}</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-700">{t('upgrade.prioritySupport')}</span>
              </li>
            </ul>
            {isPremium ? (
              <div className="text-center">
                <span className="text-sm text-green-600 font-medium">{t('home.activeSubscription')}</span>
              </div>
            ) : (
              <button 
                onClick={handleUpgrade}
                disabled={checkoutLoading}
                className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('home.upgradeToPremiumButton')
                )}
              </button>
            )}
          </div>
        </div>

        {/* Features Comparison */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t('home.featureComparison')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">{t('upgrade.feature')}</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">{t('home.freePlan')}</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">{t('upgrade.premiumPlanTitle')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-4 px-6 text-gray-700">{t('upgrade.dailyRecipeLimit')}</td>
                  <td className="py-4 px-6 text-center text-gray-500">3 {t('upgrade.recipesParsed').toLowerCase()}</td>
                  <td className="py-4 px-6 text-center text-green-600 font-medium">{t('upgrade.unlimited')}</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700">{t('upgrade.dailyCustomizationLimit')}</td>
                  <td className="py-4 px-6 text-center text-gray-500">3 {t('upgrade.customizationsUsed').toLowerCase()}</td>
                  <td className="py-4 px-6 text-center text-green-600 font-medium">{t('upgrade.unlimited')}</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700">{t('upgrade.cookbookAccess')}</td>
                  <td className="py-4 px-6 text-center text-red-500">❌</td>
                  <td className="py-4 px-6 text-center text-green-600">✅</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700">{t('upgrade.saveRecipes')}</td>
                  <td className="py-4 px-6 text-center text-red-500">❌</td>
                  <td className="py-4 px-6 text-center text-green-600">✅</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700">{t('upgrade.shareableLinks')}</td>
                  <td className="py-4 px-6 text-center text-red-500">❌</td>
                  <td className="py-4 px-6 text-center text-green-600">✅</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700">{t('upgrade.printRecipes')}</td>
                  <td className="py-4 px-6 text-center text-green-600">✅</td>
                  <td className="py-4 px-6 text-center text-green-600">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t('home.faq')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('upgrade.billingQuestion')}</h3>
              <p className="text-gray-600">{t('upgrade.billingAnswer')}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('upgrade.changePlansQuestion')}</h3>
              <p className="text-gray-600">{t('upgrade.changePlansAnswer')}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('upgrade.recipesQuestion')}</h3>
              <p className="text-gray-600">{t('upgrade.recipesAnswer')}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('upgrade.trialQuestion')}</h3>
              <p className="text-gray-600">{t('upgrade.trialAnswer')}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}