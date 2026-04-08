-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "pin_hash" TEXT,
    "role" TEXT NOT NULL,
    "can_view_cost_price" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME
);

-- CreateTable
CREATE TABLE "customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "credit_limit_cents" INTEGER NOT NULL DEFAULT 0,
    "current_debt_cents" INTEGER NOT NULL DEFAULT 0,
    "payment_due_day" INTEGER,
    "credit_blocked" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME
);

-- CreateTable
CREATE TABLE "product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "barcode" TEXT,
    "brand_id" TEXT,
    "description" TEXT,
    "weight_value" REAL,
    "weight_unit" TEXT,
    "product_type_id" TEXT,
    "profit_margin" INTEGER,
    "price_cents" INTEGER NOT NULL,
    "cost_price_cents" INTEGER NOT NULL,
    "average_cost_cents" INTEGER NOT NULL DEFAULT 0,
    "stock_quantity" REAL NOT NULL DEFAULT 0,
    "min_stock_alert" INTEGER NOT NULL DEFAULT 5,
    "is_bulk" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "product_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_product_type_id_fkey" FOREIGN KEY ("product_type_id") REFERENCES "product_types" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit_cost_cents" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "operator_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stock_movements_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME
);

-- CreateTable
CREATE TABLE "product_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "profit_margin" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME
);

-- CreateTable
CREATE TABLE "sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uuid" TEXT NOT NULL,
    "operator_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "terminal_id" TEXT NOT NULL,
    "payment_method" TEXT NOT NULL,
    "subtotal_cents" INTEGER NOT NULL,
    "discount_cents" INTEGER NOT NULL DEFAULT 0,
    "total_cents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "sale_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sale_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sale_payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sale_id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "installments" INTEGER,
    "applied_rate" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" DATETIME,
    CONSTRAINT "sale_payment_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sale_item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sale_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL DEFAULT 'Produto sem nome',
    "quantity" REAL NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,
    "discount_cents" INTEGER NOT NULL DEFAULT 0,
    "total_cents" INTEGER NOT NULL,
    CONSTRAINT "sale_item_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sale_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cash_register" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operator_id" TEXT NOT NULL,
    "terminal_id" TEXT NOT NULL,
    "opening_balance_cents" INTEGER NOT NULL,
    "closing_balance_cents" INTEGER,
    "expected_balance_cents" INTEGER,
    "difference_cents" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'open',
    "opened_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" DATETIME,
    CONSTRAINT "cash_register_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "sale_id" TEXT,
    "customer_id" TEXT,
    "cash_register_id" TEXT NOT NULL,
    "operator_id" TEXT NOT NULL,
    "debt_before_cents" INTEGER,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transaction_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transaction_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transaction_cash_register_id_fkey" FOREIGN KEY ("cash_register_id") REFERENCES "cash_register" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transaction_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "details" TEXT,
    "ip_address" TEXT,
    "terminal_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "card_machines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "absorb_fee" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME
);

-- CreateTable
CREATE TABLE "card_machine_rates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "card_machine_id" TEXT NOT NULL,
    "debit_rate" INTEGER NOT NULL DEFAULT 0,
    "credit_base_rate" INTEGER NOT NULL DEFAULT 0,
    "credit_incremental_rate" INTEGER NOT NULL DEFAULT 0,
    "max_installments" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "card_machine_rates_card_machine_id_fkey" FOREIGN KEY ("card_machine_id") REFERENCES "card_machines" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "backup_path" TEXT,
    "backup_frequency" TEXT,
    "backup_retention" INTEGER,
    "backup_cloud_enabled" BOOLEAN NOT NULL DEFAULT false,
    "backup_cloud_token" TEXT,
    "backup_encryption_enabled" BOOLEAN NOT NULL DEFAULT false,
    "backup_password" TEXT,
    "backup_time" TEXT,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "meta" TEXT,
    "target_roles" TEXT NOT NULL,
    "read_at" DATETIME,
    "acknowledged_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "backup_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "size_bytes" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "error_message" TEXT
);

-- CreateTable
CREATE TABLE "pix_transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tx_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" DATETIME NOT NULL,
    "paid_at" DATETIME,
    "paid_amount_cents" INTEGER,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE INDEX "user_username_idx" ON "user"("username");

-- CreateIndex
CREATE INDEX "user_role_idx" ON "user"("role");

