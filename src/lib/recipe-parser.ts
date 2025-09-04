import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedRecipe, Ingredient, RecipeStep } from '@/types/database';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function parseRecipeFromUrl(url: string, locale: string = 'en'): Promise<ParsedRecipe> {
  try {
    // First, try to fetch the page and look for schema.org JSON-LD
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RecipeSimplifier/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Try to find schema.org Recipe JSON-LD
    const jsonLdScripts = $('script[type="application/ld+json"]');
    let recipeData: Record<string, unknown> | null = null;

    jsonLdScripts.each((_, script) => {
      try {
        const jsonData = JSON.parse($(script).html() || '');
        if (Array.isArray(jsonData)) {
          recipeData = jsonData.find((item: Record<string, unknown>) => item['@type'] === 'Recipe');
        } else if (jsonData['@type'] === 'Recipe') {
          recipeData = jsonData;
        }
      } catch {
        // Ignore invalid JSON
      }
    });

    if (recipeData) {
      return parseSchemaOrgRecipe(recipeData);
    }

    // Fallback to Gemini AI parsing
    return await parseWithGemini(html, url, locale);
  } catch (error) {
    console.error('Error parsing recipe:', error);
    throw new Error('Failed to parse recipe. Please check your Gemini API key and try again.');
  }
}

function parseSchemaOrgRecipe(data: Record<string, unknown>): ParsedRecipe {
  const ingredients: Ingredient[] = [];
  
  if (data.recipeIngredient && Array.isArray(data.recipeIngredient)) {
    (data.recipeIngredient as string[]).forEach((ingredient: string) => {
      // Simple parsing - could be improved
      const parts = ingredient.split(' ');
      if (parts.length >= 2) {
        ingredients.push({
          amount: parts[0],
          unit: parts[1],
          name: parts.slice(2).join(' '),
        });
      } else {
        ingredients.push({
          name: ingredient,
        });
      }
    });
  }

  const steps: RecipeStep[] = [];
  if (data.recipeInstructions && Array.isArray(data.recipeInstructions)) {
    (data.recipeInstructions as (string | { text: string })[]).forEach((instruction: string | { text: string }, index: number) => {
      if (typeof instruction === 'string') {
        steps.push({
          step: index + 1,
          instruction: instruction,
        });
      } else if (instruction && typeof instruction === 'object' && 'text' in instruction) {
        steps.push({
          step: index + 1,
          instruction: instruction.text,
        });
      }
    });
  }

  return {
    title: (data.name as string) || 'Untitled Recipe',
    image: Array.isArray(data.image) ? (data.image[0] as string) : (data.image as string),
    ingredients,
    steps,
    servings: data.recipeYield as number,
    prep_time: data.prepTime as string,
    cook_time: data.cookTime as string,
    total_time: data.totalTime as string,
  };
}

async function parseWithGemini(html: string, url: string, locale: string = 'en'): Promise<ParsedRecipe> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }
  
  const $ = cheerio.load(html);
  
  // Extract text content, focusing on likely recipe areas
  const title = $('h1').first().text().trim() || $('title').text().trim();
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  
  // Limit text length for Gemini
  const truncatedText = bodyText.substring(0, 8000);

  // Language mapping for output
  const languageNames = {
    en: 'English',
    cs: 'Czech'
  };

  const outputLanguage = languageNames[locale as keyof typeof languageNames] || 'English';

  const prompt = `Extract recipe information from this Czech recipe and return it as JSON. Focus on finding the recipe title, ingredients list, and step-by-step instructions.

IMPORTANT: Return all text content (title, ingredient names, instructions, time values) in ${outputLanguage} language.

URL: ${url}
Title: ${title}

Content: ${truncatedText}

Return JSON in this exact format:
{
  "title": "Recipe Title in ${outputLanguage}",
  "image": "image_url_if_available",
  "ingredients": [
    {"name": "ingredient name in ${outputLanguage}", "amount": "1", "unit": "cup"},
    {"name": "another ingredient in ${outputLanguage}", "amount": "2", "unit": "tbsp"}
  ],
  "steps": [
    {"step": 1, "instruction": "First step instruction in ${outputLanguage}"},
    {"step": 2, "instruction": "Second step instruction in ${outputLanguage}"}
  ],
  "servings": 4,
  "prepTime": "15 minutes",
  "cookTime": "30 minutes",
  "totalTime": "45 minutes"
}

Only return valid JSON, no other text.`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    if (!responseText) {
      throw new Error('No response from Gemini');
    }

    // Clean the response text to remove markdown formatting
    let cleanResponse = responseText.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const recipeData = JSON.parse(cleanResponse);
    
    // Validate and clean the data
    return {
      title: recipeData.title || 'Untitled Recipe',
      image: recipeData.image || undefined,
      ingredients: Array.isArray(recipeData.ingredients) ? recipeData.ingredients : [],
      steps: Array.isArray(recipeData.steps) ? recipeData.steps : [],
      servings: recipeData.servings,
      prep_time: recipeData.prepTime,
      cook_time: recipeData.cookTime,
      total_time: recipeData.totalTime,
    };
  } catch (error) {
    console.error('Gemini parsing error:', error);
    throw new Error('Failed to parse recipe with Gemini');
  }
}

