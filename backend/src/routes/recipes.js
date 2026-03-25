import { Router } from 'express';
import axios from 'axios';
import { fsAdd, fsGet, fsUpdate, fsDelete, fsQuery } from '../firestore.js';

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
              instructions: { type: 'array', items: { type: 'string' } },
              equipment: { type: 'array', items: { type: 'string' } },
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

    const normalizeGroupName = (name) => {
      if (!name || !name.trim()) return 'Ingredients';
      const cleaned = name.trim().replace(/^for\s+(the|a|an)\s+/i, '').replace(/^for\s+/i, '');
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    };

    const ingredientGroups = (extracted.ingredient_groups || []).map((group) => ({
      ...group,
      group_name: normalizeGroupName(group.group_name),
    }));

    const doc = await fsAdd('recipes', {
      title: extracted.title || 'Untitled Recipe',
      description: extracted.description || null,
      image_url: extracted.image_url || null,
      source_url: extracted.source_url || url,
      prep_time: extracted.prep_time || null,
      cook_time: extracted.cook_time || null,
      yield: extracted.yield || null,
      ingredient_groups: ingredientGroups,
      instructions: extracted.instructions || [],
      equipment: extracted.equipment || [],
      rating: null,
      review: null,
      bake_log: [],
      cookbook_ids: [],
      created_at: new Date().toISOString(),
    });

    res.json(doc);
  } catch (err) {
    console.error('Import error:', err?.response?.data || err.message);
    res.status(500).json({ error: err?.response?.data?.error || err.message });
  }
});

// GET /api/recipes
router.get('/', async (_req, res) => {
  const docs = await fsQuery('recipes', { orderBy: 'created_at', orderDir: 'DESCENDING' });
  res.json(docs);
});

// GET /api/recipes/:id
router.get('/:id', async (req, res) => {
  const doc = await fsGet('recipes', req.params.id);
  if (!doc) return res.status(404).json({ error: 'Recipe not found' });
  res.json(doc);
});

// PATCH /api/recipes/:id/rating
router.patch('/:id/rating', async (req, res) => {
  const { rating, review } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be 1–5' });
  }
  const doc = await fsUpdate('recipes', req.params.id, { rating, review: review || null });
  res.json(doc);
});

// POST /api/recipes/:id/bakes
router.post('/:id/bakes', async (req, res) => {
  const { date, notes } = req.body;
  if (!date) return res.status(400).json({ error: 'Date is required' });
  const existing = await fsGet('recipes', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Recipe not found' });
  const bake_log = [...(existing.bake_log || []), { date, notes: notes || null }];
  const doc = await fsUpdate('recipes', req.params.id, { bake_log });
  res.json(doc);
});

// GET /api/recipes/:id/cookbooks
router.get('/:id/cookbooks', async (req, res) => {
  const recipe = await fsGet('recipes', req.params.id);
  if (!recipe) return res.json([]);
  const ids = recipe.cookbook_ids || [];
  if (!ids.length) return res.json([]);
  const cookbooks = await Promise.all(ids.map(id => fsGet('cookbooks', id)));
  res.json(cookbooks.filter(Boolean));
});

// PATCH /api/recipes/:id
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
  const doc = await fsUpdate('recipes', req.params.id, updates);
  res.json(doc);
});

// DELETE /api/recipes/:id
router.delete('/:id', async (req, res) => {
  await fsDelete('recipes', req.params.id);
  res.json({ ok: true });
});

// PUT /api/recipes/:id/cookbooks
router.put('/:id/cookbooks', async (req, res) => {
  const { cookbook_ids } = req.body;
  await fsUpdate('recipes', req.params.id, { cookbook_ids: cookbook_ids || [] });
  res.json({ ok: true });
});

export default router;
