import express from 'express';
import { pool } from '../db';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

router.get('/sync', async (req, res) => {
  try {
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
      isAvailable: p.isAvailable === 1,
      recipe: recipes.filter(r => r.product_id === p.id).map(r => ({
        ingredientId: r.ingredient_id,
        amount: r.amount
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

    // 6. Fetch Config
    const storeConfig = {
      storeName: "Coraq Coffee POS",
      storeAddress: "Jl. Perintis Kemerdekaan, Makassar",
      taxRate: 0,
      receiptFooter: "Terima kasih atas kunjungan Anda!",
      lowStockThreshold: 10,
      loyaltyPointMultiplier: 0.1,
      currency: "IDR",
      enableFaceLogin: false
    };

    // Send the state object back to frontend
    res.json({
      users: users.map(u => ({ ...u, faceDescriptor: u.faceDescriptor ? JSON.parse(u.faceDescriptor) : null })),
      members,
      categories,
      ingredients,
      products,
      storeConfig,
      orders: orders,
      modifiers: [], // TODO: map modifiers
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

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error creating order in DB:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
