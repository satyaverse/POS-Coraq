# Product Requirements Document: Coraq POS

Tanggal: 2026-06-27

## 1. Ringkasan Produk

Coraq POS adalah aplikasi point of sale untuk operasional coffee shop. Produk ini mendukung transaksi kasir, kitchen display system, manajemen shift, inventory, membership, promotion, payroll, analytics, dan dashboard admin.

Baseline aplikasi saat ini berbasis React, Vite, TypeScript, Express ringan, dan localStorage. Dokumen ini mendefinisikan kebutuhan produk berdasarkan flow sistem yang sudah ada, sekaligus membedakan kebutuhan stabilisasi lokal dan kebutuhan menuju penggunaan production.

## 2. Tujuan Produk

Tujuan utama Coraq POS:

- Mempercepat proses pemesanan dan pembayaran di coffee shop.
- Menghubungkan kasir dengan barista dan kitchen melalui KDS.
- Mengurangi kesalahan stok melalui recipe-based inventory deduction.
- Mendukung loyalty member, tier, points, promotion, dan debt/BON.
- Memberikan dashboard operasional untuk owner dan manager.
- Menjadi fondasi sistem POS production-ready yang dapat dimigrasikan dari local-first ke database server-side.

## 3. Pengguna dan Role

### Admin

Admin adalah owner atau pengguna dengan akses penuh. Admin membutuhkan dashboard operasional, konfigurasi toko, manajemen staff, produk, inventory, finance, membership, payroll, reset system, dan analytics.

### Manager

Manager menggunakan dashboard yang sama dengan admin pada baseline saat ini. Dalam versi production, manager membutuhkan permission yang lebih terbatas dibanding admin.

### Cashier

Cashier menggunakan POS untuk login, clock in, start shift, membuat transaksi, menerima pembayaran, hold bill, debt/BON, void/resume order, dan close shift.

### Barista

Barista menggunakan KDS untuk memproses item kategori coffee dan non-coffee.

### Kitchen

Kitchen menggunakan KDS untuk memproses item kategori food dan dessert.

### Member

Member menggunakan portal untuk melihat profil, tier, points, total spending, dan riwayat transaksi.

## 4. Scope Produk

### In Scope Baseline

- Login staff dengan PIN atau nomor HP.
- Login berbasis wajah menggunakan face descriptor.
- Attendance clock in dan clock out.
- POS cashier dengan cart, modifier, member lookup, pager, payment, hold bill, debt/BON, resume, dan void.
- Shift management dengan start cash, actual cash, expected cash, variance, sales summary, debt, dan expense.
- KDS berbasis station barista/kitchen.
- Dashboard admin/manager.
- Product, category, ingredient, modifier, promotion, member, staff, payroll, expense, dan audit log management.
- Inventory purchase, stock opname, average cost update, price anomaly detection, dan void purchase.
- Loyalty tier, points earned, points redemption, member approval, dan bind card.
- AI analytics, marketing recommendation, dan location intelligence via Gemini endpoint.
- Member portal.

### Out of Scope Baseline

- Sinkronisasi multi-device real-time.
- Database server-side sebagai source of truth.
- Auth server-side dengan session/JWT.
- Password/PIN hashing.
- Permission matrix granular.
- Payment gateway settlement.
- Accounting integration.
- Immutable audit trail production-grade.

## 5. Product Principles

- Kasir harus bisa menyelesaikan transaksi normal dengan langkah minimal.
- Order yang sudah dibayar harus langsung masuk ke station produksi yang relevan.
- Hold bill harus dapat ditunda tanpa muncul di KDS.
- Debt/BON harus dapat diproses oleh KDS walaupun belum dibayar.
- Stock harus berkurang saat order dibuat untuk menjaga reserve bahan.
- Points dan tier member hanya diperbarui ketika order sudah paid.
- Admin dan manager harus dapat memonitor transaksi, inventory, staff, dan performa toko.
- Data production tidak boleh bergantung pada localStorage sebagai source of truth.

## 6. Functional Requirements

### 6.1 Authentication dan Attendance

FR-AUTH-001: Sistem harus menyediakan login staff dengan PIN atau nomor HP.

FR-AUTH-002: Sistem harus mencocokkan input login terhadap data user aktif.

FR-AUTH-003: Sistem harus menyediakan login wajah menggunakan face descriptor dan threshold match.

