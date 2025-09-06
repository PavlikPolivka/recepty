'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface SubscriptionData {
  is_premium: boolean;
  status: string;
  plan: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  updated_at: string;
}

interface UsageData {
  recipes_parsed: number;
  customizations_used: number;
}

interface SubscriptionContextType {
  subscription: SubscriptionData | null;
  usage: UsageData | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  refreshUsage: () => Promise<void>;
  canParseRecipe: boolean;
  canUseCustomizations: (count: number) => boolean;
  maxRecipesPerDay: number;
  maxCustomizationsPerDay: number;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const refreshSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_user_subscription', {
        user_uuid: user.id
      });

      if (error) {
        console.error('Error fetching subscription:', error);
        return;
      }

      if (data && data.length > 0) {
        setSubscription(data[0]);
      } else {
        // Default to free plan if no subscription found
        setSubscription({
          is_premium: false,
          status: 'inactive',
          plan: 'free',
          current_period_end: null,
          cancel_at_period_end: false,
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    }
  }, [user]);

  const refreshUsage = useCallback(async () => {
    if (!user) {
      setUsage(null);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_user_daily_usage', {
        user_uuid: user.id
      });

      if (error) {
        console.error('Error fetching usage:', error);
        return;
      }

      if (data && data.length > 0) {
        setUsage(data[0]);
      } else {
        setUsage({
          recipes_parsed: 0,
          customizations_used: 0
        });
      }
    } catch (error) {
      console.error('Error refreshing usage:', error);
    }
  }, [user]);

  useEffect(() => {
    const supabase = createClient();
    
    // Get initial user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    getUser();

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await refreshSubscription();
          await refreshUsage();
        } else {
          setSubscription(null);
          setUsage(null);
        }
      }
    );

    return () => {
      authSubscription.unsubscribe();
    };
  }, [refreshSubscription, refreshUsage]);

  useEffect(() => {
    if (user) {
      refreshSubscription();
      refreshUsage();
    }
    setLoading(false);
  }, [user, refreshSubscription, refreshUsage]);

  // Only allow premium features if subscription is active and premium, or if user has lifetime access
  const isPremium = (subscription?.is_premium && subscription?.status === 'active') || subscription?.plan === 'lifetime';
  
  const canParseRecipe = isPremium || (usage?.recipes_parsed || 0) < 3;
  const canUseCustomizations = (count: number) => 
    isPremium || (usage?.customizations_used || 0) + count <= 3;

  const maxRecipesPerDay = isPremium ? 999999 : 3;
  const maxCustomizationsPerDay = isPremium ? 999999 : 3;

  const value: SubscriptionContextType = {
    subscription,
    usage,
    loading,
    refreshSubscription,
    refreshUsage,
    canParseRecipe,
    canUseCustomizations,
    maxRecipesPerDay,
    maxCustomizationsPerDay,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
