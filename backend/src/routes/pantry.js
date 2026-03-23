import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// GET /api/pantry
router.get('/', async (_req, res) => {
  const snapshot = await db.collection('pantry_items').orderBy('name', 'asc').get();
  res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
});

// POST /api/pantry
router.post('/', async (req, res) => {
  const { name, quantity = 0, unit = '', needs_purchase = 0 } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

  const now = new Date().toISOString();
  const docRef = await db.collection('pantry_items').add({
    name: name.trim(),
    quantity,
    unit,
    needs_purchase: needs_purchase ? 1 : 0,
    created_at: now,
    updated_at: now,
  });
  const doc = await docRef.get();
  res.status(201).json({ id: doc.id, ...doc.data() });
});

// PATCH /api/pantry/:id
router.patch('/:id', async (req, res) => {
  const { quantity, unit, needs_purchase } = req.body;
  const updates = { updated_at: new Date().toISOString() };
  if (quantity !== undefined) updates.quantity = quantity;
  if (unit !== undefined) updates.unit = unit;
  if (needs_purchase !== undefined) updates.needs_purchase = needs_purchase ? 1 : 0;

  const ref = db.collection('pantry_items').doc(req.params.id);
  await ref.update(updates);
  const doc = await ref.get();
  if (!doc.exists) return res.status(404).json({ error: 'Not found' });
  res.json({ id: doc.id, ...doc.data() });
});

// DELETE /api/pantry/:id
router.delete('/:id', async (req, res) => {
  await db.collection('pantry_items').doc(req.params.id).delete();
  res.json({ ok: true });
});

export default router;
