import { Router } from 'express';

const router = Router();

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
