const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'cafe.db');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to SQLite Database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', DB_PATH);
    initializeDatabase();
  }
});

// Helper to run database queries as promises
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Database Initialization & Seeding
async function initializeDatabase() {
  try {
    // 1. Create Users Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        name TEXT NOT NULL
      )
    `);

    // 2. Create Menu Items Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        price REAL NOT NULL,
        category TEXT NOT NULL,
        available INTEGER DEFAULT 1
      )
    `);

    // 3. Create Orders Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_date TEXT NOT NULL,
        total_amount REAL NOT NULL,
        discount REAL DEFAULT 0,
        tax REAL DEFAULT 0,
        final_amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        created_by TEXT NOT NULL
      )
    `);

    // 4. Create Order Items Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        item_id INTEGER,
        item_name TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
      )
    `);

    console.log('SQL Database tables created successfully.');

    // Seed default users if empty
    const userCount = await dbGet('SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
      await dbRun("INSERT INTO users (username, password, role, name) VALUES ('admin', 'admin123', 'admin', 'Admin User')");
      console.log('Seeded default admin user: admin/admin123');
    }

    // Seed default menu items if empty
    const menuCount = await dbGet('SELECT COUNT(*) as count FROM menu_items');
    if (menuCount.count === 0) {
      const defaultItems = [
        { name: 'Espresso', price: 2.50, category: 'Coffee' },
        { name: 'Cappuccino', price: 3.50, category: 'Coffee' },
        { name: 'Caffè Latte', price: 4.00, category: 'Coffee' },
        { name: 'Americano', price: 3.00, category: 'Coffee' },
        { name: 'Iced Latte', price: 4.20, category: 'Coffee' },
        { name: 'Chai Latte', price: 4.50, category: 'Beverages' },
        { name: 'Matcha Green Tea', price: 4.80, category: 'Beverages' },
        { name: 'Iced Peach Tea', price: 3.50, category: 'Beverages' },
        { name: 'Hot Chocolate', price: 3.80, category: 'Beverages' },
        { name: 'Chocolate Muffin', price: 3.20, category: 'Bakery' },
        { name: 'Butter Croissant', price: 2.80, category: 'Bakery' },
        { name: 'Blueberry Scone', price: 3.00, category: 'Bakery' },
        { name: 'Red Velvet Cookie', price: 2.50, category: 'Bakery' }
      ];

      for (const item of defaultItems) {
        await dbRun('INSERT INTO menu_items (name, price, category) VALUES (?, ?, ?)', [item.name, item.price, item.category]);
      }
      console.log('Seeded default menu items.');
    }

  } catch (err) {
    console.error('Error initializing database schema/seeding:', err.message);
  }
}

// --- API ROUTES ---

// 1. Authentication
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Please enter both username and password' });
  }

  try {
    const user = await dbGet('SELECT username, role, name FROM users WHERE username = ? AND password = ?', [username, password]);
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server database error' });
  }
});

