/**
 * permissions.test.ts
 *
 * Unit tests for the Coraq POS permission matrix.
 * Verifies that each Role gets exactly the rights it should have,
 * and critically that sensitive capabilities are NOT granted where forbidden.
 */

import { describe, it, expect } from "vitest";
import { Role } from "../../../types";
import {
  hasPermission,
  getPermissions,
  hasAllPermissions,
  hasAnyPermission,
  Permission,
} from "../permissions";

// ─── ADMIN ───────────────────────────────────────────────────────────────────

describe("Role.ADMIN permissions", () => {
  it("has all defined permissions", () => {
    const allPerms: Permission[] = [
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
    ];
    expect(hasAllPermissions(Role.ADMIN, allPerms)).toBe(true);
  });

  it("can RESET_SYSTEM", () => {
    expect(hasPermission(Role.ADMIN, "RESET_SYSTEM")).toBe(true);
  });

  it("has 14 permissions total", () => {
    expect(getPermissions(Role.ADMIN).length).toBe(14);
  });
});

// ─── MANAGER ─────────────────────────────────────────────────────────────────

describe("Role.MANAGER permissions", () => {
  it("can VIEW_DASHBOARD", () => {
    expect(hasPermission(Role.MANAGER, "VIEW_DASHBOARD")).toBe(true);
  });

  it("can VIEW_FINANCE and VIEW_PAYROLL", () => {
    expect(hasPermission(Role.MANAGER, "VIEW_FINANCE")).toBe(true);
    expect(hasPermission(Role.MANAGER, "VIEW_PAYROLL")).toBe(true);
  });

  it("can MANAGE_STAFF and MANAGE_MEMBERS", () => {
    expect(hasPermission(Role.MANAGER, "MANAGE_STAFF")).toBe(true);
    expect(hasPermission(Role.MANAGER, "MANAGE_MEMBERS")).toBe(true);
  });

  it("cannot RESET_SYSTEM (critical guard)", () => {
    expect(hasPermission(Role.MANAGER, "RESET_SYSTEM")).toBe(false);
  });

  it("has 13 permissions — one less than ADMIN (no RESET_SYSTEM)", () => {
    expect(getPermissions(Role.MANAGER).length).toBe(13);
  });
});

// ─── CASHIER ─────────────────────────────────────────────────────────────────

describe("Role.CASHIER permissions", () => {
  it("can OPERATE_POS", () => {
    expect(hasPermission(Role.CASHIER, "OPERATE_POS")).toBe(true);
  });

  it("can VIEW_TRANSACTIONS", () => {
    expect(hasPermission(Role.CASHIER, "VIEW_TRANSACTIONS")).toBe(true);
  });

  it("can MANAGE_MEMBERS (bind card, lookup)", () => {
    expect(hasPermission(Role.CASHIER, "MANAGE_MEMBERS")).toBe(true);
  });

  it("cannot VIEW_DASHBOARD", () => {
    expect(hasPermission(Role.CASHIER, "VIEW_DASHBOARD")).toBe(false);
  });

  it("cannot MANAGE_FINANCE", () => {
    expect(hasPermission(Role.CASHIER, "MANAGE_FINANCE")).toBe(false);
  });

  it("cannot RESET_SYSTEM", () => {
    expect(hasPermission(Role.CASHIER, "RESET_SYSTEM")).toBe(false);
  });

  it("has exactly 3 permissions", () => {
    expect(getPermissions(Role.CASHIER).length).toBe(3);
  });
});

// ─── BARISTA ─────────────────────────────────────────────────────────────────

describe("Role.BARISTA permissions", () => {
  it("can VIEW_KDS only", () => {
    expect(hasPermission(Role.BARISTA, "VIEW_KDS")).toBe(true);
  });

  it("cannot VIEW_DASHBOARD", () => {
    expect(hasPermission(Role.BARISTA, "VIEW_DASHBOARD")).toBe(false);
  });

  it("cannot OPERATE_POS", () => {
    expect(hasPermission(Role.BARISTA, "OPERATE_POS")).toBe(false);
  });

  it("cannot RESET_SYSTEM", () => {
    expect(hasPermission(Role.BARISTA, "RESET_SYSTEM")).toBe(false);
  });

  it("has exactly 1 permission", () => {
    expect(getPermissions(Role.BARISTA).length).toBe(1);
  });
});

// ─── KITCHEN ─────────────────────────────────────────────────────────────────

describe("Role.KITCHEN permissions", () => {
  it("can VIEW_KDS only", () => {
    expect(hasPermission(Role.KITCHEN, "VIEW_KDS")).toBe(true);
  });

  it("cannot VIEW_DASHBOARD", () => {
    expect(hasPermission(Role.KITCHEN, "VIEW_DASHBOARD")).toBe(false);
  });

  it("cannot RESET_SYSTEM", () => {
    expect(hasPermission(Role.KITCHEN, "RESET_SYSTEM")).toBe(false);
  });

  it("has exactly 1 permission", () => {
    expect(getPermissions(Role.KITCHEN).length).toBe(1);
  });
});

// ─── Helper utilities ─────────────────────────────────────────────────────────

describe("hasAllPermissions utility", () => {
  it("returns true when role has all listed permissions", () => {
    expect(hasAllPermissions(Role.ADMIN, ["VIEW_DASHBOARD", "RESET_SYSTEM"])).toBe(true);
  });

  it("returns false if role is missing any one permission", () => {
    expect(hasAllPermissions(Role.MANAGER, ["VIEW_DASHBOARD", "RESET_SYSTEM"])).toBe(false);
  });
});

describe("hasAnyPermission utility", () => {
  it("returns true when role has at least one permission from list", () => {
    expect(hasAnyPermission(Role.CASHIER, ["RESET_SYSTEM", "OPERATE_POS"])).toBe(true);
  });

  it("returns false when role has none of the listed permissions", () => {
    expect(hasAnyPermission(Role.BARISTA, ["RESET_SYSTEM", "OPERATE_POS"])).toBe(false);
  });
});
