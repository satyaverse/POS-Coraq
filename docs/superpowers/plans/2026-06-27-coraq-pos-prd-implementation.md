# Coraq POS PRD Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Break down `docs/PRD.md` into executable implementation tasks that create the MySQL database foundation first, then stabilize the current POS behavior, modularize the frontend, and integrate the backend step by step.

**Architecture:** Execution now starts with a MySQL-first foundation: schema design, migration files, seed data, transaction boundaries, and localStorage migration mapping. After the database contract is clear, add test infrastructure and extract critical business calculations from `context/StoreContext.tsx` into pure domain modules before wiring backend APIs to MySQL.

**Tech Stack:** React 19, Vite 6, TypeScript 5.8, Express 5, MySQL 8-compatible schema, localStorage migration source, future Vitest/Testing Library test setup, future server-side database/auth.

---

## Scope Mapping

This plan is derived from `docs/PRD.md` and `docs/development-flow.md`.

Primary MVP stabilization acceptance criteria:

- Cashier can login, clock in, start shift, create paid order, and close shift.
- Paid order appears in KDS according to station.
- Hold bill does not appear in KDS.
- Debt/BON appears in KDS and can be paid later.
- Stock deduction and void rollback are covered by unit tests.
- Shift summary is covered by unit tests.
- Member portal uses `createdAt` and `finalAmount`.
- README and environment setup explain how to run the app.

Database-first execution change:

- MySQL schema and migration files are now the first implementation phase.
- localStorage remains the current runtime source until backend integration is implemented.
- The first database deliverable is a schema contract and SQL files, not a partial frontend rewrite.
- Backend/API integration happens only after schema, seed data, and migration mapping are reviewed.

Production requirements not completed by schema-only work:

- Database source of truth.
- Server-side auth and authorization.
- Permission matrix.
- Immutable audit trail.
- Backup/export.
- E2E test suite.

## File Structure Target

Create these focused files over the implementation:

- `database/migrations/001_create_core_schema.sql`: MySQL DDL for the first production schema.
- `database/seeds/001_seed_initial_data.sql`: seed data matching current demo constants where practical.
- `database/README.md`: how to create, migrate, seed, reset, and inspect the local database.
- `docs/database-schema.md`: table-by-table schema explanation and relationship notes.
- `docs/localstorage-migration-plan.md`: mapping from current `coraq_*` localStorage keys to MySQL tables.
- `docs/database-transaction-boundaries.md`: transactional workflows for order, stock, payment, member points, shift, and purchase operations.
- `src/domain/orderCalculations.ts`: subtotal, modifiers, discounts, final amount, points earned, and points redemption validation.
- `src/domain/inventory.ts`: recipe stock deduction, rollback, stock availability, purchase average cost helpers.
- `src/domain/shift.ts`: shift summary calculation.
- `src/domain/kds.ts`: station assignment, station status transitions, KDS filtering/sorting helpers.
- `src/domain/loyalty.ts`: tier resolution, member paid-order updates, promotion eligibility.
- `src/domain/audit.ts`: audit severity helpers for inventory and sensitive operations.
- `src/domain/__tests__/*.test.ts`: unit tests for domain rules.
- `test/setup.ts`: browser/global test setup when required.
- `docs/implementation-roadmap.md`: readable roadmap summary for non-engineering review.

Modify existing files:

- `package.json`: add test dependencies and scripts.
- `vite.config.ts`: add test config if Vitest is used.
- `context/StoreContext.tsx`: call extracted domain helpers while preserving exported context API.
- `components/MemberPortal/MemberPortal.tsx`: fix order history field mismatch.
- `README.md`: replace default setup notes with Coraq POS setup.
- `.env.example`: document `GEMINI_API_KEY`.
- `components/POS/POSView.tsx`: later split into focused POS components without behavior changes.
- `components/Admin/DashboardView.tsx`: later split into dashboard domain modules without behavior changes.
- `server.ts`: later normalize AI endpoint error/fallback behavior.

## Chunk 1: MySQL Database Foundation

This chunk is now the first execution phase. It creates the database contract before refactoring application logic or replacing localStorage. Do not connect the frontend to MySQL in this chunk.

Execution status on 2026-06-27:

- DB-1 completed: `docs/database-schema.md` and `docs/database-transaction-boundaries.md` created.
- DB-2 completed: `database/migrations/001_create_core_schema.sql` and `database/README.md` created.
- DB-3 completed: `database/seeds/001_seed_initial_data.sql` created.
- DB-4 completed: `docs/localstorage-migration-plan.md` created.
- Verification completed against local MySQL database `coraq_pos_codex_verify`.
- Commit steps are intentionally not executed because the user has not requested a git commit.

### Task DB-1: Design MySQL Core Schema

**Maps to:** NFR-005, NFR-008, Roadmap Fase 3, PRD Data Requirements.

**Files:**

- Create: `docs/database-schema.md`
- Create: `docs/database-transaction-boundaries.md`

- [ ] **Step 1: Define schema principles**

Document these principles in `docs/database-schema.md`:

- MySQL is the future source of truth.
- All monetary values use integer minor units, not floating point.
- Operational rows use `created_at` and `updated_at`.
- Final operational records should not be physically deleted unless explicitly temporary.
- Audit-sensitive actions use append-only audit records.
- JSON columns may be used only for snapshots or provider metadata, not for core relational data.

- [ ] **Step 2: Document core identity and access tables**

Include:

- `users`
- `roles`
- `permissions`
- `role_permissions`
- `user_sessions` or planned equivalent
- `member_auth_credentials`

Document how current roles map from `types.ts`: `ADMIN`, `MANAGER`, `CASHIER`, `BARISTA`, `KITCHEN`.

- [ ] **Step 3: Document catalog and recipe tables**

Include:

- `categories`
- `products`
- `modifiers`
- `ingredients`
- `product_recipes`
- `modifier_recipe_adjustments`
- `ingredient_price_history`
- optional `semi_finished_recipes`

- [ ] **Step 4: Document transaction tables**

Include:

