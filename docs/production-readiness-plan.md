# Production Readiness Plan

This document outlines the operational and quality assurance requirements for migrating Coraq POS to a production-ready state (Fase 4 of the roadmap). It covers data backup/export strategies, immutable audit trails, and end-to-end (E2E) testing coverage.

## 1. Backup & Export Requirements

### Database Backups
- **Automated Backups:** Daily automated MySQL dumps stored in a secure cloud bucket (e.g., AWS S3 or GCP Cloud Storage).
- **Retention Policy:** Backups are retained for 30 days for daily snapshots, and 12 months for monthly snapshots.
- **Restore Expectations:** The system should allow point-in-time recovery (PITR) with a Recovery Time Objective (RTO) of < 2 hours and a Recovery Point Objective (RPO) of < 24 hours.

### Data Exports (Reporting)
The Admin Dashboard will support extracting financial and operational data in the following formats:
- **Formats:** CSV, Excel (XLSX), and PDF summaries.
- **Export Targets:**
  - Shift closing summaries.
  - Monthly sales performance.
  - Inventory movement logs (Stock In/Out).
  - Payroll calculation sheets.

---

## 2. Immutable Audit Trail

To ensure financial integrity and prevent fraud, the system will maintain an append-only `audit_logs` table. Records in this table cannot be modified or deleted.

**Sensitive Actions Monitored:**
- **Payment processing:** Finalizing an order (cash, QRIS, transfer).
- **Void/Refund/Cancellation:** Cancelling a paid order or voiding specific items.
- **Edit Price / Discount Override:** Manual manipulation of prices or application of unauthorized custom discounts.
- **Edit Staff:** Adding, modifying, or deleting staff credentials (especially role escalation).
- **Permission Changes:** Modifying access control matrices.
- **Inventory Purchase / Void Purchase:** Adding stock via supplier invoices or reversing them.
- **Stock Opname:** Manual adjustments to system inventory quantities.
- **Close Shift:** Finalizing cash drawer counts and declaring variances.

**Audit Log Schema (JSON payload):**
- `action`: String identifying the event (e.g., "VOID_ORDER")
- `user_id`: ID of the staff performing the action
- `timestamp`: UTC timestamp
- `before_state`: Snapshot of data prior to the action
- `after_state`: Snapshot of data after the action
- `reason`: Justification note (mandatory for voids/adjustments)

---

## 3. End-to-End (E2E) Test Scenarios

Before deploying the MySQL backend integration to production, the following critical user flows must pass automated E2E testing (e.g., using Playwright or Cypress).

### Core Transaction Flows
1. **Login:** Staff logs in with a valid PIN and is routed to the correct view based on their Role.
2. **Transaction Paid:** 
   - Add items to cart (with modifiers).
   - Apply member discount.
   - Pay with exact cash.
   - Verify order status updates to "PAID" and receipt is generated.
3. **Hold Bill:** Add items to cart, suspend the order with a customer name, then retrieve and resume the order.
4. **Debt / BON (Kasbon):** Finalize an order as "Kasbon" (unpaid debt). Verify it appears in the Finance dashboard under accounts receivable.

### Kitchen & Operations
5. **KDS Station Completion:** An order is marked PAID -> appears on KDS -> Kitchen clicks "Selesai" -> Status updates to "READY_FOR_PICKUP".
6. **Close Shift:** 
   - Cashier initiates shift closing.
   - System tallies expected cash.
   - Cashier inputs actual cash.
   - System records variance and logs the shift as "CLOSED".

### Inventory & Management
7. **Inventory Purchase & Void Purchase:** 
   - Add raw materials via purchase form -> verify stock increments.
   - Void the purchase -> verify stock decrements back to original.
8. **Member Portal:** 
   - Member logs in.
   - Views order history and current point balance.
   - Redeems points for a voucher (if applicable).
