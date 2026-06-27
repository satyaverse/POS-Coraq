# Coraq POS localStorage to MySQL Migration Plan

Tanggal: 2026-06-27

## 1. Tujuan

Dokumen ini memetakan data localStorage Coraq POS ke schema MySQL. Tahap ini belum mengubah runtime aplikasi. Migration tool/API akan dibuat setelah schema dan SQL baseline disetujui.

## 2. Current localStorage Keys

| localStorage key | Target MySQL table |
| --- | --- |
| `coraq_users` | `users`, `user_auth_credentials`, `roles` |
| `coraq_orders` | `orders`, `order_items`, `order_item_modifiers`, `payments`, `order_promotions`, `order_status_events`, `station_status_events`, `member_point_ledger`, `stock_movements` |
| `coraq_ingredients` | `ingredients`, `ingredient_price_history` |
| `coraq_modifiers` | `modifiers`, `modifier_target_categories`, `modifier_recipe_adjustments` |
| `coraq_members` | `members`, `member_auth_credentials` |
| `coraq_products` | `products`, `product_recipes`, `categories` |
| `coraq_categories` | `categories` |
| `coraq_shift` | `shifts` |
| `coraq_shift_history` | `shifts` |
| `coraq_expenses` | `expenses`, `stock_movements` for purchase rows |
| `coraq_audit` | `audit_logs` |
| `coraq_promotions` | `promotions` |
| `coraq_config` | `store_config` |
| `coraq_attendance` | `attendance_logs` |

## 3. Migration Sequence

1. Export localStorage JSON from browser.
2. Validate each key exists and has expected array/object shape.
3. Normalize enum values to database constants.
4. Load reference tables: roles, permissions, categories, store config.
5. Load catalog and inventory: ingredients, products, recipes, modifiers.
6. Load users and members.
7. Load operational records: shifts, orders, payments, expenses, attendance, audit.
8. Rebuild derived ledgers where possible:
   - stock movements from order item recipes and purchase metadata.
   - member point ledger from paid orders.
   - status events from order timestamps/status fields.
9. Reconcile totals:
   - ingredient stock.
   - member points.
   - member total spending.
   - shift expected cash.
10. Produce migration report with warnings.

## 4. Field Mapping Notes

### Users

Source fields:

- `id`
- `name`
- `pin`
- `role`
- `phone`
- `avatar`
- `faceDescriptor`
- `dailyRate`

Target:

- `users.id`
- `users.name`
- `users.role_id`
- `users.phone`
- `users.avatar_url`
- `users.face_descriptor_json`
- `users.daily_rate_amount`
- `user_auth_credentials.pin_hash`

Important: plain PIN must be transformed to a secure hash. Demo seed uses SHA2 only as a placeholder; production migration should hash in backend code with a stronger algorithm.

### Members

Source fields:

- `id`
- `fullName`
- `nickname`
- `name`
- `phone`
- `pin`
- `photo`
- `birthDate`
- `gender`
- `tier`
- `status`
- `totalSpending`
- `points`
- `joinDate`
- `lastVisit`

Target:

- `members`
- `member_auth_credentials`

### Products and Recipes

Source `Product.recipe` maps to `product_recipes`.

Source `Product.category` must match `categories.code`.

### Modifiers

Source `Modifier.targetCategories` maps to `modifier_target_categories`.

Source `Modifier.recipeAdjustment` maps to `modifier_recipe_adjustments`.

### Orders

Source fields:

- `id`
- `pagerNumber`
- `items`
- `totalAmount`
- `finalAmount`
- `discountApplied`
- `pointsEarned`
- `pointsRedeemed`
- `promoCode`
- `memberId`
- `customerName`
- `status`
- `paymentStatus`
- `paymentMethod`
- `paidAt`
- `createdAt`
- `cashierName`
- `cashReceived`
- `change`
- `paymentProof`
- `baristaStatus`
- `kitchenStatus`
- station timestamps
- completion timestamps
- handled by fields

Target:

- `orders`
- `order_items`
- `order_item_modifiers`
- `payments` if paid.
- `order_status_events`.
- `station_status_events`.

Known issue: Member Portal currently referenced `order.date` and `order.finalTotal`, but `Order` defines `createdAt` and `finalAmount`. Migration should ignore `date`/`finalTotal` unless found in legacy exported JSON and explicitly mapped as fallback.

### Expenses and Purchases

Source `Expense.purchaseMetadata` maps to `expenses.purchase_metadata_json` and can be used to reconstruct `stock_movements`.

### Audit

Source `AuditLog` maps directly to `audit_logs`, but `user` is a name string, so `user_id` may be nullable unless resolved by name.

## 5. Data Validation Rules

- Reject duplicate phone values for users or members unless manually resolved.
- Reject orders without `createdAt`.
- Reject paid orders without valid payment method.
- Warn if paid order has no `paidAt`; use `createdAt` only as fallback.
- Warn if stock movement reconstruction makes stock negative.
- Warn if member point balance does not match reconstructed ledger.
- Warn if shift summary differs from recalculated totals.

## 6. Known Data Risks

- localStorage data is browser-specific and may diverge between devices.
- Browser storage reset destroys operational data.
- Current PINs are plain text.
- Some held order resume flows delete temporary order records.
- Existing audit coverage is incomplete.
- Face descriptors are sensitive biometric data and require production privacy review.

## 7. Migration Tool Plan

Future migration tool should:

1. Accept exported JSON file.
2. Validate with schema.
3. Print dry-run summary.
4. Insert rows in dependency order.
5. Use SQL transactions per data group.
6. Write a migration report.
7. Refuse production import if critical warnings remain.

Recommended future files:

- `scripts/export-localstorage.md`
- `scripts/migrate-localstorage-to-mysql.ts`
- `src/server/db.ts`
- `src/server/repositories/*`
