# Coraq POS Development Flow Baseline

Tanggal analisa: 2026-06-27

Dokumen ini menjadi dasar awal untuk pengembangan Coraq POS. Isi dokumen dibuat dari struktur kode saat ini, bukan dari asumsi produk ideal. Fokusnya adalah menjelaskan flow aplikasi, batas modul, state utama, risiko teknis, dan arah pengembangan berikutnya.

## 1. Ringkasan Sistem

Coraq POS adalah aplikasi POS coffee shop berbasis React, Vite, TypeScript, dan Express.

Stack saat ini:

- Frontend: React 19, Vite, TypeScript, Tailwind via CDN di `index.html`, `lucide-react`, `recharts`, `leaflet`, `html5-qrcode`, face API.
- Backend ringan: Express di `server.ts`.
- State utama: React Context di `context/StoreContext.tsx`.
- Persistence: `localStorage` browser.
- AI integration: Google Gemini lewat `@google/genai` untuk analytics, marketing, dan location intelligence.

Karakter sistem saat ini:

- Aplikasi masih bersifat local-first/demo-first karena data bisnis utama disimpan di browser.
- Belum ada database server-side.
- Belum ada sistem auth server-side, session token, password hashing, atau role permission yang enforced di backend.
- Backend hanya menangani static/Vite middleware dan endpoint AI.

## 2. Entry Flow Aplikasi

Entry point aplikasi:

- `index.tsx` mount React root.
- `App.tsx` membungkus aplikasi dengan `StoreProvider`.
- `Main` di `App.tsx` memilih layar berdasarkan `currentUser` dan `currentAppView`.

Flow utama:

```text
App
  -> StoreProvider
    -> Main
      -> currentAppView === MEMBER_PORTAL
        -> MemberPortal
      -> currentUser == null
        -> LoginScreen
      -> currentUser.role === CASHIER
        -> POSView
      -> currentUser.role === BARISTA atau KITCHEN
        -> KDSView
      -> currentUser.role === ADMIN atau MANAGER
        -> DashboardView
```

Role bawaan dari `constants.ts`:

- `ADMIN`: Owner Budi, PIN `111111`
- `MANAGER`: Manajer Siti, PIN `222222`
- `CASHIER`: Kasir Andi, PIN `333333`
- `BARISTA`: Barista John, PIN `444444`
- `KITCHEN`: Chef Renatta, PIN `555555`

## 3. State dan Persistence

Semua state domain utama berada di `StoreContext`.

State utama:

- `currentUser`
- `users`
- `products`
- `categories`
- `ingredients`
- `modifiers`
- `orders`
- `members`
- `activeShift`
- `shiftHistory`
- `expenses`
- `auditLogs`
- `attendanceLogs`
- `promotions`
- `storeConfig`

Data awal berasal dari `constants.ts`:

- `USERS`
- `INGREDIENTS`
- `PRODUCTS`
- `MODIFIERS`
- `TIER_RULES`
- `MOCK_MEMBERS`
- `MOCK_PROMOTIONS`
- `DEFAULT_STORE_CONFIG`

Persistence localStorage:

```text
coraq_users
coraq_orders
coraq_ingredients
coraq_modifiers
coraq_members
coraq_products
coraq_categories
coraq_shift
coraq_shift_history
coraq_expenses
coraq_audit
coraq_promotions
coraq_config
coraq_attendance
```

Implikasi development:

- Data antar browser/perangkat tidak sinkron.
- Reset browser storage akan menghapus data operasional.
- Multi-user real-time belum valid karena setiap browser punya state sendiri.
- Pengembangan production perlu migrasi ke database dan API stateful.

## 4. Authentication dan Attendance Flow

Login karyawan:

```text
LoginScreen
  -> input PIN atau nomor HP
  -> authenticate(input)
    -> cari user dari users berdasarkan pin atau phone
  -> jika user ditemukan
    -> tampilkan layar absensi
      -> jika status OUT: CLOCK IN & MASUK POS
      -> jika status IN: MASUK KE SISTEM POS atau CLOCK OUT
  -> setSession(user)
  -> App routing berdasarkan role
```

Face login:

```text
FaceScanner
  -> capture descriptor wajah
  -> authenticateWithFace(descriptor)
  -> hitung Euclidean distance dengan faceDescriptor user
  -> threshold match: 0.6
```

Attendance:

- `clockIn` menambah `AttendanceLog` tipe `CLOCK_IN`.
- `clockOut` menambah `AttendanceLog` tipe `CLOCK_OUT`.
- `getUserStatus` membaca log hari ini dan mengambil status terbaru.

Catatan:

- Attendance hanya localStorage.
- Tidak ada validasi server-side terhadap jam kerja.
- Login admin tetap melewati absensi.

## 5. POS Cashier Flow

Komponen utama: `components/POS/POSView.tsx`

Flow kasir:

```text
Cashier login
  -> POSView
  -> jika belum ada activeShift
    -> modal Mulai Shift
    -> startShift(startCash)
  -> pilih kategori/menu
  -> pilih produk
  -> pilih modifier dan quantity
  -> tambah ke cart
  -> optional: cari/member scan/buat member
  -> input pager
  -> pilih:
    -> bayar sekarang
    -> hold bill
    -> kirim sebagai debt/BON
```

Payment flow:

```text
Cart + pager + optional member
  -> processPayment(method)
    -> createOrder(cart, member, pager, method, pointsToRedeem, PREPARING)
      -> cek stok recipe produk dan modifier
      -> kurangi stok
      -> hitung subtotal
      -> hitung diskon tier member
      -> apply active promotions
      -> apply point redemption
      -> hitung finalAmount
      -> deteksi station:
        -> COFFEE/NON_COFFEE masuk barista
        -> FOOD/DESSERT masuk kitchen
      -> buat Order
      -> jika paid: update points, tier, totalSpending, lastVisit member
      -> simpan orders dan ingredients
```

Hold bill:

```text
handleHoldBillClick
  -> createOrder(..., status PENDING)
  -> stok tetap dikurangi untuk reserve
  -> paymentStatus UNPAID
  -> station status IDLE
  -> tidak tampil di KDS
```

Debt/BON:

```text
markOrderAsDebt(orderId)
  -> status PREPARING
  -> paymentStatus UNPAID
  -> paymentMethod DEBT
  -> station barista/kitchen aktif sesuai item
  -> tampil di KDS
```

Pay debt:

```text
payDebt(orderId, method)
  -> paymentStatus PAID
  -> paidAt sekarang
  -> paymentMethod diubah
  -> jika member aktif: update points, tier, totalSpending
```

Void/resume order:

- `resumeOrder` mengisi cart dari order yang sudah ada.
- `voidOrder` mengembalikan stok lalu menghapus order.
- Untuk hold/resume, implementasi saat ini memilih delete order agar tidak duplikat.

Shift:

```text
startShift(startCash)
  -> activeShift dibuat

getShiftSummary()
  -> cashSales dari paid CASH setelah start shift
  -> nonCashSales dari paid QRIS/DEBIT setelah start shift
  -> debt dari UNPAID setelah start shift
  -> expenses dari CASH_DRAWER setelah start shift
  -> expectedCash = startCash + cashSales - expenses

endShift(actualCash)
  -> simpan closed shift ke shiftHistory
  -> activeShift null
  -> logout
```

## 6. KDS Flow

Komponen utama: `components/KDS/KDSView.tsx`

KDS dibagi berdasarkan role:

- `BARISTA`: menampilkan item kategori `COFFEE` dan `NON_COFFEE`.
- `KITCHEN`: menampilkan item kategori `FOOD` dan `DESSERT`.

Flow KDS:

```text
Order dibuat dengan status PREPARING
  -> createOrder set baristaStatus/kitchenStatus sesuai item
  -> KDSView filter order berdasarkan station status
  -> staff checklist item
  -> jika semua item station selesai
    -> MARK AS READY
    -> updateStationStatus(orderId, role, READY)
  -> jika semua station active READY
    -> global order status READY
  -> jika semua station active COMPLETED
    -> global order status COMPLETED
```

KDS juga menghitung:

