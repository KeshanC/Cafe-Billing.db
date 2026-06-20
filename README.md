Cafe Billing System
A lightweight, high-fidelity single-page Cafe POS and billing application built with a client-server architecture. The project separates permissions into **Admin** and **Staff** roles, allowing staff to quickly process transactions while providing the Admin with tools for user management, catalog inventory adjustments, and daily sales reports. All data is stored in a local SQLite database.
---
## 🚀 Technologies Used
- **Frontend**: 
  - **HTML5 & Vanilla CSS3**: Designed with modern obsidian dark aesthetics, glassmorphism, responsive grid layouts, and custom print overrides for printing thermal paper receipts.
  - **Vanilla JavaScript (ES6+)**: Handles cart states, price computations, client-side routing, and print execution.
  - **Lucide Icons**: Renders modern, clean vector interface icons.
- **Backend**:
  - **Node.js & Express**: Simple REST API server routing client requests and serving static assets.
- **Database**:
  - **SQLite**: Pure server-embedded SQL database (`cafe.db`) handling relational schemas, transaction security, and daily aggregates.
---
## 🛠️ Installation & Setup Steps
Follow these steps to run the project locally on your system:
### 1. Prerequisites
Ensure you have **Node.js** installed on your system. You can verify by running:
```bash
node -v
2. Navigate to Project Directory
Open your terminal (PowerShell or Command Prompt) and change directory to the folder:

bash


cd "/path/to/cafe-billing-system"
3. Install Dependencies
Initialize and install the required npm packages (Express, CORS, and SQLite):

bash


npm install
4. Start the Server
Run the startup script:

bash


npm start
This will initialize the SQLite database (cafe.db) and start the server on port 3000. You should see:

text


Cafe Billing Server listening on http://localhost:3000
Connected to SQLite database at: .../cafe.db
SQL Database tables created successfully.
Seeded default admin user: admin/admin123
Seeded default menu items.
5. Access the Web Application
Open your web browser and navigate to: http://localhost:3000

🔑 Initial Accounts & Credentials
By default, the database is seeded with a single administrative account. Staff accounts must be created by the Admin after logging in.

Username	Password	Role	Features
admin	admin123	Admin	Full access (POS Billing, Inventory Items, Sales Reports, Manage Users)
Create via Admin	Custom	Staff	Restricted access (POS Billing only)
📁 SQL Database Schema
The SQLite database structure contains four main tables:

users: Manages account usernames, passwords, roles, and profiles.
menu_items: Manages the cafe's menu catalog, prices, and availability.
orders: Records invoice totals, discount, tax, payment method, and cashier names.
order_items: Records individual line items (quantity and subtotal) linked to orders.
