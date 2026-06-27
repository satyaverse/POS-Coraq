# Coraq POS Database Transaction Boundaries

Tanggal: 2026-06-27

Dokumen ini menjelaskan workflow yang harus berjalan dalam satu transaksi SQL ketika aplikasi mulai memakai MySQL sebagai source of truth.

## 1. Prinsip Umum

- Semua workflow yang mengubah order, stok, payment, member points, shift, expense, atau audit harus memakai transaksi database.
- Jika salah satu write gagal, seluruh workflow harus rollback.
- Audit log untuk aksi sensitif dibuat dalam transaksi yang sama dengan aksi bisnisnya.
- Stock movement dan point ledger bersifat append-only.
- Order final tidak dihapus fisik; gunakan status `CANCELLED` atau event status.

## 2. Create Paid Order

Trigger: cashier membayar order dengan `CASH`, `QRIS`, atau `DEBIT`.

Dalam satu transaksi:

1. Validasi active shift cashier.
2. Validasi stok recipe product dan modifier.
3. Insert `orders` dengan:
   - `status = PREPARING`
   - `payment_status = PAID`
   - `payment_method = CASH|QRIS|DEBIT`
4. Insert `order_items`.
5. Insert `order_item_modifiers`.
6. Insert `payments`.
7. Deduct `ingredients.stock_qty`.
8. Insert `stock_movements` tipe `SALE_DEDUCTION`.
9. Insert `order_promotions` jika ada promo.
10. Jika ada member:
    - update `members.total_spending_amount`
    - update `members.points_balance`
    - update `members.tier`
    - insert `member_point_ledger`
    - insert `member_tier_history` jika tier berubah.
11. Insert `order_status_events`.
12. Insert `station_status_events` untuk station aktif.

Rollback jika:

- active shift tidak ada.
- stok tidak cukup.
- payment insert gagal.
- update member gagal.
- stock movement gagal.

## 3. Hold Bill

Trigger: cashier menahan bill.

Dalam satu transaksi:

1. Validasi active shift cashier.
2. Validasi stok.
3. Insert `orders` dengan:
   - `status = PENDING`
   - `payment_status = UNPAID`
   - `payment_method = DEBT` atau method sementara sesuai API.
   - station status `IDLE`.
4. Insert `order_items`.
5. Insert `order_item_modifiers`.
6. Deduct stock sebagai reserve.
7. Insert `stock_movements` tipe `SALE_DEDUCTION`.
8. Insert `order_status_events`.

Rollback jika stok tidak cukup atau item insert gagal.

Catatan: hold bill tidak membuat `payments` dan tidak muncul di KDS.

## 4. Mark Order as Debt/BON

Trigger: hold order dikirim sebagai BON.

Dalam satu transaksi:

1. Lock row `orders`.
2. Validasi order masih `PENDING` dan `UNPAID`.
3. Update `orders`:
   - `status = PREPARING`
   - `payment_status = UNPAID`
   - `payment_method = DEBT`
   - station status sesuai item.
4. Insert `order_status_events`.
5. Insert `station_status_events` untuk station aktif.

Rollback jika order sudah paid/cancelled atau tidak ditemukan.

## 5. Pay Debt

Trigger: cashier melunasi order debt/BON.

Dalam satu transaksi:

1. Lock row `orders`.
2. Validasi `payment_status = UNPAID`.
3. Insert `payments` dengan method pelunasan.
4. Update `orders`:
   - `payment_status = PAID`
   - `payment_method = method pelunasan`
   - `paid_at = now`.
5. Jika ada member:
   - update spending.
   - update points.
   - update tier.
   - insert point ledger.
   - insert tier history jika perlu.
6. Insert audit log.

Rollback jika payment insert gagal atau member update gagal.

## 6. Void Order

Trigger: order dibatalkan/void.

Dalam satu transaksi:

1. Lock row `orders`.
2. Validasi order belum final completed atau aturan void terpenuhi.
3. Update `orders.status = CANCELLED`.
4. Jika order sudah deduct stock, rollback stock:
   - update `ingredients.stock_qty`.
   - insert `stock_movements` tipe `VOID_ROLLBACK`.
5. Jika order sudah paid dan member mendapat points:
   - kurangi points member sesuai ledger.
   - insert `member_point_ledger` tipe `VOID`.
6. Insert `order_status_events`.
7. Insert `audit_logs`.

Rollback jika stock rollback gagal.

Catatan: flow resume hold yang sekarang menghapus order perlu diganti dengan status temporary atau event audit sebelum production.

## 7. Purchase Ingredient

Trigger: admin/cashier melakukan pembelian bahan.

Dalam satu transaksi:

1. Lock row `ingredients`.
2. Hitung usage quantity dari buy quantity dan conversion rate.
3. Hitung cost per usage unit.
4. Hitung average cost baru.
5. Update `ingredients.stock_qty` dan `cost_per_usage_unit_amount`.
6. Insert `ingredient_price_history`.
7. Insert `expenses` kategori `PURCHASE`.
8. Insert `stock_movements` tipe `PURCHASE`.
9. Insert `audit_logs`.

Rollback jika expense atau stock movement gagal.

## 8. Void Purchase

Trigger: purchase expense dibatalkan.

Dalam satu transaksi:

1. Lock row `expenses`.
2. Validasi category `PURCHASE` dan `is_voided = 0`.
3. Lock row ingredient terkait dari purchase metadata.
4. Rollback `ingredients.stock_qty`.
5. Restore HPP dan price history bila metadata tersedia.
6. Update `expenses.is_voided = 1`.
7. Insert `stock_movements` tipe `PURCHASE_VOID`.
8. Insert `audit_logs`.

Rollback jika metadata tidak cukup atau stock menjadi negatif.

## 9. Stock Opname

Trigger: admin/manager melakukan stock opname.

Dalam satu transaksi:

1. Lock row `ingredients`.
2. Hitung selisih `actual_stock - current_stock`.
3. Update `ingredients.stock_qty`.
4. Insert `stock_opnames`.
5. Insert `stock_movements` tipe `STOCK_OPNAME`.
6. Insert `audit_logs` dengan severity sesuai nilai/selisih.

Rollback jika stock movement atau audit log gagal.

## 10. Close Shift

Trigger: cashier menutup shift.

Dalam satu transaksi:

1. Lock row `shifts`.
2. Validasi shift masih open.
3. Hitung ulang summary dari database:
   - paid cash sales.
   - paid QRIS/DEBIT sales.
   - unpaid debt.
   - cash drawer expenses.
4. Hitung expected cash.
5. Hitung variance.
6. Update `shifts` dengan close data dan `is_open = 0`.
7. Insert `audit_logs`.

Rollback jika shift sudah closed atau summary tidak bisa dihitung.

## 11. Attendance Clock In/Out

Trigger: staff melakukan clock in/out.

Dalam satu transaksi:

1. Insert `attendance_logs`.
2. Insert audit log opsional untuk event attendance sensitif.

Rollback jika user tidak aktif.

## 12. Promotion dan Member Update

Promotion CRUD dan member approval harus membuat audit log bila dilakukan oleh admin/manager.

Dalam satu transaksi:

1. Update target record.
2. Insert audit log.

Rollback jika audit log gagal.
