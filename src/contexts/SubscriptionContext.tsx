'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { hasPremiumAccess, canParseRecipe, canUseCustomizations, getMaxRecipesPerDay, getMaxCustomizationsPerDay } from '@/lib/premium';

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
  isPremium: boolean;
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
  const previousUserId = useRef<string | null>(null);

  const refreshSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      return;
    }

    console.log('🔄 Refreshing subscription for user:', user.id);
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
        console.log('✅ Subscription data received:', data[0]);
        setSubscription(data[0]);
      } else {
        console.log('📝 Setting default subscription for free user');
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
  }, [user?.id]); // Use user.id instead of user object

  const refreshUsage = useCallback(async () => {
    if (!user) {
      setUsage(null);
      return;
    }

    console.log('🔄 Refreshing usage for user:', user.id);
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
        console.log('✅ Usage data received:', data[0]);
        setUsage(data[0]);
      } else {
        console.log('📝 Setting default usage for user');
        setUsage({
          recipes_parsed: 0,
          customizations_used: 0
        });
      }
    } catch (error) {
      console.error('Error refreshing usage:', error);
    }
  }, [user?.id]); // Use user.id instead of user object

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
  }, []); // Remove refreshSubscription and refreshUsage from dependencies

  useEffect(() => {
    const currentUserId = user?.id || null;
    console.log('🔄 useEffect triggered - user changed:', currentUserId, 'previous:', previousUserId.current);
    
    // Only call functions if user ID actually changed
    if (currentUserId !== previousUserId.current) {
      previousUserId.current = currentUserId;
      
      if (user) {
        console.log('📞 Calling refreshSubscription and refreshUsage');
        refreshSubscription();
        refreshUsage();
      }
    }
    setLoading(false);
  }, [user?.id]); // Only depend on user.id, not the functions

  // Use centralized premium access check
  const isPremium = hasPremiumAccess(subscription);
  
  const canParseRecipeValue = canParseRecipe(subscription, usage);
  const canUseCustomizationsValue = (count: number) => 
    canUseCustomizations(subscription, usage, count);

  const maxRecipesPerDay = getMaxRecipesPerDay(subscription);
  const maxCustomizationsPerDay = getMaxCustomizationsPerDay(subscription);

  const value: SubscriptionContextType = {
    subscription,
    usage,
    loading,
    refreshSubscription,
    refreshUsage,
    isPremium,
    canParseRecipe: canParseRecipeValue,
    canUseCustomizations: canUseCustomizationsValue,
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
