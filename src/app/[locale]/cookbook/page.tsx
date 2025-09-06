'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ChefHat, Plus, Trash2, Eye, Search, X } from 'lucide-react';
import { SavedRecipe } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { createClient } from '@/lib/supabase/client';

export default function CookbookPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  
  // Check if user has active premium subscription
  const isPremium = subscription?.is_premium && subscription?.status === 'active';
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter recipes based on search term
  const filteredRecipes = recipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.ingredients.some(ingredient => {
      const ingredientText = typeof ingredient === 'string' 
        ? ingredient 
        : `${ingredient.amount || ''} ${ingredient.unit || ''} ${ingredient.name}`.trim();
      return ingredientText.toLowerCase().includes(searchTerm.toLowerCase());
    })
  );

  const clearSearch = () => {
    setSearchTerm('');
  };

  useEffect(() => {
    const loadRecipes = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

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
          .order('created_at', { ascending: false });

        if (error) throw error;

        setRecipes(data || []);
      } catch (error) {
        console.error('Error loading recipes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, [user]);

  const handleViewRecipe = (recipe: SavedRecipe) => {
    // Navigate to the shareable recipe URL
    router.push(`/${locale}/recipe/${recipe.id}`);
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

      setRecipes(recipes.filter(recipe => recipe.id !== recipeId));
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

  if (authLoading || loading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <ChefHat className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('cookbook.title')}
          </h1>
          <p className="text-gray-600 mb-6">
            {t('auth.signInRequired')}
          </p>
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

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <ChefHat className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('cookbook.title')}
          </h1>
          <p className="text-gray-600 mb-6">
            {t('home.cookbookRequiresPremium')}
          </p>
          <p className="text-gray-500 mb-6">
            {t('home.upgradeToSaveUnlimited')}
          </p>
          <button
            onClick={() => router.push(`/${locale}/upgrade`)}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
          >
            {t('home.upgradeToPremium')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-orange-600" />
              <h1 className="text-xl font-bold text-gray-900">
                {t('cookbook.title')}
              </h1>
            </div>
            
            <button
              onClick={() => router.push(`/${locale}/home`)}
              className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
            >
              <Plus className="h-4 w-4" />
              <span>{t('cookbook.addRecipe')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('cookbook.searchPlaceholder')}
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {searchTerm ? t('cookbook.noResults') : t('cookbook.empty')}
            </h2>
            <p className="text-gray-600 mb-8">
              {searchTerm 
                ? t('cookbook.noResultsDescription', { searchTerm })
                : t('cookbook.emptyDescription')
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => router.push(`/${locale}/home`)}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700"
              >
                {t('cookbook.startAdding')}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {recipe.image && (
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {recipe.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {recipe.ingredients.length} {t('recipe.ingredients')}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewRecipe(recipe)}
                        className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg"
                        title={t('recipe.view')}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRecipe(recipe.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                        title={t('cookbook.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
