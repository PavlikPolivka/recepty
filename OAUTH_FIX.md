# Fix OAuth Redirect Issue

## Problem
When logging in on the production domain `recept.ppolivka.com`, users are redirected to `localhost` instead of staying on the production domain.

## Solution

### 1. Update Supabase Dashboard Settings

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Update the following settings:

   **Site URL:**
   ```
   https://recept.ppolivka.com
   ```

   **Redirect URLs (add both):**
   ```
   https://recept.ppolivka.com/auth/callback
   http://localhost:3000/auth/callback
   ```

### 2. Update Environment Variables

Make sure your production environment has the correct environment variable:

```bash
NEXT_PUBLIC_APP_URL=https://recept.ppolivka.com
```

### 3. Deploy the Updated Code

The code has been updated to:
- Pass the current locale in the OAuth redirect URL
- Use the correct domain for redirects

### 4. Test the Fix

1. Deploy the updated code to your production environment
2. Try logging in on `https://recept.ppolivka.com`
3. You should be redirected back to the same domain with the correct locale

## What Was Changed

- **AuthContext**: Updated `signInWithGoogle` to include the current locale in the redirect URL
- **OAuth Flow**: Now preserves the user's language preference during authentication

The OAuth callback route was already correctly configured to handle the locale parameter and redirect to the appropriate home page.
