import Groq from 'groq-sdk';

const VALID_CATEGORIES = ['Cookies', 'Cakes', 'Bars'];

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
          content: 'You are a baked-goods classifier. Reply ONLY with a JSON object: {"category": "<value>"}. Valid values: Cookies, Cakes, Bars. Cookies = individual drop/rolled/sandwich cookies. Bars = brownies, blondies, lemon bars, bar cookies baked in a pan and sliced. Cakes = layer cakes, cheesecakes, bundt cakes, cupcakes, muffins, quick breads, loaves, anything else. Pick the single best fit.',
        },
        {
          role: 'user',
          content: `Title: ${title}\nIngredients: ${ingredients}`,
        },
      ],
    });

    const text = response.choices[0]?.message?.content ?? '';
    const match = text.match(/\{[^}]+\}/);
    if (!match) return keywordFallback(title, ingredient_groups);
    const { category } = JSON.parse(match[0]);
    return VALID_CATEGORIES.includes(category) ? category : keywordFallback(title, ingredient_groups);
  } catch {
    return keywordFallback(title, ingredient_groups);
  }
}

function keywordFallback(title, _ingredient_groups) {
  const text = title.toLowerCase();
  const BARS = ['brownie', 'blondie', 'bar cookie', 'lemon bar', 'magic bar', 'rice crispy', 'rice krispie', 'fudge bar', 'seven layer', 'hello dolly', 'congo bar'];
  const COOKIES = ['cookie', 'biscotti', 'shortbread', 'snickerdoodle', 'macaroon', 'macaron', 'rugelach', 'hamantaschen', 'biscuit'];
  if (BARS.some(k => text.includes(k))) return 'Bars';
  if (COOKIES.some(k => text.includes(k))) return 'Cookies';
  return 'Cakes'; // everything else: cakes, cheesecakes, muffins, quick breads, etc.
}
