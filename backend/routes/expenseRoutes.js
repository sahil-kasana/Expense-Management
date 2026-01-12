const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

router.get('/', expenseController.getAllExpenses);
router.post('/', expenseController.addExpense);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

// Budget routes
router.get('/budgets', expenseController.getBudgets);
router.post('/budgets', expenseController.updateBudget);

// Category routes
router.get('/categories', expenseController.getCategories);
router.post('/categories', expenseController.addCategory);

module.exports = router;
