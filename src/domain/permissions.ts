/**
 * permissions.ts
 *
 * Role-based permission matrix for Coraq POS.
 * Defines which actions each Role is allowed to perform.
 * Used by DashboardView UI guards and future API middleware.
 *
 * Design decisions:
 * - ADMIN is the superuser — all permissions granted.
 * - MANAGER has broad read/manage access but cannot RESET_SYSTEM.
 * - CASHIER handles transactions and POS view only.
 * - BARISTA & KITCHEN are kitchen-display-only roles with no admin access.
 */

import { Role } from "../../types";

// ─── Permission Catalogue ───────────────────────────────────────────────────

export type Permission =
  | "VIEW_DASHBOARD"       // Access admin dashboard main view
  | "VIEW_TRANSACTIONS"    // View transaction history
  | "VIEW_ANALYTICS"       // View analytics and BCG/heatmap charts
  | "VIEW_FINANCE"         // View financial reports and audit logs
  | "VIEW_PAYROLL"         // View payroll data and pay slips
  | "MANAGE_PRODUCTS"      // Create/edit/delete menu items
  | "MANAGE_INVENTORY"     // Stock opname, ingredient CRUD, production batch
  | "MANAGE_MARKETING"     // Promotions, AI analyze, birthday campaigns
  | "MANAGE_MEMBERS"       // Member CRUD, tier management, card binding
  | "MANAGE_STAFF"         // User/staff CRUD and attendance
  | "MANAGE_FINANCE"       // Record and void expenses
  | "RESET_SYSTEM"         // Full system reset (ADMIN only)
  | "VIEW_KDS"             // Kitchen / barista display screen
  | "OPERATE_POS";         // Operate POS checkout and shift management

// ─── Permission Matrix ───────────────────────────────────────────────────────

/**
 * Maps each Role to the set of Permissions it holds.
 * Using an explicit Map so additions are easy and type-safe.
 */
const ROLE_PERMISSIONS: Record<Role, Set<Permission>> = {
  [Role.ADMIN]: new Set<Permission>([
    "VIEW_DASHBOARD",
    "VIEW_TRANSACTIONS",
    "VIEW_ANALYTICS",
    "VIEW_FINANCE",
    "VIEW_PAYROLL",
    "MANAGE_PRODUCTS",
    "MANAGE_INVENTORY",
    "MANAGE_MARKETING",
    "MANAGE_MEMBERS",
    "MANAGE_STAFF",
    "MANAGE_FINANCE",
    "RESET_SYSTEM",
    "VIEW_KDS",
    "OPERATE_POS",
  ]),

  [Role.MANAGER]: new Set<Permission>([
    "VIEW_DASHBOARD",
    "VIEW_TRANSACTIONS",
    "VIEW_ANALYTICS",
    "VIEW_FINANCE",
    "VIEW_PAYROLL",
    "MANAGE_PRODUCTS",
    "MANAGE_INVENTORY",
    "MANAGE_MARKETING",
    "MANAGE_MEMBERS",
    "MANAGE_STAFF",
    "MANAGE_FINANCE",
    // NOTE: RESET_SYSTEM is intentionally excluded for MANAGER
    "VIEW_KDS",
    "OPERATE_POS",
  ]),

  [Role.CASHIER]: new Set<Permission>([
    "VIEW_TRANSACTIONS",
    "MANAGE_MEMBERS",
    "OPERATE_POS",
  ]),

  [Role.BARISTA]: new Set<Permission>([
    "VIEW_KDS",
  ]),

  [Role.KITCHEN]: new Set<Permission>([
    "VIEW_KDS",
  ]),
};

// ─── Guard Helper ────────────────────────────────────────────────────────────

/**
 * Returns true if the given role holds the given permission.
 *
 * @example
 * hasPermission(Role.ADMIN, "RESET_SYSTEM")   // true
 * hasPermission(Role.MANAGER, "RESET_SYSTEM") // false
 * hasPermission(Role.CASHIER, "OPERATE_POS")  // true
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

/**
 * Returns all permissions granted to a given role.
 * Useful for debugging or displaying user capability lists.
 */
export function getPermissions(role: Role): Permission[] {
  return Array.from(ROLE_PERMISSIONS[role] ?? []);
}

/**
 * Returns true if the role holds ALL of the listed permissions.
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Returns true if the role holds ANY of the listed permissions.
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}
