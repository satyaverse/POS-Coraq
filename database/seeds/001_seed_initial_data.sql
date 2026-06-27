SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO roles (id, code, name, description) VALUES
('ADMIN', 'ADMIN', 'Admin', 'Owner atau pengguna dengan akses penuh.'),
('MANAGER', 'MANAGER', 'Manager', 'Manager operasional toko.'),
('CASHIER', 'CASHIER', 'Cashier', 'Kasir POS.'),
('BARISTA', 'BARISTA', 'Barista', 'Station minuman.'),
('KITCHEN', 'KITCHEN', 'Kitchen', 'Station makanan.')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO permissions (id, code, name, description) VALUES
('VIEW_DASHBOARD', 'VIEW_DASHBOARD', 'View Dashboard', 'Melihat dashboard admin/manager.'),
('MANAGE_STAFF', 'MANAGE_STAFF', 'Manage Staff', 'Mengelola staff dan credential.'),
('MANAGE_PRODUCTS', 'MANAGE_PRODUCTS', 'Manage Products', 'Mengelola produk, kategori, dan modifier.'),
('MANAGE_INVENTORY', 'MANAGE_INVENTORY', 'Manage Inventory', 'Mengelola inventory, purchase, dan stock opname.'),
('MANAGE_FINANCE', 'MANAGE_FINANCE', 'Manage Finance', 'Mengelola finance dan expense.'),
('MANAGE_MARKETING', 'MANAGE_MARKETING', 'Manage Marketing', 'Mengelola promo dan marketing.'),
('VIEW_PAYROLL', 'VIEW_PAYROLL', 'View Payroll', 'Melihat payroll.'),
('RESET_SYSTEM', 'RESET_SYSTEM', 'Reset System', 'Reset data sistem.'),
('USE_POS', 'USE_POS', 'Use POS', 'Menggunakan POS kasir.'),
('USE_KDS', 'USE_KDS', 'Use KDS', 'Menggunakan kitchen display system.'),
('USE_MEMBER_PORTAL', 'USE_MEMBER_PORTAL', 'Use Member Portal', 'Menggunakan portal member.')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
('ADMIN','VIEW_DASHBOARD'),('ADMIN','MANAGE_STAFF'),('ADMIN','MANAGE_PRODUCTS'),('ADMIN','MANAGE_INVENTORY'),('ADMIN','MANAGE_FINANCE'),('ADMIN','MANAGE_MARKETING'),('ADMIN','VIEW_PAYROLL'),('ADMIN','RESET_SYSTEM'),('ADMIN','USE_POS'),('ADMIN','USE_KDS'),
('MANAGER','VIEW_DASHBOARD'),('MANAGER','MANAGE_PRODUCTS'),('MANAGER','MANAGE_INVENTORY'),('MANAGER','MANAGE_FINANCE'),('MANAGER','MANAGE_MARKETING'),('MANAGER','VIEW_PAYROLL'),
('CASHIER','USE_POS'),
('BARISTA','USE_KDS'),
('KITCHEN','USE_KDS');

INSERT INTO users (id, role_id, name, phone, avatar_url, daily_rate_amount, active) VALUES
('1', 'ADMIN', 'Owner Budi', '08111111111', 'https://i.pravatar.cc/150?u=budi', 200000, 1),
('2', 'MANAGER', 'Manajer Siti', '08222222222', 'https://i.pravatar.cc/150?u=siti', 150000, 1),
('3', 'CASHIER', 'Kasir Andi', '08333333333', 'https://i.pravatar.cc/150?u=andi', 100000, 1),
('4', 'BARISTA', 'Barista John', '08444444444', 'https://i.pravatar.cc/150?u=john', 120000, 1),
('5', 'KITCHEN', 'Chef Renatta', '08555555555', 'https://i.pravatar.cc/150?u=renatta', 130000, 1)
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id), name = VALUES(name), phone = VALUES(phone), avatar_url = VALUES(avatar_url), daily_rate_amount = VALUES(daily_rate_amount), active = VALUES(active);

