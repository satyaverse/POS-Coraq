import React, { useState, useMemo } from "react";
import { useStore } from "../../context/StoreContext";
import {
  Ingredient,
  AdjustmentReason,
  Product,
  OrderStatus,
  Tier,
  MemberStatus,
  ProductCategory,
  Promotion,
  AuditAction,
  Modifier,
  Role,
  User,
} from "../../types";
import { ModifierManager } from "./ModifierManager"; // Import the new module
import { CoraqLocationIntelligence } from "./CoraqLocationIntelligence";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ScatterChart,
  Scatter,
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  DollarSign,
  Package,
  Users,
  TrendingUp,
  LogOut,
  Plus,
  Minus,
  Edit2,
  Save,
  X,
  AlertTriangle,
  Coffee,
  Activity,
  ShieldAlert,
  Wallet,
  Trash2,
  Utensils,
  Search,
  ChevronDown,
  Settings,
  Megaphone,
  Trophy,
  Clock,
  CheckCircle,
  ClipboardCheck,
  Layers,
  IdCard,
  Image as ImageIcon,
  ScanFace,
  Gift,
  User as UserIcon,
  History,
  Lightbulb,
  Calculator,
  QrCode,
  FileText,
  Calendar,
  MessageSquare,
  Download,
  RefreshCcw,
  MapPin,
} from "lucide-react";
import { FaceScanner } from "../FaceScanner";
import { TIER_RULES } from "../../constants";

import {
  Html5QrcodeScanner,
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  Html5QrcodeScannerState,
} from "html5-qrcode";

type ViewState =
  | "DASHBOARD"
  | "TRANSACTIONS"
  | "ANALYTICS"
  | "INVENTORY"
  | "FINANCE"
  | "MEMBERS"
  | "MENU"
  | "MARKETING"
  | "STAFF"
  | "PAYROLL"
  | "LOCATION_INTELLIGENCE";

