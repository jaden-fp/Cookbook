import { Router } from 'express';
import { fsAdd, fsGet, fsUpdate, fsDelete, fsQuery } from '../firestore.js';

const router = Router();

async function enrichCookbook(cb) {
  const recipes = await fsQuery('recipes', {
    where: { field: 'cookbook_ids', op: 'ARRAY_CONTAINS', value: cb.id },
  });
  const pinnedImages = cb.pinned_images || [];
  const preview_images = pinnedImages.length > 0
    ? pinnedImages.slice(0, 3)
    : recipes.map(r => r.image_url).filter(Boolean).slice(0, 3);
  return { ...cb, recipe_count: recipes.length, preview_images };
}

// GET /api/cookbooks
router.get('/', async (_req, res) => {
  const docs = await fsQuery('cookbooks', { orderBy: 'created_at', orderDir: 'DESCENDING' });
  const cookbooks = await Promise.all(docs.map(enrichCookbook));
  res.json(cookbooks);
});

// POST /api/cookbooks
router.post('/', async (req, res) => {
  const { name, color, icon } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  const doc = await fsAdd('cookbooks', {
    name: name.trim(),
    color: color ?? null,
    icon: icon ?? null,
    pinned_images: [],
    created_at: new Date().toISOString(),
  });
  res.status(201).json({ ...doc, recipe_count: 0, preview_images: [] });
});

// PATCH /api/cookbooks/:id
router.patch('/:id', async (req, res) => {
  const { name, color, icon, pinned_images } = req.body;
  const updates = {};
  if (name?.trim()) updates.name = name.trim();
  if (color !== undefined) updates.color = color;
  if (icon !== undefined) updates.icon = icon;
  if (pinned_images !== undefined) updates.pinned_images = pinned_images;
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to update' });
  const doc = await fsUpdate('cookbooks', req.params.id, updates);
  res.json(await enrichCookbook(doc));
});

// GET /api/cookbooks/:id
router.get('/:id', async (req, res) => {
  const doc = await fsGet('cookbooks', req.params.id);
  if (!doc) return res.status(404).json({ error: 'Cookbook not found' });
  res.json(await enrichCookbook(doc));
});

// DELETE /api/cookbooks/:id
router.delete('/:id', async (req, res) => {
  const recipes = await fsQuery('recipes', {
    where: { field: 'cookbook_ids', op: 'ARRAY_CONTAINS', value: req.params.id },
  });
  await Promise.all(recipes.map(r =>
    fsUpdate('recipes', r.id, { cookbook_ids: (r.cookbook_ids || []).filter(id => id !== req.params.id) })
  ));
  await fsDelete('cookbooks', req.params.id);
  res.json({ ok: true });
});

// POST /api/cookbooks/:id/recipes
router.post('/:id/recipes', async (req, res) => {
  const { recipe_ids } = req.body;
  if (!Array.isArray(recipe_ids) || !recipe_ids.length) {
    return res.status(400).json({ error: 'recipe_ids required' });
  }
  try {
    await Promise.all(recipe_ids.map(async rid => {
      const recipe = await fsGet('recipes', rid);
      if (!recipe) return;
      const existing = recipe.cookbook_ids || [];
      if (!existing.includes(req.params.id)) {
        await fsUpdate('recipes', rid, { cookbook_ids: [...existing, req.params.id] });
      }
    }));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to add recipes' });
  }
});

// GET /api/cookbooks/:id/recipes
router.get('/:id/recipes', async (req, res) => {
  const recipes = await fsQuery('recipes', {
    where: { field: 'cookbook_ids', op: 'ARRAY_CONTAINS', value: req.params.id },
  });
  res.json(recipes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
});

export default router;
