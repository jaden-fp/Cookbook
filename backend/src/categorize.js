import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VALID_CATEGORIES = ['Cookies', 'Muffins', 'Cakes', 'Breads', 'Pastries'];

export async function categorizeRecipe({ title, ingredient_groups = [] }) {
  const ingredients = ingredient_groups
    .flatMap(g => g.ingredients || [])
    .slice(0, 15)
    .map(i => i.name)
    .join(', ');

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 32,
    system: 'You are a baked-goods classifier. Reply ONLY with a JSON object: {"category": "<value>"}. Valid values: Cookies, Muffins, Cakes, Breads, Pastries, Other. Pick the single best fit.',
    messages: [{
      role: 'user',
      content: `Title: ${title}\nIngredients: ${ingredients}`,
    }],
  });

  const text = response.content.find(b => b.type === 'text')?.text ?? '';
  // Extract JSON even if the model adds extra whitespace or text
  const match = text.match(/\{[^}]+\}/);
  if (!match) return 'Other';

  try {
    const { category } = JSON.parse(match[0]);
    return VALID_CATEGORIES.includes(category) ? category : 'Other';
  } catch {
    return 'Other';
  }
}
