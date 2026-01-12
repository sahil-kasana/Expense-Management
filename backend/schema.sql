CREATE DATABASE IF NOT EXISTS expense_tracker;

USE expense_tracker;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT, -- NULL for global categories, otherwise user-specific
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT 'fa-tag',
    color VARCHAR(100) DEFAULT 'bg-gray-100 text-gray-600',
    type ENUM('expense', 'income') DEFAULT 'expense',
    UNIQUE KEY unique_user_cat (user_id, name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS budgets (
    user_id INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    limit_amount DECIMAL(10, 2) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, category),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed initial global categories
INSERT IGNORE INTO categories (user_id, name, icon, color, type) VALUES 
(NULL, 'Food', 'fa-utensils', 'bg-orange-100 text-orange-600', 'expense'),
(NULL, 'Transport', 'fa-car', 'bg-blue-100 text-blue-600', 'expense'),
(NULL, 'Shopping', 'fa-bag-shopping', 'bg-purple-100 text-purple-600', 'expense'),
(NULL, 'Entertainment', 'fa-film', 'bg-pink-100 text-pink-600', 'expense'),
(NULL, 'Health', 'fa-heart-pulse', 'bg-red-100 text-red-600', 'expense'),
(NULL, 'Utilities', 'fa-bolt', 'bg-yellow-100 text-yellow-600', 'expense'),
(NULL, 'Salary', 'fa-wallet', 'bg-green-100 text-green-600', 'income'),
(NULL, 'Freelance', 'fa-laptop-code', 'bg-teal-100 text-teal-600', 'income'),
(NULL, 'Other', 'fa-layer-group', 'bg-gray-100 text-gray-600', 'expense');
