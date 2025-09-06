import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedRecipe } from '@/types/database';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function parseRecipeFromUrl(url: string, locale: string = 'en', instructions: string = ''): Promise<ParsedRecipe> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RecipeSimplifier/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();

    // Always use Gemini AI parsing for consistent tag generation
    return await parseWithGemini(html, url, locale, instructions);
  } catch (error) {
    console.error('Error parsing recipe:', error);
    throw new Error('Failed to parse recipe. Please check your Gemini API key and try again.');
  }
}


function extractBestImage($: cheerio.Root, url: string): string | undefined {
  try {
    const baseUrl = new URL(url).origin;
    
    // Helper function to make URLs absolute
    const makeAbsolute = (src: string) => {
      try {
        if (src.startsWith('http')) return src;
        if (src.startsWith('//')) return `https:${src}`;
        if (src.startsWith('/')) return `${baseUrl}${src}`;
        return `${baseUrl}/${src}`;
      } catch (error) {
        console.error('Error making URL absolute:', error, 'src:', src);
        return src; // Return original if we can't make it absolute
      }
    };

  // Helper function to check if image is likely a recipe image
  const isRecipeImage = (src: string, alt: string = '') => {
    const recipeKeywords = ['recipe', 'food', 'dish', 'meal', 'cooking', 'kitchen', 'ingredient'];
    const altLower = alt.toLowerCase();
    return recipeKeywords.some(keyword => altLower.includes(keyword)) || 
           src.toLowerCase().includes('recipe') ||
           src.toLowerCase().includes('food');
  };

  // Try multiple strategies to find the best image
  const candidates: { src: string; priority: number; alt: string }[] = [];

  // 1. Look for Open Graph images (highest priority)
  $('meta[property="og:image"]').each((_, el) => {
    const content = $(el).attr('content');
    if (content && content.trim()) {
      candidates.push({ src: makeAbsolute(content), priority: 1, alt: '' });
    }
  });

  // 2. Look for Twitter Card images
  $('meta[name="twitter:image"]').each((_, el) => {
    const content = $(el).attr('content');
    if (content && content.trim()) {
      candidates.push({ src: makeAbsolute(content), priority: 2, alt: '' });
    }
  });

  // 3. Look for images with recipe-related alt text or src
  $('img').each((_, el) => {
    const src = $(el).attr('src');
    const alt = $(el).attr('alt') || '';
    if (src && src.trim() && isRecipeImage(src, alt)) {
      candidates.push({ src: makeAbsolute(src), priority: 3, alt });
    }
  });

  // 4. Look for images in recipe-specific containers
  $('[class*="recipe"], [class*="food"], [class*="dish"], [id*="recipe"], [id*="food"]').find('img').each((_, el) => {
    const src = $(el).attr('src');
    const alt = $(el).attr('alt') || '';
    if (src && src.trim()) {
      candidates.push({ src: makeAbsolute(src), priority: 4, alt });
    }
  });

  // 5. Look for large images (likely hero images)
  $('img').each((_, el) => {
    const src = $(el).attr('src');
    const alt = $(el).attr('alt') || '';
    const width = $(el).attr('width');
    const height = $(el).attr('height');
    
    if (src && src.trim() && ((width && parseInt(width) > 300) || (height && parseInt(height) > 300))) {
      candidates.push({ src: makeAbsolute(src), priority: 5, alt });
    }
  });

  // 6. Look for any image with reasonable size
  $('img').each((_, el) => {
    const src = $(el).attr('src');
    const alt = $(el).attr('alt') || '';
    if (src && src.trim() && !candidates.some(c => c.src === makeAbsolute(src))) {
      candidates.push({ src: makeAbsolute(src), priority: 6, alt });
    }
  });

  // Sort by priority and return the best candidate
  candidates.sort((a, b) => a.priority - b.priority);
  
  // Filter out common non-recipe images
  const filteredCandidates = candidates.filter(candidate => {
    const src = candidate.src.toLowerCase();
    return !src.includes('logo') && 
           !src.includes('icon') && 
           !src.includes('avatar') && 
           !src.includes('profile') &&
           !src.includes('banner') &&
           !src.includes('ad') &&
           !src.includes('advertisement');
  });

  return filteredCandidates[0]?.src;
  } catch (error) {
    console.error('Error extracting image:', error);
    return undefined;
  }
}

async function parseWithGemini(html: string, url: string, locale: string = 'en', instructions: string = ''): Promise<ParsedRecipe> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }
  
  const $ = cheerio.load(html);
  
  // Extract text content, focusing on likely recipe areas
  const title = $('h1').first().text().trim() || $('title').text().trim();
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  
  // Extract the best image using our improved method
  const extractedImage = extractBestImage($, url);
  
  // Limit text length for Gemini
  const truncatedText = bodyText.substring(0, 8000);

  // Language mapping for output
  const languageNames = {
    en: 'English',
    cs: 'Czech'
  };

  const outputLanguage = languageNames[locale as keyof typeof languageNames] || 'English';

  const instructionsText = instructions.trim() 
    ? `\n\nCUSTOM INSTRUCTIONS: ${instructions}\nPlease follow these instructions when processing the recipe.`
    : '';

  const prompt = `Extract recipe information from this recipe and return it as JSON. Focus on finding the recipe title, ingredients list, and step-by-step instructions.

IMPORTANT: Return all text content (title, ingredient names, instructions, time values) in ${outputLanguage} language.

URL: ${url}
Title: ${title}
${extractedImage ? `Image: ${extractedImage}` : ''}

Content: ${truncatedText}${instructionsText}

Return JSON in this exact format:
{
  "title": "Recipe Title in ${outputLanguage}",
  "image": "${extractedImage || ''}",
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

