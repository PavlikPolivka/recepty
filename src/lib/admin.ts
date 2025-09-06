import { createServiceClient } from './supabase/service';

// Check if a user is admin by their user ID
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc('is_user_admin', {
      user_uuid: userId
    });
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.error('Error in isUserAdmin:', error);
    return false;
  }
}

// Check if a user is admin by their email (for backward compatibility)
export async function isAdminUserByEmail(email: string | undefined): Promise<boolean> {
  if (!email) {
    return false;
  }
  
  try {
    const supabase = createServiceClient();
    
    // First get the user by email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, is_admin')
      .eq('email', email.toLowerCase())
      .single();
    
    if (userError || !userData) {
      return false;
    }
    
    // Check admin status directly from the user data
    return userData.is_admin === true;
  } catch (error) {
    console.error('Error in isAdminUserByEmail:', error);
    return false;
  }
}

// Legacy function for backward compatibility
export function isAdminUser(email: string | undefined): boolean {
  // This is now async, but we'll keep it for compatibility
  // The actual check should be done in the API routes
  console.warn('isAdminUser is deprecated, use isAdminUserByEmail instead');
  return false;
}

// DEPRECATED: getAdminKey function removed
// Admin access is now controlled via database is_admin column
// No environment variable needed for admin access
