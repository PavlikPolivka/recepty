'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ChefHat, Clock, Users, ArrowLeft, Save, Check, Printer } from 'lucide-react';
import { ParsedRecipe } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

export default function RecipePage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<ParsedRecipe | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Only access sessionStorage on the client side
    if (typeof window !== 'undefined') {
      const storedRecipe = sessionStorage.getItem('currentRecipe');
      if (storedRecipe) {
        setRecipe(JSON.parse(storedRecipe));
      } else {
        router.push(`/${locale}/home`);
      }
    }
  }, [locale, router]);

  const toggleIngredient = (index: number) => {
    const newChecked = new Set(checkedIngredients);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedIngredients(newChecked);
  };

  const handleSave = async () => {
    if (!user) {
      // Redirect to home page to sign in
      router.push(`/${locale}/home`);
      return;
    }

    if (!recipe) return;

    setSaving(true);
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
      
      const { error } = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          title: recipe.title,
          image: recipe.image,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          servings: recipe.servings,
          prep_time: recipe.prep_time,
          cook_time: recipe.cook_time,
          total_time: recipe.total_time,
        });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving recipe:', error);
      // You could add a toast notification here
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{t('recipe.loadingRecipe')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm no-print">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => router.push(`/${locale}/home`)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>{t('recipe.back')}</span>
            </button>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePrint}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <Printer className="h-4 w-4" />
                <span>{t('recipe.print')}</span>
              </button>
              
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  saved
                    ? 'bg-green-100 text-green-700'
                    : user
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                }`}
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
                ) : saved ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>
                  {saving
                    ? t('common.loading')
                    : saved
                    ? t('recipe.saved')
                    : user
                    ? t('recipe.saveRecipe')
                    : t('auth.signInRequired')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Recipe Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 recipe-print-container">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Recipe Header */}
          <div className="p-6 border-b border-gray-200 recipe-print-header">
            <h1 className="text-2xl font-bold text-gray-900 mb-3 recipe-print-title">
              {recipe.title}
            </h1>
            
            {recipe.image && (
              <div className="mb-4">
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-48 object-cover rounded-lg recipe-print-image"
                />
              </div>
            )}

            {/* Recipe Meta */}
            <div className="flex flex-wrap gap-4 text-sm recipe-print-meta">
              {recipe.servings && (
                <div className="flex items-center space-x-2 text-gray-700">
                  <Users className="h-4 w-4" />
                  <span>{recipe.servings} {t('recipe.servings')}</span>
                </div>
              )}
              {recipe.prep_time && (
                <div className="flex items-center space-x-2 text-gray-700">
                  <Clock className="h-4 w-4" />
                  <span>{t('recipe.prepTime')}: {recipe.prep_time}</span>
                </div>
              )}
              {recipe.cook_time && (
                <div className="flex items-center space-x-2 text-gray-700">
                  <Clock className="h-4 w-4" />
                  <span>{t('recipe.cookTime')}: {recipe.cook_time}</span>
                </div>
              )}
              {recipe.total_time && (
                <div className="flex items-center space-x-2 text-gray-700">
                  <Clock className="h-4 w-4" />
                  <span>{t('recipe.totalTime')}: {recipe.total_time}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 p-6 recipe-print-content">
            {/* Ingredients */}
            <div className="recipe-print-ingredients">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <ChefHat className="h-5 w-5 mr-2 text-orange-600" />
                {t('recipe.ingredients')}
              </h2>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start space-x-3 cursor-pointer group py-1">
                    <input
                      type="checkbox"
                      checked={checkedIngredients.has(index)}
                      onChange={() => toggleIngredient(index)}
                      className="mt-1 h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span
                      className={`flex-1 text-sm ${
                        checkedIngredients.has(index)
                          ? 'line-through text-gray-500'
                          : 'text-gray-800 group-hover:text-orange-600'
                      }`}
                    >
                      {ingredient.amount && ingredient.unit
                        ? `${ingredient.amount} ${ingredient.unit} ${ingredient.name}`
                        : ingredient.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div className="recipe-print-instructions">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {t('recipe.instructions')}
              </h2>
              <div className="space-y-3">
                {recipe.steps.map((step) => (
                  <div key={step.step} className="flex space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-semibold text-xs recipe-print-step-number">
                      {step.step}
                    </div>
                    <p className="text-gray-800 leading-relaxed text-sm recipe-print-step-text">
                      {step.instruction}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
