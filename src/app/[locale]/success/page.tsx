'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChefHat, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import AuthButton from '@/components/AuthButton';

export default function SuccessPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // Verify the session with Stripe
      fetch('/api/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data.success) {
            setLoading(false);
          } else {
            setError(data.error || 'Payment verification failed');
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error('Error verifying session:', err);
          // Don't show error for verification failures, just assume success
          setLoading(false);
        });
    } else {
      // No session ID, just show success (user might have been redirected manually)
      setLoading(false);
    }
  }, [sessionId]);

  const switchLanguage = (newLocale: string) => {
    router.push(`/${newLocale}/success${sessionId ? `?session_id=${sessionId}` : ''}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error ? (
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
              <h1 className="text-2xl font-bold text-red-900 mb-4">Payment Error</h1>
              <p className="text-red-700 mb-6">{error}</p>
              <Link
                href={`/${locale}/upgrade`}
                className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Upgrade
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {t('success.title')}
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                {t('success.subtitle')}
              </p>
              <div className="space-y-4">
                <Link
                  href={`/${locale}/home`}
                  className="inline-flex items-center px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
                >
                  {t('success.startCooking')}
                </Link>
                <div>
                  <Link
                    href={`/${locale}/cookbook`}
                    className="text-orange-600 hover:text-orange-700 font-medium"
                  >
                    {t('success.viewCookbook')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
