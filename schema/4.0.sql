-- Admin system database migration
-- Version 4.0 - Database-based admin management

-- Add admin role to users table
ALTER TABLE public.users 
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE NOT NULL;

-- Create admin_actions table for audit trail
CREATE TABLE public.admin_actions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  admin_user_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  action_type text NOT NULL, -- 'grant_lifetime', 'add_subscription', 'revoke_access', etc.
  action_data jsonb, -- Store additional data about the action
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT admin_actions_pkey PRIMARY KEY (id),
  CONSTRAINT admin_actions_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT admin_actions_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Enable RLS on admin_actions
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_actions
CREATE POLICY "Admins can view all admin actions" ON public.admin_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can insert admin actions" ON public.admin_actions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_uuid AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to grant admin access
CREATE OR REPLACE FUNCTION grant_admin_access(target_user_uuid UUID, granted_by_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the person granting admin access is already an admin
  IF NOT is_user_admin(granted_by_uuid) THEN
    RAISE EXCEPTION 'Only admins can grant admin access';
  END IF;
  
  -- Grant admin access
  UPDATE public.users 
  SET is_admin = true 
  WHERE id = target_user_uuid;
  
  -- Log the action
  INSERT INTO public.admin_actions (admin_user_id, target_user_id, action_type, action_data)
  VALUES (granted_by_uuid, target_user_uuid, 'grant_admin', '{"granted_at": "now()"}');
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke admin access
CREATE OR REPLACE FUNCTION revoke_admin_access(target_user_uuid UUID, revoked_by_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the person revoking admin access is an admin
  IF NOT is_user_admin(revoked_by_uuid) THEN
    RAISE EXCEPTION 'Only admins can revoke admin access';
  END IF;
  
  -- Prevent self-revocation
  IF target_user_uuid = revoked_by_uuid THEN
    RAISE EXCEPTION 'Cannot revoke your own admin access';
  END IF;
  
  -- Revoke admin access
  UPDATE public.users 
  SET is_admin = false 
  WHERE id = target_user_uuid;
  
  -- Log the action
  INSERT INTO public.admin_actions (admin_user_id, target_user_id, action_type, action_data)
  VALUES (revoked_by_uuid, target_user_uuid, 'revoke_admin', '{"revoked_at": "now()"}');
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin users
CREATE OR REPLACE FUNCTION get_admin_users()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  last_sign_in TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email,
    u.created_at,
    u.last_sign_in_at
  FROM public.users u
  WHERE u.is_admin = true
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_user_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION grant_admin_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_admin_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_users() TO authenticated;
