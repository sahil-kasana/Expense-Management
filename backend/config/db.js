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
        const isProduction = process.env.DB_HOST && process.env.DB_HOST !== 'localhost';
        const databaseName = process.env.DB_NAME || 'expense_tracker';

        if (!isProduction) {
            // Development: Try to create DB if it doesn't exist
            const connection = await mysql.createConnection(dbConfig);
            await connection.query(`CREATE DATABASE IF NOT EXISTS ${databaseName}`);
            await connection.end();
        }

        // Create pool directly with the database
        pool = mysql.createPool({
            ...dbConfig,
            database: databaseName,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            connectTimeout: 20000 // 20 seconds timeout
        });

        // Verify connection immediately
        console.log(`[DB] Attempting to connect to ${dbConfig.host}...`);
        try {
            const [rows] = await pool.query('SELECT 1 + 1 AS solution');
            console.log('[DB] Connection verified successfully!');
        } catch (connErr) {
            console.error('[DB CONNECTION FAILED] Details:', {
                message: connErr.message,
                code: connErr.code,
                errno: connErr.errno,
                host: dbConfig.host
            });
            throw connErr;
        }

        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const createExpensesTable = `
            CREATE TABLE IF NOT EXISTS expenses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                category VARCHAR(100) NOT NULL,
                type ENUM('expense', 'income') DEFAULT 'expense',
                date DATETIME NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX (user_id)
            )
        `;

        const createCategoriesTable = `
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                name VARCHAR(100) NOT NULL,
                icon VARCHAR(50) DEFAULT 'fa-tag',
                color VARCHAR(100) DEFAULT 'bg-gray-100 text-gray-600',
                type ENUM('expense', 'income') DEFAULT 'expense',
                INDEX (user_id)
            )
        `;

        const createBudgetsTable = `
            CREATE TABLE IF NOT EXISTS budgets (
                user_id INT NOT NULL,
                category VARCHAR(100) NOT NULL,
                limit_amount DECIMAL(10, 2) NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, category)
            )
        `;
        
        await pool.query(createUsersTable);
        await pool.query(createExpensesTable);
        await pool.query(createCategoriesTable);
        await pool.query(createBudgetsTable);

        // Advanced Migration: Check and add user_id to expenses if missing
        try {
            const [cols] = await pool.query("SHOW COLUMNS FROM expenses LIKE 'user_id'");
            if (cols.length === 0) {
                console.log('[DB] Migrating expenses table - adding user_id');
                await pool.query("ALTER TABLE expenses ADD COLUMN user_id INT AFTER id");
            }
        } catch (e) {
            console.error('[DB MIGRATION ERROR] Expenses:', e.message);
        }

        // Migration: Categories user_id
        try {
            const [cols] = await pool.query("SHOW COLUMNS FROM categories LIKE 'user_id'");
            if (cols.length === 0) {
                await pool.query("ALTER TABLE categories ADD COLUMN user_id INT AFTER id");
            }
        } catch (e) {}

        // Seed Global Categories if empty
        const [cats] = await pool.query('SELECT COUNT(*) as count FROM categories WHERE user_id IS NULL');
        if (cats[0].count === 0) {
            const seedQuery = `
                INSERT INTO categories (user_id, name, icon, color, type) VALUES 
                (NULL, 'Food', 'fa-utensils', 'bg-orange-100 text-orange-600', 'expense'),
                (NULL, 'Transport', 'fa-car', 'bg-blue-100 text-blue-600', 'expense'),
                (NULL, 'Shopping', 'fa-bag-shopping', 'bg-purple-100 text-purple-600', 'expense'),
                (NULL, 'Entertainment', 'fa-film', 'bg-pink-100 text-pink-600', 'expense'),
                (NULL, 'Health', 'fa-heart-pulse', 'bg-red-100 text-red-600', 'expense'),
                (NULL, 'Utilities', 'fa-bolt', 'bg-yellow-100 text-yellow-600', 'expense'),
                (NULL, 'Salary', 'fa-wallet', 'bg-green-100 text-green-600', 'income'),
                (NULL, 'Freelance', 'fa-laptop-code', 'bg-teal-100 text-teal-600', 'income'),
                (NULL, 'Other', 'fa-layer-group', 'bg-gray-100 text-gray-600', 'expense')
            `;
            await pool.query(seedQuery);
        }

        console.log('[DB] Multi-user tables initialized.');

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
