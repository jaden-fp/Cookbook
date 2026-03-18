import { Router } from 'express';
import db from '../db.js';

const router = Router();

const COOKBOOK_SELECT = `
  SELECT c.*, COUNT(rc.recipe_id) as recipe_count,
    (SELECT json_group_array(r.image_url)
     FROM (SELECT r2.image_url FROM recipes r2
           JOIN recipe_cookbooks rc2 ON rc2.recipe_id = r2.id
           WHERE rc2.cookbook_id = c.id AND r2.image_url IS NOT NULL AND r2.image_url != ''
           LIMIT 3) r
    ) as preview_images
   FROM cookbooks c
   LEFT JOIN recipe_cookbooks rc ON rc.cookbook_id = c.id`;

// GET /api/cookbooks
router.get('/', async (_req, res) => {
  const { rows } = await db.execute(`${COOKBOOK_SELECT} GROUP BY c.id ORDER BY c.created_at DESC`);
  res.json(rows.map(r => parseCookbook({ ...r })));
});

// POST /api/cookbooks
router.post('/', async (req, res) => {
  const { name, color, icon } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

  const result = await db.execute({
    sql: 'INSERT INTO cookbooks (name, color, icon) VALUES (?, ?, ?)',
    args: [name.trim(), color ?? null, icon ?? null],
  });
  const { rows } = await db.execute({
    sql: 'SELECT * FROM cookbooks WHERE id = ?',
    args: [Number(result.lastInsertRowid)],
  });
  res.status(201).json({ ...rows[0], recipe_count: 0, preview_images: [] });
});

// PATCH /api/cookbooks/:id
router.patch('/:id', async (req, res) => {
  const { name, color, icon, pinned_images } = req.body;
  const fields = [];
  const values = [];
  if (name?.trim()) { fields.push('name = ?'); values.push(name.trim()); }
  if (color !== undefined) { fields.push('color = ?'); values.push(color); }
  if (icon !== undefined) { fields.push('icon = ?'); values.push(icon); }
  if (pinned_images !== undefined) { fields.push('pinned_images = ?'); values.push(JSON.stringify(pinned_images)); }
  if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
  values.push(req.params.id);

  await db.execute({ sql: `UPDATE cookbooks SET ${fields.join(', ')} WHERE id = ?`, args: values });

  const { rows } = await db.execute({
    sql: `${COOKBOOK_SELECT} WHERE c.id = ? GROUP BY c.id`,
    args: [req.params.id],
  });
  res.json(parseCookbook({ ...rows[0] }));
});

// GET /api/cookbooks/:id
router.get('/:id', async (req, res) => {
  const { rows } = await db.execute({
    sql: `${COOKBOOK_SELECT} WHERE c.id = ? GROUP BY c.id`,
    args: [req.params.id],
  });
  if (!rows[0]) return res.status(404).json({ error: 'Cookbook not found' });
  res.json(parseCookbook({ ...rows[0] }));
});

// DELETE /api/cookbooks/:id
router.delete('/:id', async (req, res) => {
  await db.execute({ sql: 'DELETE FROM cookbooks WHERE id = ?', args: [req.params.id] });
  res.json({ ok: true });
});

// POST /api/cookbooks/:id/recipes  (add existing recipes)
router.post('/:id/recipes', async (req, res) => {
  const { recipe_ids } = req.body;
  if (!Array.isArray(recipe_ids) || !recipe_ids.length) {
    return res.status(400).json({ error: 'recipe_ids required' });
  }
  try {
    await db.batch(
      recipe_ids.map(rid => ({
        sql: 'INSERT OR IGNORE INTO recipe_cookbooks (recipe_id, cookbook_id) VALUES (?, ?)',
        args: [rid, req.params.id],
      })),
      'write'
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Error adding recipes to cookbook:', err);
    res.status(500).json({ error: err.message || 'Failed to add recipes' });
  }
});

// GET /api/cookbooks/:id/recipes
router.get('/:id/recipes', async (req, res) => {
  const { rows } = await db.execute({
    sql: `SELECT r.* FROM recipes r
          JOIN recipe_cookbooks rc ON rc.recipe_id = r.id
          WHERE rc.cookbook_id = ?
          ORDER BY r.created_at DESC`,
    args: [req.params.id],
  });
  res.json(rows.map(r => parseRecipe({ ...r })));
});

function parseCookbook(c) {
  return {
    ...c,
    preview_images: tryParse(c.preview_images, []),
    pinned_images: tryParse(c.pinned_images, []),
  };
}

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
