-- DataFlow AI Sample E-Commerce Database Schema
-- Reference: docs/architecture-repository/07_DatabaseDesign.md

CREATE TABLE IF NOT EXISTS customers (
    customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    city TEXT,
    country TEXT DEFAULT 'India',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
    order_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    order_date TEXT DEFAULT (datetime('now')),
    total_amount REAL NOT NULL,
    status TEXT CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE IF NOT EXISTS order_items (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE IF NOT EXISTS inventory (
    inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    warehouse_location TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    last_updated TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- Performance Indexes (07_DatabaseDesign.md §6)
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);

-- Seed Data for Testing
INSERT INTO customers (name, email, phone, city, country) VALUES
('Aarav Sharma', 'aarav.sharma@example.com', '+91 9876543210', 'Mumbai', 'India'),
('Priya Patel', 'priya.patel@example.com', '+91 9876543211', 'Bengaluru', 'India'),
('Rahul Verma', 'rahul.verma@example.com', '+91 9876543212', 'Delhi', 'India'),
('Ananya Gupta', 'ananya.gupta@example.com', '+91 9876543213', 'Chennai', 'India'),
('Vikram Singh', 'vikram.singh@example.com', '+91 9876543214', 'Hyderabad', 'India');

INSERT INTO products (name, category, price, stock_quantity, description) VALUES
('Pro Wireless Headphones', 'Electronics', 149.99, 45, 'Noise-canceling over-ear bluetooth headphones'),
('UltraSmart Watch Gen 2', 'Electronics', 199.99, 30, 'Fitness tracking smartwatch with AMOLED display'),
('Ergonomic Mesh Chair', 'Furniture', 249.50, 15, 'Adjustable lumbar support office chair'),
('Organic Arabica Coffee Beans', 'Groceries', 18.99, 120, '1kg medium roast whole bean coffee'),
('Mechanical Gaming Keyboard', 'Electronics', 89.99, 60, 'RGB backlit tactile mechanical keyboard'),
('Stainless Steel Water Bottle', 'Accessories', 24.99, 200, '1L insulated thermal flask');

INSERT INTO orders (customer_id, order_date, total_amount, status) VALUES
(1, '2026-07-15 10:30:00', 349.98, 'delivered'),
(2, '2026-07-18 14:15:00', 199.99, 'delivered'),
(3, '2026-07-22 09:45:00', 108.98, 'shipped'),
(1, '2026-08-01 16:20:00', 249.50, 'processing'),
(4, '2026-08-03 11:10:00', 43.98, 'pending'),
(5, '2026-08-04 18:00:00', 149.99, 'delivered');

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
(1, 1, 1, 149.99),
(1, 2, 1, 199.99),
(2, 2, 1, 199.99),
(3, 4, 1, 18.99),
(3, 5, 1, 89.99),
(4, 3, 1, 249.50),
(5, 4, 1, 18.99),
(5, 6, 1, 24.99),
(6, 1, 1, 149.99);

INSERT INTO inventory (product_id, warehouse_location, quantity) VALUES
(1, 'Warehouse A - Bengaluru', 25),
(1, 'Warehouse B - Mumbai', 20),
(2, 'Warehouse A - Bengaluru', 30),
(3, 'Warehouse C - Delhi', 15),
(4, 'Warehouse A - Bengaluru', 120),
(5, 'Warehouse B - Mumbai', 60),
(6, 'Warehouse C - Delhi', 200);
