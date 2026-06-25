
export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
  BARISTA = 'BARISTA', // Drinks
  KITCHEN = 'KITCHEN', // Food
}

export enum Tier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING', // Waiting for manager approval
  BLOCKED = 'BLOCKED',
  PENDING_CARD = 'PENDING_CARD', // Waiting for card binding
}

export enum ProductCategory {
  COFFEE = 'COFFEE',
  NON_COFFEE = 'NON_COFFEE',
  FOOD = 'FOOD',
  DESSERT = 'DESSERT',
}

export enum OrderStatus {
  PENDING = 'PENDING', // Unpaid / On Hold
  PREPARING = 'PREPARING', // Paid & In Kitchen
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export type StationStatus = 'IDLE' | 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED';

export enum AdjustmentReason {
  PENAMBAHAN_STOK = 'PENAMBAHAN_STOK', // RESTOCK
  PENJUALAN = 'PENJUALAN', // SOLD
  BARANG_RUSAK_BUSUK = 'BARANG_RUSAK_BUSUK', // WASTE/SPOILAGE
  SISA_PRODUKSI_LIMBAH = 'SISA_PRODUKSI_LIMBAH', // WASTE
  TESTER_PROMO = 'TESTER_PROMO', // COMPLIMENT
  KEHILANGAN_PENCURIAN = 'KEHILANGAN_PENCURIAN', // LOSS/THEFT
  KESALAHAN_INPUT_DATA = 'KESALAHAN_INPUT_DATA', // CORRECTION
  PEMBELIAN_BARU = 'PEMBELIAN_BARU', // PURCHASE
  SELISIH_STOK_FISIK = 'SELISIH_STOK_FISIK', // STOCK OPNAME
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string; // Usage Unit (e.g., 'g', 'ml', 'pcs')
  stock: number;
  costPerUnit: number; // HPP per usage unit (e.g., per gram)
  minStockLevel?: number; 
  
  // NEW: Conversion Logic
  buyUnit?: string; // e.g., 'Kg', 'Liter', 'Pack'
  conversionRate?: number; // e.g., 1000 (if 1 Kg = 1000 g)
  priceHistory?: { date: string, price: number }[]; // Track price trends

  // NEW: Semi-finished goods (Base Kopi, etc.)
  isSemiFinished?: boolean;
  recipe?: RecipeItem[]; // Formula to produce this semi-finished item
}

export interface RecipeItem {
  ingredientId: string;
  amount: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string; // Changed from ProductCategory enum to string for dynamic categories
  image: string;
  recipe?: RecipeItem[]; // Recipe BOM
  staffCommission?: number; // Push money per item sold
  standardPrepTime?: number; // Estimated preparation time in minutes for KDS
  overheadAmount?: number; // Configurable fixed overhead per item
}

export interface Modifier {
  id: string;
  name: string;
  price: number; // 0 if free
  type: 'SUGAR' | 'ICE' | 'ADDON';
  recipeAdjustment?: RecipeItem[]; // Modifiers can also consume inventory
  targetCategories?: string[]; // Only show this modifier for specific product categories
}

export interface CartItem {
  tempId: string; // Unique ID for cart instance
  product: Product;
  quantity: number;
  modifiers: Modifier[];
  note?: string;
  completed?: boolean; // NEW: Checklist status for KDS
  completedAt?: string; // NEW: Timestamp when item was completed
}

export interface Member {
  id: string; // This will be the QR Code ID (Member ID)
  fullName: string; // Sesuai KTP
  nickname: string; // Nama Panggilan
  name: string; // Display Name (usually nickname)
  phone: string; // WhatsApp
  pin?: string; // Member Portal PIN
  photo?: string; // Base64 photo
  birthDate?: string;
  gender?: 'MALE' | 'FEMALE';
  tier: Tier;
  status: MemberStatus;
  totalSpending: number;
  points: number;
  joinDate: string;
  lastVisit?: string; // For retention analysis
}

export interface Order {
  id: string;
  pagerNumber: string;
  items: CartItem[];
  totalAmount: number;
  finalAmount: number; // After discount
  discountApplied: number;
  
  // Promotion & Points
  pointsEarned: number;
  pointsRedeemed: number;
  promoCode?: string;

