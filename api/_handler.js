import { fsAdd, fsGet, fsUpdate, fsDelete, fsQuery } from '../backend/src/firestore.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, status, data) {
  res.setHeader('Content-Type', 'application/json');
  res.status(status).end(JSON.stringify(data));
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url, 'http://localhost');
  const parts = url.pathname.replace(/^\/api\//, '').split('/').filter(Boolean);
  const [col, id, sub] = parts;
  const body = req.body || {};

  try {

    // ── Health ───────────────────────────────────────────────────────────────
    if (col === 'health') return json(res, 200, { status: 'ok' });

    // ── Recipes ──────────────────────────────────────────────────────────────
    if (col === 'recipes') {

      // POST /api/recipes/import
      if (id === 'import' && req.method === 'POST') {
        const { url: recipeUrl } = body;
        if (!recipeUrl) return json(res, 400, { error: 'URL is required' });
        const fcRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: recipeUrl, formats: ['extract'],
            extract: {
              prompt: 'Extract the full recipe including all ingredient groups with subtitles, all instructions, equipment list, prep time, cook time, yield, description, and the main recipe image URL.',
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' }, description: { type: 'string' },
                  image_url: { type: 'string' }, source_url: { type: 'string' },
                  prep_time: { type: 'string' }, cook_time: { type: 'string' }, yield: { type: 'string' },
                  ingredient_groups: { type: 'array', items: { type: 'object', properties: { group_name: { type: ['string','null'] }, ingredients: { type: 'array', items: { type: 'object', properties: { amount: { type: 'string' }, unit: { type: 'string' }, name: { type: 'string' }, notes: { type: ['string','null'] } } } } } } },
                  instructions: { type: 'array', items: { type: 'string' } },
                  equipment: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          }),
        });
        const fcData = await fcRes.json();
        const extracted = fcData?.data?.extract;
        if (!extracted) return json(res, 422, { error: 'Could not extract recipe data from that URL' });
        const doc = await fsAdd('recipes', {
          title: extracted.title || 'Untitled Recipe',
          description: extracted.description || null,
          image_url: extracted.image_url || null,
          source_url: extracted.source_url || recipeUrl,
          prep_time: extracted.prep_time || null,
          cook_time: extracted.cook_time || null,
          yield: extracted.yield || null,
          ingredient_groups: extracted.ingredient_groups || [],
          instructions: extracted.instructions || [],
          equipment: extracted.equipment || [],
          rating: null, review: null, bake_log: [], cookbook_ids: [],
          created_at: new Date().toISOString(),
        });
        return json(res, 200, doc);
      }

      // GET /api/recipes
      if (!id && req.method === 'GET') {
        const docs = await fsQuery('recipes', { orderBy: 'created_at', orderDir: 'DESCENDING' });
        return json(res, 200, docs);
      }

      // GET /api/recipes/:id
      if (id && !sub && req.method === 'GET') {
        const doc = await fsGet('recipes', id);
        if (!doc) return json(res, 404, { error: 'Recipe not found' });
        return json(res, 200, doc);
      }

      // PATCH /api/recipes/:id/rating
      if (id && sub === 'rating' && req.method === 'PATCH') {
        const { rating, review } = body;
        if (!rating || rating < 1 || rating > 5) return json(res, 400, { error: 'Rating must be 1–5' });
        const doc = await fsUpdate('recipes', id, { rating, review: review || null });
        return json(res, 200, doc);
      }

      // POST /api/recipes/:id/bakes
      if (id && sub === 'bakes' && req.method === 'POST') {
        const { date, notes } = body;
        if (!date) return json(res, 400, { error: 'Date is required' });
        const existing = await fsGet('recipes', id);
        if (!existing) return json(res, 404, { error: 'Recipe not found' });
        const bake_log = [...(existing.bake_log || []), { date, notes: notes || null }];
        const doc = await fsUpdate('recipes', id, { bake_log });
        return json(res, 200, doc);
      }

      // GET /api/recipes/:id/cookbooks
      if (id && sub === 'cookbooks' && req.method === 'GET') {
        const recipe = await fsGet('recipes', id);
        if (!recipe) return json(res, 200, []);
        const ids = recipe.cookbook_ids || [];
        if (!ids.length) return json(res, 200, []);
        const cookbooks = await Promise.all(ids.map(cid => fsGet('cookbooks', cid)));
        return json(res, 200, cookbooks.filter(Boolean));
      }

      // PUT /api/recipes/:id/cookbooks
      if (id && sub === 'cookbooks' && req.method === 'PUT') {
        await fsUpdate('recipes', id, { cookbook_ids: body.cookbook_ids || [] });
        return json(res, 200, { ok: true });
      }

      // PATCH /api/recipes/:id
      if (id && !sub && req.method === 'PATCH') {
        const { title, description, prep_time, cook_time, yield: y, ingredient_groups, instructions, equipment } = body;
        const updates = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (prep_time !== undefined) updates.prep_time = prep_time;
        if (cook_time !== undefined) updates.cook_time = cook_time;
        if (y !== undefined) updates.yield = y;
        if (ingredient_groups !== undefined) updates.ingredient_groups = ingredient_groups;
        if (instructions !== undefined) updates.instructions = instructions;
        if (equipment !== undefined) updates.equipment = equipment;
        if (!Object.keys(updates).length) return json(res, 400, { error: 'Nothing to update' });
        const doc = await fsUpdate('recipes', id, updates);
        return json(res, 200, doc);
      }

      // DELETE /api/recipes/:id
      if (id && !sub && req.method === 'DELETE') {
        await fsDelete('recipes', id);
        return json(res, 200, { ok: true });
      }
    }

    // ── Cookbooks ─────────────────────────────────────────────────────────────
    if (col === 'cookbooks') {
      async function enrichCookbook(cb) {
        const recipes = await fsQuery('recipes', { where: { field: 'cookbook_ids', op: 'ARRAY_CONTAINS', value: cb.id } });
        const pinned = cb.pinned_images || [];
        const preview_images = pinned.length > 0 ? pinned.slice(0, 3) : recipes.map(r => r.image_url).filter(Boolean).slice(0, 3);
        return { ...cb, recipe_count: recipes.length, preview_images };
      }

      // GET /api/cookbooks
      if (!id && req.method === 'GET') {
        const docs = await fsQuery('cookbooks', { orderBy: 'created_at', orderDir: 'DESCENDING' });
        const cookbooks = await Promise.all(docs.map(enrichCookbook));
        return json(res, 200, cookbooks);
      }

      // POST /api/cookbooks
      if (!id && req.method === 'POST') {
        const { name, color, icon } = body;
        if (!name?.trim()) return json(res, 400, { error: 'Name is required' });
        const doc = await fsAdd('cookbooks', { name: name.trim(), color: color ?? null, icon: icon ?? null, pinned_images: [], created_at: new Date().toISOString() });
        return json(res, 201, { ...doc, recipe_count: 0, preview_images: [] });
      }

      // GET /api/cookbooks/:id
      if (id && !sub && req.method === 'GET') {
        const doc = await fsGet('cookbooks', id);
        if (!doc) return json(res, 404, { error: 'Cookbook not found' });
        return json(res, 200, await enrichCookbook(doc));
      }

      // PATCH /api/cookbooks/:id
      if (id && !sub && req.method === 'PATCH') {
        const { name, color, icon, pinned_images } = body;
        const updates = {};
        if (name?.trim()) updates.name = name.trim();
        if (color !== undefined) updates.color = color;
        if (icon !== undefined) updates.icon = icon;
        if (pinned_images !== undefined) updates.pinned_images = pinned_images;
        if (!Object.keys(updates).length) return json(res, 400, { error: 'Nothing to update' });
        const doc = await fsUpdate('cookbooks', id, updates);
        return json(res, 200, await enrichCookbook(doc));
      }

      // DELETE /api/cookbooks/:id
      if (id && !sub && req.method === 'DELETE') {
        const recipes = await fsQuery('recipes', { where: { field: 'cookbook_ids', op: 'ARRAY_CONTAINS', value: id } });
        await Promise.all(recipes.map(r => fsUpdate('recipes', r.id, { cookbook_ids: (r.cookbook_ids || []).filter(cid => cid !== id) })));
        await fsDelete('cookbooks', id);
        return json(res, 200, { ok: true });
      }

      // POST /api/cookbooks/:id/recipes
      if (id && sub === 'recipes' && req.method === 'POST') {
        const { recipe_ids } = body;
        if (!Array.isArray(recipe_ids) || !recipe_ids.length) return json(res, 400, { error: 'recipe_ids required' });
        await Promise.all(recipe_ids.map(async rid => {
          const recipe = await fsGet('recipes', rid);
          if (!recipe) return;
          const existing = recipe.cookbook_ids || [];
          if (!existing.includes(id)) await fsUpdate('recipes', rid, { cookbook_ids: [...existing, id] });
        }));
        return json(res, 200, { ok: true });
      }

      // GET /api/cookbooks/:id/recipes
      if (id && sub === 'recipes' && req.method === 'GET') {
        const recipes = await fsQuery('recipes', { where: { field: 'cookbook_ids', op: 'ARRAY_CONTAINS', value: id } });
        return json(res, 200, recipes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      }
    }

    // ── Pantry ────────────────────────────────────────────────────────────────
    if (col === 'pantry') {
      if (!id && req.method === 'GET') {
        const docs = await fsQuery('pantry_items', { orderBy: 'name', orderDir: 'ASCENDING' });
        return json(res, 200, docs);
      }
      if (!id && req.method === 'POST') {
        const { name, quantity = 0, unit = '', needs_purchase = 0 } = body;
        if (!name?.trim()) return json(res, 400, { error: 'Name is required' });
        const now = new Date().toISOString();
        const doc = await fsAdd('pantry_items', { name: name.trim(), quantity, unit, needs_purchase: needs_purchase ? 1 : 0, created_at: now, updated_at: now });
        return json(res, 201, doc);
      }
      if (id && req.method === 'PATCH') {
        const { name, quantity, unit, needs_purchase } = body;
        const updates = { updated_at: new Date().toISOString() };
        if (name !== undefined) updates.name = name.trim();
        if (quantity !== undefined) updates.quantity = quantity;
        if (unit !== undefined) updates.unit = unit;
        if (needs_purchase !== undefined) updates.needs_purchase = needs_purchase ? 1 : 0;
        const doc = await fsUpdate('pantry_items', id, updates);
        return json(res, 200, doc);
      }
      if (id && req.method === 'DELETE') {
        await fsDelete('pantry_items', id);
        return json(res, 200, { ok: true });
      }
    }

    // ── Search ────────────────────────────────────────────────────────────────
    if (col === 'search' && req.method === 'GET') {
      const q = url.searchParams.get('q');
      if (!q?.trim()) return json(res, 400, { error: 'Query is required' });
      const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
      const cx = process.env.GOOGLE_SEARCH_CX;
      if (!apiKey || apiKey === 'your_key_here' || !cx || cx === 'your_cx_here') {
        return json(res, 503, { error: 'Search is not configured' });
      }
      const query = q.toLowerCase().includes('recipe') ? q : `${q} recipe`;
      const gRes = await fetch(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=10`);
      const gData = await gRes.json();
      if (!gRes.ok) {
        const reason = gData?.error?.errors?.[0]?.reason;
        if (gRes.status === 429 || reason === 'rateLimitExceeded' || reason === 'dailyLimitExceeded') return json(res, 429, { error: 'Search quota exceeded' });
        if (gRes.status === 403) return json(res, 403, { error: 'Search quota exceeded' });
        return json(res, 500, { error: gData?.error?.message || 'Search failed' });
      }
      const results = (gData.items || []).map(item => ({
        title: item.title, url: item.link,
        snippet: item.snippet?.replace(/\n/g, ' ') || '',
        displayUrl: item.displayLink,
      }));
      return json(res, 200, results);
    }

    json(res, 404, { error: 'Not found' });
  } catch (err) {
    console.error(err);
    json(res, 500, { error: err.message });
  }
}