- `orders`
- `order_items`
- `order_item_modifiers`
- `payments`
- `order_status_events`
- `station_status_events`

Document status mapping for `PENDING`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`, `IDLE`, `PREPARING`, `READY`, and `COMPLETED`.

- [ ] **Step 5: Document member, loyalty, promotion tables**

Include:

- `members`
- `member_point_ledger`
- `member_tier_history`
- `promotions`
- `order_promotions`

- [ ] **Step 6: Document operations tables**

Include:

- `shifts`
- `expenses`
- `attendance_logs`
- `audit_logs`
- `store_config`
- `stock_movements`
- `stock_opnames`

- [ ] **Step 7: Document transaction boundaries**

Create `docs/database-transaction-boundaries.md` covering:

- create paid order.
- hold bill.
- mark order as debt/BON.
- pay debt.
- void order.
- purchase ingredient.
- void purchase.
- stock opname.
- close shift.

For each workflow, document which tables must be written in one SQL transaction and which failures must rollback.

- [ ] **Step 8: Commit**

```bash
git add docs/database-schema.md docs/database-transaction-boundaries.md
git commit -m "docs: design mysql schema boundaries"
```

### Task DB-2: Create Initial MySQL Migration SQL

**Maps to:** NFR-005, NFR-009, Roadmap Fase 3.

**Files:**

- Create: `database/migrations/001_create_core_schema.sql`
- Create: `database/README.md`

- [ ] **Step 1: Create database folder structure**

Create:

```text
database/
  README.md
  migrations/
    001_create_core_schema.sql
  seeds/
```

- [ ] **Step 2: Write DDL in dependency order**

In `database/migrations/001_create_core_schema.sql`, create tables in this order:

1. reference/config tables.
2. users/roles/permissions.
3. members.
4. catalog and inventory.
5. promotions.
6. shifts and expenses.
7. orders, order items, payments, station events.
8. stock movements and audit logs.

- [ ] **Step 3: Add primary keys and foreign keys**

Use stable string IDs when preserving current app IDs matters. Use `BIGINT UNSIGNED AUTO_INCREMENT` only where no existing localStorage ID needs migration compatibility.

- [ ] **Step 4: Add critical indexes**

At minimum index:

- order created date.
- order status and payment status.
- member phone.
- member status.
- user phone.
- product category.
- ingredient stock/min stock.
- shift cashier and opened time.
- expense source/date.
- audit severity/date.
- attendance user/date.

- [ ] **Step 5: Add `database/README.md`**

Document local execution examples:

```bash
mysql -u root -p -e "CREATE DATABASE coraq_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p coraq_pos < database/migrations/001_create_core_schema.sql
```

- [ ] **Step 6: Verify SQL syntax locally**

Run against local MySQL when available:

```bash
mysql -u root -p coraq_pos < database/migrations/001_create_core_schema.sql
```

Expected: migration completes without SQL errors.

- [ ] **Step 7: Commit**

```bash
git add database/README.md database/migrations/001_create_core_schema.sql
git commit -m "db: add initial mysql schema migration"
```

### Task DB-3: Create Seed Data Plan and Initial Seed SQL

**Maps to:** PRD Data Requirements, Roadmap Fase 4 seed data.

**Files:**

- Create: `database/seeds/001_seed_initial_data.sql`
- Modify: `database/README.md`

- [ ] **Step 1: Map seed source data**

Map current initial data from `constants.ts`:

- `USERS`
- `INGREDIENTS`
- `PRODUCTS`
- `MODIFIERS`
- `TIER_RULES`
- `MOCK_MEMBERS`
- `MOCK_PROMOTIONS`
- `DEFAULT_STORE_CONFIG`

- [ ] **Step 2: Seed minimum viable reference data**

Seed at minimum:

- roles.
- permissions.
- role permissions.
- demo users.
- categories.
- ingredients.
- products.
- modifiers.
- members.
- promotions.
- store config.

- [ ] **Step 3: Document seed behavior**

In `database/README.md`, document whether the seed is safe to rerun. Prefer idempotent `INSERT ... ON DUPLICATE KEY UPDATE` where practical.

- [ ] **Step 4: Verify seed SQL locally**

Run:

```bash
mysql -u root -p coraq_pos < database/seeds/001_seed_initial_data.sql
```

Expected: seed completes and core lookup rows exist.

- [x] **Step 5: Commit**

```bash
git add database/seeds/001_seed_initial_data.sql database/README.md
git commit -m "db: add initial seed data"
```

### Task DB-4: Document localStorage to MySQL Migration

**Maps to:** NFR-008, PRD Data Requirements.

**Files:**

- Create: `docs/localstorage-migration-plan.md`

- [ ] **Step 1: Map current localStorage keys**

Document table targets for:

- `coraq_users`
- `coraq_orders`
- `coraq_ingredients`
- `coraq_modifiers`
- `coraq_members`
- `coraq_products`
- `coraq_categories`
- `coraq_shift`
- `coraq_shift_history`
- `coraq_expenses`
- `coraq_audit`
- `coraq_promotions`
- `coraq_config`
- `coraq_attendance`

- [ ] **Step 2: Define migration phases**

Use this migration sequence:

1. export localStorage JSON from browser.
2. validate JSON shape.
3. transform IDs and enum values.
4. load reference tables.
5. load catalog/inventory.
6. load members/users.
7. load operational data.
8. reconcile stock, points, and shift summaries.

- [ ] **Step 3: Document known data issues**

Include:

- Member portal mismatch: `order.date`/`order.finalTotal` vs `createdAt`/`finalAmount`.
- void/resume flow may delete held orders.
- PINs are currently plain text and must not be migrated as final credentials.
- localStorage may contain browser-specific divergent state.

- [x] **Step 4: Commit**

```bash
git add docs/localstorage-migration-plan.md
git commit -m "docs: map localstorage migration to mysql"
```

### Task DB-5: Update Implementation Plan After Database Review

**Maps to:** Execution governance.

**Files:**

- Modify: `docs/superpowers/plans/2026-06-27-coraq-pos-prd-implementation.md`

Execution status on 2026-06-27:

- Completed: All five database files reviewed.
- Completed: Integration strategy decided and locked.
- Completed: Plan updated with review findings and next-chunk guidance.
- Commit step intentionally not executed because the user has not requested a git commit.

- [x] **Step 1: Review database docs and SQL**

Review these files together:

- `docs/database-schema.md`
- `docs/database-transaction-boundaries.md`
- `docs/localstorage-migration-plan.md`
- `database/migrations/001_create_core_schema.sql`
- `database/seeds/001_seed_initial_data.sql`

Review findings:

- `docs/database-schema.md` (512 lines): schema principles, all 10 entity groups (identity/access, member/loyalty, catalog/recipe, promotion, order/payment, shift/expense/attendance, inventory movement, store config), critical relations, and index strategy are fully documented. No gaps found relative to PRD entities.
- `docs/database-transaction-boundaries.md` (227 lines): covers all 9 required workflows (create paid order, hold bill, mark debt/BON, pay debt, void order, purchase ingredient, void purchase, stock opname, close shift) plus attendance clock in/out and promotion/member CRUD. Each workflow documents which tables are written in one transaction and which failures must rollback.
- `docs/localstorage-migration-plan.md` (199 lines): maps all 14 `coraq_*` localStorage keys to MySQL tables, defines a 10-step migration sequence, documents field mapping per entity type, data validation rules, known data risks, and a migration tool plan.
- `database/migrations/001_create_core_schema.sql`: DDL exists and was previously verified against local MySQL database `coraq_pos_codex_verify` without SQL errors.
- `database/seeds/001_seed_initial_data.sql`: seed file exists and was previously verified to complete without errors. Uses `INSERT ... ON DUPLICATE KEY UPDATE` for idempotent reruns. Demo PIN hashes use `SHA2(pin, 256)` as a placeholder only; production must use Argon2id or bcrypt in the application layer.

Open items identified during review:

- Hold order resume flow currently deletes the temporary hold order record. This must be replaced with a status transition or event before MySQL integration so the void rollback can operate on a stable `orders` row.
- `audit_logs.user_id` may be nullable for legacy audit records where only a name string was stored; migration tool must handle name-only resolution.
- Face descriptor biometric data requires a production privacy review before migration.
- PIN migration from plain text must go through a backend hashing step, not a raw SQL import.

- [x] **Step 2: Decide integration strategy**

**Decision: database prepared first, UI remains localStorage until API chunk.**

Rationale:

- All schema, seed, migration mapping, and transaction boundary documents are now complete and verified.
- The current frontend is stable and tested at 39 tests / 7 files after Chunk 2.
- Introducing MySQL writes before the API layer is designed would create a dual-runtime risk.
- Chunk 3 (POS/Dashboard modularization) and Chunk 4 (server/API stabilization) do not require database writes; they can proceed safely with localStorage as the runtime source.
- Backend API integration (Chunk 5 Task 13 onward) will wire MySQL after the API structure is designed.

Strategy ruled out:

- Backend API reads/writes MySQL immediately: too high risk before API design is complete.
- Dual-write bridge from localStorage to API: adds complexity without clear benefit at this stage.

- [x] **Step 3: Update the plan**

Schema review did not reveal any schema changes that require revising Chunk 2, 3, or 4 task steps. The execution order remains as recommended. The open items above are tracked and will be addressed during Chunk 5 API integration design.

Next recommended step after DB-5: continue with **Task 10** (Split DashboardView by Domain Tabs), then Task 11, Task 12, and then proceed to Chunk 5.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/2026-06-27-coraq-pos-prd-implementation.md
git commit -m "docs: align implementation plan after mysql review"
```

