'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChefHat, Globe, Loader2, Eye, Trash2, BookOpen } from 'lucide-react';
import AuthButton from '@/components/AuthButton';
import InstructionsInput from '@/components/InstructionsInput';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { createClient } from '@/lib/supabase/client';
import { SavedRecipe } from '@/types/database';

export default function HomePage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { subscription, usage, canParseRecipe, canUseCustomizations, maxRecipesPerDay, maxCustomizationsPerDay } = useSubscription();
  
  // Check if user has active premium subscription
  const isPremium = subscription?.is_premium && subscription?.status === 'active';
  
  // Debug logging
  useEffect(() => {
    if (subscription) {
      console.log('Subscription status:', {
        is_premium: subscription.is_premium,
        status: subscription.status,
        plan: subscription.plan,
        isPremium: isPremium
      });
    }
  }, [subscription, isPremium]);
  const [url, setUrl] = useState('');
  const [instructions, setInstructions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  // Get locale from URL path - more reliable for active state
  const currentLocale = pathname.split('/')[1] || 'en';

  // Force re-render when pathname changes to update active language state
  useEffect(() => {
    // This will trigger a re-render when the pathname changes
    console.log('Current locale from pathname:', currentLocale);
  }, [pathname, currentLocale]);

  // Load saved recipes when user changes
  useEffect(() => {
    const loadSavedRecipes = async () => {
      if (!user) {
        setSavedRecipes([]);
        return;
      }

      setLoadingRecipes(true);
      try {
        const supabase = createClient();
        
        // First, try to ensure the user exists by calling the RPC function
        const { error: userError } = await supabase.rpc('ensure_user_exists', {
          user_uuid: user.id,
          user_email: user.email || ''
        });

        if (userError) {
          console.error('Error ensuring user exists:', userError);
          // Continue anyway, the trigger might have already created the user
        }

        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(6); // Show only the 6 most recent recipes

        if (error) throw error;

        setSavedRecipes(data || []);
      } catch (error) {
        console.error('Error loading saved recipes:', error);
      } finally {
        setLoadingRecipes(false);
      }
    };

    loadSavedRecipes();
  }, [user]);

  const handleViewRecipe = (recipe: SavedRecipe) => {
    // Navigate to the shareable recipe URL
    router.push(`/${currentLocale}/recipe/${recipe.id}`);
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (typeof window !== 'undefined' && !window.confirm(t('cookbook.deleteConfirm'))) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setSavedRecipes(savedRecipes.filter(recipe => recipe.id !== recipeId));
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    // Check if user can parse recipe
    if (!canParseRecipe) {
      setError('Daily recipe limit reached. Upgrade to premium for unlimited recipes.');
      return;
    }

    // Check customization limits
    const customizationCount = instructions.length;
    if (customizationCount > 0 && !canUseCustomizations(customizationCount)) {
      setError('Daily customization limit reached. Upgrade to premium for unlimited customizations.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Get the session token for authentication
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError(t('home.signInToParse'));
        return;
      }

      const response = await fetch('/api/parse-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ url, instructions: instructions.join('; '), locale: currentLocale }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse recipe');
      }

      const { recipe } = await response.json();
      // Store recipe in sessionStorage temporarily (client-side only)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('currentRecipe', JSON.stringify(recipe));
      }
      router.push(`/${currentLocale}/recipe`);
    } catch (err) {
      setError(t('home.error'));
      console.error('Error parsing recipe:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const switchLanguage = (newLocale: string) => {
    router.push(`/${newLocale}/home`);
  };

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
              <div key={currentLocale} className="flex items-center space-x-2">
                <button
                  onClick={() => switchLanguage('en')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    currentLocale === 'en'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => switchLanguage('cs')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    currentLocale === 'cs'
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

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {t('home.title')}
          </h2>
          <p className="text-xl text-gray-800 max-w-2xl mx-auto mb-4">
            {t('home.subtitle')}
          </p>
          {!user && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-blue-900">
                {t('auth.signInToSave')}
              </p>
            </div>
          )}
          
          {/* Usage Display */}
          {user && usage && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-2xl mx-auto mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Today&apos;s Usage</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {usage.recipes_parsed}/{maxRecipesPerDay === 999999 ? '∞' : maxRecipesPerDay}
                  </div>
                                       <div className="text-sm text-gray-600">{t('home.recipesParsed')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {usage.customizations_used}/{maxCustomizationsPerDay === 999999 ? '∞' : maxCustomizationsPerDay}
                  </div>
                                       <div className="text-sm text-gray-600">{t('home.customizationsUsed')}</div>
                </div>
              </div>
              {!isPremium && (
                <div className="mt-4 text-center">
                  <Link 
                    href={`/${currentLocale}/upgrade`}
                    className="text-orange-600 hover:text-orange-700 font-medium"
                  >
                    {t('home.upgradeForUnlimited')}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* URL Input Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="recipe-url" className="block text-sm font-medium text-gray-900 mb-2">
                {t('home.urlLabel')}
              </label>
              <div className="relative">
                <input
                  id="recipe-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={t('home.urlPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg text-gray-900 transition-colors"
                  required
                />
              </div>
            </div>

            <InstructionsInput
              value={instructions}
              onChange={setInstructions}
              locale={currentLocale}
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

                      <button
            type="submit"
            disabled={isLoading || !url.trim() || !user}
            className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-orange-700 focus:ring-4 focus:ring-orange-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{t('home.loading')}</span>
              </>
            ) : !user ? (
              <span>{t('home.signInToParse')}</span>
            ) : (
              <span>{t('home.simplifyButton')}</span>
            )}
          </button>
          </form>
        </div>

        {/* Saved Recipes Section */}
        {user && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-orange-600" />
                <h3 className="text-2xl font-bold text-gray-900">
                  {t('home.savedRecipes.title')}
                </h3>
                {!isPremium && (
                  <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                    {t('home.premium')}
                  </span>
                )}
              </div>
              {savedRecipes.length > 0 && isPremium && (
                <button
                  onClick={() => router.push(`/${currentLocale}/cookbook`)}
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  {t('home.savedRecipes.viewAll')}
                </button>
              )}
            </div>

            {loadingRecipes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                <span className="ml-2 text-gray-600">{t('common.loading')}</span>
              </div>
            ) : !isPremium ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-4">
                  {t('home.cookbookRequiresPremium')}
                </p>
                <p className="text-gray-400 mb-6">
                  {t('home.upgradeToSaveUnlimited')}
                </p>
                <Link 
                  href={`/${currentLocale}/upgrade`}
                  className="inline-flex items-center px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
                >
                  {t('home.upgradeToPremium')}
                </Link>
              </div>
            ) : savedRecipes.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {t('home.savedRecipes.empty')}
                </p>
                <p className="text-gray-400 mt-2">
                  {t('home.savedRecipes.emptyDescription')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                  >
                    {recipe.image && (
                      <div className="mb-3">
                        <img
                          src={recipe.image}
                          alt={recipe.title}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {recipe.title}
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {recipe.ingredients.length} {t('recipe.ingredients')}
                      </span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleViewRecipe(recipe)}
                          className="p-1 text-orange-600 hover:bg-orange-100 rounded"
                          title={t('recipe.view')}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecipe(recipe.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                          title={t('cookbook.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-orange-600 mb-3">
              <ChefHat className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('home.features.cleanRecipes.title')}
            </h3>
            <p className="text-gray-800">
              {t('home.features.cleanRecipes.description')}
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-orange-600 mb-3">
              <Globe className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('home.features.multiLanguage.title')}
            </h3>
            <p className="text-gray-800">
              {t('home.features.multiLanguage.description')}
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-orange-600 mb-3">
              <ChefHat className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('home.features.saveOrganize.title')}
            </h3>
            <p className="text-gray-600">
              {t('home.features.saveOrganize.description')}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
