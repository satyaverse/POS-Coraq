const fs = require('fs');
let content = fs.readFileSync('context/StoreContext.tsx', 'utf8');

// 1. Find the start of the useEffect that loads from local storage
const loadEffectStart = content.indexOf('  // Load from local storage\n  useEffect(() => {\n    try {\n      const savedUsers');
if (loadEffectStart === -1) {
    console.error("Could not find load effect start");
    process.exit(1);
}

// 2. Find the end of the Persist changes section
const persistEffectEndStr = "useEffect(() => { localStorage.setItem('coraq_attendance', JSON.stringify(attendanceLogs)); }, [attendanceLogs]);";
const persistEffectEnd = content.indexOf(persistEffectEndStr) + persistEffectEndStr.length;
if (content.indexOf(persistEffectEndStr) === -1) {
    console.error("Could not find persist effect end");
    process.exit(1);
}

const syncCode = `  const [isInitializing, setIsInitializing] = useState(true);

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
  }, []);`;

content = content.substring(0, loadEffectStart) + syncCode + content.substring(persistEffectEnd);

fs.writeFileSync('context/StoreContext.tsx', content);
console.log("Successfully patched StoreContext.tsx");
