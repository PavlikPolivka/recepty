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
