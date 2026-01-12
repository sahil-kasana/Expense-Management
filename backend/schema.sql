CREATE DATABASE IF NOT EXISTS expense_tracker;

USE expense_tracker;

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
);

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50) DEFAULT 'fa-tag',
    color VARCHAR(100) DEFAULT 'bg-gray-100 text-gray-600',
    type ENUM('expense', 'income') DEFAULT 'expense'
);

-- Seed initial categories if table is empty
INSERT IGNORE INTO categories (name, icon, color, type) VALUES 
('Food', 'fa-utensils', 'bg-orange-100 text-orange-600', 'expense'),
('Transport', 'fa-car', 'bg-blue-100 text-blue-600', 'expense'),
('Shopping', 'fa-bag-shopping', 'bg-purple-100 text-purple-600', 'expense'),
('Entertainment', 'fa-film', 'bg-pink-100 text-pink-600', 'expense'),
('Health', 'fa-heart-pulse', 'bg-red-100 text-red-600', 'expense'),
('Utilities', 'fa-bolt', 'bg-yellow-100 text-yellow-600', 'expense'),
('Salary', 'fa-wallet', 'bg-green-100 text-green-600', 'income'),
('Freelance', 'fa-laptop-code', 'bg-teal-100 text-teal-600', 'income'),
('Other', 'fa-layer-group', 'bg-gray-100 text-gray-600', 'expense');
