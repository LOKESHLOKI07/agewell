export type GroceryCategory = {
  id: string;
  name: string;
};

export type GroceryProduct = {
  id: string;
  name: string;
  categoryId: string;
  unit: string;
  priceLabel: string;
};

export type FoodCuisine = {
  id: string;
  name: string;
  description: string;
  mealWindows: string[];
};

export type FoodMenuItem = {
  id: string;
  cuisineId: string;
  meal: 'Breakfast' | 'Lunch' | 'Dinner';
  name: string;
  priceLabel: string;
};

export type MedicineOrder = {
  id: string;
  label: string;
  placedAt: string;
  status: 'Pending' | 'Out for delivery' | 'Delivered';
};

export type PoojaPackage = {
  id: string;
  name: string;
  description: string;
  helpers: string;
  priceLabel: string;
};

export const GROCERY_CATEGORIES: GroceryCategory[] = [
  { id: 'rice', name: 'Rice' },
  { id: 'atta', name: 'Atta' },
  { id: 'dal', name: 'Dal' },
  { id: 'oil', name: 'Oil' },
  { id: 'spices', name: 'Spices' },
  { id: 'veg', name: 'Vegetables' },
];

export const GROCERY_PRODUCTS: GroceryProduct[] = [
  { id: 'g1', name: 'Kolam Rice', categoryId: 'rice', unit: '5 kg', priceLabel: '₹420' },
  { id: 'g2', name: 'Basmati Rice', categoryId: 'rice', unit: '1 kg', priceLabel: '₹180' },
  { id: 'g3', name: 'Chakki Atta', categoryId: 'atta', unit: '5 kg', priceLabel: '₹250' },
  { id: 'g4', name: 'Toor Dal', categoryId: 'dal', unit: '1 kg', priceLabel: '₹160' },
  { id: 'g5', name: 'Moong Dal', categoryId: 'dal', unit: '1 kg', priceLabel: '₹140' },
  { id: 'g6', name: 'Groundnut Oil', categoryId: 'oil', unit: '1 L', priceLabel: '₹210' },
  { id: 'g7', name: 'Turmeric Powder', categoryId: 'spices', unit: '200 g', priceLabel: '₹55' },
  { id: 'g8', name: 'Seasonal Vegetables Mix', categoryId: 'veg', unit: '1 basket', priceLabel: '₹180' },
];

export const FOOD_CUISINES: FoodCuisine[] = [
  {
    id: 'maharashtrian',
    name: 'Maharashtrian',
    description: 'Home-style thalis, usal, bhakri and more.',
    mealWindows: ['Breakfast', 'Lunch', 'Dinner'],
  },
  {
    id: 'gujarati',
    name: 'Gujarati',
    description: 'Mild, wholesome meals with roti and dal.',
    mealWindows: ['Breakfast', 'Lunch', 'Dinner'],
  },
  {
    id: 'south-indian',
    name: 'South Indian',
    description: 'Idli, dosa, sambar and rice meals.',
    mealWindows: ['Breakfast', 'Lunch', 'Dinner'],
  },
];

export const FOOD_MENU: FoodMenuItem[] = [
  { id: 'f1', cuisineId: 'maharashtrian', meal: 'Breakfast', name: 'Poha + Tea', priceLabel: '₹90' },
  { id: 'f2', cuisineId: 'maharashtrian', meal: 'Lunch', name: 'Maharashtrian Thali', priceLabel: '₹180' },
  { id: 'f3', cuisineId: 'maharashtrian', meal: 'Dinner', name: 'Bhakri + Bhaji', priceLabel: '₹150' },
  { id: 'f4', cuisineId: 'gujarati', meal: 'Breakfast', name: 'Thepla + Chutney', priceLabel: '₹100' },
  { id: 'f5', cuisineId: 'gujarati', meal: 'Lunch', name: 'Gujarati Thali', priceLabel: '₹190' },
  { id: 'f6', cuisineId: 'gujarati', meal: 'Dinner', name: 'Khichdi + Kadhi', priceLabel: '₹140' },
  { id: 'f7', cuisineId: 'south-indian', meal: 'Breakfast', name: 'Idli Sambar', priceLabel: '₹110' },
  { id: 'f8', cuisineId: 'south-indian', meal: 'Lunch', name: 'Rice Meal', priceLabel: '₹170' },
  { id: 'f9', cuisineId: 'south-indian', meal: 'Dinner', name: 'Dosa Combo', priceLabel: '₹160' },
];

export const MEDICINE_ORDERS: MedicineOrder[] = [
  {
    id: 'm1',
    label: 'Prescription · Dr. Mehta',
    placedAt: 'Yesterday · 2:10 PM',
    status: 'Out for delivery',
  },
  {
    id: 'm2',
    label: 'Monthly refill pack',
    placedAt: '25 Aug · 11:00 AM',
    status: 'Delivered',
  },
];

export const POOJA_PACKAGES: PoojaPackage[] = [
  {
    id: 'p1',
    name: 'Satyanarayan Pooja',
    description: 'Full setup with flowers, Prasad and aarti items.',
    helpers: '2 helpers',
    priceLabel: '₹2,499',
  },
  {
    id: 'p2',
    name: 'Ganesh Pooja',
    description: 'Home Ganesh pooja with basic materials included.',
    helpers: '1–2 helpers',
    priceLabel: '₹1,999',
  },
  {
    id: 'p3',
    name: 'Griha Shanti',
    description: 'Peace and wellbeing pooja for the household.',
    helpers: '2 helpers',
    priceLabel: '₹2,999',
  },
];
