# Coraq POS

Coraq POS adalah aplikasi point-of-sale untuk operasional coffee shop Coraq. Aplikasi ini mencakup kasir, Kitchen Display System (KDS), inventory bahan, shift kasir, member loyalty, order debt/BON, dashboard operasional, dan endpoint AI untuk analisis/forecast.

## Tech Stack

- React 19
- Vite 6
- TypeScript 5.8
- Express 5
- Vitest
- MySQL 8-compatible schema sudah disiapkan di folder `database/`, tetapi runtime frontend saat ini belum terhubung ke database.

## Prasyarat

- Node.js 20 LTS atau versi modern yang kompatibel dengan Vite 6
- npm

## Setup Lokal

Install dependency:

```bash
npm install
```

Salin environment example ke file lokal:

```bash
cp .env.example .env.local
```

PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Isi `GEMINI_API_KEY` jika ingin memakai fitur AI.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | Optional untuk menjalankan app, required untuk fitur AI | API key Gemini yang dipakai endpoint AI analytics, marketing analysis, dan forecast. |

## Commands

Jalankan development server:

```bash
npm run dev
```

Build production:

```bash
npm run build
```

Jalankan hasil build:

```bash
npm start
```

Jalankan test:

```bash
npm test
```

Jalankan test watch mode:

```bash
npm run test:watch
```

## Persistence Saat Ini

Runtime aplikasi saat ini masih menggunakan `localStorage` browser sebagai source of truth untuk data operasional seperti order, member, produk, inventory, shift, expense, audit log, promotion, store config, dan attendance.

Schema MySQL, seed, dan dokumen migrasi sudah tersedia sebagai kontrak database awal, tetapi integrasi backend API ke MySQL belum menjadi source of truth runtime pada tahap ini. Jangan menghapus data browser sebelum export/migrasi jika data lokal masih dibutuhkan.

## Database Docs

- `database/README.md`
- `docs/database-schema.md`
- `docs/database-transaction-boundaries.md`
- `docs/localstorage-migration-plan.md`
