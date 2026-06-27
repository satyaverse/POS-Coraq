
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, Member, Product, Order, Ingredient, CartItem, Shift, 
  OrderStatus, Role, Tier, AdjustmentReason, Expense, AuditLog, AuditAction, MemberStatus, ProductCategory,
  Promotion, StoreConfig, Modifier, StationStatus, AttendanceLog
} from '../types';
import { 
  USERS as INITIAL_USERS, PRODUCTS, INGREDIENTS, MOCK_MEMBERS, TIER_RULES, MOCK_PROMOTIONS, DEFAULT_STORE_CONFIG, MODIFIERS as INITIAL_MODIFIERS
} from '../constants';
import { calculateOrderTotals } from '../src/domain/orderCalculations';
import {
  applyStockDeduction,
  calculateAverageCost,
  isPriceAnomaly,
  rollbackPurchase,
  rollbackStockDeduction,
  validateStockAvailability,
} from '../src/domain/inventory';
import { calculateShiftSummary } from '../src/domain/shift';
import { getInitialStationStatuses, resolveGlobalOrderStatus } from '../src/domain/kds';

interface StoreContextType {
  currentUser: User | null;
  users: User[]; // Managed Users State
  products: Product[];
  categories: string[]; 
  ingredients: Ingredient[];
  modifiers: Modifier[];
  orders: Order[];
  members: Member[];
  expenses: Expense[];
  auditLogs: AuditLog[];
  activeShift: Shift | null;
  shiftHistory: Shift[];
  promotions: Promotion[];
  storeConfig: StoreConfig;
  attendanceLogs: AttendanceLog[];
  
