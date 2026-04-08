import { Router } from 'express';
import Groq from 'groq-sdk';
import { fsAdd, fsGet, fsUpdate, fsDelete, fsQuery } from '../firestore.js';

const router = Router();

const VALID_CATEGORIES = ['Dairy', 'Flours', 'Sweeteners', 'Fats & Oils', 'Chocolate', 'Spices', 'Extracts', 'Leavening', 'Nuts', 'Other'];

async function categorizeIngredient(name) {
  if (!process.env.GROQ_API_KEY) return 'Other';
  try {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const response = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 20,
      messages: [
        {
          role: 'system',
          content: `Categorize baking pantry ingredients into exactly one category. Reply ONLY with JSON: {"category": "<value>"}.\nValid categories: ${VALID_CATEGORIES.join(', ')}.\nExamples: butter→Fats & Oils, eggs→Dairy, milk→Dairy, cream→Dairy, all-purpose flour→Flours, bread flour→Flours, granulated sugar→Sweeteners, brown sugar→Sweeteners, powdered sugar→Sweeteners, honey→Sweeteners, maple syrup→Sweeteners, cocoa powder→Chocolate, chocolate chips→Chocolate, vanilla extract→Extracts, almond extract→Extracts, cinnamon→Spices, salt→Spices, baking powder→Leavening, baking soda→Leavening, yeast→Leavening, walnuts→Nuts, almonds→Nuts, olive oil→Fats & Oils, vegetable oil→Fats & Oils.`,
        },
        { role: 'user', content: `Ingredient: "${name}"` },
      ],
    });
    const text = response.choices[0]?.message?.content ?? '';
    const match = text.match(/\{[^}]+\}/);
    if (!match) return 'Other';
    const { category } = JSON.parse(match[0]);
    return VALID_CATEGORIES.includes(category) ? category : 'Other';
  } catch {
    return 'Other';
  }
}

// GET /api/pantry
router.get('/', async (_req, res) => {
  const docs = await fsQuery('pantry_items', { orderBy: 'name', orderDir: 'ASCENDING' });
  res.json(docs);
});

// POST /api/pantry
router.post('/', async (req, res) => {
  const { name, quantity = 0, unit = '', needs_purchase = 0, status, category } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  const now = new Date().toISOString();

  // Auto-categorize if no category provided
  const resolvedCategory = category || await categorizeIngredient(name.trim());
  // Derive status from legacy field if not provided
  const resolvedStatus = status || (needs_purchase ? 'out' : 'in-stock');

  const doc = await fsAdd('pantry_items', {
    name: name.trim(),
    quantity,
    unit,
    needs_purchase: needs_purchase ? 1 : 0,
    status: resolvedStatus,
    category: resolvedCategory,
    created_at: now,
    updated_at: now,
  });
  res.status(201).json(doc);
});

// PATCH /api/pantry/:id
router.patch('/:id', async (req, res) => {
  const { name, quantity, unit, needs_purchase, status, category } = req.body;
  const updates = { updated_at: new Date().toISOString() };
  if (name !== undefined) updates.name = name.trim();
  if (quantity !== undefined) updates.quantity = quantity;
  if (unit !== undefined) updates.unit = unit;
  if (needs_purchase !== undefined) updates.needs_purchase = needs_purchase ? 1 : 0;
  if (status !== undefined) updates.status = status;
  if (category !== undefined) updates.category = category;
  // Keep status + needs_purchase in sync
  if (status === 'in-stock') updates.needs_purchase = 0;
  if (status === 'out') updates.needs_purchase = 1;
  const doc = await fsUpdate('pantry_items', req.params.id, updates);
  res.json(doc);
});

// POST /api/pantry/:id/categorize — auto-categorize a single item
router.post('/:id/categorize', async (req, res) => {
  const doc = await fsGet('pantry_items', req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  const category = await categorizeIngredient(doc.name);
  const updated = await fsUpdate('pantry_items', req.params.id, { category, updated_at: new Date().toISOString() });
  res.json(updated);
});

// DELETE /api/pantry/:id
router.delete('/:id', async (req, res) => {
  await fsDelete('pantry_items', req.params.id);
  res.json({ ok: true });
});

export default router;
