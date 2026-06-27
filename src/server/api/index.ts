import express from 'express';
import { pool } from '../db.js';
import { RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/sync', async (req, res) => {
  try {
    let currentUser = null;
    let activeShift = null;

    // Check session
    const sessionId = req.cookies.coraq_session;
    if (sessionId) {
      const [sessions] = await pool.query<RowDataPacket[]>('SELECT user_id FROM user_sessions WHERE id = ? AND revoked_at IS NULL AND expires_at > NOW()', [sessionId]);
      if (sessions.length > 0) {
        const userId = sessions[0].user_id;
        
        // Fetch current user details
        const [usersRows] = await pool.query<RowDataPacket[]>(`
          SELECT u.id, u.name, uc.pin_hash as pin, u.face_descriptor_json as faceDescriptor, u.role_id as role 
          FROM users u
          LEFT JOIN user_auth_credentials uc ON u.id = uc.user_id
          WHERE u.id = ?
        `, [userId]);
        
        if (usersRows.length > 0) {
          currentUser = {
            ...usersRows[0],
            faceDescriptor: usersRows[0].faceDescriptor ? JSON.parse(usersRows[0].faceDescriptor) : null
          };

          // Fetch active shift for this user
          const [shifts] = await pool.query<RowDataPacket[]>(`
            SELECT id, cashier_name_snapshot as cashierName, start_cash_amount as startCash, opened_at as startTime
            FROM shifts
            WHERE cashier_user_id = ? AND is_open = 1
          `, [userId]);
          
          if (shifts.length > 0) {
            activeShift = {
              id: shifts[0].id,
              cashierName: shifts[0].cashierName,
              startCash: Number(shifts[0].startCash) || 0,
              startTime: shifts[0].startTime.toISOString(),
              status: 'OPEN'
            };
          }
        }
      }
    }

    // 1. Fetch Users
    const [users] = await pool.query<RowDataPacket[]>(`
      SELECT u.id, u.name, uc.pin_hash as pin, u.face_descriptor_json as faceDescriptor, u.role_id as role 
      FROM users u
      LEFT JOIN user_auth_credentials uc ON u.id = uc.user_id
    `);
    
    // 2. Fetch Members
    const [members] = await pool.query<RowDataPacket[]>(`
      SELECT id, full_name as name, phone, '' as email, points_balance as points, tier, total_spending_amount as totalSpending, status 
      FROM members
    `);

    // 3. Fetch Categories
    const [categoriesRows] = await pool.query<RowDataPacket[]>('SELECT code FROM categories');
    const categories = categoriesRows.map(r => r.code);

    // 4. Fetch Ingredients
    const [ingredients] = await pool.query<RowDataPacket[]>(`
      SELECT id, name, 'DEFAULT' as category, stock_qty as stock, usage_unit as unit, cost_per_usage_unit_amount as costPerUnit, min_stock_level as minStock 
      FROM ingredients
    `);

    // 5. Fetch Products (and their recipes)
    const [productsRows] = await pool.query<RowDataPacket[]>(`
      SELECT p.id, p.name, c.code as category, p.price_amount as price, 0 as cogs, p.image_url as image, '' as description, p.active as isAvailable 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `);
    const [recipes] = await pool.query<RowDataPacket[]>('SELECT product_id, ingredient_id, amount FROM product_recipes');
    
    const products = productsRows.map(p => ({
      ...p,
      price: Number(p.price) || 0,
      cogs: Number(p.cogs) || 0,
      isAvailable: p.isAvailable === 1,
      recipe: recipes.filter(r => r.product_id === p.id).map(r => ({
        ingredientId: r.ingredient_id,
        amount: Number(r.amount) || 0
      }))
    }));


    // Fetch Orders
    const [ordersRows] = await pool.query<RowDataPacket[]>('SELECT * FROM orders ORDER BY created_at DESC LIMIT 50');
    
    let orderItemsRows: RowDataPacket[] = [];
    if (ordersRows.length > 0) {
      const orderIds = ordersRows.map(o => o.id);
      const [items] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM order_items WHERE order_id IN (?)',
        [orderIds]
      );
      orderItemsRows = items;
    }
    
    const orders = ordersRows.map(o => {
      const items = orderItemsRows.filter(i => i.order_id === o.id).map(i => ({
        id: i.id,
        tempId: i.id,
        product: products.find((p: any) => p.id === i.product_id) || { id: i.product_id, name: i.product_name_snapshot, price: i.unit_price_amount, category: i.category_code_snapshot },
        quantity: i.quantity,
        price: i.unit_price_amount,
        note: i.note,
        modifiers: [],
        completed: i.completed === 1
      }));

      return {
        id: o.id,
        pagerNumber: o.pager_number,
        items,
        totalAmount: o.total_amount,
        finalAmount: o.final_amount,
        discountApplied: o.discount_applied_amount,
        pointsEarned: o.points_earned,
        pointsRedeemed: o.points_redeemed,
        promoCode: o.promo_code,
        memberId: o.member_id,
        customerName: o.customer_name,
        status: o.status,
        paymentStatus: o.payment_status,
        baristaStatus: o.barista_status,
        kitchenStatus: o.kitchen_status,
        baristaStartTime: o.barista_start_at ? o.barista_start_at.toISOString() : undefined,
        kitchenStartTime: o.kitchen_start_at ? o.kitchen_start_at.toISOString() : undefined,
        prepStartTime: o.prep_start_at ? o.prep_start_at.toISOString() : undefined,
        createdAt: o.created_at.toISOString(),
        paymentMethod: o.payment_method,
        cashierName: o.cashier_name_snapshot,
        cashReceived: o.cash_received_amount,
        change: o.change_amount,
        paymentProof: o.payment_proof_url,
        paidAt: o.paid_at ? o.paid_at.toISOString() : undefined
      };
    });

    // Fetch Modifiers
    const [modifiersRows] = await pool.query<RowDataPacket[]>('SELECT id, name, price_amount as price, type FROM modifiers WHERE active = 1');
    const [modTargetsRows] = await pool.query<RowDataPacket[]>('SELECT mtc.modifier_id, c.code FROM modifier_target_categories mtc JOIN categories c ON mtc.category_id = c.id');
    
    const mappedModifiers = modifiersRows.map(m => ({
      id: m.id,
      name: m.name,
      price: Number(m.price) || 0,
      type: m.type,
      targetCategories: modTargetsRows.filter(t => t.modifier_id === m.id).map(t => t.code)
    }));

    // 6. Fetch Config
    const storeConfig = {
      storeName: "Coraq Coffee POS",
      storeAddress: "Jl. Perintis Kemerdekaan, Makassar",
      taxRate: 0,
      receiptFooter: "Terima kasih atas kunjungan Anda!",
      lowStockThreshold: 10,
      loyaltyPointMultiplier: 0.1,
      currency: "IDR",
      enableFaceLogin: false,
      pointValue: 1
    };

    // Send the state object back to frontend
    res.json({
      currentUser,
      activeShift,
      users: users.map(u => ({ ...u, faceDescriptor: u.faceDescriptor ? JSON.parse(u.faceDescriptor) : null })),
      members,
      categories,
      ingredients,
      products,
      storeConfig,
      orders: orders,
      modifiers: mappedModifiers,
      promotions: [],
      expenses: [],
      shiftHistory: [],
      attendanceLogs: [],
      auditLogs: []
    });

  } catch (error: any) {
    console.error('Error syncing initial state:', error);
    res.status(500).json({ error: error.message });
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
    
    // NOTE: Hashing logic should ideally be here if it isn't already handled by frontend.
    // Since frontend sends plain PIN and currently frontend hashes it, we will just simulate basic check.
    // Actually, in the new flow, we should do the hashing in the backend. 
    // For now, to keep compatibility with existing mock users, we check if pin matches exactly.
    // We will do a basic string match. The frontend StoreContext previously did the hashing check, 
    // but now we'll accept the PIN and check.
    
    let user = usersRows.find(u => u.pin === pin);
    if (!user) {
      // Try to hash it using the same simple logic (assuming frontend was doing this)
      // If we don't have crypto here, let's just assume frontend sends the hashed PIN or we just rely on exact match.
      // Wait, StoreContext previously received plain text from Login component, hashed it, and compared.
      // So req.body.pin is PLAIN TEXT. We need to hash it here if it's not hashed.
      const encoder = new TextEncoder();
      const data = encoder.encode(pin);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedInput = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
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

export default router;