  // Actions
  authenticate: (input: string) => Promise<User | null>;
  authenticateWithFace: (descriptor: number[]) => Promise<User | null>;
  setSession: (user: User | null) => void;
  logout: () => void;
  clockIn: (user: User, method: 'PIN' | 'FACE') => void;
  clockOut: (user: User, method: 'PIN' | 'FACE') => void;
  getUserStatus: (userId: string) => 'IN' | 'OUT';
  updateUserFace: (id: string, descriptor: number[]) => void;
  startShift: (amount: number) => void;
  endShift: (actualCash: number) => void;
  getShiftSummary: () => { 
    startCash: number, 
    cashSales: number, 
    nonCashSales: number, 
    debt: number, 
    expenses: number, 
    expectedCash: number 
  };
  createOrder: (
    cart: CartItem[], 
    member: Member | null, 
    pager: string, 
    paymentMethod: 'CASH' | 'QRIS' | 'DEBIT' | 'DEBT', 
    pointsToRedeem: number,
    status?: OrderStatus, // Optional status (for PENDING/Hold)
    cashReceived?: number,
    change?: number,
    customerName?: string, // NEW: Optional customer name
    paymentProof?: string // NEW: Optional payment proof image
  ) => Promise<string | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus, handledByUser?: User) => void;
  updateStationStatus: (orderId: string, role: Role, status: StationStatus) => void; 
  toggleItemCompletion: (orderId: string, itemTempId: string) => void; 
  voidOrder: (orderId: string) => void; // NEW: For resuming held orders
  findMember: (query: string) => Member | null;
  
  // Debt / Open Bill Actions
  markOrderAsDebt: (orderId: string) => void;
  payDebt: (orderId: string, method: 'CASH' | 'QRIS' | 'DEBIT', cashReceived?: number, change?: number, proof?: string) => Promise<string>;

  // User/Staff Management
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Member Management
  addMember: (fullName: string, nickname: string, phone: string, photo: string, birthDate?: string, gender?: 'MALE' | 'FEMALE') => Member;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  approveMember: (id: string) => void;
  bindMemberCard: (tempId: string, cardId: string) => void;

  // Product Management
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  // Modifier Management
  addModifier: (modifier: Modifier) => void;
  updateModifier: (id: string, updates: Partial<Modifier>) => void;
  deleteModifier: (id: string) => void;
  
  // Category Management
  addCategory: (category: string) => void;
  removeCategory: (category: string) => void;

  // Inventory Actions
  updateIngredient: (id: string, updates: Partial<Ingredient>) => void;
  addIngredient: (ingredient: Ingredient) => void;
  performStockOpname: (id: string, actualStock: number, reason: AdjustmentReason) => void;
  purchaseIngredient: (id: string, buyQty: number, totalPrice: number, source: 'CASH_DRAWER' | 'TRANSFER', customConversionRate?: number, transferProof?: string) => void;
  produceSemiFinished: (id: string, qtyToProduce: number) => void;

  // Marketing Actions
  addPromotion: (promo: Promotion) => void;
  updatePromotion: (id: string, updated: Partial<Promotion>) => void;
  togglePromotion: (id: string) => void;
  deletePromotion: (id: string) => void;
  updateStoreConfig: (config: StoreConfig) => void;
  getActivePromotions: () => Promotion[];

  // Finance & Audit
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  voidPurchase: (expenseId: string) => { success: boolean, message: string };
  logAudit: (action: AuditAction, details: string, severity: 'LOW' | 'MEDIUM' | 'HIGH') => void;

  // Analysis
  calculateProductCost: (product: Product) => number;
  getIngredientUsageStats: (ingredientId: string) => { dailyUsage: number, daysRemaining: number };

  resetSystem: () => void;
  getDailySales: () => number;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('coraq_currentUser');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });
  const [users, setUsers] = useState<User[]>(INITIAL_USERS); // Users State
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [categories, setCategories] = useState<string[]>(Object.values(ProductCategory));
  const [ingredients, setIngredients] = useState<Ingredient[]>(INGREDIENTS);
  const [modifiers, setModifiers] = useState<Modifier[]>(INITIAL_MODIFIERS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);
  const [activeShift, setActiveShift] = useState<Shift | null>(() => {
    const saved = localStorage.getItem('coraq_activeShift');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });
  const [shiftHistory, setShiftHistory] = useState<Shift[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  
  // Marketing State
  const [promotions, setPromotions] = useState<Promotion[]>(MOCK_PROMOTIONS);
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(DEFAULT_STORE_CONFIG);

  const [isInitializing, setIsInitializing] = useState(true);

  // Sync from MySQL backend
  useEffect(() => {
    const fetchInitialState = async () => {
      try {
        const response = await fetch('/api/sync');
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || INITIAL_USERS);
          setMembers(data.members || []);
          setCategories(data.categories || []);
          setIngredients(data.ingredients || []);
          setProducts(data.products || []);
          setStoreConfig(data.storeConfig || DEFAULT_STORE_CONFIG);
          setOrders(data.orders || []);
          setModifiers(data.modifiers || []);
          setPromotions(data.promotions || []);
          setExpenses(data.expenses || []);
          setShiftHistory(data.shiftHistory || []);
          setAttendanceLogs(data.attendanceLogs || []);
          setAuditLogs(data.auditLogs || []);
        }
      } catch (error) {
        console.error("Failed to sync with MySQL backend:", error);
      } finally {
        setIsInitializing(false);
      }
    };
    fetchInitialState();
  }, []);

  // Auth
  const authenticate = async (input: string) => {
    // Dynamic login based on Users state (PIN or Phone)
    const user = users.find(u => u.pin === input || u.phone === input);
    return user || null;
  };

  const authenticateWithFace = async (descriptor: number[]) => {
    // Euclidean distance calculation
    let bestMatch: User | null = null;
    let minDistance = 0.6; // Threshold for face match

    users.forEach(u => {
      if (u.faceDescriptor) {
        let distance = 0;
        for (let i = 0; i < descriptor.length; i++) {
          distance += Math.pow(descriptor[i] - u.faceDescriptor[i], 2);
        }
        distance = Math.sqrt(distance);
        
        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = u;
        }
      }
    });

    return bestMatch;
  };

  const setSession = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('coraq_currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('coraq_currentUser');
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('coraq_currentUser');
  };

  const clockIn = (user: User, method: 'PIN' | 'FACE') => {
    const log: AttendanceLog = {
      id: `att-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      role: user.role,
      type: 'CLOCK_IN',
      timestamp: new Date().toISOString(),
      method
    };
    setAttendanceLogs(prev => [log, ...prev]);
  };

  const clockOut = (user: User, method: 'PIN' | 'FACE') => {
    const log: AttendanceLog = {
      id: `att-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      role: user.role,
      type: 'CLOCK_OUT',
      timestamp: new Date().toISOString(),
      method
    };
    setAttendanceLogs(prev => [log, ...prev]);
  };

  const getUserStatus = (userId: string): 'IN' | 'OUT' => {
    const today = new Date().toISOString().split('T')[0];
    const userTodayLogs = attendanceLogs
      .filter(l => l.userId === userId && l.timestamp.startsWith(today))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (userTodayLogs.length === 0) return 'OUT';
    return userTodayLogs[0].type === 'CLOCK_IN' ? 'IN' : 'OUT';
  };

  const updateUserFace = (id: string, descriptor: number[]) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, faceDescriptor: descriptor } : u));
  };

  // Shift Management
  const startShift = (amount: number) => {
    if (!currentUser) return;
    const newShift: Shift = {
      id: `s-${Date.now()}`,
      cashierName: currentUser.name,
      startTime: new Date().toISOString(),
      startCash: amount,
      isOpen: true
    };
    setActiveShift(newShift);
    localStorage.setItem('coraq_activeShift', JSON.stringify(newShift));
  };

  // Helper to get shift totals
  const getShiftSummary = () => {
    return calculateShiftSummary({ activeShift, orders, expenses });
  };

  const endShift = (actualCash: number) => {
    if (activeShift) {
      const summary = getShiftSummary();
      
      const closedShift: Shift = { 
        ...activeShift, 
        isOpen: false, 
        endTime: new Date().toISOString(), 
        endCash: actualCash,
        expectedCash: summary.expectedCash,
        variance: actualCash - summary.expectedCash,
        totalCashSales: summary.cashSales,
        totalNonCashSales: summary.nonCashSales,
        totalDebt: summary.debt,
        totalExpenses: summary.expenses
      };
      
      setShiftHistory(prev => [...prev, closedShift]);
      setActiveShift(null);
      localStorage.removeItem('coraq_activeShift');
      logout(); // Auto logout after closing
    }
  };

  // --- USER / STAFF MANAGEMENT ---
  const addUser = (user: User) => {
    setUsers(prev => [...prev, user]);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const deleteUser = (id: string) => {
    // Prevent deleting self or last admin
    const userToDelete = users.find(u => u.id === id);
    const adminCount = users.filter(u => u.role === Role.ADMIN).length;

    if (currentUser?.id === id) {
      alert("Tidak bisa menghapus akun yang sedang digunakan.");
      return;
    }
    if (userToDelete?.role === Role.ADMIN && adminCount <= 1) {
      alert("Tidak bisa menghapus Admin terakhir.");
      return;
    }

    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // --- MEMBER MANAGEMENT ---

  const findMember = (query: string) => {
    const q = query.toLowerCase();
    return members.find(m => 
      m.id.toLowerCase() === q || 
      m.phone.includes(q) || 
      m.fullName.toLowerCase().includes(q) || 
      m.nickname.toLowerCase().includes(q)
    ) || null;
  };

  const addMember = (
    fullName: string, 
    nickname: string, 
    phone: string, 
    photo?: string,
    birthDate?: string, 
    gender?: 'MALE' | 'FEMALE'
  ): Member => {
    const newMember: Member = {
      id: `temp-${Date.now()}`,
      fullName,
      nickname,
      name: nickname || fullName,
      phone,
      photo,
      birthDate,
      gender,
      tier: Tier.BRONZE,
      status: MemberStatus.PENDING_CARD,
      totalSpending: 0,
      points: 0,
      joinDate: new Date().toISOString()
    };
    setMembers(prev => [...prev, newMember]);
    return newMember;
  };

  const bindMemberCard = (tempId: string, cardId: string) => {
    setMembers(prev => prev.map(m => {
      if (m.id === tempId) {
        return { 
          ...m, 
          id: cardId, 
          status: MemberStatus.ACTIVE 
        };
      }
      return m;
    }));
  };

  const updateMember = (id: string, updates: Partial<Member>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const approveMember = (id: string) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, status: MemberStatus.ACTIVE } : m));
  };

  const deleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  // --- PRODUCT MANAGEMENT ---

  const addProduct = (product: Product) => {
    setProducts(prev => [...prev, product]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addCategory = (category: string) => {
    if (!categories.includes(category)) {
      setCategories(prev => [...prev, category]);
    }
  };

  const removeCategory = (category: string) => {
    setCategories(prev => prev.filter(c => c !== category));
  };

  // --- MODIFIER MANAGEMENT ---
  const addModifier = (modifier: Modifier) => {
    setModifiers(prev => [...prev, modifier]);
  };

  const updateModifier = (id: string, updates: Partial<Modifier>) => {
    setModifiers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteModifier = (id: string) => {
    setModifiers(prev => prev.filter(m => m.id !== id));
  };


  // --- MARKETING ACTIONS ---
  const addPromotion = (promo: Promotion) => {
    setPromotions(prev => [...prev, promo]);
  };

  const updatePromotion = (id: string, updated: Partial<Promotion>) => {
    setPromotions(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
  };

  const togglePromotion = (id: string) => {
    setPromotions(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const deletePromotion = (id: string) => {
    setPromotions(prev => prev.filter(p => p.id !== id));
  };

  const updateStoreConfig = (config: StoreConfig) => {
    setStoreConfig(config);
  };

  const getActivePromotions = () => {
    const now = new Date();
    const currentHour = now.getHours();
    
    return promotions.filter(p => {
      if (!p.active) return false;
      
      // Happy Hour Logic
      if (p.happyHourStart && p.happyHourEnd) {
        const start = parseInt(p.happyHourStart.split(':')[0]);
        const end = parseInt(p.happyHourEnd.split(':')[0]);
        if (currentHour < start || currentHour >= end) return false;
      }
      return true;
    });
  };

  // --- ORDERS ---

  const createOrder = async (
    cart: CartItem[], 
    member: Member | null, 
    pager: string, 
    paymentMethod: 'CASH' | 'QRIS' | 'DEBIT' | 'DEBT',
    pointsToRedeem: number = 0,
    status: OrderStatus = OrderStatus.PREPARING,
    cashReceived?: number,
    change?: number,
    customerName?: string, // Optional name
    paymentProof?: string // Optional payment proof image
  ) => {
    if (cart.length === 0) return null;
    
    // 1. Stock Check
    const stockAvailability = validateStockAvailability(ingredients, cart);
    if (stockAvailability.ok === false) return stockAvailability.message;

    // 2. Calculate Financials
    let orderTotals;
    try {
      orderTotals = calculateOrderTotals({
        cart,
        member,
        promotions: getActivePromotions(),
        storeConfig,
        pointsToRedeem,
      });
    } catch (error) {
      return error instanceof Error ? error.message : 'Gagal menghitung total pesanan';
    }

    const {
      subtotal,
      totalDiscount,
      finalAmount,
      pointsEarned,
      appliedPromotionNames,
    } = orderTotals;

    // 3. Deduct Stock (Even for PENDING/Hold orders, we reserve stock)
    setIngredients(applyStockDeduction(ingredients, cart));

    // Initialize items with completed: false
    const cartItemsWithStatus = cart.map(item => ({ ...item, completed: false }));

    const {
      baristaStatus: initBaristaStatus,
      kitchenStatus: initKitchenStatus,
    } = getInitialStationStatuses(cart, status);

    // 5. Create Order
    // Payment Status Logic: If PENDING -> UNPAID. If DEBT -> UNPAID. Otherwise PAID.
    const paymentStatus = (status === OrderStatus.PENDING || paymentMethod === 'DEBT') ? 'UNPAID' : 'PAID';
    const now = new Date().toISOString();

    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      pagerNumber: pager,
      items: cartItemsWithStatus,
      totalAmount: subtotal,
      finalAmount,
      discountApplied: totalDiscount,
      pointsEarned,
      pointsRedeemed: pointsToRedeem,
      promoCode: appliedPromotionNames.join(', '),
      memberId: member?.id,
      customerName: customerName || member?.name || 'Guest', // Save Name
      status: status, 
      paymentStatus, 
      paidAt: paymentStatus === 'PAID' ? now : undefined, // NEW: Track payment time
      
      // Init Station Status
      baristaStatus: initBaristaStatus,
      kitchenStatus: initKitchenStatus,
      
      // Auto set start times 
      baristaStartTime: initBaristaStatus === 'PREPARING' ? now : undefined,
      kitchenStartTime: initKitchenStatus === 'PREPARING' ? now : undefined,
      prepStartTime: status === OrderStatus.PREPARING ? now : undefined,

      createdAt: now,
      paymentMethod,
      cashierName: currentUser?.name || 'Unknown',
      cashReceived,
      change,
      paymentProof // NEW
    };

    
    // 5.1 POST to API
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
      if (!response.ok) {
        throw new Error('Gagal menyimpan pesanan ke server');
      }
    } catch (err) {
      console.error(err);
      return typeof err === 'string' ? err : 'Gagal menyimpan pesanan ke database';
    }

    setOrders(prev => [...prev, newOrder]);

    // 6. Update Member (Points & Tier) -- ONLY IF PAID
    // If DEBT/BON, we do not add points yet.
    let message = status === OrderStatus.PENDING 
        ? "Pesanan Disimpan (Menunggu Pembayaran)" 
        : paymentMethod === 'DEBT' 
            ? "Pesanan BON Berhasil (Masuk Dapur)" 
            : "Transaksi Berhasil!";
    
    if (member && paymentStatus === 'PAID') {
       const newSpending = member.totalSpending + finalAmount;
       const remainingPoints = (member.points - pointsToRedeem) + pointsEarned;
       
       let newTier = member.tier;
       if (newSpending > TIER_RULES[Tier.PLATINUM].threshold) newTier = Tier.PLATINUM;
       else if (newSpending > TIER_RULES[Tier.GOLD].threshold) newTier = Tier.GOLD;
       else if (newSpending > TIER_RULES[Tier.SILVER].threshold) newTier = Tier.SILVER;

       let tierUpMsg = "";
       if (newTier !== member.tier && member.status === MemberStatus.ACTIVE) {
          tierUpMsg = `\nSelamat! Member naik ke tier ${newTier}!`;
       }

       setMembers(prev => prev.map(m => m.id === member.id ? {
         ...m,
         totalSpending: newSpending,
         points: remainingPoints,
         tier: newTier,
         lastVisit: now
       } : m));

       message += tierUpMsg;
       if (pointsEarned > 0) message += `\nMember dapat ${pointsEarned} Poin.`;
    }

    return message;
  };

  const markOrderAsDebt = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      
      const { baristaStatus, kitchenStatus } = getInitialStationStatuses(o.items, OrderStatus.PREPARING);
      const now = new Date().toISOString();

      return {
        ...o,
        status: OrderStatus.PREPARING,
        paymentStatus: 'UNPAID',
        paymentMethod: 'DEBT',
        prepStartTime: now,
        // Activate KDS
        baristaStatus,
        kitchenStatus,
        baristaStartTime: baristaStatus === 'PREPARING' ? now : undefined,
        kitchenStartTime: kitchenStatus === 'PREPARING' ? now : undefined,
      };
    }));
  };

  const payDebt = async (orderId: string, method: 'CASH' | 'QRIS' | 'DEBIT', cashReceived?: number, change?: number, proof?: string) => {
     let successMsg = "Pelunasan Berhasil!";
     let foundOrder: Order | undefined;
     const now = new Date().toISOString();

     setOrders(prev => prev.map(o => {
        if (o.id !== orderId) return o;
        foundOrder = o; // Capture for Member Logic

        return {
           ...o,
           paymentStatus: 'PAID',
           paymentMethod: method,
           paidAt: now, // NEW: Payment timestamp
           cashReceived,
           change,
           paymentProof: proof
        };
     }));

     // Handle Member Logic Post-Payment (Since it was skipped during creation)
     if (foundOrder && foundOrder.memberId) {
        const member = members.find(m => m.id === foundOrder!.memberId);
        if (member && member.status === MemberStatus.ACTIVE) {
            const pointsEarned = foundOrder.pointsEarned; // Already calculated at creation
            const pointsRedeemed = foundOrder.pointsRedeemed;
            const finalAmount = foundOrder.finalAmount;

            const newSpending = member.totalSpending + finalAmount;
            const remainingPoints = (member.points - pointsRedeemed) + pointsEarned;
            
            let newTier = member.tier;
            if (newSpending > TIER_RULES[Tier.PLATINUM].threshold) newTier = Tier.PLATINUM;
            else if (newSpending > TIER_RULES[Tier.GOLD].threshold) newTier = Tier.GOLD;
            else if (newSpending > TIER_RULES[Tier.SILVER].threshold) newTier = Tier.SILVER;

            setMembers(prevMembers => prevMembers.map(m => m.id === member.id ? {
                ...m,
                totalSpending: newSpending,
                points: remainingPoints,
                tier: newTier,
                lastVisit: now
            } : m));

            if (pointsEarned > 0) successMsg += ` (+${pointsEarned} Poin)`;
        }
     }

     return successMsg;
  };

  const voidOrder = (orderId: string) => {
    // 1. Find Order
    const orderToVoid = orders.find(o => o.id === orderId);
    if (!orderToVoid) return;

    // 2. Restore Stock
    setIngredients(rollbackStockDeduction(ingredients, orderToVoid.items));

    // 3. Remove Order (For Resume functionality, we essentially delete the hold and create a new one in Cart)
    // Alternatively, set status to CANCELLED. For "Resume", deletion is cleaner if we just want to fill the cart.
    // If we want Audit trails, we should set to CANCELLED.
    // But since this is specific to "Resume Pending Order", let's just delete it to prevent clutter.
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, handledByUser?: User) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      
      const updates: Partial<Order> = { status };
      
      if (status === OrderStatus.PREPARING) {
        updates.prepStartTime = new Date().toISOString();
        if (handledByUser) {
          updates.handledBy = handledByUser.name;
          updates.handledByRole = handledByUser.role;
        }
      } else if (status === OrderStatus.READY) {
        updates.readyTime = new Date().toISOString();
      } else if (status === OrderStatus.COMPLETED) {
        updates.completedTime = new Date().toISOString();
      }
      
      return { ...o, ...updates };
    }));
  };

  const toggleItemCompletion = (orderId: string, itemTempId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const newItems = o.items.map(i => {
        if (i.tempId === itemTempId) {
            const newCompleted = !i.completed;
            return {
                ...i, 
                completed: newCompleted,
                completedAt: newCompleted ? new Date().toISOString() : undefined
            };
        } 
        return i;
      });
      return { ...o, items: newItems };
    }));
  };

  // NEW: Update Status specific to a station
  const updateStationStatus = (orderId: string, role: Role, status: StationStatus) => {
     setOrders(prev => prev.map(o => {
        if (o.id !== orderId) return o;

        const updates: Partial<Order> = {};
        const now = new Date().toISOString();

        if (role === Role.BARISTA) {
           updates.baristaStatus = status;
           // Start time already set at creation, but good to ensure
           if (status === 'PREPARING' && !o.baristaStartTime) {
              updates.baristaStartTime = now;
           }
        } else if (role === Role.KITCHEN) {
           updates.kitchenStatus = status;
           if (status === 'PREPARING' && !o.kitchenStartTime) {
              updates.kitchenStartTime = now;
           }
        }

        const orderWithStationUpdate: Order = { ...o, ...updates };
        const globalStatus = resolveGlobalOrderStatus(orderWithStationUpdate);

        if (globalStatus === OrderStatus.READY) {
           updates.status = OrderStatus.READY;
           updates.readyTime = o.readyTime || now;
        }

        if (globalStatus === OrderStatus.COMPLETED) {
           updates.status = OrderStatus.COMPLETED;
           updates.readyTime = o.readyTime || now;
           updates.completedTime = now;
        }

        return { ...o, ...updates };
     }));
  }

  // --- INVENTORY ---

  const updateIngredient = (id: string, updates: Partial<Ingredient>) => {
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const addIngredient = (ing: Ingredient) => {
    setIngredients(prev => [...prev, ing]);
  };

  const performStockOpname = (id: string, actualStock: number, reason: AdjustmentReason) => {
    const item = ingredients.find(i => i.id === id);
    if (!item) return;

    const diff = actualStock - item.stock;
    
    // Log Audit
    logAudit(
      AuditAction.STOCK_ADJUSTMENT, 
      `Opname ${item.name}: System ${item.stock} -> Actual ${actualStock} (${reason})`, 
      Math.abs(diff) > 1000 || (diff * item.costPerUnit) > 100000 ? 'HIGH' : 'MEDIUM'
    );

    updateIngredient(id, { stock: actualStock });
  };
  
  // NEW: Purchase Ingredient (Restock) Logic
  const purchaseIngredient = (id: string, buyQty: number, totalPrice: number, source: 'CASH_DRAWER' | 'TRANSFER', customConversionRate?: number, transferProof?: string) => {
      const item = ingredients.find(i => i.id === id);
      if (!item) return;

      const rate = customConversionRate || item.conversionRate || 1;
      const usageQtyAdded = buyQty * rate;
      const currentPurchasePricePerUnit = totalPrice / usageQtyAdded;
      
      // --- SMART ALERT: Anomaly Detection ---
      if (item.costPerUnit > 0) {
        const priceDiffPercent = Math.abs((currentPurchasePricePerUnit - item.costPerUnit) / item.costPerUnit) * 100;
        if (isPriceAnomaly(item.costPerUnit, currentPurchasePricePerUnit)) {
          logAudit(
            AuditAction.PURCHASE_STOCK,
            `ANOMALI HARGA: ${item.name} dibeli seharga ${currentPurchasePricePerUnit.toFixed(2)}/unit. Selisih ${priceDiffPercent.toFixed(1)}% dari harga rata-rata (${item.costPerUnit.toFixed(2)}).`,
            'HIGH'
          );
        }
      }

      const newStock = item.stock + usageQtyAdded;
      const newCostPerUnit = calculateAverageCost({
        currentStock: item.stock,
        currentCostPerUnit: item.costPerUnit,
        addedUsageQty: usageQtyAdded,
        purchaseCostPerUsageUnit: currentPurchasePricePerUnit,
      });

      const now = new Date().toISOString();
      const newHistory = [...(item.priceHistory || []), { date: now, price: currentPurchasePricePerUnit }];

      // 1. Update Inventory
      updateIngredient(id, {
          stock: newStock,
          costPerUnit: newCostPerUnit,
          priceHistory: newHistory.slice(-10) // Keep last 10 entries
      });

      // 2. Record Expense
      addExpense({
          category: 'PURCHASE',
          amount: totalPrice,
          description: `Restock ${item.name}: ${buyQty} ${item.buyUnit || 'Unit'} (${usageQtyAdded} ${item.unit})`,
          date: now,
          source: source,
          transferProof: transferProof,
          purchaseMetadata: {
            ingredientId: id,
            addedStock: usageQtyAdded,
            previousHpp: item.costPerUnit,
            previousPriceHistory: item.priceHistory || []
          }
      });

      // 3. Log Audit
      logAudit(
          AuditAction.PURCHASE_STOCK,
          `Purchase ${item.name}: +${usageQtyAdded} ${item.unit} (Rp ${totalPrice}) via ${source}`,
          'MEDIUM'
      );

      // --- PROFIT GUARD: Margin Check ---
      products.forEach(product => {
        const usesIngredient = product.recipe?.some(r => r.ingredientId === id);
        if (usesIngredient) {
          const totalCost = product.recipe?.reduce((total, r) => {
            const ing = ingredients.find(ingr => ingr.id === r.ingredientId);
            const cost = r.ingredientId === id ? newCostPerUnit : (ing?.costPerUnit || 0);
            return total + (r.amount * cost);
          }, 0) || 0;
          
          const margin = product.price > 0 ? ((product.price - totalCost) / product.price) * 100 : 0;
          if (margin < 50) { // Threshold 50%
            logAudit(
              AuditAction.STOCK_ADJUSTMENT,
              `PROFIT GUARD: Margin ${product.name} menipis ke ${margin.toFixed(1)}% karena kenaikan harga bahan.`,
              'MEDIUM'
            );
          }
        }
      });
  };

  // --- ANALYTICS HELPERS ---

  const calculateProductCost = (product: Product) => {
    if (!product.recipe) return 0;
    return product.recipe.reduce((total, r) => {
       const ing = ingredients.find(i => i.id === r.ingredientId);
       return total + (r.amount * (ing?.costPerUnit || 0));
    }, 0);
  };

  const produceSemiFinished = (id: string, qtyToProduce: number) => {
    const semiFinished = ingredients.find(i => i.id === id);
    if (!semiFinished || !semiFinished.isSemiFinished || !semiFinished.recipe) return;

    // First check if enough raw materials exist
    for (const r of semiFinished.recipe) {
       const raw = ingredients.find(i => i.id === r.ingredientId);
       if (!raw || raw.stock < (r.amount * qtyToProduce)) {
           alert(`Stok bahan ${raw?.name || 'Unknown'} tidak mencukupi untuk produksi!`);
           return;
       }
    }

    setIngredients(prev => prev.map(ing => {
       // Deduct raw materials
       const recipeItem = semiFinished.recipe!.find(r => r.ingredientId === ing.id);
       if (recipeItem) {
          return { ...ing, stock: ing.stock - (recipeItem.amount * qtyToProduce) };
       }
       // Add to semi-finished
       if (ing.id === id) {
          return { ...ing, stock: ing.stock + qtyToProduce };
       }
       return ing;
    }));

    logAudit(
       AuditAction.STOCK_ADJUSTMENT,
       `Produksi ${qtyToProduce} ${semiFinished.unit} ${semiFinished.name}`,
       'MEDIUM'
    );
  };

  const getIngredientUsageStats = (id: string) => {
     // Mock logic for usage stats based on orders
     return { dailyUsage: 500, daysRemaining: 5 };
  };

  const getDailySales = () => {
    const today = new Date().toDateString();
    return orders
      .filter(o => new Date(o.createdAt).toDateString() === today && o.status !== OrderStatus.CANCELLED && o.paymentStatus === 'PAID')
      .reduce((acc, o) => acc + o.finalAmount, 0);
  }

  const addExpense = (exp: Omit<Expense, 'id'>) => {
     const newExp = { ...exp, id: `exp-${Date.now()}` };
     setExpenses(prev => [...prev, newExp]);
  }

  const voidPurchase = (expenseId: string): { success: boolean, message: string } => {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense || expense.category !== 'PURCHASE' || expense.isVoided) {
      return { success: false, message: "Gagal melakukan void: Data tidak valid atau sudah di-void." };
    }

    if (!expense.purchaseMetadata) {
      // SMART SOLUTION FOR OLD DATA
      setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, isVoided: true, description: `[VOID] ${e.description}` } : e));
      logAudit(
        AuditAction.STOCK_ADJUSTMENT,
        `VOID PENGELUARAN LAMA: ${expense.description} di-void. Stok/HPP tidak berubah karena data lama.`,
        'MEDIUM'
      );
      return { success: true, message: "Void berhasil! Uang kas telah dikembalikan. (Catatan: Stok/HPP harus disesuaikan manual karena ini data lama)." };
    }

    const { ingredientId, addedStock, previousHpp, previousPriceHistory } = expense.purchaseMetadata;
    const item = ingredients.find(i => i.id === ingredientId);
    if (!item) return { success: false, message: "Gagal melakukan void: Bahan tidak ditemukan." };

    // 1. Rollback Inventory
    setIngredients(rollbackPurchase(ingredients, expense));

    // 2. Mark Expense as Voided
    setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, isVoided: true, description: `[VOID] ${e.description}` } : e));

    // 3. Log Audit
    logAudit(
      AuditAction.STOCK_ADJUSTMENT,
      `VOID PEMBELIAN: ${item.name} dikembalikan stok -${addedStock} dan HPP dikembalikan ke ${previousHpp}`,
      'HIGH'
    );

    return { success: true, message: "Void pembelian berhasil! Stok, HPP, dan Kas telah dikembalikan." };
  };

  const logAudit = (action: AuditAction, details: string, severity: 'LOW' | 'MEDIUM' | 'HIGH') => {
     const log: AuditLog = {
       id: `log-${Date.now()}`,
       action,
       details,
       user: currentUser?.name || 'System',
       timestamp: new Date().toISOString(),
       severity
     };
     setAuditLogs(prev => [log, ...prev]);
  }

  const resetSystem = () => {
    if (confirm("Yakin reset semua data?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <StoreContext.Provider value={{
      currentUser, users, products, categories, ingredients, modifiers, orders, members, activeShift, shiftHistory, expenses, auditLogs, promotions, storeConfig, attendanceLogs,
      authenticate, authenticateWithFace, setSession, logout, clockIn, clockOut, getUserStatus, updateUserFace, startShift, endShift, getShiftSummary, createOrder, updateOrderStatus, updateStationStatus, toggleItemCompletion, findMember,
      voidOrder, markOrderAsDebt, payDebt,
      addUser, updateUser, deleteUser,
      addMember, updateMember, deleteMember, approveMember, bindMemberCard,
      addProduct, updateProduct, deleteProduct,
      addModifier, updateModifier, deleteModifier,
      addCategory, removeCategory,
      updateIngredient, addIngredient, performStockOpname, purchaseIngredient, produceSemiFinished,
      calculateProductCost, getIngredientUsageStats,
      getDailySales, resetSystem, addExpense, voidPurchase, logAudit,
      addPromotion, updatePromotion, togglePromotion, deletePromotion, updateStoreConfig, getActivePromotions
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
