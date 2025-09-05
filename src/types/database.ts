export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
      };
      recipes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          image: string | null;
          ingredients: Ingredient[];
          steps: RecipeStep[];
          servings: number | null;
          prep_time: string | null;
          cook_time: string | null;
          total_time: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          image?: string | null;
          ingredients: Ingredient[];
          steps: RecipeStep[];
          servings?: number | null;
          prep_time?: string | null;
          cook_time?: string | null;
          total_time?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          image?: string | null;
          ingredients?: Ingredient[];
          steps?: RecipeStep[];
          servings?: number | null;
          prep_time?: string | null;
          cook_time?: string | null;
          total_time?: string | null;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          status: string;
          plan: string;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: string;
          plan?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: string;
          plan?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      usage_tracking: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          recipes_parsed: number;
          customizations_used: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          recipes_parsed?: number;
          customizations_used?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          recipes_parsed?: number;
          customizations_used?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      get_user_subscription: {
        Args: {
          user_uuid: string;
        };
        Returns: {
          is_premium: boolean;
          status: string;
          plan: string;
          current_period_end: string | null;
        }[];
      };
      get_user_daily_usage: {
        Args: {
          user_uuid: string;
          usage_date?: string;
        };
        Returns: {
          recipes_parsed: number;
          customizations_used: number;
        }[];
      };
      increment_usage: {
        Args: {
          user_uuid: string;
          usage_date?: string;
          recipes_count?: number;
          customizations_count?: number;
        };
        Returns: undefined;
      };
      can_parse_recipe: {
        Args: {
          user_uuid: string;
        };
        Returns: boolean;
      };
      can_use_customizations: {
        Args: {
          user_uuid: string;
          requested_count: number;
        };
        Returns: boolean;
      };
    };
  };
}

export interface Ingredient {
  name: string;
  amount?: string;
  unit?: string;
}

export interface RecipeStep {
  step: number;
  instruction: string;
}

export interface ParsedRecipe {
  title: string;
  image?: string;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  servings?: number;
  prep_time?: string;
  cook_time?: string;
  total_time?: string;
}

export interface SavedRecipe extends ParsedRecipe {
  id: string;
  user_id: string;
  created_at: string;
}
