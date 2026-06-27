# Coraq POS MySQL Database Schema

Tanggal: 2026-06-27

## 1. Tujuan

Dokumen ini mendefinisikan schema MySQL awal untuk memindahkan Coraq POS dari localStorage ke database server-side. Schema ini dibuat dari `docs/PRD.md`, `docs/BRD.md`, `docs/development-flow.md`, `types.ts`, dan `constants.ts`.

Scope tahap ini adalah membuat kontrak database dan file SQL. Frontend masih boleh berjalan dengan localStorage sampai backend API dan migrasi runtime dikerjakan pada tahap berikutnya.

## 2. Prinsip Schema

- MySQL menjadi source of truth production.
- Engine tabel menggunakan InnoDB agar foreign key dan transaksi tersedia.
- Character set menggunakan `utf8mb4` dengan collation `utf8mb4_unicode_ci`.
- Nilai uang disimpan sebagai integer rupiah dalam kolom `BIGINT`, bukan floating point.
- Nilai stok dan recipe memakai `DECIMAL(14,3)` agar mendukung gram, ml, pcs, dan fractional stock.
- Data operasional memiliki `created_at` dan `updated_at` jika relevan.
- Aksi operasional final tidak dihapus fisik; gunakan status, void flag, atau audit log.
- JSON hanya dipakai untuk snapshot, metadata provider, atau payload migrasi, bukan relasi inti.
- ID menggunakan `VARCHAR(64)` untuk kompatibilitas dengan ID localStorage saat ini.
- Password/PIN production tidak boleh disimpan plain text. Schema menyediakan kolom hash, sedangkan seed demo memakai hash dari PIN demo.

## 3. Identity dan Access

### roles

Menyimpan role aplikasi:

- `ADMIN`
- `MANAGER`
- `CASHIER`
- `BARISTA`
- `KITCHEN`

Kolom utama:

- `id`
- `code`
- `name`
- `description`

### permissions

Menyimpan permission granular, misalnya:

- `VIEW_DASHBOARD`
- `MANAGE_STAFF`
- `MANAGE_PRODUCTS`
- `MANAGE_INVENTORY`
- `MANAGE_FINANCE`
- `MANAGE_MARKETING`
- `VIEW_PAYROLL`
- `RESET_SYSTEM`
- `USE_POS`
- `USE_KDS`

### role_permissions

Join table untuk role dan permission.

### users

Menyimpan akun staff/admin.

Kolom penting:

- `id`
- `role_id`
- `name`
- `phone`
- `avatar_url`
- `face_descriptor_json`
- `daily_rate_amount`
- `active`

Catatan:

- `face_descriptor_json` menyimpan descriptor wajah sebagai JSON.
- PIN tidak berada di tabel ini.

### user_auth_credentials

Menyimpan credential user.

Kolom penting:

- `user_id`
- `pin_hash`
- `pin_hash_algorithm`
- `pin_updated_at`

### user_sessions

Rencana tabel session server-side.

Kolom penting:

- `id`
- `user_id`
- `refresh_token_hash`
- `expires_at`
- `revoked_at`

## 4. Member dan Loyalty

### members

Menyimpan customer/member.

Kolom penting:

- `id`
- `full_name`
- `nickname`
- `display_name`
- `phone`
- `photo_url`
- `birth_date`
- `gender`
- `tier`
- `status`
- `total_spending_amount`
- `points_balance`
- `join_date`
- `last_visit_at`

### member_auth_credentials

Credential portal member.

Kolom penting:

- `member_id`
- `pin_hash`
- `pin_hash_algorithm`
- `pin_updated_at`

### member_point_ledger

Ledger append-only untuk perubahan points.

Kolom penting:

- `id`
- `member_id`
- `order_id`
- `type`: `EARN`, `REDEEM`, `ADJUST`, `VOID`
- `points`
- `balance_after`
- `note`
- `created_at`

### member_tier_history

Riwayat perubahan tier.

Kolom penting:

- `id`
- `member_id`
- `old_tier`
- `new_tier`
- `total_spending_amount`
- `changed_at`

## 5. Catalog dan Recipe

### categories

Menyimpan kategori produk. Seed awal:

- `COFFEE`
- `NON_COFFEE`
- `FOOD`
- `DESSERT`

### products

Menyimpan menu item.

Kolom penting:

- `id`
- `category_id`
- `name`
- `price_amount`
- `image_url`
- `staff_commission_amount`
- `standard_prep_time_minutes`
- `overhead_amount`
- `active`

### ingredients

Menyimpan bahan baku dan HPP.

Kolom penting:

- `id`
- `name`
- `usage_unit`
- `stock_qty`
- `cost_per_usage_unit_amount`
- `min_stock_level`
- `buy_unit`
- `conversion_rate`
- `is_semi_finished`

### product_recipes

Bill of material produk.

Kolom penting:

- `product_id`
- `ingredient_id`
- `amount`

### modifiers

Menyimpan opsi sugar, ice, addon.

Kolom penting:

- `id`
- `name`
- `price_amount`
- `type`
- `active`

### modifier_target_categories

Menentukan kategori produk yang boleh memakai modifier.

### modifier_recipe_adjustments

Recipe tambahan dari modifier, misalnya extra shot.

### ingredient_price_history

Riwayat harga beli/HPP ingredient.

## 6. Promotion

### promotions

Menyimpan campaign promo.

Kolom penting:

- `id`
- `name`
- `type`: `PERCENTAGE`, `FIXED`
- `value_amount`
- `min_spend_amount`
- `active`
- `happy_hour_start`
- `happy_hour_end`
- `start_date`
- `end_date`