FR-AUTH-004: Setelah login, sistem harus menampilkan flow attendance untuk role staff operasional.

FR-AUTH-005: Sistem harus mencatat clock in dan clock out ke attendance log.

FR-AUTH-006: Sistem harus membaca status attendance hari berjalan berdasarkan log terakhir user.

FR-AUTH-007: Admin harus tetap dapat masuk ke dashboard setelah autentikasi.

FR-AUTH-008: Versi production harus mengganti PIN plain text dengan credential yang di-hash.

### 6.2 POS Cashier

FR-POS-001: Cashier harus dapat memulai shift dengan input start cash.

FR-POS-002: Sistem harus mencegah transaksi cashier berjalan tanpa active shift.

FR-POS-003: Cashier harus dapat memilih kategori dan produk.

FR-POS-004: Cashier harus dapat memilih modifier, quantity, dan note item.

FR-POS-005: Cashier harus dapat mencari atau menautkan member ke transaksi.

FR-POS-006: Cashier harus dapat memasukkan nomor pager.

FR-POS-007: Cashier harus dapat memproses pembayaran CASH, QRIS, dan DEBIT.

FR-POS-008: Saat pembayaran berhasil, sistem harus membuat order dengan status PREPARING dan paymentStatus PAID.

FR-POS-009: Sistem harus menghitung subtotal, diskon tier, diskon promotion, point redemption, dan final amount.

FR-POS-010: Sistem harus mengurangi stok ingredient berdasarkan recipe product dan modifier.

FR-POS-011: Sistem harus menentukan station barista atau kitchen berdasarkan kategori item.

FR-POS-012: Sistem harus memperbarui points, tier, total spending, dan last visit member untuk order paid.

FR-POS-013: Cashier harus dapat melakukan hold bill.

FR-POS-014: Hold bill harus membuat order PENDING, paymentStatus UNPAID, mengurangi stok sebagai reserve, dan tidak tampil di KDS.

FR-POS-015: Cashier harus dapat mengubah hold/debt order menjadi debt/BON.

FR-POS-016: Debt/BON harus memiliki paymentStatus UNPAID, paymentMethod DEBT, status PREPARING, dan tampil di KDS.

FR-POS-017: Cashier harus dapat melunasi debt/BON dengan method pembayaran.

FR-POS-018: Pelunasan debt/BON harus memperbarui points dan tier member bila order memiliki member.

FR-POS-019: Cashier harus dapat resume order dari hold bill.

FR-POS-020: Cashier harus dapat void order dan sistem harus mengembalikan stok.

### 6.3 Shift Management

FR-SHIFT-001: Sistem harus menyimpan active shift cashier.

FR-SHIFT-002: Sistem harus menghitung cash sales dari paid CASH setelah shift dimulai.

FR-SHIFT-003: Sistem harus menghitung non-cash sales dari paid QRIS dan DEBIT setelah shift dimulai.

FR-SHIFT-004: Sistem harus menghitung debt dari unpaid order setelah shift dimulai.

FR-SHIFT-005: Sistem harus menghitung expense cash drawer setelah shift dimulai.

FR-SHIFT-006: Sistem harus menghitung expected cash dari start cash, cash sales, dan expense.

FR-SHIFT-007: Cashier harus dapat close shift dengan actual cash.

FR-SHIFT-008: Close shift harus menyimpan shift history, menghitung variance, menghapus active shift, dan logout cashier.

### 6.4 KDS

FR-KDS-001: Barista harus melihat item kategori COFFEE dan NON_COFFEE.

FR-KDS-002: Kitchen harus melihat item kategori FOOD dan DESSERT.

FR-KDS-003: KDS harus hanya menampilkan order active dengan station status yang relevan.

FR-KDS-004: Staff station harus dapat checklist item yang selesai dibuat.

FR-KDS-005: Jika semua item station selesai, station dapat ditandai READY.

FR-KDS-006: Jika semua station aktif READY, global order status harus menjadi READY.

FR-KDS-007: Jika semua station aktif COMPLETED, global order status harus menjadi COMPLETED.

FR-KDS-008: KDS harus menghitung estimasi waktu produksi berdasarkan standardPrepTime dan quantity.

FR-KDS-009: KDS harus menampilkan overdue timer dan alarm untuk order terlambat.

FR-KDS-010: KDS harus mengurutkan order aktif berdasarkan deadline tercepat.

### 6.5 Dashboard Admin dan Manager

