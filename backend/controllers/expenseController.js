const { getPool } = require('../config/db');
const { success, error } = require('../utils/responseHelper');

// Get all expenses
exports.getAllExpenses = async (req, res) => {
    const userId = req.userData.userId;
    try {
        const [rows] = await getPool().query(
            'SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC', 
            [userId]
        );
        return success(res, 'Expenses fetched successfully', rows);
    } catch (err) {
        return error(res, 'Internal server error while fetching expenses');
    }
};

// Add new expense/income
exports.addExpense = async (req, res) => {
    const userId = req.userData.userId;
    const { title, amount, category, date, description, type } = req.body;
    
    if (!title || !amount || !category || !date) {
        return error(res, 'Missing required fields', 400);
    }

    try {
        const [result] = await getPool().query(
            'INSERT INTO expenses (user_id, title, amount, category, type, date, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, title, amount, category, type || 'expense', date, description || '']
        );
        
        return success(res, `${type === 'income' ? 'Income' : 'Expense'} added successfully`, { id: result.insertId }, 201);
    } catch (err) {
        return error(res, 'Internal server error');
    }
};

// Update expense/income
exports.updateExpense = async (req, res) => {
    const userId = req.userData.userId;
    const { id } = req.params;
    const { title, amount, category, date, description, type } = req.body;

    try {
        const [result] = await getPool().query(
            'UPDATE expenses SET title = ?, amount = ?, category = ?, type = ?, date = ?, description = ? WHERE id = ? AND user_id = ?',
            [title, amount, category, type || 'expense', date, description, id, userId]
        );

        if (result.affectedRows === 0) return error(res, 'Not found or unauthorized', 404);
        return success(res, 'Updated successfully');
    } catch (err) {
        return error(res, 'Internal server error');
    }
};

// Budget Handlers
exports.getBudgets = async (req, res) => {
    const userId = req.userData.userId;
    try {
        const [rows] = await getPool().query('SELECT * FROM budgets WHERE user_id = ?', [userId]);
        return success(res, 'Budgets fetched', rows);
    } catch (err) {
        return error(res, 'Internal server error');
    }
};

exports.updateBudget = async (req, res) => {
    const userId = req.userData.userId;
    const { category, limit_amount } = req.body;
    try {
        await getPool().query(
            'INSERT INTO budgets (user_id, category, limit_amount) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE limit_amount = ?',
            [userId, category, limit_amount, limit_amount]
        );
        return success(res, 'Budget updated');
    } catch (err) {
        return error(res, 'Internal server error');
    }
};

// Category Handlers
exports.getCategories = async (req, res) => {
    const userId = req.userData.userId;
    try {
        // Fetch global (user_id IS NULL) and user-specific categories
        const [rows] = await getPool().query(
            'SELECT * FROM categories WHERE user_id IS NULL OR user_id = ?', 
            [userId]
        );
        return success(res, 'Categories fetched', rows);
    } catch (err) {
        return error(res, 'Internal server error');
    }
};

exports.addCategory = async (req, res) => {
    const userId = req.userData.userId;
    const { name, icon, color, type } = req.body;
    try {
        await getPool().query(
            'INSERT IGNORE INTO categories (user_id, name, icon, color, type) VALUES (?, ?, ?, ?, ?)',
            [userId, name, icon || 'fa-tag', color || 'bg-gray-100 text-gray-600', type || 'expense']
        );
        return success(res, 'Category added successfully');
    } catch (err) {
        return error(res, 'Internal server error');
    }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
    const userId = req.userData.userId;
    const { id } = req.params;
    try {
        const [result] = await getPool().query('DELETE FROM expenses WHERE id = ? AND user_id = ?', [id, userId]);
        if (result.affectedRows === 0) return error(res, 'Expense not found or unauthorized', 404);
        return success(res, 'Expense deleted successfully');
    } catch (err) {
        return error(res, 'Internal server error');
    }
};
