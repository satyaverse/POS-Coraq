
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, CartItem, Modifier, ProductCategory, Member, Tier, MemberStatus, OrderStatus, Order, Ingredient } from '../../types';
import { PRODUCTS, TIER_RULES } from '../../constants'; 
import { 
  Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, 
  User as UserIcon, LogOut, ChevronRight, AlertCircle, Coffee, Star, UserPlus, X, Gift, Megaphone,
  CupSoda, Utensils, Cookie, LayoutGrid, Clock, List, AlertTriangle, ChevronDown, ChevronUp, Camera, RefreshCcw, Aperture,
  FileText, ChefHat, CheckCircle, Calculator, ShoppingBag, ArrowRight, ShieldAlert, QrCode, Scan, Image as ImageIcon, Upload,
  MessageSquare, Calendar
} from 'lucide-react';

import { Html5QrcodeScanner, Html5Qrcode, Html5QrcodeSupportedFormats, Html5QrcodeScannerState } from 'html5-qrcode';
import { compressImage } from '../../utils/imageCompression';
import { CartPanel } from './CartPanel';
import { ProductGrid } from './ProductGrid';
import { ShiftModal } from './ShiftModal';
import { PaymentModal } from './PaymentModal';
import { HoldDebtPanel } from './HoldDebtPanel';
import { PurchaseModal } from './PurchaseModal';

