const { getPool } = require('../config/db');
const { success, error } = require('../utils/responseHelper');

// Get all expenses
exports.getAllExpenses = async (req, res) => {
    try {
        console.log('[DEBUG] Fetching all expenses');
        const [rows] = await getPool().query('SELECT * FROM expenses ORDER BY date DESC');
        return success(res, 'Expenses fetched successfully', rows);
    } catch (err) {
        console.error('[ERROR] Failed to fetch expenses:', err);
        return error(res, 'Internal server error while fetching expenses');
    }
};

// Add new expense/income
exports.addExpense = async (req, res) => {
    const { title, amount, category, date, description, type } = req.body;
    
    if (!title || !amount || !category || !date) {
        return error(res, 'Missing required fields', 400);
    }

    try {
        console.log(`[DEBUG] Adding new ${type || 'expense'}: ${title} - ₹${amount}`);
        const [result] = await getPool().query(
            'INSERT INTO expenses (title, amount, category, type, date, description) VALUES (?, ?, ?, ?, ?, ?)',
            [title, amount, category, type || 'expense', date, description || '']
        );
        
        const newEntry = { id: result.insertId, title, amount, category, type: type || 'expense', date, description };
        return success(res, `${type === 'income' ? 'Income' : 'Expense'} added successfully`, newEntry, 201);
    } catch (err) {
        console.error('[ERROR] Failed to add entry:', err);
        return error(res, 'Internal server error');
    }
};

// Update expense/income
exports.updateExpense = async (req, res) => {
    const { id } = req.params;
    const { title, amount, category, date, description, type } = req.body;

    try {
        const [result] = await getPool().query(
            'UPDATE expenses SET title = ?, amount = ?, category = ?, type = ?, date = ?, description = ? WHERE id = ?',
            [title, amount, category, type || 'expense', date, description, id]
        );

        if (result.affectedRows === 0) return error(res, 'Not found', 404);
        return success(res, 'Updated successfully', { id, title, amount, category, type, date, description });
    } catch (err) {
        return error(res, 'Internal server error');
    }
};

// Budget Handlers
exports.getBudgets = async (req, res) => {
    try {
        const [rows] = await getPool().query('SELECT * FROM budgets');
        return success(res, 'Budgets fetched', rows);
    } catch (err) {
        return error(res, 'Internal server error');
    }
};

exports.updateBudget = async (req, res) => {
    const { category, limit_amount } = req.body;
    try {
        await getPool().query(
            'INSERT INTO budgets (category, limit_amount) VALUES (?, ?) ON DUPLICATE KEY UPDATE limit_amount = ?',
            [category, limit_amount, limit_amount]
        );
        return success(res, 'Budget updated');
    } catch (err) {
        return error(res, 'Internal server error');
    }
};

// Category Handlers
exports.getCategories = async (req, res) => {
    try {
        const [rows] = await getPool().query('SELECT * FROM categories');
        return success(res, 'Categories fetched', rows);
    } catch (err) {
        return error(res, 'Internal server error');
    }
};

exports.addCategory = async (req, res) => {
    const { name, icon, color, type } = req.body;
    try {
        await getPool().query(
            'INSERT IGNORE INTO categories (name, icon, color, type) VALUES (?, ?, ?, ?)',
            [name, icon || 'fa-tag', color || 'bg-gray-100 text-gray-600', type || 'expense']
        );
        return success(res, 'Category added successfully');
    } catch (err) {
        return error(res, 'Internal server error');
    }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
    const { id } = req.params;
    try {
        console.log(`[DEBUG] Deleting expense ID ${id}`);
        const [result] = await getPool().query('DELETE FROM expenses WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return error(res, 'Expense not found', 404);
        }

        return success(res, 'Expense deleted successfully');
    } catch (err) {
        console.error(`[ERROR] Failed to delete expense ID ${id}:`, err);
        return error(res, 'Internal server error while deleting expense');
    }
};