FR-DASH-001: Admin dan manager harus dapat melihat ringkasan penjualan.

FR-DASH-002: Admin dan manager harus dapat melihat riwayat transaksi.

FR-DASH-003: Admin dan manager harus dapat mengelola produk dan menu.

FR-DASH-004: Admin dan manager harus dapat mengelola inventory dan stock opname.

FR-DASH-005: Admin dan manager harus dapat mengelola expense dan finance.

FR-DASH-006: Admin dan manager harus dapat mengelola promotion dan marketing.

FR-DASH-007: Admin dan manager harus dapat mengelola membership.

FR-DASH-008: Admin dan manager harus dapat mengelola staff, PIN, role, dan face enrollment.

FR-DASH-009: Admin dan manager harus dapat melihat payroll berbasis attendance, daily rate, dan bonus.

FR-DASH-010: Admin dan manager harus dapat menggunakan AI analytics, marketing recommendation, dan location intelligence.

FR-DASH-011: Versi production harus membedakan permission admin dan manager.

### 6.6 Member Portal

FR-MEMBER-001: Member harus dapat login memakai nomor WhatsApp dan PIN.

FR-MEMBER-002: Sistem harus memvalidasi member berdasarkan nomor HP dan PIN.

FR-MEMBER-003: Member harus dapat melihat profil, foto, tier, points, total spending, dan riwayat transaksi.

FR-MEMBER-004: Member harus dapat memperbarui foto melalui kamera.

FR-MEMBER-005: Riwayat transaksi member harus memakai field order yang benar, yaitu createdAt dan finalAmount.

### 6.7 Inventory dan Purchasing

FR-INV-001: Sistem harus menyimpan ingredient sebagai sumber stok dan HPP.

FR-INV-002: Sistem harus mengurangi stok ingredient saat order dibuat.

FR-INV-003: Sistem harus menambahkan stok melalui purchase ingredient.

FR-INV-004: Purchase ingredient harus mendukung buy quantity, conversion rate, total price, source, dan transfer proof.

FR-INV-005: Sistem harus menghitung purchase price per usage unit.

FR-INV-006: Sistem harus memperbarui average cost ingredient.

FR-INV-007: Sistem harus menyimpan price history.

FR-INV-008: Sistem harus mendeteksi anomali harga jika harga baru berubah signifikan dari HPP lama.

FR-INV-009: Purchase ingredient harus membuat expense kategori PURCHASE.

FR-INV-010: Void purchase harus melakukan rollback stock, HPP, price history, dan menandai expense sebagai void.

FR-INV-011: Stock opname harus memperbarui actual stock dan membuat audit log jika selisih signifikan.

### 6.8 Promotion, Points, dan Loyalty

FR-LOYALTY-001: Sistem harus menyimpan promotion aktif dan tidak aktif.

FR-LOYALTY-002: Sistem harus memfilter promotion aktif berdasarkan active status dan optional happy hour.

FR-LOYALTY-003: Sistem harus menerapkan promotion yang memenuhi minimum spend.

FR-LOYALTY-004: Sistem harus menjumlahkan diskon promotion dengan diskon tier dan point redemption.

FR-LOYALTY-005: Total diskon tidak boleh melebihi subtotal.

FR-LOYALTY-006: Sistem harus menghitung points earned dari final amount dan pointEarnRate.

FR-LOYALTY-007: Sistem harus menghitung nilai redemption berdasarkan pointValue.

FR-LOYALTY-008: Sistem harus memperbarui tier berdasarkan total spending.

FR-LOYALTY-009: Domain logic harus memvalidasi redemption agar tidak melebihi points member.

### 6.9 AI Analytics dan Location Intelligence

FR-AI-001: Sistem harus menyediakan endpoint forecast analytics.

FR-AI-002: Sistem harus menyediakan endpoint marketing AI analysis.

FR-AI-003: Sistem harus menyediakan endpoint location analysis.

FR-AI-004: Endpoint AI harus membaca GEMINI_API_KEY dari environment.

FR-AI-005: Endpoint harus mengembalikan response JSON yang bisa dipakai frontend.

FR-AI-006: Sistem harus menyediakan fallback lokal ketika AI provider gagal sesuai kebutuhan endpoint.

FR-AI-007: Error handling endpoint AI harus seragam.

## 7. Non-Functional Requirements

NFR-001: Aplikasi harus tetap dapat berjalan sebagai local-first app untuk demo dan pengembangan awal.