export const POSView: React.FC = () => {
  const { createOrder, findMember, addMember, currentUser, logout, activeShift, startShift, endShift, getShiftSummary, categories, getActivePromotions, storeConfig, modifiers, orders, voidOrder, members, markOrderAsDebt, payDebt, ingredients, purchaseIngredient, users, bindMemberCard, clockOut, expenses, voidPurchase, promotions, isInitializing } = useStore();
  
  const shiftPurchases = activeShift ? expenses.filter(exp => {
     if (exp.category !== 'PURCHASE') return false;
     return new Date(exp.date).getTime() >= new Date(activeShift.startTime).getTime();
  }) : [];

  // Calculate today's birthday members
  const todayBirthdayMembers = members.filter(m => {
    if (!m.birthDate) return false;
    const today = new Date();
    const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
    const todayDay = String(today.getDate()).padStart(2, '0');
    const targetMD = `${todayMonth}-${todayDay}`; // "05-30"

    const parts = m.birthDate.split('-');
    if (parts.length === 3) {
      return `${parts[1]}-${parts[2]}` === targetMD;
    }
    return false;
  });

  // Calculate inactive/dormant members (> 30 days of no visits)
  const dormantMembers = members.filter(m => {
    const refDateStr = m.lastVisit || m.joinDate;
    if (!refDateStr) return false;
    const refDate = new Date(refDateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - refDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 30;
  });

  // CRM & Outreach Modal States
  const [crmModalOpen, setCrmModalOpen] = useState(false);
  const [crmActiveTab, setCrmActiveTab] = useState<'BIRTHDAY' | 'DORMANT'>('BIRTHDAY');
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
    alert(`Pesan kustom outreach berhasil dialihkan ke WhatsApp untuk member ${outreachMember.fullName}!`);
  };
  
  // Local POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [memberQuery, setMemberQuery] = useState('');
  const [activeMemberRaw, setActiveMember] = useState<Member | null>(null);
  const activeMember = activeMemberRaw ? members.find(m => m.id === activeMemberRaw.id || (m.status === MemberStatus.ACTIVE && m.phone === activeMemberRaw.phone)) || activeMemberRaw : null;
  const [pagerNumber, setPagerNumber] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [modifiersModalOpen, setModifiersModalOpen] = useState(false);
  const [tempModifiers, setTempModifiers] = useState<Modifier[]>([]);
  const [tempQuantity, setTempQuantity] = useState(1);
  
  // Active Editing Order State (Copy & Edit Logic)
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeOrderIsDebt, setActiveOrderIsDebt] = useState(false); // Track if paying debt
  
  // Payment States
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [cashRecieved, setCashRecieved] = useState<string>('');
  const [activePaymentMethod, setActivePaymentMethod] = useState<'CASH' | 'QRIS' | 'DEBIT' | null>(null); // For Accordion Logic
  
  // Camera State for Payment Proof & Member Photo
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);

  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [startCash, setStartCash] = useState('');
  
  // Closing Shift States
  const [closingModalOpen, setClosingModalOpen] = useState(false);
  const [closingStep, setClosingStep] = useState<'INPUT' | 'REPORT'>('INPUT');
  const [actualEndCash, setActualEndCash] = useState<string>('');
  const [shiftSummary, setShiftSummary] = useState<{startCash: number, cashSales: number, nonCashSales: number, debt: number, expenses: number, expectedCash: number} | null>(null);
  
  const [activeTab, setActiveTab] = useState<'MENU' | 'HISTORY'>('MENU');
  const [historySearch, setHistorySearch] = useState('');
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<Order | null>(null);
  const [managerPinModal, setManagerPinModal] = useState<{isOpen: boolean, orderId: string} | null>(null);
  const [managerPin, setManagerPin] = useState('');

  // Logout Confirmation State
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);

  // PURCHASE (SHOPPING) STATE
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, message: string, onConfirm: () => void} | null>(null);
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [purchaseForm, setPurchaseForm] = useState({
      buyQty: 1,
      buyUnit: '', 
      conversionRate: 1, 
      totalPrice: '' as string | number, // Changed to string|number for better decimal handling
      paymentSource: 'CASH_DRAWER' as 'CASH_DRAWER' | 'TRANSFER',
      transferProof: null as string | null
  });
  const [purchaseTab, setPurchaseTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [purchaseVoidModal, setPurchaseVoidModal] = useState<{isOpen: boolean, expenseId: string} | null>(null);
  const [purchaseVoidPin, setPurchaseVoidPin] = useState('');
  const [birthdayModalOpen, setBirthdayModalOpen] = useState(false);

  const [pagerErrorShake, setPagerErrorShake] = useState(false);
  
  // Pager Conflict State
  const [pagerConflict, setPagerConflict] = useState<Order | null>(null);

  // Points Redemption State
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  // Add Member State
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [newMemberFullName, setNewMemberFullName] = useState('');
  const [newMemberNickname, setNewMemberNickname] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberBirthDate, setNewMemberBirthDate] = useState('');
  const [newMemberGender, setNewMemberGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [newMemberPhoto, setNewMemberPhoto] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('environment');
  const [isMemberConfirmOpen, setIsMemberConfirmOpen] = useState(false);

  // QR Scanner State
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isScanSuccessFlash, setIsScanSuccessFlash] = useState(false);
  const [posBindingMemberId, setPosBindingMemberId] = useState<string | null>(null);
  const [manualMemberCardCode, setManualMemberCardCode] = useState('');
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  // Order List (Pending/Hold) State
  const [orderListModalOpen, setOrderListModalOpen] = useState(false);
  const [orderListTab, setOrderListTab] = useState<'HOLD' | 'DEBT' | 'KITCHEN'>('HOLD');
  
  // Hold Bill Name Input State
  const [holdNameModalOpen, setHoldNameModalOpen] = useState(false);
  const [manualCustomerName, setManualCustomerName] = useState('');

  // Utility for Indonesian "Terbilang"
  const angkaKeTerbilang = (n: number): string => {
    const bilangan = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    if (n < 12) return bilangan[n];
    if (n < 20) return angkaKeTerbilang(n - 10) + " Belas";
    if (n < 100) return angkaKeTerbilang(Math.floor(n / 10)) + " Puluh " + angkaKeTerbilang(n % 10);
    if (n < 200) return "Seratus " + angkaKeTerbilang(n - 100);
    if (n < 1000) return angkaKeTerbilang(Math.floor(n / 100)) + " Ratus " + angkaKeTerbilang(n % 100);
    if (n < 2000) return "Seribu " + angkaKeTerbilang(n - 1000);
    if (n < 1000000) return angkaKeTerbilang(Math.floor(n / 1000)) + " Ribu " + angkaKeTerbilang(n % 1000);
    if (n < 1000000000) return angkaKeTerbilang(Math.floor(n / 1000000)) + " Juta " + angkaKeTerbilang(n % 1000000);
    return "Angka terlalu besar";
  };

  // Helper
  const formatRupiah = (value: number) => {
    return value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 2 });
  };

  const handleStartCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setStartCash('');
      return;
    }
    const formatted = new Intl.NumberFormat('id-ID').format(Number(rawValue));
    setStartCash(formatted);
  };

  const [cameraDevices, setCameraDevices] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const taskQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (isQRScannerOpen) {
      Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length > 0) {
          setCameraDevices(devices);
          // Try to find environment/back camera automatically
          const backCamera = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCamera ? backCamera.id : devices[0].id);
        }
      }).catch(err => console.error("Error getting cameras:", err));
    }
  }, [isQRScannerOpen]);

  useEffect(() => {
    let isMounted = true;

    if (!qrScannerRef.current) {
      qrScannerRef.current = new Html5Qrcode("qr-reader");
    }

    const doStop = async () => {
      const scanner = qrScannerRef.current;
      try {
        if (scanner && (scanner.isScanning || scanner.getState() === Html5QrcodeScannerState.SCANNING || scanner.getState() === Html5QrcodeScannerState.PAUSED)) {
          await scanner.stop();
          await new Promise(r => setTimeout(r, 250)); // let hardware release
        }
      } catch (e) {
        // Suppress expected clear error
        qrScannerRef.current = null;
      }
      try {
        if (scanner) {
          scanner.clear();
        }
      } catch (e) {
         // Suppress expected stop error
      } finally {
        qrScannerRef.current = null;
      }
    };

    const doStart = async () => {
      try {
        if (!isQRScannerOpen || !selectedCameraId) {
          await doStop();
          return;
        }

        await doStop(); // Ensure any previous camera is fully stopped

        if (!isMounted) return;

        if (!qrScannerRef.current) {
          qrScannerRef.current = new Html5Qrcode("qr-reader");
        }
        const currentScanner = qrScannerRef.current;

        const config = { 
          fps: 10,
          qrbox: { width: 250, height: 250 }
        };
        await currentScanner.start(
          selectedCameraId, 
          config,
          (decodedText) => {
            if (!isMounted) return;
            if (posBindingMemberId) {
               setManualMemberCardCode(decodedText);
               return;
            }
            const member = findMember(decodedText);
            if (member) {
              if (member.status !== MemberStatus.ACTIVE) {
                 const ts = Date.now();
                 // @ts-ignore
                 if (!window._lastScanNotActiveAlert || ts - window._lastScanNotActiveAlert > 3000) {
                    // @ts-ignore
                    window._lastScanNotActiveAlert = ts;
                    alert("Status member belum aktif, kartu perlu di-bind. (Cari lewat manual untuk bind)");
                 }
                 return;
              }
              setIsScanSuccessFlash(true);
              setActiveMember(member);
              setTimeout(() => {
                if (isMounted) {
                  setIsQRScannerOpen(false);
                  setIsScanSuccessFlash(false);
                }
              }, 800);
            } else {
              // Throttle not-found alerts to avoid excessive popups
              const ts = Date.now();
              // @ts-ignore
              if (!window._lastScanNotFoundAlert || ts - window._lastScanNotFoundAlert > 3000) {
                 // @ts-ignore
                 window._lastScanNotFoundAlert = ts;
                 alert(`Kartu tidak dikenali / Belum di-bind: ${decodedText}`);
              }
            }
          },
          (errorMessage) => {
            // ignore common parse errors
          }
        );
      } catch (err) {
        console.error("Gagal memulai scanner:", err);
      }
    };

    taskQueueRef.current = taskQueueRef.current.then(doStart);

    return () => {
      isMounted = false;
      taskQueueRef.current = taskQueueRef.current.then(doStop);
    };
  }, [isQRScannerOpen, selectedCameraId, posBindingMemberId]);

  // Check Shift Status on Mount - only after data has loaded from server
  useEffect(() => {
    if (!isInitializing && !activeShift && currentUser?.role === 'CASHIER') {
      setShiftModalOpen(true);
    } else if (activeShift) {
      // If shift is loaded (e.g. after login in new browser), close the modal
      setShiftModalOpen(false);
    }
  }, [activeShift, currentUser, isInitializing]);

  // Real-time Pager Validation
  useEffect(() => {
    if (!pagerNumber) {
        setPagerConflict(null);
        return;
    }

    const conflict = orders.find(o => 
        o.pagerNumber === pagerNumber && 
        o.status !== OrderStatus.COMPLETED && 
        o.status !== OrderStatus.CANCELLED &&
        o.id !== activeOrderId
    );

    setPagerConflict(conflict || null);
  }, [pagerNumber, orders, activeOrderId]);

  // ... (Camera Logic Omitted for brevity, kept same)
  const handlePaymentMethodClick = (method: 'CASH' | 'QRIS' | 'DEBIT') => {
      if (activePaymentMethod === method) {
          setActivePaymentMethod(null);
          stopCamera();
      } else {
          stopCamera();
          setProofImage(null); 
          setActivePaymentMethod(method);
          if (method === 'QRIS' || method === 'DEBIT') {
              startCamera();
          }
      }
  };
  
  useEffect(() => {
      if (!paymentModalOpen) {
          stopCamera();
          setProofImage(null);
          setActivePaymentMethod(null);
      }
      return () => stopCamera();
  }, [paymentModalOpen]);


  // Derived Calculations
  let displaySubtotal = 0;
  let displayTotal = 0;
  let displayPromoDiscount = 0;
  let displayTierDiscount = 0;
  let displayPointDiscount = 0;

  if (activeOrderIsDebt && activeOrderId) {
      const debtOrder = orders.find(o => o.id === activeOrderId);
      if (debtOrder) {
          displayTotal = debtOrder.finalAmount;
          displaySubtotal = debtOrder.totalAmount;
          displayTierDiscount = 0;
          displayPromoDiscount = 0; 
          displayPointDiscount = debtOrder.pointsRedeemed * storeConfig.pointValue;
      }
  } else {
      displaySubtotal = cart.reduce((acc, item) => {
        const itemTotal = item.product.price + item.modifiers.reduce((mAcc, m) => mAcc + m.price, 0);
        return acc + (itemTotal * item.quantity);
      }, 0);
      
      const activePromos = getActivePromotions();
      activePromos.forEach(p => {
        if (p.minSpend && displaySubtotal < p.minSpend) return;
        if (p.type === 'PERCENTAGE') displayPromoDiscount += displaySubtotal * (p.value / 100);
        else if (p.type === 'FIXED') displayPromoDiscount += p.value;
      });

      displayTierDiscount = activeMember && activeMember.status === MemberStatus.ACTIVE ? displaySubtotal * TIER_RULES[activeMember.tier].discount : 0;
      displayPointDiscount = pointsToRedeem * storeConfig.pointValue;

      displayTotal = Math.max(0, displaySubtotal - displayTierDiscount - displayPromoDiscount - displayPointDiscount);
  }

  const cashVal = parseInt(cashRecieved.replace(/\./g, '')) || 0;
  const change = Math.max(0, cashVal - displayTotal);
  const canPay = cashVal >= displayTotal;

  const pendingOrdersCount = orders.filter(o => o.status === OrderStatus.PENDING).length;
  const unpaidDebtCount = orders.filter(o => o.paymentStatus === 'UNPAID' && o.status !== OrderStatus.PENDING).length;
  const preparingOrdersCount = orders.filter(o => o.status === OrderStatus.PREPARING).length;

  const getQuickCashSuggestions = (totalAmount: number) => {
    const suggestions = [totalAmount];
    const notes = [10000, 20000, 50000, 100000];
    notes.forEach(note => {
        if (note >= totalAmount && !suggestions.includes(note)) {
            suggestions.push(note);
        }
    });
    if (totalAmount > 100000) {
        const next50 = Math.ceil(totalAmount / 50000) * 50000;
        if (!suggestions.includes(next50)) suggestions.push(next50);
        const next100 = Math.ceil(totalAmount / 100000) * 100000;
        if (!suggestions.includes(next100)) suggestions.push(next100);
    }
    return suggestions.sort((a, b) => a - b).slice(0, 4);
  };

  const quickCashOptions = getQuickCashSuggestions(displayTotal);

  const getCategoryIcon = (cat: string) => {
    if (cat === 'ALL') return <LayoutGrid size={24} />;
    if (cat.includes('COFFEE')) return <Coffee size={24} />;
    if (cat.includes('NON_COFFEE')) return <CupSoda size={24} />;
    if (cat.includes('FOOD')) return <Utensils size={24} />;
    if (cat.includes('DESSERT')) return <Cookie size={24} />;
    return <Coffee size={24} />;
  };

  const getRelevantModifiers = (product: Product, type: 'SUGAR' | 'ICE' | 'ADDON') => {
    return modifiers.filter(m => {
      if (m.type !== type) return false;
      if (m.targetCategories && m.targetCategories.length > 0 && !m.targetCategories.includes(product.category)) return false;
      return true;
    });
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setTempModifiers([]);
    setTempQuantity(1); 
    
    const hasSugar = getRelevantModifiers(product, 'SUGAR').length > 0;
    const hasIce = getRelevantModifiers(product, 'ICE').length > 0;
    const hasAddon = getRelevantModifiers(product, 'ADDON').length > 0;

    if (hasSugar || hasIce || hasAddon) {
       const defaults = modifiers.filter(m => 
         (m.name === 'Normal Sugar' || m.name === 'Normal Ice') && 
         (!m.targetCategories || m.targetCategories.includes(product.category))
       );
       setTempModifiers(defaults);
       setModifiersModalOpen(true);
    } else {
      addToCart(product, [], 1);
    }
  };

  const toggleModifier = (mod: Modifier) => {
    setTempModifiers(prev => {
      if (mod.type !== 'ADDON') {
        const filtered = prev.filter(m => m.type !== mod.type);
        return [...filtered, mod];
      }
      const exists = prev.find(m => m.id === mod.id);
      if (exists) return prev.filter(m => m.id !== mod.id);
      return [...prev, mod];
    });
  };

  const addToCart = (product: Product, mods: Modifier[], quantity: number) => {
    const newItem: CartItem = {
      tempId: Date.now().toString(),
      product,
      quantity,
      modifiers: mods
    };
    setCart(prev => [...prev, newItem]);
    setModifiersModalOpen(false);
    setSelectedProduct(null);
  };

  const updateCartQuantity = (tempId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.tempId === tempId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.tempId !== id));
  };

  const handleMemberSearch = () => {
    const member = findMember(memberQuery);
    if (member) {
      if (member.status !== MemberStatus.ACTIVE) {
        alert("Kartu Member belum di-bind! Silahkan hubungkan dengan kartu fisik.");
      }
      setActiveMember(member);
      setMemberQuery('');
      setPointsToRedeem(0); 
    } else {
      alert("Member tidak ditemukan");
    }
  };

  const handleAddMember = () => {
    if (newMemberFullName && newMemberNickname && newMemberPhone) {
      setIsMemberConfirmOpen(true);
    } else {
      alert("Nama Lengkap, Panggilan, dan No WA wajib diisi");
    }
  };

  const confirmAddMember = () => {
    const newMember = addMember(
      newMemberFullName,
      newMemberNickname,
      newMemberPhone,
      newMemberPhoto || undefined,
      newMemberBirthDate || undefined,
      newMemberGender
    );
    setAddMemberModalOpen(false);
    setIsMemberConfirmOpen(false);
    setNewMemberFullName('');
    setNewMemberNickname('');
    setNewMemberPhone('');
    setNewMemberBirthDate('');
    setNewMemberGender('MALE');
    setNewMemberPhoto(null);
    setActiveMember(newMember); 
    alert(`Member baru berhasil didaftarkan!\nStatus: MENUNGGU KARTU\nKartu bisa diambil besok.`);
  };

  const startCamera = async (isForMember: boolean = false) => {
    if (isForMember) setIsCameraOpen(true);
    else setIsCameraLoading(true);
    
    try {
      // Close existing stream if any
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: cameraFacingMode } 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Gagal mengakses kamera. Pastikan izin diberikan.");
      if (isForMember) setIsCameraOpen(false);
      else setIsCameraLoading(false);
    }
  };

  const toggleCamera = async (isForMember: boolean = false) => {
    const newMode = cameraFacingMode === 'user' ? 'environment' : 'user';
    setCameraFacingMode(newMode);
    
    // If camera is already open, restart it with new mode
    if ((isForMember && isCameraOpen) || (!isForMember && activePaymentMethod)) {
      // We need to wait for state to update or use the new value directly
      try {
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: newMode } 
        });
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error toggling camera:", err);
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setIsCameraLoading(false);
  };

  const capturePhoto = (isForMember: boolean = false) => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const photoData = canvas.toDataURL('image/jpeg');
        if (isForMember) {
          setNewMemberPhoto(photoData);
          stopCamera();
        } else {
          setProofImage(photoData);
          stopCamera();
        }
      }
    }
  };

  const handlePayClick = () => {
    if (!pagerNumber) {
      setPagerErrorShake(true);
      setTimeout(() => setPagerErrorShake(false), 500); 
      return;
    }
    setCashRecieved(''); 
    setActivePaymentMethod(null); 
    setPaymentModalOpen(true);
  }

  const handleHoldBillClick = () => {
    if (!pagerNumber) {
        setPagerErrorShake(true);
        setTimeout(() => setPagerErrorShake(false), 500);
        return;
    }

    if (activeMember) {
        createHoldOrder(activeMember.name);
    } else {
        setHoldNameModalOpen(true);
    }
  };

  const createHoldOrder = async (name: string) => {
    const msg = await createOrder(
        cart, 
        activeMember, 
        pagerNumber, 
        'CASH', 
        pointsToRedeem, 
        OrderStatus.PENDING, 
        undefined, 
        undefined, 
        name 
    );
    if (msg) {
        alert(msg);
        if (activeOrderId) {
            voidOrder(activeOrderId);
        }
        resetPOS();
    }
  };

  const processPayment = async (method: 'CASH' | 'QRIS' | 'DEBIT') => {
    if (activeOrderIsDebt && activeOrderId) {
        const msg = await payDebt(activeOrderId, method, method === 'CASH' ? cashVal : undefined, method === 'CASH' ? change : undefined, proofImage || undefined);
        alert(msg);
        setPaymentModalOpen(false);
        setActiveOrderIsDebt(false);
        resetPOS();
        return;
    }

    if (method === 'CASH' && !canPay) {
        alert("Nominal pembayaran kurang!");
        return;
    }

    const msg = await createOrder(
        cart, 
        activeMember, 
        pagerNumber, 
        method, 
        pointsToRedeem, 
        OrderStatus.PREPARING,
        method === 'CASH' ? cashVal : undefined,
        method === 'CASH' ? change : undefined,
        activeMember?.name, 
        proofImage || undefined 
    );
    
    if (msg) {
        alert(msg);
        if (activeOrderId) {
            voidOrder(activeOrderId);
        }
        resetPOS();
    }
  };
  
  const resetPOS = () => {
      setCart([]);
      setActiveMember(null);
      setPagerNumber('');
      setPointsToRedeem(0);
      setManualCustomerName(''); 
      setPaymentModalOpen(false);
      setActiveOrderId(null);
      setActiveOrderIsDebt(false);
      setHoldNameModalOpen(false);
  }

  const resumeOrder = (order: Order) => {
    setCart(order.items);
    if (order.memberId) {
        const m = members.find(mem => mem.id === order.memberId);
        if (m) {
           setActiveMember(m);
        }
        setManualCustomerName(''); 
    } else if (order.customerName) {
        setActiveMember(null);
        setManualCustomerName(order.customerName); 
    } else {
        setActiveMember(null);
        setManualCustomerName('');
    }
    setPagerNumber(order.pagerNumber);
    setActiveOrderId(order.id);
    setActiveOrderIsDebt(false);
    setOrderListModalOpen(false);
  };
  
  const handleMarkAsDebt = (orderId: string) => {
      const order = orders.find(o => o.id === orderId);
      const orderName = order?.pagerNumber ? `Pager ${order.pagerNumber}` : orderId;
      setConfirmDialog({
          isOpen: true,
          message: `Kirim pesanan ${orderName} ke dapur sebagai BON (Belum Lunas)?`,
          onConfirm: () => {
              markOrderAsDebt(orderId);
              setOrderListModalOpen(false);
          }
      });
  }

  const initiatePayDebt = (order: Order) => {
      setActiveOrderId(order.id);
      setActiveOrderIsDebt(true);
      setPaymentModalOpen(true);
      setOrderListModalOpen(false);
  }

  // UPDATED: Closing Shift Logic with Modal
  const handleLogoutClick = () => {
    // Check if shift is active
    if (activeShift) {
       setLogoutConfirmationOpen(true);
    } else {
       if (currentUser) {
         clockOut(currentUser, 'PIN');
       }
       logout();
    }
  };

  const proceedToClosingReport = () => {
     if (!actualEndCash) {
        alert("Mohon hitung uang dan isi nominal.");
        return;
     }
     const summary = getShiftSummary();
     setShiftSummary(summary);
     setClosingStep('REPORT');
  };

  const confirmClosing = () => {
     if (actualEndCash) {
        setConfirmDialog({
            isOpen: true,
            message: `Yakin ingin menutup shift dengan setoran fisik tunai sebesar Rp ${actualEndCash}?`,
            onConfirm: () => {
                const amount = parseInt(actualEndCash.replace(/\D/g, '')) || 0;
                endShift(amount);
            }
        });
     }
  };

  // --- Purchase / Shopping Handlers ---

  const handleSelectIngredientForPurchase = (ing: Ingredient) => {
      setSelectedIngredient(ing);
      setPurchaseSearch('');
      setPurchaseForm({
          buyQty: 1,
          buyUnit: ing.buyUnit || 'Pcs',
          conversionRate: ing.conversionRate || 1,
          totalPrice: '', // Initialize as empty string for input control
          paymentSource: 'CASH_DRAWER'
      });
  };

  const handlePurchaseSubmit = () => {
      if (!selectedIngredient) return;
      const rawPrice = String(purchaseForm.totalPrice).replace(/\D/g, '');
      const priceVal = parseFloat(rawPrice);
      if (!priceVal || priceVal <= 0) {
          return;
      }
      
      if (purchaseForm.paymentSource === 'TRANSFER' && !purchaseForm.transferProof) {
          alert('Bukti transfer wajib diunggah.');
          return;
      }
      
      setConfirmDialog({
          isOpen: true,
          message: `Proses belanja stok ${selectedIngredient.name} sebanyak ${purchaseForm.buyQty} ${purchaseForm.buyUnit} dengan total Rp ${purchaseForm.totalPrice}?`,
          onConfirm: () => {
              purchaseIngredient(
                  selectedIngredient.id,
                  purchaseForm.buyQty,
                  priceVal,
                  purchaseForm.paymentSource,
                  purchaseForm.conversionRate,
                  purchaseForm.transferProof || undefined
              );
              setPurchaseModalOpen(false);
              setSelectedIngredient(null);
          }
      });
  };

  const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) {
        setPurchaseForm({...purchaseForm, totalPrice: ''});
        return;
    }
    const formatted = new Intl.NumberFormat('id-ID').format(Number(val));
    setPurchaseForm({...purchaseForm, totalPrice: formatted});
  };

  const addThousand = () => {
    const current = String(purchaseForm.totalPrice).replace(/\D/g, '') || '0';
    const newVal = current + '000';
    const formatted = new Intl.NumberFormat('id-ID').format(Number(newVal));
    setPurchaseForm({...purchaseForm, totalPrice: formatted});
  };

  // Calculate Reference System Price
  const systemRefPrice = selectedIngredient ? (selectedIngredient.costPerUnit * purchaseForm.conversionRate) : 0;

  if (shiftModalOpen) {
    return (
      <ShiftModal
        startCash={startCash}
        onStartCashChange={handleStartCashChange}
        onLogout={logout}
        onOpenShift={() => {
          const amount = parseInt(startCash.replace(/\./g, '')) || 0;
          startShift(amount);
          setShiftModalOpen(false);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
      
      {/* COLUMN 1: Navigation (Fixed Left) */}
      <div className="w-24 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 gap-2 z-10">
        <div className="mb-6 p-2 rounded-xl">
           <img src="https://hesindonesia.id/img/LogoCoraqCoffee.png" alt="Logo" className="w-16 h-auto object-contain" />
        </div>

        {['ALL', ...categories].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
              selectedCategory === cat 
                ? 'bg-slate-800 text-brand-400 border border-brand-500/50 shadow-lg' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            {getCategoryIcon(cat)}
            <span className="text-[10px] font-bold uppercase text-center leading-tight">
              {cat === 'ALL' ? 'SEMUA' : cat.replace('_', ' ')}
            </span>
          </button>
        ))}

        <button 
           onClick={() => setPurchaseModalOpen(true)}
           className="w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1 mt-4 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-900/40 border border-emerald-900 transition-all"
        >
           <ShoppingBag size={24}/>
           <span className="text-[10px] font-bold uppercase text-center leading-tight">Belanja</span>
        </button>

        <div className="mt-auto flex flex-col gap-4">
           <button onClick={handleLogoutClick} className="p-3 text-slate-500 hover:text-red-400 rounded-xl hover:bg-slate-800 transition-colors">
              <LogOut size={24} />
           </button>
                       </div>
      </div>

      {/* COLUMN 2: Menu Grid (Middle) */}
      <div className="flex-1 flex flex-col bg-slate-950 min-w-0">
         {/* Top Bar */}
         <div className="min-h-16 h-auto py-3 px-4 md:px-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center justify-between xl:justify-start gap-4 md:gap-6 flex-wrap w-full xl:w-auto">
               <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
                  <button 
                    onClick={() => setActiveTab('MENU')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all ${activeTab === 'MENU' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Menu
                  </button>
                  <button 
                    onClick={() => setActiveTab('HISTORY')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all ${activeTab === 'HISTORY' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Riwayat Nota
                  </button>
               </div>
               <div className="text-right xl:text-left">
                  <h2 className="text-base md:text-lg font-bold text-white tracking-tight leading-tight">{activeTab === 'MENU' ? 'Menu Pesanan' : 'Riwayat Hari Ini'}</h2>
                  <p className="text-[10px] md:text-xs text-slate-400">Kasir: <span className="text-slate-300 font-semibold">{currentUser?.name}</span></p>
               </div>
            </div>
            
            <div className="flex items-center justify-between xl:justify-end gap-2.5 md:gap-3 flex-wrap w-full xl:w-auto">
                 {(todayBirthdayMembers.length > 0 || dormantMembers.length > 0) && (
                    <button 
                       type="button"
                       onClick={() => {
                          setCrmActiveTab(todayBirthdayMembers.length > 0 ? 'BIRTHDAY' : 'DORMANT');
                          setCrmModalOpen(true);
                       }}
                       className="bg-[#0f1d1a]/80 hover:bg-[#142924]/95 text-emerald-400 px-3 py-1.5 md:py-2 rounded-full flex items-center gap-1.5 border border-emerald-950 relative shadow-lg transition-all hover:scale-102 hover:border-emerald-500 text-xs font-black tracking-tight shrink-0"
                    >
                       <MessageSquare size={14} className="text-emerald-400 animate-bounce" />
                       <span className="hidden sm:inline">CRM & Retensi 📢</span>
                       <span className="sm:hidden">CRM 📢</span>
                       
                       {/* Birthday count badge */}
                       {todayBirthdayMembers.length > 0 && (
                          <span className="bg-pink-600 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-slate-900" title="Member Ultah Hari Ini">
                             {todayBirthdayMembers.length}
                          </span>
                       )}
                       
                       {/* Dormant count badge */}
                       {dormantMembers.length > 0 && (
                          <span className="bg-amber-600 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-slate-900" title="Butuh Retensi">
                             {dormantMembers.length}
                          </span>
                       )}
                    </button>
                 )}
                 {activeTab === 'MENU' ? (
                    <>
                       <button 
                          onClick={() => setOrderListModalOpen(true)} 
                          className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 md:py-2 rounded-full flex items-center gap-1.5 border border-slate-700 relative transition-all hover:border-brand-500 text-xs font-bold shrink-0"
                       >
                          <List size={16}/>
                          <span className="hidden sm:inline">Daftar Pesanan</span>
                          <span className="sm:hidden">Pesanan</span>
                          {(pendingOrdersCount + unpaidDebtCount) > 0 && (
                             <span className="absolute -top-1.5 -right-1 bg-red-500 text-white text-[9px] font-black min-w-[18px] h-4.5 px-1 flex items-center justify-center rounded-full border border-slate-900">
                                {pendingOrdersCount + unpaidDebtCount}
                             </span>
                          )}
                       </button>
 
                       <div className="relative shrink-0 flex-1 sm:flex-initial">
                          <Search className="absolute left-3 top-2 text-slate-500" size={14} />
                          <input 
                             className="w-full sm:w-44 sm:focus:w-56 md:w-52 md:focus:w-64 bg-slate-900 border border-slate-800 rounded-full py-1.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-brand-500 transition-all duration-300"
                             placeholder="Cari menu..."
                             value={menuSearch}
                             onChange={e => setMenuSearch(e.target.value)}
                          />
                       </div>
                    </>
                 ) : (
                    <div className="relative shrink-0 flex-1 sm:flex-initial">
                       <Search className="absolute left-3 top-2 text-slate-500" size={14} />
                       <input 
                          className="w-full sm:w-44 sm:focus:w-56 md:w-52 md:focus:w-64 bg-slate-900 border border-slate-800 rounded-full py-1.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-brand-500 transition-all duration-300"
                          placeholder="Cari No. Nota..."
                          value={historySearch}
                          onChange={e => setHistorySearch(e.target.value)}
                       />
                    </div>
                 )}
            </div>
         </div>

         {/* Content Area */}
         <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'MENU' ? (
               <ProductGrid
                 products={PRODUCTS}
                 selectedCategory={selectedCategory}
                 menuSearch={menuSearch}
                 formatRupiah={formatRupiah}
                 onProductClick={handleProductClick}
               />
            ) : (
               <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                  <table className="w-full text-left">
                     <thead className="bg-slate-950 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                        <tr>
                           <th className="p-4">Nota</th>
                           <th className="p-4">Waktu</th>
                           <th className="p-4">Pelanggan</th>
                           <th className="p-4">Total</th>
                           <th className="p-4">Status</th>
                           <th className="p-4 text-center">Aksi</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-800">
                        {orders
                           .filter(o => {
                              const today = new Date().toISOString().split('T')[0];
                              const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
                              const matchDate = orderDate === today;
                              const matchSearch = o.id.toLowerCase().includes(historySearch.toLowerCase());
                              return matchDate && matchSearch;
                           })
                           .reverse()
                           .map(order => (
                              <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                                 <td className="p-4 font-mono text-xs text-brand-400 font-bold">{order.id}</td>
                                 <td className="p-4 text-sm text-slate-400">
                                    {new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                 </td>
                                 <td className="p-4">
                                    <div className="text-sm font-bold text-white">{order.customerName || 'Guest'}</div>
                                    <div className="text-[10px] text-slate-500">Pager: {order.pagerNumber}</div>
                                 </td>
                                 <td className="p-4 font-mono font-bold text-white">{formatRupiah(order.finalAmount)}</td>
                                 <td className="p-4">
                                    <span className={`text-[10px] px-2 py-1 rounded font-black uppercase tracking-tighter ${
                                       order.paymentStatus === 'PAID' ? 'bg-emerald-900/30 text-emerald-400' : 
                                       order.paymentStatus === 'VOID' ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'
                                    }`}>
                                       {order.paymentStatus}
                                    </span>
                                 </td>
                                 <td className="p-4 text-center">
                                    <button 
                                       onClick={() => setSelectedHistoryOrder(order)}
                                       className="p-2 bg-slate-800 text-slate-400 hover:bg-brand-600 hover:text-white rounded-lg transition-all"
                                    >
                                       <Search size={16} />
                                    </button>
                                 </td>
                              </tr>
                           ))
                        }
                     </tbody>
                  </table>
               </div>
            )}
         </div>
      </div>

      <CartPanel
        activeMember={activeMember}
        memberQuery={memberQuery}
        cart={cart}
        pointsToRedeem={pointsToRedeem}
        displaySubtotal={displaySubtotal}
        displayPromoDiscount={displayPromoDiscount}
        displayTierDiscount={displayTierDiscount}
        displayPointDiscount={displayPointDiscount}
        displayTotal={displayTotal}
        pagerNumber={pagerNumber}
        pagerConflict={pagerConflict}
        pagerErrorShake={pagerErrorShake}
        pointValue={storeConfig.pointValue}
        formatRupiah={formatRupiah}
        onMemberQueryChange={setMemberQuery}
        onMemberSearch={handleMemberSearch}
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        onOpenAddMember={() => setAddMemberModalOpen(true)}
        onClearMember={() => { setActiveMember(null); setPointsToRedeem(0); }}
        onRedeemPoints={setPointsToRedeem}
        onClearPoints={() => setPointsToRedeem(0)}
        onBindMemberCard={(memberId) => { setPosBindingMemberId(memberId); setIsQRScannerOpen(true); }}
        onUpdateCartQuantity={updateCartQuantity}
        onRemoveFromCart={removeFromCart}
        onPagerNumberChange={setPagerNumber}
        onHoldBillClick={handleHoldBillClick}
        onPayClick={handlePayClick}
      />

      {/* ... (Previous Modals for Payment, Modifiers, Member, etc. - Kept intact) ... */}

      {/* MODIFIER MODAL (Redesigned) */}
      {modifiersModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
               <div>
                  <h3 className="text-2xl font-bold text-white">{selectedProduct.name}</h3>
                  <p className="text-brand-400 font-bold">{formatRupiah(selectedProduct.price)}</p>
               </div>
               <button onClick={() => setModifiersModalOpen(false)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-white"><X size={24}/></button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-8 flex-1">
               {/* SUGAR GROUP - Filtered */}
               {getRelevantModifiers(selectedProduct, 'SUGAR').length > 0 && (
               <div>
                  <h4 className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-4">Gula / Sugar</h4>
                  <div className="grid grid-cols-3 gap-4">
                     {getRelevantModifiers(selectedProduct, 'SUGAR').map(mod => {
                        const isSelected = tempModifiers.some(m => m.id === mod.id);
                        return (
                           <button 
                              key={mod.id}
                              onClick={() => toggleModifier(mod)}
                              className={`py-4 rounded-xl font-bold text-lg transition-all border-2 ${
                                 isSelected 
                                    ? 'bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-900/50' 
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                              }`}
                           >
                              {mod.name.replace(' Sugar', '')}
                           </button>
                        );
                     })}
                  </div>
               </div>
               )}

               {/* ICE GROUP - Filtered */}
               {getRelevantModifiers(selectedProduct, 'ICE').length > 0 && (
               <div>
                  <h4 className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-4">Es / Temperature</h4>
                  <div className="grid grid-cols-3 gap-4">
                     {getRelevantModifiers(selectedProduct, 'ICE').map(mod => {
                        const isSelected = tempModifiers.some(m => m.id === mod.id);
                        return (
                           <button 
                              key={mod.id}
                              onClick={() => toggleModifier(mod)}
                              className={`py-4 rounded-xl font-bold text-lg transition-all border-2 flex flex-col items-center justify-center ${
                                 isSelected 
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-900/50' 
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                              }`}
                           >
                              <span>{mod.name.replace(' Ice', '')}</span>
                              {mod.price > 0 && <span className="text-xs opacity-70">+{formatRupiah(mod.price)}</span>}
                           </button>
                        );
                     })}
                  </div>
               </div>
               )}

               {/* ADDONS - Filtered */}
               {getRelevantModifiers(selectedProduct, 'ADDON').length > 0 && (
               <div>
                  <h4 className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-4">Add-ons</h4>
                  <div className="grid grid-cols-2 gap-4">
                     {getRelevantModifiers(selectedProduct, 'ADDON').map(mod => {
                        const isSelected = tempModifiers.some(m => m.id === mod.id);
                        return (
                           <button 
                              key={mod.id}
                              onClick={() => toggleModifier(mod)}
                              className={`py-4 px-6 rounded-xl font-bold text-left transition-all border-2 flex justify-between items-center ${
                                 isSelected 
                                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' 
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                              }`}
                           >
                              <span>{mod.name}</span>
                              <span className="text-sm bg-black/40 px-2 py-1 rounded">+ {formatRupiah(mod.price)}</span>
                           </button>
                        );
                     })}
                  </div>
               </div>
               )}
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900 flex gap-4">
               {/* Quantity Control in Modal */}
               <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2">
                  <button onClick={() => setTempQuantity(Math.max(1, tempQuantity - 1))} className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-white"><Minus size={20}/></button>
                  <span className="w-8 text-center font-bold text-xl text-white">{tempQuantity}</span>
                  <button onClick={() => setTempQuantity(tempQuantity + 1)} className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-brand-500"><Plus size={20}/></button>
               </div>

               <button 
                  onClick={() => addToCart(selectedProduct, tempModifiers, tempQuantity)}
                  className="flex-1 bg-brand-500 hover:bg-brand-400 text-white font-bold text-xl py-4 rounded-xl shadow-xl transition-all"
               >
                  TAMBAH PESANAN - {formatRupiah((selectedProduct.price + tempModifiers.reduce((a, b) => a + b.price, 0)) * tempQuantity)}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Customer Name Modal (For Hold Bill) */}
      {holdNameModalOpen && (
         <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 p-8 rounded-xl w-full max-w-sm border border-slate-800 text-center">
               <h3 className="text-xl font-bold text-white mb-2">Simpan Tagihan</h3>
               <p className="text-slate-400 mb-6 text-sm">Masukkan nama pelanggan untuk menyimpan pesanan ini.</p>
               
               <input 
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl text-white outline-none focus:border-brand-500 mb-6 text-center text-lg" 
                  placeholder="Nama Pelanggan (Cth: Baju Merah)" 
                  value={manualCustomerName} 
                  onChange={e => setManualCustomerName(e.target.value)} 
               />

               <div className="flex gap-3">
                  <button onClick={() => setHoldNameModalOpen(false)} className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 font-bold">Batal</button>
                  <button 
                     onClick={() => createHoldOrder(manualCustomerName || 'Guest')}
                     className="flex-1 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-500 font-bold"
                  >
                     Simpan
                  </button>
               </div>
            </div>
         </div>
      )}

      <PaymentModal
        isOpen={paymentModalOpen}
        displayTotal={displayTotal}
        formatRupiah={formatRupiah}
        activePaymentMethod={activePaymentMethod}
        handlePaymentMethodClick={handlePaymentMethodClick}
        quickCashOptions={quickCashOptions}
        setCashRecieved={setCashRecieved}
        cashRecieved={cashRecieved}
        canPay={canPay}
        change={change}
        processPayment={processPayment}
        proofImage={proofImage}
        videoRef={videoRef}
        canvasRef={canvasRef}
        isCameraLoading={isCameraLoading}
        toggleCamera={toggleCamera}
        capturePhoto={capturePhoto}
        setProofImage={setProofImage}
        startCamera={startCamera}
        setPaymentModalOpen={setPaymentModalOpen}
      />

      <HoldDebtPanel
        isOpen={orderListModalOpen}
        orders={orders}
        orderListTab={orderListTab}
        setOrderListTab={setOrderListTab}
        setOrderListModalOpen={setOrderListModalOpen}
        pendingOrdersCount={pendingOrdersCount}
        unpaidDebtCount={unpaidDebtCount}
        preparingOrdersCount={preparingOrdersCount}
        formatRupiah={formatRupiah}
        handleMarkAsDebt={handleMarkAsDebt}
        resumeOrder={resumeOrder}
        initiatePayDebt={initiatePayDebt}
      />

      {/* Add Member Modal */}
      {addMemberModalOpen && (
         <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[150] p-4 backdrop-blur-md">
            <div className="bg-slate-900 rounded-3xl w-full max-w-lg p-8 relative border border-slate-800 shadow-2xl flex flex-col gap-8">
               <button onClick={() => { setAddMemberModalOpen(false); stopCamera(); }} className="absolute right-6 top-6 text-slate-400 hover:text-white"><X size={24} /></button>
               
               {/* Form Section */}
               <div className="flex-1 space-y-4">
                  <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter">Pendaftaran Member</h3>
                  <div>
                     <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nama Lengkap (Sesuai KTP)</label>
                     <input className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-brand-500" value={newMemberFullName} onChange={e => setNewMemberFullName(e.target.value)} placeholder="Contoh: Budi Santoso"/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nama Panggilan</label>
                        <input className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-brand-500" value={newMemberNickname} onChange={e => setNewMemberNickname(e.target.value)} placeholder="Budi"/>
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Jenis Kelamin</label>
                        <select className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-brand-500" value={newMemberGender} onChange={e => setNewMemberGender(e.target.value as 'MALE' | 'FEMALE')}>
                           <option value="MALE">Laki-laki</option>
                           <option value="FEMALE">Perempuan</option>
                        </select>
                     </div>
                  </div>
                  <div>
                     <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">No. WhatsApp</label>
                     <input className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-brand-500" value={newMemberPhone} onChange={e => setNewMemberPhone(e.target.value)} placeholder="0812..."/>
                  </div>
                  <div>
                     <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tanggal Lahir</label>
                     <input type="date" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-brand-500" value={newMemberBirthDate} onChange={e => setNewMemberBirthDate(e.target.value)}/>
                  </div>
                  <button onClick={handleAddMember} className="w-full bg-brand-600 hover:bg-brand-500 text-white font-black py-4 rounded-2xl mt-4 shadow-lg shadow-brand-900/50 uppercase tracking-widest">Daftarkan Member</button>
               </div>
            </div>
         </div>
      )}

      {/* Member Registration Confirmation Modal */}
      {isMemberConfirmOpen && (
         <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[200] p-4 backdrop-blur-xl">
            <div className="bg-slate-900 rounded-3xl w-full max-w-sm p-8 border border-slate-800 shadow-2xl text-center">
               <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 border-4 border-brand-500 shadow-lg bg-slate-800 flex flex-col items-center justify-center text-slate-500 font-bold text-xs">
                  {newMemberPhoto ? <img src={newMemberPhoto} className="w-full h-full object-cover" /> : <UserIcon size={32} className="text-brand-500 mb-1" />}
               </div>
               <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Konfirmasi Data Member</h3>
               <p className="text-slate-400 text-sm mb-6">Pastikan data berikut sudah benar sebelum disimpan.</p>
               
               <div className="bg-slate-950 rounded-2xl p-4 mb-8 text-left space-y-3 border border-slate-800">
                  <div>
                     <span className="text-[10px] font-black text-slate-500 uppercase block">Nama Lengkap</span>
                     <span className="text-white font-bold">{newMemberFullName}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <span className="text-[10px] font-black text-slate-500 uppercase block">Panggilan</span>
                        <span className="text-white font-bold">{newMemberNickname}</span>
                     </div>
                     <div>
                        <span className="text-[10px] font-black text-slate-500 uppercase block">Gender</span>
                        <span className="text-white font-bold">{newMemberGender === 'MALE' ? 'Laki-laki' : 'Perempuan'}</span>
                     </div>
                  </div>
                  <div>
                     <span className="text-[10px] font-black text-slate-500 uppercase block">No. WhatsApp</span>
                     <span className="text-white font-bold">{newMemberPhone}</span>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setIsMemberConfirmOpen(false)} className="py-4 bg-slate-800 text-slate-400 font-black rounded-2xl uppercase tracking-widest hover:bg-slate-700 transition-colors">Batal</button>
                  <button onClick={confirmAddMember} className="py-4 bg-brand-600 text-white font-black rounded-2xl uppercase tracking-widest hover:bg-brand-500 shadow-lg shadow-brand-900/50 transition-all">Simpan</button>
               </div>
            </div>
         </div>
      )}

      <PurchaseModal
        isOpen={purchaseModalOpen}
        setPurchaseModalOpen={setPurchaseModalOpen}
        selectedIngredient={selectedIngredient}
        purchaseTab={purchaseTab}
        setPurchaseTab={setPurchaseTab}
        shiftPurchases={shiftPurchases}
        purchaseSearch={purchaseSearch}
        setPurchaseSearch={setPurchaseSearch}
        ingredients={ingredients}
        handleSelectIngredientForPurchase={handleSelectIngredientForPurchase}
        formatRupiah={formatRupiah}
        setPurchaseVoidModal={setPurchaseVoidModal}
        setSelectedIngredient={setSelectedIngredient}
        purchaseForm={purchaseForm}
        setPurchaseForm={setPurchaseForm}
        handlePriceInputChange={handlePriceInputChange}
        addThousand={addThousand}
        angkaKeTerbilang={angkaKeTerbilang}
        handlePurchaseSubmit={handlePurchaseSubmit}
      />

      {/* --- MANAGER PIN MODAL FOR PURCHASE VOID --- */}
      {purchaseVoidModal?.isOpen && (
         <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[130] p-4 backdrop-blur-xl">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-8 text-center shadow-2xl">
               <ShieldAlert size={48} className="text-red-500 mx-auto mb-4 animate-bounce" />
               <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Otoritas Manager</h3>
               <p className="text-slate-400 text-sm mb-6">Masukkan PIN Manager/Owner untuk membatalkan pengeluaran belanja bahan ini dan mengembalikan stok.</p>
               
               <input 
                  type="password"
                  maxLength={6}
                  className="w-full bg-slate-950 border border-slate-700 p-4 rounded-2xl text-white text-3xl font-black text-center tracking-[1em] outline-none focus:border-brand-500 mb-6"
                  value={purchaseVoidPin}
                  onChange={e => setPurchaseVoidPin(e.target.value.replace(/\D/g, ''))}
                  autoFocus
               />

               <div className="flex gap-3">
                  <button 
                     type="button"
                     onClick={() => {
                        setPurchaseVoidModal(null);
                        setPurchaseVoidPin('');
                     }}
                     className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl font-bold"
                  >
                     Batal
                  </button>
                  <button 
                     type="button"
                     onClick={() => {
                        const manager = users.find(u => u.pin === purchaseVoidPin && (u.role === 'ADMIN' || u.role === 'MANAGER'));
                        if (manager) {
                           const res = voidPurchase(purchaseVoidModal.expenseId);
                           if (res && res.success === false) {
                              alert(res.message);
                           } else {
                              alert("Belanja berhasil dibatalkan.");
                              setPurchaseVoidModal(null);
                              setPurchaseVoidPin('');
                           }
                        } else {
                           alert("PIN Manager salah atau tidak memiliki otoritas.");
                           setPurchaseVoidPin('');
                        }
                     }}
                     className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold"
                  >
                     Konfirmasi
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* --- CRM & RETENSI DIALOG MODAL (COMPREHENSIVE MEMBER INTELLIGENCE) --- */}
      {crmModalOpen && (
         <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[130] p-4 backdrop-blur-md animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl relative overflow-hidden">
               {/* Background Glow */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
               <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
               
               <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                  <div className="flex items-center gap-3">
                     <div className="p-2.5 bg-emerald-950/60 rounded-2xl border border-emerald-700/30 text-emerald-400">
                        <MessageSquare size={24} className="animate-pulse" />
                     </div>
                     <div>
                        <h3 className="text-lg font-black text-white tracking-tight uppercase">CRM & Retensi Pelanggan 📢</h3>
                        <p className="text-xs text-slate-400">Hubungi loyalis anda untuk meningkatkan kunjungan penjualan!</p>
                     </div>
                  </div>
                  <button 
                     onClick={() => setCrmModalOpen(false)}
                     className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors"
                  >
                     <X size={18} />
                  </button>
               </div>

               {/* TAB TOGGLE */}
               <div className="bg-slate-950/60 p-2 border-b border-slate-800 flex gap-2">
                  <button
                     onClick={() => setCrmActiveTab('BIRTHDAY')}
                     className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                        crmActiveTab === 'BIRTHDAY'
                           ? 'bg-pink-900/25 border border-pink-700/40 text-pink-300'
                           : 'text-slate-400 hover:text-white'
                     }`}
                  >
                     <Gift size={14} /> Member Ultah ({todayBirthdayMembers.length}) 🎂
                  </button>
                  <button
                     onClick={() => setCrmActiveTab('DORMANT')}
                     className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                        crmActiveTab === 'DORMANT'
                           ? 'bg-amber-900/25 border border-amber-700/40 text-amber-300'
                           : 'text-slate-400 hover:text-white'
                     }`}
                  >
                     <Clock size={14} /> Butuh Retensi ({dormantMembers.length}) 💤
                  </button>
               </div>
 
               <div className="p-6 max-h-[55vh] overflow-y-auto space-y-3 bg-slate-900/20">
                  {crmActiveTab === 'BIRTHDAY' ? (
                     todayBirthdayMembers.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                           <Gift size={32} className="mx-auto mb-2 text-slate-700" />
                           <p className="text-xs font-semibold">Tidak ada member yang berulang tahun hari ini.</p>
                        </div>
                     ) : (
                        todayBirthdayMembers.map(member => {
                           const age = member.birthDate ? new Date().getFullYear() - parseInt(member.birthDate.split('-')[0]) : 25;
                           return (
                              <div key={member.id} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-pink-900/35 transition-all">
                                 <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700 relative">
                                       {member.photo ? (
                                          <img src={member.photo} className="w-full h-full object-cover" />
                                       ) : (
                                          <div className="w-full h-full flex items-center justify-center bg-slate-700 text-slate-400">
                                             <UserIcon size={18} />
                                          </div>
                                       )}
                                    </div>
                                    <div>
                                       <div className="flex items-center gap-2">
                                          <h4 className="font-bold text-white text-sm">{member.fullName}</h4>
                                          <span className="text-[8px] font-black tracking-tight px-1.5 py-0.5 rounded border bg-pink-950/50 border-pink-500/20 text-pink-300">{member.tier}</span>
                                       </div>
                                       <div className="text-xs text-slate-400 font-mono mt-0.5">{member.phone}</div>
                                       <div className="text-[10px] text-pink-400 flex items-center gap-1 font-bold mt-1">
                                          🎂 Ultah hari ini ({age} Th) !
                                       </div>
                                    </div>
                                 </div>
                                 <button 
                                    onClick={() => handleOpenOutreach(member, "BIRTHDAY")}
                                    className="w-full sm:w-auto px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow active:scale-95"
                                 >
                                    <MessageSquare size={13} /> Kirim Promo Ultah
                                 </button>
                              </div>
                           );
                        })
                     )
                  ) : (
                     dormantMembers.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                           <Clock size={32} className="mx-auto mb-2 text-slate-700" />
                           <p className="text-xs font-semibold">Semua member aktif berkunjung akhir-akhir ini!</p>
                        </div>
                     ) : (
                        dormantMembers.map(member => {
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
                              <div key={member.id} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-amber-900/35 transition-all">
                                 <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700 relative">
                                       {member.photo ? (
                                          <img src={member.photo} className="w-full h-full object-cover" />
                                       ) : (
                                          <div className="w-full h-full flex items-center justify-center bg-slate-700 text-slate-400">
                                             <UserIcon size={18} />
                                          </div>
                                       )}
                                    </div>
                                    <div>
                                       <div className="flex items-center gap-2">
                                          <h4 className="font-bold text-white text-sm">{member.fullName}</h4>
                                          <span className="text-[8px] font-black tracking-tight px-1.5 py-0.5 rounded border bg-amber-950/50 border-amber-500/20 text-amber-300">{member.tier}</span>
                                       </div>
                                       <div className="text-xs text-slate-400 font-mono mt-0.5">{member.phone}</div>
                                       <div className="text-[10px] text-amber-400 flex items-center gap-1 font-bold mt-1">
                                          💤 Terakhir: {relativeTimeString}
                                       </div>
                                    </div>
                                 </div>
                                 <button 
                                    onClick={() => handleOpenOutreach(member, "DORMANT")}
                                    className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow active:scale-95"
                                 >
                                    <MessageSquare size={13} /> Sapa & Sodor Promo
                                 </button>
                              </div>
                           );
                        })
                     )
                  )}
               </div>
 
               <div className="p-4 bg-slate-950/40 border-t border-slate-805 text-center text-slate-500 text-xs">
                  Sistem CRM and Outbound loyalis terintegrasi dengan filter and trigger dynamic marketing.
               </div>
            </div>
         </div>
      )}

      {/* --- CRM OUTREACH MODAL IN POS (WhatsApp Message Composition with dynamic promo hook) --- */}
      {outreachModalOpen && outreachMember && (
         <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[140] p-4 backdrop-blur-md animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
               <div className="p-6 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                     <div className="p-2.5 bg-emerald-950/60 rounded-2xl border border-emerald-700/30 text-emerald-400">
                        <MessageSquare size={20} className="animate-pulse" />
                     </div>
                     <div>
                        <h3 className="text-md font-black text-white uppercase tracking-tight">Ketik Pesan CRM</h3>
                        <p className="text-xs text-slate-400">Menghubungi: {outreachMember.fullName} ({outreachMember.tier})</p>
                     </div>
                  </div>
                  <button 
                     onClick={() => setOutreachModalOpen(false)}
                     className="p-1.5 rounded-full text-slate-400 bg-slate-800 hover:text-white transition-colors"
                  >
                     <X size={16} />
                  </button>
               </div>

               <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                  {/* Select Promo dynamic hook */}
                  <div>
                     <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">
                        Lampirkan Promo (Integrated with CRM Database) 🎟️
                     </label>
                     <select
                        value={outreachPromoId}
                        onChange={(e) => handleOutreachPromoChange(e.target.value)}
                        className="w-full bg-slate-950 text-slate-200 text-xs font-bold p-3 py-2.5 rounded-xl border border-slate-850 focus:outline-none focus:border-emerald-500 transition-colors"
                     >
                        <option value="">-- Tanpa Lampiran Promo (Sapaan Saja) --</option>
                        {promotions.map((promo) => (
                           <option key={promo.id} value={promo.id}>
                              {promo.name} ({promo.type === "PERCENTAGE" ? `${promo.value}%` : `Diskon Rp ${promo.value}`})
                           </option>
                        ))}
                     </select>
                  </div>

                  {/* Message editor */}
                  <div>
                     <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500">
                           Edit Materi Pesan
                        </label>
                        <button
                           onClick={() => setOutreachMessage(getOutreachDefaultMessage(outreachMember, outreachType, outreachPromoId))}
                           className="text-[9px] text-brand-400 hover:text-brand-300 font-bold transition-colors"
                        >
                           Reset Template Semula
                        </button>
                     </div>
                     <textarea
                        value={outreachMessage}
                        onChange={(e) => setOutreachMessage(e.target.value)}
                        rows={4}
                        className="w-full bg-slate-950 text-white p-3 rounded-xl text-xs font-medium border border-slate-850 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                        placeholder="Tulis pesan Whatsapp..."
                     />
                  </div>

                  {/* Live Bubble Preview */}
                  <div className="bg-[#0b141a] p-3.5 rounded-2xl border-l-4 border-emerald-500 relative shadow-md">
                     <p className="text-white text-xs font-normal whitespace-pre-wrap leading-relaxed font-sans">
                        {outreachMessage || "Masukan materi pesan..."}
                     </p>
                     <div className="text-[9px] text-emerald-400/80 font-mono text-right mt-1 flex items-center justify-end gap-1">
                        <span>{new Date().toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" })}</span>
                        <span>✓✓</span>
                     </div>
                  </div>
               </div>

               <footer className="p-6 border-t border-slate-850 bg-slate-950/40 flex justify-end gap-3">
                  <button
                     type="button"
                     onClick={() => setOutreachModalOpen(false)}
                     className="px-4 py-2 rounded-xl bg-slate-800 text-slate-350 hover:bg-slate-750 transition-colors font-bold text-xs"
                  >
                     Batal
                  </button>
                  <button
                     type="button"
                     onClick={handleSendOutreachWhatsApp}
                     className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs active:scale-95 shadow transition-all flex items-center gap-1.5"
                  >
                     <MessageSquare size={13} /> Kirim via WhatsApp
                  </button>
               </footer>
            </div>
         </div>
      )}

      {/* --- CLOSING SHIFT MODAL (Main Process) --- */}
      {closingModalOpen && (
         <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
               {closingStep === 'INPUT' ? (
                  <div className="p-8 text-center">
                     <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-700">
                        <Calculator size={32} className="text-brand-500"/>
                     </div>
                     <h2 className="text-2xl font-bold text-white mb-2">Hitung Uang Fisik</h2>
                     <p className="text-slate-400 mb-8 text-sm">Hitung uang di laci (Cash Drawer) dan masukkan totalnya. <br/>JANGAN lihat sistem dulu (Blind Count).</p>
                     
                     <div className="relative mb-8">
                        <span className="absolute left-4 top-4 text-slate-500 font-bold text-lg">Rp</span>
                        <input 
                           type="text" 
                           autoFocus
                           className="w-full bg-slate-950 border border-slate-700 p-4 pl-12 rounded-xl text-white font-mono text-3xl font-bold text-center focus:border-brand-500 outline-none"
                           placeholder="0"
                           value={actualEndCash}
                           onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setActualEndCash(new Intl.NumberFormat('id-ID').format(Number(val)));
                           }}
                        />
                     </div>
                     
                     <button 
                        onClick={proceedToClosingReport}
                        className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all"
                     >
                        Lanjut ke Laporan
                     </button>
                     <button onClick={() => setClosingModalOpen(false)} className="mt-4 text-slate-500 text-sm hover:text-white">Batal</button>
                  </div>
               ) : (
                  <div className="p-0">
                     <div className="bg-slate-800 p-6 border-b border-slate-700">
                        <h2 className="text-xl font-bold text-white text-center">Laporan Tutup Shift</h2>
                        <p className="text-center text-slate-400 text-xs mt-1">{new Date().toLocaleString()}</p>
                     </div>
                     
                     <div className="p-6 space-y-4">
                        {shiftSummary && (
                           <>
                              {/* Cash Flow Summary */}
                              <div className="space-y-2 text-sm">
                                 <div className="flex justify-between text-slate-400"><span>Modal Awal</span> <span>{formatRupiah(shiftSummary.startCash)}</span></div>
                                 <div className="flex justify-between text-green-400"><span>+ Penjualan Tunai</span> <span>{formatRupiah(shiftSummary.cashSales)}</span></div>
                                 <div className="flex justify-between text-red-400 border-b border-slate-800 pb-2"><span>- Pengeluaran Kas</span> <span>{formatRupiah(shiftSummary.expenses)}</span></div>
                                 <div className="flex justify-between font-bold text-white pt-1"><span>Estimasi Saldo (System)</span> <span>{formatRupiah(shiftSummary.expectedCash)}</span></div>
                              </div>

                              {/* Physical Count Comparison */}
                              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mt-4">
                                 <div className="flex justify-between items-center mb-1">
                                    <span className="text-slate-400 text-xs uppercase font-bold">Uang Fisik (Anda Hitung)</span>
                                    <span className="text-white font-mono font-bold text-lg">{actualEndCash}</span>
                                 </div>
                                 <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                                    <span className="text-slate-400 text-xs uppercase font-bold">Selisih (Variance)</span>
                                    <span className={`font-mono font-bold text-lg ${
                                       (parseInt(actualEndCash.replace(/\D/g, '')) - shiftSummary.expectedCash) === 0 ? 'text-green-500' : 
                                       (parseInt(actualEndCash.replace(/\D/g, '')) - shiftSummary.expectedCash) < 0 ? 'text-red-500' : 'text-blue-400'
                                    }`}>
                                       {formatRupiah(parseInt(actualEndCash.replace(/\D/g, '')) - shiftSummary.expectedCash)}
                                    </span>
                                 </div>
                              </div>

                              {/* Additional Info */}
                              <div className="grid grid-cols-2 gap-4 mt-4">
                                 <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-900/30 text-center">
                                    <span className="block text-[10px] text-blue-300 uppercase">Non-Tunai (QRIS/Debit)</span>
                                    <span className="block text-white font-bold">{formatRupiah(shiftSummary.nonCashSales)}</span>
                                 </div>
                                 <div className="bg-orange-900/20 p-3 rounded-lg border border-orange-900/30 text-center">
                                    <span className="block text-[10px] text-orange-300 uppercase">Piutang (Bon)</span>
                                    <span className="block text-white font-bold">{formatRupiah(shiftSummary.debt)}</span>
                                 </div>
                              </div>
                           </>
                        )}
                     </div>

                     <div className="p-6 border-t border-slate-800 bg-slate-800/50 flex gap-3">
                        <button onClick={() => setClosingStep('INPUT')} className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-lg font-bold">Ulang Hitung</button>
                        <button onClick={confirmClosing} className="flex-[2] py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold shadow-lg">TUTUP SHIFT</button>
                     </div>
                  </div>
               )}
            </div>
         </div>
      )}

      {/* Logout Confirmation Modal */}
      {logoutConfirmationOpen && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 p-6 rounded-xl w-full max-w-sm border border-slate-800 text-center shadow-2xl">
               <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-900/50">
                  <LogOut size={32} className="text-red-500"/>
               </div>
               <h3 className="text-xl font-bold text-white mb-2">Konfirmasi Keluar</h3>
               <p className="text-slate-400 mb-6 text-sm">Shift kasir masih berjalan. Apakah Anda ingin melakukan Closing (Tutup Shift) sebelum keluar?</p>
               
               <div className="space-y-3">
                  <button 
                     onClick={() => {
                        setLogoutConfirmationOpen(false);
                        setClosingModalOpen(true);
                        setClosingStep('INPUT');
                        setActualEndCash('');
                     }} 
                     className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg"
                  >
                     Ya, Tutup Shift Sekarang
                  </button>
                  <button 
                     onClick={() => {
                        logout();
                     }} 
                     className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                  >
                     Keluar Saja (Shift Tetap Jalan)
                  </button>
                  <button 
                     onClick={() => setLogoutConfirmationOpen(false)} 
                     className="w-full py-2 text-slate-500 text-sm hover:text-white"
                  >
                     Batal
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* --- RECEIPT DETAIL MODAL (CASHIER) --- */}
      {selectedHistoryOrder && (
         <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[120] p-4 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
               <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-xl">
                  <div>
                     <h3 className="text-xl font-black text-white">Detail Nota</h3>
                     <p className="text-xs text-brand-400 font-mono font-bold uppercase tracking-widest">{selectedHistoryOrder.id}</p>
                  </div>
                  <button onClick={() => setSelectedHistoryOrder(null)} className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors">
                     <X size={20} />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  {/* Header Info */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/50">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Waktu</p>
                        <p className="text-sm font-bold text-white">{new Date(selectedHistoryOrder.createdAt).toLocaleString('id-ID')}</p>
                     </div>
                     <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/50">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Kasir</p>
                        <p className="text-sm font-bold text-white">{selectedHistoryOrder.cashierName}</p>
                     </div>
                     <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/50">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Pelanggan</p>
                        <p className="text-sm font-bold text-white">{selectedHistoryOrder.customerName || 'Guest'}</p>
                     </div>
                     <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/50">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Nomor Pager</p>
                        <p className="text-sm font-bold text-white">#{selectedHistoryOrder.pagerNumber}</p>
                     </div>
                  </div>

                  {/* Items List */}
                  <div>
                     <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Utensils size={14} /> Daftar Pesanan
                     </h4>
                     <div className="space-y-3">
                        {selectedHistoryOrder.items.map((item: any, idx: number) => (
                           <div key={idx} className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 flex justify-between items-start">
                              <div className="flex gap-3">
                                 <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-brand-400 font-black">
                                    {item.quantity}x
                                 </div>
                                 <div>
                                    <p className="font-bold text-white">{item.productName}</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                       {item.modifiers?.map((mod: any, mIdx: number) => (
                                          <span key={mIdx} className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                                             {mod.name}
                                          </span>
                                       ))}
                                    </div>
                                 </div>
                              </div>
                              <p className="font-mono font-bold text-white text-sm">{formatRupiah(item.price * item.quantity)}</p>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-3">
                     <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="text-white font-mono">{formatRupiah(selectedHistoryOrder.subtotal)}</span>
                     </div>
                     {selectedHistoryOrder.discount > 0 && (
                        <div className="flex justify-between text-sm">
                           <span className="text-emerald-500">Diskon</span>
                           <span className="text-emerald-500 font-mono">-{formatRupiah(selectedHistoryOrder.discount)}</span>
                        </div>
                     )}
                     <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                        <span className="text-lg font-black text-white uppercase tracking-tighter">Total Akhir</span>
                        <span className="text-2xl font-mono font-black text-brand-500">{formatRupiah(selectedHistoryOrder.finalAmount)}</span>
                     </div>
                     <div className="flex justify-between items-center pt-2">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Metode Bayar</span>
                        <span className="text-[10px] bg-brand-600/20 text-brand-400 px-2 py-1 rounded font-black uppercase">{selectedHistoryOrder.paymentMethod}</span>
                     </div>
                  </div>
               </div>

               <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex gap-3">
                  <button 
                     onClick={() => {
                        setManagerPinModal({ isOpen: true, orderId: selectedHistoryOrder.id });
                     }}
                     disabled={selectedHistoryOrder.paymentStatus === 'VOID'}
                     className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                        selectedHistoryOrder.paymentStatus === 'VOID' 
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                        : 'bg-red-900/20 text-red-500 hover:bg-red-600 hover:text-white'
                     }`}
                  >
                     <Trash2 size={18} /> VOID TRANSAKSI
                  </button>
                  <button 
                     onClick={() => alert("Fitur cetak ulang akan segera hadir!")}
                     className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                  >
                     <Plus size={18} /> CETAK ULANG
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* --- MANAGER PIN MODAL FOR VOID --- */}
      {managerPinModal?.isOpen && (
         <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[130] p-4 backdrop-blur-xl">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-8 text-center shadow-2xl">
               <ShieldAlert size={48} className="text-red-500 mx-auto mb-4" />
               <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Otoritas Manager</h3>
               <p className="text-slate-400 text-sm mb-6">Masukkan PIN Manager/Owner untuk membatalkan transaksi ini.</p>
               
               <input 
                  type="password"
                  maxLength={6}
                  className="w-full bg-slate-950 border border-slate-700 p-4 rounded-2xl text-white text-3xl font-black text-center tracking-[1em] outline-none focus:border-brand-500 mb-6"
                  value={managerPin}
                  onChange={e => setManagerPin(e.target.value.replace(/\D/g, ''))}
                  autoFocus
               />

               <div className="flex gap-3">
                  <button 
                     onClick={() => {
                        setManagerPinModal(null);
                        setManagerPin('');
                     }}
                     className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl font-bold"
                  >
                     Batal
                  </button>
                  <button 
                     onClick={() => {
                        const manager = users.find(u => u.pin === managerPin && (u.role === 'ADMIN' || u.role === 'MANAGER'));
                        if (manager) {
                           voidOrder(managerPinModal.orderId);
                           setManagerPinModal(null);
                           setManagerPin('');
                           setSelectedHistoryOrder(null);
                           alert("Transaksi berhasil dibatalkan.");
                        } else {
                           alert("PIN Manager salah atau tidak memiliki otoritas.");
                           setManagerPin('');
                        }
                     }}
                     className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold"
                  >
                     Konfirmasi
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* --- CONFIRM DIALOG MODAL --- */}
      {confirmDialog?.isOpen && (
         <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl text-center p-6">
               <AlertTriangle size={48} className="text-orange-500 mx-auto mb-4" />
               <h3 className="text-xl font-bold text-white mb-2">Konfirmasi</h3>
               <p className="text-slate-400 mb-6">{confirmDialog.message}</p>
               <div className="flex gap-4">
                  <button onClick={() => setConfirmDialog(null)} className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-lg font-bold">Batal</button>
                  <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }} className="flex-1 py-3 bg-brand-600 text-white rounded-lg font-bold">Ya, Lanjutkan</button>
               </div>
            </div>
         </div>
      )}

      {/* --- QR SCANNER MODAL --- */}
      <div 
         className={`fixed inset-0 bg-black/90 backdrop-blur-md z-[200] p-4 transition-opacity duration-300 ${
            isQRScannerOpen ? 'opacity-100 flex items-center justify-center pointer-events-auto' : 'opacity-0 flex items-center justify-center pointer-events-none'
         }`}
      >
         <div className="bg-slate-900 border border-slate-700 rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl relative">
            <div className="p-8 pb-4 text-center">
               <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-500/20">
                  <QrCode className="text-brand-500" size={32} />
               </div>
               <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Scan QR Member</h3>
               <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-widest">Kamera Belakang Aktif</p>
            </div>
            
            <div className="p-8 pt-4">
               <div className="relative aspect-square rounded-[2rem] overflow-hidden border-4 border-slate-800 bg-black shadow-inner">
                  <div id="qr-reader" className="w-full h-full"></div>
                  
                  {/* Success Flash Overlay */}
                  {isScanSuccessFlash && (
                     <div className="absolute inset-0 bg-white z-[210] flex items-center justify-center animate-pulse">
                        <div className="bg-emerald-500 p-6 rounded-full scale-125 shadow-2xl">
                           <CheckCircle size={48} className="text-white" />
                        </div>
                     </div>
                  )}

                  {/* Guide Overlay */}
                  {!isScanSuccessFlash && (
                     <div className="absolute inset-0 border-[30px] border-black/40 pointer-events-none group filter grayscale-[50%]">
                        <div className="w-full h-full border-2 border-brand-500/30 rounded-2xl relative overflow-hidden">
                           {/* Corner Accents */}
                           <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-brand-500 rounded-tl-md shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
                           <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-brand-500 rounded-tr-md shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
                           <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-brand-500 rounded-bl-md shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
                           <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-brand-500 rounded-br-md shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
                           
                           {/* Scanning Line Animation */}
                           <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-500 to-transparent shadow-[0_0_15px_rgba(236,72,153,0.8)] animate-[scan-y_3s_linear_infinite]" />
                        </div>
                     </div>
                  )}
               </div>
               
               {cameraDevices.length > 1 && (
                  <div className="mt-4 flex gap-2">
                     {cameraDevices.slice(0, 2).map((device, index) => (
                        <button
                           key={device.id}
                           onClick={() => setSelectedCameraId(device.id)}
                           className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all border ${
                              selectedCameraId === device.id 
                              ? 'bg-brand-500/20 border-brand-500 text-brand-400' 
                              : 'bg-slate-800 border-slate-700 text-slate-500'
                           }`}
                        >
                           Cam {index + 1}
                        </button>
                     ))}
                  </div>
               )}

               {posBindingMemberId && (
                  <div className="mt-6 flex flex-col items-center">
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-4 -mb-2 relative z-10 border border-slate-800 rounded-full">Atau Input Manual</span>
                     <div className="w-full bg-slate-800 p-2 rounded-2xl flex border border-slate-700 focus-within:border-brand-500 transition-colors">
                        <input
                           type="text"
                           placeholder="KODE KARTU"
                           value={manualMemberCardCode}
                           onChange={e => setManualMemberCardCode(e.target.value.toUpperCase())}
                           className="flex-1 bg-transparent text-white px-4 font-mono font-bold tracking-widest outline-none placeholder:text-slate-600 uppercase text-sm"
                        />
                        <button
                           onClick={() => {
                              if (manualMemberCardCode.trim().length > 0 && posBindingMemberId) {
                                 bindMemberCard(posBindingMemberId, manualMemberCardCode.trim());
                                 setIsQRScannerOpen(false);
                                 setPosBindingMemberId(null);
                                 setManualMemberCardCode('');
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
               )}

               <button 
                  onClick={() => { setIsQRScannerOpen(false); setPosBindingMemberId(null); setManualMemberCardCode(''); }}
                  className="w-full mt-6 py-4 bg-slate-800 text-slate-300 font-black rounded-2xl hover:bg-red-500/20 hover:text-red-500 transition-all uppercase tracking-widest text-sm border-b-4 border-slate-950 active:border-b-0 active:translate-y-1"
               >
                  Batalkan
               </button>
            </div>
         </div>
      </div>

    </div>
  );
};
