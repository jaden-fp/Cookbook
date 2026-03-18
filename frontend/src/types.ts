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
  id: number;
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

export interface Cookbook {
  id: number;
  name: string;
  recipe_count: number;
  created_at: string;
}