  memberId?: string;
  customerName?: string; // NEW: Name of the customer (Member Name or Manual Input)
  status: OrderStatus; // Global Status
  
  // Payment Status
  paymentStatus: 'PAID' | 'UNPAID';
  paymentMethod: 'CASH' | 'QRIS' | 'DEBIT' | 'DEBT'; // Added DEBT
  paidAt?: string; // NEW: When payment was received (critical for Shift Report)

  createdAt: string; // ISO string
  cashierName: string;
  
  // Cash Payment Details
  cashReceived?: number;
  change?: number;

  // Digital Payment Proof
  paymentProof?: string; // Base64 string of the receipt photo

  // Station Specific Tracking (NEW)
  baristaStatus: StationStatus; // Tracks Coffee/Drinks
  kitchenStatus: StationStatus; // Tracks Food
  baristaStartTime?: string; // Timestamp when Barista clicked Start
  kitchenStartTime?: string; // Timestamp when Kitchen clicked Start

  // Performance Tracking
  prepStartTime?: string; // First station start time
  readyTime?: string; // When status changed to READY
  completedTime?: string;
  handledBy?: string; // Name of Barista/Kitchen who took the order
  handledByRole?: Role;
}

export interface User {
  id: string;
  name: string;
  pin: string;
  role: Role;
  phone?: string; // NEW: Login via Phone
  avatar?: string; // NEW: Profile Picture URL
  faceDescriptor?: number[]; // NEW: Face recognition descriptor
  dailyRate?: number; // NEW: Daily salary rate
}

export interface AttendanceLog {
  id: string;
  userId: string;
  userName: string;
  role: Role;
  type: 'CLOCK_IN' | 'CLOCK_OUT';
  timestamp: string;
  method: 'PIN' | 'FACE';
}

export interface Shift {
  id: string;
  cashierName: string;
  startTime: string;
  startCash: number;
  endTime?: string;
  
  // Closing Report Data
  endCash?: number; // Actual counted cash
  expectedCash?: number; // System calculated cash
  variance?: number; // Difference
  totalCashSales?: number;
  totalNonCashSales?: number; // QRIS + Debit
  totalDebt?: number; // Unpaid orders created this shift
  totalExpenses?: number; // Cash expenses
  
  isOpen: boolean;
}

// --- NEW TYPES FOR ANALYTICS ---

export interface Expense {
  id: string;
  category: 'SALARY' | 'UTILITIES' | 'RENT' | 'MARKETING' | 'MAINTENANCE' | 'PURCHASE' | 'OTHER';
  amount: number;
  date: string;
  description: string;
  source: 'CASH_DRAWER' | 'TRANSFER' | 'EXTERNAL'; // NEW: Source of funds
  isVoided?: boolean; // NEW: Track if this expense is voided
  transferProof?: string; // NEW: Base64 image of transfer proof
  // NEW: Metadata for purchase rollback
  purchaseMetadata?: {
    ingredientId: string;
    addedStock: number;
    previousHpp: number;
    previousPriceHistory?: { date: string, price: number }[];
  }
}

export enum AuditAction {
  VOID_ITEM = 'VOID_ITEM',
  CANCEL_ORDER = 'CANCEL_ORDER',
  MANUAL_DISCOUNT = 'MANUAL_DISCOUNT',
  STOCK_ADJUSTMENT = 'STOCK_ADJUSTMENT',
  OPEN_DRAWER = 'OPEN_DRAWER',
  PURCHASE_STOCK = 'PURCHASE_STOCK'
}

export interface AuditLog {
  id: string;
  action: AuditAction;
  user: string;
  details: string;
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

// --- MARKETING SUITE ---

export interface Promotion {
  id: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minSpend?: number;
  active: boolean;
  happyHourStart?: string; // "14:00"
  happyHourEnd?: string;   // "16:00"
  description?: string;
  startDate?: string;      // "YYYY-MM-DD"
  endDate?: string;        // "YYYY-MM-DD"
}

export interface StoreConfig {
  pointEarnRate: number; // Spend X to get 1 point (e.g., 10000)
  pointValue: number;    // 1 point = X Rupiah (e.g., 100)
  globalCommissionRate: number; // 0.01 for 1% of total sales
}
