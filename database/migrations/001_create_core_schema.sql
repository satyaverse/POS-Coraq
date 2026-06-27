SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(32) NOT NULL,
  code VARCHAR(32) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permissions (
  id VARCHAR(64) NOT NULL,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_permissions_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id VARCHAR(32) NOT NULL,
  permission_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) NOT NULL,
  role_id VARCHAR(32) NOT NULL,
  name VARCHAR(160) NOT NULL,
  phone VARCHAR(32) NULL,
  avatar_url TEXT NULL,
  face_descriptor_json JSON NULL,
  daily_rate_amount BIGINT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_phone (phone),
  KEY idx_users_role (role_id),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_auth_credentials (
  user_id VARCHAR(64) NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  pin_hash_algorithm VARCHAR(32) NOT NULL DEFAULT 'SHA2_256_DEMO',
  pin_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_user_auth_credentials_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  refresh_token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_sessions_user (user_id),
  KEY idx_user_sessions_expires (expires_at),
  CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS members (
  id VARCHAR(64) NOT NULL,
  full_name VARCHAR(180) NOT NULL,
  nickname VARCHAR(120) NOT NULL,
  display_name VARCHAR(120) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  photo_url TEXT NULL,
  birth_date DATE NULL,
  gender VARCHAR(16) NULL,
  tier VARCHAR(32) NOT NULL DEFAULT 'BRONZE',
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  total_spending_amount BIGINT NOT NULL DEFAULT 0,
  points_balance INT NOT NULL DEFAULT 0,
  join_date DATE NOT NULL,
  last_visit_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_members_phone (phone),
  KEY idx_members_status (status),
  KEY idx_members_tier (tier),
  CONSTRAINT chk_members_tier CHECK (tier IN ('BRONZE','SILVER','GOLD','PLATINUM')),
  CONSTRAINT chk_members_status CHECK (status IN ('ACTIVE','PENDING','BLOCKED','PENDING_CARD')),
  CONSTRAINT chk_members_gender CHECK (gender IS NULL OR gender IN ('MALE','FEMALE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS member_auth_credentials (
  member_id VARCHAR(64) NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  pin_hash_algorithm VARCHAR(32) NOT NULL DEFAULT 'SHA2_256_DEMO',
  pin_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (member_id),
  CONSTRAINT fk_member_auth_credentials_member FOREIGN KEY (member_id) REFERENCES members(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(64) NOT NULL,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ingredients (
  id VARCHAR(64) NOT NULL,
  name VARCHAR(160) NOT NULL,
  usage_unit VARCHAR(32) NOT NULL,
  stock_qty DECIMAL(14,3) NOT NULL DEFAULT 0,
  cost_per_usage_unit_amount BIGINT NOT NULL DEFAULT 0,
  min_stock_level DECIMAL(14,3) NULL,
  buy_unit VARCHAR(80) NULL,
  conversion_rate DECIMAL(14,3) NULL,
  is_semi_finished TINYINT(1) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ingredients_stock (stock_qty),
  KEY idx_ingredients_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) NOT NULL,
  category_id VARCHAR(64) NOT NULL,
  name VARCHAR(180) NOT NULL,
  price_amount BIGINT NOT NULL,
  image_url TEXT NULL,
  staff_commission_amount BIGINT NOT NULL DEFAULT 0,
  standard_prep_time_minutes INT NULL,
  overhead_amount BIGINT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_products_category_active (category_id, active),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_recipes (
  product_id VARCHAR(64) NOT NULL,
  ingredient_id VARCHAR(64) NOT NULL,
  amount DECIMAL(14,3) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id, ingredient_id),
  CONSTRAINT fk_product_recipes_product FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_product_recipes_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS modifiers (
  id VARCHAR(64) NOT NULL,
  name VARCHAR(160) NOT NULL,
  price_amount BIGINT NOT NULL DEFAULT 0,
  type VARCHAR(32) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_modifiers_type (type),
  CONSTRAINT chk_modifiers_type CHECK (type IN ('SUGAR','ICE','ADDON'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS modifier_target_categories (
  modifier_id VARCHAR(64) NOT NULL,
  category_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (modifier_id, category_id),
  CONSTRAINT fk_modifier_target_categories_modifier FOREIGN KEY (modifier_id) REFERENCES modifiers(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_modifier_target_categories_category FOREIGN KEY (category_id) REFERENCES categories(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS modifier_recipe_adjustments (
  modifier_id VARCHAR(64) NOT NULL,
  ingredient_id VARCHAR(64) NOT NULL,
  amount DECIMAL(14,3) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (modifier_id, ingredient_id),
  CONSTRAINT fk_modifier_recipe_adjustments_modifier FOREIGN KEY (modifier_id) REFERENCES modifiers(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_modifier_recipe_adjustments_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ingredient_price_history (
  id VARCHAR(64) NOT NULL,
  ingredient_id VARCHAR(64) NOT NULL,
  price_amount BIGINT NOT NULL,
  recorded_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ingredient_price_history_ingredient (ingredient_id, recorded_at),
  CONSTRAINT fk_ingredient_price_history_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS promotions (
  id VARCHAR(64) NOT NULL,
  name VARCHAR(180) NOT NULL,
  type VARCHAR(32) NOT NULL,
  value_amount BIGINT NOT NULL,
  min_spend_amount BIGINT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  happy_hour_start TIME NULL,
  happy_hour_end TIME NULL,
  description TEXT NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_promotions_active (active),
  CONSTRAINT chk_promotions_type CHECK (type IN ('PERCENTAGE','FIXED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS store_config (
  id TINYINT UNSIGNED NOT NULL,
  point_earn_rate_amount BIGINT NOT NULL,
  point_value_amount BIGINT NOT NULL,
  global_commission_rate DECIMAL(8,6) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shifts (
  id VARCHAR(64) NOT NULL,
  cashier_user_id VARCHAR(64) NULL,
  cashier_name_snapshot VARCHAR(160) NOT NULL,
  start_cash_amount BIGINT NOT NULL DEFAULT 0,
  end_cash_amount BIGINT NULL,
  expected_cash_amount BIGINT NULL,
  variance_amount BIGINT NULL,
  total_cash_sales_amount BIGINT NULL,
  total_non_cash_sales_amount BIGINT NULL,
  total_debt_amount BIGINT NULL,
  total_expenses_amount BIGINT NULL,
  opened_at DATETIME NOT NULL,
  closed_at DATETIME NULL,
  is_open TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_shifts_cashier_opened (cashier_user_id, opened_at),
  KEY idx_shifts_is_open (is_open),
  CONSTRAINT fk_shifts_cashier FOREIGN KEY (cashier_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR(64) NOT NULL,
  category VARCHAR(32) NOT NULL,
  amount BIGINT NOT NULL,
  expense_date DATETIME NOT NULL,
  description TEXT NOT NULL,
  source VARCHAR(32) NOT NULL,
  is_voided TINYINT(1) NOT NULL DEFAULT 0,
  transfer_proof_url TEXT NULL,
  purchase_metadata_json JSON NULL,
  created_by_user_id VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_expenses_source_date (source, expense_date),
  KEY idx_expenses_category (category),
  KEY idx_expenses_created_by (created_by_user_id),
  CONSTRAINT fk_expenses_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_expenses_category CHECK (category IN ('SALARY','UTILITIES','RENT','MARKETING','MAINTENANCE','PURCHASE','OTHER')),
  CONSTRAINT chk_expenses_source CHECK (source IN ('CASH_DRAWER','TRANSFER','EXTERNAL'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) NOT NULL,
  pager_number VARCHAR(64) NOT NULL,
  member_id VARCHAR(64) NULL,
  customer_name VARCHAR(180) NULL,
  status VARCHAR(32) NOT NULL,
  payment_status VARCHAR(32) NOT NULL,
  payment_method VARCHAR(32) NOT NULL,
  total_amount BIGINT NOT NULL,
  final_amount BIGINT NOT NULL,
  discount_applied_amount BIGINT NOT NULL DEFAULT 0,
  points_earned INT NOT NULL DEFAULT 0,
  points_redeemed INT NOT NULL DEFAULT 0,
  promo_code VARCHAR(64) NULL,
  cashier_user_id VARCHAR(64) NULL,
  cashier_name_snapshot VARCHAR(160) NOT NULL,
  cash_received_amount BIGINT NULL,
  change_amount BIGINT NULL,
  payment_proof_url TEXT NULL,
  barista_status VARCHAR(32) NOT NULL DEFAULT 'IDLE',
  kitchen_status VARCHAR(32) NOT NULL DEFAULT 'IDLE',
  barista_start_at DATETIME NULL,
  kitchen_start_at DATETIME NULL,
  prep_start_at DATETIME NULL,
  ready_at DATETIME NULL,
  completed_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  handled_by_user_id VARCHAR(64) NULL,
  handled_by_name_snapshot VARCHAR(160) NULL,
  handled_by_role VARCHAR(32) NULL,
  paid_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_orders_created_at (created_at),
  KEY idx_orders_status_payment (status, payment_status),
  KEY idx_orders_member_created (member_id, created_at),
  KEY idx_orders_cashier_created (cashier_user_id, created_at),
  CONSTRAINT fk_orders_member FOREIGN KEY (member_id) REFERENCES members(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_orders_cashier FOREIGN KEY (cashier_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_orders_handled_by FOREIGN KEY (handled_by_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_orders_status CHECK (status IN ('PENDING','PREPARING','READY','COMPLETED','CANCELLED')),
  CONSTRAINT chk_orders_payment_status CHECK (payment_status IN ('PAID','UNPAID')),
  CONSTRAINT chk_orders_payment_method CHECK (payment_method IN ('CASH','QRIS','DEBIT','DEBT')),
  CONSTRAINT chk_orders_barista_status CHECK (barista_status IN ('IDLE','PENDING','PREPARING','READY','COMPLETED')),
  CONSTRAINT chk_orders_kitchen_status CHECK (kitchen_status IN ('IDLE','PENDING','PREPARING','READY','COMPLETED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(64) NOT NULL,
  order_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64) NULL,
  product_name_snapshot VARCHAR(180) NOT NULL,
  category_code_snapshot VARCHAR(64) NOT NULL,
  unit_price_amount BIGINT NOT NULL,
  quantity INT NOT NULL,
  note TEXT NULL,
  completed TINYINT(1) NOT NULL DEFAULT 0,
  completed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_product (product_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_item_modifiers (
  id VARCHAR(64) NOT NULL,
  order_item_id VARCHAR(64) NOT NULL,
  modifier_id VARCHAR(64) NULL,
  modifier_name_snapshot VARCHAR(160) NOT NULL,
  modifier_type_snapshot VARCHAR(32) NOT NULL,
  price_amount BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order_item_modifiers_item (order_item_id),
  CONSTRAINT fk_order_item_modifiers_item FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_order_item_modifiers_modifier FOREIGN KEY (modifier_id) REFERENCES modifiers(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) NOT NULL,
  order_id VARCHAR(64) NOT NULL,
  method VARCHAR(32) NOT NULL,
  amount BIGINT NOT NULL,
  cash_received_amount BIGINT NULL,
  change_amount BIGINT NULL,
  proof_url TEXT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PAID',
  paid_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_payments_order_paid (order_id, paid_at),
  KEY idx_payments_method_paid (method, paid_at),
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT chk_payments_method CHECK (method IN ('CASH','QRIS','DEBIT')),
  CONSTRAINT chk_payments_status CHECK (status IN ('PAID','VOIDED','FAILED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_promotions (
  order_id VARCHAR(64) NOT NULL,
  promotion_id VARCHAR(64) NOT NULL,
  promotion_name_snapshot VARCHAR(180) NOT NULL,
  discount_amount BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (order_id, promotion_id),
  CONSTRAINT fk_order_promotions_order FOREIGN KEY (order_id) REFERENCES orders(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_order_promotions_promotion FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_status_events (
  id VARCHAR(64) NOT NULL,
  order_id VARCHAR(64) NOT NULL,
  old_status VARCHAR(32) NULL,
  new_status VARCHAR(32) NOT NULL,
  changed_by_user_id VARCHAR(64) NULL,
  note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order_status_events_order (order_id, created_at),
  CONSTRAINT fk_order_status_events_order FOREIGN KEY (order_id) REFERENCES orders(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_order_status_events_user FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS station_status_events (
  id VARCHAR(64) NOT NULL,
  order_id VARCHAR(64) NOT NULL,
  station VARCHAR(32) NOT NULL,
  old_status VARCHAR(32) NULL,
  new_status VARCHAR(32) NOT NULL,
  changed_by_user_id VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_station_status_events_order (order_id, created_at),
  KEY idx_station_status_events_station (station, new_status),
  CONSTRAINT fk_station_status_events_order FOREIGN KEY (order_id) REFERENCES orders(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_station_status_events_user FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_station_status_events_station CHECK (station IN ('BARISTA','KITCHEN'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS member_point_ledger (
  id VARCHAR(64) NOT NULL,
  member_id VARCHAR(64) NOT NULL,
  order_id VARCHAR(64) NULL,
  type VARCHAR(32) NOT NULL,
  points INT NOT NULL,
  balance_after INT NOT NULL,
  note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_member_point_ledger_member (member_id, created_at),
  KEY idx_member_point_ledger_order (order_id),
  CONSTRAINT fk_member_point_ledger_member FOREIGN KEY (member_id) REFERENCES members(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_member_point_ledger_order FOREIGN KEY (order_id) REFERENCES orders(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_member_point_ledger_type CHECK (type IN ('EARN','REDEEM','ADJUST','VOID'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS member_tier_history (
  id VARCHAR(64) NOT NULL,
  member_id VARCHAR(64) NOT NULL,
  old_tier VARCHAR(32) NULL,
  new_tier VARCHAR(32) NOT NULL,
  total_spending_amount BIGINT NOT NULL,
  changed_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_member_tier_history_member (member_id, changed_at),
  CONSTRAINT fk_member_tier_history_member FOREIGN KEY (member_id) REFERENCES members(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) NOT NULL,
  action VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NULL,
  user_name_snapshot VARCHAR(160) NOT NULL,
  details TEXT NOT NULL,
  severity VARCHAR(16) NOT NULL,
  metadata_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_logs_severity_created (severity, created_at),
  KEY idx_audit_logs_user (user_id),
  CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_audit_logs_severity CHECK (severity IN ('LOW','MEDIUM','HIGH'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock_movements (
  id VARCHAR(64) NOT NULL,
  ingredient_id VARCHAR(64) NOT NULL,
  movement_type VARCHAR(32) NOT NULL,
  quantity_delta DECIMAL(14,3) NOT NULL,
  stock_after DECIMAL(14,3) NOT NULL,
  unit_cost_amount BIGINT NULL,
  order_id VARCHAR(64) NULL,
  expense_id VARCHAR(64) NULL,
  audit_log_id VARCHAR(64) NULL,
  note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_stock_movements_ingredient_created (ingredient_id, created_at),
  KEY idx_stock_movements_order (order_id),
  KEY idx_stock_movements_expense (expense_id),
  CONSTRAINT fk_stock_movements_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON UPDATE CASCADE,
  CONSTRAINT fk_stock_movements_order FOREIGN KEY (order_id) REFERENCES orders(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_stock_movements_expense FOREIGN KEY (expense_id) REFERENCES expenses(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_stock_movements_audit FOREIGN KEY (audit_log_id) REFERENCES audit_logs(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_stock_movements_type CHECK (movement_type IN ('SALE_DEDUCTION','VOID_ROLLBACK','PURCHASE','PURCHASE_VOID','STOCK_OPNAME','ADJUSTMENT','PRODUCTION_CONSUME','PRODUCTION_OUTPUT'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock_opnames (
  id VARCHAR(64) NOT NULL,
  ingredient_id VARCHAR(64) NOT NULL,
  previous_stock_qty DECIMAL(14,3) NOT NULL,
  actual_stock_qty DECIMAL(14,3) NOT NULL,
  difference_qty DECIMAL(14,3) NOT NULL,
  reason VARCHAR(64) NOT NULL,
  performed_by_user_id VARCHAR(64) NULL,
  audit_log_id VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_stock_opnames_ingredient_created (ingredient_id, created_at),
  CONSTRAINT fk_stock_opnames_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON UPDATE CASCADE,
  CONSTRAINT fk_stock_opnames_user FOREIGN KEY (performed_by_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_stock_opnames_audit FOREIGN KEY (audit_log_id) REFERENCES audit_logs(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance_logs (
  id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  user_name_snapshot VARCHAR(160) NOT NULL,
  role_code_snapshot VARCHAR(32) NOT NULL,
  type VARCHAR(32) NOT NULL,
  method VARCHAR(32) NOT NULL,
  timestamp DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_attendance_logs_user_timestamp (user_id, timestamp),
  CONSTRAINT fk_attendance_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT chk_attendance_logs_type CHECK (type IN ('CLOCK_IN','CLOCK_OUT')),
  CONSTRAINT chk_attendance_logs_method CHECK (method IN ('PIN','FACE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
