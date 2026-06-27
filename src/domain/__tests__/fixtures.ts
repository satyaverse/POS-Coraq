import {
  Expense,
  Ingredient,
  Member,
  MemberStatus,
  Modifier,
  Order,
  OrderStatus,
  Product,
  ProductCategory,
  Promotion,
  Role,
  Shift,
  StoreConfig,
  Tier,
  CartItem,
} from '../../../types';

export const fixedNow = '2026-06-27T09:00:00.000Z';

export const fixtureStoreConfig: StoreConfig = {
  pointEarnRate: 10000,
  pointValue: 100,
  globalCommissionRate: 0.01,
};

export const fixtureIngredients: Ingredient[] = [
  {
    id: 'ing-espresso',
    name: 'Biji Espresso',
    unit: 'g',
    stock: 5000,
    costPerUnit: 200,
    buyUnit: 'Kg',
    conversionRate: 1000,
  },
  {
    id: 'ing-milk',
    name: 'Susu Segar',
    unit: 'ml',
    stock: 10000,
    costPerUnit: 15,
    buyUnit: 'Liter',
    conversionRate: 1000,
  },
  {
    id: 'ing-cup',
    name: 'Gelas Plastik',
    unit: 'pcs',
    stock: 500,
    costPerUnit: 500,
    buyUnit: 'Dus',
    conversionRate: 50,
  },
  {
    id: 'ing-croissant',
    name: 'Adonan Croissant',
    unit: 'pcs',
    stock: 50,
    costPerUnit: 5000,
    buyUnit: 'Box',
    conversionRate: 10,
  },
  {
    id: 'ing-cocoa',
    name: 'Bubuk Coklat',
    unit: 'g',
    stock: 1000,
    costPerUnit: 100,
    buyUnit: 'Pack',
    conversionRate: 1000,
  },
  {
    id: 'ing-cream',
    name: 'Cream Dessert',
    unit: 'g',
    stock: 800,
    costPerUnit: 80,
    buyUnit: 'Pack',
    conversionRate: 1000,
  },
];

export const fixtureProducts: Record<'coffee' | 'nonCoffee' | 'food' | 'dessert', Product> = {
  coffee: {
    id: 'prod-coffee',
    name: 'Kopi Susu',
    price: 25000,
    category: ProductCategory.COFFEE,
    image: '/images/kopi-susu.jpg',
    recipe: [
      { ingredientId: 'ing-espresso', amount: 18 },
      { ingredientId: 'ing-milk', amount: 150 },
      { ingredientId: 'ing-cup', amount: 1 },
    ],
    staffCommission: 500,
    standardPrepTime: 3,
  },
  nonCoffee: {
    id: 'prod-non-coffee',
    name: 'Es Coklat',
    price: 28000,
    category: ProductCategory.NON_COFFEE,
    image: '/images/es-coklat.jpg',
    recipe: [
      { ingredientId: 'ing-cocoa', amount: 30 },
      { ingredientId: 'ing-milk', amount: 180 },
      { ingredientId: 'ing-cup', amount: 1 },
    ],
    standardPrepTime: 4,
  },
  food: {
    id: 'prod-food',
    name: 'Butter Croissant',
    price: 18000,
    category: ProductCategory.FOOD,
    image: '/images/croissant.jpg',
    recipe: [{ ingredientId: 'ing-croissant', amount: 1 }],
    staffCommission: 1000,
    standardPrepTime: 5,
  },
  dessert: {
    id: 'prod-dessert',
    name: 'Cream Dessert',
    price: 22000,
    category: ProductCategory.DESSERT,
    image: '/images/dessert.jpg',
    recipe: [{ ingredientId: 'ing-cream', amount: 80 }],
    standardPrepTime: 6,
  },
};

