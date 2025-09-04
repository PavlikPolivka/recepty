# Recipe Simplifier Setup Guide

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   Create a `.env.local` file in the root directory with:
   ```env
   # Supabase (get these from your Supabase project settings)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Google AI (get from Google AI Studio)
   GEMINI_API_KEY=your_gemini_api_key

   # Next.js
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_random_secret_string
   ```

3. **Set up Supabase Database**
   
   Go to your Supabase project SQL editor and run the contents of `schema/1.0.sql`:
   ```bash
   # Copy the schema file content and paste it into Supabase SQL editor
   cat schema/1.0.sql
   ```
   
   Or manually run the SQL from the schema file which includes:
   - Users and recipes tables
   - Row Level Security policies
   - Automatic user creation trigger
   - Function to ensure user exists

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Features Available

✅ **Home Page**: URL input with language switcher (EN/CS)  
✅ **Recipe Parsing**: Schema.org JSON-LD + Gemini AI fallback  
✅ **Recipe Display**: Clean UI with ingredients and steps  
✅ **Multi-language**: English and Czech translations  
✅ **Responsive Design**: Works on all devices  

## Next Steps (To Complete MVP)

🔄 **Authentication**: Add Supabase Google login  
🔄 **Cookbook**: Save and manage recipes  
🔄 **Database Integration**: Connect to Supabase  

## Testing Recipe Parsing

Try these recipe URLs to test the parsing:
- https://www.allrecipes.com/recipe/213742/cheesy-chicken-broccoli-casserole/
- https://www.foodnetwork.com/recipes/alton-brown/baked-macaroni-and-cheese-recipe-1939524
- https://www.bbcgoodfood.com/recipes/classic-spaghetti-carbonara-recipe

## Troubleshooting

- **TypeScript errors**: The i18n configuration may show TypeScript warnings but should work fine
- **Recipe parsing fails**: Check your Gemini API key and ensure you have credits
- **Database errors**: Verify your Supabase credentials and database setup
