import express from 'express';
import { pool } from '../db';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

router.get('/sync', async (req, res) => {
  try {
    // 1. Fetch Users
    const [users] = await pool.query<RowDataPacket[]>('SELECT id, name, pin, face_descriptor as faceDescriptor, role FROM users');
    
    // 2. Fetch Members
    const [members] = await pool.query<RowDataPacket[]>('SELECT id, name, phone, email, point_balance as points, tier, total_spending as totalSpending, status FROM members');

    // 3. Fetch Categories
    const [categories] = await pool.query<RowDataPacket[]>('SELECT id, name, color, icon FROM categories');

    // 4. Fetch Ingredients
    const [ingredients] = await pool.query<RowDataPacket[]>('SELECT id, name, category, stock, unit, cost_per_unit as costPerUnit, minimum_stock as minStock FROM ingredients');

    // 5. Fetch Products (and their recipes)
    const [productsRows] = await pool.query<RowDataPacket[]>('SELECT id, name, category, price, cost_of_goods as cogs, image, description, is_available as isAvailable FROM products');
    const [recipes] = await pool.query<RowDataPacket[]>('SELECT product_id, ingredient_id, amount FROM product_recipes');
    
    const products = productsRows.map(p => ({
      ...p,
      isAvailable: p.isAvailable === 1,
      recipe: recipes.filter(r => r.product_id === p.id).map(r => ({
        ingredientId: r.ingredient_id,
        amount: r.amount
      }))
    }));

    // 6. Fetch Config
    const [config] = await pool.query<RowDataPacket[]>('SELECT config_key, config_value FROM store_config');
    const storeConfig = config.reduce((acc: any, curr: any) => {
      acc[curr.config_key] = JSON.parse(curr.config_value);
      return acc;
    }, {
      storeName: "Coraq Coffee POS",
      storeAddress: "Jl. Perintis Kemerdekaan, Makassar",
      taxRate: 0,
      receiptFooter: "Terima kasih atas kunjungan Anda!",
      lowStockThreshold: 10,
      loyaltyPointMultiplier: 0.1,
      currency: "IDR",
      enableFaceLogin: false
    });

    // Send the state object back to frontend
    res.json({
      users: users.map(u => ({ ...u, faceDescriptor: u.faceDescriptor ? JSON.parse(u.faceDescriptor) : null })),
      members,
      categories,
      ingredients,
      products,
      storeConfig,
      orders: [], // TODO: map orders, order_items
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

export default router;