NFR-002: Flow cashier utama harus responsif dan tidak bergantung pada koneksi internet kecuali fitur AI.

NFR-003: Perhitungan transaksi, stok, shift, dan loyalty harus dapat diuji secara otomatis.

NFR-004: Business logic transaksi tidak boleh terus bertambah di komponen UI besar.

NFR-005: Versi production harus memakai database server-side sebagai source of truth.

NFR-006: Versi production harus memakai backend auth dan authorization.

NFR-007: Sistem harus memiliki audit trail untuk aksi sensitif.

NFR-008: Sistem harus memiliki migration plan untuk data localStorage lama sebelum struktur data order berubah.

NFR-009: Sistem harus memiliki validasi schema pada API production.

NFR-010: Sistem harus menyediakan backup/export data untuk production.

## 8. Data Requirements

Entity utama:

- User
- Member
- Product
- Category
- Ingredient
- Modifier
- CartItem
- Order
- Shift
- Expense
- AuditLog
- AttendanceLog
- Promotion
- StoreConfig

Source of truth baseline:

- localStorage browser.

Source of truth production:

- Database server-side untuk seluruh data operasional.
- localStorage hanya boleh dipakai sebagai cache/session ringan.

## 9. Success Metrics

- Cashier dapat menyelesaikan transaksi paid normal dari login sampai order masuk KDS.
- Hold bill dapat dibuat, tidak muncul di KDS, dan dapat di-resume.
- Debt/BON dapat muncul di KDS dan dilunasi kemudian.
- Stock ingredient berkurang sesuai recipe setiap order dibuat.
- Close shift menghasilkan expected cash dan variance yang benar.
- KDS dapat memisahkan item barista dan kitchen.
- Member points dan tier hanya berubah setelah payment paid.
- Admin/manager dapat melihat ringkasan operasional dan mengelola domain utama.
- Automated test menutup flow order calculation, stock deduction, shift summary, loyalty, dan KDS status.

## 10. Prioritas Roadmap

### Fase 1: Stabilisasi Baseline Lokal

- Tambahkan test runner.
- Tambahkan unit test untuk createOrder, getShiftSummary, payDebt, voidOrder, dan updateStationStatus.
- Perbaiki Member Portal order history field mismatch.
- Tambahkan `.env.example`.
- Update README sesuai produk Coraq POS.
- Extract domain calculation dari StoreContext.

### Fase 2: Modularisasi Frontend

- Pecah POSView menjadi modul cart, product grid, payment modal, member lookup, shift modal, order list, dan purchase modal.
- Pecah DashboardView menjadi modul dashboard summary, transactions, products, inventory, finance, marketing, members, staff, payroll, analytics, dan location.
- Pindahkan business logic ke service atau hook terpisah.

### Fase 3: Backend dan Database

- Rancang schema database.
- Tambahkan API CRUD.
- Tambahkan auth server-side.
- Tambahkan authorization per permission.
- Migrasi localStorage ke backend persistence.

### Fase 4: Production Readiness

- Tambahkan migration dan seed data.
- Tambahkan audit trail immutable.
- Tambahkan backup/export.
- Tambahkan logging server-side.
- Tambahkan API validation schema.
- Tambahkan E2E test untuk login, transaksi, KDS, close shift, dan member portal.

## 11. Risiko Produk

- Data localStorage tidak aman untuk operasional multi-device.
- PIN tersimpan plain text.
- Tidak ada database transaction untuk order, stock, payment, dan member points.
- DashboardView dan POSView terlalu besar untuk pengembangan jangka panjang.
- Belum ada automated test.
- Logic transaksi bercampur dengan UI/context.
- Admin dan manager belum punya permission matrix granular.
- Void order saat ini menghapus order untuk beberapa flow, bukan selalu mencatat cancellation final.

## 12. Acceptance Criteria MVP Stabilisasi

- Aplikasi dapat berjalan lokal tanpa error utama.
- Cashier dapat login, clock in, start shift, membuat order paid, dan close shift.
- Order paid muncul di KDS sesuai station.
- Hold bill tidak muncul di KDS.
- Debt/BON muncul di KDS dan dapat dilunasi.
- Stock deduction dan rollback void order memiliki unit test.
- Shift summary memiliki unit test.
- Member portal menampilkan riwayat transaksi dengan field yang benar.
- README dan environment setup menjelaskan cara menjalankan aplikasi.
