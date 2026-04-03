import Groq from 'groq-sdk';

const VALID_CATEGORIES = ['Cookies', 'Muffins', 'Cakes', 'Breads', 'Pastries', 'Other'];

export async function categorizeRecipe({ title, ingredient_groups = [] }) {
  if (!process.env.GROQ_API_KEY) return keywordFallback(title, ingredient_groups);

  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const ingredients = ingredient_groups
    .flatMap(g => g.ingredients || [])
    .slice(0, 15)
    .map(i => i.name)
    .join(', ');

  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 32,
      messages: [
        {
          role: 'system',
          content: 'You are a baked-goods classifier. Reply ONLY with a JSON object: {"category": "<value>"}. Valid values: Cookies, Muffins, Cakes, Breads, Pastries, Other. Pick the single best fit.',
        },
        {
          role: 'user',
          content: `Title: ${title}\nIngredients: ${ingredients}`,
        },
      ],
    });

    const text = response.choices[0]?.message?.content ?? '';
    const match = text.match(/\{[^}]+\}/);
    if (!match) return 'Other';
    const { category } = JSON.parse(match[0]);
    return VALID_CATEGORIES.includes(category) ? category : 'Other';
  } catch {
    return keywordFallback(title, ingredient_groups);
  }
}

function keywordFallback(title, ingredient_groups) {
  const RULES = [
    { category: 'Cookies', keywords: ['cookie', 'cookies', 'biscotti', 'shortbread', 'brownie', 'blondie', 'snickerdoodle', 'macaroon', 'macaron'] },
    { category: 'Muffins',  keywords: ['muffin', 'muffins', 'cupcake', 'cupcakes'] },
    { category: 'Cakes',    keywords: ['cake', 'cakes', 'cheesecake', 'bundt', 'torte', 'gateau', 'sponge', 'pound cake', 'coffee cake', 'upside-down'] },
    { category: 'Breads',   keywords: ['bread', 'breads', 'loaf', 'sourdough', 'focaccia', 'brioche', 'baguette', 'scone', 'scones', 'cornbread', 'flatbread', 'cinnamon roll'] },
    { category: 'Pastries', keywords: ['pastry', 'pastries', 'croissant', 'danish', 'tart', 'tarts', 'galette', 'strudel', 'choux', 'turnover', 'quiche'] },
  ];
  const text = title.toLowerCase();
  for (const { category, keywords } of RULES) {
    if (keywords.some(k => text.includes(k))) return category;
  }
  return 'Other';
}