INSERT INTO user_auth_credentials (user_id, pin_hash, pin_hash_algorithm) VALUES
('1', SHA2('111111', 256), 'SHA2_256_DEMO'),
('2', SHA2('222222', 256), 'SHA2_256_DEMO'),
('3', SHA2('333333', 256), 'SHA2_256_DEMO'),
('4', SHA2('444444', 256), 'SHA2_256_DEMO'),
('5', SHA2('555555', 256), 'SHA2_256_DEMO')
ON DUPLICATE KEY UPDATE pin_hash = VALUES(pin_hash), pin_hash_algorithm = VALUES(pin_hash_algorithm), pin_updated_at = CURRENT_TIMESTAMP;

INSERT INTO categories (id, code, name, active) VALUES
('COFFEE', 'COFFEE', 'Coffee', 1),
('NON_COFFEE', 'NON_COFFEE', 'Non Coffee', 1),
('FOOD', 'FOOD', 'Food', 1),
('DESSERT', 'DESSERT', 'Dessert', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), active = VALUES(active);

INSERT INTO ingredients (id, name, usage_unit, stock_qty, cost_per_usage_unit_amount, buy_unit, conversion_rate, active) VALUES
('i1', 'Biji Espresso', 'g', 5000, 200, 'Kg', 1000, 1),
('i2', 'Susu Segar', 'ml', 10000, 15, 'Liter', 1000, 1),
('i3', 'Gula Aren', 'ml', 2000, 30, 'Liter', 1000, 1),
('i4', 'Gelas Plastik', 'pcs', 500, 500, 'Dus (50)', 50, 1),
('i5', 'Susu Oat', 'ml', 2000, 25, 'Liter', 1000, 1),
('i6', 'Bubuk Coklat', 'g', 1000, 100, 'Pack (1kg)', 1000, 1),
('i7', 'Adonan Croissant', 'pcs', 50, 5000, 'Box (10)', 10, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), usage_unit = VALUES(usage_unit), stock_qty = VALUES(stock_qty), cost_per_usage_unit_amount = VALUES(cost_per_usage_unit_amount), buy_unit = VALUES(buy_unit), conversion_rate = VALUES(conversion_rate), active = VALUES(active);

