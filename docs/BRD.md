# Business Requirements Document: Coraq POS

Tanggal: 2026-06-27

## 1. Ringkasan Bisnis

Coraq POS adalah sistem point of sale untuk coffee shop yang dirancang untuk mendukung operasional harian dari kasir, barista, kitchen, owner, manager, dan member. Sistem ini menghubungkan penjualan, produksi pesanan, inventory, shift cashier, loyalty, promotion, payroll, dan analytics dalam satu aplikasi.

Dokumen ini mendefinisikan kebutuhan bisnis berdasarkan flow sistem yang sudah ada. Fokus utamanya adalah memastikan sistem dapat mendukung operasional toko secara konsisten, mengurangi kehilangan data/stok, memberi kontrol kepada owner/manager, dan menyiapkan arah pengembangan menuju sistem production-ready.

## 2. Latar Belakang

Coffee shop membutuhkan POS yang tidak hanya mencatat pembayaran, tetapi juga mengatur alur produksi, stok bahan, loyalty customer, dan laporan operasional. Coraq POS saat ini sudah memiliki banyak domain bisnis, namun masih bersifat local-first dengan localStorage sebagai penyimpanan utama.

Kondisi ini cukup untuk demo atau penggunaan terbatas, tetapi belum cukup untuk operasional production multi-device karena data belum tersentralisasi, auth belum server-side, PIN masih plain text, dan belum ada transaction safety di database.

## 3. Business Objectives

BO-001: Meningkatkan kecepatan dan akurasi transaksi di kasir.

BO-002: Mengurangi miskomunikasi antara cashier, barista, dan kitchen.

BO-003: Mengontrol penggunaan bahan baku melalui recipe-based stock deduction.

BO-004: Memberikan visibilitas sales, shift, expense, dan inventory kepada owner/manager.

BO-005: Meningkatkan retensi customer melalui membership, tier, points, dan promotion.

BO-006: Mendukung pengelolaan staff, attendance, dan payroll.

BO-007: Menyiapkan fondasi sistem agar dapat digunakan di production dengan database, auth, authorization, audit trail, dan backup.

## 4. Business Stakeholders

### Owner/Admin

Kepentingan bisnis:

- Melihat performa toko.
- Mengontrol transaksi dan kas.
- Mengelola produk, harga, stok, staff, promosi, dan member.
- Mengambil keputusan berdasarkan analytics.
- Memastikan data operasional aman dan dapat diaudit.

### Manager

Kepentingan bisnis:

- Memantau operasional harian.
- Mengelola menu, stok, promosi, member, dan staff sesuai kewenangan.
- Melihat laporan transaksi, expense, dan payroll.

### Cashier

Kepentingan bisnis:

- Melayani order dengan cepat.
- Menerima pembayaran.
- Mengelola hold bill dan debt/BON.
- Menutup shift dengan perhitungan kas yang jelas.

### Barista dan Kitchen Staff

Kepentingan bisnis:

- Menerima daftar pesanan sesuai station.
- Mengetahui prioritas dan deadline produksi.
- Menandai item/order yang selesai.

### Customer/Member

Kepentingan bisnis:

- Mendapat benefit loyalty.
- Melihat points, tier, dan riwayat transaksi.
- Mendapat pengalaman pembelian yang cepat dan konsisten.

## 5. Business Scope

### In Scope

- Penjualan produk coffee shop.
- Shift cashier dan cash reconciliation.
- Kitchen display untuk barista dan kitchen.
- Inventory berbasis ingredient dan recipe.
- Purchasing dan stock opname.
- Promotion, points, tier, dan membership.
- Debt/BON dan pembayaran susulan.
- Dashboard admin/manager.
- Staff, attendance, dan payroll.
- Audit log operasional.
- AI analytics dan location intelligence.

### Out of Scope Saat Ini

- Integrasi payment gateway.
- Integrasi accounting.
- Multi-branch management production.
- Real-time sync antar perangkat.
- Centralized database production.
- Role permission granular.
- Compliance finance/audit tingkat enterprise.

## 6. Current Business Process

### 6.1 Transaksi Normal

Cashier login, melakukan clock in, memulai shift, memilih produk, menambahkan modifier, menautkan member bila ada, memasukkan pager, lalu menerima pembayaran CASH, QRIS, atau DEBIT. Sistem membuat order paid, mengurangi stok, menghitung diskon, memperbarui member points, dan mengirim order ke KDS sesuai station.

Business value:

- Transaksi selesai cepat.
- Produksi langsung menerima order.
- Stok dan loyalty langsung tercatat.
- Penjualan masuk ke shift summary.

### 6.2 Hold Bill

Cashier dapat menahan bill dengan status PENDING dan unpaid. Stok tetap dikurangi sebagai reserve, tetapi order tidak tampil di KDS sampai diproses lebih lanjut.

Business value:

- Mendukung customer yang belum langsung membayar.
- Mencegah stok tersedia palsu karena bahan sudah di-reserve.
- Menghindari order belum final masuk ke station produksi.

### 6.3 Debt/BON

