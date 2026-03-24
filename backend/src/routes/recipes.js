import { Router } from 'express';
import axios from 'axios';
import { db } from '../db.js';

const router = Router();

// POST /api/recipes/import
router.post('/import', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    const firecrawlRes = await axios.post(
      'https://api.firecrawl.dev/v1/scrape',
      {
        url,
        formats: ['extract'],
        extract: {
          prompt:
            'Extract the full recipe including all ingredient groups with subtitles, all instructions, equipment list, prep time, cook time, yield, description, and the main recipe image URL.',
          schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              image_url: { type: 'string' },
              source_url: { type: 'string' },
              prep_time: { type: 'string' },
              cook_time: { type: 'string' },
              yield: { type: 'string' },
              ingredient_groups: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    group_name: { type: ['string', 'null'] },
                    ingredients: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          amount: { type: 'string' },
                          unit: { type: 'string' },
                          name: { type: 'string' },
                          notes: { type: ['string', 'null'] },
                        },
                      },
                    },
                  },
                },
              },
              instructions: {
                type: 'array',
                items: { type: 'string' },
              },
              equipment: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const extracted = firecrawlRes.data?.data?.extract;
    if (!extracted) {
      return res.status(422).json({ error: 'Could not extract recipe data from that URL' });
    }

    const docRef = await db.collection('recipes').add({
      title: extracted.title || 'Untitled Recipe',
      description: extracted.description || null,
      image_url: extracted.image_url || null,
      source_url: extracted.source_url || url,
      prep_time: extracted.prep_time || null,
      cook_time: extracted.cook_time || null,
      yield: extracted.yield || null,
      ingredient_groups: extracted.ingredient_groups || [],
      instructions: extracted.instructions || [],
      equipment: extracted.equipment || [],
      rating: null,
      review: null,
      cookbook_ids: [],
      created_at: new Date().toISOString(),
    });

    const doc = await docRef.get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error('Import error:', err?.response?.data || err.message);
    res.status(500).json({ error: err?.response?.data?.error || err.message });
  }
});

// GET /api/recipes
router.get('/', async (_req, res) => {
  const snapshot = await db.collection('recipes').orderBy('created_at', 'desc').get();
  res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
});

// GET /api/recipes/:id
router.get('/:id', async (req, res) => {
  const doc = await db.collection('recipes').doc(req.params.id).get();
  if (!doc.exists) return res.status(404).json({ error: 'Recipe not found' });
  res.json({ id: doc.id, ...doc.data() });
});

// PATCH /api/recipes/:id/rating
router.patch('/:id/rating', async (req, res) => {
  const { rating, review } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be 1–5' });
  }
  const ref = db.collection('recipes').doc(req.params.id);
  await ref.update({ rating, review: review || null });
  const doc = await ref.get();
  if (!doc.exists) return res.status(404).json({ error: 'Recipe not found' });
  res.json({ id: doc.id, ...doc.data() });
});

// GET /api/recipes/:id/cookbooks
router.get('/:id/cookbooks', async (req, res) => {
  const doc = await db.collection('recipes').doc(req.params.id).get();
  if (!doc.exists) return res.json([]);
  const cookbookIds = doc.data().cookbook_ids || [];
  if (!cookbookIds.length) return res.json([]);
  const cookbooks = await Promise.all(cookbookIds.map(id => db.collection('cookbooks').doc(id).get()));
  res.json(cookbooks.filter(d => d.exists).map(d => ({ id: d.id, ...d.data() })));
});

// PATCH /api/recipes/:id — update editable fields
router.patch('/:id', async (req, res) => {
  const { title, description, prep_time, cook_time, yield: yieldAmount, ingredient_groups, instructions, equipment } = req.body;
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (prep_time !== undefined) updates.prep_time = prep_time;
  if (cook_time !== undefined) updates.cook_time = cook_time;
  if (yieldAmount !== undefined) updates.yield = yieldAmount;
  if (ingredient_groups !== undefined) updates.ingredient_groups = ingredient_groups;
  if (instructions !== undefined) updates.instructions = instructions;
  if (equipment !== undefined) updates.equipment = equipment;
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to update' });
  const ref = db.collection('recipes').doc(req.params.id);
  await ref.update(updates);
  const doc = await ref.get();
  if (!doc.exists) return res.status(404).json({ error: 'Recipe not found' });
  res.json({ id: doc.id, ...doc.data() });
});

// DELETE /api/recipes/:id
router.delete('/:id', async (req, res) => {
  await db.collection('recipes').doc(req.params.id).delete();
  res.json({ ok: true });
});

// PUT /api/recipes/:id/cookbooks  — replace cookbook assignments
router.put('/:id/cookbooks', async (req, res) => {
  const { cookbook_ids } = req.body;
  await db.collection('recipes').doc(req.params.id).update({
    cookbook_ids: cookbook_ids || [],
  });
  res.json({ ok: true });
});

export default router;
