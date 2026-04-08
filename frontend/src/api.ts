import type { Recipe, Cookbook, PantryItem, SearchResult } from './types';

// In dev, Vite proxies /api → localhost backend.
// In production, VITE_API_URL points to the Railway backend (e.g. https://xxx.railway.app).
const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api';

export async function importRecipe(url: string): Promise<Recipe> {
  const res = await fetch(`${BASE}/recipes/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to import recipe');
  }
  return res.json();
}

export async function getRecipes(): Promise<Recipe[]> {
  const res = await fetch(`${BASE}/recipes`);
  return res.json();
}

export async function getRecipe(id: string): Promise<Recipe> {
  const res = await fetch(`${BASE}/recipes/${id}`);
  if (!res.ok) throw new Error('Recipe not found');
  return res.json();
}

export async function rateRecipe(
  id: string,
  rating: number,
  review: string
): Promise<Recipe> {
  const res = await fetch(`${BASE}/recipes/${id}/rating`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating, review }),
  });
  return res.json();
}

export async function updateRecipe(
  id: string,
  updates: {
    title?: string;
    description?: string;
    prep_time?: string;
    cook_time?: string;
    yield?: string;
    ingredient_groups?: import('./types').IngredientGroup[];
    instructions?: string[];
    equipment?: string[];
    image_url?: string | null;
    ai_category?: string | null;
    tags?: string[];
  }
): Promise<Recipe> {
  const res = await fetch(`${BASE}/recipes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update recipe');
  return res.json();
}

export async function getRecipeCookbooks(id: string): Promise<Cookbook[]> {
  const res = await fetch(`${BASE}/recipes/${id}/cookbooks`);
  return res.json();
}

export async function setRecipeCookbooks(
  id: string,
  cookbook_ids: string[]
): Promise<void> {
  await fetch(`${BASE}/recipes/${id}/cookbooks`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cookbook_ids }),
  });
}

export async function logBake(id: string, date: string, notes?: string, photo_url?: string): Promise<Recipe> {
  const res = await fetch(`${BASE}/recipes/${id}/bakes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, notes, photo_url }),
  });
  if (!res.ok) throw new Error('Failed to log bake');
  return res.json();
}

export async function uploadBakePhoto(id: string, dataUrl: string): Promise<string> {
  const res = await fetch(`${BASE}/recipes/${id}/bake-photo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Photo upload failed');
  }
  const data = await res.json();
  return data.photo_url;
}

export async function deleteRecipe(id: string): Promise<void> {
  await fetch(`${BASE}/recipes/${id}`, { method: 'DELETE' });
}

export async function uploadRecipeImage(id: string, dataUrl: string): Promise<string> {
  const res = await fetch(`${BASE}/recipes/${id}/image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Image upload failed');
  }
  const data = await res.json();
  return data.image_url;
}

export async function getCookbooks(): Promise<Cookbook[]> {
  const res = await fetch(`${BASE}/cookbooks`);
  return res.json();
}

export async function createCookbook(
  name: string,
  color?: string,
  icon?: string
): Promise<Cookbook> {
  const res = await fetch(`${BASE}/cookbooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color, icon }),
  });
  return res.json();
}

export async function updateCookbook(
  id: string,
  updates: { color?: string; icon?: string; name?: string; pinned_images?: string[] }
): Promise<Cookbook> {
  const res = await fetch(`${BASE}/cookbooks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update cookbook');
  }
  return res.json();
}

export async function deleteCookbook(id: string): Promise<void> {
  await fetch(`${BASE}/cookbooks/${id}`, { method: 'DELETE' });
}

export async function getCookbook(id: string): Promise<Cookbook> {
  const res = await fetch(`${BASE}/cookbooks/${id}`);
  return res.json();
}

export async function addRecipesToCookbook(cookbookId: string, recipeIds: string[]): Promise<void> {
  const res = await fetch(`${BASE}/cookbooks/${cookbookId}/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipe_ids: recipeIds }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to add recipes');
  }
}

export async function getCookbookRecipes(id: string): Promise<Recipe[]> {
  const res = await fetch(`${BASE}/cookbooks/${id}/recipes`);
  return res.json();
}

export async function getPantryItems(): Promise<PantryItem[]> {
  const res = await fetch(`${BASE}/pantry`);
  return res.json();
}

export async function addPantryItem(data: {
  name: string;
  quantity?: number;
  unit?: string;
  needs_purchase?: number;
  status?: 'in-stock' | 'low' | 'out';
  category?: string;
}): Promise<PantryItem> {
  const res = await fetch(`${BASE}/pantry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to add item');
  }
  return res.json();
}

export async function updatePantryItem(
  id: string,
  updates: { name?: string; quantity?: number; unit?: string; needs_purchase?: number; status?: 'in-stock' | 'low' | 'out'; category?: string }
): Promise<PantryItem> {
  const res = await fetch(`${BASE}/pantry/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function deletePantryItem(id: string): Promise<void> {
  await fetch(`${BASE}/pantry/${id}`, { method: 'DELETE' });
}

export async function categorizePantryItem(id: string): Promise<PantryItem> {
  const res = await fetch(`${BASE}/pantry/${id}/categorize`, { method: 'POST' });
  return res.json();
}

export async function updateBakeLog(
  id: string,
  bake_log: import('./types').BakeEntry[]
): Promise<Recipe> {
  const res = await fetch(`${BASE}/recipes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bake_log }),
  });
  if (!res.ok) throw new Error('Failed to update bake log');
  return res.json();
}

export async function recategorizeAll(): Promise<{ total: number; done: number; failed: number }> {
  const res = await fetch(`${BASE}/recipes/categorize-all?force=true`, { method: 'POST' });
  if (!res.ok) throw new Error('Recategorization failed');
  return res.json();
}

export async function searchRecipes(q: string): Promise<SearchResult[]> {
  const res = await fetch(`${BASE}/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.error || 'Search failed'), { status: res.status });
  }
  return res.json();
}

export async function lookupNutrition(q: string): Promise<{ description: string; nutrition: import('./utils/nutritionData').NutrientPer100g } | null> {
  const res = await fetch(`${BASE}/nutrition/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) return null;
  return res.json();
}

export async function lookupIngredientPrice(name: string): Promise<import('./utils/ingredientCost').AIPrice | null> {
  const res = await fetch(`${BASE}/nutrition/price?q=${encodeURIComponent(name)}`);
  if (!res.ok) return null;
  return res.json();
}

export async function aiSearchRecipes(query: string, recipes: { id: string; title: string; description?: string | null; ai_category?: string | null; tags?: string[]; ingredients?: string[] }[]): Promise<string[]> {
  const res = await fetch(`${BASE}/ai-search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, recipes }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.ids ?? [];
}

export async function getShelf(): Promise<string[]> {
  const res = await fetch(`${BASE}/shelf`);
  const data = await res.json();
  return data.recipe_ids ?? [];
}

export async function addToShelf(recipeId: string): Promise<string[]> {
  const res = await fetch(`${BASE}/shelf/${recipeId}`, { method: 'POST' });
  const data = await res.json();
  return data.recipe_ids ?? [];
}

export async function removeFromShelf(recipeId: string): Promise<string[]> {
  const res = await fetch(`${BASE}/shelf/${recipeId}`, { method: 'DELETE' });
  const data = await res.json();
  return data.recipe_ids ?? [];
}

