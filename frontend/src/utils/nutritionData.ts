// Nutrition per 100g and gram weights for common baking units.
// Values are approximate averages from USDA/standard references.

export interface NutrientPer100g {
  calories: number; // kcal
  protein: number;  // g
  fat: number;      // g
  sugar: number;    // g
  carbs: number;    // g
}

export interface IngredientEntry {
  /** Aliases used for fuzzy matching — lowercase, no punctuation */
  aliases: string[];
  nutrition: NutrientPer100g;
  /** Grams per 1 cup (for volume → mass conversion) */
  gramsPerCup?: number;
  /** Grams per 1 tablespoon */
  gramsPerTbsp?: number;
  /** Grams per single whole item ("each", "large", "medium") */
  gramsPerUnit?: number;
}

export const INGREDIENTS: IngredientEntry[] = [
  // ── Flours ─────────────────────────────────────────────────────────────
  {
    aliases: ['all purpose flour', 'all-purpose flour', 'plain flour', 'ap flour', 'flour'],
    nutrition: { calories: 364, protein: 10.3, fat: 1.0, sugar: 0.3, carbs: 76.3 },
    gramsPerCup: 125, gramsPerTbsp: 7.8,
  },
  {
    aliases: ['bread flour', 'strong flour'],
    nutrition: { calories: 361, protein: 12.9, fat: 1.7, sugar: 0.3, carbs: 72.5 },
    gramsPerCup: 127, gramsPerTbsp: 8.0,
  },
  {
    aliases: ['cake flour', 'pastry flour'],
    nutrition: { calories: 361, protein: 9.0, fat: 1.0, sugar: 0.3, carbs: 76.0 },
    gramsPerCup: 120, gramsPerTbsp: 7.5,
  },
  {
    aliases: ['whole wheat flour', 'wholemeal flour', 'whole grain flour', 'wheat flour'],
    nutrition: { calories: 340, protein: 13.2, fat: 2.5, sugar: 0.4, carbs: 72.6 },
    gramsPerCup: 130, gramsPerTbsp: 8.1,
  },
  {
    aliases: ['almond flour', 'almond meal', 'ground almonds'],
    nutrition: { calories: 571, protein: 21.2, fat: 50.6, sugar: 4.4, carbs: 21.4 },
    gramsPerCup: 96, gramsPerTbsp: 6.0,
  },
  {
    aliases: ['coconut flour'],
    nutrition: { calories: 400, protein: 18.0, fat: 14.0, sugar: 9.0, carbs: 60.0 },
    gramsPerCup: 112, gramsPerTbsp: 7.0,
  },
  {
    aliases: ['oat flour', 'ground oats'],
    nutrition: { calories: 375, protein: 14.7, fat: 7.3, sugar: 1.0, carbs: 66.0 },
    gramsPerCup: 92, gramsPerTbsp: 5.75,
  },
  {
    aliases: ['corn flour', 'cornmeal', 'polenta', 'masa'],
    nutrition: { calories: 361, protein: 7.1, fat: 3.6, sugar: 0.6, carbs: 76.9 },
    gramsPerCup: 156, gramsPerTbsp: 9.75,
  },
  {
    aliases: ['rice flour', 'white rice flour'],
    nutrition: { calories: 366, protein: 5.9, fat: 1.4, sugar: 0.1, carbs: 80.1 },
    gramsPerCup: 158, gramsPerTbsp: 9.9,
  },
  {
    aliases: ['rye flour', 'dark rye flour'],
    nutrition: { calories: 335, protein: 9.5, fat: 1.8, sugar: 0.9, carbs: 72.2 },
    gramsPerCup: 128, gramsPerTbsp: 8.0,
  },
  {
    aliases: ['self rising flour', 'self-rising flour', 'self raising flour'],
    nutrition: { calories: 352, protein: 9.8, fat: 0.9, sugar: 0.3, carbs: 75.7 },
    gramsPerCup: 125, gramsPerTbsp: 7.8,
  },
  {
    aliases: ['arrowroot', 'arrowroot powder', 'arrowroot starch'],
    nutrition: { calories: 357, protein: 0.3, fat: 0.1, sugar: 0.1, carbs: 88.2 },
    gramsPerCup: 128, gramsPerTbsp: 8.0,
  },

  // ── Sugars & Sweeteners ────────────────────────────────────────────────
  {
    aliases: ['granulated sugar', 'white sugar', 'caster sugar', 'castor sugar', 'sugar'],
    nutrition: { calories: 387, protein: 0, fat: 0, sugar: 100, carbs: 100 },
    gramsPerCup: 200, gramsPerTbsp: 12.5,
  },
  {
    aliases: ['brown sugar', 'light brown sugar', 'dark brown sugar', 'muscovado'],
    nutrition: { calories: 377, protein: 0.1, fat: 0, sugar: 97.0, carbs: 97.3 },
    gramsPerCup: 213, gramsPerTbsp: 13.3,
  },
  {
    aliases: ['powdered sugar', 'icing sugar', 'confectioners sugar', 'confectioners\' sugar'],
    nutrition: { calories: 389, protein: 0, fat: 0, sugar: 97.4, carbs: 99.7 },
    gramsPerCup: 120, gramsPerTbsp: 7.5,
  },
  {
    aliases: ['honey'],
    nutrition: { calories: 304, protein: 0.3, fat: 0, sugar: 82.1, carbs: 82.4 },
    gramsPerCup: 340, gramsPerTbsp: 21.3,
  },
  {
    aliases: ['maple syrup', 'pure maple syrup'],
    nutrition: { calories: 260, protein: 0, fat: 0.1, sugar: 60.5, carbs: 67.1 },
    gramsPerCup: 322, gramsPerTbsp: 20.1,
  },
  {
    aliases: ['molasses', 'blackstrap molasses'],
    nutrition: { calories: 290, protein: 0, fat: 0.1, sugar: 55.0, carbs: 74.7 },
    gramsPerCup: 340, gramsPerTbsp: 21.3,
  },
  {
    aliases: ['agave', 'agave nectar', 'agave syrup'],
    nutrition: { calories: 310, protein: 0.1, fat: 0.5, sugar: 68.0, carbs: 76.0 },
    gramsPerCup: 333, gramsPerTbsp: 20.8,
  },
  {
    aliases: ['corn syrup', 'light corn syrup', 'dark corn syrup', 'golden syrup'],
    nutrition: { calories: 286, protein: 0, fat: 0.2, sugar: 31.0, carbs: 75.0 },
    gramsPerCup: 336, gramsPerTbsp: 21.0,
  },
  {
    aliases: ['coconut sugar', 'palm sugar'],
    nutrition: { calories: 375, protein: 0, fat: 0, sugar: 92.0, carbs: 92.0 },
    gramsPerCup: 200, gramsPerTbsp: 12.5,
  },

  // ── Fats & Oils ────────────────────────────────────────────────────────
  {
    aliases: ['butter', 'unsalted butter', 'salted butter'],
    nutrition: { calories: 717, protein: 0.9, fat: 81.1, sugar: 0.1, carbs: 0.1 },
    gramsPerCup: 227, gramsPerTbsp: 14.2,
    gramsPerUnit: 113, // 1 stick = 113g
  },
  {
    aliases: ['vegetable oil', 'canola oil', 'sunflower oil', 'grapeseed oil', 'neutral oil', 'oil'],
    nutrition: { calories: 884, protein: 0, fat: 100, sugar: 0, carbs: 0 },
    gramsPerCup: 218, gramsPerTbsp: 13.6,
  },
  {
    aliases: ['olive oil', 'extra virgin olive oil', 'extra-virgin olive oil'],
    nutrition: { calories: 884, protein: 0, fat: 100, sugar: 0, carbs: 0 },
    gramsPerCup: 216, gramsPerTbsp: 13.5,
  },
  {
    aliases: ['coconut oil', 'refined coconut oil'],
    nutrition: { calories: 862, protein: 0, fat: 100, sugar: 0, carbs: 0 },
    gramsPerCup: 218, gramsPerTbsp: 13.6,
  },
  {
    aliases: ['shortening', 'vegetable shortening', 'crisco'],
    nutrition: { calories: 884, protein: 0, fat: 100, sugar: 0, carbs: 0 },
    gramsPerCup: 190, gramsPerTbsp: 11.9,
  },
  {
    aliases: ['margarine', 'vegan butter'],
    nutrition: { calories: 718, protein: 0.2, fat: 80.7, sugar: 0.1, carbs: 0.9 },
    gramsPerCup: 227, gramsPerTbsp: 14.2,
  },

  // ── Dairy ──────────────────────────────────────────────────────────────
  {
    aliases: ['whole milk', 'milk', 'full fat milk'],
    nutrition: { calories: 61, protein: 3.2, fat: 3.3, sugar: 5.0, carbs: 4.8 },
    gramsPerCup: 245, gramsPerTbsp: 15.3,
  },
  {
    aliases: ['skim milk', 'skimmed milk', 'fat free milk', '2% milk', '1% milk', 'low fat milk'],
    nutrition: { calories: 35, protein: 3.4, fat: 0.2, sugar: 4.8, carbs: 4.9 },
    gramsPerCup: 245, gramsPerTbsp: 15.3,
  },
  {
    aliases: ['heavy cream', 'heavy whipping cream', 'whipping cream', 'double cream', 'thickened cream'],
    nutrition: { calories: 340, protein: 2.1, fat: 36.1, sugar: 2.9, carbs: 2.8 },
    gramsPerCup: 238, gramsPerTbsp: 14.9,
  },
  {
    aliases: ['half and half', 'half-and-half', 'single cream'],
    nutrition: { calories: 130, protein: 3.0, fat: 11.5, sugar: 4.3, carbs: 4.3 },
    gramsPerCup: 242, gramsPerTbsp: 15.1,
  },
  {
    aliases: ['buttermilk'],
    nutrition: { calories: 40, protein: 3.3, fat: 0.9, sugar: 4.8, carbs: 4.8 },
    gramsPerCup: 245, gramsPerTbsp: 15.3,
  },
  {
    aliases: ['sour cream', 'crème fraîche', 'creme fraiche'],
    nutrition: { calories: 193, protein: 2.4, fat: 20.0, sugar: 3.7, carbs: 2.9 },
    gramsPerCup: 230, gramsPerTbsp: 14.4,
  },
  {
    aliases: ['cream cheese'],
    nutrition: { calories: 342, protein: 5.9, fat: 33.8, sugar: 3.2, carbs: 4.1 },
    gramsPerCup: 230, gramsPerTbsp: 14.4,
  },
  {
    aliases: ['ricotta', 'ricotta cheese'],
    nutrition: { calories: 174, protein: 11.3, fat: 13.0, sugar: 0.3, carbs: 3.0 },
    gramsPerCup: 246, gramsPerTbsp: 15.4,
  },
  {
    aliases: ['mascarpone'],
    nutrition: { calories: 429, protein: 4.5, fat: 44.0, sugar: 1.8, carbs: 3.7 },
    gramsPerCup: 230, gramsPerTbsp: 14.4,
  },
  {
    aliases: ['yogurt', 'plain yogurt', 'greek yogurt', 'natural yogurt'],
    nutrition: { calories: 59, protein: 3.5, fat: 0.4, sugar: 3.2, carbs: 3.6 },
    gramsPerCup: 245, gramsPerTbsp: 15.3,
  },
  {
    aliases: ['sweetened condensed milk', 'condensed milk'],
    nutrition: { calories: 321, protein: 7.9, fat: 8.7, sugar: 54.4, carbs: 54.4 },
    gramsPerCup: 306, gramsPerTbsp: 19.1,
  },
  {
    aliases: ['evaporated milk'],
    nutrition: { calories: 134, protein: 6.8, fat: 7.6, sugar: 10.0, carbs: 10.0 },
    gramsPerCup: 252, gramsPerTbsp: 15.8,
  },

  // ── Eggs ───────────────────────────────────────────────────────────────
  {
    aliases: ['egg', 'eggs', 'large egg', 'large eggs', 'whole egg', 'whole eggs'],
    nutrition: { calories: 143, protein: 12.6, fat: 9.5, sugar: 0.4, carbs: 1.1 },
    gramsPerUnit: 50, gramsPerCup: 244,
  },
  {
    aliases: ['egg yolk', 'egg yolks', 'yolk', 'yolks'],
    nutrition: { calories: 322, protein: 15.9, fat: 26.5, sugar: 0.6, carbs: 3.6 },
    gramsPerUnit: 17, gramsPerCup: 244,
  },
  {
    aliases: ['egg white', 'egg whites', 'white', 'whites'],
    nutrition: { calories: 52, protein: 10.9, fat: 0.2, sugar: 0.7, carbs: 0.7 },
    gramsPerUnit: 30, gramsPerCup: 244,
  },

  // ── Chocolate & Cocoa ──────────────────────────────────────────────────
  {
    aliases: ['cocoa powder', 'unsweetened cocoa', 'dutch process cocoa', 'dutch-process cocoa', 'cacao powder'],
    nutrition: { calories: 228, protein: 19.6, fat: 13.7, sugar: 1.8, carbs: 57.9 },
    gramsPerCup: 85, gramsPerTbsp: 5.3,
  },
  {
    aliases: ['chocolate chips', 'semi sweet chocolate chips', 'dark chocolate chips', 'milk chocolate chips', 'chocolate morsels'],
    nutrition: { calories: 488, protein: 4.9, fat: 27.2, sugar: 54.4, carbs: 63.4 },
    gramsPerCup: 170, gramsPerTbsp: 10.6,
  },
  {
    aliases: ['dark chocolate', 'bittersweet chocolate', 'semisweet chocolate', 'semi-sweet chocolate'],
    nutrition: { calories: 598, protein: 5.0, fat: 42.6, sugar: 24.0, carbs: 45.9 },
    gramsPerCup: 170, gramsPerTbsp: 10.6,
  },
  {
    aliases: ['milk chocolate', 'white chocolate'],
    nutrition: { calories: 535, protein: 6.0, fat: 29.7, sugar: 52.0, carbs: 59.4 },
    gramsPerCup: 170, gramsPerTbsp: 10.6,
  },

  // ── Leaveners & Seasonings ─────────────────────────────────────────────
  {
    aliases: ['baking powder'],
    nutrition: { calories: 53, protein: 0, fat: 0, sugar: 0, carbs: 27.7 },
    gramsPerTbsp: 12.0,
  },
  {
    aliases: ['baking soda', 'bicarbonate of soda', 'bicarb soda'],
    nutrition: { calories: 0, protein: 0, fat: 0, sugar: 0, carbs: 0 },
    gramsPerTbsp: 14.4,
  },
  {
    aliases: ['salt', 'table salt', 'sea salt', 'kosher salt', 'fine salt'],
    nutrition: { calories: 0, protein: 0, fat: 0, sugar: 0, carbs: 0 },
    gramsPerTbsp: 18.0,
  },
  {
    aliases: ['cream of tartar'],
    nutrition: { calories: 0, protein: 0, fat: 0, sugar: 0, carbs: 0 },
    gramsPerTbsp: 9.0,
  },
  {
    aliases: ['instant yeast', 'active dry yeast', 'yeast', 'dry yeast'],
    nutrition: { calories: 325, protein: 40.4, fat: 7.6, sugar: 0, carbs: 41.2 },
    gramsPerTbsp: 9.0,
  },

  // ── Extracts & Flavourings ─────────────────────────────────────────────
  {
    aliases: ['vanilla extract', 'pure vanilla extract', 'vanilla'],
    nutrition: { calories: 288, protein: 0.1, fat: 0.1, sugar: 12.6, carbs: 12.7 },
    gramsPerTbsp: 13.0,
  },
  {
    aliases: ['almond extract'],
    nutrition: { calories: 288, protein: 0.1, fat: 0.1, sugar: 12.6, carbs: 12.7 },
    gramsPerTbsp: 13.0,
  },
  {
    aliases: ['lemon juice', 'fresh lemon juice'],
    nutrition: { calories: 22, protein: 0.4, fat: 0.2, sugar: 2.5, carbs: 6.9 },
    gramsPerCup: 244, gramsPerTbsp: 15.3,
  },
  {
    aliases: ['orange juice', 'fresh orange juice'],
    nutrition: { calories: 45, protein: 0.7, fat: 0.2, sugar: 8.4, carbs: 10.4 },
    gramsPerCup: 248, gramsPerTbsp: 15.5,
  },
  {
    aliases: ['lemon zest', 'orange zest', 'lemon rind', 'orange rind', 'zest'],
    nutrition: { calories: 47, protein: 1.5, fat: 0.3, sugar: 2.5, carbs: 16.0 },
    gramsPerTbsp: 6.0,
  },
  {
    aliases: ['espresso', 'brewed coffee', 'strong coffee', 'coffee'],
    nutrition: { calories: 2, protein: 0.3, fat: 0, sugar: 0, carbs: 0 },
    gramsPerCup: 237, gramsPerTbsp: 14.8,
  },
  {
    aliases: ['instant coffee', 'instant espresso powder'],
    nutrition: { calories: 353, protein: 14.6, fat: 0.5, sugar: 0, carbs: 75.0 },
    gramsPerTbsp: 5.4,
  },

  // ── Starches & Thickeners ──────────────────────────────────────────────
  {
    aliases: ['corn starch', 'cornstarch', 'cornflour'],
    nutrition: { calories: 381, protein: 0.3, fat: 0.1, sugar: 0, carbs: 91.3 },
    gramsPerCup: 120, gramsPerTbsp: 7.5,
  },
  {
    aliases: ['tapioca starch', 'tapioca flour'],
    nutrition: { calories: 358, protein: 0, fat: 0, sugar: 0, carbs: 88.7 },
    gramsPerCup: 120, gramsPerTbsp: 7.5,
  },

  // ── Oats & Grains ──────────────────────────────────────────────────────
  {
    aliases: ['rolled oats', 'old fashioned oats', 'oats', 'porridge oats', 'oatmeal'],
    nutrition: { calories: 389, protein: 16.9, fat: 6.9, sugar: 1.1, carbs: 66.3 },
    gramsPerCup: 90, gramsPerTbsp: 5.6,
  },
  {
    aliases: ['quick oats', 'instant oats'],
    nutrition: { calories: 389, protein: 16.9, fat: 6.9, sugar: 1.1, carbs: 66.3 },
    gramsPerCup: 82, gramsPerTbsp: 5.1,
  },

  // ── Nuts & Seeds ───────────────────────────────────────────────────────
  {
    aliases: ['walnuts', 'walnut', 'chopped walnuts'],
    nutrition: { calories: 654, protein: 15.2, fat: 65.2, sugar: 2.6, carbs: 13.7 },
    gramsPerCup: 117, gramsPerTbsp: 7.3,
  },
  {
    aliases: ['pecans', 'pecan', 'chopped pecans'],
    nutrition: { calories: 691, protein: 9.2, fat: 72.0, sugar: 3.9, carbs: 13.9 },
    gramsPerCup: 109, gramsPerTbsp: 6.8,
  },
  {
    aliases: ['almonds', 'almond', 'sliced almonds', 'slivered almonds'],
    nutrition: { calories: 579, protein: 21.2, fat: 49.9, sugar: 4.4, carbs: 21.6 },
    gramsPerCup: 143, gramsPerTbsp: 8.9,
  },
  {
    aliases: ['peanuts', 'peanut'],
    nutrition: { calories: 567, protein: 25.8, fat: 49.2, sugar: 4.7, carbs: 16.1 },
    gramsPerCup: 146, gramsPerTbsp: 9.1,
  },
  {
    aliases: ['hazelnuts', 'hazelnut'],
    nutrition: { calories: 628, protein: 15.0, fat: 60.8, sugar: 4.3, carbs: 16.7 },
    gramsPerCup: 135, gramsPerTbsp: 8.4,
  },
  {
    aliases: ['peanut butter', 'smooth peanut butter', 'crunchy peanut butter', 'natural peanut butter'],
    nutrition: { calories: 588, protein: 25.1, fat: 50.4, sugar: 9.2, carbs: 20.1 },
    gramsPerCup: 258, gramsPerTbsp: 16.1,
  },
  {
    aliases: ['tahini', 'sesame paste'],
    nutrition: { calories: 595, protein: 17.0, fat: 53.8, sugar: 0.5, carbs: 21.2 },
    gramsPerCup: 240, gramsPerTbsp: 15.0,
  },
  {
    aliases: ['sesame seeds'],
    nutrition: { calories: 565, protein: 17.7, fat: 48.7, sugar: 0.3, carbs: 23.5 },
    gramsPerCup: 144, gramsPerTbsp: 9.0,
  },
  {
    aliases: ['chia seeds'],
    nutrition: { calories: 486, protein: 16.5, fat: 30.7, sugar: 0, carbs: 42.1 },
    gramsPerCup: 160, gramsPerTbsp: 10.0,
  },
  {
    aliases: ['flaxseed', 'flax seeds', 'ground flaxseed', 'linseed'],
    nutrition: { calories: 534, protein: 18.3, fat: 42.2, sugar: 1.5, carbs: 28.9 },
    gramsPerCup: 168, gramsPerTbsp: 10.5,
  },
  {
    aliases: ['shredded coconut', 'desiccated coconut', 'coconut flakes', 'sweetened coconut', 'unsweetened coconut'],
    nutrition: { calories: 604, protein: 6.9, fat: 57.2, sugar: 6.4, carbs: 25.3 },
    gramsPerCup: 93, gramsPerTbsp: 5.8,
  },

  // ── Dried Fruit ────────────────────────────────────────────────────────
  {
    aliases: ['raisins', 'sultanas', 'dried raisins'],
    nutrition: { calories: 299, protein: 3.1, fat: 0.5, sugar: 59.2, carbs: 79.2 },
    gramsPerCup: 165, gramsPerTbsp: 10.3,
  },
  {
    aliases: ['dried cranberries', 'craisins'],
    nutrition: { calories: 308, protein: 0.1, fat: 1.1, sugar: 72.6, carbs: 82.4 },
    gramsPerCup: 110, gramsPerTbsp: 6.9,
  },
  {
    aliases: ['dates', 'medjool dates', 'dried dates'],
    nutrition: { calories: 282, protein: 2.5, fat: 0.4, sugar: 63.4, carbs: 75.0 },
    gramsPerCup: 178, gramsPerTbsp: 11.1,
  },

  // ── Fresh Fruit ────────────────────────────────────────────────────────
  {
    aliases: ['banana', 'bananas', 'mashed banana', 'ripe banana'],
    nutrition: { calories: 89, protein: 1.1, fat: 0.3, sugar: 12.2, carbs: 23.0 },
    gramsPerCup: 225, gramsPerUnit: 118,
  },
  {
    aliases: ['blueberries', 'blueberry'],
    nutrition: { calories: 57, protein: 0.7, fat: 0.3, sugar: 10.0, carbs: 14.5 },
    gramsPerCup: 148,
  },
  {
    aliases: ['strawberries', 'strawberry'],
    nutrition: { calories: 32, protein: 0.7, fat: 0.3, sugar: 4.9, carbs: 7.7 },
    gramsPerCup: 152,
  },
  {
    aliases: ['raspberries', 'raspberry'],
    nutrition: { calories: 52, protein: 1.2, fat: 0.7, sugar: 4.4, carbs: 11.9 },
    gramsPerCup: 123,
  },
  {
    aliases: ['apple', 'apples'],
    nutrition: { calories: 52, protein: 0.3, fat: 0.2, sugar: 10.4, carbs: 13.8 },
    gramsPerCup: 125, gramsPerUnit: 182,
  },

  // ── Spreads & Misc ─────────────────────────────────────────────────────
  {
    aliases: ['jam', 'jelly', 'fruit preserve', 'strawberry jam', 'raspberry jam'],
    nutrition: { calories: 278, protein: 0.4, fat: 0.1, sugar: 54.0, carbs: 68.9 },
    gramsPerCup: 340, gramsPerTbsp: 21.3,
  },
  {
    aliases: ['nutella', 'chocolate hazelnut spread', 'hazelnut spread'],
    nutrition: { calories: 547, protein: 6.3, fat: 30.9, sugar: 56.3, carbs: 60.9 },
    gramsPerCup: 260, gramsPerTbsp: 16.3,
  },
  {
    aliases: ['sprinkles', 'rainbow sprinkles', 'jimmies'],
    nutrition: { calories: 389, protein: 0, fat: 5.6, sugar: 88.9, carbs: 94.4 },
    gramsPerTbsp: 9.0,
  },
  {
    aliases: ['water'],
    nutrition: { calories: 0, protein: 0, fat: 0, sugar: 0, carbs: 0 },
    gramsPerCup: 237, gramsPerTbsp: 14.8,
  },
];
