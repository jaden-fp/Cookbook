const RULES = [
  { category: 'Cookies', keywords: ['cookie', 'cookies', 'biscuit', 'biscotti', 'shortbread', 'brownie', 'bar', 'bars', 'blondie', 'snickerdoodle', 'macaroon', 'macaron'] },
  { category: 'Muffins',  keywords: ['muffin', 'muffins', 'cupcake', 'cupcakes'] },
  { category: 'Cakes',    keywords: ['cake', 'cakes', 'cheesecake', 'loaf cake', 'bundt', 'torte', 'gateau', 'sponge', 'layer cake', 'pound cake', 'coffee cake', 'upside-down'] },
  { category: 'Breads',   keywords: ['bread', 'breads', 'loaf', 'roll', 'rolls', 'bun', 'buns', 'sourdough', 'focaccia', 'brioche', 'baguette', 'scone', 'scones', 'biscuit', 'cornbread', 'flatbread'] },
  { category: 'Pastries', keywords: ['pastry', 'pastries', 'croissant', 'danish', 'tart', 'tarts', 'pie', 'pies', 'galette', 'strudel', 'éclair', 'profiterole', 'choux', 'puff', 'turnover', 'quiche', 'cinnamon roll'] },
];

export async function categorizeRecipe({ title, ingredient_groups = [] }) {
  const text = title.toLowerCase();
  for (const { category, keywords } of RULES) {
    if (keywords.some(k => text.includes(k))) return category;
  }
  // fallback: check first 15 ingredient names
  const ingredients = ingredient_groups
    .flatMap(g => g.ingredients || [])
    .slice(0, 15)
    .map(i => (i.name || '').toLowerCase())
    .join(' ');
  for (const { category, keywords } of RULES) {
    if (keywords.some(k => ingredients.includes(k))) return category;
  }
  return 'Other';
}