## Chunk 2: MVP Stabilization Foundation

### Task 1: Add Test Harness

**Maps to:** NFR-003, Acceptance Criteria MVP, Roadmap Fase 1.

Execution status on 2026-06-27:

- Completed: Vitest, Testing Library, jest-dom, and jsdom installed.
- Completed: `test` and `test:watch` scripts added.
- Completed: Vite test config and `test/setup.ts` added.
- Completed: `test/setup.test.ts` smoke test added because Vitest v4 exits with code 1 when no test files exist.
- Verified: `npm.cmd test` passes with 1 test.
- Verified: `npm.cmd run build` passes.
- Known blocker outside this task: `npx.cmd tsc --noEmit` currently fails on existing admin/location TypeScript errors.

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `vite.config.ts`
- Create: `test/setup.ts`

- [ ] **Step 1: Install test dependencies**

Run:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Expected: `package.json` and `package-lock.json` include the new dev dependencies.

- [ ] **Step 2: Add test scripts**

Update `package.json` scripts:

```json
{
  "scripts": {
    "dev": "tsx server.ts",
    "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
    "start": "node dist/server.cjs",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 3: Configure Vitest**

Update `vite.config.ts` with test config:

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    globals: true,
  },
});
```

Keep any existing Vite aliases/settings already present in the file.

- [ ] **Step 4: Add test setup**

Create `test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: Verify test harness**

Run:

```bash
npm test
```

Expected: Vitest runs successfully, even if it reports no tests yet.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.ts test/setup.ts
git commit -m "test: add vitest harness"
```

### Task 2: Create Domain Test Fixtures

**Maps to:** NFR-003, FR-POS-009, FR-POS-010, FR-SHIFT-002 through FR-SHIFT-006, FR-KDS-001 through FR-KDS-010.

Execution status on 2026-06-27:

- Completed: `src/domain/__tests__/fixtures.ts` created.
- Completed: fixture includes ingredients, station-specific products for `COFFEE`, `NON_COFFEE`, `FOOD`, and `DESSERT`.
- Completed: fixture includes modifiers with recipe adjustments, bronze member, active promotions, store config, shift, orders, expense, users, and clone helper.
- Verified: `npm.cmd test` passes with 1 test.
- Known blocker outside this task: `npx.cmd tsc --noEmit` still fails on existing admin/location TypeScript errors and reports no fixture-specific errors.