INSERT INTO products (id, category_id, name, price_amount, image_url, staff_commission_amount, standard_prep_time_minutes, active) VALUES
('p1', 'COFFEE', 'Kopi Susu Gula Aren', 25000, 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1000&auto=format&fit=crop', 500, 3, 1),
('p2', 'COFFEE', 'Americano', 20000, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=1000&auto=format&fit=crop', 200, 2, 1),
('p3', 'NON_COFFEE', 'Es Coklat Klasik', 28000, 'https://images.unsplash.com/photo-1542990253-0d0f557147f3?q=80&w=1000&auto=format&fit=crop', 0, 4, 1),
('p4', 'FOOD', 'Butter Croissant', 18000, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=1000&auto=format&fit=crop', 1000, 5, 1)
ON DUPLICATE KEY UPDATE category_id = VALUES(category_id), name = VALUES(name), price_amount = VALUES(price_amount), image_url = VALUES(image_url), staff_commission_amount = VALUES(staff_commission_amount), standard_prep_time_minutes = VALUES(standard_prep_time_minutes), active = VALUES(active);

INSERT INTO product_recipes (product_id, ingredient_id, amount) VALUES
('p1', 'i1', 18), ('p1', 'i2', 150), ('p1', 'i3', 20), ('p1', 'i4', 1),
('p2', 'i1', 18), ('p2', 'i4', 1),
('p3', 'i6', 30), ('p3', 'i2', 180), ('p3', 'i4', 1),
('p4', 'i7', 1)
ON DUPLICATE KEY UPDATE amount = VALUES(amount);

INSERT INTO modifiers (id, name, price_amount, type, active) VALUES
('m1', 'Less Sugar', 0, 'SUGAR', 1),
('m2', 'Normal Sugar', 0, 'SUGAR', 1),
('m3', 'No Sugar', 0, 'SUGAR', 1),
('m4', 'Less Ice', 2000, 'ICE', 1),
('m5', 'Normal Ice', 2000, 'ICE', 1),
('m6', 'Hot', 0, 'ICE', 1),
('m7', 'Extra Shot', 5000, 'ADDON', 1),
('m8', 'Ganti Oat Milk', 8000, 'ADDON', 1),
('m9', 'Extra Cheese', 4000, 'ADDON', 1),
('m10', 'Extra Butter', 3000, 'ADDON', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), price_amount = VALUES(price_amount), type = VALUES(type), active = VALUES(active);

INSERT IGNORE INTO modifier_target_categories (modifier_id, category_id) VALUES
('m1','COFFEE'),('m1','NON_COFFEE'),('m2','COFFEE'),('m2','NON_COFFEE'),('m3','COFFEE'),('m3','NON_COFFEE'),
('m4','COFFEE'),('m4','NON_COFFEE'),('m5','COFFEE'),('m5','NON_COFFEE'),('m6','COFFEE'),('m6','NON_COFFEE'),
('m7','COFFEE'),('m8','COFFEE'),('m8','NON_COFFEE'),('m9','FOOD'),('m10','FOOD');

INSERT INTO modifier_recipe_adjustments (modifier_id, ingredient_id, amount) VALUES
('m7', 'i1', 18),
('m8', 'i5', 150)
ON DUPLICATE KEY UPDATE amount = VALUES(amount);

INSERT INTO members (id, full_name, nickname, display_name, phone, birth_date, gender, tier, status, total_spending_amount, points_balance, join_date) VALUES
('m001', 'Budi Santoso', 'Budi', 'Budi', '081234567890', '1990-05-30', 'MALE', 'SILVER', 'ACTIVE', 2950000, 295, '2023-01-01'),
('m002', 'Siti Aminah', 'Siti', 'Siti', '081298765432', '1995-05-30', 'FEMALE', 'PLATINUM', 'ACTIVE', 12500000, 1250, '2023-02-15'),
('m003', 'Joko Anwar', 'Joko', 'Joko', '08111222333', '1988-12-10', 'MALE', 'BRONZE', 'ACTIVE', 500000, 50, '2023-05-10')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), nickname = VALUES(nickname), display_name = VALUES(display_name), phone = VALUES(phone), birth_date = VALUES(birth_date), gender = VALUES(gender), tier = VALUES(tier), status = VALUES(status), total_spending_amount = VALUES(total_spending_amount), points_balance = VALUES(points_balance), join_date = VALUES(join_date);

INSERT INTO member_auth_credentials (member_id, pin_hash, pin_hash_algorithm) VALUES
('m001', SHA2('123456', 256), 'SHA2_256_DEMO'),
('m002', SHA2('123456', 256), 'SHA2_256_DEMO'),
('m003', SHA2('123456', 256), 'SHA2_256_DEMO')
ON DUPLICATE KEY UPDATE pin_hash = VALUES(pin_hash), pin_hash_algorithm = VALUES(pin_hash_algorithm), pin_updated_at = CURRENT_TIMESTAMP;

INSERT INTO promotions (id, name, type, value_amount, min_spend_amount, active, happy_hour_start, happy_hour_end, description) VALUES
('promo1', 'Happy Hour (14-16)', 'PERCENTAGE', 20, NULL, 1, '14:00:00', '16:00:00', 'Diskon 20% setiap jam 2 siang sampai 4 sore.'),
('promo2', 'Belanja > 100rb Potong 10k', 'FIXED', 10000, 100000, 1, NULL, NULL, 'Potongan langsung Rp 10.000 untuk transaksi di atas 100rb.')
ON DUPLICATE KEY UPDATE name = VALUES(name), type = VALUES(type), value_amount = VALUES(value_amount), min_spend_amount = VALUES(min_spend_amount), active = VALUES(active), happy_hour_start = VALUES(happy_hour_start), happy_hour_end = VALUES(happy_hour_end), description = VALUES(description);

INSERT INTO store_config (id, point_earn_rate_amount, point_value_amount, global_commission_rate) VALUES
(1, 10000, 100, 0.010000)
ON DUPLICATE KEY UPDATE point_earn_rate_amount = VALUES(point_earn_rate_amount), point_value_amount = VALUES(point_value_amount), global_commission_rate = VALUES(global_commission_rate);
