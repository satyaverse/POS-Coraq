/**
 * Admin Integration Test Suite
 *
 * Memverifikasi bahwa semua operasi CRUD dari Admin (login PIN: 111111)
 * tersimpan ke DATABASE (via API), bukan ke localStorage.
 *
 * Jalankan: npm test (server harus aktif di http://localhost:3000)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const BASE_URL = 'http://localhost:3000/api';
let sessionCookie = '';

const apiFetch = (path: string, options: RequestInit = {}) =>
  fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(sessionCookie ? { Cookie: sessionCookie } : {}),
      ...(options.headers as Record<string, string> ?? {}),
    },
  });

// ==================== SETUP ====================
beforeAll(async () => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: '111111' }),
  });

  expect(res.ok, 'Login admin harus berhasil').toBe(true);
  const setCookieHeader = res.headers.get('set-cookie');
  expect(setCookieHeader, 'Session cookie harus di-set').toBeTruthy();
  sessionCookie = setCookieHeader!.split(';')[0];

  const data = await res.json();
  expect(data.user?.role, 'User harus ADMIN').toBe('ADMIN');
  console.log(`\n✅ Login Admin berhasil: ${data.user.name} (${data.user.role})\n`);
});

afterAll(async () => {
  await apiFetch('/auth/logout', { method: 'POST' });
  console.log('\n🔒 Logout Admin selesai.\n');
});

// ==================== PRODUCTS ====================
describe('Admin: Product CRUD → tersimpan di Database', () => {
  const testProductId = `TEST-PROD-${Date.now()}`;

  it('POST /products — tambah produk baru ke DB', async () => {
    const product = { id: testProductId, name: 'Test Kopi Integrasi', description: 'Test', price: 25000, category: 'COFFEE', standardPrepTime: 5, isAvailable: true };
    const res = await apiFetch('/products', { method: 'POST', body: JSON.stringify(product) });
    expect(res.ok, 'Response harus OK').toBe(true);
    const data = await res.json();
    expect(data.success).toBe(true);

    const sync = await (await apiFetch('/sync')).json();
    const found = sync.products?.find((p: any) => p.id === testProductId);
    expect(found, 'Produk harus ditemukan di DB via /sync').toBeTruthy();
    expect(found.name).toBe('Test Kopi Integrasi');
    expect(found.price).toBe(25000);
    console.log(`  ✅ Produk "${found.name}" tersimpan di database (price: Rp${found.price})`);
  });

  it('PUT /products/:id — update produk di DB', async () => {
    const res = await apiFetch(`/products/${testProductId}`, {
      method: 'PUT',
      body: JSON.stringify({ name: 'Test Kopi Updated', description: 'Updated', price: 30000, category: 'COFFEE', standardPrepTime: 7, isAvailable: true }),
    });
    expect(res.ok).toBe(true);

    const sync = await (await apiFetch('/sync')).json();
    const found = sync.products?.find((p: any) => p.id === testProductId);
    expect(found?.name).toBe('Test Kopi Updated');
    expect(found?.price).toBe(30000);
    console.log(`  ✅ Update berhasil → harga baru: Rp${found.price}`);
  });

  it('DELETE /products/:id — hapus produk dari DB', async () => {
    const res = await apiFetch(`/products/${testProductId}`, { method: 'DELETE' });
    expect(res.ok).toBe(true);

    const sync = await (await apiFetch('/sync')).json();
    const found = sync.products?.find((p: any) => p.id === testProductId);
    expect(found, 'Produk harus sudah terhapus dari DB').toBeUndefined();
    console.log('  ✅ Produk berhasil dihapus dari database');
  });
});

// ==================== USERS ====================
describe('Admin: User CRUD → tersimpan di Database', () => {
  const testUserId = `TEST-USER-${Date.now()}`;

  it('POST /users — tambah user baru dengan PIN ke DB', async () => {
    const user = { id: testUserId, name: 'Kasir Test', role: 'CASHIER', phone: '08123456789', pin: '999999' };
    const res = await apiFetch('/users', { method: 'POST', body: JSON.stringify(user) });
    expect(res.ok).toBe(true);
    expect((await res.json()).success).toBe(true);

    const sync = await (await apiFetch('/sync')).json();
    const found = sync.users?.find((u: any) => u.id === testUserId);
    expect(found?.name).toBe('Kasir Test');
    console.log(`  ✅ User "${found.name}" tersimpan di database`);
  });

  it('Login user baru dengan PIN yang diset', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '999999' }),
    });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.user?.name).toBe('Kasir Test');
    console.log(`  ✅ User baru bisa login dengan PIN yang didaftarkan`);
    // Cleanup session
    const cookie = res.headers.get('set-cookie')?.split(';')[0];
    if (cookie) await fetch(`${BASE_URL}/auth/logout`, { method: 'POST', headers: { Cookie: cookie } });
  });

  it('DELETE /users/:id — hapus user dari DB', async () => {
    const res = await apiFetch(`/users/${testUserId}`, { method: 'DELETE' });
    expect(res.ok).toBe(true);

    const sync = await (await apiFetch('/sync')).json();
    expect(sync.users?.find((u: any) => u.id === testUserId)).toBeUndefined();
    console.log('  ✅ User berhasil dihapus dari database');
  });
});

// ==================== MODIFIERS ====================
describe('Admin: Modifier CRUD → tersimpan di Database', () => {
  const testModId = `TEST-MOD-${Date.now()}`;

  it('POST /modifiers — tambah modifier ke DB', async () => {
    const mod = { id: testModId, name: 'Extra Shot Test', price: 5000, isDefault: false, groupName: 'Espresso', targetCategories: ['COFFEE'] };
    const res = await apiFetch('/modifiers', { method: 'POST', body: JSON.stringify(mod) });
    expect(res.ok).toBe(true);

    const sync = await (await apiFetch('/sync')).json();
    const found = sync.modifiers?.find((m: any) => m.id === testModId);
    expect(found?.name).toBe('Extra Shot Test');
    console.log(`  ✅ Modifier "${found.name}" tersimpan di database`);
  });

  it('PUT /modifiers/:id — update modifier di DB', async () => {
    const res = await apiFetch(`/modifiers/${testModId}`, {
      method: 'PUT',
      body: JSON.stringify({ name: 'Extra Shot Test', price: 7000, isDefault: false, groupName: 'Espresso' }),
    });
    expect(res.ok).toBe(true);

    const sync = await (await apiFetch('/sync')).json();
    const found = sync.modifiers?.find((m: any) => m.id === testModId);
    expect(found?.price).toBe(7000);
    console.log(`  ✅ Update modifier berhasil → harga baru: Rp${found.price}`);
  });

  it('DELETE /modifiers/:id — hapus modifier dari DB', async () => {
    const res = await apiFetch(`/modifiers/${testModId}`, { method: 'DELETE' });
    expect(res.ok).toBe(true);

    const sync = await (await apiFetch('/sync')).json();
    expect(sync.modifiers?.find((m: any) => m.id === testModId)).toBeUndefined();
    console.log('  ✅ Modifier berhasil dihapus dari database');
  });
});

// ==================== MEMBERS ====================
describe('Admin: Member CRUD → tersimpan di Database', () => {
  const testMemberId = `TEST-MBR-${Date.now()}`;

  it('POST /members — tambah member ke DB', async () => {
    const member = { id: testMemberId, fullName: 'Siti Test Member', nickname: 'Siti', phone: '08999999999', tier: 'BRONZE', points: 0, status: 'ACTIVE' };
    const res = await apiFetch('/members', { method: 'POST', body: JSON.stringify(member) });
    expect(res.ok).toBe(true);

    const sync = await (await apiFetch('/sync')).json();
    const found = sync.members?.find((m: any) => m.id === testMemberId);
    expect(found).toBeTruthy();
    console.log(`  ✅ Member "${member.fullName}" tersimpan di database`);
  });

  it('DELETE /members/:id — hapus member dari DB', async () => {
    const res = await apiFetch(`/members/${testMemberId}`, { method: 'DELETE' });
    expect(res.ok).toBe(true);

    const sync = await (await apiFetch('/sync')).json();
    expect(sync.members?.find((m: any) => m.id === testMemberId)).toBeUndefined();
    console.log('  ✅ Member berhasil dihapus dari database');
  });
});

// ==================== INGREDIENTS ====================
describe('Admin: Ingredient CRUD → tersimpan di Database', () => {
  const testIngId = `TEST-ING-${Date.now()}`;

  it('POST /ingredients — tambah bahan ke DB', async () => {
    const ing = { id: testIngId, name: 'Bahan Test', stock: 100, unit: 'gram', costPerUnit: 50, lowStockThreshold: 10 };
    const res = await apiFetch('/ingredients', { method: 'POST', body: JSON.stringify(ing) });
    expect(res.ok).toBe(true);

    const sync = await (await apiFetch('/sync')).json();
    const found = sync.ingredients?.find((i: any) => i.id === testIngId);
    expect(found?.name).toBe('Bahan Test');
    console.log(`  ✅ Bahan "${found.name}" (stok: ${found.stock} gram) tersimpan di database`);
  });

  it('PUT /ingredients/:id — update stok bahan di DB', async () => {
    const res = await apiFetch(`/ingredients/${testIngId}`, {
      method: 'PUT',
      body: JSON.stringify({ name: 'Bahan Test', stock: 200, unit: 'gram', costPerUnit: 60, lowStockThreshold: 15 }),
    });
    expect(res.ok).toBe(true);

    const sync = await (await apiFetch('/sync')).json();
    const found = sync.ingredients?.find((i: any) => i.id === testIngId);
    expect(Number(found?.stock)).toBe(200);
    console.log(`  ✅ Update stok berhasil → stok baru: ${found.stock} gram`);
  });
});

// ==================== VERIFIKASI TIDAK ADA LOCALSTORAGE ====================
describe('Verifikasi: Tidak ada data sensitif di localStorage (Server-side check)', () => {
  it('/api/sync tidak mengirimkan instruksi untuk menyimpan ke localStorage', async () => {
    const res = await apiFetch('/sync');
    expect(res.ok).toBe(true);
    const data = await res.json();
    // API response hanya berisi data struktur, bukan instruksi localStorage
    expect(data).not.toHaveProperty('localStorage');
    expect(data).not.toHaveProperty('localStorageKey');
    // Data sesi dikembalikan langsung dari cookie/session, bukan dari localStorage
    expect(data).toHaveProperty('currentUser');
    expect(data).toHaveProperty('activeShift');
    console.log('  ✅ API /sync tidak mengandung instruksi localStorage');
    console.log(`  ✅ currentUser dari session: ${data.currentUser?.name ?? 'null'}`);
  });
});