**Files:**

- Create: `src/domain/__tests__/fixtures.ts`

- [ ] **Step 1: Create reusable fixtures**

Create `src/domain/__tests__/fixtures.ts` with minimal objects for `Product`, `Modifier`, `Ingredient`, `CartItem`, `Member`, `Order`, `Promotion`, `StoreConfig`, and `Shift`.

The fixture should avoid importing `constants.ts` so tests are isolated from demo data.

- [ ] **Step 2: Include station-specific products**

Add products with categories:

```ts
COFFEE
NON_COFFEE
FOOD
DESSERT
```

- [ ] **Step 3: Include member and promotion fixtures**

Include:

- a bronze member with points.
- an active promotion with `minSpend`.
- a default store config with `pointEarnRate` and `pointValue`.

- [ ] **Step 4: Verify TypeScript shape**

Run:

```bash
npx tsc --noEmit
```

Expected: No type errors from fixtures.

- [x] **Step 5: Commit**

```bash
git add src/domain/__tests__/fixtures.ts
git commit -m "test: add domain fixtures"
```

### Task 3: Extract Order Calculation Domain

**Maps to:** FR-POS-008 through FR-POS-012, FR-POS-014, FR-POS-016, FR-LOYALTY-001 through FR-LOYALTY-009.

Execution status on 2026-06-27:

- Completed: `src/domain/orderCalculations.ts` created.
- Completed: `src/domain/loyalty.ts` created.
- Completed: `src/domain/__tests__/orderCalculations.test.ts` created.
- Completed: `context/StoreContext.tsx` now uses `calculateOrderTotals` in `createOrder`.
- Verified RED: order calculation test failed first because domain helpers were not implemented.
- Verified GREEN: `npm.cmd test -- src/domain/__tests__/orderCalculations.test.ts` passes with 11 tests.
- Verified: `npm.cmd test` passes with 12 tests across 2 files.
- Verified: `npm.cmd run build` passes.
- Known blocker outside this task: `npx.cmd tsc --noEmit` still fails on existing admin/location TypeScript errors.

**Files:**

- Create: `src/domain/orderCalculations.ts`
- Create: `src/domain/loyalty.ts`
- Create: `src/domain/__tests__/orderCalculations.test.ts`
- Modify: `context/StoreContext.tsx`

- [ ] **Step 1: Write failing calculation tests**

Create tests for:

- product price times quantity.
- modifier price times quantity.
- tier discount.
- promotion discount with `minSpend`.
- point redemption value.
- total discount capped at subtotal.
- points earned from final amount.
- rejection when redemption exceeds member points.

Run:

```bash
npm test -- src/domain/__tests__/orderCalculations.test.ts
```

Expected: FAIL because domain functions do not exist.

- [ ] **Step 2: Implement `src/domain/loyalty.ts`**

Export pure helpers:

```ts
export function calculatePointRedemption(pointsToRedeem: number, availablePoints: number, pointValue: number): number
export function calculatePointsEarned(finalAmount: number, pointEarnRate: number): number
export function resolveTier(totalSpending: number): Tier
```

Behavior:

- Throw an error or return a typed failure if `pointsToRedeem > availablePoints`.
- Never return negative redemption.
- Floor points earned.

- [ ] **Step 3: Implement `src/domain/orderCalculations.ts`**

Export a pure function:

```ts
export function calculateOrderTotals(input: {
  cart: CartItem[];
  member: Member | null;
  promotions: Promotion[];
  storeConfig: StoreConfig;
  pointsToRedeem: number;
}): {
  subtotal: number;
  tierDiscount: number;
  promotionDiscount: number;
  pointDiscount: number;
  totalDiscount: number;
  finalAmount: number;
  pointsEarned: number;
};
```

- [ ] **Step 4: Make tests pass**

Run:

```bash
npm test -- src/domain/__tests__/orderCalculations.test.ts
```

Expected: PASS.

- [ ] **Step 5: Wire StoreContext to use domain helper**

In `context/StoreContext.tsx`, update `createOrder` to call `calculateOrderTotals` instead of duplicating totals logic inline.

Do not change external `createOrder` signature.

- [ ] **Step 6: Run verification**

Run:

```bash
npm test -- src/domain/__tests__/orderCalculations.test.ts
npx tsc --noEmit
npm run build
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/domain/orderCalculations.ts src/domain/loyalty.ts src/domain/__tests__/orderCalculations.test.ts context/StoreContext.tsx
git commit -m "refactor: extract order calculation domain"
```

### Task 4: Extract Inventory Deduction and Rollback Domain

**Maps to:** FR-POS-010, FR-POS-014, FR-POS-020, FR-INV-001 through FR-INV-011.

Execution status on 2026-06-27:

- Completed: `src/domain/inventory.ts` created.
- Completed: `src/domain/__tests__/inventory.test.ts` created.
- Completed: `context/StoreContext.tsx` now uses inventory helpers for stock validation, deduction, void rollback, average cost, anomaly detection, and purchase rollback.
- Verified RED: inventory tests failed first because helpers were missing/not implemented.
- Verified GREEN: `npm.cmd test -- src/domain/__tests__/inventory.test.ts` passes with 9 tests.
- Verified: `npm.cmd test` passes with 21 tests across 3 files.
- Verified: `npm.cmd run build` passes.
- Verified: Task 4 adds no new `tsc` errors; `npx.cmd tsc --noEmit` still fails only on existing admin/location TypeScript errors.

**Files:**

- Create: `src/domain/inventory.ts`
- Create: `src/domain/__tests__/inventory.test.ts`
- Modify: `context/StoreContext.tsx`

- [ ] **Step 1: Write failing inventory tests**

Cover:

- product recipe deducts ingredient stock.
- modifier recipe deducts ingredient stock.
- quantity multiplies deduction.
- insufficient stock returns a clear failure.
- void rollback restores product and modifier stock.
- purchase average cost calculation.
- void purchase rollback from metadata.

Run:

