export interface Ingredient {
  amount: string;
  unit: string;
  name: string;
  notes?: string | null;
}

export interface IngredientGroup {
  group_name?: string | null;
  ingredients: Ingredient[];
}

export interface Recipe {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  source_url?: string | null;
  prep_time?: string | null;
  cook_time?: string | null;
  yield?: string | null;
  ingredient_groups: IngredientGroup[];
  instructions: string[];
  equipment: string[];
  rating?: number | null;
  review?: string | null;
  created_at: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  displayUrl: string;
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  needs_purchase: number;
  created_at: string;
  updated_at: string;
}

export interface Cookbook {
  id: string;
  name: string;
  recipe_count: number;
  created_at: string;
  color?: string | null;
  icon?: string | null;
  preview_images?: string[];
  pinned_images?: string[];
}
