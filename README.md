# ☕ Coraq Coffee POS — v1.0.0

Sistem Point-of-Sale (POS) full-stack untuk operasional coffee shop **Coraq Coffee**, dibangun dengan React 19, Express 5, TypeScript, dan MySQL.

---

## 🚀 Fitur Utama

| Modul | Keterangan |
|---|---|
| 🧾 **Kasir (POS)** | Sistem antrian pesanan dengan nomor pager, pemilihan varian produk (modifier), dan metode pembayaran (Tunai, QRIS, Debit) |
| 🧑‍🍳 **Barista / Kitchen Display (KDS)** | Layar real-time untuk dapur/barista, checklist item, timer per pesanan, dan tombol Mark as Ready |
| 💳 **Loyalty Member** | Registrasi member, poin reward, tier (Bronze/Silver/Gold/Platinum), dan penukaran poin |
| 🔄 **Open / Close Kasir (Shift)** | Manajemen shift dengan modal kas awal, laporan penutupan, dan histori shift |
| 📦 **Inventory & Bahan Baku** | Stok bahan, stock opname, pembelian bahan, dan kalkulasi HPP produk |
| 💸 **Hutang / BON** | Pencatatan pesanan hutang dan pelunasan |
| 📊 **Dashboard & Analitik** | Ringkasan penjualan harian, produk terlaris, pengeluaran, dan analisis AI (via Gemini) |
| 👥 **Manajemen User & Absensi** | Clock In/Out per karyawan, manajemen peran (Admin, Kasir, Barista, Kitchen) |
| 🎯 **Promosi** | Manajemen promo kode dan diskon otomatis |
| 🤖 **AI Endpoint** | Forecast penjualan, SWOT Analysis, dan rekomendasi marketing berbasis Gemini AI |

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | React 19, TypeScript 5.8, Vite 6 |
| **Backend** | Express 5, Node.js 20+ |
| **Database** | MySQL 8.0 |
| **Autentikasi** | PIN berbasis SHA-256 + HttpOnly Cookie Sessions |
| **AI** | Google Gemini API (`@google/genai`) |
| **Testing** | Vitest + Testing Library |
| **Styling** | Vanilla CSS / Tailwind utility classes |
| **Other** | `mysql2`, `uuid`, `cookie-parser`, `lucide-react`, `recharts`, `leaflet`, `html5-qrcode`, `@vladmandic/face-api` |

---

## ⚙️ Prasyarat

- **Node.js** v20 LTS atau lebih baru
- **MySQL** 8.0 (atau MariaDB yang kompatibel, misal via Laragon)
- **npm**

---

## 🗄️ Setup Database

**1. Buat database MySQL:**
```sql
CREATE DATABASE coraq_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**2. Jalankan schema migrations (urut):**
```bash
mysql -u root coraq_pos < database/migrations/001_initial_schema.sql
# (ulangi untuk setiap file migrasi di folder database/migrations/)
```

**3. Isi data awal (seed):**
```bash
mysql -u root coraq_pos < database/seeds/users.sql
mysql -u root coraq_pos < database/seeds/products.sql
# (ulangi untuk setiap file seed yang tersedia)
```

> Lihat `database/README.md` dan `docs/database-schema.md` untuk detail lengkap skema.

---

## 🔧 Setup Lokal

**1. Install dependencies:**
```bash
npm install
```

**2. Salin file environment:**
```bash
# Linux / macOS
cp .env.example .env.local

