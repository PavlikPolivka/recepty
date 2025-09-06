'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChefHat, User, CreditCard, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import AuthButton from '@/components/AuthButton';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

export default function AccountPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user, session } = useAuth();
  const { subscription, refreshSubscription } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const switchLanguage = (newLocale: string) => {
    router.push(`/${newLocale}/account`);
  };

  const handleCancelSubscription = async () => {
    if (!confirm(t('account.cancelConfirmMessage'))) {
      return;
    }

    if (!session?.access_token) {
      setMessage({ type: 'error', text: 'No valid session found. Please sign in again.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: t('account.cancelSuccess') });
        await refreshSubscription();
      } else {
        setMessage({ type: 'error', text: data.error || t('account.cancelError') });
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      setMessage({ type: 'error', text: t('account.cancelError') });
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!session?.access_token) {
      setMessage({ type: 'error', text: 'No valid session found. Please sign in again.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/reactivate-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: t('account.reactivateSuccess') });
        await refreshSubscription();
      } else {
        setMessage({ type: 'error', text: data.error || t('account.reactivateError') });
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      setMessage({ type: 'error', text: t('account.reactivateError') });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-US');
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'canceled':
        return 'text-red-600 bg-red-100';
      case 'past_due':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('auth.signInRequired')}</h1>
          <p className="text-gray-600 mb-6">{t('auth.signInToSave')}</p>
          <Link
            href={`/${locale}/home`}
            className="inline-flex items-center px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
          >
            {t('auth.backToHome')}
          </Link>
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
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('account.title')}</h2>
          <p className="text-xl text-gray-800 max-w-2xl mx-auto">{t('account.subtitle')}</p>
        </div>

        {message && (
          <div className={`mb-8 p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Account Info */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <User className="h-6 w-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">User ID</label>
                <p className="text-sm text-gray-500 font-mono">{user.id}</p>
              </div>
            </div>
          </div>

          {/* Subscription Info */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <CreditCard className="h-6 w-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t('account.subscriptionStatus')}</h3>
            </div>
            
            {subscription ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('account.subscriptionStatus')}</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${subscription.cancel_at_period_end ? 'bg-yellow-100 text-yellow-800' : getStatusColor(subscription.status)}`}>
                    {subscription.cancel_at_period_end ? t('account.canceled') : t(`account.${subscription.status}`)}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('account.planType')}</label>
                  <p className="text-gray-900">{t(`account.${subscription.plan}`)}</p>
                </div>

                {subscription.status === 'active' && subscription.plan === 'premium' && subscription.current_period_end && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('account.nextBillingDate')}</label>
                    <p className="text-gray-900">{formatDate(subscription.current_period_end)}</p>
                  </div>
                )}

                {subscription.status === 'canceled' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('account.canceledOn')}</label>
                    <p className="text-gray-900">{formatDate(subscription.updated_at)}</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">{t('account.manageSubscription')}</h4>
                  <div className="space-y-2">
                    {subscription.status === 'active' && subscription.plan === 'premium' && !subscription.cancel_at_period_end && (
                      <button
                        onClick={handleCancelSubscription}
                        disabled={loading}
                        className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? t('common.loading') : t('account.cancelSubscription')}
                      </button>
                    )}
                    
                    {subscription.status === 'active' && subscription.plan === 'premium' && subscription.cancel_at_period_end && (
                      <button
                        onClick={handleReactivateSubscription}
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? t('common.loading') : t('account.reactivateSubscription')}
                      </button>
                    )}

                    {subscription.plan === 'lifetime' && (
                      <p className="text-sm text-gray-500 text-center py-2">
                        {t('account.lifetime')} - {t('account.noBilling')}
                      </p>
                    )}

                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No subscription found</p>
                <Link
                  href={`/${locale}/upgrade`}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
                >
                  {t('home.upgradeToPremiumButton')}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Mail className="h-6 w-6 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">{t('account.support')}</h3>
          </div>
          <p className="text-gray-700 mb-4">
            {t('account.contactSupport')}:{' '}
            <a
              href={`mailto:${t('account.supportEmail')}?subject=Recipe Simplifier Support`}
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              {t('account.supportEmail')}
            </a>
          </p>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link
            href={`/${locale}/home`}
            className="inline-flex items-center px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
          >
            {t('navigation.home')}
          </Link>
        </div>
      </main>
    </div>
  );
}
