import { Router } from 'express';
import { fsAdd, fsGet, fsUpdate, fsDelete, fsQuery } from '../firestore.js';

const router = Router();

// GET /api/pantry
router.get('/', async (_req, res) => {
  const docs = await fsQuery('pantry_items', { orderBy: 'name', orderDir: 'ASCENDING' });
  res.json(docs);
});

// POST /api/pantry
router.post('/', async (req, res) => {
  const { name, quantity = 0, unit = '', needs_purchase = 0 } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  const now = new Date().toISOString();
  const doc = await fsAdd('pantry_items', {
    name: name.trim(),
    quantity,
    unit,
    needs_purchase: needs_purchase ? 1 : 0,
    created_at: now,
    updated_at: now,
  });
  res.status(201).json(doc);
});

// PATCH /api/pantry/:id
router.patch('/:id', async (req, res) => {
  const { name, quantity, unit, needs_purchase } = req.body;
  const updates = { updated_at: new Date().toISOString() };
  if (name !== undefined) updates.name = name.trim();
  if (quantity !== undefined) updates.quantity = quantity;
  if (unit !== undefined) updates.unit = unit;
  if (needs_purchase !== undefined) updates.needs_purchase = needs_purchase ? 1 : 0;
  const doc = await fsUpdate('pantry_items', req.params.id, updates);
  res.json(doc);
});

// DELETE /api/pantry/:id
router.delete('/:id', async (req, res) => {
  await fsDelete('pantry_items', req.params.id);
  res.json({ ok: true });
});

export default router;
