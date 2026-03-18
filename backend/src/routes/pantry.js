import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/pantry
router.get('/', async (_req, res) => {
  const { rows } = await db.execute('SELECT * FROM pantry_items ORDER BY name ASC');
  res.json(rows.map(r => ({ ...r })));
});

// POST /api/pantry
router.post('/', async (req, res) => {
  const { name, quantity = 0, unit = '', needs_purchase = 0 } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

  const result = await db.execute({
    sql: 'INSERT INTO pantry_items (name, quantity, unit, needs_purchase) VALUES (?, ?, ?, ?)',
    args: [name.trim(), quantity, unit, needs_purchase ? 1 : 0],
  });
  const { rows } = await db.execute({
    sql: 'SELECT * FROM pantry_items WHERE id = ?',
    args: [Number(result.lastInsertRowid)],
  });
  res.status(201).json({ ...rows[0] });
});

// PATCH /api/pantry/:id
router.patch('/:id', async (req, res) => {
  const { quantity, unit, needs_purchase } = req.body;
  const fields = [];
  const values = [];
  if (quantity !== undefined) { fields.push('quantity = ?'); values.push(quantity); }
  if (unit !== undefined) { fields.push('unit = ?'); values.push(unit); }
  if (needs_purchase !== undefined) { fields.push('needs_purchase = ?'); values.push(needs_purchase ? 1 : 0); }
  if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
  values.push(req.params.id);

  await db.execute({
    sql: `UPDATE pantry_items SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    args: values,
  });
  const { rows } = await db.execute({ sql: 'SELECT * FROM pantry_items WHERE id = ?', args: [req.params.id] });
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json({ ...rows[0] });
});

// DELETE /api/pantry/:id
router.delete('/:id', async (req, res) => {
  await db.execute({ sql: 'DELETE FROM pantry_items WHERE id = ?', args: [req.params.id] });
  res.json({ ok: true });
});

export default router;
