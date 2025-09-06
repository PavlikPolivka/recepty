'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ChefHat, Clock, Users, ArrowLeft, Check, Printer, Share2, Edit2, X } from 'lucide-react';
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
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<ParsedRecipe | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  useEffect(() => {
    
    const loadRecipe = async () => {
      try {
        const resolvedParams = await params;
        const supabase = createClient();
        
        const { data, error: fetchError } = await supabase
          .from('recipes')
          .select('*')
          .eq('id', resolvedParams.id)
          .single();

        if (fetchError) {
          setError('Recipe not found');
          return;
        }

        if (data) {
          setRecipe({
            id: data.id,
            user_id: data.user_id,
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
      } catch {
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
    } catch {
      // Silent fail for share errors
    }
  };

  const startEditingTitle = () => {
    if (recipe) {
      setEditedTitle(recipe.title);
      setIsEditingTitle(true);
    }
  };

  const saveTitle = async () => {
    if (recipe && editedTitle.trim() && user && recipe.id && recipe.user_id === user.id) {
      const updatedRecipe = { ...recipe, title: editedTitle.trim() };
      setRecipe(updatedRecipe);
      
      try {
        const supabase = createClient();
        const { error: updateError } = await supabase
          .from('recipes')
          .update({ title: editedTitle.trim() })
          .eq('id', recipe.id)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } catch (updateError) {
        console.error('Error updating recipe title:', updateError);
        // Revert the change on error
        setRecipe(recipe);
      }
      
      setIsEditingTitle(false);
    }
  };

  const cancelEditingTitle = () => {
    setEditedTitle('');
    setIsEditingTitle(false);
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTitle();
    } else if (e.key === 'Escape') {
      cancelEditingTitle();
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
            
          </div>
        </div>

        {/* Recipe Title */}
        <div className="recipe-print-title text-center mb-6">
          <div className="mb-2">
            {isEditingTitle ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={handleTitleKeyPress}
                  className="text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-orange-500 focus:outline-none focus:border-orange-600 text-center w-full"
                  autoFocus
                />
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={saveTitle}
                    className="p-2 text-green-600 hover:bg-green-100 rounded"
                    title={t('common.save')}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={cancelEditingTitle}
                    className="p-2 text-red-600 hover:bg-red-100 rounded"
                    title={t('common.cancel')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <h1 className="text-3xl font-bold text-gray-900">{recipe.title}</h1>
                {user && recipe.id && recipe.user_id === user.id && (
                  <button
                    onClick={startEditingTitle}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded no-print"
                    title={t('recipe.editTitle')}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
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