Cashier dapat mengirim order sebagai debt/BON. Order unpaid tetapi masuk ke KDS untuk diproduksi. Points member belum diperbarui sampai debt dilunasi.

Business value:

- Mendukung kebiasaan operasional pelanggan tertentu yang membayar belakangan.
- Tetap menjaga proses produksi berjalan.
- Mengurangi risiko loyalty benefit diberikan sebelum pembayaran selesai.

### 6.4 Shift dan Cash Control

Cashier memulai shift dengan start cash. Saat close shift, sistem menghitung cash sales, non-cash sales, debt, expense, expected cash, actual cash, dan variance.

Business value:

- Owner/manager dapat memantau akurasi kas.
- Selisih kas dapat ditelusuri.
- Penjualan per shift lebih mudah direkonsiliasi.

### 6.5 KDS Production

Order paid atau debt/BON masuk ke KDS. Barista hanya melihat coffee/non-coffee, kitchen hanya melihat food/dessert. Staff menyelesaikan item dan menandai station ready.

Business value:

- Mengurangi salah station.
- Memperjelas prioritas produksi.
- Membantu mengukur keterlambatan order.

### 6.6 Inventory dan Purchasing

Stock ingredient berkurang saat order dibuat. Purchase menambah stok, menghitung average cost, mencatat price history, membuat expense, dan mendeteksi anomali harga.

Business value:

- Owner mengetahui stok aktual dan HPP.
- Pembelian bahan tercatat sebagai expense.
- Perubahan harga bahan dapat dideteksi lebih awal.

### 6.7 Membership dan Loyalty

Member memiliki tier, points, total spending, dan riwayat transaksi. Points dan tier diperbarui setelah order paid. Promotion dan redemption mengurangi final amount sesuai aturan.

Business value:

- Meningkatkan retensi customer.
- Memberi insentif pembelian ulang.
- Promotion dapat digunakan untuk mendorong traffic atau campaign tertentu.

### 6.8 Dashboard dan Analytics

Admin/manager melihat ringkasan penjualan, transaksi, inventory, finance, marketing, membership, staff, payroll, AI analytics, dan location intelligence.

Business value:

- Pengambilan keputusan lebih cepat.
- Owner dapat melihat masalah operasional.
- Manager dapat mengelola kegiatan harian.

## 7. Business Requirements

BR-001: Sistem harus mendukung transaksi kasir dari order sampai pembayaran.

BR-002: Sistem harus mengirim order ke station produksi yang tepat.

BR-003: Sistem harus memisahkan order barista dan kitchen.

BR-004: Sistem harus mendukung hold bill untuk transaksi yang belum final.

BR-005: Sistem harus mendukung debt/BON untuk pelanggan yang membayar belakangan.

BR-006: Sistem harus memastikan loyalty benefit hanya diberikan setelah pembayaran selesai.

BR-007: Sistem harus mengurangi stok berdasarkan recipe saat order dibuat.

BR-008: Sistem harus dapat mengembalikan stok jika order dibatalkan atau void.

BR-009: Sistem harus mencatat pembelian bahan dan perubahan HPP.

BR-010: Sistem harus mendeteksi perubahan harga bahan yang tidak normal.

BR-011: Sistem harus menyediakan ringkasan shift untuk rekonsiliasi kas.

BR-012: Sistem harus mencatat expense yang memengaruhi cash drawer.

BR-013: Sistem harus menyediakan data transaksi dan ringkasan penjualan untuk owner/manager.

BR-014: Sistem harus mendukung member tier, points, redemption, dan promotion.

BR-015: Sistem harus mendukung portal member untuk melihat benefit dan riwayat transaksi.

BR-016: Sistem harus mendukung attendance staff untuk payroll.

BR-017: Sistem harus mendukung audit log untuk aksi operasional penting.

BR-018: Sistem production harus memiliki database server-side sebagai source of truth.

BR-019: Sistem production harus memiliki auth dan authorization server-side.

BR-020: Sistem production harus memiliki permission matrix yang membedakan admin dan manager.

BR-021: Sistem production harus memiliki backup/export data.

BR-022: Sistem production harus memiliki test otomatis untuk flow bisnis kritis.

## 8. Business Rules

### Transaction Rules

- Order paid normal harus masuk ke KDS.
- Hold bill tidak boleh muncul di KDS.
- Debt/BON harus muncul di KDS walaupun unpaid.
- Order paid harus masuk ke shift summary sesuai payment method.
- Order unpaid harus dihitung sebagai debt.
- Void order harus mengembalikan stok.

### Inventory Rules

- Ingredient stock berkurang berdasarkan recipe product dan modifier.
- Hold bill tetap mengurangi stok sebagai reserve.
- Purchase ingredient harus memperbarui stock dan average cost.
- Void purchase harus melakukan rollback jika metadata tersedia.
- Stock opname dengan selisih besar harus menghasilkan audit log.

### Loyalty Rules

- Points earned dihitung dari final amount.
- Point redemption menggunakan point value dari store config.
- Diskon total tidak boleh melebihi subtotal.
- Tier member mengikuti total spending.
- Member points dan tier hanya berubah untuk order paid.
- Redemption tidak boleh melebihi points member.

