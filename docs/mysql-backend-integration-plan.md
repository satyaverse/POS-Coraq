# MySQL Backend Integration Plan

This document outlines the architecture, patterns, and phased approach for migrating the Coraq POS backend from its current state (handling AI endpoints with in-memory fallbacks) to a fully integrated MySQL backend.

## 1. Database Connection Configuration

The backend will use `mysql2` with connection pooling to handle concurrent requests efficiently.

**Configuration Variables:**
Required in `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=coraq_pos
DB_PORT=3306
DB_CONNECTION_LIMIT=10
```

**Connection Pool Module (`src/server/db.ts`):**
```typescript
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  queueLimit: 0
});
```

## 2. Migration Execution

We will use an automated or script-based approach to execute SQL files from `database/migrations` and `database/seeds`.
A simple `npm run db:migrate` and `npm run db:seed` script will be added to `package.json`.

```json
"scripts": {
  "db:migrate": "node src/server/scripts/run-migrations.js",
  "db:seed": "node src/server/scripts/run-seeds.js"
}
```

## 3. Repository/Service Folder Structure

To maintain separation of concerns, the API will adopt a Controller-Service-Repository pattern.

```
src/server/
├── db.ts                     # MySQL connection pool
├── scripts/                  # DB migration/seed runner scripts
├── middlewares/              # Express middlewares (auth, validation, error handler)
├── api/
│   ├── routes/               # Express route definitions (Controllers)
│   │   ├── products.ts
│   │   ├── orders.ts
│   │   └── ...
│   ├── services/             # Business logic
│   │   ├── ProductService.ts
│   │   ├── OrderService.ts
│   │   └── ...
│   └── repositories/         # Database access layer (SQL queries)
│       ├── ProductRepository.ts
│       ├── OrderRepository.ts
│       └── ...
```

## 4. Transaction Helper Pattern

For operations that span multiple tables (e.g. creating an order and its order items, and reducing inventory), a transaction helper will be used to ensure ACID compliance.

```typescript
import { pool } from '../db';
import { Connection } from 'mysql2/promise';

export async function withTransaction<T>(
  callback: (connection: Connection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

## 5. API Request Validation Pattern

We will use `zod` for request body validation. A generic validation middleware will intercept invalid requests before they reach the controller.

**Validation Middleware (`src/server/middlewares/validate.ts`):**
```typescript
import { AnyZodObject } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate = (schema: AnyZodObject) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      return next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        details: error.errors
      });
    }
  };
```

## 6. Error Response Shape

All API errors will follow a standardized JSON structure to ensure the frontend can parse and display them consistently.

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable message for logging or user display.",
  "details": [] // Optional array for validation specifics
}
```
Global error handler middleware will catch unhandled exceptions and format them into this shape.

---

## 7. API Migration Phases

The transition from localStorage / mock data to the MySQL backend will be executed in three phased chunks.

### Phase 1: Read-Only Endpoints
Establish the connection and migrate endpoints that fetch data without modifying it.
- **Catalog/Menu:** `GET /api/products`, `GET /api/categories`, `GET /api/modifiers`
- **Members:** `GET /api/members`
- **Orders:** `GET /api/orders`
- **Inventory:** `GET /api/inventory`
- **Config:** `GET /api/settings`

### Phase 2: Write Endpoints
Implement endpoints that insert or update data, utilizing the transaction helper where necessary.
- **Transactions:** `POST /api/orders` (Order creation, items, payments mapping)
- **Menu Updates:** `POST/PUT /api/products`
- **Inventory Adjustments:** `POST /api/inventory/adjust`
- **Member Management:** `POST/PUT /api/members`

### Phase 3: Complex Operations & AI Integration
Migrate logic that requires deep business rules and aggregation.
- **Shift Closing:** `POST /api/shifts/close` (Calculates cash drawer, variances)
- **Payroll:** `POST /api/payroll/generate`
- **AI Fallback Integration:** Inject database repositories into `aiResponse.ts` fallback logic so that if Gemini fails, the fallback functions query real database metrics instead of mock parameters.
