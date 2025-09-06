-- Add cancel_at_period_end column to subscriptions table
-- Version 5.0 - Subscription cancellation tracking

-- Add cancel_at_period_end column
ALTER TABLE public.subscriptions 
ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Drop the existing function first
DROP FUNCTION IF EXISTS get_user_subscription(UUID);

-- Recreate the get_user_subscription function to include cancel_at_period_end
CREATE FUNCTION get_user_subscription(user_uuid UUID)
RETURNS TABLE(
  is_premium BOOLEAN,
  status TEXT,
  plan TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN,
  updated_at TIMESTAMP WITH TIME ZONE
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
    s.current_period_end,
    COALESCE(s.cancel_at_period_end, false) as cancel_at_period_end,
    s.updated_at
  FROM subscriptions s
  WHERE s.user_id = user_uuid
  LIMIT 1;
  
  -- If no subscription found, return free plan
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'inactive', 'free', NULL::timestamp with time zone, false, NULL::timestamp with time zone;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