### Shift Rules

- Cashier harus memiliki active shift untuk menjalankan transaksi.
- Expected cash dihitung dari start cash, cash sales, dan cash drawer expenses.
- Close shift harus menyimpan history dan variance.
- Close shift harus mengakhiri active shift cashier.

### Access Rules

- Cashier masuk ke POS.
- Barista dan kitchen masuk ke KDS.
- Admin dan manager masuk ke dashboard.
- Production harus membedakan akses admin dan manager secara granular.

## 9. Business Data Requirements

Data bisnis utama:

- Staff dan role.
- Product, category, modifier, dan recipe.
- Ingredient, stock, unit, HPP, price history.
- Order, order item, payment, status, station status.
- Member, points, tier, total spending.
- Shift dan shift history.
- Expense dan purchase.
- Attendance dan payroll.
- Promotion.
- Audit log.
- Store configuration.

Kebutuhan data production:

- Data harus tersimpan di database.
- Data harus dapat di-backup dan diekspor.
- Aksi sensitif harus memiliki audit trail.
- Perubahan struktur data harus memiliki migration plan.

## 10. Reporting Requirements

RR-001: Laporan ringkasan penjualan harian.

RR-002: Riwayat transaksi.

RR-003: Ringkasan shift cashier.

RR-004: Cash variance report.

RR-005: Debt/unpaid order report.

RR-006: Inventory stock report.

RR-007: Purchase dan expense report.

RR-008: Member spending dan points report.

RR-009: Promotion performance report.

RR-010: Attendance dan payroll report.

RR-011: AI sales forecast dan recommendation.

RR-012: Location intelligence report.

## 11. Key Performance Indicators

- Waktu rata-rata penyelesaian transaksi kasir.
- Jumlah order terlambat di KDS.
- Selisih kas per shift.
- Nilai debt/BON yang belum dibayar.
- Akurasi stok ingredient.
- Perubahan HPP bahan utama.
- Jumlah member aktif.
- Repeat purchase member.
- Redemption rate points.
- Revenue dari campaign promotion.
- Attendance compliance staff.

## 12. Assumptions

- Satu toko digunakan sebagai baseline bisnis awal.
- Produk utama adalah coffee shop dengan kategori coffee, non-coffee, food, dan dessert.
- Staff menggunakan PIN/face login pada baseline.
- Pembayaran non-cash dicatat manual sebagai QRIS atau DEBIT.
- Fitur AI bersifat pendukung keputusan, bukan source of truth operasional.
- Baseline localStorage hanya untuk demo/stabilisasi, bukan target akhir production.

## 13. Constraints

- Data saat ini tidak sinkron antar browser/perangkat.
- Tidak ada database transaction untuk menjaga atomicity order, stock, payment, dan points.
- Tidak ada backend authorization.
- Tidak ada automated test pada baseline.
- Komponen DashboardView dan POSView masih terlalu besar.
- Beberapa validasi bisnis masih berada di UI, bukan domain service.

## 14. Business Risks

Risiko tinggi:

- Kehilangan data karena localStorage terhapus.
- Perbedaan data antar perangkat.
- Penyalahgunaan akses karena permission belum granular.
- PIN plain text.
- Ketidaksesuaian stok jika transaksi gagal di tengah proses tanpa transaction safety.
- Kesalahan laporan jika business logic tidak diuji otomatis.

Risiko menengah:

- Riwayat member salah karena mismatch field.
- Void order menghapus record sehingga jejak cancellation bisa hilang.
- AI endpoint memiliki perilaku fallback/error yang belum seragam.
- Struktur komponen besar memperlambat pengembangan fitur bisnis.

## 15. Implementation Priorities from Business View

### Prioritas 1: Stabilitas Operasional Lokal

- Perbaiki bug member portal.
- Tambahkan test untuk transaksi, stok, shift, loyalty, dan KDS.
- Dokumentasikan setup dan environment.
- Pisahkan logic bisnis kritis agar dapat diuji.

### Prioritas 2: Kontrol dan Skalabilitas Internal

- Modularisasi POS dan Dashboard.
- Tambahkan permission design admin/manager.
- Perluas audit log untuk aksi sensitif.
- Seragamkan error handling.

### Prioritas 3: Production Readiness

- Tambahkan database.
- Tambahkan backend auth dan authorization.
- Tambahkan transaction-safe API untuk order, payment, stock, dan points.
- Tambahkan backup/export.
- Tambahkan E2E test.

## 16. Business Acceptance Criteria

- Owner dapat melihat ringkasan transaksi dan operasional.
- Cashier dapat menyelesaikan transaksi paid, hold bill, dan debt/BON.
- Barista dan kitchen menerima order sesuai station.
- Stock ingredient berubah sesuai order dan purchase.
- Close shift menghasilkan expected cash dan variance.
- Member menerima points hanya setelah pembayaran selesai.
- Manager dapat mengelola domain operasional sesuai role.
- Sistem memiliki roadmap jelas dari local-first menuju production-ready.
