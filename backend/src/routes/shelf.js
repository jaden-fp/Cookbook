import { Router } from 'express';
import { fsGet, fsSet } from '../firestore.js';

const router = Router();
const SHELF_ID = 'default';

async function getShelfIds() {
  const doc = await fsGet('shelf', SHELF_ID);
  return doc?.recipe_ids ?? [];
}

// GET /api/shelf — return { recipe_ids: string[] }
router.get('/', async (_req, res) => {
  const ids = await getShelfIds();
  res.json({ recipe_ids: ids });
});

// POST /api/shelf/:recipeId — add recipe to shelf
router.post('/:recipeId', async (req, res) => {
  const ids = await getShelfIds();
  if (!ids.includes(req.params.recipeId)) {
    ids.push(req.params.recipeId);
    await fsSet('shelf', SHELF_ID, { recipe_ids: ids });
  }
  res.json({ recipe_ids: ids });
});

// DELETE /api/shelf/:recipeId — remove recipe from shelf
router.delete('/:recipeId', async (req, res) => {
  const ids = await getShelfIds();
  const updated = ids.filter(id => id !== req.params.recipeId);
  await fsSet('shelf', SHELF_ID, { recipe_ids: updated });
  res.json({ recipe_ids: updated });
});

export default router;
