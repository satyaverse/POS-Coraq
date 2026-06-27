# Coraq POS — Role Permission Matrix

This document defines which actions each user role is allowed to perform.
The authoritative source is [`src/domain/permissions.ts`](../src/domain/permissions.ts).

---

## Roles

| Role | Description |
|---|---|
| `ADMIN` | Full system access — owner / superuser |
| `MANAGER` | Broad operational access; cannot reset system |
| `CASHIER` | POS checkout, transactions, member lookup |
| `BARISTA` | Kitchen Display System (drinks) only |
| `KITCHEN` | Kitchen Display System (food) only |

---

## Permission Matrix

| Permission | ADMIN | MANAGER | CASHIER | BARISTA | KITCHEN |
|---|:---:|:---:|:---:|:---:|:---:|
| `VIEW_DASHBOARD` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `VIEW_TRANSACTIONS` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `VIEW_ANALYTICS` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `VIEW_FINANCE` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `VIEW_PAYROLL` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `MANAGE_PRODUCTS` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `MANAGE_INVENTORY` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `MANAGE_MARKETING` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `MANAGE_MEMBERS` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `MANAGE_STAFF` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `MANAGE_FINANCE` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `RESET_SYSTEM` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `VIEW_KDS` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `OPERATE_POS` | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## Permission Definitions

### Dashboard & Reporting
- **`VIEW_DASHBOARD`** — Access the admin dashboard summary and KPI cards.
- **`VIEW_TRANSACTIONS`** — View transaction history, filter by date/search, open detail modal.
- **`VIEW_ANALYTICS`** — View analytics charts: heatmap, BCG matrix, category pie, AI forecast.
- **`VIEW_FINANCE`** — View financial reports: revenue/expense KPIs, cashflow charts, audit log.
- **`VIEW_PAYROLL`** — View payroll data and pay slips for all staff.

### Operational Management
- **`MANAGE_PRODUCTS`** — Create, edit, delete menu items; manage categories.
- **`MANAGE_INVENTORY`** — Stock opname, ingredient CRUD, batch production, price history.
- **`MANAGE_MARKETING`** — Create/edit promotions, run AI marketing analysis, send birthday messages.
- **`MANAGE_MEMBERS`** — Register members, edit tier/status, bind loyalty cards.
- **`MANAGE_STAFF`** — Create/edit/deactivate user accounts, manage attendance records.
- **`MANAGE_FINANCE`** — Record operational expenses, void PURCHASE transactions.

### System & Operations
- **`RESET_SYSTEM`** — Full data reset. **ADMIN only.** Irreversible.
- **`VIEW_KDS`** — Access Kitchen Display System (barista/food station).
- **`OPERATE_POS`** — Operate POS checkout: take orders, process payment, open/close shift.

---

## Design Decisions

1. **ADMIN is the only role with `RESET_SYSTEM`** — This is intentional and enforced in both the UI guard (`DashboardView.tsx`) and the permission matrix. No amount of configuration should elevate MANAGER to this right without code change.

2. **CASHIER gets `MANAGE_MEMBERS`** — Cashiers need to look up, register, and bind loyalty cards at the counter without requiring a manager override for each interaction.

3. **BARISTA and KITCHEN are KDS-only** — These roles should never see financial or staff data. They have exactly 1 permission: `VIEW_KDS`.

4. **MANAGER has 13 of 14 permissions** — The only exclusion is `RESET_SYSTEM`. This is a business risk mitigation; a rogue manager should not be able to wipe all data.

---

## Usage in Code

```typescript
import { hasPermission } from "../../src/domain/permissions";
import { Role } from "../../types";

// Guard a UI element
{hasPermission(currentUser.role, "RESET_SYSTEM") && (
  <button onClick={resetSystem}>Reset System</button>
)}

// Guard a nav item
const navItems = allNavItems.filter(item =>
  hasPermission(currentUser.role, item.requiredPermission)
);
```

---

## Future Extensions

- Expand `Permission` type for new features (e.g. `MANAGE_SUPPLIERS`, `EXPORT_REPORTS`).
- Move permission enforcement to server middleware for API routes.
- Add permission-based row-level security once PostgreSQL integration is complete (DB Chunk).
