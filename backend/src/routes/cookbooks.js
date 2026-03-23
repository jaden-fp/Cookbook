import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

async function enrichCookbook(doc) {
  const data = doc.data();
  const recipesSnap = await db.collection('recipes')
    .where('cookbook_ids', 'array-contains', doc.id)
    .get();

  const pinnedImages = data.pinned_images || [];
  const preview_images = pinnedImages.length > 0
    ? pinnedImages.slice(0, 3)
    : recipesSnap.docs.map(r => r.data().image_url).filter(Boolean).slice(0, 3);

  return { id: doc.id, ...data, recipe_count: recipesSnap.size, preview_images };
}

// GET /api/cookbooks
router.get('/', async (_req, res) => {
  const snapshot = await db.collection('cookbooks').orderBy('created_at', 'desc').get();
  const cookbooks = await Promise.all(snapshot.docs.map(enrichCookbook));
  res.json(cookbooks);
});

// POST /api/cookbooks
router.post('/', async (req, res) => {
  const { name, color, icon } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

  const docRef = await db.collection('cookbooks').add({
    name: name.trim(),
    color: color ?? null,
    icon: icon ?? null,
    pinned_images: [],
    created_at: new Date().toISOString(),
  });
  const doc = await docRef.get();
  res.status(201).json({ id: doc.id, ...doc.data(), recipe_count: 0, preview_images: [] });
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

  const ref = db.collection('cookbooks').doc(req.params.id);
  await ref.update(updates);
  const doc = await ref.get();
  res.json(await enrichCookbook(doc));
});

// GET /api/cookbooks/:id
router.get('/:id', async (req, res) => {
  const doc = await db.collection('cookbooks').doc(req.params.id).get();
  if (!doc.exists) return res.status(404).json({ error: 'Cookbook not found' });
  res.json(await enrichCookbook(doc));
});

// DELETE /api/cookbooks/:id
router.delete('/:id', async (req, res) => {
  const recipesSnap = await db.collection('recipes')
    .where('cookbook_ids', 'array-contains', req.params.id)
    .get();

  const batch = db.batch();
  recipesSnap.docs.forEach(doc => {
    const newIds = (doc.data().cookbook_ids || []).filter(id => id !== req.params.id);
    batch.update(doc.ref, { cookbook_ids: newIds });
  });
  batch.delete(db.collection('cookbooks').doc(req.params.id));
  await batch.commit();

  res.json({ ok: true });
});

// POST /api/cookbooks/:id/recipes
router.post('/:id/recipes', async (req, res) => {
  const { recipe_ids } = req.body;
  if (!Array.isArray(recipe_ids) || !recipe_ids.length) {
    return res.status(400).json({ error: 'recipe_ids required' });
  }
  try {
    const batch = db.batch();
    for (const rid of recipe_ids) {
      const ref = db.collection('recipes').doc(rid);
      const doc = await ref.get();
      if (doc.exists) {
        const existing = doc.data().cookbook_ids || [];
        if (!existing.includes(req.params.id)) {
          batch.update(ref, { cookbook_ids: [...existing, req.params.id] });
        }
      }
    }
    await batch.commit();
    res.json({ ok: true });
  } catch (err) {
    console.error('Error adding recipes to cookbook:', err);
    res.status(500).json({ error: err.message || 'Failed to add recipes' });
  }
});

// GET /api/cookbooks/:id/recipes
router.get('/:id/recipes', async (req, res) => {
  const snapshot = await db.collection('recipes')
    .where('cookbook_ids', 'array-contains', req.params.id)
    .get();
  const recipes = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(recipes);
});

export default router;
