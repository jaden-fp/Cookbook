import { Router } from 'express';
import Groq from 'groq-sdk';

const router = Router();

// GET /api/nutrition/price?q=rainbow+chip+sprinkles
router.get('/price', async (req, res) => {
  const q = req.query.q?.trim();
  if (!q) return res.status(400).json({ error: 'q required' });

  if (!process.env.GROQ_API_KEY) return res.json(null);

  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 120,
      messages: [
        {
          role: 'system',
          content: `You estimate US grocery store retail prices for baking ingredients. Reply ONLY with a JSON object.
Return: {"packagePrice": <number>, "packageAmount": <number>, "packageUnit": "<cup|tsp|tbsp|floz|oz|lb|g|piece>", "densityGPerCup": <number|null>}
packageUnit: the unit the item is typically sold in (e.g. oz for a bottle, lb for a bag, piece for individual items).
densityGPerCup: grams per cup (approximate). Use null for piece-sold items or if unknown.
Be realistic — use standard supermarket prices.`,
        },
        {
          role: 'user',
          content: `Ingredient: "${q}"`,
        },
      ],
    });

    const text = response.choices[0]?.message?.content ?? '';
    const match = text.match(/\{[\s\S]*?\}/);
    if (!match) return res.json(null);

    const data = JSON.parse(match[0]);
    if (typeof data.packagePrice !== 'number' || typeof data.packageAmount !== 'number' || !data.packageUnit) {
      return res.json(null);
    }

    res.json({
      packagePrice: data.packagePrice,
      packageAmount: data.packageAmount,
      packageUnit: data.packageUnit,
      densityGPerCup: typeof data.densityGPerCup === 'number' ? data.densityGPerCup : null,
    });
  } catch (err) {
    console.error('Price lookup error:', err.message);
    res.json(null);
  }
});

// GET /api/nutrition/search?q=vanilla+extract
router.get('/search', async (req, res) => {
  const q = req.query.q?.trim();
  if (!q) return res.status(400).json({ error: 'q required' });

  const apiKey = process.env.USDA_API_KEY || 'DEMO_KEY';
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(q)}&api_key=${apiKey}&pageSize=1&dataType=Foundation,SR%20Legacy`;

  try {
    const r = await fetch(url);
    if (!r.ok) return res.json(null);
    const data = await r.json();
    const food = data.foods?.[0];
    if (!food) return res.json(null);

    const get = (...terms) => {
      for (const term of terms) {
        const found = food.foodNutrients?.find(fn =>
          fn.nutrientName?.toLowerCase().includes(term.toLowerCase())
        );
        if (found?.value != null) return found.value;
      }
      return 0;
    };

    res.json({
      description: food.description,
      nutrition: {
        calories: get('Energy', 'energy'),
        protein: get('Protein', 'protein'),
        fat: get('Total lipid', 'lipid'),
        carbs: get('Carbohydrate', 'carbohydrate'),
        sugar: get('Sugars', 'sugar'),
      },
    });
  } catch (err) {
    console.error('USDA lookup error:', err.message);
    res.json(null);
  }
});

export default router;
