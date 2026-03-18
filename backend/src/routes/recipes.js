import { Router } from 'express';
import axios from 'axios';
import db from '../db.js';

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

    const sourceUrl = extracted.source_url || url;

    const stmt = db.prepare(`
      INSERT INTO recipes (title, description, image_url, source_url, prep_time, cook_time, yield, ingredient_groups, instructions, equipment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      extracted.title || 'Untitled Recipe',
      extracted.description || null,
      extracted.image_url || null,
      sourceUrl,
      extracted.prep_time || null,
      extracted.cook_time || null,
      extracted.yield || null,
      JSON.stringify(extracted.ingredient_groups || []),
      JSON.stringify(extracted.instructions || []),
      JSON.stringify(extracted.equipment || [])
    );

    const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(result.lastInsertRowid);
    res.json(parseRecipe(recipe));
  } catch (err) {
    console.error('Import error:', err?.response?.data || err.message);
    res.status(500).json({ error: err?.response?.data?.error || err.message });
  }
});

// GET /api/recipes
router.get('/', (req, res) => {
  const recipes = db.prepare('SELECT * FROM recipes ORDER BY created_at DESC').all();
  res.json(recipes.map(parseRecipe));
});

// GET /api/recipes/:id
router.get('/:id', (req, res) => {
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
  if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
  res.json(parseRecipe(recipe));
});

// PATCH /api/recipes/:id/rating
router.patch('/:id/rating', (req, res) => {
  const { rating, review } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be 1–5' });
  }
  db.prepare('UPDATE recipes SET rating = ?, review = ? WHERE id = ?').run(
    rating,
    review || null,
    req.params.id
  );
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
  if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
  res.json(parseRecipe(recipe));
});

// GET /api/recipes/:id/cookbooks
router.get('/:id/cookbooks', (req, res) => {
  const rows = db
    .prepare(
      `SELECT c.* FROM cookbooks c
       JOIN recipe_cookbooks rc ON rc.cookbook_id = c.id
       WHERE rc.recipe_id = ?`
    )
    .all(req.params.id);
  res.json(rows);
});

// PUT /api/recipes/:id/cookbooks  — replace cookbook assignments
router.put('/:id/cookbooks', (req, res) => {
  const { cookbook_ids } = req.body;
  const recipeId = parseInt(req.params.id);

  const del = db.prepare('DELETE FROM recipe_cookbooks WHERE recipe_id = ?');
  const ins = db.prepare('INSERT OR IGNORE INTO recipe_cookbooks (recipe_id, cookbook_id) VALUES (?, ?)');

  const updateAll = db.transaction(() => {
    del.run(recipeId);
    for (const cid of cookbook_ids || []) {
      ins.run(recipeId, cid);
    }
  });

  updateAll();
  res.json({ ok: true });
});

function parseRecipe(r) {
  return {
    ...r,
    ingredient_groups: tryParse(r.ingredient_groups, []),
    instructions: tryParse(r.instructions, []),
    equipment: tryParse(r.equipment, []),
  };
}

function tryParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export default router;
