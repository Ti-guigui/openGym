// What to eat and meal ideas (Ti Guigui FIT, views/Nutrition.jsx). Written for the app, in French
// and English only (like the 3D mannequin's texts): any other language reads the English. Values
// are rounded averages for a usual portion, enough to plan with, not a food label.
import { getLang } from './i18n-core.js'

/** fr for French, en for everything else. */
export const pick = txt => (txt && typeof txt === 'object' ? (String(getLang()).startsWith('fr') ? txt.fr : txt.en) ?? txt.en : txt)

// Food groups, each with what it brings and examples (kcal and protein for a usual portion).
export const FOOD_GROUPS = [
  {
    id: 'protein', icon: 'dumbbell',
    name: { fr: 'Protéines', en: 'Protein' },
    why: { fr: 'Gardent et construisent le muscle, calent longtemps. À chaque repas.', en: 'Keep and build muscle, keep you full. At every meal.' },
    foods: [
      { fr: 'Blanc de poulet ou de dinde', en: 'Chicken or turkey breast', portion: '150 g', kcal: 165, p: 34 },
      { fr: 'Œufs', en: 'Eggs', portion: '2', kcal: 145, p: 13 },
      { fr: 'Thon au naturel', en: 'Tuna in water', portion: '1 boîte (140 g)', kcal: 150, p: 33 },
      { fr: 'Saumon', en: 'Salmon', portion: '130 g', kcal: 260, p: 26 },
      { fr: 'Fromage blanc 0 % / skyr', en: 'Fat-free quark / skyr', portion: '200 g', kcal: 120, p: 20 },
      { fr: 'Steak haché 5 %', en: '5% fat minced beef', portion: '125 g', kcal: 160, p: 26 },
      { fr: 'Lentilles cuites', en: 'Cooked lentils', portion: '200 g', kcal: 230, p: 18 },
      { fr: 'Tofu', en: 'Tofu', portion: '150 g', kcal: 180, p: 18 },
    ],
  },
  {
    id: 'carbs', icon: 'bolt',
    name: { fr: 'Glucides (énergie)', en: 'Carbs (energy)' },
    why: { fr: 'Le carburant des séances. Plutôt complets, et autour de l’entraînement.', en: 'Fuel for training. Wholegrain where you can, and around your sessions.' },
    foods: [
      { fr: 'Riz basmati cuit', en: 'Cooked basmati rice', portion: '150 g', kcal: 195, p: 4 },
      { fr: 'Pâtes complètes cuites', en: 'Cooked wholewheat pasta', portion: '150 g', kcal: 210, p: 8 },
      { fr: 'Flocons d’avoine', en: 'Rolled oats', portion: '50 g', kcal: 185, p: 7 },
      { fr: 'Pommes de terre', en: 'Potatoes', portion: '250 g', kcal: 195, p: 5 },
      { fr: 'Patate douce', en: 'Sweet potato', portion: '200 g', kcal: 175, p: 3 },
      { fr: 'Pain complet', en: 'Wholemeal bread', portion: '2 tranches', kcal: 160, p: 6 },
      { fr: 'Banane', en: 'Banana', portion: '1', kcal: 105, p: 1 },
      { fr: 'Quinoa cuit', en: 'Cooked quinoa', portion: '150 g', kcal: 180, p: 7 },
    ],
  },
  {
    id: 'fat', icon: 'drop',
    name: { fr: 'Bons gras', en: 'Healthy fats' },
    why: { fr: 'Utiles aux hormones et à la récupération, mais très caloriques : on dose.', en: 'Good for hormones and recovery, but calorie-dense: measure them.' },
    foods: [
      { fr: 'Huile d’olive ou de colza', en: 'Olive or rapeseed oil', portion: '1 c. à soupe', kcal: 90, p: 0 },
      { fr: 'Avocat', en: 'Avocado', portion: '½', kcal: 120, p: 1 },
      { fr: 'Amandes ou noix', en: 'Almonds or walnuts', portion: '30 g', kcal: 185, p: 6 },
      { fr: 'Beurre de cacahuète', en: 'Peanut butter', portion: '1 c. à soupe', kcal: 95, p: 4 },
      { fr: 'Sardines ou maquereau', en: 'Sardines or mackerel', portion: '1 boîte', kcal: 200, p: 20 },
      { fr: 'Graines de chia ou de lin', en: 'Chia or flax seeds', portion: '15 g', kcal: 75, p: 3 },
    ],
  },
  {
    id: 'veg', icon: 'leaf',
    name: { fr: 'Légumes et fruits', en: 'Vegetables and fruit' },
    why: { fr: 'Volume, fibres et vitamines pour peu de calories. La moitié de l’assiette.', en: 'Volume, fibre and vitamins for few calories. Half the plate.' },
    foods: [
      { fr: 'Brocoli, haricots verts', en: 'Broccoli, green beans', portion: '200 g', kcal: 65, p: 5 },
      { fr: 'Courgette, poivron, tomate', en: 'Courgette, pepper, tomato', portion: '200 g', kcal: 45, p: 2 },
      { fr: 'Épinards, salade', en: 'Spinach, salad leaves', portion: '100 g', kcal: 20, p: 2 },
      { fr: 'Fruits rouges', en: 'Berries', portion: '150 g', kcal: 60, p: 1 },
      { fr: 'Pomme ou orange', en: 'Apple or orange', portion: '1', kcal: 80, p: 1 },
      { fr: 'Carottes', en: 'Carrots', portion: '150 g', kcal: 55, p: 1 },
    ],
  },
]

