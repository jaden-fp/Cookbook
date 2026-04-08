import { Router } from 'express';
import axios from 'axios';
import { fsAdd, fsGet, fsUpdate, fsDelete, fsQuery, fsUploadImage } from '../firestore.js';
import { categorizeRecipe } from '../categorize.js';

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
          prompt: `Extract the full recipe from this page.

INGREDIENT PARSING RULES — follow exactly:
- "amount" = only the numeric quantity (e.g. "1/2", "2", "1 1/4", "3/4"). Never include the unit or ingredient name here.
- "unit" = only the measurement unit (e.g. "cup", "tablespoon", "teaspoon", "oz", "g"). Leave empty string "" if there is no unit.
- "name" = only the ingredient name, lowercase, no quantity or unit (e.g. "unsalted butter", "light brown sugar", "all-purpose flour").
- "notes" = any parenthetical or descriptive note about the ingredient (e.g. "room temperature", "packed", "roughly chopped"). Set to null if none.

EXAMPLE: "1/2 cup + 2 tablespoons unsalted butter, softened"
→ amount: "1/2 cup + 2 tablespoons", unit: "", name: "unsalted butter", notes: "softened"

EXAMPLE: "2 large eggs, room temperature"
→ amount: "2", unit: "", name: "large eggs", notes: "room temperature"

EXAMPLE: "3/4 cup all-purpose flour"
→ amount: "3/4", unit: "cup", name: "all-purpose flour", notes: null

Only include actual ingredient groups (e.g. "For the Cookies", "For the Frosting"). Do NOT include tips, chef notes, or advice sections as ingredient groups.

Also extract: all instructions as steps, equipment list, prep time, cook time, yield/servings, description, and the main recipe image URL.`,
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

    const normalizeGroupName = (name, recipeTitle) => {
      let cleaned = (name || '').trim();
      // Strip "Ingredients for the/a/an X" or "Ingredients for X"
      cleaned = cleaned.replace(/^ingredients\s+for\s+(the|a|an)\s+/i, '');
      cleaned = cleaned.replace(/^ingredients\s+for\s+/i, '');
      // Strip lone "Ingredients"
      cleaned = cleaned.replace(/^ingredients$/i, '').trim();
      // Strip "for the/a/an X" or "for X"
      cleaned = cleaned.replace(/^for\s+(the|a|an)\s+/i, '');
      cleaned = cleaned.replace(/^for\s+/i, '');
      cleaned = cleaned.trim();

      // If result is empty or matches the full recipe title, use just the last word of the title
      if (recipeTitle && (!cleaned || cleaned.toLowerCase() === recipeTitle.toLowerCase().trim())) {
        const words = recipeTitle.trim().split(/\s+/);
        return words[words.length - 1];
      }

      if (!cleaned) return null;
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    };

    const NON_INGREDIENT_GROUPS = /^(tips?|notes?|chef'?s?\s*notes?|baker'?s?\s*notes?|advice|hints?)$/i;

    const ingredientGroups = (extracted.ingredient_groups || [])
      .filter(group => !NON_INGREDIENT_GROUPS.test((group.group_name || '').trim()))
      .map((group) => ({
        ...group,
        group_name: normalizeGroupName(group.group_name, extracted.title),
        ingredients: (group.ingredients || []).map(ing => ({
          ...ing,
          notes: ing.notes && ing.notes.trim() ? ing.notes.trim() : null,
        })),
      }));

    const recipeData = {
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
      ai_category: null,
      created_at: new Date().toISOString(),
    };

    const doc = await fsAdd('recipes', recipeData);

    // Categorize synchronously — Haiku is fast (~1s) and category is immediately available
    try {
      const ai_category = await categorizeRecipe({ title: recipeData.title, ingredient_groups: ingredientGroups });
      await fsUpdate('recipes', doc.id, { ai_category });
      res.json({ ...doc, ai_category });
    } catch (err) {
      console.error('Categorization failed:', err.message);
      res.json(doc);
    }
  } catch (err) {
    console.error('Import error:', err?.response?.data || err.message);
    res.status(500).json({ error: err?.response?.data?.error || err.message });
  }
});

// POST /api/recipes/mark-ingredient-optional — mark a named ingredient as
// optional across every recipe that contains it (case-insensitive substring).
// Body: { ingredientName: string }
router.post('/mark-ingredient-optional', async (req, res) => {
  const { ingredientName } = req.body;
  if (!ingredientName) return res.status(400).json({ error: 'ingredientName required' });
  const needle = ingredientName.toLowerCase().trim();
  const recipes = await fsQuery('recipes', {});
  let updated = 0;
  for (const recipe of recipes) {
    let changed = false;
    const groups = (recipe.ingredient_groups || []).map(g => ({
      ...g,
      ingredients: (g.ingredients || []).map(ing => {
        if (!ing.optional && ing.name.toLowerCase().includes(needle)) {
          changed = true;
          return { ...ing, optional: true };
        }
        return ing;
      }),
    }));
    if (changed) {
      await fsUpdate('recipes', recipe.id, { ingredient_groups: groups });
      updated++;
    }
  }
  res.json({ total: recipes.length, updated });
});

