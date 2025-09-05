-- Subscription and usage tracking schema
-- Version 2.0 - Monetization features

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text NOT NULL DEFAULT 'inactive', -- 'active', 'inactive', 'canceled', 'past_due'
  plan text NOT NULL DEFAULT 'free', -- 'free', 'premium'
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT subscriptions_user_id_key UNIQUE (user_id)
);

-- Create usage tracking table
CREATE TABLE public.usage_tracking (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  recipes_parsed integer NOT NULL DEFAULT 0,
  customizations_used integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT usage_tracking_pkey PRIMARY KEY (id),
  CONSTRAINT usage_tracking_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT usage_tracking_user_date_key UNIQUE (user_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for usage tracking
CREATE POLICY "Users can view their own usage" ON public.usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" ON public.usage_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON public.usage_tracking
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to get user subscription status
CREATE OR REPLACE FUNCTION get_user_subscription(user_uuid UUID)
RETURNS TABLE(
  is_premium BOOLEAN,
  status TEXT,
  plan TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN s.status = 'active' AND s.plan = 'premium' THEN true
      ELSE false
    END as is_premium,
    COALESCE(s.status, 'inactive') as status,
    COALESCE(s.plan, 'free') as plan,
    s.current_period_end
  FROM subscriptions s
  WHERE s.user_id = user_uuid
  LIMIT 1;
  
  -- If no subscription found, return free plan
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'inactive', 'free', NULL::timestamp with time zone;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user daily usage
CREATE OR REPLACE FUNCTION get_user_daily_usage(user_uuid UUID, usage_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
  recipes_parsed INTEGER,
  customizations_used INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ut.recipes_parsed, 0) as recipes_parsed,
    COALESCE(ut.customizations_used, 0) as customizations_used
  FROM usage_tracking ut
  WHERE ut.user_id = user_uuid AND ut.date = usage_date
  LIMIT 1;
  
  -- If no usage found for today, return zeros
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
  user_uuid UUID,
  usage_date DATE DEFAULT CURRENT_DATE,
  recipes_count INTEGER DEFAULT 0,
  customizations_count INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO usage_tracking (user_id, date, recipes_parsed, customizations_used)
  VALUES (user_uuid, usage_date, recipes_count, customizations_count)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    recipes_parsed = usage_tracking.recipes_parsed + EXCLUDED.recipes_parsed,
    customizations_used = usage_tracking.customizations_used + EXCLUDED.customizations_used,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can parse recipe
CREATE OR REPLACE FUNCTION can_parse_recipe(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_premium BOOLEAN;
  daily_usage INTEGER;
  max_recipes INTEGER;
BEGIN
  -- Get subscription status
  SELECT get_user_subscription.is_premium INTO is_premium
  FROM get_user_subscription(user_uuid);
  
  -- Get today's usage
  SELECT get_user_daily_usage.recipes_parsed INTO daily_usage
  FROM get_user_daily_usage(user_uuid);
  
  -- Set limits based on subscription
  IF is_premium THEN
    max_recipes := 999999; -- Unlimited for premium
  ELSE
    max_recipes := 3; -- 3 per day for free users
  END IF;
  
  RETURN daily_usage < max_recipes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can use customizations
CREATE OR REPLACE FUNCTION can_use_customizations(user_uuid UUID, requested_count INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  is_premium BOOLEAN;
  daily_usage INTEGER;
  max_customizations INTEGER;
BEGIN
  -- Get subscription status
  SELECT get_user_subscription.is_premium INTO is_premium
  FROM get_user_subscription(user_uuid);
  
  -- Get today's usage
  SELECT get_user_daily_usage.customizations_used INTO daily_usage
  FROM get_user_daily_usage(user_uuid);
  
  -- Set limits based on subscription
  IF is_premium THEN
    max_customizations := 999999; -- Unlimited for premium
  ELSE
    max_customizations := 3; -- 3 per day for free users
  END IF;
  
  RETURN (daily_usage + requested_count) <= max_customizations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
