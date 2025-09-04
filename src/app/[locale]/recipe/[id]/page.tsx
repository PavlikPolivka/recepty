'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ChefHat, Clock, Users, ArrowLeft, Save, Check, Printer, Share2 } from 'lucide-react';
import { ParsedRecipe } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface RecipePageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default function ShareableRecipePage({ params }: RecipePageProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [recipe, setRecipe] = useState<ParsedRecipe | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    
    const loadRecipe = async () => {
      try {
        const resolvedParams = await params;
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .eq('id', resolvedParams.id)
          .single();

        if (error) {
          setError('Recipe not found');
          return;
        }

        if (data) {
          setRecipe({
            title: data.title,
            image: data.image,
            ingredients: data.ingredients,
            steps: data.steps,
            servings: data.servings,
            prep_time: data.prep_time,
            cook_time: data.cook_time,
            total_time: data.total_time
          });
        } else {
          setError('Recipe not found');
        }
      } catch (err) {
        setError('Failed to load recipe');
      } finally {
        setLoading(false);
      }
    };

    loadRecipe();
  }, [params]);

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
    if (!user || !recipe) return;

    setSaving(true);
    try {
      const supabase = createClient();
      
      // Ensure user exists
      const { error: userError } = await supabase.rpc('ensure_user_exists', {
        user_uuid: user.id,
        user_email: user.email || ''
      });

      if (userError) {
        console.error('Error ensuring user exists:', userError);
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
          total_time: recipe.total_time
        });

      if (error) throw error;
      setSaved(true);
    } catch (error) {
      console.error('Error saving recipe:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: recipe?.title || 'Recipe',
          text: `Check out this recipe: ${recipe?.title}`,
          url: window.location.href,
        });
      } else if (navigator.clipboard) {
        // Fallback to copying URL
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch (err) {
      console.error('Error sharing recipe:', err);
      // Silent fail for share errors
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('recipe.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('recipe.notFound')}</h1>
          <p className="text-gray-600 mb-6">{error || t('recipe.notFoundDescription')}</p>
          <button
            onClick={() => router.push(`/${locale}/home`)}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            {t('recipe.backToHome')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="recipe-print-container max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="recipe-print-header flex items-center justify-between mb-4 no-print">
          <button
            onClick={() => router.push(`/${locale}/home`)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {t('recipe.back')}
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleShare}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Share2 className="h-5 w-5 mr-2" />
              {t('recipe.share')}
            </button>
            
            <button
              onClick={handlePrint}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Printer className="h-5 w-5 mr-2" />
              {t('recipe.print')}
            </button>
            
            {!authLoading && user && (
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className="flex items-center bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : saved ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saved ? t('recipe.saved') : t('recipe.save')}
              </button>
            )}
          </div>
        </div>

        {/* Recipe Title */}
        <div className="recipe-print-title text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
          {recipe.image && (
            <div className="recipe-print-image">
              <img
                src={recipe.image}
                alt={recipe.title}
                className="w-full h-48 object-cover rounded-lg mx-auto"
              />
            </div>
          )}
        </div>

        {/* Meta Information */}
        <div className="recipe-print-meta flex flex-wrap gap-4 text-sm mb-6">
          {recipe.servings && (
            <div className="flex items-center text-gray-700">
              <Users className="h-4 w-4 mr-2" />
              {recipe.servings} {t('recipe.servings')}
            </div>
          )}
          {recipe.prep_time && (
            <div className="flex items-center text-gray-700">
              <Clock className="h-4 w-4 mr-2" />
              {t('recipe.prepTime')}: {recipe.prep_time}
            </div>
          )}
          {recipe.cook_time && (
            <div className="flex items-center text-gray-700">
              <Clock className="h-4 w-4 mr-2" />
              {t('recipe.cookTime')}: {recipe.cook_time}
            </div>
          )}
          {recipe.total_time && (
            <div className="flex items-center text-gray-700">
              <Clock className="h-4 w-4 mr-2" />
              {t('recipe.totalTime')}: {recipe.total_time}
            </div>
          )}
        </div>

        {/* Recipe Content */}
        <div className="recipe-print-content grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Ingredients */}
          <div className="recipe-print-ingredients">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <ChefHat className="h-5 w-5 mr-2" />
              {t('recipe.ingredients')}
            </h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-start">
                  <input
                    type="checkbox"
                    checked={checkedIngredients.has(index)}
                    onChange={() => toggleIngredient(index)}
                    className="mt-1 mr-3 h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-gray-800">
                    {typeof ingredient === 'string' 
                      ? ingredient 
                      : `${ingredient.amount || ''} ${ingredient.unit || ''} ${ingredient.name}`.trim()
                    }
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div className="recipe-print-instructions">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <ChefHat className="h-5 w-5 mr-2" />
              {t('recipe.instructions')}
            </h2>
            <ol className="space-y-3">
              {recipe.steps.map((step, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-gray-800">{step.instruction}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
