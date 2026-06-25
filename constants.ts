
import { Ingredient, Member, Modifier, Product, ProductCategory, Role, Tier, User, MemberStatus, Promotion, StoreConfig } from './types';

export const USERS: User[] = [
  { 
    id: '1', 
    name: 'Owner Budi', 
    pin: '111111', 
    role: Role.ADMIN, 
    phone: '08111111111', 
    avatar: 'https://i.pravatar.cc/150?u=budi',
    dailyRate: 200000 
  },
  { 
    id: '2', 
    name: 'Manajer Siti', 
    pin: '222222', 
    role: Role.MANAGER, 
    phone: '08222222222', 
    avatar: 'https://i.pravatar.cc/150?u=siti',
    dailyRate: 150000 
  },
  { 
    id: '3', 
    name: 'Kasir Andi', 
    pin: '333333', 
    role: Role.CASHIER, 
    phone: '08333333333', 
    avatar: 'https://i.pravatar.cc/150?u=andi',
    dailyRate: 100000 
  },
  { 
    id: '4', 
    name: 'Barista John', 
    pin: '444444', 
    role: Role.BARISTA, 
    phone: '08444444444', 
    avatar: 'https://i.pravatar.cc/150?u=john',
    dailyRate: 120000 
  },
  { 
    id: '5', 
    name: 'Chef Renatta', 
    pin: '555555', 
    role: Role.KITCHEN, 
    phone: '08555555555', 
    avatar: 'https://i.pravatar.cc/150?u=renatta',
    dailyRate: 130000 
  },
];

export const INGREDIENTS: Ingredient[] = [
  { 
    id: 'i1', name: 'Biji Espresso', unit: 'g', stock: 5000, costPerUnit: 200,
    buyUnit: 'Kg', conversionRate: 1000 
  },
  { 
    id: 'i2', name: 'Susu Segar', unit: 'ml', stock: 10000, costPerUnit: 15,
    buyUnit: 'Liter', conversionRate: 1000
  },
  { 
    id: 'i3', name: 'Gula Aren', unit: 'ml', stock: 2000, costPerUnit: 30,
    buyUnit: 'Liter', conversionRate: 1000
  },
  { 
    id: 'i4', name: 'Gelas Plastik', unit: 'pcs', stock: 500, costPerUnit: 500,
    buyUnit: 'Dus (50)', conversionRate: 50
  },
  { 
    id: 'i5', name: 'Susu Oat', unit: 'ml', stock: 2000, costPerUnit: 25,
    buyUnit: 'Liter', conversionRate: 1000
  },
  { 
    id: 'i6', name: 'Bubuk Coklat', unit: 'g', stock: 1000, costPerUnit: 100,
    buyUnit: 'Pack (1kg)', conversionRate: 1000
  },
  { 
    id: 'i7', name: 'Adonan Croissant', unit: 'pcs', stock: 50, costPerUnit: 5000,
    buyUnit: 'Box (10)', conversionRate: 10
  },
];

export const PRODUCTS: Product[] = [
  { 
    id: 'p1', 
    name: 'Kopi Susu Gula Aren', 
    price: 25000, 
    category: ProductCategory.COFFEE, 
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1000&auto=format&fit=crop',
    recipe: [
      { ingredientId: 'i1', amount: 18 },
      { ingredientId: 'i2', amount: 150 },
      { ingredientId: 'i3', amount: 20 },
      { ingredientId: 'i4', amount: 1 },
    ],
    staffCommission: 500,
    standardPrepTime: 3 // minutes
  },
  { 
    id: 'p2', 
    name: 'Americano', 
    price: 20000, 
    category: ProductCategory.COFFEE, 
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=1000&auto=format&fit=crop',
    recipe: [
      { ingredientId: 'i1', amount: 18 },
      { ingredientId: 'i4', amount: 1 },
    ],
    staffCommission: 200,
    standardPrepTime: 2 // minutes
  },
  { 
    id: 'p3', 
    name: 'Es Coklat Klasik', 
    price: 28000, 
    category: ProductCategory.NON_COFFEE, 
    image: 'https://images.unsplash.com/photo-1542990253-0d0f557147f3?q=80&w=1000&auto=format&fit=crop',
    recipe: [
      { ingredientId: 'i6', amount: 30 },
      { ingredientId: 'i2', amount: 180 },
      { ingredientId: 'i4', amount: 1 },
    ],
    standardPrepTime: 4 // minutes
  },
  { 
    id: 'p4', 
    name: 'Butter Croissant', 
    price: 18000, 
    category: ProductCategory.FOOD, 
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=1000&auto=format&fit=crop',
    recipe: [
      { ingredientId: 'i7', amount: 1 },
    ],
    staffCommission: 1000, // Push money item
    standardPrepTime: 5 // minutes (heating)
  },
];

