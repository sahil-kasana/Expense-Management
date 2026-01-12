const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const { initializeDatabase } = require('./config/db');
const expenseRoutes = require('./routes/expenseRoutes');
const userRoutes = require('./routes/userRoutes');
const { error } = require('./utils/responseHelper');

const app = express();

// Advanced Logging Middleware
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

// Middleware
app.use(cors());
app.use(express.json());

// Heartbeat route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);

// 404 Handler
app.use((req, res) => {
    return error(res, 'Resource not found', 404);
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('[FATAL ERROR]', err.stack);
    return error(res, 'An unexpected error occurred on the server', 500);
});

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await initializeDatabase();
        app.listen(PORT, () => {
            console.log(`
🚀 Server is running on port ${PORT}
📅 Started at: ${new Date().toLocaleString()}
🔗 Health Check: http://localhost:${PORT}/health
            `);
        });
    } catch (err) {
        console.error('Failed to start server due to DB error');
        process.exit(1);
    }
}

startServer();
