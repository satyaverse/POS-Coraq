# Full Migration from localStorage to MySQL Backend

Tujuan dari perubahan ini adalah menyingkirkan penggunaan `localStorage` sepenuhnya sebagai sumber kebenaran data (Source of Truth) dan menggantinya dengan API backend Node.js yang terhubung ke database MySQL. Ini merupakan perubahan arsitektur besar-besaran (Fase 4+).

## User Review Required

> [!WARNING]
> **Perubahan Berskala Masif (High Risk)**
> Saat ini, `StoreContext.tsx` mengelola sekitar 15+ entitas (Products, Orders, Inventory, Members, Expenses, Shifts, dll) menggunakan `localStorage`. Mengganti semuanya sekaligus (100% cut-over) membutuhkan modifikasi ribuan baris kode pada *frontend context* dan *backend routes*. Jika terjadi kesalahan kecil, aplikasi bisa *crash*.

> [!IMPORTANT]
> **Ketersediaan MySQL Lokal**
> Script ini akan mencoba terhubung ke database MySQL lokal di `localhost:3306` (sesuai konfigurasi Laragon). Pastikan MySQL service di Laragon Anda sedang menyala.

## Open Questions

1. **Phased vs Big Bang:** Apakah Anda ingin saya mengubah **semuanya sekaligus (100%)** pada sesi ini, atau **bertahap per modul** (Misal: Modul Produk & Inventaris dulu, baru menyusul Order & Member)? Karena skala perubahannya sangat besar, pendekatan bertahap jauh lebih aman.
2. **Kredensial DB:** Asumsi kredensial bawaan Laragon adalah user `root` tanpa password, dan kita akan membuat database bernama `coraq_pos`. Apakah ini sudah sesuai?

## Proposed Changes

### 1. Database Configuration & Setup

#### [NEW] `src/server/db.ts`
- Membuat *connection pool* ke MySQL menggunakan `mysql2/promise`.

#### [NEW] `src/server/scripts/init-db.ts`
- Script yang akan secara otomatis membaca dan mengeksekusi `001_create_core_schema.sql` dan `001_seed_initial_data.sql` saat server dijalankan pertama kali.

### 2. Backend API Implementation

#### [MODIFY] `server.ts`
Menambahkan puluhan *endpoint* REST API baru untuk melayani operasi CRUD:
- `GET /api/catalog/products`, `POST /api/catalog/products`, `PUT`, `DELETE`
- `GET /api/inventory/ingredients`, `POST /api/inventory/adjust`
- `GET /api/orders`, `POST /api/orders`
- `GET /api/members`, `POST /api/members`
- *Dan semua entitas lainnya...*

Setiap *endpoint* akan menggunakan koneksi dari `db.ts` untuk melakukan *query* SQL (menggantikan logika _mock/fallback_ yang ada saat ini).

### 3. Frontend Context Refactoring

#### [MODIFY] `context/StoreContext.tsx`
- **Menghapus** semua inisialisasi state dari `localStorage.getItem("coraq_...")`.
- **Menambahkan** `useEffect` utama yang melakukan *HTTP GET (fetch)* ke semua *endpoint* `/api/...` saat aplikasi dimuat untuk mengisi *state*.
- **Mengubah** setiap fungsi *action* (seperti `addProduct`, `addOrder`, `updateIngredient`) agar sebelum mengubah *state* React, ia mengirim *HTTP POST/PUT/DELETE* ke backend MySQL. Jika respons sukses, baru *state* UI diperbarui.
- **Menghapus** semua `localStorage.setItem` dari blok kode *StoreContext*.

## Verification Plan

### Automated & Manual Verification
- Memastikan server Node.js menyala tanpa *error connection refused*.
- Membuka URL aplikasi di browser dan melihat *Network tab* memanggil `/api/...` dengan kode status 200.
- Melakukan percobaan *input* satu data (misal: tambah Menu baru) lalu *refresh* halaman. Jika data tidak hilang, berarti MySQL integrasi sukses.
- Memastikan `localStorage` di *DevTools* browser benar-benar kosong (tidak ada `coraq_*`).
