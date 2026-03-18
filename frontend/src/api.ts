import type { Recipe, Cookbook, SearchResult } from './types';

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

export async function createCookbook(name: string): Promise<Cookbook> {
  const res = await fetch(`${BASE}/cookbooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function getCookbook(id: number): Promise<Cookbook> {
  const res = await fetch(`${BASE}/cookbooks/${id}`);
  return res.json();
}

export async function getCookbookRecipes(id: number): Promise<Recipe[]> {
  const res = await fetch(`${BASE}/cookbooks/${id}/recipes`);
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
