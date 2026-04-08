import { Router } from 'express';
import Groq from 'groq-sdk';

const router = Router();

// POST /api/ai-search
// Body: { query: string, recipes: { id, title, description, ai_category, tags, ingredients }[] }
// Returns: { ids: string[] } — ordered by relevance, up to 12 matches
router.post('/', async (req, res) => {
  const { query, recipes } = req.body;
  if (!query || !Array.isArray(recipes) || !recipes.length) {
    return res.status(400).json({ error: 'Missing query or recipes' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.json({ ids: keywordFallback(query, recipes) });
  }

  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const catalog = recipes.map(r => {
    const parts = [
      r.ai_category ? `(${r.ai_category})` : '',
      r.tags?.length ? `[${r.tags.join(', ')}]` : '',
      r.description ? `desc: ${r.description.slice(0, 60)}` : '',
      r.ingredients?.length ? `ingredients: ${r.ingredients.slice(0, 25).join(', ')}` : '',
    ].filter(Boolean).join(' | ');
    return `${r.id} :: ${r.title} | ${parts}`;
  }).join('\n');

  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 400,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `You are a precise baking recipe search engine. Your job is to find recipes that match a user's query based primarily on their INGREDIENTS.

STEP 1 — Expand the query into concrete ingredient keywords:
- "fruit" → strawberry, blueberry, raspberry, lemon, lime, orange, apple, peach, mango, banana, cherry, fig, pear, cranberry, zest
- "chocolate" → chocolate, cocoa, cacao, ganache, fudge
- "sprinkles" → sprinkles, funfetti, rainbow chips
- "spiced" / "warm spices" → cinnamon, nutmeg, ginger, cardamom, clove
- "nutty" → almond, pecan, walnut, hazelnut, peanut, pistachio
- "citrus" → lemon, lime, orange, grapefruit, zest
- For other queries, infer the relevant ingredient keywords yourself.

STEP 2 — For each recipe, check if any of its listed ingredients match the expanded keyword list.

STEP 3 — Include a recipe ONLY if it has at least one matching ingredient OR its title/category is an obvious match. EXCLUDE recipes with no connection at all.

STEP 4 — Return ALL matching recipes (up to 12), ordered by how many matching ingredients they have (most matches first).

Reply ONLY with valid JSON: {"ids": ["id1", "id2", ...]}
No explanation, no markdown, just the JSON object.`,
        },
        {
          role: 'user',
          content: `Query: "${query}"\n\nRecipe catalog:\n${catalog}`,
        },
      ],
    });

    const text = response.choices[0]?.message?.content ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return res.json({ ids: keywordFallback(query, recipes) });

    let parsed;
    try { parsed = JSON.parse(match[0]); } catch { return res.json({ ids: keywordFallback(query, recipes) }); }

    const { ids } = parsed;
    if (!Array.isArray(ids)) return res.json({ ids: keywordFallback(query, recipes) });

    const validIds = new Set(recipes.map(r => r.id));
    return res.json({ ids: ids.filter(id => validIds.has(String(id))).slice(0, 12) });
  } catch (err) {
    console.error('AI search error:', err?.message);
    return res.json({ ids: keywordFallback(query, recipes) });
  }
});

function keywordFallback(query, recipes) {
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  return recipes
    .filter(r => {
      const text = [
        r.title,
        r.ai_category ?? '',
        ...(r.tags ?? []),
        r.description ?? '',
        ...(r.ingredients ?? []),
      ].join(' ').toLowerCase();
      return words.some(w => text.includes(w));
    })
    .slice(0, 12)
    .map(r => r.id);
}

export default router;