// 1.5 User Management (Admin only)
app.get('/api/users', async (req, res) => {
  try {
    const users = await dbAll('SELECT id, username, role, name FROM users ORDER BY name');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { username, password, role, name } = req.body;
  if (!username || !password || !role || !name) {
    return res.status(400).json({ error: 'Missing required parameters (username, password, role, name)' });
  }

  try {
    const result = await dbRun(
      'INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)',
      [username.toLowerCase().trim(), password, role, name.trim()]
    );
    res.status(201).json({ id: result.lastID, username, role, name });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'A user with this username already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id/password', async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'New password is required' });
  }

  try {
    await dbRun('UPDATE users SET password = ? WHERE id = ?', [password, id]);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await dbRun('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get Menu Items
app.get('/api/menu', async (req, res) => {
  try {
    const items = await dbAll('SELECT * FROM menu_items ORDER BY category, name');
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Add Menu Item (Admin only)
app.post('/api/menu', async (req, res) => {
  const { name, price, category } = req.body;
  if (!name || price === undefined || !category) {
    return res.status(400).json({ error: 'Missing required parameters (name, price, category)' });
  }

  try {
    const result = await dbRun('INSERT INTO menu_items (name, price, category) VALUES (?, ?, ?)', [name, Number(price), category]);
    res.status(201).json({ id: result.lastID, name, price, category, available: 1 });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'An item with this name already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// 4. Update Menu Item (Admin only - updates price, availability, category, name)
app.put('/api/menu/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price, category, available } = req.body;

  if (!name || price === undefined || !category) {
    return res.status(400).json({ error: 'Missing required fields for update' });
  }

  try {
    const isAvailable = available !== undefined ? (available ? 1 : 0) : 1;
    await dbRun(
      'UPDATE menu_items SET name = ?, price = ?, category = ?, available = ? WHERE id = ?',
      [name, Number(price), category, isAvailable, id]
    );
    res.json({ success: true, id, name, price, category, available: isAvailable });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'An item with this name already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// 5. Delete Menu Item (Admin only)
app.delete('/api/menu/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await dbRun('DELETE FROM menu_items WHERE id = ?', [id]);
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Create Order / Checkout (Transacted)
app.post('/api/orders', (req, res) => {
  const { items, discount, tax, total_amount, final_amount, payment_method, created_by } = req.body;

  if (!items || !items.length || final_amount === undefined || !payment_method || !created_by) {
    return res.status(400).json({ error: 'Invalid order structure or empty details' });
  }

  // Run in database transaction to ensure order and order items are inserted together safely
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    const orderDate = new Date().toISOString(); // UTC ISO standard format (we'll format it locally on client)

    db.run(
      `INSERT INTO orders (order_date, total_amount, discount, tax, final_amount, payment_method, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orderDate, total_amount, discount || 0, tax || 0, final_amount, payment_method, created_by],
      function (err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Failed to insert order: ' + err.message });
        }

        const orderId = this.lastID;
        const itemStmt = db.prepare(
          `INSERT INTO order_items (order_id, item_id, item_name, price, quantity, subtotal)
           VALUES (?, ?, ?, ?, ?, ?)`
        );

        let insertError = null;
        for (const item of items) {
          itemStmt.run(
            [orderId, item.id, item.name, item.price, item.quantity, item.price * item.quantity],
            (err) => {
              if (err) insertError = err;
            }
          );
        }

        itemStmt.finalize((err) => {
          if (err || insertError) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Failed to insert order items: ' + (err || insertError).message });
          }

          db.run('COMMIT', (commitErr) => {
            if (commitErr) {
              return res.status(500).json({ error: 'Failed to commit transaction: ' + commitErr.message });
            }
            res.status(201).json({ success: true, orderId, orderDate });
          });
        });
      }
    );
  });
});

// 7. Daily Reports (Admin only)
// Returns list of dates and aggregated sales summary for those dates
app.get('/api/reports/daily', async (req, res) => {
  try {
    // In SQLite, we can extract date string using strftime or substr
    // order_date is stored as ISO 8601 (e.g. 2026-06-19T10:07:09Z)
    // We group by substr(order_date, 1, 10) which returns YYYY-MM-DD
    const summary = await dbAll(`
      SELECT 
        substr(order_date, 1, 10) as date,
        COUNT(*) as total_orders,
        SUM(total_amount) as total_gross,
        SUM(discount) as total_discount,
        SUM(tax) as total_tax,
        SUM(final_amount) as total_net
      FROM orders
      GROUP BY date
      ORDER BY date DESC
    `);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Detailed Report (Admin only)
// Returns all orders and their items for a specific date (YYYY-MM-DD format)
app.get('/api/reports/detail', async (req, res) => {
  const { date } = req.query; // Expects YYYY-MM-DD
  if (!date) {
    return res.status(400).json({ error: 'Date query parameter is required (YYYY-MM-DD)' });
  }

  try {
    const orders = await dbAll(
      `SELECT * FROM orders WHERE substr(order_date, 1, 10) = ? ORDER BY order_date DESC`,
      [date]
    );

    // Fetch items for these orders
    for (let order of orders) {
      order.items = await dbAll(
        `SELECT item_name as name, price, quantity, subtotal FROM order_items WHERE order_id = ?`,
        [order.id]
      );
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Catch-all route to serve SPA frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Cafe Billing Server listening on http://localhost:${PORT}`);
});
