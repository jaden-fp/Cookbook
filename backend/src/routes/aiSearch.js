import { Router } from 'express';
import Groq from 'groq-sdk';

const router = Router();

// POST /api/ai-search
// Body: { query: string, recipes: { id, title, description, ai_category, tags }[] }
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

  const catalog = recipes.map(r =>
    `${r.id}|${r.title}${r.ai_category ? ` (${r.ai_category})` : ''}${r.tags?.length ? ` [${r.tags.join(', ')}]` : ''}${r.description ? ` - ${r.description.slice(0, 80)}` : ''}`
  ).join('\n');

  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 256,
      messages: [
        {
          role: 'system',
          content: 'You are a baking recipe assistant. Given a user\'s craving or mood, return the IDs of up to 8 matching recipes from the catalog, ordered by relevance. Reply ONLY with a JSON object: {"ids": ["id1", "id2", ...]}. Only include IDs from the catalog. If nothing matches well, return fewer.',
        },
        {
          role: 'user',
          content: `Craving/mood: "${query}"\n\nRecipe catalog (id|title):\n${catalog}`,
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
