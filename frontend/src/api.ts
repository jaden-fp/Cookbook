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

export async function getRecipe(id: number): Promise<Recipe> {
  const res = await fetch(`${BASE}/recipes/${id}`);
  if (!res.ok) throw new Error('Recipe not found');
  return res.json();
}

export async function rateRecipe(
  id: number,
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

export async function getRecipeCookbooks(id: number): Promise<Cookbook[]> {
  const res = await fetch(`${BASE}/recipes/${id}/cookbooks`);
  return res.json();
}

export async function setRecipeCookbooks(
  id: number,
  cookbook_ids: number[]
): Promise<void> {
  await fetch(`${BASE}/recipes/${id}/cookbooks`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cookbook_ids }),
  });
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
  id: number,
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

export async function getCookbook(id: number): Promise<Cookbook> {
  const res = await fetch(`${BASE}/cookbooks/${id}`);
  return res.json();
}

export async function addRecipesToCookbook(cookbookId: number, recipeIds: number[]): Promise<void> {
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

export async function getCookbookRecipes(id: number): Promise<Recipe[]> {
  const res = await fetch(`${BASE}/cookbooks/${id}/recipes`);
  return res.json();
}

export async function getPantryItems(): Promise<PantryItem[]> {
  const res = await fetch(`${BASE}/pantry`);
  return res.json();
}

export async function addPantryItem(data: {
  name: string;
  quantity: number;
  unit: string;
  needs_purchase?: number;
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
  id: number,
  updates: { quantity?: number; unit?: string; needs_purchase?: number }
): Promise<PantryItem> {
  const res = await fetch(`${BASE}/pantry/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function deletePantryItem(id: number): Promise<void> {
  await fetch(`${BASE}/pantry/${id}`, { method: 'DELETE' });
}

export async function searchRecipes(q: string): Promise<SearchResult[]> {
  const res = await fetch(`${BASE}/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.error || 'Search failed'), { status: res.status });
  }
  return res.json();
}