### order_promotions

Snapshot promo yang diterapkan pada order.

## 7. Order dan Payment

### orders

Header transaksi.

Kolom penting:

- `id`
- `pager_number`
- `member_id`
- `customer_name`
- `status`
- `payment_status`
- `payment_method`
- `total_amount`
- `final_amount`
- `discount_applied_amount`
- `points_earned`
- `points_redeemed`
- `cashier_user_id`
- `cashier_name_snapshot`
- `barista_status`
- `kitchen_status`
- `paid_at`
- `created_at`
- `ready_at`
- `completed_at`
- `cancelled_at`

Status order:

- `PENDING`: hold/unpaid, tidak tampil di KDS.
- `PREPARING`: masuk produksi.
- `READY`: semua station aktif ready.
- `COMPLETED`: handoff selesai.
- `CANCELLED`: dibatalkan.

Status station:

- `IDLE`
- `PENDING`
- `PREPARING`
- `READY`
- `COMPLETED`

### order_items

Snapshot item order.

Kolom penting:

- `id`
- `order_id`
- `product_id`
- `product_name_snapshot`
- `category_code_snapshot`
- `unit_price_amount`
- `quantity`
- `note`
- `completed`
- `completed_at`

### order_item_modifiers

Snapshot modifier per item.

### payments

Riwayat pembayaran.

Kolom penting:

- `id`
- `order_id`
- `method`
- `amount`
- `cash_received_amount`
- `change_amount`
- `proof_url`
- `status`
- `paid_at`

Catatan:

- Debt/BON awalnya order unpaid dengan `payment_method = DEBT`.
- Saat dilunasi, insert row payment baru dan update order menjadi paid.

### order_status_events

Append-only event perubahan global order status.

### station_status_events

Append-only event perubahan status barista/kitchen.

## 8. Shift, Expense, Attendance

### shifts

Menyimpan shift cashier.

Kolom penting:

- `id`
- `cashier_user_id`
- `cashier_name_snapshot`
- `start_cash_amount`
- `end_cash_amount`
- `expected_cash_amount`
- `variance_amount`
- `total_cash_sales_amount`
- `total_non_cash_sales_amount`
- `total_debt_amount`
- `total_expenses_amount`
- `opened_at`
- `closed_at`
- `is_open`

### expenses

Menyimpan expense operasional dan purchase.

Kolom penting:

- `id`
- `category`
- `amount`
- `expense_date`
- `description`
- `source`
- `is_voided`
- `transfer_proof_url`
- `purchase_metadata_json`

### attendance_logs

Log clock in/out.

### audit_logs

Audit operasional.

Kolom penting:

- `id`
- `action`
- `user_id`
- `user_name_snapshot`
- `details`
- `severity`
- `metadata_json`
- `created_at`

## 9. Inventory Movement

### stock_movements

Ledger stok untuk deduction, rollback, purchase, stock opname, dan adjustment.

Kolom penting:

- `id`
- `ingredient_id`
- `movement_type`
- `quantity_delta`
- `stock_after`
- `unit_cost_amount`
- `order_id`
- `expense_id`
- `audit_log_id`
- `note`
- `created_at`

Movement type:

- `SALE_DEDUCTION`
- `VOID_ROLLBACK`
- `PURCHASE`
- `PURCHASE_VOID`
- `STOCK_OPNAME`
- `ADJUSTMENT`
- `PRODUCTION_CONSUME`
- `PRODUCTION_OUTPUT`

### stock_opnames

Header stock opname agar selisih fisik dapat diaudit.

## 10. Store Config

### store_config

Menyimpan konfigurasi toko:

- point earn rate.
- point value.
- global commission rate.

Tahap awal hanya satu row default dengan `id = 1`.

## 11. Relasi Kritis

- `users.role_id -> roles.id`
- `products.category_id -> categories.id`
- `product_recipes.product_id -> products.id`
- `product_recipes.ingredient_id -> ingredients.id`
- `modifier_recipe_adjustments.modifier_id -> modifiers.id`
- `modifier_recipe_adjustments.ingredient_id -> ingredients.id`
- `orders.member_id -> members.id`
- `orders.cashier_user_id -> users.id`
- `order_items.order_id -> orders.id`
- `payments.order_id -> orders.id`
- `member_point_ledger.order_id -> orders.id`
- `stock_movements.ingredient_id -> ingredients.id`
- `stock_movements.order_id -> orders.id`
- `expenses.created_by_user_id -> users.id`
- `audit_logs.user_id -> users.id`

## 12. Index Strategy

Index minimum:

- `orders(created_at)`
- `orders(status, payment_status)`
- `orders(member_id, created_at)`
- `payments(order_id, paid_at)`
- `members(phone)`
- `members(status)`
- `users(phone)`
- `products(category_id, active)`
- `ingredients(stock_qty)`
- `shifts(cashier_user_id, opened_at)`
- `expenses(source, expense_date)`
- `attendance_logs(user_id, timestamp)`
- `audit_logs(severity, created_at)`
- `stock_movements(ingredient_id, created_at)`

## 13. Catatan Migrasi

- Data localStorage harus divalidasi sebelum import karena setiap browser dapat berbeda.
- PIN plain text dari localStorage tidak boleh dianggap credential production final.
- `Order` lama harus memakai `createdAt` dan `finalAmount`, bukan `date` dan `finalTotal`.
- Order yang terhapus oleh flow resume hold tidak bisa dipulihkan kecuali masih ada export browser lama.
- Sinkronisasi multi-device baru valid setelah semua write flow memakai API/database.
