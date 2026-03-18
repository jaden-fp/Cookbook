import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/cookbooks
router.get('/', (req, res) => {
  const cookbooks = db
    .prepare(
      `SELECT c.*, COUNT(rc.recipe_id) as recipe_count
       FROM cookbooks c
       LEFT JOIN recipe_cookbooks rc ON rc.cookbook_id = c.id
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    )
    .all();
  res.json(cookbooks);
});

// POST /api/cookbooks
router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

  const result = db.prepare('INSERT INTO cookbooks (name) VALUES (?)').run(name.trim());
  const cookbook = db.prepare('SELECT * FROM cookbooks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...cookbook, recipe_count: 0 });
});

// GET /api/cookbooks/:id
router.get('/:id', (req, res) => {
  const cookbook = db
    .prepare(
      `SELECT c.*, COUNT(rc.recipe_id) as recipe_count
       FROM cookbooks c
       LEFT JOIN recipe_cookbooks rc ON rc.cookbook_id = c.id
       WHERE c.id = ?
       GROUP BY c.id`
    )
    .get(req.params.id);
  if (!cookbook) return res.status(404).json({ error: 'Cookbook not found' });
  res.json(cookbook);
});

// DELETE /api/cookbooks/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM cookbooks WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// GET /api/cookbooks/:id/recipes
router.get('/:id/recipes', (req, res) => {
  const recipes = db
    .prepare(
      `SELECT r.* FROM recipes r
       JOIN recipe_cookbooks rc ON rc.recipe_id = r.id
       WHERE rc.cookbook_id = ?
       ORDER BY r.created_at DESC`
    )
    .all(req.params.id);
  res.json(recipes.map(parseRecipe));
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