-- CreateIndex
CREATE INDEX "customer_name_idx" ON "customer"("name");

-- CreateIndex
CREATE INDEX "customer_deleted_at_is_active_idx" ON "customer"("deleted_at", "is_active");

-- CreateIndex
CREATE INDEX "customer_deleted_at_name_idx" ON "customer"("deleted_at", "name");

-- CreateIndex
CREATE INDEX "customer_deleted_at_payment_due_day_idx" ON "customer"("deleted_at", "payment_due_day");

-- CreateIndex
CREATE UNIQUE INDEX "product_barcode_key" ON "product"("barcode");

-- CreateIndex
CREATE INDEX "product_barcode_idx" ON "product"("barcode");

-- CreateIndex
CREATE INDEX "product_name_idx" ON "product"("name");

-- CreateIndex
CREATE INDEX "product_brand_id_idx" ON "product"("brand_id");

-- CreateIndex
CREATE INDEX "product_product_type_id_idx" ON "product"("product_type_id");

-- CreateIndex
CREATE INDEX "stock_movements_operator_id_idx" ON "stock_movements"("operator_id");

-- CreateIndex
CREATE INDEX "stock_movements_product_id_created_at_idx" ON "stock_movements"("product_id", "created_at");

-- CreateIndex
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "product_types_name_key" ON "product_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sale_uuid_key" ON "sale"("uuid");

-- CreateIndex
CREATE INDEX "sale_uuid_idx" ON "sale"("uuid");

-- CreateIndex
CREATE INDEX "sale_operator_id_idx" ON "sale"("operator_id");

-- CreateIndex
CREATE INDEX "sale_customer_id_idx" ON "sale"("customer_id");

-- CreateIndex
CREATE INDEX "sale_terminal_id_idx" ON "sale"("terminal_id");

-- CreateIndex
CREATE INDEX "sale_created_at_idx" ON "sale"("created_at");

-- CreateIndex
CREATE INDEX "sale_payment_deleted_at_idx" ON "sale_payment"("deleted_at");

-- CreateIndex
CREATE INDEX "sale_payment_sale_id_idx" ON "sale_payment"("sale_id");

-- CreateIndex
CREATE INDEX "sale_payment_method_idx" ON "sale_payment"("method");

-- CreateIndex
CREATE INDEX "sale_item_sale_id_idx" ON "sale_item"("sale_id");

-- CreateIndex
CREATE INDEX "sale_item_product_id_idx" ON "sale_item"("product_id");

-- CreateIndex
CREATE INDEX "cash_register_terminal_id_idx" ON "cash_register"("terminal_id");

-- CreateIndex
CREATE INDEX "cash_register_operator_id_idx" ON "cash_register"("operator_id");

-- CreateIndex
CREATE INDEX "cash_register_status_idx" ON "cash_register"("status");

-- CreateIndex
CREATE INDEX "transaction_type_idx" ON "transaction"("type");

-- CreateIndex
CREATE INDEX "transaction_sale_id_idx" ON "transaction"("sale_id");

-- CreateIndex
CREATE INDEX "transaction_customer_id_idx" ON "transaction"("customer_id");

-- CreateIndex
CREATE INDEX "transaction_cash_register_id_idx" ON "transaction"("cash_register_id");

-- CreateIndex
CREATE INDEX "transaction_operator_id_idx" ON "transaction"("operator_id");

-- CreateIndex
CREATE INDEX "transaction_created_at_idx" ON "transaction"("created_at");

-- CreateIndex
CREATE INDEX "audit_log_actor_id_idx" ON "audit_log"("actor_id");

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- CreateIndex
CREATE INDEX "audit_log_entity_type_entity_id_idx" ON "audit_log"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE INDEX "settings_deleted_at_idx" ON "settings"("deleted_at");

-- CreateIndex
CREATE INDEX "notifications_severity_created_at_idx" ON "notifications"("severity", "created_at");

-- CreateIndex
CREATE INDEX "notifications_read_at_created_at_idx" ON "notifications"("read_at", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "pix_transaction_tx_id_key" ON "pix_transaction"("tx_id");

-- CreateIndex
CREATE INDEX "pix_transaction_status_idx" ON "pix_transaction"("status");

-- CreateIndex
CREATE INDEX "pix_transaction_created_at_idx" ON "pix_transaction"("created_at");