// POST /api/recipes/migrate-group-names — one-time fix for existing recipes
router.post('/migrate-group-names', async (_req, res) => {
  const migrateGroupName = (name, recipeTitle) => {
    let cleaned = (name || '').trim();
    cleaned = cleaned.replace(/^ingredients\s+for\s+(the|a|an)\s+/i, '');
    cleaned = cleaned.replace(/^ingredients\s+for\s+/i, '');
    cleaned = cleaned.replace(/^ingredients$/i, '').trim();
    cleaned = cleaned.replace(/^for\s+(the|a|an)\s+/i, '');
    cleaned = cleaned.replace(/^for\s+/i, '');
    cleaned = cleaned.trim();

    if (recipeTitle && (!cleaned || cleaned.toLowerCase() === recipeTitle.toLowerCase().trim())) {
      const words = recipeTitle.trim().split(/\s+/);
      return words[words.length - 1];
    }

    if (!cleaned) return null;
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  };

  const recipes = await fsQuery('recipes', {});
  let updated = 0;
  for (const recipe of recipes) {
    const groups = (recipe.ingredient_groups || []).map(g => ({
      ...g,
      group_name: migrateGroupName(g.group_name, recipe.title),
    }));
    const changed = groups.some((g, i) => g.group_name !== (recipe.ingredient_groups[i]?.group_name ?? null));
    if (changed) {
      await fsUpdate('recipes', recipe.id, { ingredient_groups: groups });
      updated++;
    }
  }
  res.json({ total: recipes.length, updated });
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
  const { date, notes, photo_url } = req.body;
  if (!date) return res.status(400).json({ error: 'Date is required' });
  const existing = await fsGet('recipes', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Recipe not found' });
  const entry = { date, notes: notes || null, ...(photo_url ? { photo_url } : {}) };
  const bake_log = [...(existing.bake_log || []), entry];
  const doc = await fsUpdate('recipes', req.params.id, { bake_log });
  res.json(doc);
});

// POST /api/recipes/:id/bake-photo — upload a bake photo, return URL
router.post('/:id/bake-photo', async (req, res) => {
  const { dataUrl } = req.body;
  if (!dataUrl?.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Invalid image data' });
  }
  try {
    const ext = dataUrl.startsWith('data:image/png') ? 'png' : 'jpg';
    const filename = `bake-photos/${req.params.id}_${Date.now()}.${ext}`;
    const photo_url = await fsUploadImage(dataUrl, filename);
    res.json({ photo_url });
  } catch (err) {
    console.error('Bake photo upload error:', err.message);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
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

// POST /api/recipes/:id/image — upload photo to Firebase Storage, update recipe
router.post('/:id/image', async (req, res) => {
  const { dataUrl } = req.body;
  if (!dataUrl?.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Invalid image data' });
  }
  try {
    const ext = dataUrl.startsWith('data:image/png') ? 'png' : 'jpg';
    const filename = `recipe-images/${req.params.id}_${Date.now()}.${ext}`;
    const imageUrl = await fsUploadImage(dataUrl, filename);
    const doc = await fsUpdate('recipes', req.params.id, { image_url: imageUrl });
    res.json({ image_url: imageUrl, recipe: doc });
  } catch (err) {
    console.error('Image upload error:', err.message);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

// PATCH /api/recipes/:id
router.patch('/:id', async (req, res) => {
  const { title, description, prep_time, cook_time, yield: yieldAmount, ingredient_groups, instructions, equipment, image_url, ai_category, bake_log, tags } = req.body;
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (prep_time !== undefined) updates.prep_time = prep_time;
  if (cook_time !== undefined) updates.cook_time = cook_time;
  if (yieldAmount !== undefined) updates.yield = yieldAmount;
  if (ingredient_groups !== undefined) updates.ingredient_groups = ingredient_groups;
  if (instructions !== undefined) updates.instructions = instructions;
  if (equipment !== undefined) updates.equipment = equipment;
  if (image_url !== undefined) updates.image_url = image_url;
  if (ai_category !== undefined) updates.ai_category = ai_category;
  if (bake_log !== undefined) updates.bake_log = bake_log;
  if (tags !== undefined) updates.tags = tags;
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to update' });
  const doc = await fsUpdate('recipes', req.params.id, updates);
  res.json(doc);
});

// DELETE /api/recipes/:id
router.delete('/:id', async (req, res) => {
  await fsDelete('recipes', req.params.id);
  res.json({ ok: true });
});

// POST /api/recipes/categorize-all — categorize all recipes missing ai_category
router.post('/categorize-all', async (req, res) => {
  const recipes = await fsQuery('recipes', {});
  const uncategorized = req.query.force === 'true' ? recipes : recipes.filter(r => !r.ai_category);
  let done = 0;
  let failed = 0;
  for (const recipe of uncategorized) {
    try {
      const ai_category = await categorizeRecipe({ title: recipe.title, ingredient_groups: recipe.ingredient_groups });
      await fsUpdate('recipes', recipe.id, { ai_category });
      done++;
    } catch {
      failed++;
    }
  }
  res.json({ total: uncategorized.length, done, failed });
});

// POST /api/recipes/:id/categorize — re-run AI categorization on an existing recipe
router.post('/:id/categorize', async (req, res) => {
  const recipe = await fsGet('recipes', req.params.id);
  if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
  try {
    const ai_category = await categorizeRecipe({ title: recipe.title, ingredient_groups: recipe.ingredient_groups });
    const doc = await fsUpdate('recipes', req.params.id, { ai_category });
    res.json(doc);
  } catch (err) {
    console.error('Categorization failed:', err.message);
    res.status(500).json({ error: 'Categorization failed' });
  }
});

// PUT /api/recipes/:id/cookbooks
router.put('/:id/cookbooks', async (req, res) => {
  const { cookbook_ids } = req.body;
  await fsUpdate('recipes', req.params.id, { cookbook_ids: cookbook_ids || [] });
  res.json({ ok: true });
});

export default router;
