import express from 'express';
import { pool } from '../db.js';
import { RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const router = express.Router();

router.get('/sync', async (req, res) => {
  try {
    console.log("========== /api/sync ==========");

    let currentUser = null;
    let activeShift = null;

    console.log("1. Check Session");

    const sessionId = req.cookies.coraq_session;

    if (sessionId) {
      const [sessions] = await pool.query<RowDataPacket[]>(
        `SELECT user_id
         FROM user_sessions
         WHERE id = ?
         AND revoked_at IS NULL
         AND expires_at > NOW()`,
        [sessionId]
      );

      console.log("1.1 Session OK");

      if (sessions.length > 0) {
        const userId = sessions[0].user_id;

        const [usersRows] = await pool.query<RowDataPacket[]>(
          `SELECT
              u.id,
              u.name,
              uc.pin_hash as pin,
              u.face_descriptor_json as faceDescriptor,
              u.role_id as role
          FROM users u
          LEFT JOIN user_auth_credentials uc
              ON u.id = uc.user_id
          WHERE u.id = ?`,
          [userId]
        );

        console.log("1.2 User Session OK");

        if (usersRows.length > 0) {
          currentUser = {
            ...usersRows[0],
            faceDescriptor: usersRows[0].faceDescriptor
              ? JSON.parse(usersRows[0].faceDescriptor)
              : null
          };

          const [shifts] = await pool.query<RowDataPacket[]>(
            `SELECT
                id,
                cashier_name_snapshot as cashierName,
                start_cash_amount as startCash,
                opened_at as startTime
            FROM shifts
            WHERE cashier_user_id = ?
            AND is_open = 1`,
            [userId]
          );

          console.log("1.3 Shift OK");

          if (shifts.length > 0) {
            activeShift = {
              id: shifts[0].id,
              cashierName: shifts[0].cashierName,
              startCash: Number(shifts[0].startCash),
              startTime: shifts[0].startTime.toISOString(),
              status: "OPEN"
            };
          }
        }
      }
    }

    console.log("2. Users");

    const [users] = await pool.query<RowDataPacket[]>(`
      SELECT
        u.id,
        u.name,
        uc.pin_hash as pin,
        u.face_descriptor_json as faceDescriptor,
        u.role_id as role
      FROM users u
      LEFT JOIN user_auth_credentials uc
      ON u.id = uc.user_id
    `);

    console.log("3. Members");

    const [members] = await pool.query<RowDataPacket[]>(`
      SELECT
        id,
        full_name as name,
        phone,
        '' as email,
        points_balance as points,
        tier,
        total_spending_amount as totalSpending,
        status
      FROM members
    `);

    console.log("4. Categories");

    const [categoriesRows] =
      await pool.query<RowDataPacket[]>("SELECT code FROM categories");

    const categories = categoriesRows.map(c => c.code);

    console.log("5. Ingredients");

    const [ingredients] = await pool.query<RowDataPacket[]>(`
      SELECT
        id,
        name,
        'DEFAULT' as category,
        stock_qty as stock,
        usage_unit as unit,
        cost_per_usage_unit_amount as costPerUnit,
        min_stock_level as minStock
      FROM ingredients
    `);

    console.log("6. Products");

    const [productsRows] = await pool.query<RowDataPacket[]>(`
      SELECT
        p.id,
        p.name,
        c.code as category,
        p.price_amount as price,
        0 as cogs,
        p.image_url as image,
        '' as description,
        p.active as isAvailable
      FROM products p
      LEFT JOIN categories c
      ON p.category_id = c.id
    `);

    console.log("7. Recipes");

    const [recipes] =
      await pool.query<RowDataPacket[]>(
        "SELECT product_id, ingredient_id, amount FROM product_recipes"
      );

    const products = productsRows.map(p => ({
      ...p,
      price: Number(p.price),
      cogs: Number(p.cogs),
      isAvailable: p.isAvailable === 1,
      recipe: recipes
        .filter(r => r.product_id === p.id)
        .map(r => ({
          ingredientId: r.ingredient_id,
          amount: Number(r.amount)
        }))
    }));

    console.log("8. Orders");

    const [ordersRows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM orders ORDER BY created_at DESC LIMIT 50"
    );

    let orderItemsRows: RowDataPacket[] = [];

    if (ordersRows.length > 0) {

      const orderIds = ordersRows.map(o => o.id);

      console.log("Order IDs:", orderIds);

      const placeholders = orderIds.map(() => "?").join(",");

      const sql = `
        SELECT *
        FROM order_items
        WHERE order_id IN (${placeholders})
      `;

      const [items] = await pool.query<RowDataPacket[]>(sql, orderIds);

      orderItemsRows = items;

      console.log("8.1 Order Items OK");
    }

    console.log("9. Modifiers");

    const [modifiersRows] = await pool.query<RowDataPacket[]>(
      "SELECT id,name,price_amount as price,type FROM modifiers WHERE active=1"
    );

    const [modTargetsRows] = await pool.query<RowDataPacket[]>(
      `SELECT
          mtc.modifier_id,
          c.code
      FROM modifier_target_categories mtc
      JOIN categories c
      ON mtc.category_id=c.id`
    );

    const mappedModifiers = modifiersRows.map(m => ({
      id: m.id,
      name: m.name,
      price: Number(m.price),
      type: m.type,
      targetCategories: modTargetsRows
        .filter(t => t.modifier_id === m.id)
        .map(t => t.code)
    }));

    console.log("10. Send JSON");

    res.json({
      currentUser,
      activeShift,
      users: users.map(u => ({
        ...u,
        faceDescriptor: u.faceDescriptor
          ? JSON.parse(u.faceDescriptor)
          : null
      })),
      members,
      categories,
      ingredients,
      products,
      storeConfig: {
        storeName: "Coraq Coffee POS",
        storeAddress: "Jl. Perintis Kemerdekaan, Makassar",
        taxRate: 0,
        receiptFooter: "Terima kasih atas kunjungan Anda!",
        lowStockThreshold: 10,
        loyaltyPointMultiplier: 0.1,
        currency: "IDR",
        enableFaceLogin: false,
        pointValue: 1
      },
      orders: [],
      modifiers: mappedModifiers,
      promotions: [],
      expenses: [],
      shiftHistory: [],
      attendanceLogs: [],
      auditLogs: []
    });

    console.log("========== FINISHED ==========");

  } catch (err) {
    console.error("SYNC ERROR");
    console.error(err);
    res.status(500).json(err);
  }
});


router.post('/auth/login', async (req, res) => {
  try {
    const { pin } = req.body;

    // Simple mock logic for testing purposes, assuming hashed PIN logic is already verified
    // We just find a user matching the PIN (or hashed PIN).
    const [usersRows] = await pool.query<RowDataPacket[]>(`
      SELECT u.id, u.name, uc.pin_hash as pin, u.face_descriptor_json as faceDescriptor, u.role_id as role 
      FROM users u
      LEFT JOIN user_auth_credentials uc ON u.id = uc.user_id
    `);

    let user = usersRows.find(u => u.pin === pin);
    if (!user) {
      // Frontend sends plain-text PIN; hash it here with SHA-256 (same algorithm as MySQL's SHA2(x, 256))
      const hashedInput = crypto.createHash('sha256').update(pin).digest('hex');

      user = usersRows.find(u => u.pin === hashedInput);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await pool.query(
      'INSERT INTO user_sessions (id, user_id, refresh_token_hash, expires_at) VALUES (?, ?, ?, ?)',
      [sessionId, user.id, sessionId, expiresAt]
    );

    res.cookie('coraq_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ success: true, user: { ...user, faceDescriptor: user.faceDescriptor ? JSON.parse(user.faceDescriptor) : null } });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/auth/logout', async (req, res) => {
  try {
    const sessionId = req.cookies.coraq_session;
    if (sessionId) {
      await pool.query('UPDATE user_sessions SET revoked_at = NOW() WHERE id = ?', [sessionId]);
      res.clearCookie('coraq_session');
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/shifts/start', async (req, res) => {
  try {
    const sessionId = req.cookies.coraq_session;
    if (!sessionId) return res.status(401).json({ error: 'Unauthorized' });

    // Get user from session
    const [sessions] = await pool.query<RowDataPacket[]>('SELECT user_id FROM user_sessions WHERE id = ? AND revoked_at IS NULL AND expires_at > NOW()', [sessionId]);
    if (sessions.length === 0) return res.status(401).json({ error: 'Unauthorized' });
    const userId = sessions[0].user_id;

    // Get user details
    const [users] = await pool.query<RowDataPacket[]>('SELECT name FROM users WHERE id = ?', [userId]);
    const userName = users[0].name;

    const { startCash } = req.body;
    const shiftId = `s-${Date.now()}`;
    
    await pool.query(
      'INSERT INTO shifts (id, cashier_user_id, cashier_name_snapshot, start_cash_amount, opened_at, is_open) VALUES (?, ?, ?, ?, NOW(), 1)',
      [shiftId, userId, userName, startCash]
    );

    const activeShift = {
      id: shiftId,
      startTime: new Date().toISOString(),
      startCash,
      status: 'OPEN',
      cashierName: userName,
    };

    res.json({ success: true, shift: activeShift });
  } catch (error: any) {
    console.error('Start shift error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/shifts/end', async (req, res) => {
  try {
    const sessionId = req.cookies.coraq_session;
    if (!sessionId) return res.status(401).json({ error: 'Unauthorized' });

    // Get user from session
    const [sessions] = await pool.query<RowDataPacket[]>('SELECT user_id FROM user_sessions WHERE id = ? AND revoked_at IS NULL AND expires_at > NOW()', [sessionId]);
    if (sessions.length === 0) return res.status(401).json({ error: 'Unauthorized' });
    const userId = sessions[0].user_id;

    const { actualEndCash } = req.body;
    
    // Find active shift
    const [shifts] = await pool.query<RowDataPacket[]>('SELECT id FROM shifts WHERE cashier_user_id = ? AND is_open = 1', [userId]);
    if (shifts.length === 0) return res.status(400).json({ error: 'No active shift found' });
    const shiftId = shifts[0].id;

    await pool.query(
      'UPDATE shifts SET end_cash_amount = ?, closed_at = NOW(), is_open = 0 WHERE id = ?',
      [actualEndCash, shiftId]
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('End shift error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/orders', async (req, res) => {
  const order = req.body;
  try {
    const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();

    await pool.query(
      `INSERT INTO orders (
        id, pager_number, total_amount, final_amount, discount_applied_amount, 
        points_earned, points_redeemed, promo_code, member_id, customer_name,
        status, payment_status, barista_status, kitchen_status,
        barista_start_at, kitchen_start_at, prep_start_at,
        payment_method, cashier_user_id, cashier_name_snapshot, cash_received_amount, change_amount, payment_proof_url, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.id, order.pagerNumber, order.totalAmount, order.finalAmount, order.discountApplied,
        order.pointsEarned, order.pointsRedeemed, order.promoCode || null, order.memberId || null, order.customerName,
        order.status, order.paymentStatus, order.baristaStatus || 'IDLE', order.kitchenStatus || 'IDLE',
        order.baristaStartTime ? new Date(order.baristaStartTime) : null, 
        order.kitchenStartTime ? new Date(order.kitchenStartTime) : null, 
        order.prepStartTime ? new Date(order.prepStartTime) : null,
        order.paymentMethod, null, order.cashierName || 'Unknown', order.cashReceived || null, order.change || null, order.paymentProof || null, createdAt
      ]
    );

    // Insert order items
    for (const item of order.items) {
      const itemId = `ITEM-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      await pool.query(
        `INSERT INTO order_items (
          id, order_id, product_id, product_name_snapshot, category_code_snapshot, quantity, 
          unit_price_amount, note, completed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itemId, order.id, item.product.id, item.product.name, item.product.category || 'UNKNOWN', item.quantity,
          item.product.price, item.note || null, item.completed ? 1 : 0
        ]
      );
    }

    res.status(201).json({ success: true, orderId: order.id });
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, handledBy, handledByRole } = req.body;
    
    let timeColumn = '';
    if (status === 'PREPARING') timeColumn = 'prep_start_time';
    else if (status === 'READY') timeColumn = 'ready_time';
    else if (status === 'COMPLETED') timeColumn = 'completed_time';

    const timeUpdate = timeColumn ? `, ${timeColumn} = NOW()` : '';
    const handledUpdate = (status === 'PREPARING' && handledBy) ? `, handled_by_name = ?, handled_by_role = ?` : '';
    
    const query = `UPDATE orders SET status = ?${timeUpdate}${handledUpdate} WHERE id = ?`;
    const params: any[] = [status];
    if (status === 'PREPARING' && handledBy) {
      params.push(handledBy, handledByRole);
    }
    params.push(id);

    await pool.query(query, params);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/orders/:orderId/items/:itemId/completion', async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { completed } = req.body;
    
    const timeUpdate = completed ? 'NOW()' : 'NULL';
    
    await pool.query(
      `UPDATE order_items SET completed = ?, completed_at = ${timeUpdate} WHERE id = ? AND order_id = ?`,
      [completed ? 1 : 0, itemId, orderId]
    );
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Update item completion error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/orders/:id/station', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, status } = req.body; // role: 'BARISTA' | 'KITCHEN', status: StationStatus

    const now = new Date();
    
    if (role === 'BARISTA') {
      const timeUpdate = status === 'PREPARING' ? ', barista_start_at = IF(barista_start_at IS NULL, NOW(), barista_start_at)' : '';
      const readyUpdate = status === 'READY' ? ', ready_at = IF(ready_at IS NULL, NOW(), ready_at)' : '';
      await pool.query(
        `UPDATE orders SET barista_status = ?${timeUpdate}${readyUpdate} WHERE id = ?`,
        [status, id]
      );

      // Resolve global status: if kitchen_status is also READY/IDLE/COMPLETED, mark order as READY
      const [rows] = await pool.query<RowDataPacket[]>('SELECT barista_status, kitchen_status FROM orders WHERE id = ?', [id]);
      if (rows.length > 0) {
        const { barista_status, kitchen_status } = rows[0];
        const activeStatuses = [barista_status, kitchen_status].filter((s: string) => s !== 'IDLE');
        const allReady = activeStatuses.length > 0 && activeStatuses.every((s: string) => s === 'READY' || s === 'COMPLETED');
        if (allReady) {
          await pool.query('UPDATE orders SET status = ?, ready_at = IF(ready_at IS NULL, NOW(), ready_at) WHERE id = ?', ['READY', id]);
        }
      }
    } else if (role === 'KITCHEN') {
      const timeUpdate = status === 'PREPARING' ? ', kitchen_start_at = IF(kitchen_start_at IS NULL, NOW(), kitchen_start_at)' : '';
      const readyUpdate = status === 'READY' ? ', ready_at = IF(ready_at IS NULL, NOW(), ready_at)' : '';
      await pool.query(
        `UPDATE orders SET kitchen_status = ?${timeUpdate}${readyUpdate} WHERE id = ?`,
        [status, id]
      );

      const [rows] = await pool.query<RowDataPacket[]>('SELECT barista_status, kitchen_status FROM orders WHERE id = ?', [id]);
      if (rows.length > 0) {
        const { barista_status, kitchen_status } = rows[0];
        const activeStatuses = [barista_status, kitchen_status].filter((s: string) => s !== 'IDLE');
        const allReady = activeStatuses.length > 0 && activeStatuses.every((s: string) => s === 'READY' || s === 'COMPLETED');
        if (allReady) {
          await pool.query('UPDATE orders SET status = ?, ready_at = IF(ready_at IS NULL, NOW(), ready_at) WHERE id = ?', ['READY', id]);
        }
      }
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Update station status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== PRODUCTS ====================
router.post('/products', async (req, res) => {
  try {
    const p = req.body;
    await pool.query(
      `INSERT INTO products (id, category_id, name, price_amount, image_url, standard_prep_time_minutes, active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [p.id, p.category, p.name, p.price, p.image || null, p.standardPrepTime || 5, p.isAvailable !== false ? 1 : 0]
    );
    res.status(201).json({ success: true });
  } catch (error: any) {
    console.error('Add product error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const p = req.body;
    await pool.query(
      `UPDATE products SET category_id=?, name=?, price_amount=?, image_url=?, standard_prep_time_minutes=?, active=? WHERE id=?`,
      [p.category, p.name, p.price, p.image || null, p.standardPrepTime || 5, p.isAvailable !== false ? 1 : 0, id]
    );
    res.json({ success: true });
  } catch (error: any) {
    console.error('Update product error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== USERS ====================
router.post('/users', async (req, res) => {
  try {
    const u = req.body;
    await pool.query(
      `INSERT INTO users (id, name, role_id, phone) VALUES (?, ?, ?, ?)`,
      [u.id, u.name, u.role, u.phone || null]
    );
    if (u.pin) {
      const hashedPin = crypto.createHash('sha256').update(u.pin).digest('hex');
      await pool.query(
        `INSERT INTO user_auth_credentials (user_id, pin_hash) VALUES (?, ?)`,
        [u.id, hashedPin]
      );
    }
    res.status(201).json({ success: true });
  } catch (error: any) {
    console.error('Add user error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const u = req.body;
    await pool.query(
      `UPDATE users SET name=?, role_id=?, phone=? WHERE id=?`,
      [u.name, u.role, u.phone || null, id]
    );
    if (u.pin) {
      const hashedPin = crypto.createHash('sha256').update(u.pin).digest('hex');
      await pool.query(
        `INSERT INTO user_auth_credentials (user_id, pin_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE pin_hash=?`,
        [id, hashedPin, hashedPin]
      );
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== MEMBERS ====================
router.post('/members', async (req, res) => {
  try {
    const m = req.body;
    await pool.query(
      `INSERT INTO members (id, full_name, nickname, display_name, phone, photo_url, birth_date, gender, tier, points_balance, status, join_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
      [m.id, m.fullName, m.nickname, m.nickname || m.fullName, m.phone, m.photo || null, m.birthDate || null, m.gender || null, m.tier || 'BRONZE', m.points || 0, m.status || 'PENDING']
    );
    res.status(201).json({ success: true });
  } catch (error: any) {
    console.error('Add member error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const m = req.body;
    const fields: string[] = [];
    const vals: any[] = [];
    if (m.fullName !== undefined) { fields.push('full_name=?'); vals.push(m.fullName); }
    if (m.nickname !== undefined) { fields.push('nickname=?'); vals.push(m.nickname); }
    if (m.phone !== undefined) { fields.push('phone=?'); vals.push(m.phone); }
    if (m.tier !== undefined) { fields.push('tier=?'); vals.push(m.tier); }
    if (m.points !== undefined) { fields.push('points_balance=?'); vals.push(m.points); }
    if (m.status !== undefined) { fields.push('status=?'); vals.push(m.status); }
    if (m.cardId !== undefined) { fields.push('card_id=?'); vals.push(m.cardId); }
    if (fields.length === 0) return res.json({ success: true });
    vals.push(id);
    await pool.query(`UPDATE members SET ${fields.join(',')} WHERE id=?`, vals);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/members/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM members WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== MODIFIERS ====================
router.post('/modifiers', async (req, res) => {
  try {
    const m = req.body;
    await pool.query(
      `INSERT INTO modifiers (id, name, price_amount, type, active)
       VALUES (?, ?, ?, ?, 1)`,
      [m.id, m.name, m.price || 0, m.groupName && ['SUGAR', 'ICE', 'ADDON'].includes(m.groupName) ? m.groupName : 'ADDON']
    );
    res.status(201).json({ success: true });
  } catch (error: any) {
    console.error('Add modifier error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/modifiers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const m = req.body;
    await pool.query(
      `UPDATE modifiers SET name=?, price_amount=?, type=? WHERE id=?`,
      [m.name, m.price || 0, m.groupName && ['SUGAR', 'ICE', 'ADDON'].includes(m.groupName) ? m.groupName : 'ADDON', id]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/modifiers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM modifiers WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== INGREDIENTS ====================
router.post('/ingredients', async (req, res) => {
  try {
    const ing = req.body;
    await pool.query(
      `INSERT INTO ingredients (id, name, stock_qty, usage_unit, cost_per_usage_unit_amount, min_stock_level)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ing.id, ing.name, ing.stock || 0, ing.unit, ing.costPerUnit || 0, ing.lowStockThreshold || 10]
    );
    res.status(201).json({ success: true });
  } catch (error: any) {
    console.error('Add ingredient error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/ingredients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ing = req.body;
    await pool.query(
      `UPDATE ingredients SET name=?, stock_qty=?, usage_unit=?, cost_per_usage_unit_amount=?, min_stock_level=? WHERE id=?`,
      [ing.name, ing.stock, ing.unit, ing.costPerUnit, ing.lowStockThreshold || 10, id]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;