# Windows PowerShell
Copy-Item .env.example .env.local
```

**3. Isi variabel environment di `.env.local`:**

| Variabel | Wajib? | Keterangan |
|---|---|---|
| `DB_HOST` | ✅ Ya | Host MySQL (biasanya `localhost`) |
| `DB_PORT` | ✅ Ya | Port MySQL (default: `3306`) |
| `DB_USER` | ✅ Ya | Username MySQL (biasanya `root`) |
| `DB_PASSWORD` | ✅ Ya | Password MySQL |
| `DB_NAME` | ✅ Ya | Nama database (contoh: `coraq_pos`) |
| `GEMINI_API_KEY` | ⚙️ Opsional | Wajib hanya untuk fitur AI (Forecast, SWOT, dsb.) |

**4. Jalankan development server:**
```bash
npm run dev
```

Aplikasi akan berjalan di: **http://localhost:3000**

---

## 🖥️ Perintah Tersedia

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Jalankan server development (Express + Vite HMR) |
| `npm run build` | Build production (React + bundle server) |
| `npm start` | Jalankan hasil build production |
| `npm test` | Jalankan test suite (Vitest) |
| `npm run test:watch` | Jalankan test dalam watch mode |

---

## 👤 Akun Default (Seed)

| Role | PIN |
|---|---|
| Admin | `111111` |
| Kasir | `333333` |
| Barista | `444444` |

> PIN dapat diubah melalui panel Admin setelah login.

---

## 🏗️ Struktur Proyek

```
POS-Coraq/
├── components/
│   ├── Admin/          # Dashboard, manajemen produk, user, inventory, promo
│   ├── KDS/            # Kitchen Display System (layar Barista/Kitchen)
│   ├── MemberPortal/   # Portal self-service member
│   └── POS/            # Layar kasir utama, cart, payment, shift
├── context/
│   └── StoreContext.tsx  # Global state & API wrapper (React Context)
├── database/
│   ├── migrations/       # SQL schema migrations
│   └── seeds/            # Data awal (users, produk, dll.)
├── docs/                 # Dokumentasi teknis tambahan
├── src/
│   ├── domain/           # Business logic murni (KDS, shift, dll.)
│   └── server/
│       ├── api/          # REST API endpoints (Express Router)
│       └── db.ts         # Koneksi MySQL pool
├── test/                 # Integration tests (Vitest)
├── server.ts             # Entry point Express server
├── types.ts              # TypeScript types & interfaces global
└── constants.ts          # Data mock, konstanta aplikasi
```

---

## 🔐 Sistem Autentikasi

Aplikasi menggunakan sistem sesi berbasis **HttpOnly Cookie** + **MySQL**:

1. User memasukkan PIN → frontend POST ke `/api/auth/login`
2. Backend memverifikasi PIN (SHA-256 hash) dari tabel `user_auth_credentials`
3. Jika valid, backend membuat token sesi UUID dan menyimpannya di tabel `user_sessions`
4. Token dikirim ke browser sebagai `HttpOnly Cookie` (`coraq_session`)
5. Setiap request berikutnya dibaca dari cookie → divalidasi dari DB → tidak ada data sensitif di `localStorage`

---

## 📡 API Endpoints Utama

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/sync` | Sinkronisasi seluruh state (user, produk, orders, shift, dll.) |
| `POST` | `/api/auth/login` | Login dengan PIN, membuat session cookie |
| `POST` | `/api/auth/logout` | Logout dan hapus session |
| `POST` | `/api/shifts/start` | Buka kasir (Open Shift) |
| `POST` | `/api/shifts/end` | Tutup kasir (Close Shift) |
| `POST` | `/api/orders` | Buat transaksi/order baru |
| `PUT` | `/api/orders/:id/status` | Update status order (PREPARING, READY, COMPLETED) |
| `PUT` | `/api/orders/:id/station` | Update status stasiun barista/kitchen |
| `PUT` | `/api/orders/:orderId/items/:itemId/completion` | Centang/uncentang item pesanan |
| `POST` | `/api/ai/analyze` | Analisis AI (Forecast, SWOT, Marketing) |

---

## 📝 Catatan Pengembangan

- Perubahan pada file frontend (`components/`, `context/`) di-hot-reload otomatis oleh **Vite HMR**
- Perubahan pada file backend (`server.ts`, `src/server/`) memerlukan **restart server** (`npm run dev`) agar aktif
- Data real-time Barista diperbarui melalui **polling setiap 10 detik** ke `/api/sync`

---

## 📄 Lisensi

Private — Coraq Coffee. All rights reserved.
