-- Add lifetime access support to subscriptions table
-- This migration adds a 'lifetime' plan type and updates the subscription logic

-- Add lifetime plan support to the can_parse_recipe function
CREATE OR REPLACE FUNCTION can_parse_recipe(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan TEXT;
  parsed_today INTEGER;
  max_recipes INTEGER;
BEGIN
  SELECT plan INTO user_plan FROM public.subscriptions WHERE user_id = user_uuid;
  SELECT recipes_parsed INTO parsed_today FROM public.get_user_daily_usage(user_uuid);

  IF user_plan = 'premium' OR user_plan = 'lifetime' THEN
    max_recipes := 999999; -- Effectively unlimited
  ELSE
    max_recipes := 3;
  END IF;

  RETURN parsed_today < max_recipes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add lifetime plan support to the can_use_customizations function
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
    max_customizations := 999999; -- Unlimited for premium and lifetime
  ELSE
    max_customizations := 3; -- 3 per day for free users
  END IF;
  
  RETURN (daily_usage + requested_count) <= max_customizations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_user_subscription function to include lifetime
CREATE OR REPLACE FUNCTION get_user_subscription(user_uuid UUID)
RETURNS TABLE(is_premium BOOLEAN, status TEXT, plan TEXT, current_period_end TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (s.plan = 'premium' OR s.plan = 'lifetime') AS is_premium,
    s.status,
    s.plan,
    s.current_period_end
  FROM
    public.subscriptions s
  WHERE
    s.user_id = user_uuid;
END;
$$;

-- Function to grant lifetime access to a user
CREATE OR REPLACE FUNCTION grant_lifetime_access(user_uuid UUID, granted_by TEXT DEFAULT 'admin')
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert or update subscription to lifetime
  INSERT INTO public.subscriptions (
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    status,
    plan,
    current_period_start,
    current_period_end,
    created_at,
    updated_at
  ) VALUES (
    user_uuid,
    'lifetime_' || user_uuid, -- Special identifier for lifetime users
    'lifetime_' || user_uuid,
    'active',
    'lifetime',
    now(),
    '2099-12-31 23:59:59+00'::timestamp with time zone, -- Far future date
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    plan = 'lifetime',
    status = 'active',
    current_period_end = '2099-12-31 23:59:59+00'::timestamp with time zone,
    updated_at = now();
    
  -- Log the grant action (optional)
  INSERT INTO public.usage_tracking (user_id, date, recipes_parsed, customizations_used)
  VALUES (user_uuid, now()::date, 0, 0)
  ON CONFLICT (user_id, date) DO NOTHING;
END;
$$;

-- Function to check if user has lifetime access
CREATE OR REPLACE FUNCTION has_lifetime_access(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  user_plan TEXT;
BEGIN
  SELECT plan INTO user_plan FROM public.subscriptions WHERE user_id = user_uuid;
  RETURN user_plan = 'lifetime';
END;
$$;
