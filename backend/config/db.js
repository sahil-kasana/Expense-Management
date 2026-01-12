const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
};

let pool;

async function initializeDatabase() {
    try {
        // First connection without DB to create it if it doesn't exist
        const connection = await mysql.createConnection(dbConfig);
        console.log('[DB] Connected to MySQL server.');

        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'expense_tracker'}`);
        console.log(`[DB] Database "${process.env.DB_NAME || 'expense_tracker'}" checked/created.`);
        await connection.end();

        // Create pool with the database
        pool = mysql.createPool({
            ...dbConfig,
            database: process.env.DB_NAME || 'expense_tracker',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        const createExpensesTable = `
            CREATE TABLE IF NOT EXISTS expenses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                category VARCHAR(100) NOT NULL,
                type ENUM('expense', 'income') DEFAULT 'expense',
                date DATE NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;
        const createBudgetsTable = `
            CREATE TABLE IF NOT EXISTS budgets (
                category VARCHAR(100) PRIMARY KEY,
                limit_amount DECIMAL(10, 2) NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;
        const createCategoriesTable = `
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                icon VARCHAR(50) DEFAULT 'fa-tag',
                color VARCHAR(100) DEFAULT 'bg-gray-100 text-gray-600',
                type ENUM('expense', 'income') DEFAULT 'expense'
            )
        `;
        
        await pool.query(createExpensesTable);
        await pool.query(createBudgetsTable);
        await pool.query(createCategoriesTable);

        // Seed Categories if empty
        const [cats] = await pool.query('SELECT COUNT(*) as count FROM categories');
        if (cats[0].count === 0) {
            const seedQuery = `
                INSERT INTO categories (name, icon, color, type) VALUES 
                ('Food', 'fa-utensils', 'bg-orange-100 text-orange-600', 'expense'),
                ('Transport', 'fa-car', 'bg-blue-100 text-blue-600', 'expense'),
                ('Shopping', 'fa-bag-shopping', 'bg-purple-100 text-purple-600', 'expense'),
                ('Entertainment', 'fa-film', 'bg-pink-100 text-pink-600', 'expense'),
                ('Health', 'fa-heart-pulse', 'bg-red-100 text-red-600', 'expense'),
                ('Utilities', 'fa-bolt', 'bg-yellow-100 text-yellow-600', 'expense'),
                ('Salary', 'fa-wallet', 'bg-green-100 text-green-600', 'income'),
                ('Freelance', 'fa-laptop-code', 'bg-teal-100 text-teal-600', 'income'),
                ('Other', 'fa-layer-group', 'bg-gray-100 text-gray-600', 'expense')
            `;
            await pool.query(seedQuery);
        }

        // Add type column if it doesn't exist
        try {
            await pool.query('ALTER TABLE expenses ADD COLUMN type ENUM("expense", "income") DEFAULT "expense" AFTER category');
        } catch (e) {}

        console.log('[DB] Tables initialized and seeded.');

        return pool;
    } catch (err) {
        console.error('[DB ERROR] Initialization failed:', err.message);
        throw err;
    }
}

module.exports = {
    initializeDatabase,
    getPool: () => pool
};