export const DashboardView: React.FC = () => {
  const {
    logout,
    getDailySales,
    orders,
    ingredients,
    members,
    products,
    expenses,
    auditLogs,
    categories,
    promotions,
    storeConfig,
    modifiers,
    users,
    attendanceLogs,
    shiftHistory,
    resetSystem,
    updateIngredient,
    addIngredient,
    performStockOpname,
    produceSemiFinished,
    calculateProductCost,
    addExpense,
    voidPurchase,
    voidOrder,
    approveMember,
    deleteMember,
    updateMember,
    bindMemberCard,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    removeCategory,
    addPromotion,
    updatePromotion,
    togglePromotion,
    deletePromotion,
    updateStoreConfig,
    addUser,
    updateUser,
    deleteUser,
    updateUserFace,
  } = useStore();

  const [currentView, setCurrentView] = useState<ViewState>("DASHBOARD");

  // Calculate today's birthday members
  const todayBirthdayMembers = members.filter((m) => {
    if (!m.birthDate) return false;
    const today = new Date();
    const todayMonth = String(today.getMonth() + 1).padStart(2, "0");
    const todayDay = String(today.getDate()).padStart(2, "0");
    const targetMD = `${todayMonth}-${todayDay}`; // "05-30"

    const parts = m.birthDate.split("-");
    if (parts.length === 3) {
      return `${parts[1]}-${parts[2]}` === targetMD;
    }
    return false;
  });

  // Calculate dormant members (> 30 days of no visits)
  const dormantMembers = members.filter((m) => {
    const refDateStr = m.lastVisit || m.joinDate;
    if (!refDateStr) return false;
    const refDate = new Date(refDateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - refDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 30;
  });

  // CRM Outreach Modal States
  const [outreachModalOpen, setOutreachModalOpen] = useState(false);
  const [outreachMember, setOutreachMember] = useState<Member | null>(null);
  const [outreachType, setOutreachType] = useState<"BIRTHDAY" | "DORMANT">("BIRTHDAY");
  const [outreachPromoId, setOutreachPromoId] = useState<string>("");
  const [outreachMessage, setOutreachMessage] = useState<string>("");

  const getOutreachDefaultMessage = (member: Member | null, type: "BIRTHDAY" | "DORMANT", promoId: string) => {
    if (!member) return "";
    const nameStr = member.fullName || member.name || "Kak";
    const promo = promotions.find((p) => p.id === promoId);
    const promoStr = promo 
      ? `\n\nKhusus untuk Kakak, nikmati promo spesial kami: *${promo.name}* \n🎟️ Gunakan Kode: *${promo.id.toUpperCase()}* (${promo.description || `diskon ${promo.type === 'PERCENTAGE' ? `${promo.value}%` : `Rp ${promo.value}`}`})`
      : "";
    
    if (type === "BIRTHDAY") {
      return `Halo Kak ${nameStr}! Selamat Ulang Tahun dari Coraq Coffee! 🥳☕\n\nSebagai member setia kami dengan status *${member.tier}*, kami ingin merayakan hari istimewa Kakak.${promoStr}\n\nYuk mampir ke outlet Coraq Coffee hari ini dan klaim promo spesial ultahmu. Ditunggu kedatangannya ya Kak! ❤️`;
    } else {
      const refDateStr = member.lastVisit || member.joinDate;
      let durationStr = "beberapa waktu ini";
      if (refDateStr) {
        const refDate = new Date(refDateStr);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - refDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        durationStr = `${diffDays} hari`;
      }
      return `Halo Kak ${nameStr}! Apa kabar? Kami kangen sekali dengan kehadiran Kakak di Coraq Coffee. 🥺☕\n\nKami perhatikan sudah sekitar *${durationStr}* Kakak tidak berkunjung ke outlet kami.${promoStr}\n\nYuk obati rasa kangen kami, mampir hari ini untuk menikmati kopi favoritmu! Ada promo hangat menunggumu di atas. Have a nice day! ✨`;
    }
  };

  const handleOpenOutreach = (member: Member, type: "BIRTHDAY" | "DORMANT") => {
    setOutreachMember(member);
    setOutreachType(type);
    setOutreachPromoId("");
    const msg = getOutreachDefaultMessage(member, type, "");
    setOutreachMessage(msg);
    setOutreachModalOpen(true);
  };

  const handleOutreachTypeChange = (type: "BIRTHDAY" | "DORMANT") => {
    setOutreachType(type);
    if (outreachMember) {
      setOutreachMessage(getOutreachDefaultMessage(outreachMember, type, outreachPromoId));
    }
  };

  const handleOutreachPromoChange = (promoId: string) => {
    setOutreachPromoId(promoId);
    if (outreachMember) {
      setOutreachMessage(getOutreachDefaultMessage(outreachMember, outreachType, promoId));
    }
  };

  const handleSendOutreachWhatsApp = () => {
    if (!outreachMember) return;
    const formattedWA = outreachMember.phone.replace(/[^0-9]/g, "").startsWith("0")
      ? "62" + outreachMember.phone.replace(/[^0-9]/g, "").slice(1)
      : outreachMember.phone.replace(/[^0-9]/g, "");
    const waLink = `https://wa.me/${formattedWA}?text=${encodeURIComponent(outreachMessage)}`;
    window.open(waLink, "_blank");
    setOutreachModalOpen(false);
    
    // Add an audit log or alert for successful outreach operation representation
    setAlertDialog({
      isOpen: true,
      message: `Pesan outreach berhasil dialihkan ke WhatsApp untuk member ${outreachMember.fullName}!`,
      type: "success",
    });
  };
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Menu View Sub-Tab State
  const [menuTab, setMenuTab] = useState<"PRODUCTS" | "MODIFIERS">("PRODUCTS");
  const [financeTab, setFinanceTab] = useState<
    "SUMMARY" | "EXPENSES" | "AUDIT"
  >("SUMMARY");
  const [timeFilter, setTimeFilter] = useState<
    "TODAY" | "WEEK" | "MONTH" | "YEAR"
  >("TODAY");

  // Staff View Sub-Tab State
  const [staffTab, setStaffTab] = useState<"ACCOUNTS" | "ATTENDANCE">(
    "ACCOUNTS",
  );
  const [attendanceUserFilter, setAttendanceUserFilter] =
    useState<string>("ALL");
  const [attendanceMonthFilter, setAttendanceMonthFilter] =
    useState<string>("ALL");

  // Member Profile & History State
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isMemberHistoryOpen, setIsMemberHistoryOpen] = useState(false);
  const [historyTimeFilter, setHistoryTimeFilter] = useState<
    "ALL" | "7_DAYS" | "THIS_MONTH" | "THIS_YEAR" | "CUSTOM"
  >("ALL");
  const [historyStartDate, setHistoryStartDate] = useState("");
  const [historyEndDate, setHistoryEndDate] = useState("");

  // Transaction History State
  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionDateFilter, setTransactionDateFilter] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(
    null,
  );

  // Derived Attendance Data
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    attendanceLogs.forEach((log) => {
      const date = new Date(log.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse();
  }, [attendanceLogs]);

  const filteredAttendanceLogs = useMemo(() => {
    return attendanceLogs.filter((log) => {
      const matchUser =
        attendanceUserFilter === "ALL" || log.userId === attendanceUserFilter;
      const date = new Date(log.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const matchMonth =
        attendanceMonthFilter === "ALL" || monthKey === attendanceMonthFilter;
      return matchUser && matchMonth;
    });
  }, [attendanceLogs, attendanceUserFilter, attendanceMonthFilter]);

  const totalDaysAttended = useMemo(() => {
    const uniqueDates = new Set<string>();
    filteredAttendanceLogs.forEach((log) => {
      if (log.type === "CLOCK_IN") {
        const dateStr = new Date(log.timestamp).toISOString().split("T")[0];
        uniqueDates.add(dateStr);
      }
    });
    return uniqueDates.size;
  }, [filteredAttendanceLogs]);

  // Inventory State
  const [ingredientModalOpen, setIngredientModalOpen] = useState(false);
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(
    null,
  );
  const [ingredientForm, setIngredientForm] = useState<Partial<Ingredient>>({
    name: "",
    unit: "pcs",
    stock: 0,
    costPerUnit: 0,
    buyUnit: "pcs",
    conversionRate: 1,
    isSemiFinished: false,
    recipe: [],
  });

  // Member Management & Filter States
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  const [memberEditForm, setMemberEditForm] = useState<Partial<Member>>({});
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberTierFilter, setMemberTierFilter] = useState<"ALL" | Tier>("ALL");
  const [memberStatusFilter, setMemberStatusFilter] = useState<
    "ALL" | "ACTIVE" | "PENDING" | "PENDING_CARD"
  >("ALL");
  const [memberBirthMonthFilter, setMemberBirthMonthFilter] =
    useState<string>("ALL");
  const [showAddMemberModalAdmin, setShowAddMemberModalAdmin] = useState(false);
  const [newMemberFormAdmin, setNewMemberFormAdmin] = useState({
    fullName: "",
    nickname: "",
    phone: "",
    birthDate: "",
    gender: "MALE" as "MALE" | "FEMALE",
    tier: Tier.BRONZE,
    pin: "123456",
  });

  // Stock Opname State
  const [opnameModalOpen, setOpnameModalOpen] = useState(false);
  const [opnameItem, setOpnameItem] = useState<Ingredient | null>(null);
  const [opnameActual, setOpnameActual] = useState<number>(0);
  const [opnameReason, setOpnameReason] = useState<AdjustmentReason>(
    AdjustmentReason.BARANG_RUSAK_BUSUK,
  );

  // Production State
  const [productionModalOpen, setProductionModalOpen] = useState(false);
  const [productionItem, setProductionItem] = useState<Ingredient | null>(null);
  const [productionQty, setProductionQty] = useState<number>(1);

  // Expense State
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: "SALARY",
    amount: 0,
    description: "",
  });
  const [displayExpenseAmount, setDisplayExpenseAmount] = useState("");

  const handleExpenseAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    let val = e.target.value;
    val = val.replace(/[^0-9,]/g, "");
    const parts = val.split(",");
    if (parts.length > 2) val = parts[0] + "," + parts.slice(1).join("");
    let [integerPart, decimalPart] = val.split(",");
    if (integerPart) {
      if (integerPart.length > 1)
        integerPart = integerPart.replace(/^0+(?=\d)/, "");
      integerPart = integerPart.replace(/\./g, "");
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    const formatted =
      decimalPart !== undefined ? `${integerPart},${decimalPart}` : integerPart;
    setDisplayExpenseAmount(formatted);
    const numStr = formatted.replace(/\./g, "").replace(",", ".");
    setExpenseForm((prev) => ({
      ...prev,
      amount: numStr ? parseFloat(numStr) : 0,
    }));
  };

  // Menu/Product State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: "",
    price: 0,
    category: ProductCategory.COFFEE,
    image: "",
    recipe: [],
    staffCommission: 0,
    standardPrepTime: 5,
  });

  // Category Manager State
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Marketing State
  const [promoForm, setPromoForm] = useState<Partial<Promotion>>({
    name: "",
    type: "PERCENTAGE",
    value: 0,
    minSpend: 0,
    active: true,
    startDate: "",
    endDate: "",
  });
  const [isAddingPromo, setIsAddingPromo] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [promoDateMode, setPromoDateMode] = useState<"ALWAYS" | "SPECIFIC" | "RANGE">("ALWAYS");
  
  // AI Promo Suite State
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiSources, setAiSources] = useState<any[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);

  // AI Forecasting & BI Suite State
  const [aiForecastResult, setAiForecastResult] = useState<any | null>(null);
  const [isForecastingAi, setIsForecastingAi] = useState(false);
  const [aiForecastSources, setAiForecastSources] = useState<any[]>([]);
  const [aiForecastError, setAiForecastError] = useState<string | null>(null);

  // Staff State
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState<Partial<User>>({
    name: "",
    pin: "",
    role: Role.CASHIER,
    phone: "",
    avatar: "",
    dailyRate: 0,
  });
  const [displayDailyRate, setDisplayDailyRate] = useState("");
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [enrollingFaceUserId, setEnrollingFaceUserId] = useState<string | null>(
    null,
  );

  // Payroll state
  const [payrollMonthFilter, setPayrollMonthFilter] = useState<string>(
    availableMonths[0] || "ALL",
  );
  const [selectedPayslipUser, setSelectedPayslipUser] = useState<User | null>(
    null,
  );
  const [dailyTarget, setDailyTarget] = useState<number>(3000000);
  const [bonusAmount, setBonusAmount] = useState<number>(20000);

  // Calculate payroll data
  const payrollData = useMemo(() => {
    // Pre-calculate daily revenue
    const dailyRevenue: Record<string, number> = {};
    orders.forEach((order) => {
      const date = new Date(order.createdAt);
      const dateStr = date.toISOString().split("T")[0];
      if (!dailyRevenue[dateStr]) dailyRevenue[dateStr] = 0;
      dailyRevenue[dateStr] += order.total;
    });

    // Pre-calculate shared deductions per shift (Tanggung Renteng)
    const sharedDeductions = shiftHistory
      .map((shift) => {
        if (!shift.variance || shift.variance >= 0) return null;
        const shiftStart = new Date(shift.startTime).getTime();
        const shiftEnd = new Date(shift.endTime || new Date()).getTime();

        const presentUserIds = new Set<string>();
        users.forEach((u) => {
          const uLogs = attendanceLogs
            .filter((l) => l.userId === u.id)
            .sort(
              (a, b) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime(),
            );
          let isClockedIn = false;
          let lastClockInTime = 0;
          for (const log of uLogs) {
            const logTime = new Date(log.timestamp).getTime();
            if (log.type === "CLOCK_IN") {
              isClockedIn = true;
              lastClockInTime = logTime;
            } else if (log.type === "CLOCK_OUT") {
              if (
                isClockedIn &&
                lastClockInTime <= shiftEnd &&
                logTime >= shiftStart
              ) {
                presentUserIds.add(u.id);
              }
              isClockedIn = false;
            }
          }
          if (isClockedIn && lastClockInTime <= shiftEnd) {
            presentUserIds.add(u.id);
          }
        });

        if (presentUserIds.size === 0) {
          const cashier = users.find((u) => u.name === shift.cashierName);
          if (cashier) presentUserIds.add(cashier.id);
        }

        return {
          shift,
          splitAmount: Math.abs(shift.variance) / (presentUserIds.size || 1),
          presentUserIds,
        };
      })
      .filter(Boolean) as {
      shift: any;
      splitAmount: number;
      presentUserIds: Set<string>;
    }[];

    return users.map((user) => {
      // Find attendance for this user in the selected month
      const userLogs = attendanceLogs.filter((log) => {
        if (log.userId !== user.id) return false;
        if (payrollMonthFilter === "ALL") return true;

        const date = new Date(log.timestamp);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        return monthKey === payrollMonthFilter;
      });

      // Calculate unique days attended, bonus, and base pay with prorated hours
      const dailyEarnedAmounts: Record<string, number> = {};
      const dailyHours: Record<string, number> = {};
      const uniqueDates = new Set<string>();
      let achievedDays = 0;

      // Group logs by date
      const logsByDate: Record<string, typeof userLogs> = {};
      userLogs.forEach((log) => {
        const dateStr = new Date(log.timestamp).toISOString().split("T")[0];
        if (!logsByDate[dateStr]) logsByDate[dateStr] = [];
        logsByDate[dateStr].push(log);
      });

      Object.entries(logsByDate).forEach(([dateStr, logs]) => {
        uniqueDates.add(dateStr);

        // Sort logs for the day
        const sortedLogs = [...logs].sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );

        let totalMs = 0;
        let lastInTime: number | null = null;
        let hasIncompleteSession = false;

        sortedLogs.forEach((log) => {
          const logTime = new Date(log.timestamp).getTime();
          if (log.type === "CLOCK_IN") {
            lastInTime = logTime;
          } else if (log.type === "CLOCK_OUT") {
            if (lastInTime !== null) {
              totalMs += logTime - lastInTime;
              lastInTime = null;
            }
          }
        });

        // Hukuman Lupa Clock Out: If still clocked in at end of day logs
        if (lastInTime !== null) {
          hasIncompleteSession = true;
        }

        const hoursWorked = hasIncompleteSession
          ? 0
          : totalMs / (1000 * 60 * 60);
        dailyHours[dateStr] = hoursWorked;

        const dailyRate = user.dailyRate || 0;
        let earned = 0;
        if (hoursWorked >= 8) {
          earned = dailyRate;
        } else {
          earned = (hoursWorked / 8) * dailyRate;
        }

        dailyEarnedAmounts[dateStr] = earned;

        // Check if this day hit the target for bonus
        if ((dailyRevenue[dateStr] || 0) >= dailyTarget && hoursWorked > 0) {
          achievedDays++;
        }
      });

      // Calculate deductions from shared shift shortages (Tanggung Renteng)
      let totalDeductions = 0;
      sharedDeductions.forEach(({ shift, splitAmount, presentUserIds }) => {
        if (presentUserIds.has(user.id)) {
          const date = new Date(shift.endTime || shift.startTime);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          if (payrollMonthFilter === "ALL" || monthKey === payrollMonthFilter) {
            totalDeductions += splitAmount;
          }
        }
      });

      const daysAttended = uniqueDates.size;
      const totalHoursWorked = Object.values(dailyHours).reduce(
        (sum, h) => sum + h,
        0,
      );
      const basePay = Object.values(dailyEarnedAmounts).reduce(
        (sum, a) => sum + a,
        0,
      );
      const bonusTotal = achievedDays * bonusAmount;
      const totalPay = basePay + bonusTotal - totalDeductions;

      return {
        user,
        daysAttended,
        totalHoursWorked,
        dailyRate: user.dailyRate || 0,
        achievedDays,
        bonusTotal,
        totalDeductions,
        totalPay,
      };
    });
  }, [
    users,
    attendanceLogs,
    payrollMonthFilter,
    orders,
    dailyTarget,
    bonusAmount,
    shiftHistory,
  ]);

  // Recipe Builder State
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>("");
  const [selectedIngredientAmount, setSelectedIngredientAmount] =
    useState<number>(0);
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState("");
  const [isIngredientListOpen, setIsIngredientListOpen] = useState(false);

  const filteredIngredientsForRecipe = ingredients.filter(
    (ing) =>
      ing.name.toLowerCase().includes(ingredientSearchQuery.toLowerCase()) &&
      !productForm.recipe?.some((r) => r.ingredientId === ing.id),
  );

  // Pricing Simulator State
  const [isPricingSimOpen, setIsPricingSimOpen] = useState(false);
  const [showSmartOverhead, setShowSmartOverhead] = useState(false);
  const [targetSalesPerMonth, setTargetSalesPerMonth] = useState(3000); // Default 100 cups/day * 30 days
  const [simParams, setSimParams] = useState({
    marginPercent: 30,
    overheadCost: 0,
    taxPercent: 10,
  });

  const getSmartOverheadRecommendation = () => {
    // Filter operational expenses (Sewa, Gaji, Listrik, etc), excluding PURCHASE (bahan baku)
    const opEx = expenses.filter(
      (e) => e.category !== "PURCHASE" && !e.isVoided,
    );
    // Ideally we take the last 30 days, but here we'll sum all and assume it represents historical monthly average,
    // or just use total and let user adjust. Let's do total operational expenses.
    const totalOpEx = opEx.reduce((sum, e) => sum + e.amount, 0);
    if (targetSalesPerMonth <= 0) return 0;
    // Provide logic based on current month's expenses or average
    // Simplification: We just use totalOpEx for now, assuming demo data represents 1 month.
    return Math.round(totalOpEx / targetSalesPerMonth);
  };

  const calculateSimulation = () => {
    const rawMaterialCost =
      productForm.recipe?.reduce(
        (acc, r) =>
          acc +
          (ingredients.find((i) => i.id === r.ingredientId)?.costPerUnit || 0) *
            r.amount,
        0,
      ) || 0;
    const totalCost = rawMaterialCost + simParams.overheadCost;
    // Selling Price = Total Cost / (1 - Margin%)
    const recommendedPrice =
      simParams.marginPercent < 100
        ? totalCost / (1 - simParams.marginPercent / 100)
        : 0;
    const priceWithTax = recommendedPrice * (1 + simParams.taxPercent / 100);

    return { rawMaterialCost, totalCost, recommendedPrice, priceWithTax };
  };

  const openPricingSimulator = () => {
    // Auto-calculate overhead if possible
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalItemsSold = orders.reduce(
      (sum, o) => sum + o.items.reduce((is, i) => is + i.quantity, 0),
      0,
    );
    const avgOverhead =
      totalItemsSold > 0 ? Math.ceil(totalExpenses / totalItemsSold) : 0;

    setSimParams({
      marginPercent: 30,
      overheadCost: avgOverhead,
      taxPercent: 10,
    });
    setIsPricingSimOpen(true);
  };

  const applySimulatedPrice = () => {
    const { recommendedPrice } = calculateSimulation();
    setProductForm({
      ...productForm,
      price: Math.ceil(recommendedPrice / 100) * 100,
    }); // Round up to nearest 100
    setIsPricingSimOpen(false);
  };

  // Helper
  const formatRupiah = (value: number) => {
    return value.toLocaleString("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 2,
    });
  };

  // --- Handlers ---

  const openIngredientModal = (item?: Ingredient) => {
    if (item) {
      setEditingIngredientId(item.id);
      setIngredientForm({ ...item, recipe: item.recipe || [] });
    } else {
      setEditingIngredientId(null);
      setIngredientForm({
        name: "",
        unit: "pcs",
        stock: 0,
        costPerUnit: 0,
        buyUnit: "pcs",
        conversionRate: 1,
        isSemiFinished: false,
        recipe: [],
      });
    }
    setIngredientModalOpen(true);
  };

  const handleSaveIngredient = () => {
    if (ingredientForm.name && ingredientForm.unit) {
      setConfirmDialog({
        isOpen: true,
        message: `Simpan bahan baku ${ingredientForm.name}?`,
        onConfirm: () => {
          if (editingIngredientId) {
            updateIngredient(editingIngredientId, ingredientForm);
          } else {
            const newItem: Ingredient = {
              id: `i-${Date.now()}`,
              name: ingredientForm.name!,
              unit: ingredientForm.unit!,
              stock: Number(ingredientForm.stock) || 0,
              costPerUnit: Number(ingredientForm.costPerUnit) || 0,
              buyUnit: ingredientForm.buyUnit || "pcs",
              conversionRate: Number(ingredientForm.conversionRate) || 1,
              isSemiFinished: !!ingredientForm.isSemiFinished,
              recipe: ingredientForm.recipe || [],
            };
            addIngredient(newItem);
          }
          setIngredientModalOpen(false);
        },
      });
    }
  };

  const openOpnameModal = (item: Ingredient) => {
    setOpnameItem(item);
    setOpnameActual(item.stock);
    setOpnameReason(AdjustmentReason.SISA_PRODUKSI_LIMBAH);
    setOpnameModalOpen(true);
  };

  const submitOpname = () => {
    if (opnameItem) {
      setConfirmDialog({
        isOpen: true,
        message: `Proses penyesuaian stok (Opname) untuk ${opnameItem.name} menjadi ${opnameActual} ${opnameItem.unit}?`,
        onConfirm: () => {
          performStockOpname(opnameItem.id, Number(opnameActual), opnameReason);
          setOpnameModalOpen(false);
          setOpnameItem(null);
        },
      });
    }
  };

  const submitExpense = () => {
    if (expenseForm.amount > 0 && expenseForm.description) {
      setConfirmDialog({
        isOpen: true,
        message: `Simpan catatan pengeluaran "${expenseForm.description}" sebesar Rp ${new Intl.NumberFormat("id-ID").format(Number(expenseForm.amount))}?`,
        onConfirm: () => {
          addExpense({
            category: expenseForm.category as any,
            amount: Number(expenseForm.amount),
            description: expenseForm.description,
            date: new Date().toISOString(),
            source: "CASH_DRAWER", // Default to cash drawer for manual expense
          });
          setIsAddingExpense(false);
          setExpenseForm({ category: "SALARY", amount: 0, description: "" });
          setDisplayExpenseAmount("");
        },
      });
    }
  };

  const startEditMember = (member: any) => {
    setEditingMemberId(member.id);
    setMemberEditForm({
      id: member.id,
      fullName: member.fullName || member.name,
      nickname: member.nickname || member.name,
      name: member.name,
      phone: member.phone,
      birthDate: member.birthDate || "",
      gender: member.gender || "MALE",
      pin: member.pin || "123456",
      tier: member.tier,
      status: member.status || "ACTIVE",
    });
    setIsEditMemberModalOpen(true);
  };

  const saveMember = () => {
    if (editingMemberId) {
      setConfirmDialog({
        isOpen: true,
        message: `Simpan perubahan data member ${memberEditForm.name || memberEditForm.nickname}?`,
        onConfirm: () => {
          const finalForm = {
            ...memberEditForm,
            name: memberEditForm.nickname || memberEditForm.name,
          };
          updateMember(editingMemberId, finalForm);
          setEditingMemberId(null);
          setIsEditMemberModalOpen(false);
          setAlertDialog({
            isOpen: true,
            message: "Profil member berhasil diperbarui!",
            type: "success",
          });
        },
      });
    }
  };

  const handleAddMemberAdmin = () => {
    if (
      !newMemberFormAdmin.fullName ||
      !newMemberFormAdmin.nickname ||
      !newMemberFormAdmin.phone
    ) {
      setAlertDialog({
        isOpen: true,
        message: "Nama Lengkap, Panggilan, dan No WA wajib diisi",
        type: "error",
      });
      return;
    }

    const added = addMember(
      newMemberFormAdmin.fullName,
      newMemberFormAdmin.nickname,
      newMemberFormAdmin.phone,
      undefined,
      newMemberFormAdmin.birthDate || undefined,
      newMemberFormAdmin.gender,
    );

    if (
      newMemberFormAdmin.pin !== "123456" ||
      newMemberFormAdmin.tier !== Tier.BRONZE
    ) {
      updateMember(added.id, {
        pin: newMemberFormAdmin.pin,
        tier: newMemberFormAdmin.tier,
      });
    }

    setShowAddMemberModalAdmin(false);
    setNewMemberFormAdmin({
      fullName: "",
      nickname: "",
      phone: "",
      birthDate: "",
      gender: "MALE",
      tier: Tier.BRONZE,
      pin: "123456",
    });
    setAlertDialog({
      isOpen: true,
      message: "Member baru berhasil terdaftar!",
      type: "success",
    });
  };

  const handleExportContactsVCF = () => {
    if (members.length === 0) {
      setAlertDialog({
        isOpen: true,
        message: "Tidak ada member terdaftar untuk diexport.",
        type: "error",
      });
      return;
    }

    let vcfContent = "";
    members.forEach((member) => {
      const rawPhone = member.phone || "";
      if (!rawPhone) return;

      // Clean up any spaces, dashes, or parentheses
      const cleanPhone = rawPhone.replace(/[\s\-\(\)]/g, "");

      const name = member.fullName || member.name || "Member";
      const nickname = member.nickname ? ` (${member.nickname})` : "";
      const tier = member.tier || Tier.BRONZE;

      vcfContent += "BEGIN:VCARD\n";
      vcfContent += "VERSION:3.0\n";
      vcfContent += `FN:Coraq - ${name}${nickname}\n`;
      vcfContent += `N:${name};Coraq;;;\n`;
      vcfContent += `TEL;TYPE=CELL,VOICE:${cleanPhone}\n`;
      vcfContent += `NOTE:Coraq Coffee Member - Tier: ${tier} - ID: ${member.id}\n`;
      vcfContent += "END:VCARD\n";
    });

    const blob = new Blob([vcfContent], { type: "text/vcard;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Coraq_Contacts_${new Date().toISOString().split('T')[0]}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setAlertDialog({
      isOpen: true,
      message: `${members.filter(m => m.phone).length} kontak member berhasil diexport ke format VCF! Silakan transfer file ini ke Tablet Android Anda (via WA, Google Drive, atau Kabel data) lalu buka file tersebut untuk otomatis meng-import semua kontak ke daftar telepon.`,
      type: "success",
    });
  };

  const handleExportContactsCSV = () => {
    if (members.length === 0) {
      setAlertDialog({
        isOpen: true,
        message: "Tidak ada member terdaftar untuk diexport.",
        type: "error",
      });
      return;
    }

    let csvContent = "\uFEFF"; // UTF-8 BOM for Excel compatibility
    csvContent += "Name,Phone 1 - Type,Phone 1 - Value,Notes\n";

    members.forEach((member) => {
      const rawPhone = member.phone || "";
      if (!rawPhone) return;
      const cleanPhone = rawPhone.replace(/[\s\-\(\)]/g, "");
      const name = member.fullName || member.name || "Member";
      const nickname = member.nickname ? ` (${member.nickname})` : "";
      const tier = member.tier || Tier.BRONZE;

      const displayName = `Coraq - ${name}${nickname}`;
      const notes = `Coraq Coffee Member - Tier: ${tier} - ID: ${member.id}`;
      
      csvContent += `"${displayName.replace(/"/g, '""')}","Mobile","${cleanPhone}","${notes.replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Coraq_Contacts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setAlertDialog({
      isOpen: true,
      message: `${members.filter(m => m.phone).length} kontak member berhasil diexport ke format CSV! File ini dapat di-import dengan mudah lewat Google Contacts (contacts.google.com).`,
      type: "success",
    });
  };

  // Product Logic
  const handleOpenProductModal = (product?: Product) => {
    setIngredientSearchQuery("");
    setSelectedIngredientId("");
    setSelectedIngredientAmount(0);
    setIsIngredientListOpen(false);

    if (product) {
      setEditingProductId(product.id);
      setProductForm({ ...product });
    } else {
      setEditingProductId(null);
      setProductForm({
        name: "",
        price: 0,
        category: categories[0] || "Uncategorized",
        image:
          "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1000",
        recipe: [],
        staffCommission: 0,
        standardPrepTime: 5,
      });
    }
    setProductModalOpen(true);
  };

  const handleSelectIngredient = (ing: Ingredient) => {
    setSelectedIngredientId(ing.id);
    setIngredientSearchQuery(ing.name);
    setIsIngredientListOpen(false);
  };

  const addIngredientToRecipe = () => {
    if (selectedIngredientId && selectedIngredientAmount > 0) {
      const existing = productForm.recipe || [];
      const filtered = existing.filter(
        (r) => r.ingredientId !== selectedIngredientId,
      );
      setProductForm({
        ...productForm,
        recipe: [
          ...filtered,
          {
            ingredientId: selectedIngredientId,
            amount: selectedIngredientAmount,
          },
        ],
      });

      setSelectedIngredientId("");
      setIngredientSearchQuery("");
      setSelectedIngredientAmount(0);
    }
  };

  const removeIngredientFromRecipe = (id: string) => {
    const existing = productForm.recipe || [];
    setProductForm({
      ...productForm,
      recipe: existing.filter((r) => r.ingredientId !== id),
    });
  };

  const updateIngredientAmount = (id: string, amount: number) => {
    const existing = productForm.recipe || [];
    setProductForm({
      ...productForm,
      recipe: existing.map((r) =>
        r.ingredientId === id ? { ...r, amount } : r,
      ),
    });
  };

  const submitProduct = () => {
    if (!productForm.name || !productForm.price) {
      setAlertDialog({
        isOpen: true,
        message: "Nama dan Harga wajib diisi",
        type: "error",
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      message: `Simpan data produk ${productForm.name} seharga Rp ${new Intl.NumberFormat("id-ID").format(Number(productForm.price))}?`,
      onConfirm: () => {
        if (editingProductId) {
          updateProduct(editingProductId, productForm);
        } else {
          addProduct({
            id: `p-${Date.now()}`,
            name: productForm.name!,
            price: Number(productForm.price),
            category: productForm.category!,
            image: productForm.image!,
            recipe: productForm.recipe,
            staffCommission: Number(productForm.staffCommission) || 0,
            standardPrepTime: Number(productForm.standardPrepTime) || 5,
          } as Product);
        }
        setProductModalOpen(false);
      },
    });
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addCategory(newCategoryName.toUpperCase().replace(/\s+/g, "_"));
      setNewCategoryName("");
    }
  };

  const handleSubmitPromo = () => {
    if (promoForm.name && promoForm.value) {
      const startDt = promoDateMode === "ALWAYS" ? undefined : promoForm.startDate || undefined;
      const endDt = promoDateMode === "RANGE" ? promoForm.endDate || undefined : (promoDateMode === "SPECIFIC" ? promoForm.startDate || undefined : undefined);

      setConfirmDialog({
        isOpen: true,
        message: editingPromoId 
          ? `Perbarui data promo ${promoForm.name}?` 
          : `Simpan data promo ${promoForm.name}?`,
        onConfirm: () => {
          if (editingPromoId) {
            updatePromotion(editingPromoId, {
              name: promoForm.name!,
              type: promoForm.type as any,
              value: Number(promoForm.value),
              minSpend: Number(promoForm.minSpend),
              happyHourStart: promoForm.happyHourStart || undefined,
              happyHourEnd: promoForm.happyHourEnd || undefined,
              description: promoForm.description || "",
              startDate: startDt,
              endDate: endDt,
            });
          } else {
            addPromotion({
              id: `pr-${Date.now()}`,
              name: promoForm.name!,
              type: promoForm.type as any,
              value: Number(promoForm.value),
              minSpend: Number(promoForm.minSpend),
              active: true,
              happyHourStart: promoForm.happyHourStart || undefined,
              happyHourEnd: promoForm.happyHourEnd || undefined,
              description: promoForm.description || "",
              startDate: startDt,
              endDate: endDt,
            });
          }
          setIsAddingPromo(false);
          setEditingPromoId(null);
          setPromoForm({
            name: "",
            type: "PERCENTAGE",
            value: 0,
            minSpend: 0,
            active: true,
            startDate: "",
            endDate: "",
          });
          setPromoDateMode("ALWAYS");
        },
      });
    }
  };

  const formatInputDecimal = (num: number): string => {
    if (!num) return "";
    const parts = num.toString().split(".");
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return parts.length > 1 ? `${intPart},${parts[1]}` : intPart;
  };

  const handleOpenStaffModal = (user?: User) => {
    if (user) {
      setEditingStaffId(user.id);
      setStaffForm({ ...user });
      setDisplayDailyRate(formatInputDecimal(user.dailyRate || 0));
    } else {
      setEditingStaffId(null);
      setStaffForm({
        name: "",
        pin: "",
        role: Role.CASHIER,
        phone: "",
        avatar: "",
        dailyRate: 0,
      });
      setDisplayDailyRate("");
    }
    setStaffModalOpen(true);
  };

  const handleDailyRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Allow digits and comma
    val = val.replace(/[^0-9,]/g, "");

    // Ensure only one comma
    const parts = val.split(",");
    if (parts.length > 2) {
      val = parts[0] + "," + parts.slice(1).join("");
    }

    // Format thousands with dot
    let [integerPart, decimalPart] = val.split(",");
    if (integerPart) {
      // Remove leading zeros except a single zero
      if (integerPart.length > 1) {
        integerPart = integerPart.replace(/^0+(?=\d)/, "");
      }
      integerPart = integerPart.replace(/\./g, "");
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    const formatted =
      decimalPart !== undefined ? `${integerPart},${decimalPart}` : integerPart;
    setDisplayDailyRate(formatted);

    // Convert to number for saving
    const numStr = formatted.replace(/\./g, "").replace(",", ".");
    setStaffForm((prev) => ({
      ...prev,
      dailyRate: numStr ? parseFloat(numStr) : 0,
    }));
  };

  const handleSubmitStaff = () => {
    if (!staffForm.name || !staffForm.pin || staffForm.pin.length !== 6) {
      setAlertDialog({
        isOpen: true,
        message: "Nama wajib diisi dan PIN harus 6 digit.",
        type: "error",
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      message: `Simpan data pegawai ${staffForm.name} sebagai ${staffForm.role}?`,
      onConfirm: () => {
        if (editingStaffId) {
          updateUser(editingStaffId, staffForm);
        } else {
          addUser({
            id: `u-${Date.now()}`,
            name: staffForm.name!,
            pin: staffForm.pin!,
            role: staffForm.role!,
            phone: staffForm.phone || "",
            avatar: staffForm.avatar || "",
            dailyRate: Number(staffForm.dailyRate) || 0,
          });
        }
        setStaffModalOpen(false);
      },
    });
  };

  const heatmapData = useMemo(() => {
    const days = ["Ming", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const grid = Array(7)
      .fill(0)
      .map(() => Array(15).fill(0));

    orders.forEach((order) => {
      const date = new Date(order.createdAt);
      const day = date.getDay(); // 0-6
      const hour = date.getHours();
      const hourIndex = hour - 8; // Start at 8 AM
      if (hourIndex >= 0 && hourIndex < 15) {
        grid[day][hourIndex] += 1;
      }
    });

    if (orders.length < 5) {
      grid[2][6] = 12; // Tue 2PM
      grid[2][5] = 8;
      grid[2][7] = 10;
      grid[5][10] = 5; // Fri 6PM
      grid[6][11] = 15; // Sat 7PM
      grid[0][4] = 20; // Sun 12PM
    }

    return { days, grid };
  }, [orders]);

  const bcgData = useMemo(() => {
    return products
      .map((product) => {
        const volume = orders.reduce((acc, order) => {
          if (order.status === OrderStatus.CANCELLED) return acc;
          const item = order.items.find((i) => i.product.id === product.id);
          return acc + (item ? item.quantity : 0);
        }, 0);

        const cost = calculateProductCost(product);
        const margin =
          product.price > 0
            ? ((product.price - cost) / product.price) * 100
            : 0;

        let classification = "";
        const highVol = 20;
        const highMargin = 50;

        if (volume >= highVol && margin >= highMargin) classification = "STAR";
        else if (volume >= highVol && margin < highMargin)
          classification = "CASH COW";
        else if (volume < highVol && margin >= highMargin)
          classification = "QUESTION";
        else classification = "DOG";

        return {
          name: product.name,
          x: volume,
          y: margin,
          z: 100,
          classification,
          price: product.price,
          cost,
        };
      })
      .filter((d) => d.x > 0 || orders.length < 5);
  }, [products, orders, calculateProductCost]);

  const [isAdminQRScannerOpen, setIsAdminQRScannerOpen] = useState(false);
  const [bindingMemberId, setBindingMemberId] = useState<string | null>(null);
  const [manualMemberCardCode, setManualMemberCardCode] = useState("");
  const [adminCameraId, setAdminCameraId] = useState<string | null>(null);
  const [adminCameraDevices, setAdminCameraDevices] = useState<any[]>([]);
  const adminQrScannerRef = React.useRef<Html5Qrcode | null>(null);
  const adminTaskQueueRef = React.useRef<Promise<void>>(Promise.resolve());

  React.useEffect(() => {
    if (isAdminQRScannerOpen) {
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length > 0) {
            setAdminCameraDevices(devices);
            const backCamera = devices.find(
              (d) =>
                d.label.toLowerCase().includes("back") ||
                d.label.toLowerCase().includes("rear") ||
                d.label.toLowerCase().includes("environment"),
            );
            setAdminCameraId(backCamera ? backCamera.id : devices[0].id);
          }
        })
        .catch((err) => console.error("Error getting cameras:", err));
    }
  }, [isAdminQRScannerOpen]);

  React.useEffect(() => {
    let isMounted = true;

    if (!adminQrScannerRef.current) {
      adminQrScannerRef.current = new Html5Qrcode("admin-qr-reader");
    }

    const doStop = async () => {
      const scanner = adminQrScannerRef.current;
      try {
        if (
          scanner &&
          (scanner.isScanning ||
            scanner.getState() === Html5QrcodeScannerState.SCANNING ||
            scanner.getState() === Html5QrcodeScannerState.PAUSED)
        ) {
          await scanner.stop();
          await new Promise((r) => setTimeout(r, 250)); // let hardware release
        }
      } catch (e) {
        // expected stop error
        adminQrScannerRef.current = null;
      }
      try {
        if (scanner) {
          scanner.clear();
        }
      } catch (e) {
        // expected clear error
      } finally {
        adminQrScannerRef.current = null;
      }
    };

    const doStart = async () => {
      try {
        if (!isAdminQRScannerOpen || !bindingMemberId || !adminCameraId) {
          await doStop();
          return;
        }

        await doStop();

        if (!isMounted) return;

        if (!adminQrScannerRef.current) {
          adminQrScannerRef.current = new Html5Qrcode("admin-qr-reader");
        }
        const currentScanner = adminQrScannerRef.current;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        };
        await currentScanner.start(
          adminCameraId,
          config,
          (decodedText) => {
            if (!isMounted) return;
            setManualMemberCardCode(decodedText);
          },
          (err) => {},
        );
      } catch (err) {
        console.error("Failed to start admin scanner:", err);
      }
    };

    adminTaskQueueRef.current = adminTaskQueueRef.current.then(doStart);

    return () => {
      isMounted = false;
      adminTaskQueueRef.current = adminTaskQueueRef.current.then(doStop);
    };
  }, [isAdminQRScannerOpen, bindingMemberId, adminCameraId]);

  // --- Views ---
  const renderDashboard = () => (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Ringkasan Dashboard</h2>
        <p className="text-slate-400">Wawasan bisnis waktu nyata.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-orange-900/30 w-12 h-12 flex items-center justify-center rounded-lg text-orange-500 font-serif font-black text-xl">
              Rp
            </div>
            <span className="text-xs text-green-500 bg-green-900/20 px-2 py-1 rounded">
              +12%
            </span>
          </div>
          <p className="text-slate-400 text-sm">Pendapatan Harian</p>
          <h3 className="text-2xl font-bold">
            {formatRupiah(getDailySales())}
          </h3>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-blue-900/30 p-3 rounded-lg text-blue-500">
              <Package size={24} />
            </div>
          </div>
          <p className="text-slate-400 text-sm">Total Pesanan</p>
          <h3 className="text-2xl font-bold">{orders.length}</h3>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-purple-900/30 p-3 rounded-lg text-purple-500">
              <Users size={24} />
            </div>
          </div>
          <p className="text-slate-400 text-sm">Total Member</p>
          <h3 className="text-2xl font-bold">{members.length}</h3>
        </div>
      </div>

      {/* Smart Alerts Section */}
      {auditLogs.filter((l) => l.severity !== "LOW").length > 0 && (
        <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-xl">
          <h3 className="text-red-500 font-bold flex items-center gap-2 mb-3">
            <AlertTriangle size={18} /> Peringatan Sistem (Smart Alerts)
          </h3>
          <div className="space-y-2">
            {auditLogs
              .filter((l) => l.severity !== "LOW")
              .slice(0, 3)
              .map((log) => (
                <div
                  key={log.id}
                  className="flex justify-between items-center text-sm bg-slate-900/50 p-2 rounded border border-slate-800"
                >
                  <span className="text-slate-300">{log.details}</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Inventory Bahan</h2>
          <p className="text-slate-400">Manajemen stok bahan baku dan HPP.</p>
        </div>
        <button
          onClick={() => openIngredientModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
        >
          <Plus size={18} /> Bahan Baru
        </button>
      </header>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-bold">
            <tr>
              <th className="p-4">Nama Bahan</th>
              <th className="p-4">Stok</th>
              <th className="p-4">Satuan</th>
              <th className="p-4">Konversi Beli</th>
              <th className="p-4">HPP & Harga Beli Terakhir</th>
              <th className="p-4">Value</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {ingredients.map((ing) => (
              <tr key={ing.id} className="hover:bg-slate-800/50">
                <td className="p-4 font-bold text-white mb-2">
                  {ing.name}
                  {ing.isSemiFinished && (
                    <span className="block mt-1 w-max px-2 py-0.5 bg-indigo-900/30 text-indigo-400 text-[10px] rounded uppercase border border-indigo-800">
                      Bahan Setengah Jadi
                    </span>
                  )}
                </td>
                <td
                  className={`p-4 font-mono font-bold ${ing.stock < (ing.minStockLevel || 10) ? "text-red-500" : "text-green-400"}`}
                >
                  {ing.stock}
                </td>
                <td className="p-4 text-slate-400">{ing.unit}</td>

                {/* NEW: Conversion Display */}
                <td className="p-4 text-slate-400 text-xs">
                  <div>
                    <span className="block text-white">
                      1 {ing.buyUnit || "Pcs"}
                    </span>
                    <span className="block opacity-60">
                      = {ing.conversionRate || 1} {ing.unit}
                    </span>
                  </div>
                </td>

                <td className="p-4">
                  <div className="text-slate-300 font-bold">
                    {formatRupiah(ing.costPerUnit)}{" "}
                    <span className="text-[10px] font-normal text-slate-500">
                      / {ing.unit} (HPP)
                    </span>
                  </div>
                  {ing.priceHistory && ing.priceHistory.length > 0 && (
                    <div className="text-emerald-400 text-xs mt-1">
                      {formatRupiah(
                        ing.priceHistory[ing.priceHistory.length - 1].price,
                      )}{" "}
                      <span className="text-[10px] text-emerald-500/70">
                        / {ing.unit} (Nota Terakhir)
                      </span>
                    </div>
                  )}
                </td>
                <td className="p-4 font-mono text-slate-300">
                  {formatRupiah(ing.stock * ing.costPerUnit)}
                </td>
                <td className="p-4 flex gap-2">
                  <>
                    {ing.isSemiFinished && (
                      <button
                        onClick={() => {
                          setProductionItem(ing);
                          setProductionQty(1);
                          setProductionModalOpen(true);
                        }}
                        className="p-2 bg-indigo-900/30 text-indigo-400 rounded hover:bg-indigo-900/50"
                        title="Produksi Batch"
                      >
                        <Layers size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => openOpnameModal(ing)}
                      className="p-2 bg-orange-900/30 text-orange-500 rounded hover:bg-orange-900/50"
                      title="Stock Opname"
                    >
                      <ClipboardCheck size={16} />
                    </button>
                    <button
                      onClick={() => openIngredientModal(ing)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded"
                    >
                      <Edit2 size={16} />
                    </button>
                  </>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Price Intelligence Section */}
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
        <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
          <TrendingUp size={20} /> Price Intelligence (Tren Harga Bahan)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ingredients
            .filter((ing) => ing.priceHistory && ing.priceHistory.length > 1)
            .map((ing) => (
              <div
                key={ing.id}
                className="bg-slate-950 p-4 rounded-lg border border-slate-800 h-[200px]"
              >
                <h4 className="text-sm font-bold text-slate-400 mb-2">
                  {ing.name}
                </h4>
                <ResponsiveContainer width="100%" height="80%">
                  <LineChart data={ing.priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={["auto", "auto"]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#1e293b",
                        color: "white",
                      }}
                      formatter={(value: number) => [
                        formatRupiah(value),
                        "Harga",
                      ]}
                      labelFormatter={(label) =>
                        new Date(label).toLocaleDateString()
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          {ingredients.filter(
            (ing) => ing.priceHistory && ing.priceHistory.length > 1,
          ).length === 0 && (
            <p className="text-slate-500 italic text-sm col-span-full">
              Belum ada cukup data riwayat harga untuk menampilkan tren.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // Derived Finance Data for Executive Summary
  const financeSummary = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    // Helper to get start of week (Monday)
    const getStartOfWeek = (d: Date) => {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(date.setDate(diff));
    };

    let startTime = new Date(startOfToday);
    if (timeFilter === "WEEK") {
      startTime = getStartOfWeek(now);
      startTime.setHours(0, 0, 0, 0);
    } else if (timeFilter === "MONTH") {
      startTime = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeFilter === "YEAR") {
      startTime = new Date(now.getFullYear(), 0, 1);
    }

    const filteredOrders = orders.filter(
      (o) =>
        o.paymentStatus === "PAID" &&
        o.paidAt &&
        new Date(o.paidAt) >= startTime,
    );
    const filteredExpenses = expenses.filter(
      (e) => !e.isVoided && new Date(e.date) >= startTime,
    );

    const revenue = filteredOrders.reduce((sum, o) => sum + o.finalAmount, 0);
    const outflow = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Grouping for charts
    const expenseByCategory = filteredExpenses.reduce((acc: any, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});

    const pieData = Object.keys(expenseByCategory).map((cat) => ({
      name: cat,
      value: expenseByCategory[cat],
    }));

    return {
      revenue,
      outflow,
      profit: revenue - outflow,
      pieData,
      orderCount: filteredOrders.length,
      expenseCount: filteredExpenses.length,
    };
  }, [orders, expenses, timeFilter]);

  const renderTransactions = () => {
    const filteredOrders = orders.filter((order) => {
      const dateStr = new Date(order.createdAt).toISOString().split("T")[0];
      const matchDate = dateStr === transactionDateFilter;
      const matchSearch =
        order.id.toLowerCase().includes(transactionSearch.toLowerCase()) ||
        (order.customerName || "")
          .toLowerCase()
          .includes(transactionSearch.toLowerCase());
      return matchDate && matchSearch;
    });

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Riwayat Transaksi</h2>
            <p className="text-slate-400">
              Daftar nota penjualan dan detail pesanan.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
              <input
                type="text"
                placeholder="Cari No. Nota / Nama..."
                className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white outline-none focus:border-brand-500 w-full sm:w-64"
                value={transactionSearch}
                onChange={(e) => setTransactionSearch(e.target.value)}
              />
            </div>
            <input
              type="date"
              className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-white outline-none focus:border-brand-500"
              value={transactionDateFilter}
              onChange={(e) => setTransactionDateFilter(e.target.value)}
            />
          </div>
        </header>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="p-4">No. Nota</th>
                  <th className="p-4">Waktu</th>
                  <th className="p-4">Pelanggan</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Metode</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-12 text-center text-slate-500 italic"
                    >
                      Tidak ada transaksi ditemukan untuk filter ini.
                    </td>
                  </tr>
                ) : (
                  [...filteredOrders].reverse().map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="p-4 font-mono text-xs text-brand-400 font-bold">
                        {order.id}
                      </td>
                      <td className="p-4 text-sm text-slate-400">
                        {new Date(order.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-bold text-white">
                          {order.customerName || "Guest"}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Pager: {order.pagerNumber}
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-white">
                        {formatRupiah(order.finalAmount)}
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] px-2 py-1 bg-slate-800 rounded font-bold text-slate-400 uppercase">
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-[10px] px-2 py-1 rounded font-black uppercase tracking-tighter ${
                            order.paymentStatus === "PAID"
                              ? "bg-emerald-900/30 text-emerald-400"
                              : order.paymentStatus === "VOID"
                                ? "bg-red-900/30 text-red-400"
                                : "bg-yellow-900/30 text-yellow-400"
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setSelectedOrderDetails(order)}
                          className="p-2 bg-slate-800 text-slate-400 hover:bg-brand-600 hover:text-white rounded-lg transition-all"
                        >
                          <Search size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderFinance = () => (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Laporan Keuangan</h2>
          <p className="text-slate-400">
            Pencatatan pengeluaran dan rekapitulasi.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setIsAddingExpense(true);
              setExpenseForm({
                category: "SALARY",
                amount: 0,
                description: "",
              });
              setDisplayExpenseAmount("");
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
          >
            <Minus size={18} /> Catat Pengeluaran
          </button>
        </div>
      </header>

      {/* Sub Tabs */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800 w-full sm:w-fit">
          <button
            onClick={() => setFinanceTab("SUMMARY")}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${financeTab === "SUMMARY" ? "bg-brand-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
          >
            <TrendingUp size={16} /> Ringkasan Eksekutif
          </button>
          <button
            onClick={() => setFinanceTab("EXPENSES")}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${financeTab === "EXPENSES" ? "bg-brand-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
          >
            <Minus size={16} /> Pengeluaran Operasional
          </button>
          <button
            onClick={() => setFinanceTab("AUDIT")}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${financeTab === "AUDIT" ? "bg-brand-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
          >
            <ShieldAlert size={16} /> Log Audit & Keamanan
          </button>
        </div>

        {financeTab === "SUMMARY" && (
          <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800 w-full sm:w-fit">
            {(["TODAY", "WEEK", "MONTH", "YEAR"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-xs transition-all ${timeFilter === f ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"}`}
              >
                {f === "TODAY"
                  ? "Hari Ini"
                  : f === "WEEK"
                    ? "Minggu Ini"
                    : f === "MONTH"
                      ? "Bulan Ini"
                      : "Tahunan"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-full">
        {financeTab === "SUMMARY" ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-emerald-500/10 rounded-xl">
                    <TrendingUp className="text-emerald-500" size={24} />
                  </div>
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded">
                    Revenue
                  </span>
                </div>
                <h3 className="text-slate-400 text-sm font-bold mb-1">
                  Total Pemasukan
                </h3>
                <p className="text-3xl font-mono font-black text-white">
                  {formatRupiah(financeSummary.revenue)}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {financeSummary.orderCount} Transaksi Berhasil
                </p>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-red-500/10 rounded-xl">
                    <Minus className="text-red-500" size={24} />
                  </div>
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-2 py-1 rounded">
                    Expenses
                  </span>
                </div>
                <h3 className="text-slate-400 text-sm font-bold mb-1">
                  Total Pengeluaran
                </h3>
                <p className="text-3xl font-mono font-black text-white">
                  {formatRupiah(financeSummary.outflow)}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {financeSummary.expenseCount} Catatan Pengeluaran
                </p>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
                <div
                  className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-20 ${financeSummary.profit >= 0 ? "bg-emerald-500" : "bg-red-500"}`}
                ></div>
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`p-3 rounded-xl ${financeSummary.profit >= 0 ? "bg-brand-500/10" : "bg-red-500/10"}`}
                  >
                    <Wallet
                      className={
                        financeSummary.profit >= 0
                          ? "text-brand-500"
                          : "text-red-500"
                      }
                      size={24}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${financeSummary.profit >= 0 ? "bg-brand-500/10 text-brand-500" : "bg-red-500/10 text-red-500"}`}
                  >
                    Net Profit
                  </span>
                </div>
                <h3 className="text-slate-400 text-sm font-bold mb-1">
                  Laba Bersih
                </h3>
                <p
                  className={`text-3xl font-mono font-black ${financeSummary.profit >= 0 ? "text-white" : "text-red-400"}`}
                >
                  {financeSummary.profit < 0 && "-"}
                  {formatRupiah(Math.abs(financeSummary.profit))}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className={`w-2 h-2 rounded-full ${financeSummary.profit >= 0 ? "bg-emerald-500" : "bg-red-500"}`}
                  ></div>
                  <p className="text-xs text-slate-500">
                    {financeSummary.profit >= 0
                      ? "Bisnis Sehat / Surplus"
                      : "Defisit Anggaran"}
                  </p>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                  <Activity size={20} className="text-brand-500" />
                  Perbandingan Cashflow
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: "Inflow",
                          amount: financeSummary.revenue,
                          color: "#10b981",
                        },
                        {
                          name: "Outflow",
                          amount: financeSummary.outflow,
                          color: "#ef4444",
                        },
                      ]}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#1e293b"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `Rp ${v / 1000}k`}
                      />
                      <Tooltip
                        cursor={{ fill: "#1e293b", opacity: 0.4 }}
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "1px solid #1e293b",
                          borderRadius: "12px",
                        }}
                        formatter={(v: number) => [formatRupiah(v), "Jumlah"]}
                      />
                      <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={60}>
                        {[0, 1].map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={index === 0 ? "#10b981" : "#ef4444"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                  <Wallet size={20} className="text-brand-500" />
                  Alokasi Pengeluaran
                </h3>
                <div className="h-[300px]">
                  {financeSummary.pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={financeSummary.pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {financeSummary.pieData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                [
                                  "#f97316",
                                  "#3b82f6",
                                  "#8b5cf6",
                                  "#ec4899",
                                  "#10b981",
                                ][index % 5]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "1px solid #1e293b",
                            borderRadius: "12px",
                          }}
                          formatter={(v: number) => [formatRupiah(v), "Total"]}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 italic">
                      <Minus size={48} className="mb-2 opacity-20" />
                      <p>Belum ada data pengeluaran</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Real-time Balance */}
            <div className="bg-brand-900/20 border border-brand-500/30 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-brand-500 rounded-2xl shadow-lg shadow-brand-500/20">
                  <Wallet className="text-white" size={32} />
                </div>
                <div>
                  <h4 className="text-brand-400 font-black uppercase tracking-widest text-xs">
                    Real-time Balance
                  </h4>
                  <p className="text-slate-300 text-sm">
                    Estimasi saldo kas berdasarkan filter aktif
                  </p>
                </div>
              </div>
              <div className="text-center md:text-right">
                <p className="text-4xl font-mono font-black text-white tracking-tighter">
                  {formatRupiah(financeSummary.profit)}
                </p>
                <p className="text-xs text-brand-400 font-bold mt-1 uppercase tracking-widest">
                  Available Cashflow
                </p>
              </div>
            </div>
          </div>
        ) : financeTab === "EXPENSES" ? (
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl">Daftar Pengeluaran</h3>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                  Total Pengeluaran
                </p>
                <p className="text-2xl font-mono text-red-500 font-bold">
                  -
                  {formatRupiah(
                    expenses
                      .filter((e) => !e.isVoided)
                      .reduce((sum, e) => sum + e.amount, 0),
                  )}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              {expenses.length === 0 ? (
                <p className="text-slate-500 italic py-8 text-center">
                  Belum ada data pengeluaran.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-slate-500 border-b border-slate-800">
                    <tr>
                      <th className="pb-4 text-left">Tanggal</th>
                      <th className="pb-4 text-left">Kategori</th>
                      <th className="pb-4 text-left">Sumber</th>
                      <th className="pb-4 text-left">Keterangan</th>
                      <th className="pb-4 text-right">Jumlah</th>
                      <th className="pb-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {[...expenses].reverse().map((exp) => (
                      <tr
                        key={exp.id}
                        className={`${exp.isVoided ? "opacity-40 grayscale" : ""} hover:bg-slate-800/30 transition-colors`}
                      >
                        <td className="py-4 text-slate-400">
                          {new Date(exp.date).toLocaleDateString()}
                        </td>
                        <td className="py-4">
                          <span
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                              exp.category === "PURCHASE"
                                ? "bg-blue-900/30 text-blue-400"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-4 text-xs text-slate-500">
                          {exp.source || "CASH_DRAWER"}
                        </td>
                        <td className="py-4 text-slate-300 font-medium">
                          {exp.description}
                          {exp.transferProof && (
                            <a
                              href={exp.transferProof}
                              target="_blank"
                              rel="noreferrer"
                              className="ml-2 inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 border border-blue-900/50 bg-blue-950/30 px-2 py-0.5 rounded cursor-pointer"
                            >
                              <ImageIcon size={10} /> Lihat Bukti Transfer
                            </a>
                          )}
                        </td>
                        <td className="py-4 text-right font-mono text-red-400 font-bold">
                          -{formatRupiah(exp.amount)}
                        </td>
                        <td className="py-4 text-center">
                          {exp.category === "PURCHASE" && !exp.isVoided && (
                            <button
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  message: `Yakin ingin membatalkan (VOID) pengeluaran "${exp.description}"? Stok dan HPP akan dikembalikan.`,
                                  onConfirm: () => {
                                    const result = voidPurchase(exp.id);
                                    setAlertDialog({
                                      isOpen: true,
                                      message: result.message,
                                      type: result.success
                                        ? "success"
                                        : "error",
                                    });
                                  },
                                });
                              }}
                              className="bg-red-900/30 text-red-500 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-tighter"
                            >
                              VOID
                            </button>
                          )}
                          {exp.isVoided && (
                            <span className="text-[10px] text-red-500 font-black uppercase tracking-tighter border border-red-900/50 px-2 py-1 rounded">
                              VOIDED
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl">Log Audit & Keamanan</h3>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-[10px] text-slate-500 uppercase font-bold">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div> High
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-500 uppercase font-bold">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div> Med
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-500 uppercase font-bold">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div> Low
                </span>
              </div>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              {auditLogs.length === 0 ? (
                <p className="text-slate-500 italic py-8 text-center">
                  Belum ada log audit.
                </p>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-xl border-l-4 bg-slate-950/50 border border-slate-800/50 hover:border-slate-700 transition-colors ${
                      log.severity === "HIGH"
                        ? "border-l-red-500"
                        : log.severity === "MEDIUM"
                          ? "border-l-yellow-500"
                          : "border-l-blue-500"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest ${
                          log.severity === "HIGH"
                            ? "text-red-500"
                            : log.severity === "MEDIUM"
                              ? "text-yellow-500"
                              : "text-blue-500"
                        }`}
                      >
                        {log.action.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mb-2 leading-relaxed">
                      {log.details}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                        {log.user.charAt(0)}
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                        User: {log.user}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const getAISalesSummary = () => {
    const productSalesMap: Record<string, number> = {};
    // Pre-initialize with 0 for all products
    products.forEach(p => {
      productSalesMap[p.name] = 0;
    });

    let totalOrdersCount = 0;
    orders.forEach(o => {
      if (o.status === "COMPLETED" || o.status === "PREPARING" || o.status === "READY") {
        totalOrdersCount++;
        o.items.forEach(item => {
          productSalesMap[item.product.name] = (productSalesMap[item.product.name] || 0) + item.quantity;
        });
      }
    });

    const entries = Object.entries(productSalesMap).sort((a, b) => b[1] - a[1]);
    const topProducts = entries.slice(0, 3).map(([name, qty]) => ({ name, qty }));
    const underperformingProducts = entries.reverse().slice(0, 3).map(([name, qty]) => ({ name, qty }));

    return {
      totalOrders: totalOrdersCount,
      topProducts,
      underperformingProducts
    };
  };

  const handleAnalyzeAiMarketing = async () => {
    setIsAnalyzingAi(true);
    setAiError(null);
    try {
      const salesSummary = getAISalesSummary();
      const response = await fetch("/api/marketing/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promotions: promotions,
          products: products.map(p => ({ name: p.name, category: p.category, price: p.price })),
          salesData: salesSummary,
          recentPerformance: {
            "Total Member Terdaftar": members.length,
            "Total Member Bronze": members.filter(m => m.tier === "BRONZE").length,
            "Total Member Silver": members.filter(m => m.tier === "SILVER").length,
            "Total Member Gold": members.filter(m => m.tier === "GOLD").length,
            "Total Member Platinum": members.filter(m => m.tier === "PLATINUM").length,
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Gagal menghubungi AI Server.");
      }

      const data = await response.json();
      setAiAnalysisResult(data.recommendation);
      setAiSources(data.sources || []);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Gagal melakukan analisis AI.");
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const applyAiRecommendation = (rec: any) => {
    setPromoForm({
      name: rec.campaignName,
      type: (rec.promoType === "PERCENTAGE" || rec.promoType === "FIXED" ? rec.promoType : "PERCENTAGE"),
      value: Number(rec.value) || 10,
      minSpend: Number(rec.minSpend) || 0,
      active: true,
      description: `Rekomendasi AI: ${rec.campaignName} untuk ${rec.targetProduct}. ${rec.durationRecommendation || ""}`,
      startDate: new Date().toISOString().split('T')[0],
      endDate: ""
    });
    setPromoDateMode("ALWAYS");
    setEditingPromoId(null);
    setIsAddingPromo(true);
  };

  const handleGenerateAiForecast = async () => {
    setIsForecastingAi(true);
    setAiForecastError(null);
    try {
      const salesSummaryResult = getAISalesSummary();
      const totalRevenue = orders
        .filter(o => o.status === "COMPLETED")
        .reduce((sum, o) => sum + o.total, 0);

      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

      const response = await fetch("/api/analytics/ai-forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: products.map(p => ({
            name: p.name,
            category: p.category,
            price: p.price,
            cost: p.cost || 0
          })),
          salesSummary: {
            totalOrders: salesSummaryResult.totalOrders,
            totalRevenue: totalRevenue,
            topProducts: salesSummaryResult.topProducts,
            underperformingProducts: salesSummaryResult.underperformingProducts
          },
          financeData: {
            totalExpenses: totalExpenses
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Gagal menghubungi AI Server.");
      }

      const data = await response.json();
      setAiForecastResult(data.forecast);
      setAiForecastSources(data.sources || []);
    } catch (err: any) {
      console.error(err);
      setAiForecastError(err.message || "Gagal memproyeksikan ramalan bisnis AI.");
    } finally {
      setIsForecastingAi(false);
    }
  };

  const renderMarketing = () => (
    <div className="space-y-8 pb-12">
      {/* HEADER SECTION */}
      <header className="flex justify-between items-center bg-slate-900/40 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-3xl font-extrabold text-white flex items-center gap-2 tracking-tight">
            Marketing & Promosi 🎟️
          </h2>
          <p className="text-slate-400 text-sm mt-1">Atur diskon taktis, penjadwalan promo, dan dapatkan rekomendasi promosi berbasis AI.</p>
        </div>
        <button
          onClick={() => {
            setEditingPromoId(null);
            setPromoForm({
              name: "",
              type: "PERCENTAGE",
              value: 0,
              minSpend: 0,
              active: true,
              startDate: "",
              endDate: "",
            });
            setPromoDateMode("ALWAYS");
            setIsAddingPromo(true);
          }}
          className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-950/30"
        >
          <Plus size={18} /> Tambah Promo Baru
        </button>
      </header>

      {/* TWO COLUMNS LAYOUT: LEFT FOR LIST, RIGHT FOR AI ENGINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: ACTIVE VOUCHERS & LIST (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Daftar Promosi Aktif <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-mono">{promotions.length}</span>
            </h3>
          </div>

          <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
            {promotions.map((promo) => {
              const hasDateRange = promo.startDate && promo.endDate && promo.startDate !== promo.endDate;
              const hasSpecificDate = promo.startDate && (!promo.endDate || promo.startDate === promo.endDate);

              return (
                <div
                  key={promo.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-750 p-4 rounded-2xl flex justify-between items-center transition-all shadow-md relative group overflow-hidden"
                >
                  <div className="space-y-1.5 flex-1 pr-4">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="font-extrabold text-base text-white tracking-tight">{promo.name}</h4>
                      <span
                        className={`text-[9px] tracking-widest font-black uppercase px-2 py-0.5 rounded ${
                          promo.active 
                            ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                            : "bg-slate-800 text-slate-500 border border-slate-750"
                        }`}
                      >
                        {promo.active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>

                    <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">{promo.description || "Tidak ada deskripsi singkat."}</p>
                    
                    <div className="flex items-center gap-3 flex-wrap text-slate-500 text-xs">
                      <span className="font-mono font-bold text-orange-400">
                        {promo.type === "PERCENTAGE" ? `${promo.value}%` : formatRupiah(promo.value)} Off
                      </span>
                      <span className="text-slate-700 font-bold">•</span>
                      <span className="font-medium text-slate-400">
                        Min. Spend: <span className="font-mono text-slate-300">{formatRupiah(promo.minSpend || 0)}</span>
                      </span>
                    </div>

                    {/* HAPPY HOUR & DATE VALIDITY BADGES (GACOR DESIGN) */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {promo.happyHourStart && promo.happyHourEnd && (
                        <div className="inline-flex items-center gap-1 bg-blue-950/50 text-blue-400 border border-blue-900/30 text-[10px] px-2 py-0.5 rounded font-bold">
                          <Clock size={10} /> Happy Hour: {promo.happyHourStart} - {promo.happyHourEnd}
                        </div>
                      )}
                      
                      <div className="inline-flex items-center gap-1 bg-slate-950 text-slate-300 text-[10px] px-2 py-0.5 rounded font-bold border border-slate-800">
                        <Calendar size={10} className="text-brand-400" />
                        {hasDateRange && (
                          <span>Berlaku: {promo.startDate} s/d {promo.endDate}</span>
                        )}
                        {hasSpecificDate && (
                          <span>Berlaku Pada: {promo.startDate}</span>
                        )}
                        {!promo.startDate && !promo.endDate && (
                          <span className="text-slate-500">Berlaku Selamanya</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {/* Toggle Activation Button */}
                    <button
                      onClick={() => togglePromotion(promo.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        promo.active 
                          ? "bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white" 
                          : "bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-900/30"
                      }`}
                    >
                      {promo.active ? "Sembunyikan" : "Aktifkan"}
                    </button>

                    {/* Edit Promotion Button */}
                    <button
                      onClick={() => {
                        setPromoForm({
                          name: promo.name,
                          type: promo.type,
                          value: promo.value,
                          minSpend: promo.minSpend,
                          active: promo.active,
                          happyHourStart: promo.happyHourStart,
                          happyHourEnd: promo.happyHourEnd,
                          description: promo.description,
                          startDate: promo.startDate || "",
                          endDate: promo.endDate || "",
                        });
                        setEditingPromoId(promo.id);
                        if (promo.startDate && promo.endDate && promo.startDate !== promo.endDate) {
                          setPromoDateMode("RANGE");
                        } else if (promo.startDate) {
                          setPromoDateMode("SPECIFIC");
                        } else {
                          setPromoDateMode("ALWAYS");
                        }
                        setIsAddingPromo(true);
                      }}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-brand-400 rounded-lg transition-all"
                      title="Edit Promo"
                    >
                      <Edit2 size={16} />
                    </button>

                    {/* Delete Promotion Button */}
                    <button
                      onClick={() => {
                        setConfirmDialog({
                          isOpen: true,
                          message: `Hapus permanent promo '${promo.name}'?`,
                          onConfirm: () => deletePromotion(promo.id),
                        });
                      }}
                      className="p-2 bg-slate-800 hover:bg-red-950 text-red-500 rounded-lg transition-all"
                      title="Hapus Promo"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: CO-PILOT AI PROMO ANALYST (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col min-h-[400px]">
            {/* Pulsing glow background */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-2 mb-4 justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 px-2.5 rounded-full text-xs font-black bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm">AI SYSTEM</span>
                <h3 className="font-extrabold text-lg text-white">Coraq AI Trend Evaluator 🧠</h3>
              </div>
              <Lightbulb size={20} className="text-amber-400 animate-pulse" />
            </div>

            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Mulai pencarian taktis trend FnB viral & FOMO marketing saat ini melalui integrasi model <b>Gemini 3.5 Flash</b> dengan Google Search Grounding. Sistem akan mencocokkan trend eksternal dengan data internal kedai anda untuk merumuskan promo yang paling gacor!
            </p>

            {isAnalyzingAi ? (
              <div className="flex1 flex flex-col justify-center items-center py-12 space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-purple-400 font-black animate-pulse">AI</div>
                </div>
                <div className="text-center space-y-1">
                  <h5 className="font-extrabold text-white text-sm">Sedang Melakukan Evaluasi Taktis...</h5>
                  <p className="text-[10px] text-slate-500 italic max-w-sm">"Gemini sedang membaca database penjualan, mengambil trend FnB sekitar via pencarian Google, dan menyusun copywriting yang relevan..."</p>
                </div>
              </div>
            ) : aiAnalysisResult ? (
              <div className="space-y-6 overflow-y-auto max-h-[550px] pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                
                {/* 1. Market Trend & Sentiment */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[9px] tracking-wider font-extrabold text-indigo-400 uppercase">1. Sentimen & Trend Market Terkini</span>
                  <p className="text-slate-300 text-xs leading-relaxed">{aiAnalysisResult.marketTrendSentiment}</p>
                </div>

                {/* 2. Internal Evaluation */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[9px] tracking-wider font-extrabold text-purple-400 uppercase">2. Evaluasi Sektor Penjualan Internal</span>
                  <p className="text-slate-300 text-xs leading-relaxed">{aiAnalysisResult.internalEvaluation}</p>
                </div>

                {/* 3. Recommended Campaigns */}
                <div className="space-y-3">
                  <span className="text-[9px] tracking-wider font-extrabold text-emerald-400 uppercase block">3. Rekomendasi Promo FOMO Unggulan</span>
                  
                  {aiAnalysisResult.recommendedCampaigns?.map((rec: any, idx: number) => (
                    <div key={idx} className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 p-4 rounded-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 py-0.5 px-2 bg-emerald-900/40 text-emerald-400 text-[8px] font-black tracking-widest uppercase rounded-bl">RECOMMENDED</div>
                      
                      <h4 className="font-extrabold text-sm text-white">{rec.campaignName}</h4>
                      <p className="text-slate-400 text-[11px] mt-1 italic leading-relaxed">TARGET: <b className="text-slate-200">{rec.targetProduct}</b></p>
                      
                      {/* Promo Spec pills */}
                      <div className="flex gap-2 mt-2 flex-wrap text-[10px] font-bold">
                        <span className="bg-orange-950/40 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded">
                          Diskon: {rec.promoType === "PERCENTAGE" ? `${rec.value}%` : `POTONGAN ${formatRupiah(rec.value)}`}
                        </span>
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                          Min Spend: {formatRupiah(rec.minSpend || 0)}
                        </span>
                      </div>

                      <p className="text-slate-400 text-[11px] mt-2 leading-relaxed">
                        <b>Strategis:</b> {rec.strategicReason}
                      </p>

                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-850 mt-3 space-y-1">
                        <span className="text-[8px] uppercase tracking-widest font-black text-slate-500">IG/WA Copywriting Hook:</span>
                        <p className="text-slate-300 text-[10px] italic leading-normal font-sans">"{rec.copywritingSocialMedia}"</p>
                      </div>

                      <button
                        onClick={() => applyAiRecommendation(rec)}
                        className="w-full mt-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        Terapkan Promo Ini Langsung ⚡
                      </button>
                    </div>
                  ))}
                </div>

                {/* Sources / Citations */}
                {aiSources.length > 0 && (
                  <div className="pt-3 border-t border-slate-850 space-y-1.5">
                    <span className="text-[9px] tracking-wider font-extrabold text-slate-500 uppercase block">Referensi URL pencarian Grounding:</span>
                    <div className="flex flex-col gap-1">
                      {aiSources.map((src, idx) => (
                        <a
                          key={idx}
                          href={src.uri}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1 line-clamp-1 truncate"
                        >
                          🔗 {src.title || src.uri}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reset button to run analysis again */}
                <button
                  onClick={handleAnalyzeAiMarketing}
                  className="w-full mt-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5"
                >
                  <RefreshCcw size={12} /> Jalankan Ulang Analisis AI
                </button>

              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center py-8 space-y-4">
                <div className="w-16 h-16 bg-slate-850 rounded-full flex items-center justify-center text-slate-500">
                  <Lightbulb size={28} />
                </div>
                <div className="text-center max-w-xs space-y-4">
                  <p className="text-xs text-slate-400">Belum ada data evaluasi. Klik tombol di bawah ini untuk mengaktifkan AI Evaluator.</p>
                  
                  {aiError && (
                    <div className="p-3 bg-red-950/40 border border-red-900/30 rounded-xl text-red-400 text-[10px] leading-relaxed text-left">
                      🚨 <b>Error:</b> {aiError}
                    </div>
                  )}

                  <button
                    onClick={handleAnalyzeAiMarketing}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-950/50 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    Mulai AI Analisis Taktis & Trend ⚡
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );

  const handleFaceEnrolled = (descriptor: number[]) => {
    if (enrollingFaceUserId) {
      updateUserFace(enrollingFaceUserId, descriptor);
      setEnrollingFaceUserId(null);
      setAlertDialog({
        isOpen: true,
        message: "Wajah berhasil didaftarkan!",
        type: "success",
      });
    }
  };

  const renderStaff = () => (
    <div className="space-y-6">
      {enrollingFaceUserId && (
        <FaceScanner
          onFaceDetected={handleFaceEnrolled}
          onCancel={() => setEnrollingFaceUserId(null)}
          title="Daftarkan Wajah"
        />
      )}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Pegawai / Staff</h2>
          <p className="text-slate-400">
            Atur akun akses dan pantau kehadiran karyawan.
          </p>
        </div>
        {staffTab === "ACCOUNTS" && (
          <button
            onClick={() => handleOpenStaffModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
          >
            <Plus size={18} /> Tambah Pegawai
          </button>
        )}
      </header>

      {/* Sub Tabs */}
      <div className="flex gap-4 border-b border-slate-800 mb-6">
        <button
          onClick={() => setStaffTab("ACCOUNTS")}
          className={`pb-3 px-2 font-bold text-sm transition-colors border-b-2 ${staffTab === "ACCOUNTS" ? "border-brand-500 text-brand-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}
        >
          Akun Pegawai
        </button>
        <button
          onClick={() => setStaffTab("ATTENDANCE")}
          className={`pb-3 px-2 font-bold text-sm transition-colors border-b-2 ${staffTab === "ATTENDANCE" ? "border-brand-500 text-brand-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}
        >
          Riwayat Absensi
        </button>
      </div>

      {staffTab === "ACCOUNTS" ? (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-bold">
              <tr>
                <th className="p-4 w-20">Foto</th>
                <th className="p-4">Nama Pegawai</th>
                <th className="p-4">Role / Posisi</th>
                <th className="p-4">Kontak</th>
                <th className="p-4">PIN Akses</th>
                <th className="p-4">Face ID</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/50">
                  <td className="p-4">
                    <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border border-slate-600">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                          {user.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-white">{user.name}</td>
                  <td className="p-4">
                    <span
                      className={`text-xs px-2 py-1 rounded font-bold ${
                        user.role === Role.ADMIN
                          ? "bg-red-900/30 text-red-400"
                          : user.role === Role.MANAGER
                            ? "bg-purple-900/30 text-purple-400"
                            : user.role === Role.CASHIER
                              ? "bg-green-900/30 text-green-400"
                              : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-400">
                    {user.phone || "-"}
                  </td>
                  <td className="p-4 font-mono text-slate-500">******</td>
                  <td className="p-4">
                    {user.faceDescriptor ? (
                      <span className="text-green-500 flex items-center gap-1 text-xs">
                        <CheckCircle size={12} /> Terdaftar
                      </span>
                    ) : (
                      <span className="text-slate-500 text-xs">Belum Ada</span>
                    )}
                  </td>
                  <td className="p-4 flex gap-2">
                    <button
                      onClick={() => setEnrollingFaceUserId(user.id)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-brand-400 rounded"
                      title="Daftarkan Wajah"
                    >
                      <ScanFace size={16} />
                    </button>
                    <button
                      onClick={() => handleOpenStaffModal(user)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setConfirmDialog({
                          isOpen: true,
                          message: `Hapus pegawai ${user.name}?`,
                          onConfirm: () => deleteUser(user.id),
                        });
                      }}
                      className="p-2 bg-slate-800 hover:bg-red-900/30 text-red-500 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-end bg-slate-900 p-4 rounded-xl border border-slate-800">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Filter Pegawai
              </label>
              <select
                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-brand-500"
                value={attendanceUserFilter}
                onChange={(e) => setAttendanceUserFilter(e.target.value)}
              >
                <option value="ALL">Semua Pegawai</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Filter Bulan
              </label>
              <select
                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-brand-500"
                value={attendanceMonthFilter}
                onChange={(e) => setAttendanceMonthFilter(e.target.value)}
              >
                <option value="ALL">Semua Bulan</option>
                {availableMonths.map((m) => {
                  const [year, month] = m.split("-");
                  const date = new Date(parseInt(year), parseInt(month) - 1);
                  const monthName = date.toLocaleString("id-ID", {
                    month: "long",
                    year: "numeric",
                  });
                  return (
                    <option key={m} value={m}>
                      {monthName}
                    </option>
                  );
                })}
              </select>
            </div>
            {attendanceUserFilter !== "ALL" && (
              <div className="bg-emerald-900/20 border border-emerald-900/50 p-3 rounded-xl flex items-center gap-3 min-w-[200px]">
                <div className="w-10 h-10 bg-emerald-900/50 rounded-full flex items-center justify-center text-emerald-400">
                  <ClipboardCheck size={20} />
                </div>
                <div>
                  <div className="text-[10px] text-emerald-400 font-bold uppercase">
                    Total Kehadiran
                  </div>
                  <div className="text-xl font-bold text-white">
                    {totalDaysAttended} Hari
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-bold">
                <tr>
                  <th className="p-4">Waktu</th>
                  <th className="p-4">Nama Pegawai</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Aktivitas</th>
                  <th className="p-4">Metode Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredAttendanceLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Belum ada data absensi.
                    </td>
                  </tr>
                ) : (
                  [...filteredAttendanceLogs].reverse().map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/50">
                      <td className="p-4 text-sm text-slate-300">
                        {new Date(log.timestamp).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-4 font-bold text-white">
                        {log.userName}
                      </td>
                      <td className="p-4 text-sm text-slate-400">{log.role}</td>
                      <td className="p-4">
                        <span
                          className={`text-xs px-2 py-1 rounded font-bold ${
                            log.type === "CLOCK_IN"
                              ? "bg-green-900/30 text-green-400"
                              : "bg-red-900/30 text-red-400"
                          }`}
                        >
                          {log.type === "CLOCK_IN"
                            ? "MASUK (Clock In)"
                            : "KELUAR (Clock Out)"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-xs px-2 py-1 rounded font-bold flex items-center gap-1 w-fit ${
                            log.method === "FACE"
                              ? "bg-blue-900/30 text-blue-400"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {log.method === "FACE" ? (
                            <ScanFace size={12} />
                          ) : (
                            <IdCard size={12} />
                          )}
                          {log.method === "FACE" ? "Wajah (Face ID)" : "PIN"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderMembers = () => {
    const selectedMember = members.find((m) => m.id === selectedMemberId);

    // Age and Zodiac Calculator Helpers
    const getZodiacSign = (dateStr?: string) => {
      if (!dateStr) return { name: "Belum diatur", icon: "❓" };
      try {
        const parts = dateStr.split("-");
        if (parts.length !== 3) return { name: "Belum diatur", icon: "❓" };
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);

        if ((month === 1 && day >= 20) || (month === 2 && day <= 18))
          return { name: "Aquarius", icon: "♒" };
        if ((month === 2 && day >= 19) || (month === 3 && day <= 20))
          return { name: "Pisces", icon: "♓" };
        if ((month === 3 && day >= 21) || (month === 4 && day <= 19))
          return { name: "Aries", icon: "♈" };
        if ((month === 4 && day >= 20) || (month === 5 && day <= 20))
          return { name: "Taurus", icon: "♉" };
        if ((month === 5 && day >= 21) || (month === 6 && day <= 20))
          return { name: "Gemini", icon: "♊" };
        if ((month === 6 && day >= 21) || (month === 7 && day <= 22))
          return { name: "Cancer", icon: "♋" };
        if ((month === 7 && day >= 23) || (month === 8 && day <= 22))
          return { name: "Leo", icon: "♌" };
        if ((month === 8 && day >= 23) || (month === 9 && day <= 22))
          return { name: "Virgo", icon: "♍" };
        if ((month === 9 && day >= 23) || (month === 10 && day <= 22))
          return { name: "Libra", icon: "♎" };
        if ((month === 10 && day >= 23) || (month === 11 && day <= 21))
          return { name: "Scorpio", icon: "♏" };
        if ((month === 11 && day >= 22) || (month === 12 && day <= 21))
          return { name: "Sagittarius", icon: "♐" };
        return { name: "Capricorn", icon: "♑" };
      } catch (e) {
        return { name: "Belum diatur", icon: "❓" };
      }
    };

    const getAge = (dateStr?: string) => {
      if (!dateStr) return null;
      try {
        const birth = new Date(dateStr);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        return age;
      } catch (e) {
        return null;
      }
    };

    // Calculate metrics for Loyalty KPIs
    const totalMembers = members.length;
    const totalSpendingSum = members.reduce(
      (sum, m) => sum + m.totalSpending,
      0,
    );
    const avgCLV =
      totalMembers > 0 ? Math.round(totalSpendingSum / totalMembers) : 0;
    const bronzeCount = members.filter((m) => m.tier === Tier.BRONZE).length;
    const silverCount = members.filter((m) => m.tier === Tier.SILVER).length;
    const goldCount = members.filter((m) => m.tier === Tier.GOLD).length;
    const platinumCount = members.filter(
      (m) => m.tier === Tier.PLATINUM,
    ).length;

    // Filter members list based on state
    const filteredMembers = members.filter((member) => {
      const q = memberSearchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (member.fullName || "").toLowerCase().includes(q) ||
        (member.nickname || "").toLowerCase().includes(q) ||
        (member.name || "").toLowerCase().includes(q) ||
        (member.phone || "").includes(q) ||
        (member.id || "").toLowerCase().includes(q);

      const matchTier =
        memberTierFilter === "ALL" || member.tier === memberTierFilter;
      const matchStatus =
        memberStatusFilter === "ALL" || member.status === memberStatusFilter;

      let matchMonth = true;
      if (memberBirthMonthFilter !== "ALL" && member.birthDate) {
        const parts = member.birthDate.split("-");
        if (parts.length === 3) {
          matchMonth = parts[1] === memberBirthMonthFilter;
        } else {
          matchMonth = false;
        }
      } else if (memberBirthMonthFilter !== "ALL" && !member.birthDate) {
        matchMonth = false;
      }

      return matchSearch && matchTier && matchStatus && matchMonth;
    });

    const generate6DigitPin = () => {
      return Math.floor(100000 + Math.random() * 900000).toString();
    };

    // Find favorite item for member
    const getFavoriteItem = (memberId: string) => {
      const memberOrders = orders.filter(
        (o) => o.memberId === memberId && o.status === OrderStatus.COMPLETED,
      );
      const itemCounts: Record<string, number> = {};
      memberOrders.forEach((order) => {
        order.items.forEach((item) => {
          itemCounts[item.product.name] =
            (itemCounts[item.product.name] || 0) + item.quantity;
        });
      });
      const favorites = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]);
      return favorites.length > 0 ? favorites[0][0] : "Belum ada data";
    };

    return (
      <div className="space-y-6">
        <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-2">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white font-sans">
              Loyalty & CRM Management
            </h2>
            <p className="text-slate-400 text-sm">
              Kelola data pelanggan, zodiak ultah, override tier VIP, dan
              koordinasi kartu member fisik.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportContactsVCF}
              className="bg-slate-800 hover:bg-slate-700 hover:border-slate-650 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-755 flex items-center justify-center gap-2 transition-all active:scale-95 shadow"
              title="Download file .vcf untuk langsung di-import ke Kontak Tablet Android"
            >
              <Download size={14} className="text-brand-400" /> Export Kontak (Android VCF)
            </button>
            <button
              onClick={handleExportContactsCSV}
              className="bg-slate-800 hover:bg-slate-700 hover:border-slate-650 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-755 flex items-center justify-center gap-2 transition-all active:scale-95 shadow"
              title="Download file .csv untuk import lewat Google Contacts Web"
            >
              <Download size={14} className="text-pink-400" /> Export CSV
            </button>
            <button
              onClick={() => setShowAddMemberModalAdmin(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-950/20"
            >
              <Plus size={14} /> Tambah Member Baru
            </button>
          </div>
        </header>

        {/* CRM METRICS PANELS (KPI CARDS) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-850">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
              Total Registrasi
            </div>
            <div className="text-2xl font-black text-white">
              {totalMembers}{" "}
              <span className="text-xs font-normal text-slate-500">orang</span>
            </div>
            <div className="text-[10px] text-emerald-500 font-medium mt-1">
              ● Basis customer tercatat
            </div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-850">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
              Nilai Ratarata (CLV)
            </div>
            <div className="text-xl font-black text-white">
              {formatRupiah(avgCLV)}
            </div>
            <div className="text-[10px] text-slate-400 font-regular mt-1">
              Rata-rata spending per member
            </div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-850">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
              Distribusi Tier VIP
            </div>
            <div className="flex gap-2 items-center mt-1">
              <span className="text-xs font-bold text-orange-400" title="Bronze">
                {bronzeCount}B
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-bold text-slate-300" title="Silver">
                {silverCount}S
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-bold text-yellow-500" title="Gold">
                {goldCount}G
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-bold text-purple-400" title="Platinum">
                {platinumCount}P
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-regular mt-1">
              Ratio loyalitas berjenjang
            </div>
          </div>

          <button
            onClick={() => {
              setMemberBirthMonthFilter(
                String(new Date().getMonth() + 1).padStart(2, "0")
              );
              setMemberSearchQuery("");
              setMemberTierFilter("ALL");
            }}
            className="bg-pink-950/20 hover:bg-pink-950/30 text-left p-4 rounded-2xl border border-pink-900/30 transition-all group relative overflow-hidden"
          >
            <div className="absolute right-3 top-3 text-pink-500/20 group-hover:scale-110 group-hover:text-pink-500/30 transition-all">
              <Gift size={32} />
            </div>
            <div className="text-[10px] text-pink-400 font-bold uppercase tracking-wider mb-1">
              Ultah Bulan Ini
            </div>
            <div className="text-2xl font-black text-pink-300">
              {
                members.filter((m) => {
                  if (!m.birthDate) return false;
                  const birthMonth = m.birthDate.split("-")[1];
                  return (
                    birthMonth ===
                    String(new Date().getMonth() + 1).padStart(2, "0")
                  );
                }).length
              }{" "}
              <span className="text-xs font-normal text-pink-400/60">orang</span>
            </div>
            <div className="text-[9px] text-pink-400 mt-1 underline">
              Klik untuk filter cepat bulan ini
            </div>
          </button>
        </div>

        {/* ADVANCED SEACH, FILTER & CAMPAIGN CONTROLLER */}
        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Cari member berdasarkan Nama, No HP, ID..."
              value={memberSearchQuery}
              onChange={(e) => setMemberSearchQuery(e.target.value)}
              className="w-full bg-slate-950 text-white pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm font-medium"
            />
            {memberSearchQuery && (
              <button
                onClick={() => setMemberSearchQuery("")}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={memberTierFilter}
              onChange={(e) => setMemberTierFilter(e.target.value as any)}
              className="bg-slate-950 text-slate-300 text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">Semua Tier VIP</option>
              <option value={Tier.BRONZE}>Tier BRONZE</option>
              <option value={Tier.SILVER}>Tier SILVER</option>
              <option value={Tier.GOLD}>Tier GOLD</option>
              <option value={Tier.PLATINUM}>Tier PLATINUM</option>
            </select>

            <select
              value={memberStatusFilter}
              onChange={(e) => setMemberStatusFilter(e.target.value as any)}
              className="bg-slate-950 text-slate-300 text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Status Aktif</option>
              <option value="PENDING">Pending Approval</option>
              <option value="PENDING_CARD">Butuh Bind Kartu</option>
            </select>

            <select
              value={memberBirthMonthFilter}
              onChange={(e) => setMemberBirthMonthFilter(e.target.value)}
              className="bg-slate-950 text-slate-300 text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">Semua Bulan Lahir</option>
              <option value="01">Januari</option>
              <option value="02">Februari</option>
              <option value="03">Maret</option>
              <option value="04">April</option>
              <option value="05">Mei</option>
              <option value="06">Juni</option>
              <option value="07">Juli</option>
              <option value="08">Agustus</option>
              <option value="09">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>

            {(memberSearchQuery ||
              memberTierFilter !== "ALL" ||
              memberStatusFilter !== "ALL" ||
              memberBirthMonthFilter !== "ALL") && (
              <button
                onClick={() => {
                  setMemberSearchQuery("");
                  setMemberTierFilter("ALL");
                  setMemberStatusFilter("ALL");
                  setMemberBirthMonthFilter("ALL");
                }}
                className="p-3 bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center"
                title="Reset Filter"
              >
                <RefreshCcw size={14} />
              </button>
            )}
          </div>
        </div>

        {/* CRM INTEL & CAMPAIGNS PANEL (BIRTHDAYS + DORMANT MEMBERS) */}
        {(todayBirthdayMembers.length > 0 || dormantMembers.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-2">
            {/* BIRTHDAY PANEL */}
            {todayBirthdayMembers.length > 0 ? (
              <div className="bg-gradient-to-br from-pink-950/20 via-slate-900 to-purple-950/10 border border-pink-900/30 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-pink-400 font-extrabold mb-2">
                    <Gift size={20} className="animate-pulse" />
                    <h3 className="font-extrabold text-sm tracking-tight uppercase text-pink-300">
                      MEMBER ULTAH HARI INI 🎂
                    </h3>
                  </div>
                  <p className="text-slate-400 text-xs mb-4 leading-relaxed">
                    Berikan ucapan selamat ulang tahun plus kode promo khusus dari database marketing untuk mengapresiasi loyalitas mereka.
                  </p>
                  
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {todayBirthdayMembers.map((member) => (
                      <div
                        key={member.id}
                        className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 hover:border-pink-900/40 transition-all"
                      >
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            <span>{member.fullName}</span>
                            <span className="text-[9px] bg-pink-950/60 text-pink-400 border border-pink-900/40 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                              {member.tier}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            {member.phone}
                          </div>
                        </div>
                        <button
                          onClick={() => handleOpenOutreach(member, "BIRTHDAY")}
                          className="px-3.5 py-1.5 bg-pink-600 hover:bg-pink-500 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow"
                        >
                          <MessageSquare size={13} /> Kirim Promo Ultah
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/20 border border-slate-800/60 p-5 rounded-2xl flex flex-col justify-center items-center text-center text-slate-500 min-h-[160px]">
                <Gift size={32} className="text-slate-700 mb-2" />
                <p className="text-xs font-semibold">Tidak ada member yang berulang tahun hari ini.</p>
              </div>
            )}

            {/* DORMANT MEMBERS PANEL */}
            {dormantMembers.length > 0 ? (
              <div className="bg-gradient-to-br from-amber-950/10 via-slate-900 to-slate-900 border border-amber-900/30 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-amber-400 font-extrabold mb-2">
                    <Clock size={20} className="text-amber-500" />
                    <h3 className="font-extrabold text-sm tracking-tight uppercase text-amber-300">
                      BUTUH RETENSI (LAMA TIDAK BERKUNJUNG) 💤
                    </h3>
                  </div>
                  <p className="text-slate-400 text-xs mb-4 leading-relaxed">
                    Pelanggan yang sudah lebih dari 30 hari tidak berkunjung ke Coraq Coffee. Kirimi sapaan hangat dan diskon pemicu kunjungan!
                  </p>
                  
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {dormantMembers.map((member) => {
                      const refDateStr = member.lastVisit || member.joinDate;
                      let absentDays = 30;
                      let relativeTimeString = "30+ hari lalu";
                      if (refDateStr) {
                        const refDate = new Date(refDateStr);
                        const today = new Date();
                        const diffTime = Math.abs(today.getTime() - refDate.getTime());
                        absentDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        relativeTimeString = `${absentDays} hari yang lalu`;
                      }

                      return (
                        <div
                          key={member.id}
                          className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 hover:border-amber-900/40 transition-all"
                        >
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              <span>{member.fullName}</span>
                              <span className="text-[9px] bg-amber-950/50 text-amber-400 border border-amber-900/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                {member.tier}
                              </span>
                            </div>
                            <div className="text-xs text-amber-400/85 mt-0.5 font-medium flex items-center gap-1">
                              <span>Terakhir: {relativeTimeString}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleOpenOutreach(member, "DORMANT")}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow"
                          >
                            <MessageSquare size={13} /> Sapa & Sodor Promo
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/20 border border-slate-800/60 p-5 rounded-2xl flex flex-col justify-center items-center text-center text-slate-500 min-h-[160px]">
                <Clock size={32} className="text-slate-700 mb-2" />
                <p className="text-xs font-semibold">Semua member Anda aktif berkunjung baru-baru ini!</p>
              </div>
            )}
          </div>
        )}

        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
          <table className="w-full text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Nama Member / ID</th>
                <th className="p-4">No. HP</th>
                <th className="p-4 text-center">PIN</th>
                <th className="p-4">Info Lahir & Zodiak</th>
                <th className="p-4 text-center">Tier & Poin</th>
                <th className="p-4 text-right">Total Spending</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredMembers.map((member) => {
                const age = getAge(member.birthDate);
                const zodiac = getZodiacSign(member.birthDate);

                return (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-800/20 transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedMemberId(member.id)}
                          className="w-11 h-11 rounded-xl overflow-hidden bg-slate-850 border border-slate-700/80 hover:border-brand-500 transition-all group relative"
                          title="Klik untuk detail member"
                        >
                          {member.photo ? (
                            <img
                              src={member.photo}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500 group-hover:bg-slate-750 transition-colors">
                              <UserIcon size={18} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-brand-500/0 group-hover:bg-brand-500/20 transition-colors" />
                        </button>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5 leading-tight">
                            <span 
                              onClick={() => setSelectedMemberId(member.id)}
                              className="cursor-pointer hover:text-brand-400 transition-colors"
                            >
                              {member.fullName || member.name}
                            </span>
                            {member.nickname && (
                              <span className="text-xs text-slate-400 font-medium font-sans">
                                ({member.nickname})
                              </span>
                            )}
                            {member.tier === Tier.PLATINUM && (
                              <div className="bg-purple-950 border border-purple-800 p-0.5 rounded-full">
                                <Trophy size={10} className="text-purple-400" />
                              </div>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono tracking-wider mt-0.5">
                            ID: {member.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300 font-mono text-sm">
                      {member.phone}
                    </td>
                    <td className="p-4 text-slate-400 text-center font-mono text-sm font-bold tracking-widest">
                      {member.pin || "123456"}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        {member.birthDate ? (
                          <>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-300 font-medium">
                                {new Date(member.birthDate).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                              {age !== null && (
                                <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-1 py-0.2 rounded">
                                  {age} th
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-brand-400 font-semibold uppercase tracking-tight">
                              <span>{zodiac.icon}</span>
                              <span>{zodiac.name}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-500 lowercase font-medium font-sans">
                                {member.gender === "FEMALE" ? "perempuan" : "laki-laki"}
                              </span>
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-slate-600 italic">Belum diatur</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-black tracking-tighter ${
                            member.tier === Tier.PLATINUM
                              ? "bg-gradient-to-r from-purple-900/40 to-indigo-900/40 text-indigo-300 border border-indigo-800/40"
                              : member.tier === Tier.GOLD
                                ? "bg-gradient-to-r from-yellow-900/40 to-amber-950/40 text-amber-400 border border-amber-800/40"
                                : member.tier === Tier.SILVER
                                  ? "bg-slate-800 text-slate-300 border border-slate-700"
                                  : "bg-orange-950/20 text-orange-400 border border-orange-900/30"
                          }`}
                        >
                          {member.tier}
                        </span>
                        <span className="text-[10px] text-pink-400/80 font-mono font-bold">
                          {member.points} pts
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-white text-right font-semibold">
                      {formatRupiah(member.totalSpending)}
                    </td>
                    <td className="p-4 text-center">
                      {member.status === MemberStatus.PENDING_CARD ? (
                        <span className="text-yellow-500 bg-yellow-950/35 border border-yellow-905/30 px-2 py-1 rounded-lg inline-flex items-center gap-1 text-[10px] font-bold uppercase">
                          <QrCode size={11} /> Bind Card
                        </span>
                      ) : member.status === MemberStatus.PENDING ? (
                        <button
                          onClick={() => approveMember(member.id)}
                          className="bg-green-600 hover:bg-green-500 text-white text-[10px] px-3 py-1 rounded-lg font-black tracking-tight"
                        >
                          APPROVE
                        </button>
                      ) : (
                        <span className="text-emerald-500 bg-emerald-950/25 border border-emerald-950/30 px-2 py-1 rounded-lg inline-flex items-center gap-1 text-[10px] font-bold uppercase">
                          <CheckCircle size={11} /> Active
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setBindingMemberId(member.id);
                            setIsAdminQRScannerOpen(true);
                          }}
                          title="Bind Kartu Fisik QR/NFC"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-brand-500/20 text-slate-400 hover:text-brand-400 border border-slate-700 transition-all active:scale-90"
                        >
                          <IdCard size={14} />
                        </button>
                        <button
                          onClick={() => startEditMember(member)}
                          title="Edit Profile Lengkap"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 border border-slate-700 transition-all active:scale-90"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              message: `Hapus member ${member.fullName || member.name}? Semua data loyalty, spending log, dan poin akan di-wipe permanen!`,
                              onConfirm: () => deleteMember(member.id),
                            });
                          }}
                          title="Hapus Member"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 transition-all active:scale-90"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* MEMBER PROFILE MODAL */}
        {selectedMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedMemberId(null)}
            />
            <div className="relative bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-800 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              {/* Header Card Visual */}
              <div
                className={`p-8 relative overflow-hidden ${
                  selectedMember.tier === Tier.PLATINUM
                    ? "bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950"
                    : selectedMember.tier === Tier.GOLD
                      ? "bg-gradient-to-br from-yellow-950 via-slate-900 to-amber-950"
                      : selectedMember.tier === Tier.SILVER
                        ? "bg-slate-800"
                        : "bg-slate-900 border-b border-slate-800"
                }`}
              >
                {/* Background Accents */}
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Coffee
                    size={200}
                    className="rotate-12 translate-x-1/2 -translate-y-1/2"
                  />
                </div>

                <button
                  onClick={() => setSelectedMemberId(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/20 text-white/60 hover:text-white hover:bg-black/40 transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="flex items-center gap-6 relative z-10">
                  <div
                    className={`w-24 h-24 rounded-2xl overflow-hidden border-4 ${
                      selectedMember.tier === Tier.PLATINUM
                        ? "border-indigo-500/50 shadow-lg shadow-indigo-500/20"
                        : selectedMember.tier === Tier.GOLD
                          ? "border-yellow-500/50 shadow-lg shadow-yellow-500/20"
                          : "border-slate-700 shadow-xl"
                    }`}
                  >
                    {selectedMember.photo ? (
                      <img
                        src={selectedMember.photo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                        <UserIcon size={40} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm ${
                          selectedMember.tier === Tier.PLATINUM
                            ? "bg-indigo-500 text-white"
                            : selectedMember.tier === Tier.GOLD
                              ? "bg-yellow-500 text-black"
                              : selectedMember.tier === Tier.SILVER
                                ? "bg-slate-600 text-white"
                                : "bg-orange-700 text-white"
                        }`}
                      >
                        {selectedMember.tier} MEMBER
                      </span>
                      <span className="text-[10px] bg-white/10 text-white/60 px-2 py-0.5 rounded font-mono">
                        ID: {selectedMember.id}
                      </span>
                    </div>
                    <h3 className="text-3xl font-black text-white leading-tight">
                      {selectedMember.name}
                    </h3>
                    <p className="text-slate-400 font-medium">
                      {selectedMember.phone}
                    </p>
                  </div>
                </div>

                {/* Stats Grid Overlay */}
                <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
                  <div className="bg-black/30 backdrop-blur-md p-4 rounded-2xl border border-white/5">
                    <div className="text-[10px] text-white/50 uppercase font-bold mb-1">
                      Total Points
                    </div>
                    <div className="text-2xl font-black text-pink-500">
                      {selectedMember.points.toLocaleString()}{" "}
                      <span className="text-xs font-normal opacity-60">
                        pts
                      </span>
                    </div>
                  </div>
                  <div className="bg-black/30 backdrop-blur-md p-4 rounded-2xl border border-white/5">
                    <div className="text-[10px] text-white/50 uppercase font-bold mb-1">
                      Total Spending
                    </div>
                    <div className="text-2xl font-black text-white">
                      {formatRupiah(selectedMember.totalSpending)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Sections */}
              <div className="p-8">
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                      Member Info
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Clock size={14} className="text-slate-500" />
                        <span>
                          Bergabung:{" "}
                          {new Date(selectedMember.joinDate).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "long", year: "numeric" },
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Gift size={14} className="text-slate-500" />
                        <span>
                          Ultah:{" "}
                          {selectedMember.birthDate
                            ? new Date(
                                selectedMember.birthDate,
                              ).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                              })
                            : "Tidak ada data"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                      Insight
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Coffee size={14} className="text-brand-500" />
                      <div>
                        <span className="opacity-60 block text-[10px] font-bold">
                          Item Favorit
                        </span>
                        <span className="font-bold">
                          {getFavoriteItem(selectedMember.id)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next Tier Progress */}
                {selectedMember.tier !== Tier.PLATINUM && (
                  <div className="mb-8">
                    <div className="flex justify-between items-end mb-2">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Upgrade to{" "}
                        {selectedMember.tier === Tier.BRONZE
                          ? "SILVER"
                          : selectedMember.tier === Tier.SILVER
                            ? "GOLD"
                            : "PLATINUM"}
                      </h4>
                      <span className="text-xs font-bold text-slate-400">
                        {formatRupiah(
                          TIER_RULES[
                            selectedMember.tier === Tier.BRONZE
                              ? Tier.SILVER
                              : selectedMember.tier === Tier.SILVER
                                ? Tier.GOLD
                                : Tier.PLATINUM
                          ].threshold - selectedMember.totalSpending,
                        )}{" "}
                        more
                      </span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                      <div
                        className="h-full bg-brand-500 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.5)] transition-all duration-1000"
                        style={{
                          width: `${Math.min(
                            100,
                            (selectedMember.totalSpending /
                              TIER_RULES[
                                selectedMember.tier === Tier.BRONZE
                                  ? Tier.SILVER
                                  : selectedMember.tier === Tier.SILVER
                                    ? Tier.GOLD
                                    : Tier.PLATINUM
                              ].threshold) *
                              100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Quick Transaction History (5 items) */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Clock size={14} /> 5 Transaksi Terakhir
                    </h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMemberHistoryOpen(true);
                      }}
                      className="text-[10px] font-black text-brand-400 hover:text-brand-300 uppercase underline decoration-2 underline-offset-4"
                    >
                      Lihat Semua
                    </button>
                  </div>

                  <div className="space-y-2">
                    {orders
                      .filter((o) => o.memberId === selectedMember.id)
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime(),
                      )
                      .slice(0, 5)
                      .map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-3 bg-slate-850 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors group"
                        >
                          <div>
                            <div className="text-xs font-bold text-white mb-0.5">
                              {order.customerName} -{" "}
                              {order.pagerNumber !== "0"
                                ? `Pager ${order.pagerNumber}`
                                : "Dine-in"}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {new Date(order.createdAt).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "2-digit",
                                },
                              )}{" "}
                              •{" "}
                              {new Date(order.createdAt).toLocaleTimeString(
                                "id-ID",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-black text-white">
                              {formatRupiah(order.finalAmount)}
                            </div>
                            <div
                              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded inline-block ${
                                order.status === OrderStatus.COMPLETED
                                  ? "bg-emerald-900/30 text-emerald-500"
                                  : order.status === OrderStatus.CANCELLED
                                    ? "bg-red-900/30 text-red-500"
                                    : "bg-blue-900/30 text-blue-500"
                              }`}
                            >
                              {order.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    {orders.filter((o) => o.memberId === selectedMember.id)
                      .length === 0 && (
                      <div className="text-center py-8 text-slate-500 italic text-sm">
                        Belum ada riwayat transaksi.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedMemberId(null)}
                  className="px-6 py-2 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FULL MEMBER HISTORY MODAL */}
        {isMemberHistoryOpen && selectedMember && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setIsMemberHistoryOpen(false)}
            />
            <div className="relative bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl border border-slate-700 flex flex-col overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
              {/* Modal Header */}
              <header className="p-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
                <div>
                  <div className="text-[10px] text-brand-500 font-black uppercase tracking-widest mb-1">
                    Transaction Archive
                  </div>
                  <h3 className="text-2xl font-black text-white">
                    Riwayat Transaksi: {selectedMember.name}
                  </h3>
                </div>
                <button
                  onClick={() => setIsMemberHistoryOpen(false)}
                  className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </header>

              {/* Filters Row */}
              <div className="p-6 bg-slate-850 border-b border-white/5 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[10px] text-slate-500 font-black uppercase mr-2">
                    Cepat:
                  </span>
                  {[
                    { id: "ALL", label: "Semua" },
                    { id: "7_DAYS", label: "7 Hari Terakhir" },
                    { id: "THIS_MONTH", label: "Bulan Ini" },
                    { id: "THIS_YEAR", label: "Tahun Ini" },
                    { id: "CUSTOM", label: "Manual" },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setHistoryTimeFilter(preset.id as any)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                        historyTimeFilter === preset.id
                          ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {historyTimeFilter === "CUSTOM" && (
                  <div className="flex items-center gap-4 animate-in slide-in-from-left-2 fade-in duration-200">
                    <div className="flex-1">
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">
                        Mulai
                      </label>
                      <input
                        type="date"
                        value={historyStartDate}
                        onChange={(e) => setHistoryStartDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:ring-1 ring-brand-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">
                        Sampai
                      </label>
                      <input
                        type="date"
                        value={historyEndDate}
                        onChange={(e) => setHistoryEndDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:ring-1 ring-brand-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* List Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50 custom-scrollbar">
                <div className="space-y-3">
                  {orders
                    .filter((order) => {
                      if (order.memberId !== selectedMember.id) return false;

                      const orderDate = new Date(order.createdAt);
                      const now = new Date();

                      if (historyTimeFilter === "7_DAYS") {
                        const weekAgo = new Date();
                        weekAgo.setDate(now.getDate() - 7);
                        return orderDate >= weekAgo;
                      }
                      if (historyTimeFilter === "THIS_MONTH") {
                        return (
                          orderDate.getMonth() === now.getMonth() &&
                          orderDate.getFullYear() === now.getFullYear()
                        );
                      }
                      if (historyTimeFilter === "THIS_YEAR") {
                        return orderDate.getFullYear() === now.getFullYear();
                      }
                      if (historyTimeFilter === "CUSTOM") {
                        if (
                          historyStartDate &&
                          orderDate < new Date(historyStartDate)
                        )
                          return false;
                        if (historyEndDate) {
                          const end = new Date(historyEndDate);
                          end.setHours(23, 59, 59, 999);
                          if (orderDate > end) return false;
                        }
                      }
                      return true;
                    })
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                    )
                    .map((order) => (
                      <div
                        key={order.id}
                        className="bg-slate-800/40 rounded-2xl border border-white/5 p-4 flex items-center gap-4 hover:border-white/10 transition-colors group"
                      >
                        <div
                          className={`p-3 rounded-xl bg-slate-850 flex items-center justify-center ${
                            order.status === OrderStatus.COMPLETED
                              ? "text-emerald-500"
                              : "text-slate-500"
                          }`}
                        >
                          <FileText size={24} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h5 className="font-bold text-white">
                              {order.customerName}{" "}
                              <span className="text-[10px] text-slate-500 font-mono ml-2">
                                #{order.id.slice(-6)}
                              </span>
                            </h5>
                            <div className="text-sm font-mono font-black text-white">
                              {formatRupiah(order.finalAmount)}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            <span>
                              {new Date(order.createdAt).toLocaleString(
                                "id-ID",
                                { dateStyle: "medium", timeStyle: "short" },
                              )}
                            </span>
                            <span className="w-1 h-1 bg-slate-700 rounded-full" />
                            <span>{order.paymentMethod}</span>
                            <span className="w-1 h-1 bg-slate-700 rounded-full" />
                            <span
                              className={`px-2 py-0.5 rounded ${
                                order.status === OrderStatus.COMPLETED
                                  ? "bg-emerald-900/30 text-emerald-400"
                                  : order.status === OrderStatus.CANCELLED
                                    ? "bg-red-900/30 text-red-400"
                                    : "bg-blue-900/30 text-blue-400"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedOrderDetails(order)}
                            className="p-2 rounded-lg bg-slate-700 text-white hover:bg-brand-500 transition-all opacity-0 group-hover:opacity-100"
                            title="Lihat Detail"
                          >
                            <Search size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  {orders.filter((o) => o.memberId === selectedMember.id)
                    .length === 0 && (
                    <div className="text-center py-20 text-slate-500">
                      <History size={48} className="mx-auto mb-4 opacity-10" />
                      <p className="font-medium">
                        Data transaksi belum tersedia.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-950/80 border-t border-white/5 flex justify-between items-center">
                <div className="text-sm text-slate-400">
                  Total ditampilkan:{" "}
                  <span className="text-white font-bold">
                    {
                      orders.filter((order) => {
                        if (order.memberId !== selectedMember.id) return false;
                        const orderDate = new Date(order.createdAt);
                        const now = new Date();
                        if (historyTimeFilter === "7_DAYS") {
                          const d = new Date();
                          d.setDate(now.getDate() - 7);
                          return orderDate >= d;
                        }
                        if (historyTimeFilter === "THIS_MONTH")
                          return (
                            orderDate.getMonth() === now.getMonth() &&
                            orderDate.getFullYear() === now.getFullYear()
                          );
                        if (historyTimeFilter === "THIS_YEAR")
                          return orderDate.getFullYear() === now.getFullYear();
                        if (historyTimeFilter === "CUSTOM") {
                          if (
                            historyStartDate &&
                            orderDate < new Date(historyStartDate)
                          )
                            return false;
                          if (historyEndDate) {
                            const e = new Date(historyEndDate);
                            e.setHours(23, 59, 59, 999);
                            if (orderDate > e) return false;
                          }
                        }
                        return true;
                      }).length
                    }
                  </span>{" "}
                  transaksi
                </div>
                <button
                  onClick={() => setIsMemberHistoryOpen(false)}
                  className="px-8 py-3 rounded-2xl bg-brand-500 text-white font-black hover:bg-brand-400 transition-all shadow-lg shadow-brand-500/20 active:scale-95"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: TAMBAH MEMBER BARU */}
        {showAddMemberModalAdmin && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowAddMemberModalAdmin(false)}
            />
            <div className="relative bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-800 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <header className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-extrabold text-white">Tambah Member Baru</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Integrasikan data member, tanggal lahir, dan sistem Pager.</p>
                </div>
                <button
                  onClick={() => setShowAddMemberModalAdmin(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </header>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div>
                  <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5">
                    Nama Lengkap <span className="text-pink-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kevin Sanjaya"
                    value={newMemberFormAdmin.fullName}
                    onChange={(e) =>
                      setNewMemberFormAdmin({
                        ...newMemberFormAdmin,
                        fullName: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5">
                      Nama Panggilan <span className="text-pink-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Kevin"
                      value={newMemberFormAdmin.nickname || ""}
                      onChange={(e) =>
                        setNewMemberFormAdmin({
                          ...newMemberFormAdmin,
                          nickname: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5">
                      Gender <span className="text-pink-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setNewMemberFormAdmin({
                            ...newMemberFormAdmin,
                            gender: "MALE",
                          })
                        }
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          newMemberFormAdmin.gender === "MALE"
                            ? "bg-brand-550/20 text-brand-400 border-brand-500"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        Laki-Laki
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setNewMemberFormAdmin({
                            ...newMemberFormAdmin,
                            gender: "FEMALE",
                          })
                        }
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          newMemberFormAdmin.gender === "FEMALE"
                            ? "bg-brand-550/20 text-brand-400 border-brand-500"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        Perempuan
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5">
                    No. Handphone / WhatsApp Line <span className="text-pink-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 08123456789"
                    value={newMemberFormAdmin.phone}
                    onChange={(e) =>
                      setNewMemberFormAdmin({
                        ...newMemberFormAdmin,
                        phone: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500 text-sm font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Gunakan kode lokal Indonesia yang valid (08xxx / 62xxx).</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5">
                      Tanggal Lahir (Opsional)
                    </label>
                    <input
                      type="date"
                      value={newMemberFormAdmin.birthDate || ""}
                      onChange={(e) =>
                        setNewMemberFormAdmin({
                          ...newMemberFormAdmin,
                          birthDate: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 text-white px-4 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5">
                      Est. Zodiak Hari Ini
                    </label>
                    <div className="bg-slate-950 text-xs text-brand-400 border border-slate-850 px-4 py-2.5 rounded-xl flex items-center gap-1.5 font-bold h-10">
                      {newMemberFormAdmin.birthDate ? (
                        <>
                          <span>{getZodiacSign(newMemberFormAdmin.birthDate).icon}</span>
                          <span>{getZodiacSign(newMemberFormAdmin.birthDate).name}</span>
                        </>
                      ) : (
                        <span className="text-slate-600 italic font-medium">Belum terdeteksi</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-850 pt-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5">
                      Tentukan Security PIN (6-Digit)
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="PIN"
                        value={newMemberFormAdmin.pin}
                        onChange={(e) =>
                          setNewMemberFormAdmin({
                            ...newMemberFormAdmin,
                            pin: e.target.value.replace(/[^0-9]/g, ""),
                          })
                        }
                        className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500 text-sm font-mono text-center font-bold tracking-widest"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setNewMemberFormAdmin({
                            ...newMemberFormAdmin,
                            pin: generate6DigitPin(),
                          })
                        }
                        className="px-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold whitespace-nowrap"
                        title="Acak PIN 6 Digit"
                      >
                        Acak
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5">
                      VIP Level Default
                    </label>
                    <select
                      value={newMemberFormAdmin.tier}
                      onChange={(e) =>
                        setNewMemberFormAdmin({
                          ...newMemberFormAdmin,
                          tier: e.target.value as Tier,
                        })
                      }
                      className="w-full bg-slate-950 text-slate-300 text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500 h-10"
                    >
                      <option value={Tier.BRONZE}>Bronze Default (0%)</option>
                      <option value={Tier.SILVER}>Silver Tier (3%)</option>
                      <option value={Tier.GOLD}>Gold Tier (5%)</option>
                      <option value={Tier.PLATINUM}>Platinum Ultra (10%)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-950/80 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModalAdmin(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-755 transition-colors font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAddMemberAdmin}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all font-black text-xs active:scale-95"
                >
                  Simpan Member
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: EDIT PROFIL MEMBER LENGKAP */}
        {isEditMemberModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsEditMemberModalOpen(false)}
            />
            <div className="relative bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-800 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <header className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-extrabold text-white">Edit Profil & Loyalty Member</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Edit status, reset PIN kustom, dan overrule level membership.</p>
                </div>
                <button
                  onClick={() => setIsEditMemberModalOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </header>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5">
                      Nama Lengkap Member
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Kevin Sanjaya"
                      value={memberEditForm.fullName || ""}
                      onChange={(e) =>
                        setMemberEditForm({
                          ...memberEditForm,
                          fullName: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5">
                      Nama Panggilan (Shortname)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Kevin"
                      value={memberEditForm.nickname || ""}
                      onChange={(e) =>
                        setMemberEditForm({
                          ...memberEditForm,
                          nickname: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5">
                      Line No. HP / WhatsApp
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0812345678"
                      value={memberEditForm.phone || ""}
                      onChange={(e) =>
                        setMemberEditForm({
                          ...memberEditForm,
                          phone: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500 text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5">
                      Gender Identity
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setMemberEditForm({
                            ...memberEditForm,
                            gender: "MALE",
                          })
                        }
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          memberEditForm.gender === "MALE"
                            ? "bg-brand-550/20 text-brand-400 border-brand-500"
                            : "bg-slate-950 text-slate-400 border-slate-800"
                        }`}
                      >
                        Laki-Laki
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setMemberEditForm({
                            ...memberEditForm,
                            gender: "FEMALE",
                          })
                        }
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          memberEditForm.gender === "FEMALE"
                            ? "bg-brand-550/20 text-brand-400 border-brand-500"
                            : "bg-slate-950 text-slate-400 border-slate-800"
                        }`}
                      >
                        Perempuan
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5">
                      Ubah Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      value={memberEditForm.birthDate || ""}
                      onChange={(e) =>
                        setMemberEditForm({
                          ...memberEditForm,
                          birthDate: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 text-white px-4 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5">
                      Zodiak Deteksi
                    </label>
                    <div className="bg-slate-950 text-xs text-brand-400 border border-slate-850 px-4 py-2.5 rounded-xl flex items-center gap-1.5 font-bold h-10">
                      <span>{getZodiacSign(memberEditForm.birthDate).icon}</span>
                      <span>{getZodiacSign(memberEditForm.birthDate).name}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-850 pt-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5">
                      Reset PIN Keamanan (6-Digit)
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="PIN baru"
                        value={memberEditForm.pin || ""}
                        onChange={(e) =>
                          setMemberEditForm({
                            ...memberEditForm,
                            pin: e.target.value.replace(/[^0-9]/g, ""),
                          })
                        }
                        className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500 text-sm font-mono text-center font-bold tracking-widest-lg"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setMemberEditForm({
                            ...memberEditForm,
                            pin: generate6DigitPin(),
                          })
                        }
                        className="px-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                      >
                        Acak
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5">
                      Override VIP membership Tier
                    </label>
                    <select
                      value={memberEditForm.tier}
                      onChange={(e) =>
                        setMemberEditForm({
                          ...memberEditForm,
                          tier: e.target.value as Tier,
                        })
                      }
                      className="w-full bg-slate-950 text-slate-300 text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500 h-10"
                    >
                      <option value={Tier.BRONZE}>Bronze Default (0%)</option>
                      <option value={Tier.SILVER}>Silver Tier (3%)</option>
                      <option value={Tier.GOLD}>Gold Tier (5%)</option>
                      <option value={Tier.PLATINUM}>Platinum Ultra (10%)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-850 pt-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5">
                      Poin Loyalitas
                    </label>
                    <input
                      type="number"
                      value={memberEditForm.points || 0}
                      onChange={(e) =>
                        setMemberEditForm({
                          ...memberEditForm,
                          points: parseInt(e.target.value, 10 || 0),
                        })
                      }
                      className="w-full bg-slate-950 text-white px-4 py-2 rounded-xl border border-slate-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5">
                      Status Akun Member
                    </label>
                    <select
                      value={memberEditForm.status || "ACTIVE"}
                      onChange={(e) =>
                        setMemberEditForm({
                          ...memberEditForm,
                          status: e.target.value as any,
                        })
                      }
                      className="w-full bg-slate-950 text-slate-300 text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-500 h-10"
                    >
                      <option value="ACTIVE">Aktif (Dapat Bertransaksi)</option>
                      <option value="PENDING">Pending Approval Manager</option>
                      <option value="PENDING_CARD">Butuh Binding Kartu Fisik</option>
                     </select>
                  </div>
                </div>

                {memberEditForm.phone && memberEditForm.pin && (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white">Notifikasi via WhatsApp</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Kirim update credential PIN langsung ke pelanggan via tautan WhatsApp API resmi.
                      </div>
                    </div>
                    <a
                      href={`https://wa.me/${memberEditForm.phone.replace(/[^0-9]/g, "").startsWith("0") ? "62" + memberEditForm.phone.replace(/[^0-9]/g, "").slice(1) : memberEditForm.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Halo Kak ${memberEditForm.fullName || memberEditForm.name}! Kami mengonfirmasi penyetelan PIN digital untuk akun premium ${memberEditForm.tier} Anda!\n\nUser ID: ${memberEditForm.id}\nNama Panggilan: ${memberEditForm.nickname}\nSecurity PIN: *${memberEditForm.pin}*\n\nJangan membagikan PIN ini dengan siapapun. Simpan credential digital ini untuk kemudahan pembayaran instan di kasir Coraq Coffee! ☕✨`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow"
                    >
                      <MessageSquare size={13} /> Kirim PIN
                    </a>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-950/80 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditMemberModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-755 transition-colors font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={saveMember}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all font-black text-xs active:scale-95 shadow"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAnalytics = () => (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Analisis Bisnis</h2>
        <p className="text-slate-400">
          Grafik penjualan, produk terlaris, dan jam sibuk.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heatmap */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 col-span-1 lg:col-span-2">
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
            <Clock size={20} /> Waktu Teramai (Heatmap)
          </h3>
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-[50px_repeat(15,_1fr)] gap-1">
                <div className="col-start-1"></div>
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="text-center text-xs text-slate-500">
                    {i + 8}:00
                  </div>
                ))}

                {heatmapData.days.map((day, dIdx) => (
                  <React.Fragment key={day}>
                    <div className="text-xs font-bold text-slate-400 flex items-center">
                      {day}
                    </div>
                    {heatmapData.grid[dIdx].map((val, hIdx) => (
                      <div
                        key={hIdx}
                        className={`h-8 rounded-sm transition-all hover:scale-110 ${
                          val === 0
                            ? "bg-slate-800/50"
                            : val < 5
                              ? "bg-brand-900/40"
                              : val < 10
                                ? "bg-brand-700/60"
                                : "bg-brand-500"
                        }`}
                        title={`${day} ${hIdx + 8}:00 - ${val} Order`}
                      ></div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BCG Matrix */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 h-[400px]">
          <h3 className="font-bold text-xl mb-4">Menu Matrix (BCG Analysis)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                type="number"
                dataKey="x"
                name="Volume"
                unit=" pcs"
                stroke="#94a3b8"
                label={{
                  value: "Sales Volume",
                  position: "bottom",
                  fill: "#94a3b8",
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Margin"
                unit="%"
                stroke="#94a3b8"
                label={{
                  value: "Profit Margin",
                  angle: -90,
                  position: "left",
                  fill: "#94a3b8",
                }}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#1e293b",
                  color: "white",
                }}
              />
              <Legend />
              <Scatter name="Products" data={bcgData} fill="#8884d8">
                {bcgData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.classification === "STAR"
                        ? "#22c55e"
                        : entry.classification === "CASH COW"
                          ? "#eab308"
                          : entry.classification === "QUESTION"
                            ? "#3b82f6"
                            : "#ef4444"
                    }
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Category Sales Pie */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 h-[400px]">
          <h3 className="font-bold text-xl mb-4">Penjualan per Kategori</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categories
                  .map((cat) => ({
                    name: cat,
                    value: orders.reduce(
                      (acc, o) =>
                        acc +
                        o.items
                          .filter((i) => i.product.category === cat)
                          .reduce((sum, i) => sum + i.quantity, 0),
                      0,
                    ),
                  }))
                  .filter((d) => d.value > 0)}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {categories.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      ["#f97316", "#3b82f6", "#22c55e", "#a855f7", "#ec4899"][
                        index % 5
                      ]
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#1e293b",
                  color: "white",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Business Co-Pilot Forecasting Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden mt-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-600/10 to-purple-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-850">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 rounded-full text-xs font-black bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm">AI FORECAST</span>
              <h3 className="font-extrabold text-2xl text-white tracking-tight">Coraq AI Business Co-Pilot 🧠</h3>
            </div>
            <p className="text-slate-400 text-sm">Proyeksikan pertumbuhan omset, pantau SWOT, dan susun milestone langkah strategis.</p>
          </div>
          
          <button
            onClick={handleGenerateAiForecast}
            disabled={isForecastingAi}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 transition-all hover:opacity-90 text-white px-6 py-3 rounded-xl font-extrabold flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-indigo-950/40 disabled:opacity-50 disabled:pointer-events-none text-sm shrink-0"
          >
            {isForecastingAi ? (
              <>
                <RefreshCcw size={16} className="animate-spin" />
                Mengevaluasi Kinerja...
              </>
            ) : (
              <>
                <Activity size={16} />
                Jalankan Proyeksi & Analisis Strategis ⚡
              </>
            )}
          </button>
        </div>

        {aiForecastError && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-900/30 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={20} />
            <div className="space-y-1 text-left">
              <h5 className="font-extrabold text-red-500 text-sm">Gagal Melakukan Ramalan Bisnis AI</h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                {aiForecastError.includes("429") || aiForecastError.includes("quota") || aiForecastError.includes("RESOURCE_EXHAUSTED") ? (
                  <>
                    API Key Anda saat ini berada di <b>Free Tier (Limitasi Quota Terlampaui)</b>. 
                    Silakan tunggu beberapa menit sebelum mencoba kembali atau tingkatkan ke pay-as-you-go di Google AI Studio untuk kuota yang lebih besar.
                  </>
                ) : (
                  aiForecastError
                )}
              </p>
            </div>
          </div>
        )}

        {isForecastingAi ? (
          <div className="flex flex-col justify-center items-center py-16 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-sm text-indigo-400 font-black animate-pulse">Coraq</div>
            </div>
            <div className="text-center space-y-1.5 max-w-md">
              <h5 className="font-extrabold text-white text-base">CFO AI sedang memproses proyeksi finansial...</h5>
              <p className="text-xs text-slate-400 leading-relaxed italic">
                "Mengambil data penjualan real-time, menganalisis struktur HPP, mencocokkan tren FnB viral global di Google, dan merancang milestone eksekusi omset besar..."
              </p>
            </div>
          </div>
        ) : aiForecastResult ? (
          <div className="space-y-8 animate-fade-in text-left">
            
            {/* SWOT ANALYSIS */}
            <div className="space-y-3">
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-indigo-505 bg-indigo-500 rounded-full" />
                Matriks SWOT Analitis Coraq Coffee
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Strengths */}
                <div className="bg-emerald-950/20 border border-emerald-950/40 p-4 rounded-2xl space-y-2 text-left">
                  <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-widest">
                    <span>💪 Strengths (Kekuatan)</span>
                  </div>
                  <ul className="space-y-1.5 text-left">
                    {aiForecastResult.swotAnalysis?.strengths?.map((item: string, idx: number) => (
                      <li key={idx} className="text-xs text-slate-300 leading-relaxed flex items-start gap-1.5 justify-start">
                        <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="bg-amber-950/20 border border-amber-955/40 p-4 rounded-2xl space-y-2 text-left">
                  <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-widest">
                    <span>⚠️ Weaknesses (Kelemahan)</span>
                  </div>
                  <ul className="space-y-1.5 text-left">
                    {aiForecastResult.swotAnalysis?.weaknesses?.map((item: string, idx: number) => (
                      <li key={idx} className="text-xs text-slate-300 leading-relaxed flex items-start gap-1.5 justify-start">
                        <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Opportunities */}
                <div className="bg-blue-950/20 border border-blue-950/40 p-4 rounded-2xl space-y-2 text-left">
                  <div className="flex items-center gap-2 text-blue-400 font-black text-xs uppercase tracking-widest">
                    <span>🚀 Opportunities (Peluang)</span>
                  </div>
                  <ul className="space-y-1.5 text-left">
                    {aiForecastResult.swotAnalysis?.opportunities?.map((item: string, idx: number) => (
                      <li key={idx} className="text-xs text-slate-300 leading-relaxed flex items-start gap-1.5 justify-start">
                        <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Threats */}
                <div className="bg-rose-950/20 border border-rose-955/40 p-4 rounded-2xl space-y-2 text-left">
                  <div className="flex items-center gap-2 text-rose-400 font-black text-xs uppercase tracking-widest">
                    <span>☠️ Threats (Ancaman)</span>
                  </div>
                  <ul className="space-y-1.5 text-left">
                    {aiForecastResult.swotAnalysis?.threats?.map((item: string, idx: number) => (
                      <li key={idx} className="text-xs text-slate-300 leading-relaxed flex items-start gap-1.5 justify-start">
                        <span className="text-rose-500 mt-0.5 shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 3 MONTH FINANCIAL GROWTH FORECAST */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-slate-950/40 p-5 rounded-2xl border border-slate-850 space-y-4">
                <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                  📊 Proyeksi Kuantitatif & Target Omset 3 Bulan Kedepan
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Month 1 */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1 text-left">
                    <span className="text-[10px] uppercase font-black text-indigo-400 tracking-wider">Bulan ke-1</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{aiForecastResult.growthForecast?.month1Forecast}</p>
                  </div>
                  {/* Month 2 */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1 text-left">
                    <span className="text-[10px] uppercase font-black text-purple-400 tracking-wider">Bulan ke-2 (Eskalasi)</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{aiForecastResult.growthForecast?.month2Forecast}</p>
                  </div>
                  {/* Month 3 */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1 text-left">
                    <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider">Bulan ke-3 (Puncak)</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{aiForecastResult.growthForecast?.month3Forecast}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-850 space-y-1.5 text-left">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Analisis Tren Pertumbuhan:</span>
                  <p className="text-xs text-slate-400 leading-relaxed italic">
                    {aiForecastResult.growthForecast?.summaryTrend}
                  </p>
                </div>
              </div>

              {/* HPP COST OPTIMIZATION GUIDE */}
              <div className="lg:col-span-4 bg-gradient-to-br from-indigo-950/20 to-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="p-1 px-2.5 rounded-full text-[9px] font-black bg-indigo-900/40 text-indigo-300 border border-indigo-500/20 uppercase tracking-widest inline-block">FINANCIAL ADVISORY</span>
                  <h4 className="text-base font-extrabold text-white flex items-center gap-1.5">
                    🪙 Optimalisasi HPP & Resep
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {aiForecastResult.financialOptimization}
                  </p>
                </div>
                <div className="pt-2 text-[10px] text-slate-500 italic border-t border-slate-850 leading-tight">
                  "Menekan HPP (BOM) hingga 25%-33% dari harga jual merupakan golden rule kedai kopi sukses."
                </div>
              </div>
            </div>

            {/* STRATEGIC ROADMAP MILESTONES */}
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-purple-500 rounded-full" />
                Roadmap Aksi Strategis (Langkah Sukses Naik Omset)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiForecastResult.strategicMilestones?.map((milestone: any, idx: number) => (
                  <div key={idx} className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 hover:border-slate-750 transition-all space-y-2 relative group text-left flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center bg-indigo-900/50 text-indigo-300 text-xs font-black">{idx + 1}</span>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                          milestone.impactScale === 'HIGH' 
                            ? 'bg-rose-950 text-rose-400 border border-rose-900/30' 
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          IMPACT: {milestone.impactScale}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-sm text-white pr-1">
                        {milestone.title}
                      </h4>
                      
                      <p className="text-xs text-slate-400 leading-relaxed text-wrap pr-1 mt-1.5">
                        {milestone.description}
                      </p>
                    </div>

                    <div className="pt-2 mt-3 border-t border-slate-900 text-xs flex justify-between items-center bg-slate-950">
                      <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">Potensi:</span>
                      <span className="text-emerald-400 font-extrabold font-mono text-xs">{milestone.estimatedRevenueBoost}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Search Citations */}
            {aiForecastSources.length > 0 && (
              <div className="pt-4 border-t border-slate-850 space-y-2 text-left">
                <span className="text-[10px] tracking-wider uppercase font-black text-slate-500">Sumber Referensi & Data Grounding Trend:</span>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {aiForecastSources.map((src, idx) => (
                    <a
                      key={idx}
                      href={src.uri}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 truncate max-w-xs"
                    >
                      🔗 {src.title || src.uri}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seluruh proyeksi AI di atas dihasilkan secara dinamis menggunakan parameter real-time kedai kopi Anda. Terapkan strategi di atas secara bertahap bersama tim baristawati dan kasir untuk pertumbuhan omzet maksimal.
              </p>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center text-slate-400 text-2xl animate-pulse">
              💡
            </div>
            <div className="max-w-md space-y-2">
              <h5 className="font-extrabold text-white text-base">Belum Ada Proyeksi Bisnis Aktif</h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tekan tombol <b>"Jalankan Proyeksi & Analisis Strategis"</b> di atas untuk meluncurkan analisis finansial taktis, ramalan performa 3 bulan ke depan, dan roadmap sukses omset besar.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderMenu = () => (
    <div className="space-y-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Manajemen Menu</h2>
          <p className="text-slate-400">
            Atur produk, harga, resep, dan modifier.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCategoryManagerOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg font-bold flex items-center gap-2"
          >
            <Settings size={18} /> Kategori
          </button>
          {menuTab === "PRODUCTS" && (
            <button
              onClick={() => handleOpenProductModal()}
              className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
            >
              <Plus size={18} /> Produk Baru
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-6">
        <button
          onClick={() => setMenuTab("PRODUCTS")}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-wider transition-colors border-b-2 ${menuTab === "PRODUCTS" ? "border-brand-500 text-brand-500" : "border-transparent text-slate-500 hover:text-slate-300"}`}
        >
          Daftar Produk
        </button>
        <button
          onClick={() => setMenuTab("MODIFIERS")}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-wider transition-colors border-b-2 ${menuTab === "MODIFIERS" ? "border-purple-500 text-purple-500" : "border-transparent text-slate-500 hover:text-slate-300"}`}
        >
          Modifier & Add-ons
        </button>
      </div>

      {menuTab === "PRODUCTS" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group hover:border-brand-500/50 transition-colors flex flex-col"
            >
              <div className="h-40 relative overflow-hidden bg-slate-800">
                <img
                  src={product.image}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => handleOpenProductModal(product)}
                    className="p-2 bg-slate-900/80 text-blue-400 rounded-lg backdrop-blur-sm hover:bg-white hover:text-blue-600"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        message: `Hapus produk ${product.name}?`,
                        onConfirm: () => deleteProduct(product.id),
                      });
                    }}
                    className="p-2 bg-slate-900/80 text-red-500 rounded-lg backdrop-blur-sm hover:bg-red-600 hover:text-white"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent p-4 pt-12">
                  <span className="bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    {product.category}
                  </span>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h4 className="font-bold text-white text-lg mb-1 leading-tight">
                  {product.name}
                </h4>
                <p className="text-brand-400 font-bold mb-4">
                  {formatRupiah(product.price)}
                </p>

                <div className="mt-auto space-y-2 text-xs text-slate-500 border-t border-slate-800 pt-3">
                  <div className="flex justify-between">
                    <span>HPP (Cost)</span>
                    <span className="text-slate-300">
                      {formatRupiah(calculateProductCost(product))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Margin</span>
                    <span
                      className={
                        (product.price - calculateProductCost(product)) /
                          product.price >
                        0.5
                          ? "text-green-500"
                          : "text-yellow-500"
                      }
                    >
                      {(
                        ((product.price - calculateProductCost(product)) /
                          product.price) *
                        100
                      ).toFixed(0)}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ModifierManager />
      )}
    </div>
  );

  const renderPayroll = () => {
    return (
      <div className="space-y-6">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Penggajian (Payroll)</h2>
            <p className="text-slate-400">
              Hitung gaji otomatis berdasarkan kehadiran.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Pilih Bulan Penggajian
            </label>
            <select
              className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-brand-500"
              value={payrollMonthFilter}
              onChange={(e) => setPayrollMonthFilter(e.target.value)}
            >
              <option value="ALL">Semua Waktu</option>
              {availableMonths.map((m) => {
                const [year, month] = m.split("-");
                const date = new Date(parseInt(year), parseInt(month) - 1);
                const monthName = date.toLocaleString("id-ID", {
                  month: "long",
                  year: "numeric",
                });
                return (
                  <option key={m} value={m}>
                    {monthName}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Target Omzet Harian (Rp)
            </label>
            <input
              type="number"
              className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-brand-500"
              value={dailyTarget}
              onChange={(e) => setDailyTarget(Number(e.target.value))}
            />
          </div>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Bonus per Pegawai (Rp)
            </label>
            <input
              type="number"
              className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-brand-500"
              value={bonusAmount}
              onChange={(e) => setBonusAmount(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-bold">
              <tr>
                <th className="p-4">Nama Pegawai</th>
                <th className="p-4 text-center">Total Jam Kerja</th>
                <th className="p-4 text-right">Gaji Pokok (Prorata)</th>
                <th className="p-4 text-right">Bonus Target</th>
                <th className="p-4 text-right">Potongan (Minus)</th>
                <th className="p-4 text-right">Total Gaji</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {payrollData.map((data) => (
                <tr key={data.user.id} className="hover:bg-slate-800/50">
                  <td className="p-4 font-bold text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden">
                      {data.user.avatar ? (
                        <img
                          src={data.user.avatar}
                          alt={data.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                          {data.user.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div>{data.user.name}</div>
                      <div className="text-xs text-slate-500 font-normal">
                        {data.user.role}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-bold text-sm">
                      {data.totalHoursWorked.toFixed(1)} Jam
                    </span>
                  </td>
                  <td className="p-4 text-right text-slate-400 font-mono">
                    {formatRupiah(
                      data.totalPay - data.bonusTotal + data.totalDeductions,
                    )}
                  </td>
                  <td className="p-4 text-right text-green-400 font-mono">
                    +{formatRupiah(data.bonusTotal)}
                    <div className="text-[10px] text-slate-500">
                      ({data.achievedDays}x Target)
                    </div>
                  </td>
                  <td className="p-4 text-right text-red-400 font-mono">
                    -{formatRupiah(data.totalDeductions)}
                  </td>
                  <td className="p-4 text-right font-bold text-brand-400 text-lg">
                    {formatRupiah(data.totalPay)}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => setSelectedPayslipUser(data.user)}
                      className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                    >
                      Lihat Slip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payslip Modal */}
        {selectedPayslipUser && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 p-8 rounded-2xl w-full max-w-md border border-slate-800 relative">
              <button
                onClick={() => setSelectedPayslipUser(null)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white"
              >
                <X size={24} />
              </button>

              <div className="text-center mb-6 border-b border-slate-800 pb-6">
                <img
                  src="https://hesindonesia.id/img/LogoCoraqCoffee.png"
                  alt="Logo"
                  className="w-16 h-16 object-contain mx-auto mb-2"
                />
                <h2 className="text-2xl font-bold text-white">
                  Slip Gaji Digital
                </h2>
                <p className="text-slate-400 text-sm">Coraq Coffee</p>
                <p className="text-brand-400 font-bold mt-2">
                  Periode:{" "}
                  {payrollMonthFilter === "ALL"
                    ? "Semua Waktu"
                    : new Date(
                        parseInt(payrollMonthFilter.split("-")[0]),
                        parseInt(payrollMonthFilter.split("-")[1]) - 1,
                      ).toLocaleString("id-ID", {
                        month: "long",
                        year: "numeric",
                      })}
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Nama Pegawai</span>
                  <span className="font-bold text-white">
                    {selectedPayslipUser.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Posisi / Role</span>
                  <span className="font-bold text-white">
                    {selectedPayslipUser.role}
                  </span>
                </div>

                <div className="border-t border-slate-800 pt-4 mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400">Gaji Harian</span>
                    <span className="font-mono text-slate-300">
                      {formatRupiah(selectedPayslipUser.dailyRate || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400">Total Jam Kerja</span>
                    <span className="font-bold text-white">
                      {payrollData
                        .find((d) => d.user.id === selectedPayslipUser.id)
                        ?.totalHoursWorked.toFixed(1)}{" "}
                      Jam
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400">Gaji Pokok (Prorata)</span>
                    <span className="font-mono text-slate-300">
                      {formatRupiah(
                        payrollData.find(
                          (d) => d.user.id === selectedPayslipUser.id,
                        )?.totalPay! -
                          (payrollData.find(
                            (d) => d.user.id === selectedPayslipUser.id,
                          )?.bonusTotal || 0) +
                          (payrollData.find(
                            (d) => d.user.id === selectedPayslipUser.id,
                          )?.totalDeductions || 0),
                      )}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400">Bonus Target Harian</span>
                    <span className="font-mono text-green-400">
                      +
                      {formatRupiah(
                        payrollData.find(
                          (d) => d.user.id === selectedPayslipUser.id,
                        )?.bonusTotal || 0,
                      )}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 text-right">
                    (Tercapai{" "}
                    {payrollData.find(
                      (d) => d.user.id === selectedPayslipUser.id,
                    )?.achievedDays || 0}{" "}
                    Hari x {formatRupiah(bonusAmount)})
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400">
                      Potongan Selisih Kasir
                    </span>
                    <span className="font-mono text-red-400">
                      -
                      {formatRupiah(
                        payrollData.find(
                          (d) => d.user.id === selectedPayslipUser.id,
                        )?.totalDeductions || 0,
                      )}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 text-right">
                    (Tanggung Renteng Minus Shift)
                  </div>
                </div>
              </div>

              <div className="bg-brand-900/20 border border-brand-900/50 p-4 rounded-xl text-center">
                <p className="text-xs text-brand-400 uppercase font-bold mb-1">
                  Total Gaji Bersih (Take Home Pay)
                </p>
                <h3 className="text-3xl font-bold text-white">
                  {formatRupiah(
                    payrollData.find(
                      (d) => d.user.id === selectedPayslipUser.id,
                    )?.totalPay || 0,
                  )}
                </h3>
              </div>

              <button
                onClick={() => {
                  setAlertDialog({
                    isOpen: true,
                    message: "Fitur cetak / kirim WA akan segera hadir!",
                    type: "info",
                  });
                  setSelectedPayslipUser(null);
                }}
                className="w-full mt-6 bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Cetak / Kirim via WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <nav className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-20 shadow-xl">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <img
            src="https://hesindonesia.id/img/LogoCoraqCoffee.png"
            alt="Logo"
            className="w-12 h-12 object-contain"
          />
          <div>
            <h1 className="font-bold text-lg leading-none">Coraq POS</h1>
            <p className="text-xs text-slate-500 mt-1">Admin Dashboard</p>
          </div>
        </div>

        <div className="flex-1 py-6 space-y-1 overflow-y-auto">
          {[
            { id: "DASHBOARD", icon: TrendingUp, label: "Ringkasan" },
            {
              id: "TRANSACTIONS",
              icon: ClipboardCheck,
              label: "Riwayat Transaksi",
            },
            { id: "ANALYTICS", icon: Activity, label: "Analytics" },
            { id: "LOCATION_INTELLIGENCE", icon: MapPin, label: "Location Intelligence" },
            { id: "MENU", icon: Coffee, label: "Menu & Produk" },
            { id: "INVENTORY", icon: Package, label: "Inventory" },
            { id: "FINANCE", icon: Wallet, label: "Keuangan" },
            { id: "MARKETING", icon: Megaphone, label: "Marketing" },
            { id: "MEMBERS", icon: Users, label: "Membership" },
            { id: "STAFF", icon: IdCard, label: "Pegawai / Staff" },
            { id: "PAYROLL", icon: ClipboardCheck, label: "Penggajian" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as ViewState)}
              className={`w-full flex items-center gap-3 px-6 py-3 transition-colors border-l-4 ${
                currentView === item.id
                  ? "bg-slate-800 border-orange-500 text-white"
                  : "border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.id === "MEMBERS" && todayBirthdayMembers.length > 0 && (
                <span className="bg-pink-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse flex items-center gap-1 shadow border border-pink-700/40 mr-1">
                  <Gift size={11} />
                  {todayBirthdayMembers.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={resetSystem}
            className="w-full mb-2 flex items-center justify-center gap-2 p-3 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-sm"
          >
            <AlertTriangle size={16} /> Reset System
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-red-900/20 text-red-500 hover:bg-red-900/40 font-bold"
          >
            <LogOut size={18} /> KELUAR
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-8 relative">
        <div className="max-w-7xl mx-auto pb-20">
          {currentView === "DASHBOARD" && renderDashboard()}
          {currentView === "TRANSACTIONS" && renderTransactions()}
          {currentView === "MARKETING" && renderMarketing()}
          {currentView === "INVENTORY" && renderInventory()}
          {currentView === "MENU" && renderMenu()}
          {currentView === "MEMBERS" && renderMembers()}
          {currentView === "FINANCE" && renderFinance()}
          {currentView === "ANALYTICS" && renderAnalytics()}
          {currentView === "STAFF" && renderStaff()}
          {currentView === "PAYROLL" && renderPayroll()}
          {currentView === "LOCATION_INTELLIGENCE" && <CoraqLocationIntelligence />}
        </div>
      </main>

      {/* --- MODALS --- */}
      <div
        className={`fixed inset-0 bg-black/95 items-center justify-center z-[200] p-4 backdrop-blur-xl transition-opacity duration-300 ${
          isAdminQRScannerOpen
            ? "opacity-100 flex pointer-events-auto"
            : "opacity-0 flex pointer-events-none"
        }`}
      >
        <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-600/20 rounded-lg text-brand-400">
                <IdCard size={20} />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                Bind Kartu Member
              </h3>
            </div>
            <button
              onClick={() => {
                setIsAdminQRScannerOpen(false);
                setBindingMemberId(null);
                setManualMemberCardCode("");
              }}
              className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-8">
            <div
              id="admin-qr-reader"
              className="overflow-hidden rounded-2xl border-4 border-slate-800 bg-black aspect-square"
            ></div>

            {adminCameraDevices.length > 1 && (
              <div className="mt-4 flex gap-2">
                {adminCameraDevices.slice(0, 2).map((device, index) => (
                  <button
                    key={device.id}
                    onClick={() => setAdminCameraId(device.id)}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all border ${
                      adminCameraId === device.id
                        ? "bg-brand-500/20 border-brand-500 text-brand-400"
                        : "bg-slate-800 border-slate-700 text-slate-500"
                    }`}
                  >
                    Cam {index + 1}
                  </button>
                ))}
              </div>
            )}

            <p className="text-center text-slate-400 text-sm mt-6">
              Scan QR Code pada kartu fisik untuk menghubungkannya dengan member
              ini.
            </p>

            <div className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 h-px bg-slate-800"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  ATAU INPUT MANUAL
                </span>
                <div className="flex-1 h-px bg-slate-800"></div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualMemberCardCode}
                  onChange={(e) =>
                    setManualMemberCardCode(e.target.value.toUpperCase())
                  }
                  placeholder="KODE KARTU"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono font-bold focus:outline-none focus:border-brand-500 transition-colors uppercase"
                />
                <button
                  onClick={() => {
                    if (
                      manualMemberCardCode.trim().length > 0 &&
                      bindingMemberId
                    ) {
                      bindMemberCard(
                        bindingMemberId,
                        manualMemberCardCode.trim(),
                      );
                      setIsAdminQRScannerOpen(false);
                      setBindingMemberId(null);
                      setManualMemberCardCode("");
                      alert("Kartu Member berhasil di-bind!");
                    }
                  }}
                  disabled={!manualMemberCardCode.trim()}
                  className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white px-6 rounded-xl font-black transition-all"
                >
                  BIND
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-950/50 border-t border-slate-800">
            <button
              onClick={() => {
                setIsAdminQRScannerOpen(false);
                setBindingMemberId(null);
                setManualMemberCardCode("");
              }}
              className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
      {/* (Only modified modals are shown below, Product and others are reused) */}

      {/* Opname, Staff, Promo, Category Manager modals are rendered here as well (omitted for brevity as they are unchanged logic wise, just re-rendered) */}
      {opnameModalOpen && opnameItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 p-6 rounded-xl w-full max-w-md border border-slate-800 text-center">
            <h3 className="font-bold text-xl mb-2">
              Stock Opname: {opnameItem.name}
            </h3>
            <p className="text-slate-400 mb-6">
              Stok Sistem: {opnameItem.stock} {opnameItem.unit}
            </p>
            <div className="space-y-4 text-left">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Stok Fisik (Aktual)
                </label>
                <input
                  type="number"
                  className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white text-xl font-bold text-center"
                  value={opnameActual}
                  onChange={(e) => setOpnameActual(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Alasan Penyesuaian
                </label>
                <select
                  className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white"
                  value={opnameReason}
                  onChange={(e) =>
                    setOpnameReason(e.target.value as AdjustmentReason)
                  }
                >
                  {Object.values(AdjustmentReason).map((r) => (
                    <option key={r} value={r}>
                      {r.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={submitOpname}
                className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl mt-4"
              >
                Update Stok
              </button>
              <button
                onClick={() => setOpnameModalOpen(false)}
                className="w-full py-2 text-slate-500"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Production Modal */}
      {productionModalOpen && productionItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 p-6 rounded-xl w-full max-w-md border border-slate-800 text-center">
            <div className="flex justify-center mb-4 text-indigo-500">
              <Layers size={32} />
            </div>
            <h3 className="font-bold text-xl mb-2">
              Produksi: {productionItem.name}
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Mengurangi bahan baku sesuai resep dan menambah stok barang
              setengah jadi.
            </p>
            <div className="space-y-4 text-left">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <span className="text-xs font-bold text-slate-500 uppercase block mb-2">
                  Resep (per 1 {productionItem.unit})
                </span>
                {productionItem.recipe?.map((r) => {
                  const ing = ingredients.find((i) => i.id === r.ingredientId);
                  return (
                    <div
                      key={r.ingredientId}
                      className="flex justify-between text-sm py-1 border-b border-slate-800/50 last:border-0 text-slate-300"
                    >
                      <span>{ing?.name || "Unknown"}</span>
                      <span className="font-mono text-indigo-400">
                        {r.amount * productionQty} {ing?.unit}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mt-4 mb-1">
                  Jumlah Produksi ({productionItem.unit})
                </label>
                <input
                  type="number"
                  className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl text-white text-2xl font-bold text-center"
                  value={productionQty}
                  min={1}
                  onChange={(e) =>
                    setProductionQty(Math.max(1, Number(e.target.value)))
                  }
                />
              </div>

              <button
                onClick={() => {
                  produceSemiFinished(productionItem.id, productionQty);
                  setProductionModalOpen(false);
                }}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl mt-4"
              >
                Mulai Produksi
              </button>
              <button
                onClick={() => setProductionModalOpen(false)}
                className="w-full py-2 text-slate-500 hover:text-white"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {isAddingExpense && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 p-6 rounded-xl w-full max-w-md border border-slate-800">
            <h3 className="font-bold text-xl mb-4 text-red-400">
              Input Pengeluaran
            </h3>
            <div className="space-y-3">
              <select
                className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white"
                value={expenseForm.category}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, category: e.target.value })
                }
              >
                {[
                  { val: "SALARY", label: "GAJI KARYAWAN" },
                  { val: "UTILITIES", label: "LISTRIK / AIR / WIFI" },
                  { val: "RENT", label: "SEWA TEMPAT" },
                  { val: "MARKETING", label: "PEMASARAN" },
                  { val: "MAINTENANCE", label: "PERAWATAN / PERBAIKAN" },
                  { val: "OTHER", label: "LAIN-LAIN" },
                ].map((c) => (
                  <option key={c.val} value={c.val}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white"
                placeholder="Keterangan"
                value={expenseForm.description}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    description: e.target.value,
                  })
                }
              />
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white"
                placeholder="Jumlah (contoh: 150.000,50)"
                value={displayExpenseAmount}
                onChange={handleExpenseAmountChange}
              />
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setIsAddingExpense(false)}
                  className="flex-1 py-3 rounded bg-slate-800 text-slate-400"
                >
                  Batal
                </button>
                <button
                  onClick={submitExpense}
                  className="flex-1 py-3 rounded bg-red-600 text-white font-bold"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ingredient Manager Modal */}
      {ingredientModalOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 w-full max-w-4xl h-[90vh] rounded-2xl border border-slate-800 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold">
                {editingIngredientId ? "Edit Bahan Baku" : "Tambah Bahan Baru"}
              </h3>
              <button onClick={() => setIngredientModalOpen(false)}>
                <X className="text-slate-400 hover:text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-brand-500 font-bold uppercase text-sm border-b border-slate-800 pb-2">
                  Informasi Dasar
                </h4>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Nama Bahan
                  </label>
                  <input
                    className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white"
                    value={ingredientForm.name}
                    onChange={(e) =>
                      setIngredientForm({
                        ...ingredientForm,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">
                      Stok Aktual
                    </label>
                    <input
                      type="number"
                      className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white"
                      value={ingredientForm.stock || 0}
                      onChange={(e) =>
                        setIngredientForm({
                          ...ingredientForm,
                          stock: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">
                      Satuan Pakai (g/ml)
                    </label>
                    <input
                      className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white"
                      value={ingredientForm.unit}
                      onChange={(e) =>
                        setIngredientForm({
                          ...ingredientForm,
                          unit: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">
                      Satuan Beli (Kg/L)
                    </label>
                    <input
                      className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white"
                      value={ingredientForm.buyUnit}
                      onChange={(e) =>
                        setIngredientForm({
                          ...ingredientForm,
                          buyUnit: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">
                      Konversi (1 Beli = ? Pakai)
                    </label>
                    <input
                      type="number"
                      className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white"
                      value={ingredientForm.conversionRate || 1}
                      onChange={(e) =>
                        setIngredientForm({
                          ...ingredientForm,
                          conversionRate: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    HPP per Unit Pakai (Rp)
                  </label>
                  <input
                    type="number"
                    className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white"
                    value={ingredientForm.costPerUnit || 0}
                    onChange={(e) =>
                      setIngredientForm({
                        ...ingredientForm,
                        costPerUnit: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div
                  className="p-4 bg-indigo-950/30 border border-indigo-900 rounded-lg mt-4 cursor-pointer"
                  onClick={() =>
                    setIngredientForm({
                      ...ingredientForm,
                      isSemiFinished: !ingredientForm.isSemiFinished,
                    })
                  }
                >
                  <div className="flex items-center gap-2 relative group">
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-indigo-500"
                      checked={ingredientForm.isSemiFinished || false}
                      readOnly
                    />
                    <div>
                      <span className="font-bold text-indigo-400">
                        Barang Setengah Jadi (Batch Produksi)
                      </span>
                      <p className="text-xs text-slate-400 mt-1">
                        Gunakan ini untuk item (seperti "Base Kopi") yang dibuat
                        barista dari bahan mentah lainnya. Centang ini untuk
                        mengaktifkan Formula Resep HPP.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {ingredientForm.isSemiFinished ? (
                  <>
                    <h4 className="text-indigo-400 font-bold uppercase text-sm border-b border-slate-800 pb-2">
                      Resep (Formula HPP per 1 {ingredientForm.unit})
                    </h4>

                    <div className="flex gap-2">
                      <select
                        id="ing-recipe-select"
                        className="flex-1 bg-slate-950 border border-slate-700 p-3 rounded text-white text-sm"
                      >
                        <option value="">Pilih Bahan Baku...</option>
                        {ingredients
                          .filter(
                            (i) =>
                              i.id !== editingIngredientId && !i.isSemiFinished,
                          )
                          .map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.name} ({i.unit})
                            </option>
                          ))}
                      </select>
                      <input
                        id="ing-recipe-amount"
                        type="number"
                        placeholder="Qty"
                        className="w-24 bg-slate-950 border border-slate-700 p-3 rounded text-white text-sm"
                      />
                      <button
                        onClick={() => {
                          const select = document.getElementById(
                            "ing-recipe-select",
                          ) as HTMLSelectElement;
                          const amountInput = document.getElementById(
                            "ing-recipe-amount",
                          ) as HTMLInputElement;
                          if (select.value && Number(amountInput.value) > 0) {
                            const newRecipe = [
                              ...(ingredientForm.recipe || []),
                            ];
                            const existing = newRecipe.find(
                              (r) => r.ingredientId === select.value,
                            );
                            if (existing) {
                              existing.amount += Number(amountInput.value);
                            } else {
                              newRecipe.push({
                                ingredientId: select.value,
                                amount: Number(amountInput.value),
                              });
                            }
                            setIngredientForm({
                              ...ingredientForm,
                              recipe: newRecipe,
                            });
                            select.value = "";
                            amountInput.value = "";
                          }
                        }}
                        className="bg-slate-800 p-3 rounded text-white font-bold hover:bg-slate-700"
                      >
                        Add
                      </button>
                    </div>

                    <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900 text-slate-400">
                          <tr>
                            <th className="p-3">Bahan</th>
                            <th className="p-3">Qty</th>
                            <th className="p-3">Cost</th>
                            <th className="p-3"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {(ingredientForm.recipe || []).map((r, i) => {
                            const ing = ingredients.find(
                              (ix) => ix.id === r.ingredientId,
                            );
                            return (
                              <tr key={i}>
                                <td className="p-3">
                                  {ing?.name || "Unknown"}
                                </td>
                                <td className="p-3 font-mono">
                                  {r.amount} {ing?.unit}
                                </td>
                                <td className="p-3 font-mono text-slate-400">
                                  {formatRupiah(
                                    (ing?.costPerUnit || 0) * r.amount,
                                  )}
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => {
                                      const newRecipe = [
                                        ...ingredientForm.recipe!,
                                      ];
                                      newRecipe.splice(i, 1);
                                      setIngredientForm({
                                        ...ingredientForm,
                                        recipe: newRecipe,
                                      });
                                    }}
                                    className="text-red-500 hover:text-red-400"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {(!ingredientForm.recipe ||
                            ingredientForm.recipe.length === 0) && (
                            <tr>
                              <td
                                colSpan={4}
                                className="p-4 text-center text-slate-500 text-xs"
                              >
                                Belum ada resep komposisi.
                              </td>
                            </tr>
                          )}
                          {ingredientForm.recipe &&
                            ingredientForm.recipe.length > 0 && (
                              <tr className="bg-indigo-950/20 font-bold border-t border-slate-800 text-indigo-300">
                                <td className="p-3" colSpan={2}>
                                  Estimasi HPP Semi-Finished
                                </td>
                                <td className="p-3 font-mono" colSpan={2}>
                                  {formatRupiah(
                                    ingredientForm.recipe.reduce((sum, r) => {
                                      const ing = ingredients.find(
                                        (ix) => ix.id === r.ingredientId,
                                      );
                                      return (
                                        sum + (ing?.costPerUnit || 0) * r.amount
                                      );
                                    }, 0),
                                  )}{" "}
                                  <span className="text-[10px] text-indigo-500 font-normal">
                                    / {ingredientForm.unit}
                                  </span>
                                </td>
                              </tr>
                            )}
                        </tbody>
                      </table>
                      <div className="p-3 text-[10px] text-slate-500 bg-slate-900 border-t border-slate-800">
                        * Jangan lupa untuk mengubah form{" "}
                        <b>HPP per Unit Pakai (Rp)</b> di kiri menyesuaikan
                        dengan Estimasi HPP resep.
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-slate-950 rounded-xl border border-dashed border-slate-800 p-6 text-center">
                    <Package size={48} className="mb-4 text-slate-700" />
                    <p className="text-sm font-bold">
                      Resep HPP Tidak Tersedia
                    </p>
                    <p className="text-xs max-w-xs mt-2">
                      Aktifkan "Barang Setengah Jadi" untuk menambahkan racikan
                      ke bahan stok ini.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-950 flex justify-end gap-4">
              <button
                onClick={() => setIngredientModalOpen(false)}
                className="px-6 py-3 rounded-lg text-slate-400 hover:text-white font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleSaveIngredient}
                className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals for Product, Staff, etc. are handled by the main render logic */}
      {productModalOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 w-full max-w-4xl h-[90vh] rounded-2xl border border-slate-800 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold">
                {editingProductId ? "Edit Produk" : "Produk Baru"}
              </h3>
              <button onClick={() => setProductModalOpen(false)}>
                <X className="text-slate-400 hover:text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left: Basic Info */}
              <div className="space-y-4">
                <h4 className="text-brand-500 font-bold uppercase text-sm border-b border-slate-800 pb-2">
                  Informasi Dasar
                </h4>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Nama Produk
                  </label>
                  <input
                    className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white"
                    value={productForm.name}
                    onChange={(e) =>
                      setProductForm({ ...productForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">
                      Harga Jual (Rp)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white"
                        value={productForm.price?.toLocaleString("id-ID") ?? ""}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            price: Number(e.target.value.replace(/\D/g, "")),
                          })
                        }
                      />
                      <button
                        onClick={openPricingSimulator}
                        className="bg-green-900/30 text-green-500 w-12 flex flex-col items-center justify-center rounded hover:bg-green-900/50"
                        title="Simulasi Harga"
                      >
                        <span className="font-serif font-black text-sm">
                          Rp
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">
                      Kategori
                    </label>
                    <select
                      className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white"
                      value={productForm.category}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          category: e.target.value,
                        })
                      }
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    URL Gambar
                  </label>
                  <input
                    className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white"
                    value={productForm.image}
                    onChange={(e) =>
                      setProductForm({ ...productForm, image: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">
                      Komisi Staff (Push Money)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white"
                      value={
                        productForm.staffCommission?.toLocaleString("id-ID") ??
                        ""
                      }
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          staffCommission: Number(
                            e.target.value.replace(/\D/g, ""),
                          ),
                        })
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1 font-bold text-orange-400">
                      Estimasi Waktu (Menit)
                    </label>
                    <input
                      type="number"
                      className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white"
                      value={productForm.standardPrepTime}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          standardPrepTime: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Right: Recipe Builder */}
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                  <h4 className="text-brand-500 font-bold uppercase text-sm">
                    Resep / Formula (HPP)
                  </h4>
                  <span className="text-xs text-slate-400">
                    Total HPP:{" "}
                    <span className="text-white font-mono font-bold">
                      {formatRupiah(
                        productForm.recipe?.reduce(
                          (acc, r) =>
                            acc +
                            (ingredients.find((i) => i.id === r.ingredientId)
                              ?.costPerUnit || 0) *
                              r.amount,
                          0,
                        ) || 0,
                      )}
                    </span>
                  </span>
                </div>

                {/* Add Ingredient Input */}
                <div className="flex gap-2 items-end relative">
                  <div className="flex-1 relative">
                    <label className="block text-xs text-slate-500 mb-1">
                      Cari Bahan
                    </label>
                    <input
                      className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white"
                      value={ingredientSearchQuery}
                      onChange={(e) => {
                        setIngredientSearchQuery(e.target.value);
                        setIsIngredientListOpen(true);
                      }}
                      onFocus={() => setIsIngredientListOpen(true)}
                      placeholder="Ketik nama bahan..."
                    />
                    {isIngredientListOpen && (
                      <div className="absolute top-full left-0 right-0 bg-slate-800 border border-slate-700 max-h-40 overflow-y-auto z-10 rounded shadow-xl mt-1">
                        {filteredIngredientsForRecipe.map((ing) => (
                          <div
                            key={ing.id}
                            className="p-2 hover:bg-slate-700 cursor-pointer text-sm flex justify-between"
                            onClick={() => handleSelectIngredient(ing)}
                          >
                            <span>
                              {ing.name} ({ing.unit})
                            </span>
                            <span className="text-xs text-slate-400">
                              {formatRupiah(ing.costPerUnit)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="w-24">
                    <label className="block text-xs text-slate-500 mb-1">
                      Jml
                    </label>
                    <input
                      type="number"
                      className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white"
                      value={selectedIngredientAmount}
                      onChange={(e) =>
                        setSelectedIngredientAmount(Number(e.target.value))
                      }
                    />
                  </div>
                  <button
                    onClick={addIngredientToRecipe}
                    className="bg-blue-600 p-2 rounded text-white h-10 w-10 flex items-center justify-center"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {/* Recipe List */}
                <div className="bg-slate-950 rounded-lg p-4 min-h-[200px]">
                  {productForm.recipe && productForm.recipe.length > 0 ? (
                    productForm.recipe.map((r, idx) => {
                      const ing = ingredients.find(
                        (i) => i.id === r.ingredientId,
                      );
                      const lineTotal = (ing?.costPerUnit || 0) * r.amount;
                      return (
                        <div
                          key={idx}
                          className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0"
                        >
                          <div>
                            <div className="text-sm font-medium">
                              {ing?.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {formatRupiah(ing?.costPerUnit || 0)} /{" "}
                              {ing?.unit}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-sm text-white"
                                value={r.amount}
                                onChange={(e) =>
                                  updateIngredientAmount(
                                    r.ingredientId,
                                    Number(e.target.value),
                                  )
                                }
                              />
                              <span className="text-xs text-slate-400 w-8">
                                {ing?.unit}
                              </span>
                            </div>
                            <div className="text-right w-24">
                              <div className="text-sm font-bold text-white">
                                {formatRupiah(lineTotal)}
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                removeIngredientFromRecipe(r.ingredientId)
                              }
                              className="text-red-500 hover:text-red-400"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-slate-600 text-center text-sm italic mt-8">
                      Belum ada bahan dalam resep.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 flex justify-end gap-4 bg-slate-900">
              <button
                onClick={() => setProductModalOpen(false)}
                className="px-6 py-3 rounded-lg text-slate-400 hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                onClick={submitProduct}
                className="px-6 py-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold"
              >
                Simpan Produk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Simulator Modal */}
      {isPricingSimOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-900 p-6 rounded-xl w-full max-w-md border border-slate-800">
            <h3 className="font-bold text-xl mb-4 text-green-400 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-900/30 text-green-400 flex items-center justify-center font-serif font-black text-sm">
                Rp
              </div>
              Simulasi Harga Jual
            </h3>

            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">
                    HPP Bahan (Recipe Cost)
                  </span>
                  <span className="font-bold">
                    {formatRupiah(calculateSimulation().rawMaterialCost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm items-center relative">
                  <span className="text-slate-400">
                    Biaya Operasional / Unit
                  </span>
                  <div className="flex gap-2 items-center">
                    <button
                      title="Smart Overhead (Advance COGS)"
                      onClick={() => setShowSmartOverhead(!showSmartOverhead)}
                      className="text-brand-500 hover:text-brand-400 p-1 bg-brand-500/10 rounded overflow-hidden"
                    >
                      <Lightbulb size={14} />
                    </button>
                    <input
                      type="number"
                      className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-white text-xs"
                      value={simParams.overheadCost}
                      onChange={(e) =>
                        setSimParams({
                          ...simParams,
                          overheadCost: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                {showSmartOverhead && (
                  <div className="mt-3 p-3 bg-indigo-950/40 border border-indigo-900/50 rounded-lg text-xs space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator size={14} className="text-indigo-400" />
                      <span className="font-bold text-indigo-300">
                        Smart Overhead (Advance COGS)
                      </span>
                    </div>
                    <p className="text-slate-400 text-[10px] leading-relaxed">
                      Sistem akan menghitung rekomendasi overhead per cup
                      berdasarkan{" "}
                      <span className="text-indigo-300">
                        Total Pengeluaran Operasional (Gaji, Listrik, Sewa, dll)
                      </span>{" "}
                      dibagi dengan{" "}
                      <span className="text-indigo-300">Target Penjualan</span>{" "}
                      Anda.
                    </p>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">
                        Target Penjualan per Bulan (Porsi/Cup)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white"
                          value={targetSalesPerMonth}
                          onChange={(e) =>
                            setTargetSalesPerMonth(Number(e.target.value))
                          }
                        />
                        <button
                          onClick={() =>
                            setSimParams({
                              ...simParams,
                              overheadCost: getSmartOverheadRecommendation(),
                            })
                          }
                          className="whitespace-nowrap px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold transition-all"
                        >
                          Terapkan{" "}
                          {formatRupiah(getSmartOverheadRecommendation())}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-800 my-2 pt-2 flex justify-between font-bold mt-4">
                  <span>Total Cost (COGS)</span>
                  <span>{formatRupiah(calculateSimulation().totalCost)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Target Margin (%)
                  </label>
                  <input
                    type="number"
                    className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white"
                    value={simParams.marginPercent}
                    onChange={(e) =>
                      setSimParams({
                        ...simParams,
                        marginPercent: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Pajak (PB1 %)
                  </label>
                  <input
                    type="number"
                    className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white"
                    value={simParams.taxPercent}
                    onChange={(e) =>
                      setSimParams({
                        ...simParams,
                        taxPercent: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="bg-green-900/20 p-4 rounded-lg border border-green-900/50 text-center">
                <p className="text-xs text-green-400 uppercase font-bold mb-1">
                  Rekomendasi Harga Jual
                </p>
                <h2 className="text-3xl font-bold text-white mb-1">
                  {formatRupiah(calculateSimulation().recommendedPrice)}
                </h2>
                <p className="text-xs text-slate-400">
                  Setelah Pajak:{" "}
                  {formatRupiah(calculateSimulation().priceWithTax)}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setIsPricingSimOpen(false)}
                  className="flex-1 py-3 rounded bg-slate-800 text-slate-400"
                >
                  Tutup
                </button>
                <button
                  onClick={applySimulatedPrice}
                  className="flex-1 py-3 rounded bg-green-600 text-white font-bold"
                >
                  Gunakan Harga Ini
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff Modal */}
      {staffModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 p-6 rounded-xl w-full max-w-md border border-slate-800">
            <h3 className="font-bold text-xl mb-4">
              {editingStaffId ? "Edit Pegawai" : "Tambah Pegawai Baru"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-bold uppercase">
                  Nama Pegawai
                </label>
                <input
                  className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white outline-none"
                  placeholder="Nama Lengkap"
                  value={staffForm.name}
                  onChange={(e) =>
                    setStaffForm({ ...staffForm, name: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1 font-bold uppercase">
                    Role / Posisi
                  </label>
                  <select
                    className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white outline-none"
                    value={staffForm.role}
                    onChange={(e) =>
                      setStaffForm({
                        ...staffForm,
                        role: e.target.value as Role,
                      })
                    }
                  >
                    {Object.values(Role).map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1 font-bold uppercase">
                    PIN Akses (6 Angka)
                  </label>
                  <input
                    className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white outline-none font-mono tracking-widest text-center"
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={staffForm.pin}
                    onChange={(e) =>
                      setStaffForm({
                        ...staffForm,
                        pin: e.target.value.replace(/\D/g, ""),
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-bold uppercase">
                  No. Telepon
                </label>
                <input
                  className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white outline-none"
                  placeholder="0812..."
                  type="tel"
                  value={staffForm.phone || ""}
                  onChange={(e) =>
                    setStaffForm({
                      ...staffForm,
                      phone: e.target.value.replace(/\D/g, ""),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-bold uppercase">
                  Gaji Harian (Rp)
                </label>
                <input
                  className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white outline-none focus:border-brand-500 transition-colors"
                  placeholder="100.000,50"
                  type="text"
                  value={displayDailyRate}
                  onChange={handleDailyRateChange}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-bold uppercase">
                  URL Foto Profil (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-slate-950 border border-slate-700 p-3 rounded-lg text-white outline-none"
                    placeholder="https://..."
                    value={staffForm.avatar || ""}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, avatar: e.target.value })
                    }
                  />
                  <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden border border-slate-700">
                    {staffForm.avatar ? (
                      <img
                        src={staffForm.avatar}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon size={20} className="text-slate-500" />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStaffModalOpen(false)}
                  className="flex-1 py-3 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmitStaff}
                  className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex justify-center items-center gap-2"
                >
                  <Save size={18} /> Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {categoryManagerOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 p-6 rounded-xl w-full max-w-sm border border-slate-800">
            <h3 className="font-bold text-xl mb-4">Kelola Kategori</h3>
            <div className="flex gap-2 mb-4">
              <input
                className="flex-1 bg-slate-950 border border-slate-700 p-2 rounded text-white"
                placeholder="Kategori Baru"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <button
                onClick={handleAddCategory}
                className="bg-blue-600 p-2 rounded text-white"
              >
                <Plus />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categories.map((c) => (
                <div
                  key={c}
                  className="flex justify-between items-center bg-slate-800 p-2 rounded"
                >
                  <span className="text-sm">{c}</span>
                  {c !== "COFFEE" && c !== "NON_COFFEE" && c !== "FOOD" && (
                    <button
                      onClick={() => removeCategory(c)}
                      className="text-red-500"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setCategoryManagerOpen(false)}
              className="w-full mt-4 py-2 text-slate-500"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {isAddingPromo && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-md border border-slate-800 shadow-2xl relative overflow-hidden">
            {/* Ambient Background subtle light glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 rounded-full blur-2xl pointer-events-none" />
            
            <h3 className="font-extrabold text-xl mb-4 text-white flex items-center gap-2">
              <Gift size={20} className="text-orange-500 animate-pulse" />
              {editingPromoId ? "Edit Promo" : "Buat Promosi Baru"}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 tracking-wider mb-1">Nama Promo</label>
                <input
                  className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 focus:outline-none p-3 rounded text-white font-semibold text-sm transition-all"
                  placeholder="Contoh: Coraq Happy Hour"
                  value={promoForm.name}
                  onChange={(e) =>
                    setPromoForm({ ...promoForm, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 tracking-wider mb-1">Potongan Harga</label>
                <div className="flex gap-2">
                  <select
                    className="bg-slate-950 border border-slate-800 focus:border-orange-500 focus:outline-none p-3 rounded text-white w-1/3 text-sm font-semibold transition-all"
                    value={promoForm.type}
                    onChange={(e) =>
                      setPromoForm({ ...promoForm, type: e.target.value as any })
                    }
                  >
                    <option value="PERCENTAGE">% Diskon</option>
                    <option value="FIXED">Rp Potongan</option>
                  </select>
                  <input
                    type="number"
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-orange-500 focus:outline-none p-3 rounded text-white font-mono font-bold text-sm transition-all text-right"
                    placeholder="Nilai"
                    value={promoForm.value || ""}
                    onChange={(e) =>
                      setPromoForm({
                        ...promoForm,
                        value: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 tracking-wider mb-1">Min. Belanja (Optional)</label>
                <input
                  type="number"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 focus:outline-none p-3 rounded text-white font-mono text-sm transition-all text-right"
                  placeholder="Rp 0 (Tanpa Minimum)"
                  value={promoForm.minSpend || ""}
                  onChange={(e) =>
                    setPromoForm({
                      ...promoForm,
                      minSpend: Number(e.target.value),
                    })
                  }
                />
              </div>

              {/* Time Restriction (Optional Happy Hour) */}
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 tracking-wider mb-1">Jam Aktif Promo (Optional Happy Hour)</label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-orange-500 focus:outline-none p-3 rounded text-white font-mono text-sm transition-all"
                    value={promoForm.happyHourStart || ""}
                    onChange={(e) =>
                      setPromoForm({
                        ...promoForm,
                        happyHourStart: e.target.value,
                      })
                    }
                  />
                  <input
                    type="time"
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-orange-500 focus:outline-none p-3 rounded text-white font-mono text-sm transition-all"
                    value={promoForm.happyHourEnd || ""}
                    onChange={(e) =>
                      setPromoForm({ ...promoForm, happyHourEnd: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* GACOR DATE SELECTOR MODE */}
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 tracking-wider mb-2">Penjadwalan Hari & Tanggal Berlaku 📅</label>
                <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 mb-3 text-center">
                  <button
                    type="button"
                    onClick={() => setPromoDateMode("ALWAYS")}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                      promoDateMode === "ALWAYS" 
                      ? "bg-slate-800 text-white" 
                      : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Selamanya
                  </button>
                  <button
                    type="button"
                    onClick={() => setPromoDateMode("SPECIFIC")}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                      promoDateMode === "SPECIFIC" 
                      ? "bg-slate-800 text-white" 
                      : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Tertentu
                  </button>
                  <button
                    type="button"
                    onClick={() => setPromoDateMode("RANGE")}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                      promoDateMode === "RANGE" 
                      ? "bg-slate-800 text-white" 
                      : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Berjenjang
                  </button>
                </div>

                {/* Sub-inputs dependent on date selection mode (GACOR CALENDAR STYLE) */}
                {promoDateMode === "SPECIFIC" && (
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-orange-500/30 space-y-1.5 animate-fade-in">
                    <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                      📅 TANGGAL PILIHAN
                    </span>
                    <input
                      type="date"
                      className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-white focus:outline-none focus:border-orange-500 font-mono text-sm leading-none"
                      value={promoForm.startDate || ""}
                      onChange={(e) => setPromoForm({ ...promoForm, startDate: e.target.value })}
                    />
                  </div>
                )}

                {promoDateMode === "RANGE" && (
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-orange-500/30 space-y-2 animate-fade-in">
                    <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                      📅 RENTANG TANGGAL (JENJANG)
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-left">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Mulai Dari</label>
                        <input
                          type="date"
                          className="w-full bg-slate-900 border border-slate-705 p-2 rounded text-white focus:outline-none focus:border-orange-500 font-mono text-xs"
                          value={promoForm.startDate || ""}
                          onChange={(e) => setPromoForm({ ...promoForm, startDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Hingga Akhir</label>
                        <input
                          type="date"
                          className="w-full bg-slate-900 border border-slate-705 p-2 rounded text-white focus:outline-none focus:border-orange-500 font-mono text-xs"
                          value={promoForm.endDate || ""}
                          onChange={(e) => setPromoForm({ ...promoForm, endDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 tracking-wider mb-1">Deskripsi Singkat</label>
                <input
                  className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 focus:outline-none p-3 rounded text-white text-sm transition-all"
                  placeholder="Deskripsi promo ini..."
                  value={promoForm.description || ""}
                  onChange={(e) =>
                    setPromoForm({ ...promoForm, description: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingPromo(false);
                    setEditingPromoId(null);
                    setPromoForm({
                      name: "",
                      type: "PERCENTAGE",
                      value: 0,
                      minSpend: 0,
                      active: true,
                      startDate: "",
                      endDate: "",
                    });
                    setPromoDateMode("ALWAYS");
                  }}
                  className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-400 font-bold hover:bg-slate-750 transition-all text-sm"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmitPromo}
                  className="flex-1 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold shadow-lg shadow-orange-950/40 text-sm transition-all active:scale-95"
                >
                  {editingPromoId ? "Perbarui" : "Simpan Promo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CRM OUTREACH MODAL (WhatsApp Campaign Integration) --- */}
      {outreachModalOpen && outreachMember && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[240] p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

            <header className="p-6 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-950/60 rounded-2xl border border-emerald-700/30 text-emerald-400">
                  <MessageSquare size={22} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Kirim Outreach CRM</h3>
                  <p className="text-xs text-slate-400">
                    Menghubungi <strong className="text-white">{outreachMember.fullName}</strong> ({outreachMember.tier})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOutreachModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </header>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Tipe Outreach Toggle */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-2">
                  Kategori Outreach / Campaign
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleOutreachTypeChange("BIRTHDAY")}
                    className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      outreachType === "BIRTHDAY"
                        ? "bg-pink-900/20 border-pink-700/50 text-pink-300"
                        : "bg-slate-950/50 border-slate-850 text-slate-400 hover:text-white hover:bg-slate-950"
                    }`}
                  >
                    <Gift size={14} /> Ulang Tahun 🎂
                  </button>
                  <button
                    onClick={() => handleOutreachTypeChange("DORMANT")}
                    className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      outreachType === "DORMANT"
                        ? "bg-amber-900/20 border-amber-700/50 text-amber-300"
                        : "bg-slate-950/50 border-slate-850 text-slate-400 hover:text-white hover:bg-slate-950"
                    }`}
                  >
                    <Clock size={14} /> Lama Tak Mampir 💤
                  </button>
                </div>
              </div>

              {/* SINKRONISASI PROMO (Integrated with Marketing module) */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">
                  Lampirkan Promo (Sinkron Database Marketing) 🎟️
                </label>
                <select
                  value={outreachPromoId}
                  onChange={(e) => handleOutreachPromoChange(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 text-xs font-bold p-3.5 rounded-xl border border-slate-850 focus:outline-none focus:border-emerald-600 transition-colors"
                >
                  <option value="">-- Tanpa Lampiran Promo (Hanya Sapaan) --</option>
                  {promotions.map((promo) => (
                    <option key={promo.id} value={promo.id}>
                      {promo.name} ({promo.type === "PERCENTAGE" ? `${promo.value}%` : `Diskon Rp ${promo.value}`})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  *Voucher akan diambil langsung secara realtime dari list promo aktif di departemen marketing.
                </p>
              </div>

              {/* Message Editor */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500">
                    Edit Pesan WhatsApp
                  </label>
                  <button
                    onClick={() => setOutreachMessage(getOutreachDefaultMessage(outreachMember, outreachType, outreachPromoId))}
                    className="text-[10px] text-brand-400 hover:text-brand-300 font-bold transition-colors"
                  >
                    Reset Template Semula
                  </button>
                </div>
                <textarea
                  value={outreachMessage}
                  onChange={(e) => setOutreachMessage(e.target.value)}
                  rows={5}
                  className="w-full bg-slate-950 text-white p-3.5 rounded-xl text-xs font-medium border border-slate-850 focus:outline-none focus:border-emerald-600 leading-relaxed font-sans"
                  placeholder="Ketik pesan kustom WhatsApp..."
                />
              </div>

              {/* Live Preview (WhatsApp bubble emulator) */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-850 space-y-2">
                <div className="text-[9px] uppercase font-black tracking-widest text-slate-500 text-center">
                  Pratinjau Tampilan Pesan di HP Member
                </div>
                <div className="bg-[#0b141a] p-3 rounded-xl max-w-[85%] ml-auto border-l-4 border-emerald-500 relative shadow-md">
                  <p className="text-white text-xs font-normal whitespace-pre-wrap leading-relaxed font-sans">
                    {outreachMessage || "Masukan tulisan pesan anda..."}
                  </p>
                  <div className="text-[9px] text-emerald-400/80 font-mono text-right mt-1.5 flex items-center justify-end gap-1 select-none">
                    <span>{new Date().toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" })}</span>
                    <span>✓✓</span>
                  </div>
                </div>
              </div>
            </div>

            <footer className="p-6 border-t border-slate-850 bg-slate-950/40 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOutreachModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-755 transition-colors font-bold text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSendOutreachWhatsApp}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs active:scale-95 shadow transition-all flex items-center gap-1.5"
              >
                <MessageSquare size={14} /> Mulai Chat WhatsApp
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* --- CONFIRM DIALOG MODAL --- */}
      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[250] p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl text-center p-6">
            <AlertTriangle size={48} className="text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Konfirmasi</h3>
            <p className="text-slate-400 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-4">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-lg font-bold"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="flex-1 py-3 bg-brand-600 text-white rounded-lg font-bold"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ALERT DIALOG MODAL --- */}
      {alertDialog?.isOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[260] p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl text-center p-6">
            {alertDialog.type === "success" && (
              <CheckCircle
                size={48}
                className="text-emerald-500 mx-auto mb-4"
              />
            )}
            {alertDialog.type === "error" && (
              <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
            )}
            {alertDialog.type === "info" && (
              <AlertTriangle size={48} className="text-blue-500 mx-auto mb-4" />
            )}

            <h3 className="text-xl font-bold text-white mb-2">
              {alertDialog.type === "success"
                ? "Berhasil"
                : alertDialog.type === "error"
                  ? "Gagal"
                  : "Informasi"}
            </h3>
            <p className="text-slate-400 mb-6">{alertDialog.message}</p>
            <button
              onClick={() => setAlertDialog(null)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* --- RECEIPT DETAIL MODAL --- */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[120] p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-xl">
              <div>
                <h3 className="text-xl font-black text-white">Detail Nota</h3>
                <p className="text-xs text-brand-400 font-mono font-bold uppercase tracking-widest">
                  {selectedOrderDetails.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/50">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">
                    Waktu
                  </p>
                  <p className="text-sm font-bold text-white">
                    {new Date(selectedOrderDetails.createdAt).toLocaleString(
                      "id-ID",
                    )}
                  </p>
                </div>
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/50">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">
                    Kasir
                  </p>
                  <p className="text-sm font-bold text-white">
                    {selectedOrderDetails.cashierName}
                  </p>
                </div>
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/50">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">
                    Pelanggan
                  </p>
                  <p className="text-sm font-bold text-white">
                    {selectedOrderDetails.customerName || "Guest"}
                  </p>
                </div>
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/50">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">
                    Nomor Pager
                  </p>
                  <p className="text-sm font-bold text-white">
                    #{selectedOrderDetails.pagerNumber}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Utensils size={14} /> Daftar Pesanan
                </h4>
                <div className="space-y-3">
                  {selectedOrderDetails.items.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 flex justify-between items-start"
                    >
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-brand-400 font-black">
                          {item.quantity}x
                        </div>
                        <div>
                          <p className="font-bold text-white">
                            {item.productName}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.modifiers?.map((mod: any, mIdx: number) => (
                              <span
                                key={mIdx}
                                className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded"
                              >
                                {mod.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="font-mono font-bold text-white text-sm">
                        {formatRupiah(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-white font-mono">
                    {formatRupiah(selectedOrderDetails.subtotal)}
                  </span>
                </div>
                {selectedOrderDetails.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-500">Diskon</span>
                    <span className="text-emerald-500 font-mono">
                      -{formatRupiah(selectedOrderDetails.discount)}
                    </span>
                  </div>
                )}
                <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-lg font-black text-white uppercase tracking-tighter">
                    Total Akhir
                  </span>
                  <span className="text-2xl font-mono font-black text-brand-500">
                    {formatRupiah(selectedOrderDetails.finalAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                    Metode Bayar
                  </span>
                  <span className="text-[10px] bg-brand-600/20 text-brand-400 px-2 py-1 rounded font-black uppercase">
                    {selectedOrderDetails.paymentMethod}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex gap-3">
              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    message: `Yakin ingin membatalkan (VOID) transaksi ${selectedOrderDetails.id}? Stok akan dikembalikan.`,
                    onConfirm: () => {
                      voidOrder(selectedOrderDetails.id);
                      setSelectedOrderDetails(null);
                      setAlertDialog({
                        isOpen: true,
                        message: "Transaksi berhasil di-VOID",
                        type: "success",
                      });
                    },
                  });
                }}
                disabled={selectedOrderDetails.paymentStatus === "VOID"}
                className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                  selectedOrderDetails.paymentStatus === "VOID"
                    ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                    : "bg-red-900/20 text-red-500 hover:bg-red-600 hover:text-white"
                }`}
              >
                <Trash2 size={18} /> VOID TRANSAKSI
              </button>
              <button
                onClick={() =>
                  setAlertDialog({
                    isOpen: true,
                    message: "Fitur cetak ulang akan segera hadir!",
                    type: "info",
                  })
                }
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Plus size={18} /> CETAK ULANG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