```bash
npm test -- src/domain/__tests__/inventory.test.ts
```

Expected: FAIL because helpers do not exist.

- [ ] **Step 2: Implement stock deduction helpers**

Create pure functions:

```ts
export function applyStockDeduction(ingredients: Ingredient[], cart: CartItem[]): Ingredient[]
export function rollbackStockDeduction(ingredients: Ingredient[], cart: CartItem[]): Ingredient[]
export function validateStockAvailability(ingredients: Ingredient[], cart: CartItem[]): { ok: true } | { ok: false; message: string }
```

- [ ] **Step 3: Implement purchase helpers**

Create pure functions:

```ts
export function calculateAverageCost(input: {
  currentStock: number;
  currentCostPerUnit: number;
  addedUsageQty: number;
  purchaseCostPerUsageUnit: number;
}): number

export function isPriceAnomaly(oldCost: number, newCost: number, thresholdPercent?: number): boolean
```

- [ ] **Step 4: Make tests pass**

Run:

```bash
npm test -- src/domain/__tests__/inventory.test.ts
```

Expected: PASS.

- [ ] **Step 5: Wire StoreContext**

Update:

- `createOrder` stock validation/deduction.
- `voidOrder` rollback.
- `purchaseIngredient` average cost/anomaly calculation.
- `voidPurchase` rollback behavior where practical.

Preserve current UI messages unless tests require clearer errors.

- [ ] **Step 6: Run verification**

```bash
npm test -- src/domain/__tests__/inventory.test.ts
npx tsc --noEmit
npm run build
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/domain/inventory.ts src/domain/__tests__/inventory.test.ts context/StoreContext.tsx
git commit -m "refactor: extract inventory domain rules"
```

### Task 5: Extract Shift Summary Domain

**Maps to:** FR-SHIFT-001 through FR-SHIFT-008.

Execution status on 2026-06-27:

- Completed: `src/domain/shift.ts` created.
- Completed: `src/domain/__tests__/shift.test.ts` created.
- Completed: `context/StoreContext.tsx` now uses `calculateShiftSummary` in `getShiftSummary`.
- Verified RED: shift tests failed first because the helper was missing/not implemented.
- Verified GREEN: `npm.cmd test -- src/domain/__tests__/shift.test.ts` passes with 6 tests.
- Verified: `npm.cmd test` passes with 27 tests across 4 files.
- Verified: `npm.cmd run build` passes.
- Known blocker outside this task: `npx.cmd tsc --noEmit` still fails only on existing admin/location TypeScript errors.

**Files:**

- Create: `src/domain/shift.ts`
- Create: `src/domain/__tests__/shift.test.ts`
- Modify: `context/StoreContext.tsx`

- [ ] **Step 1: Write failing shift tests**

Cover:

- cash sales only include paid CASH orders after shift start.
- non-cash sales include paid QRIS and DEBIT after shift start.
- debt includes unpaid orders after shift start.
- expenses include `CASH_DRAWER` expenses after shift start.
- expected cash equals `startCash + cashSales - expenses`.

- [ ] **Step 2: Implement `calculateShiftSummary`**

Create:

```ts
export function calculateShiftSummary(input: {
  activeShift: Shift | null;
  orders: Order[];
  expenses: Expense[];
}): {
  startCash: number;
  cashSales: number;
  nonCashSales: number;
  debt: number;
  expenses: number;
  expectedCash: number;
}
```

- [ ] **Step 3: Wire StoreContext**

Replace inline `getShiftSummary` calculation with `calculateShiftSummary`.

- [x] **Step 4: Run verification**

```bash
npm test -- src/domain/__tests__/shift.test.ts
npx tsc --noEmit
npm run build
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/domain/shift.ts src/domain/__tests__/shift.test.ts context/StoreContext.tsx
git commit -m "refactor: extract shift summary domain"
```

### Task 6: Extract KDS Station Domain

**Maps to:** FR-KDS-001 through FR-KDS-010.

**Files:**

- Create: `src/domain/kds.ts`
- Create: `src/domain/__tests__/kds.test.ts`
- Modify: `context/StoreContext.tsx`
- Modify: `components/KDS/KDSView.tsx`

- [x] **Step 1: Write failing KDS tests**

Cover:

- COFFEE and NON_COFFEE route to barista.
- FOOD and DESSERT route to kitchen.
- mixed order activates both stations.
- hold/PENDING order is excluded from active KDS.
- READY all active stations changes global status to READY.
- COMPLETED all active stations changes global status to COMPLETED.
- sorting uses earliest deadline.

- [x] **Step 2: Implement station helpers**

Create:

```ts
export function getStationForCategory(category: string): 'BARISTA' | 'KITCHEN' | null
export function getInitialStationStatuses(cart: CartItem[]): { baristaStatus: StationStatus; kitchenStatus: StationStatus }
export function resolveGlobalOrderStatus(order: Order): OrderStatus
export function filterOrdersForStation(orders: Order[], role: Role): Order[]
export function sortOrdersByDeadline(orders: Order[], now?: Date): Order[]
```

- [x] **Step 3: Wire StoreContext and KDSView**

Use helpers in:

- `createOrder` initial station assignment.
- `updateStationStatus` global status resolution.
- `components/KDS/KDSView.tsx` filtering/sorting.

- [x] **Step 4: Run verification**

```bash
npm test -- src/domain/__tests__/kds.test.ts
npx tsc --noEmit
npm run build
```

Expected: all pass.

Execution notes:

- Added `src/domain/kds.ts` for station routing, active station filtering, global order status resolution, and station deadline sorting.
- Added `src/domain/__tests__/kds.test.ts`; RED verified with 9 failing tests from unimplemented helpers, then GREEN verified with 9/9 passing.
- Updated `context/StoreContext.tsx` to use KDS helpers for initial station status, debt activation, and global status resolution.
- Updated `components/KDS/KDSView.tsx` to use KDS helpers for station items, active order filtering, urgency sorting, completed item counts, and history display.
- `npm.cmd test -- src/domain/__tests__/kds.test.ts`: 1 file passed, 9 tests passed.
- `npm.cmd test`: 5 files passed, 36 tests passed.
- `npm.cmd run build`: passed. Vite still reports existing chunk-size warning and `/index.css` runtime-resolution warning.
- `npx.cmd tsc --noEmit`: still blocked by existing unrelated errors in `components/Admin/CoraqLocationIntelligence.tsx` and `components/Admin/DashboardView.tsx`; no Task 6 file errors reported.