/** Worth keeping occasional, whatever the goal. */
export const LIMIT = {
  fr: 'À limiter : sodas et jus, alcool, viennoiseries, fritures, plats préparés très salés. Pas interdits, juste rares.',
  en: 'Keep rare: sodas and juice, alcohol, pastries, fried food, salty ready meals. Not banned, just occasional.',
}

/** A tip per goal, shown above the food groups. */
export const GOAL_TIPS = {
  lose: {
    fr: 'Pour perdre : des protéines et des légumes à chaque repas, les féculents dosés, de l’eau avant de manger. Le déficit fait le travail, la muscu garde le muscle.',
    en: 'To lose: protein and vegetables at every meal, measured carbs, water before eating. The deficit does the work, lifting keeps the muscle.',
  },
  keep: {
    fr: 'Pour maintenir : une assiette équilibrée (½ légumes, ¼ protéines, ¼ féculents) et un œil sur la balance une fois par semaine.',
    en: 'To maintain: a balanced plate (½ vegetables, ¼ protein, ¼ carbs) and a weekly glance at the scale.',
  },
  gain: {
    fr: 'Pour prendre du muscle : une collation de plus, des féculents autour des séances, des bons gras pour monter les calories sans trop de volume.',
    en: 'To build muscle: one more snack, carbs around your sessions, healthy fats to add calories without too much volume.',
  },
}

export const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack']
export const SLOT_NAME = {
  breakfast: { fr: 'Petit-déjeuner', en: 'Breakfast' },
  lunch: { fr: 'Déjeuner', en: 'Lunch' },
  dinner: { fr: 'Dîner', en: 'Dinner' },
  snack: { fr: 'Collation', en: 'Snack' },
}
/** Share of the day's calories each slot usually takes (snack is one of them). */
export const SLOT_SHARE = { breakfast: 0.25, lunch: 0.35, dinner: 0.3, snack: 0.1 }

