-- Recipe Simplifier Database Schema v1.0
-- This schema creates the necessary tables and triggers for the Recipe Simplifier app

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
  servings INTEGER,
  prep_time TEXT,
  cook_time TEXT,
  total_time TEXT,
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

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user record
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to ensure user exists (for existing users)
CREATE OR REPLACE FUNCTION public.ensure_user_exists(user_uuid UUID, user_email TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (user_uuid, user_email)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