export const MODIFIERS: Modifier[] = [
  // SUGAR (Applicable to Drinks)
  { id: 'm1', name: 'Less Sugar', price: 0, type: 'SUGAR', targetCategories: [ProductCategory.COFFEE, ProductCategory.NON_COFFEE] },
  { id: 'm2', name: 'Normal Sugar', price: 0, type: 'SUGAR', targetCategories: [ProductCategory.COFFEE, ProductCategory.NON_COFFEE] },
  { id: 'm3', name: 'No Sugar', price: 0, type: 'SUGAR', targetCategories: [ProductCategory.COFFEE, ProductCategory.NON_COFFEE] },
  
  // ICE (Applicable to Drinks) - Implemented Price Diff Logic
  { id: 'm4', name: 'Less Ice', price: 2000, type: 'ICE', targetCategories: [ProductCategory.COFFEE, ProductCategory.NON_COFFEE] },
  { id: 'm5', name: 'Normal Ice', price: 2000, type: 'ICE', targetCategories: [ProductCategory.COFFEE, ProductCategory.NON_COFFEE] },
  { id: 'm6', name: 'Hot', price: 0, type: 'ICE', targetCategories: [ProductCategory.COFFEE, ProductCategory.NON_COFFEE] },
  
  // ADDONS (Targeted)
  { 
    id: 'm7', name: 'Extra Shot', price: 5000, type: 'ADDON', 
    targetCategories: [ProductCategory.COFFEE],
    recipeAdjustment: [{ ingredientId: 'i1', amount: 18 }] // Consumes 18g espresso beans
  },
  { 
    id: 'm8', name: 'Ganti Oat Milk', price: 8000, type: 'ADDON', 
    targetCategories: [ProductCategory.COFFEE, ProductCategory.NON_COFFEE],
    recipeAdjustment: [{ ingredientId: 'i5', amount: 150 }] // Simple assumptions for logic
  },
  { id: 'm9', name: 'Extra Cheese', price: 4000, type: 'ADDON', targetCategories: [ProductCategory.FOOD] },
  { id: 'm10', name: 'Extra Butter', price: 3000, type: 'ADDON', targetCategories: [ProductCategory.FOOD] },
];

export const TIER_RULES = {
  [Tier.BRONZE]: { threshold: 0, discount: 0, label: 'BRONZE' },
  [Tier.SILVER]: { threshold: 1000000, discount: 0.05, label: 'SILVER' }, // > 1 Juta (5%)
  [Tier.GOLD]: { threshold: 3000000, discount: 0.10, label: 'GOLD' },     // > 3 Juta (10%)
  [Tier.PLATINUM]: { threshold: 8000000, discount: 0.15, label: 'PLATINUM' }, // > 8 Juta (15%)
};

export const MOCK_MEMBERS: Member[] = [
  {
    id: 'm001',
    fullName: 'Budi Santoso',
    nickname: 'Budi',
    name: 'Budi',
    phone: '081234567890',
    tier: Tier.SILVER,
    status: MemberStatus.ACTIVE,
    totalSpending: 2950000, 
    points: 295,
    joinDate: '2023-01-01',
    birthDate: '1990-05-30',
    gender: 'MALE'
  },
  {
    id: 'm002',
    fullName: 'Siti Aminah',
    nickname: 'Siti',
    name: 'Siti',
    phone: '081298765432',
    tier: Tier.PLATINUM,
    status: MemberStatus.ACTIVE,
    totalSpending: 12500000,
    points: 1250,
    joinDate: '2023-02-15',
    birthDate: '1995-05-30',
    gender: 'FEMALE'
  },
  {
    id: 'm003',
    fullName: 'Joko Anwar',
    nickname: 'Joko',
    name: 'Joko',
    phone: '08111222333',
    tier: Tier.BRONZE,
    status: MemberStatus.ACTIVE,
    totalSpending: 500000, 
    points: 50,
    joinDate: '2023-05-10',
    birthDate: '1988-12-10',
    gender: 'MALE'
  }
];

export const MOCK_PROMOTIONS: Promotion[] = [
  {
    id: 'promo1',
    name: 'Happy Hour (14-16)',
    type: 'PERCENTAGE',
    value: 20, // 20%
    active: true,
    happyHourStart: '14:00',
    happyHourEnd: '16:00',
    description: 'Diskon 20% setiap jam 2 siang sampai 4 sore.'
  },
  {
    id: 'promo2',
    name: 'Belanja > 100rb Potong 10k',
    type: 'FIXED',
    value: 10000,
    minSpend: 100000,
    active: true,
    description: 'Potongan langsung Rp 10.000 untuk transaksi di atas 100rb.'
  }
];

export const DEFAULT_STORE_CONFIG: StoreConfig = {
  pointEarnRate: 10000, // Rp 10.000 = 1 Poin
  pointValue: 100,      // 1 Poin = Rp 100
  globalCommissionRate: 0.01 // 1%
};