export const fixtureModifiers: Record<'lessSugar' | 'extraShot' | 'oatMilk', Modifier> = {
  lessSugar: {
    id: 'mod-less-sugar',
    name: 'Less Sugar',
    price: 0,
    type: 'SUGAR',
    targetCategories: [ProductCategory.COFFEE, ProductCategory.NON_COFFEE],
  },
  extraShot: {
    id: 'mod-extra-shot',
    name: 'Extra Shot',
    price: 5000,
    type: 'ADDON',
    targetCategories: [ProductCategory.COFFEE],
    recipeAdjustment: [{ ingredientId: 'ing-espresso', amount: 18 }],
  },
  oatMilk: {
    id: 'mod-oat-milk',
    name: 'Ganti Oat Milk',
    price: 8000,
    type: 'ADDON',
    targetCategories: [ProductCategory.COFFEE, ProductCategory.NON_COFFEE],
    recipeAdjustment: [{ ingredientId: 'ing-milk', amount: 150 }],
  },
};

export const fixtureBronzeMember: Member = {
  id: 'member-bronze',
  fullName: 'Ayu Lestari',
  nickname: 'Ayu',
  name: 'Ayu',
  phone: '081200000001',
  pin: '123456',
  tier: Tier.BRONZE,
  status: MemberStatus.ACTIVE,
  totalSpending: 500000,
  points: 120,
  joinDate: '2026-01-01',
  lastVisit: fixedNow,
};

export const fixtureActivePromotion: Promotion = {
  id: 'promo-min-spend',
  name: 'Belanja 100rb Potong 10rb',
  type: 'FIXED',
  value: 10000,
  minSpend: 100000,
  active: true,
  description: 'Potongan langsung untuk transaksi di atas 100rb.',
};

export const fixturePercentPromotion: Promotion = {
  id: 'promo-happy-hour',
  name: 'Happy Hour 20%',
  type: 'PERCENTAGE',
  value: 20,
  active: true,
  happyHourStart: '14:00',
  happyHourEnd: '16:00',
};

export const fixtureShift: Shift = {
  id: 'shift-1',
  cashierName: 'Kasir Andi',
  startTime: '2026-06-27T08:00:00.000Z',
  startCash: 500000,
  isOpen: true,
};

export const fixtureCashDrawerExpense: Expense = {
  id: 'expense-cash-1',
  category: 'OTHER',
  amount: 25000,
  date: '2026-06-27T10:00:00.000Z',
  description: 'Beli es batu',
  source: 'CASH_DRAWER',
};

export function makeCartItem(
  overrides: Partial<CartItem> & { product?: Product } = {},
): CartItem {
  return {
    tempId: 'cart-item-1',
    product: fixtureProducts.coffee,
    quantity: 1,
    modifiers: [],
    ...overrides,
  };
}

export function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    pagerNumber: 'A10',
    items: [makeCartItem()],
    totalAmount: 25000,
    finalAmount: 25000,
    discountApplied: 0,
    pointsEarned: 2,
    pointsRedeemed: 0,
    memberId: fixtureBronzeMember.id,
    customerName: fixtureBronzeMember.name,
    status: OrderStatus.PREPARING,
    paymentStatus: 'PAID',
    paymentMethod: 'CASH',
    paidAt: fixedNow,
    createdAt: fixedNow,
    cashierName: 'Kasir Andi',
    cashReceived: 30000,
    change: 5000,
    baristaStatus: 'PREPARING',
    kitchenStatus: 'IDLE',
    ...overrides,
  };
}

export const fixturePaidCashOrder = makeOrder();

export const fixtureUnpaidDebtOrder = makeOrder({
  id: 'order-debt-1',
  paymentStatus: 'UNPAID',
  paymentMethod: 'DEBT',
  paidAt: undefined,
  status: OrderStatus.PREPARING,
  finalAmount: 43000,
  totalAmount: 43000,
});

export const fixtureCompletedOrder = makeOrder({
  id: 'order-completed-1',
  status: OrderStatus.COMPLETED,
  baristaStatus: 'COMPLETED',
  kitchenStatus: 'IDLE',
  completedTime: '2026-06-27T09:10:00.000Z',
});

export const fixtureUsers = [
  {
    id: 'user-cashier',
    name: 'Kasir Andi',
    pin: '333333',
    role: Role.CASHIER,
    phone: '08333333333',
    dailyRate: 100000,
  },
  {
    id: 'user-barista',
    name: 'Barista John',
    pin: '444444',
    role: Role.BARISTA,
    phone: '08444444444',
    dailyRate: 120000,
  },
];

export function cloneFixture<T>(value: T): T {
  return structuredClone(value);
}
