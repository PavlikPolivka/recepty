interface SubscriptionData {
  is_premium: boolean;
  status: string;
  plan: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  updated_at: string;
}

/**
 * Checks if a user has access to premium features
 * @param subscription - The user's subscription data
 * @returns true if user has premium access (active premium with valid dates or lifetime)
 */
export function hasPremiumAccess(subscription: SubscriptionData | null): boolean {
  if (!subscription) {
    return false;
  }

  // Lifetime access - always premium
  if (subscription.plan === 'lifetime') {
    return true;
  }

  // Premium subscription - check if active and not expired
  if (subscription.is_premium && subscription.status === 'active') {
    // Check if current period hasn't ended (even if canceled at period end)
    if (subscription.current_period_end) {
      const now = new Date();
      const periodEnd = new Date(subscription.current_period_end);
      return now < periodEnd;
    }

    // If no end date, assume active
    return true;
  }

  return false;
}

/**
 * Checks if a user can parse recipes (premium or within free limit)
 * @param subscription - The user's subscription data
 * @param usage - The user's daily usage data
 * @returns true if user can parse a recipe
 */
export function canParseRecipe(
  subscription: SubscriptionData | null, 
  usage: { recipes_parsed: number } | null
): boolean {
  if (hasPremiumAccess(subscription)) {
    return true;
  }
  
  return (usage?.recipes_parsed || 0) < 3;
}

/**
 * Checks if a user can use customizations (premium or within free limit)
 * @param subscription - The user's subscription data
 * @param usage - The user's daily usage data
 * @param requestedCount - Number of customizations requested
 * @returns true if user can use the requested number of customizations
 */
export function canUseCustomizations(
  subscription: SubscriptionData | null,
  usage: { customizations_used: number } | null,
  requestedCount: number = 1
): boolean {
  if (hasPremiumAccess(subscription)) {
    return true;
  }
  
  return (usage?.customizations_used || 0) + requestedCount <= 3;
}

/**
 * Gets the maximum number of recipes per day for a user
 * @param subscription - The user's subscription data
 * @returns Maximum recipes per day (999999 for premium, 3 for free)
 */
export function getMaxRecipesPerDay(subscription: SubscriptionData | null): number {
  return hasPremiumAccess(subscription) ? 999999 : 3;
}

/**
 * Gets the maximum number of customizations per day for a user
 * @param subscription - The user's subscription data
 * @returns Maximum customizations per day (999999 for premium, 3 for free)
 */
export function getMaxCustomizationsPerDay(subscription: SubscriptionData | null): number {
  return hasPremiumAccess(subscription) ? 999999 : 3;
}
