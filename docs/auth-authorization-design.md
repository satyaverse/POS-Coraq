# Backend Authentication & Authorization Design

This document outlines the authentication and authorization strategy for the Coraq POS backend API. The system handles dual-authentication streams (Staff POS access and Member Portal access).

## 1. Authentication Model

### Staff Login
- **Identifier:** Unique `pin` (usually 4 to 6 digits) assigned to each staff member. In production, this can also be backed by a fallback username if needed, but the primary POS fast-login mechanism relies on PIN.
- **PIN Hashing:** PINs must never be stored in plain text. We will use `bcrypt` with a minimum salt rounds factor of 10 to hash and verify staff PINs during login.
- **Face Login Enrollment & Matching (Optional):** As per requirements, Coraq POS supports face login for fast cashier switching.
  - Enrollment will store a low-dimensional face descriptor array in the `users.face_descriptor` column (JSON type).
  - Client-side (frontend) will calculate the descriptor using a lightweight WASM library (e.g. face-api.js) and send it to the backend.
  - Backend performs a cosine similarity or Euclidean distance check against enrolled descriptors to verify identity within a strict confidence threshold.

### Member Portal Login
- **Identifier:** `phone_number` or `email` registered in the `members` table.
- **Authentication Method:** OTP (One Time Password) sent via WhatsApp or Email, or standard password hashing (similar to staff PIN). For MVP parity, we assume an initial password-based system for the Member Portal that will later be transitioned to OTP.

### Session Management & JWT Strategy
- **Token Type:** JSON Web Tokens (JWT) signed via an asymmetric or strong symmetric key (HMAC SHA-256).
- **Access Tokens:** Short-lived (e.g. 1 hour).
  - Staff payload: `{ userId: 1, role: "CASHIER", type: "STAFF" }`
  - Member payload: `{ memberId: 10, tier: "SILVER", type: "MEMBER" }`
- **Refresh Tokens:** Long-lived (e.g. 7 days), stored securely in HttpOnly cookies to prevent XSS attacks.
- **Logout:** Handled by clearing the HttpOnly cookie and adding the active Access Token to an in-memory or Redis-backed blocklist until it expires.

---

## 2. Authorization Model

### Role-Based Access Control (RBAC)
Staff authorization is dictated by the `role` column in the `users` table:
- **ADMIN:** Full system access (reports, financial resets, role assignments).
- **MANAGER:** Operational oversight (inventory correction, promotion setup), restricted from critical system resets.
- **CASHIER:** POS transaction execution, shift management.
- **BARISTA / KITCHEN:** View-only access to KDS (Kitchen Display System), inventory usage updates.

### Permission Claims & Server-Side Route Guards
The backend will enforce roles at the route level using an Express middleware.

```typescript
// src/server/middlewares/authGuard.ts
import { Request, Response, NextFunction } from 'express';

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: "FORBIDDEN_ACCESS",
        message: "You do not have permission to perform this action."
      });
    }
    next();
  };
};

// Example usage in route:
// router.post('/api/payroll/generate', requireAuth, requireRole(['ADMIN']), generatePayroll);
```

### Audit Logging of Sensitive Actions
Critical operations must leave an immutable trail. The `audit_logs` table will record:
- Manual inventory adjustments.
- Voided transactions / refunds.
- System resets.
- Manual discount overrides.

The backend will capture the `userId` from the JWT payload, the action performed, and the exact timestamp.
