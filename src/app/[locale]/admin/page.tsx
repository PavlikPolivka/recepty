'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { ChefHat, Crown, CheckCircle } from 'lucide-react';
import AuthButton from '@/components/AuthButton';

export default function AdminPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [addSubLoading, setAddSubLoading] = useState(false);

  const switchLanguage = (newLocale: string) => {
    router.push(`/${newLocale}/admin`);
  };

  const grantLifetimeAccess = async () => {
    if (!user) return;
    
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/grant-lifetime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          adminKey: 'your-secret-admin-key' // Change this to your actual admin key
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Lifetime access granted successfully! Please refresh the page.');
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const addSubscription = async () => {
    if (!user) return;
    
    setAddSubLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/add-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          adminKey: 'your-secret-admin-key' // Change this to your actual admin key
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Subscription added successfully! Please refresh the page.');
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    } finally {
      setAddSubLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <ChefHat className="h-8 w-8 text-orange-600" />
                <h1 className="text-xl font-bold text-gray-900">
                  Recipe Simplifier Admin
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

        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to access admin panel</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-orange-600" />
              <h1 className="text-xl font-bold text-gray-900">
                Recipe Simplifier Admin
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

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center space-x-2 mb-6">
            <ChefHat className="h-8 w-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Status</h2>
              <div className="space-y-2">
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Current Plan:</strong> {subscription?.plan || 'free'}</p>
                <p><strong>Is Premium:</strong> {subscription?.is_premium ? 'Yes' : 'No'}</p>
                {subscription?.plan === 'lifetime' && (
                  <div className="flex items-center text-green-600">
                    <Crown className="h-5 w-5 mr-2" />
                    <span className="font-medium">Lifetime Access Active!</span>
                  </div>
                )}
              </div>
            </div>

            {subscription?.plan !== 'lifetime' && subscription?.plan !== 'premium' && (
              <div className="bg-orange-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Grant Lifetime Access</h2>
                <p className="text-gray-600 mb-4">
                  This will grant you unlimited access to all features forever.
                </p>
                <button
                  onClick={grantLifetimeAccess}
                  disabled={loading}
                  className="bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Granting Access...
                    </>
                  ) : (
                    <>
                      <Crown className="h-4 w-4 mr-2" />
                      Grant Lifetime Access
                    </>
                  )}
                </button>
              </div>
            )}

            {subscription?.plan !== 'lifetime' && subscription?.plan !== 'premium' && (
              <div className="bg-blue-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Premium Subscription</h2>
                <p className="text-gray-600 mb-4">
                  If you completed a Stripe payment but the subscription wasn't added to the database, click this button to add it manually.
                </p>
                <button
                  onClick={addSubscription}
                  disabled={addSubLoading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {addSubLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Adding Subscription...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Add Premium Subscription
                    </>
                  )}
                </button>
              </div>
            )}

            {message && (
              <div className={`rounded-lg p-4 ${
                message.includes('✅') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Lifetime Access Benefits</h2>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Unlimited recipe parsing
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Unlimited customizations
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Full cookbook access
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Save unlimited recipes
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Shareable recipe links
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Priority support
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <strong>No monthly fees - ever!</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
