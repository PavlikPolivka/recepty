'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ChefHat, ArrowLeft, CheckCircle } from 'lucide-react';
import { ParsedRecipe } from '@/types/database';

export default function DemoPage() {
  const locale = useLocale();
  const router = useRouter();
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());

  // Demo recipe data
  const demoRecipe: ParsedRecipe = {
    title: "Classic Spaghetti Carbonara",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=800&h=600&fit=crop",
    ingredients: [
      { name: "spaghetti", amount: "400", unit: "g" },
      { name: "pancetta or guanciale", amount: "200", unit: "g" },
      { name: "eggs", amount: "4", unit: "large" },
      { name: "pecorino romano cheese", amount: "100", unit: "g" },
      { name: "black pepper", amount: "1", unit: "tsp" },
      { name: "salt", amount: "1", unit: "tsp" }
    ],
    steps: [
      {
        step: 1,
        instruction: "Bring a large pot of salted water to boil and cook spaghetti according to package directions until al dente."
      },
      {
        step: 2,
        instruction: "While pasta cooks, cut pancetta into small cubes and cook in a large skillet over medium heat until crispy, about 5-7 minutes."
      },
      {
        step: 3,
        instruction: "In a bowl, whisk together eggs, grated pecorino cheese, and black pepper until well combined."
      },
      {
        step: 4,
        instruction: "Drain pasta, reserving 1 cup of pasta water. Add hot pasta to the skillet with pancetta and toss to combine."
      },
      {
        step: 5,
        instruction: "Remove skillet from heat and quickly add the egg mixture, tossing constantly. Add pasta water gradually until you get a creamy consistency."
      },
      {
        step: 6,
        instruction: "Serve immediately with extra pecorino cheese and black pepper on top."
      }
    ],
    servings: 4,
    prep_time: "10 minutes",
    cook_time: "15 minutes",
    total_time: "25 minutes"
  };

  const toggleIngredient = (index: number) => {
    const newChecked = new Set(checkedIngredients);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedIngredients(newChecked);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => router.push(`/${locale}/home`)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-orange-600" />
              <h1 className="text-xl font-bold text-gray-900">
                Demo Recipe
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Recipe Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Recipe Header */}
          <div className="p-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {demoRecipe.title}
            </h1>
            
            {demoRecipe.image && (
              <div className="mb-6">
                <img
                  src={demoRecipe.image}
                  alt={demoRecipe.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Recipe Meta */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {demoRecipe.servings && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <ChefHat className="h-5 w-5" />
                  <span>{demoRecipe.servings} servings</span>
                </div>
              )}
              {demoRecipe.prep_time && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>Prep: {demoRecipe.prep_time}</span>
                </div>
              )}
              {demoRecipe.total_time && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>Total: {demoRecipe.total_time}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 p-8">
            {/* Ingredients */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <ChefHat className="h-6 w-6 mr-2 text-orange-600" />
                Ingredients
              </h2>
              <div className="space-y-3">
                {demoRecipe.ingredients.map((ingredient, index) => (
                  <label
                    key={index}
                    className="flex items-start space-x-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={checkedIngredients.has(index)}
                      onChange={() => toggleIngredient(index)}
                      className="mt-1 h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span
                      className={`flex-1 ${
                        checkedIngredients.has(index)
                          ? 'line-through text-gray-500'
                          : 'text-gray-900 group-hover:text-orange-600'
                      }`}
                    >
                      {ingredient.amount && ingredient.unit
                        ? `${ingredient.amount} ${ingredient.unit} ${ingredient.name}`
                        : ingredient.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Instructions
              </h2>
              <div className="space-y-4">
                {demoRecipe.steps.map((step) => (
                  <div key={step.step} className="flex space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-semibold text-sm">
                      {step.step}
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {step.instruction}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Demo Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            🎉 Demo Mode
          </h3>
          <p className="text-blue-700 mb-4">
            This is a demo recipe showing how the Recipe Simplifier works. 
            Try checking off ingredients as you cook!
          </p>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push(`/${locale}/home`)}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
            >
              Try with Your Own Recipe
            </button>
            <button
              onClick={() => setCheckedIngredients(new Set())}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Reset Checkboxes
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
