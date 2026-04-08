import { Router } from 'express';
import Groq from 'groq-sdk';

const router = Router();

// POST /api/ai-search
// Body: { query: string, recipes: { id, title, description, ai_category, tags, ingredients }[] }
// Returns: { ids: string[] } — ordered by relevance, up to 8 matches
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
    const meta = [
      r.ai_category ? `(${r.ai_category})` : '',
      r.tags?.length ? `[${r.tags.join(', ')}]` : '',
      r.description ? `- ${r.description.slice(0, 80)}` : '',
      r.ingredients?.length ? `{ingredients: ${r.ingredients.slice(0, 20).join(', ')}}` : '',
    ].filter(Boolean).join(' ');
    return `${r.id}|${r.title} ${meta}`;
  }).join('\n');

  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: `You are a baking recipe search engine. Match recipes by ingredients, flavors, textures, and vibes — not just title keywords.
Key rules:
- Match on INGREDIENTS (e.g. "sprinkles" → recipes that list sprinkles; "fruit" → recipes with berries, lemon, apple, etc.)
- Match on FLAVOR/MOOD (e.g. "fruity", "chocolatey", "festive", "cozy")
- Be INCLUSIVE: return every recipe that plausibly fits, up to 8
- Be EXCLUSIVE: skip recipes that clearly don't fit
- Reply ONLY with valid JSON: {"ids": ["id1", "id2", ...]}`,
        },
        {
          role: 'user',
          content: `Search: "${query}"\n\nCatalog (id|title meta {ingredients}):\n${catalog}`,
        },
      ],
    });

    const text = response.choices[0]?.message?.content ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return res.json({ ids: keywordFallback(query, recipes) });
    const { ids } = JSON.parse(match[0]);
    if (!Array.isArray(ids)) return res.json({ ids: keywordFallback(query, recipes) });
    // Validate: only return IDs that exist in our catalog
    const validIds = new Set(recipes.map(r => r.id));
    return res.json({ ids: ids.filter(id => validIds.has(id)).slice(0, 8) });
  } catch {
    return res.json({ ids: keywordFallback(query, recipes) });
  }
});

function keywordFallback(query, recipes) {
  const q = query.toLowerCase();
  return recipes
    .filter(r => {
      const text = `${r.title} ${r.ai_category ?? ''} ${(r.tags ?? []).join(' ')} ${r.description ?? ''}`.toLowerCase();
      return q.split(/\s+/).some(w => w.length > 3 && text.includes(w));
    })
    .slice(0, 8)
    .map(r => r.id);
}

export default router;