- Estimasi waktu produksi dari `standardPrepTime * quantity`.
- Timer overdue.
- Alarm audio ketika order melewati target waktu.
- Sorting active order berdasarkan deadline tercepat.

Catatan:

- Di UI saat ini station bisa diubah menjadi `READY`.
- Perubahan ke `COMPLETED` tergantung flow lain yang memanggil `updateStationStatus(..., COMPLETED)`.
- Global order status sangat bergantung pada station status.

## 7. Admin dan Manager Dashboard Flow

Komponen utama: `components/Admin/DashboardView.tsx`

Admin dan Manager masuk ke view yang sama.

Menu dashboard:

- Ringkasan
- Riwayat Transaksi
- Analytics
- Location Intelligence
- Menu & Produk
- Inventory
- Keuangan
- Marketing
- Membership
- Pegawai / Staff
- Penggajian
- Reset System

Tanggung jawab dashboard:

- Monitoring sales dan ringkasan transaksi.
- Riwayat order.
- Manajemen produk/menu.
- Manajemen inventory dan stock opname.
- Manajemen promotions.
- Manajemen membership, approval, dan bind kartu.
- Manajemen staff, PIN, role, face enrollment.
- Payroll berbasis attendance, daily rate, dan bonus.
- AI analytics dan marketing recommendation.
- Location intelligence untuk ekspansi lokasi.

Catatan development:

- `DashboardView.tsx` sangat besar dan memegang banyak domain sekaligus.
- Perlu dipisahkan menjadi module: `dashboard`, `orders`, `inventory`, `marketing`, `members`, `staff`, `payroll`, `analytics`, `location`.
- Admin/Manager belum punya permission matrix granular. Saat ini keduanya diarahkan ke dashboard yang sama.

## 8. Member Portal Flow

Komponen utama: `components/MemberPortal/MemberPortal.tsx`

Flow:

```text
LoginScreen
  -> Portal Member
  -> input nomor WhatsApp dan PIN
  -> cari member berdasarkan phone
  -> validPin = member.pin atau default "123456"
  -> masuk dashboard member
```

Member dashboard menampilkan:

- Foto member
- Nama dan phone
- Tier
- Points
- Total belanja
- Riwayat transaksi
- Edit foto via camera

Catatan penting:

- Ada mismatch field di riwayat transaksi member: kode membaca `order.date` dan `order.finalTotal`, sementara tipe `Order` mendefinisikan `createdAt` dan `finalAmount`.
- Ini perlu diperbaiki sebelum fitur member portal dianggap stabil.

## 9. Inventory dan Purchasing Flow

Inventory memakai `ingredients` sebagai sumber stok dan HPP.

Stok berkurang ketika order dibuat:

- Product recipe mengurangi `Ingredient.stock`.
- Modifier recipe juga mengurangi `Ingredient.stock`.
- Hold bill juga mengurangi stok untuk reserve.

Stock purchase:

```text
purchaseIngredient(id, buyQty, totalPrice, source, conversionRate, transferProof)
  -> hitung usageQtyAdded = buyQty * conversionRate
  -> hitung purchase price per usage unit
  -> deteksi anomali harga > 20 persen dari HPP lama
  -> update stock
  -> update average cost
  -> simpan priceHistory
  -> buat Expense kategori PURCHASE
  -> log audit
  -> cek margin produk yang memakai ingredient tersebut
```

Void purchase:

```text
voidPurchase(expenseId)
  -> validasi expense PURCHASE dan belum void
  -> rollback stock, HPP, priceHistory jika metadata tersedia
  -> mark expense isVoided
  -> log audit
```

Stock opname:

- `performStockOpname` update actual stock.
- Selisih besar atau nilai tinggi akan dicatat sebagai audit severity lebih tinggi.

## 10. Promotion, Points, dan Loyalty Flow

Promotion:

- Disimpan dalam `promotions`.
- `getActivePromotions` filter berdasarkan `active` dan optional happy hour.
- `createOrder` menerapkan semua promo aktif yang memenuhi `minSpend`.
- Diskon promo dijumlahkan dengan diskon tier dan point redemption, lalu dibatasi maksimal subtotal.

Tier dan points:

- Tier rules dari `TIER_RULES`.
- Points earned dihitung dari `finalAmount / storeConfig.pointEarnRate`.
- Point value dari `storeConfig.pointValue`.
- Member update hanya jika payment status sudah `PAID`.
- Debt/BON tidak langsung update member sampai dilunasi.

Risiko:

- Tidak ada guard agar point redemption tidak melebihi points member di level domain context.
- Validasi lebih banyak berada di UI POS.
- Perlu domain service terpisah agar logic loyalty konsisten di semua flow.

## 11. Server dan API Flow

Server: `server.ts`

Server menjalankan:

- `express.json({ limit: "20mb" })`
- Vite middleware saat development.
- Static `dist` saat production.
- Port `3000`, host `0.0.0.0`.

Endpoint:

```text
POST /api/analytics/ai-forecast
POST /api/marketing/ai-analyze
POST /api/marketing/location-analyze
```

AI flow umum:

```text
Frontend Dashboard / Location Intelligence
  -> fetch endpoint Express
  -> server baca GEMINI_API_KEY
  -> GoogleGenAI generateContent
  -> minta response JSON
  -> parse JSON
  -> kembalikan hasil + sources + isFallback
  -> jika Gemini error/quota: fallback lokal
```

Catatan:

- `/api/analytics/ai-forecast` dan `/api/marketing/ai-analyze` return 400 jika `GEMINI_API_KEY` kosong.
- `/api/marketing/location-analyze` bisa fallback otomatis jika API key kosong.
- Prompt memakai Google Search grounding.
- Model yang dipakai: `gemini-3.5-flash`.

## 12. Data Model Utama

Entity utama dari `types.ts`:

- `User`: staff/admin account, PIN, role, phone, avatar, face descriptor, daily rate.
- `Member`: customer/member, phone, PIN, tier, status, total spending, points.
- `Product`: menu item, price, category, image, recipe, commission, prep time, overhead.
- `Ingredient`: stock item, unit, cost per unit, conversion, price history, semi-finished recipe.
- `Modifier`: sugar/ice/addon with optional recipe adjustment.
- `CartItem`: product, quantity, modifiers, note, KDS completion.
- `Order`: pager, items, amount, discount, member, status, payment, station statuses, timestamps.
- `Shift`: cashier, start/end cash, expected cash, variance, sales summaries.
- `Expense`: operational/purchase expense.
- `AuditLog`: operational audit record.
- `Promotion`: discount campaign.
- `StoreConfig`: point and commission config.

Status penting:

```text
OrderStatus:
  PENDING -> hold/unpaid/not in KDS
  PREPARING -> active production
  READY -> station(s) ready
  COMPLETED -> completed order
  CANCELLED -> cancelled order

StationStatus:
  IDLE -> station not involved
  PENDING -> reserved but not currently used much
  PREPARING -> visible active work
  READY -> station finished preparation
  COMPLETED -> station completed handoff

MemberStatus:
  ACTIVE
  PENDING
  BLOCKED
  PENDING_CARD
```

## 13. Risiko Teknis Saat Ini

Prioritas tinggi:

- Data bisnis hanya di localStorage, belum aman untuk produksi multi-device.
- Tidak ada backend auth dan authorization.
- PIN tersimpan plain text.
- Tidak ada database transaction untuk order, stock, payment, dan member points.
- `DashboardView.tsx` dan `POSView.tsx` terlalu besar untuk pengembangan jangka panjang.
- Tidak ada automated test.
- Domain logic transaksi bercampur dengan UI dan context.
- Tidak ada audit lengkap untuk semua aksi sensitif seperti order payment, refund, edit price, edit staff.

Prioritas menengah:

- Field mismatch di Member Portal (`date/finalTotal` vs `createdAt/finalAmount`).
- `voidOrder` menghapus order, bukan selalu membuat record cancellation.
- Role Admin dan Manager belum dibedakan permission-nya.
- Error handling API AI belum seragam.
- Hardcoded fallback/demo data masih banyak.
- Beberapa string terlihat terkena encoding issue di UI/source.

Prioritas rendah:

- README masih default AI Studio dan belum menjelaskan produk POS.
- Struktur folder belum mencerminkan domain.
- Belum ada `.env.example` yang eksplisit untuk `GEMINI_API_KEY`.

## 14. Rekomendasi Arah Development

Tahap 1: Stabilkan baseline local app

- Tambahkan test runner.
- Buat unit test untuk order calculation, stock deduction, shift summary, loyalty points, dan station status.
- Perbaiki Member Portal field mismatch.
- Tambahkan `.env.example`.
- Update README agar sesuai project.
- Pisahkan domain calculation dari komponen UI.

Tahap 2: Modularisasi frontend

- Pecah `POSView.tsx` menjadi:
  - cart module
  - product grid
  - payment modal
  - member lookup/registration
  - shift modal
  - order list/hold/debt
  - purchase modal
- Pecah `DashboardView.tsx` menjadi module domain:
  - dashboard summary
  - transactions
  - products
  - inventory
  - finance
  - marketing
  - members
  - staff
  - payroll
  - analytics
- Pindahkan business logic ke service/hook terpisah.

Tahap 3: Backend dan database

- Desain database schema untuk users, roles, products, ingredients, modifiers, orders, order_items, payments, members, shifts, expenses, audit_logs, promotions, attendance.
- Tambahkan API CRUD.
- Tambahkan auth server-side, password/PIN hashing, session/JWT.
- Tambahkan authorization per permission.
- Migrasi localStorage ke backend persistence.

Tahap 4: Production readiness

- Tambahkan migration dan seed data.
- Tambahkan audit trail immutable untuk aksi kasir/admin.
- Tambahkan backup/export data.
- Tambahkan logging server-side.
- Tambahkan validation schema di API.
- Tambahkan E2E test untuk login, transaksi, KDS, close shift, member portal.

## 15. Development Guardrails

Untuk pengembangan berikutnya, gunakan aturan ini:

- Jangan menambah logic bisnis besar langsung ke `POSView.tsx` atau `DashboardView.tsx`.
- Semua perubahan transaksi harus dites terhadap:
  - stok
  - payment status
  - points/tier member
  - shift summary
  - KDS station status
- Jangan mengubah struktur `Order` tanpa migration plan untuk data localStorage lama.
- Jangan menghapus order untuk kasus operasional final; gunakan status `CANCELLED` atau audit log kecuali untuk flow resume hold yang memang bersifat temporary.
- Permission Admin/Manager harus dirancang sebelum fitur sensitif ditambah.
- Jika mulai memakai database, localStorage hanya boleh menjadi cache/session ringan, bukan source of truth.

## 16. Quick Reference Flow

Transaksi paid normal:

```text
Login cashier -> Clock in -> Start shift -> Add cart -> Select member optional
-> Enter pager -> Pay CASH/QRIS/DEBIT -> createOrder PREPARING
-> stock deducted -> order visible in KDS -> station READY
-> global READY/COMPLETED -> shift summary includes sale
```

Hold bill:

```text
Add cart -> Enter pager -> Hold bill -> createOrder PENDING
-> stock reserved -> not visible in KDS -> resume later
-> pay or mark as debt
```

Debt/BON:

```text
Hold/debt order -> markOrderAsDebt -> paymentStatus UNPAID
-> visible in KDS -> payDebt later -> member points applied after payment
```

Inventory purchase:

```text
Select ingredient -> input quantity/price/source -> purchaseIngredient
-> stock added -> average cost recalculated -> expense created -> audit logged
```

Admin AI analytics:

```text
Dashboard -> fetch server endpoint -> Gemini or fallback -> render recommendation
```

## 17. Immediate Backlog Recommendation

Urutan kerja yang paling masuk akal:

1. Tambahkan test setup dan test domain untuk `createOrder`, `getShiftSummary`, `payDebt`, `voidOrder`, dan `updateStationStatus`.
2. Perbaiki bug Member Portal order history.
3. Extract domain functions dari `StoreContext` agar testable tanpa React.
4. Update README dan `.env.example`.
5. Pecah `POSView` dan `DashboardView` secara bertahap tanpa mengubah behavior.
6. Rancang schema database dan migration plan dari localStorage.