// Meal ideas: kcal and protein (g) for the portion described.
export const MEALS = [
  // Breakfast
  { id: 'b1', slot: 'breakfast', kcal: 380, p: 25, name: { fr: 'Porridge protéiné', en: 'Protein porridge' },
    what: { fr: '50 g d’avoine, 250 ml de lait, 1 dose de whey ou 100 g de skyr, fruits rouges', en: '50 g oats, 250 ml milk, 1 scoop whey or 100 g skyr, berries' } },
  { id: 'b2', slot: 'breakfast', kcal: 340, p: 22, name: { fr: 'Omelette et pain complet', en: 'Omelette and wholemeal toast' },
    what: { fr: '3 œufs, épinards, 1 tranche de pain complet, 1 tomate', en: '3 eggs, spinach, 1 slice wholemeal bread, 1 tomato' } },
  { id: 'b3', slot: 'breakfast', kcal: 300, p: 24, name: { fr: 'Bol de skyr', en: 'Skyr bowl' },
    what: { fr: '200 g de skyr, 30 g de muesli sans sucre, 1 banane', en: '200 g skyr, 30 g unsweetened muesli, 1 banana' } },
  { id: 'b4', slot: 'breakfast', kcal: 520, p: 30, name: { fr: 'Pancakes avoine-banane', en: 'Oat and banana pancakes' },
    what: { fr: '60 g d’avoine, 1 banane, 2 œufs, 1 c. à soupe de beurre de cacahuète, fromage blanc', en: '60 g oats, 1 banana, 2 eggs, 1 tbsp peanut butter, quark' } },
  { id: 'b5', slot: 'breakfast', kcal: 420, p: 20, name: { fr: 'Tartines avocat-œuf', en: 'Avocado and egg toast' },
    what: { fr: '2 tranches de pain complet, ½ avocat, 2 œufs pochés', en: '2 slices wholemeal bread, ½ avocado, 2 poached eggs' } },
  // Lunch
  { id: 'l1', slot: 'lunch', kcal: 520, p: 42, name: { fr: 'Poulet, riz, brocoli', en: 'Chicken, rice, broccoli' },
    what: { fr: '150 g de poulet, 150 g de riz cuit, 200 g de brocoli, 1 c. à café d’huile d’olive', en: '150 g chicken, 150 g cooked rice, 200 g broccoli, 1 tsp olive oil' } },
  { id: 'l2', slot: 'lunch', kcal: 450, p: 35, name: { fr: 'Salade de thon et quinoa', en: 'Tuna and quinoa salad' },
    what: { fr: '1 boîte de thon, 150 g de quinoa cuit, tomates, concombre, maïs, vinaigrette légère', en: '1 can tuna, 150 g cooked quinoa, tomato, cucumber, sweetcorn, light dressing' } },
  { id: 'l3', slot: 'lunch', kcal: 600, p: 38, name: { fr: 'Bolognaise maison', en: 'Homemade bolognese' },
    what: { fr: '125 g de bœuf haché 5 %, 80 g de pâtes complètes crues, sauce tomate, courgette', en: '125 g 5% minced beef, 80 g dry wholewheat pasta, tomato sauce, courgette' } },
  { id: 'l4', slot: 'lunch', kcal: 480, p: 26, name: { fr: 'Dahl de lentilles', en: 'Lentil dahl' },
    what: { fr: '80 g de lentilles corail crues, lait de coco léger, épices, 100 g de riz cuit, épinards', en: '80 g dry red lentils, light coconut milk, spices, 100 g cooked rice, spinach' } },
  { id: 'l5', slot: 'lunch', kcal: 700, p: 45, name: { fr: 'Wrap poulet-avocat (×2)', en: 'Chicken and avocado wraps (×2)' },
    what: { fr: '2 galettes de blé, 150 g de poulet, ½ avocat, salade, sauce yaourt', en: '2 flour tortillas, 150 g chicken, ½ avocado, salad, yoghurt sauce' } },
  // Dinner
  { id: 'd1', slot: 'dinner', kcal: 480, p: 32, name: { fr: 'Saumon, patate douce, haricots verts', en: 'Salmon, sweet potato, green beans' },
    what: { fr: '130 g de saumon, 200 g de patate douce, 200 g de haricots verts', en: '130 g salmon, 200 g sweet potato, 200 g green beans' } },
  { id: 'd2', slot: 'dinner', kcal: 380, p: 30, name: { fr: 'Poêlée dinde et légumes', en: 'Turkey and vegetable stir-fry' },
    what: { fr: '150 g de dinde, poivrons, courgette, oignon, sauce soja, 1 c. à café d’huile', en: '150 g turkey, peppers, courgette, onion, soy sauce, 1 tsp oil' } },
  { id: 'd3', slot: 'dinner', kcal: 350, p: 24, name: { fr: 'Omelette aux légumes et salade', en: 'Vegetable omelette and salad' },
    what: { fr: '3 œufs, champignons, poivron, salade verte, 1 tranche de pain complet', en: '3 eggs, mushrooms, pepper, green salad, 1 slice wholemeal bread' } },
  { id: 'd4', slot: 'dinner', kcal: 550, p: 36, name: { fr: 'Chili con carne', en: 'Chili con carne' },
    what: { fr: '125 g de bœuf haché 5 %, haricots rouges, tomates, 100 g de riz cuit', en: '125 g 5% minced beef, kidney beans, tomatoes, 100 g cooked rice' } },
  { id: 'd5', slot: 'dinner', kcal: 420, p: 28, name: { fr: 'Tofu sauté et nouilles de riz', en: 'Stir-fried tofu and rice noodles' },
    what: { fr: '150 g de tofu, 60 g de nouilles de riz crues, brocoli, carottes, sauce soja', en: '150 g tofu, 60 g dry rice noodles, broccoli, carrots, soy sauce' } },
  // Snacks
  { id: 's1', slot: 'snack', kcal: 160, p: 20, name: { fr: 'Fromage blanc et fruit', en: 'Quark and fruit' },
    what: { fr: '200 g de fromage blanc 0 %, 1 poignée de fruits rouges', en: '200 g fat-free quark, a handful of berries' } },
  { id: 's2', slot: 'snack', kcal: 220, p: 25, name: { fr: 'Shaker whey et banane', en: 'Whey shake and banana' },
    what: { fr: '1 dose de whey dans de l’eau, 1 banane', en: '1 scoop whey in water, 1 banana' } },
  { id: 's3', slot: 'snack', kcal: 190, p: 6, name: { fr: 'Pomme et amandes', en: 'Apple and almonds' },
    what: { fr: '1 pomme, 20 g d’amandes', en: '1 apple, 20 g almonds' } },
  { id: 's4', slot: 'snack', kcal: 150, p: 13, name: { fr: 'Œufs durs', en: 'Hard-boiled eggs' },
    what: { fr: '2 œufs durs, crudités', en: '2 hard-boiled eggs, raw vegetables' } },
  { id: 's5', slot: 'snack', kcal: 330, p: 14, name: { fr: 'Tartine beurre de cacahuète', en: 'Peanut butter toast' },
    what: { fr: '1 tranche de pain complet, 1 c. à soupe de beurre de cacahuète, ½ banane', en: '1 slice wholemeal bread, 1 tbsp peanut butter, ½ banana' } },
]

/**
 * Meal ideas for a slot, closest first to that slot's share of the day's target (`dayKcal`).
 * `seed` rotates among the close ones so "Another idea" shows something new.
 */
export function mealIdeas(slot, dayKcal, seed = 0, count = 2) {
  const list = MEALS.filter(m => m.slot === slot)
  if (!list.length) return []
  const aim = Number(dayKcal) > 0 ? dayKcal * (SLOT_SHARE[slot] || 0.25) : null
  const sorted = aim == null ? list : [...list].sort((a, b) => Math.abs(a.kcal - aim) - Math.abs(b.kcal - aim))
  const n = Math.min(count, sorted.length)
  const start = ((Math.floor(seed) % sorted.length) + sorted.length) % sorted.length
  return Array.from({ length: n }, (_, i) => sorted[(start + i) % sorted.length])
}

/** A whole day, one idea per slot, and its total. */
export function dayPlan(dayKcal, seed = 0) {
  const meals = SLOTS.map(slot => mealIdeas(slot, dayKcal, seed, 1)[0]).filter(Boolean)
  return { meals, kcal: meals.reduce((a, m) => a + m.kcal, 0), p: meals.reduce((a, m) => a + m.p, 0) }
}
