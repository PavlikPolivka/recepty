# Recipe Simplifier

A micro SaaS web app that extracts clean, distraction-free recipes from any recipe URL. Built with Next.js, Supabase, and OpenAI.

## Features

- 🍳 **Clean Recipe Extraction**: Parse recipes from any URL using schema.org JSON-LD or OpenAI fallback
- 🌍 **Multi-language Support**: English and Czech (extensible)
- 💾 **Personal Cookbook**: Save and organize your favorite recipes
- 🔐 **Authentication**: Google login via Supabase
- 📱 **Responsive Design**: Beautiful UI with TailwindCSS
- ⚡ **Fast & Modern**: Built with Next.js App Router

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Google OAuth)
- **AI**: Google Gemini 1.5 Flash for recipe parsing
- **i18n**: next-intl
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Google AI API key (Gemini)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd recipe-simplifier
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # AI Provider
   GEMINI_API_KEY=your_gemini_api_key

   # Next.js
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret
   ```

4. **Set up Supabase Database**
   
   Run this SQL in your Supabase SQL editor:
   ```sql
   -- Create users table
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email TEXT UNIQUE NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create recipes table
   CREATE TABLE recipes (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     image TEXT,
     ingredients JSONB NOT NULL,
     steps JSONB NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Enable Row Level Security
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

   -- Create policies
   CREATE POLICY "Users can view own data" ON users
     FOR ALL USING (auth.uid() = id);

   CREATE POLICY "Users can view own recipes" ON recipes
     FOR ALL USING (auth.uid() = user_id);
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── [locale]/           # Internationalized routes
│   │   ├── home/          # Home page with URL input
│   │   ├── recipe/        # Recipe display page
│   │   └── cookbook/      # Saved recipes page
│   └── api/
│       └── parse-recipe/  # Recipe parsing API
├── lib/
│   ├── supabase/          # Supabase client config
│   └── recipe-parser.ts   # Recipe parsing logic
├── types/
│   └── database.ts        # TypeScript types
└── messages/              # Translation files
    ├── en.json
    └── cs.json
```

## Features Overview

### Recipe Parsing
- **Schema.org JSON-LD**: Primary method for structured recipe data
- **Gemini AI Fallback**: Uses Google Gemini 1.5 Flash when schema.org data isn't available
- **Smart Extraction**: Handles various recipe formats and websites

### Multi-language Support
- **English & Czech**: Fully translated interface
- **Extensible**: Easy to add more languages
- **URL-based**: `/en/` and `/cs/` routes

### Authentication
- **Google OAuth**: One-click sign-in via Supabase
- **Secure**: Row Level Security (RLS) policies
- **Persistent**: Sessions managed by Supabase

### Recipe Management
- **Save Recipes**: Store favorites in personal cookbook
- **Clean Display**: Distraction-free recipe view
- **Interactive**: Check off ingredients as you cook
- **Responsive**: Works on all devices

## Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Add environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `GEMINI_API_KEY` | Google AI API key for recipe parsing | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth | Yes |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Roadmap

### Phase 2 Features (Future)
- 🛒 **Shopping List Generation**: Group ingredients by category
- 📏 **Portion Scaling**: Scale recipes up or down
- 👨‍🍳 **Cooking Mode**: Step-by-step fullscreen cooking experience
- 🔄 **AI Substitutions**: Dietary alternatives and substitutions
- 📤 **Export/Share**: Share clean recipes with others
- 💳 **Monetization**: Free tier (3 parses/day) + Premium ($5-7/mo)

## Support

If you have any questions or need help, please open an issue on GitHub.

---

Built with ❤️ using Next.js, Supabase, and Google Gemini