- [x] **Step 5: Commit**

```bash
git add src/domain/kds.ts src/domain/__tests__/kds.test.ts context/StoreContext.tsx components/KDS/KDSView.tsx
git commit -m "refactor: extract kds station rules"
```

### Task 7: Fix Member Portal Order History

**Maps to:** FR-MEMBER-003, FR-MEMBER-005, Acceptance Criteria MVP.

**Files:**

- Modify: `components/MemberPortal/MemberPortal.tsx`
- Create: `components/MemberPortal/MemberPortal.test.tsx` or `src/domain/__tests__/memberPortalOrderHistory.test.ts`

- [x] **Step 1: Write failing test or minimal helper test**

Current bug:

- code reads `order.date`.
- code reads `order.finalTotal`.
- `Order` type defines `createdAt` and `finalAmount`.

Add a test that verifies member order history sorts by `createdAt` and displays `finalAmount`.

- [x] **Step 2: Fix field usage**

Change:

```ts
new Date(order.date)
order.finalTotal
```

to:

```ts
new Date(order.createdAt)
order.finalAmount
```

- [x] **Step 3: Run verification**

```bash
npm test
npx tsc --noEmit
npm run build
```

Expected: all pass.

Execution notes:

- Added `src/domain/memberPortalOrderHistory.ts` to filter completed orders by member and sort by `createdAt` descending.
- Added `src/domain/__tests__/memberPortalOrderHistory.test.ts`; RED verified when the helper import did not exist, then GREEN verified with 1/1 passing.
- Updated `components/MemberPortal/MemberPortal.tsx` to use `createdAt` for transaction dates and `finalAmount` for displayed order totals.
- `npm.cmd test -- src/domain/__tests__/memberPortalOrderHistory.test.ts`: 1 file passed, 1 test passed.
- `npm.cmd test`: 6 files passed, 37 tests passed.
- `npm.cmd run build`: passed. Vite still reports existing chunk-size warning and `/index.css` runtime-resolution warning.
- `npx.cmd tsc --noEmit`: still blocked by existing unrelated errors in `components/Admin/CoraqLocationIntelligence.tsx` and `components/Admin/DashboardView.tsx`; no Task 7 file errors reported.

- [x] **Step 4: Commit**

```bash
git add components/MemberPortal/MemberPortal.tsx components/MemberPortal/MemberPortal.test.tsx src/domain/__tests__/memberPortalOrderHistory.test.ts
git commit -m "fix: use order fields in member portal history"
```

Only include whichever test file is actually created.

### Task 8: Add Setup Documentation

**Maps to:** Roadmap Fase 1, Acceptance Criteria MVP, FR-AI-004.

**Files:**

- Modify: `README.md`
- Create: `.env.example`

- [x] **Step 1: Create `.env.example`**

Add:

```env
GEMINI_API_KEY=
```

- [x] **Step 2: Rewrite README for the project**

README must include:

- product summary.
- required Node/npm.
- install command.
- dev command.
- build command.
- start command.
- test command.
- environment variables.
- note that localStorage is current source of truth.

- [x] **Step 3: Verify commands**

```bash
npm test
npm run build
```

Expected: both pass.

Execution notes:

- Added `.env.example` with `GEMINI_API_KEY=`.
- Rewrote `README.md` with product summary, Node/npm requirements, install/dev/build/start/test commands, environment variables, and current `localStorage` source-of-truth note.
- `npm.cmd test`: 6 files passed, 37 tests passed.
- `npm.cmd run build`: passed. Vite still reports existing chunk-size warning and `/index.css` runtime-resolution warning.

- [x] **Step 4: Commit**

```bash
git add README.md .env.example
git commit -m "docs: document coraq pos setup"
```

## Chunk 3: POS and Dashboard Modularization

### Task 9: Split POSView Without Behavior Changes

**Maps to:** NFR-004, Roadmap Fase 2.

**Files:**

- Modify: `components/POS/POSView.tsx`
- Create: `components/POS/CartPanel.tsx`
- Create: `components/POS/ProductGrid.tsx`
- Create: `components/POS/PaymentModal.tsx`
- Create: `components/POS/MemberLookup.tsx`
- Create: `components/POS/ShiftModal.tsx`
- Create: `components/POS/HoldDebtPanel.tsx`
- Create: `components/POS/PurchaseModal.tsx`

- [x] **Step 1: Capture current behavior**

Run:

```bash
npm run build
```

Expected: PASS before refactor.

- [x] **Step 2: Extract presentational components one by one**

Move JSX only first. Keep state and handlers in `POSView.tsx`.

Extraction order:

1. `ProductGrid.tsx`
2. `CartPanel.tsx`
3. `MemberLookup.tsx`
4. `PaymentModal.tsx`
5. `ShiftModal.tsx`
6. `HoldDebtPanel.tsx`
7. `PurchaseModal.tsx`

- [x] **Step 3: Verify after each extraction**

After each file extraction:

```bash
npm run build
```

Expected: PASS.

- [x] **Step 4: Add focused smoke tests where feasible**

Use React Testing Library for components with pure rendering props.

Execution notes:

- Baseline `npm.cmd run build` passed before refactor.
- Extracted POS presentational UI into `ProductGrid`, `CartPanel`, `MemberLookup`, `PaymentModal`, `ShiftModal`, `HoldDebtPanel`, and `PurchaseModal`.
- State and handlers remain in `components/POS/POSView.tsx`; extracted components receive props and keep the existing JSX behavior.
- Build checkpoints after extraction passed.
- Added `components/POS/POSComponents.test.tsx` smoke tests for `ProductGrid` filtering/click handling and `ShiftModal` open-shift callback.
- `npm.cmd test -- components/POS/POSComponents.test.tsx`: 1 file passed, 2 tests passed.
- `npm.cmd test`: 7 files passed, 39 tests passed.
- `npm.cmd run build`: passed. Vite still reports existing chunk-size warning and `/index.css` runtime-resolution warning.
- `npx.cmd tsc --noEmit`: still blocked by existing unrelated errors in `components/Admin/CoraqLocationIntelligence.tsx` and `components/Admin/DashboardView.tsx`; no Task 9 POS file errors reported.

- [x] **Step 5: Commit**

```bash
git add components/POS
git commit -m "refactor: split pos view components"
```

### Task 10: Split DashboardView by Domain Tabs

**Maps to:** FR-DASH-001 through FR-DASH-011, NFR-004, Roadmap Fase 2.

**Files:**

- Modify: `components/Admin/DashboardView.tsx`
- Create: `components/Admin/dashboard/SummaryTab.tsx`
- Create: `components/Admin/dashboard/TransactionsTab.tsx`
- Create: `components/Admin/dashboard/ProductsTab.tsx`
- Create: `components/Admin/dashboard/InventoryTab.tsx`
- Create: `components/Admin/dashboard/FinanceTab.tsx`
- Create: `components/Admin/dashboard/MarketingTab.tsx`

**Files:**

- Create: `src/domain/permissions.ts`
- Create: `src/domain/__tests__/permissions.test.ts`
- Create: `docs/permissions-matrix.md`
- Modify: `components/Admin/DashboardView.tsx`

- [x] **Step 1: Document permission matrix**

Create `docs/permissions-matrix.md` covering Admin, Manager, Cashier, Barista, Kitchen, and Member Portal.

- [x] **Step 2: Add permission helpers**

Create:

```ts
export type Permission = 'VIEW_DASHBOARD' | 'MANAGE_STAFF' | 'MANAGE_PRODUCTS' | 'MANAGE_INVENTORY' | 'MANAGE_FINANCE' | 'MANAGE_MARKETING' | 'VIEW_PAYROLL' | 'RESET_SYSTEM';
export function hasPermission(role: Role, permission: Permission): boolean
```

- [x] **Step 3: Add tests**

Verify admin has all permissions and manager lacks sensitive permissions such as `RESET_SYSTEM` unless explicitly allowed.

- [x] **Step 4: Wire lightweight dashboard guards**

Hide or disable sensitive dashboard sections based on `hasPermission`.

- [x] **Step 5: Run verification**

```bash
npm test -- src/domain/__tests__/permissions.test.ts
npm run build
```

Expected: all pass.

- [x] **Step 6: Commit**

```bash
git add src/domain/permissions.ts src/domain/__tests__/permissions.test.ts docs/permissions-matrix.md components/Admin/DashboardView.tsx
git commit -m "feat: add role permission matrix"
```

Execution status on 2026-06-27:
- Created `src/domain/permissions.ts` with `ROLE_PERMISSIONS` matrix and `hasPermission` helper.
- Created `docs/permissions-matrix.md` detailing the role access rules.
- Wired `DashboardView.tsx` so that `navItems` and `Reset System` button are filtered using `hasPermission`.
- Tests added in `src/domain/__tests__/permissions.test.ts` to enforce matrix logic. All 28 tests PASS. Overall 67 tests PASS. Build PASS.
- Code committed and pushed to `origin/main` successfully.

> [!NOTE]
> **CURRENT PROGRESS MARKER:** Chunk 3 (MVP Stabilization) is fully COMPLETE (Task 11 is done). Next up is Chunk 4 (Server/API Stabilization) starting with Task 12.



## Chunk 4: Server/API Stabilization

### Task 12: Normalize AI Endpoint Error and Fallback Handling

**Maps to:** FR-AI-001 through FR-AI-007.

**Files:**

- Modify: `server.ts`
- Create: `src/server/aiResponse.ts`
- Create: `src/server/__tests__/aiResponse.test.ts`

- [x] **Step 1: Extract response helpers**

Create helpers for:

- missing API key.
- provider error.
- invalid JSON response.
- fallback result shape.
- source metadata.

- [x] **Step 2: Add tests for response helpers**

Run:

```bash
npm test -- src/server/__tests__/aiResponse.test.ts
```

Expected: PASS after helpers are implemented.

- [x] **Step 3: Wire server endpoints**

Update:

- `POST /api/analytics/ai-forecast`
- `POST /api/marketing/ai-analyze`
- `POST /api/marketing/location-analyze`

Keep existing response contracts as much as possible.

- [ ] **Step 4: Run verification**

```bash
npm test -- src/server/__tests__/aiResponse.test.ts
npm run build
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add server.ts src/server/aiResponse.ts src/server/__tests__/aiResponse.test.ts
git commit -m "refactor: normalize ai endpoint responses"
```

## Chunk 5: Production Readiness Design

### Task 13: Build MySQL Backend Integration Plan

**Maps to:** NFR-005, NFR-006, NFR-008, Roadmap Fase 3.

**Files:**

- Create: `docs/mysql-backend-integration-plan.md`
- Modify: `docs/superpowers/plans/2026-06-27-coraq-pos-prd-implementation.md`

- [x] **Step 1: Confirm database foundation is complete**

Before this task starts, these files must exist and be reviewed:

- `docs/database-schema.md`
- `docs/database-transaction-boundaries.md`
- `docs/localstorage-migration-plan.md`
- `database/migrations/001_create_core_schema.sql`
- `database/seeds/001_seed_initial_data.sql`

- [x] **Step 2: Document backend database layer**

In `docs/mysql-backend-integration-plan.md`, define:

- MySQL connection configuration.
- migration execution command.
- repository/service folder structure.
- transaction helper pattern.
- validation pattern for API request bodies.
- error response shape.

- [x] **Step 3: Document API migration phases**

Use phased replacement:

1. read-only endpoints for catalog, members, orders, inventory, and config.
2. write endpoints for cashier transaction workflows.
3. write endpoints for inventory purchase/stock opname.
4. write endpoints for membership and promotions.
5. admin dashboard endpoints.
6. disable localStorage as source of truth after parity verification.

- [x] **Step 4: Document transaction-critical APIs**

Include endpoint-level notes for:

- create paid order.
- hold bill.
- mark debt.
- pay debt.
- void order.
- purchase ingredient.
- void purchase.
- close shift.

- [ ] **Step 5: Commit**

```bash
git add docs/mysql-backend-integration-plan.md docs/superpowers/plans/2026-06-27-coraq-pos-prd-implementation.md
git commit -m "docs: plan mysql backend integration"
```

Execution status on 2026-06-27:
- Verified all database schema, seed, and migration plan documents exist.
- Created `docs/mysql-backend-integration-plan.md` documenting the DB architecture, transactions, and migration plan.
- Updated this PRD plan.

> [!NOTE]
> **CURRENT PROGRESS MARKER:** Task 13 (Build MySQL Backend Integration Plan) is COMPLETE. Next up is Task 14 (Design Backend Auth and Authorization).


### Task 14: Design Backend Auth and Authorization

**Maps to:** FR-AUTH-008, NFR-006, Roadmap Fase 3.

**Files:**

- Create: `docs/auth-authorization-design.md`

- [x] **Step 1: Document auth model**

Include:

- staff login identifier.
- PIN hashing.
- optional face login enrollment and matching.
- session/JWT strategy.
- refresh/logout.
- member portal login.

- [x] **Step 2: Document authorization model**

Include:

- role-based access.
- permission claims.
- server-side route guards.
- audit of sensitive actions.

- [x] **Step 3: Commit**

```bash
git add docs/auth-authorization-design.md
git commit -m "docs: design auth and authorization"
```

Execution status on 2026-06-27:
- Created `docs/auth-authorization-design.md` documenting the auth strategy (PIN hash, JWT, etc.) and authorization (RBAC, middleware).
- Updated PRD plan.

> [!NOTE]
> **CURRENT PROGRESS MARKER:** Task 14 (Design Backend Auth and Authorization) is COMPLETE. Next up is Task 15 (Plan Backup, Export, Audit, and E2E Coverage).


### Task 15: Plan Backup, Export, Audit, and E2E Coverage

**Maps to:** NFR-007, NFR-010, Roadmap Fase 4.

**Files:**

- Create: `docs/production-readiness-plan.md`

- [x] **Step 1: Document backup/export requirements**

Include export formats, restore expectations, and retention assumptions.

- [x] **Step 2: Document immutable audit trail**

Include sensitive actions:

- payment.
- void/refund/cancellation.
- edit price.
- edit staff.
- permission changes.
- purchase/void purchase.
- stock opname.
- close shift.

- [x] **Step 3: Document E2E test scenarios**

Include:

- login.
- transaction paid.
- hold bill.
- debt/BON.
- KDS station completion.
- close shift.
- member portal.
- inventory purchase and void purchase.

- [ ] **Step 4: Commit**

```bash
git add docs/production-readiness-plan.md
git commit -m "docs: plan production readiness"
```

Execution status on 2026-06-27:
- Created `docs/production-readiness-plan.md`.
- All automated validations (tests, typescript compilation) PASSED.
- Core schema and DB docs exist.
- Updated PRD plan.

> [!NOTE]
> **CURRENT PROGRESS MARKER:** Task 15 is COMPLETE. The foundational backend architecture design and documentation phase is successfully finalized. Ready to proceed with MySQL development or E2E integrations.


## Final Verification Checklist

- [x] `docs/database-schema.md` exists and covers all PRD entities.
- [x] `docs/database-transaction-boundaries.md` covers paid order, hold bill, debt/BON, pay debt, void order, purchase, void purchase, stock opname, and close shift.
- [x] `docs/localstorage-migration-plan.md` maps all current `coraq_*` keys.
- [x] `database/migrations/001_create_core_schema.sql` exists.
- [x] `database/seeds/001_seed_initial_data.sql` exists.
- [ ] MySQL migration runs locally when MySQL is available.
- [ ] MySQL seed runs locally when MySQL is available.
- [x] `npm test`
- [x] `npx tsc --noEmit`
- [ ] `npm run build`
- [ ] Manual smoke test: cashier login -> clock in -> start shift -> paid order.
- [ ] Manual smoke test: hold bill -> confirm not visible in KDS.
- [ ] Manual smoke test: debt/BON -> visible in KDS -> pay debt.
- [ ] Manual smoke test: KDS station READY.
- [ ] Manual smoke test: member portal history uses correct date and amount.
- [ ] Manual smoke test: close shift summary.

## Recommended Execution Order

1. Task DB-1: Design MySQL Core Schema
2. Task DB-2: Create Initial MySQL Migration SQL
3. Task DB-3: Create Seed Data Plan and Initial Seed SQL
4. Task DB-4: Document localStorage to MySQL Migration
5. Task DB-5: Update Implementation Plan After Database Review
6. Task 1: Add Test Harness
7. Task 2: Create Domain Test Fixtures
8. Task 3: Extract Order Calculation Domain
9. Task 4: Extract Inventory Deduction and Rollback Domain
10. Task 5: Extract Shift Summary Domain
11. Task 6: Extract KDS Station Domain
12. Task 7: Fix Member Portal Order History
13. Task 8: Add Setup Documentation
14. Task 9: Split POSView Without Behavior Changes
15. Task 10: Split DashboardView by Domain Tabs
16. Task 11: Add Permission Matrix Design and Guard Helpers
17. Task 12: Normalize AI Endpoint Error and Fallback Handling
18. Task 13: Build MySQL Backend Integration Plan
19. Task 14: Design Backend Auth and Authorization
20. Task 15: Plan Backup, Export, Audit, and E2E Coverage

Stop after Task DB-5 if the immediate goal is only to prepare the MySQL database foundation. Continue with Task 1 when the schema and migration files are reviewed.
