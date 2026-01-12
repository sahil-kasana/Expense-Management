const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../config/db');
const { success, error } = require('../utils/responseHelper');

exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return error(res, 'Missing required fields', 400);
    }

    try {
        const pool = getPool();
        // Check if user exists
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return error(res, 'User already exists', 400);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Save User
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        return success(res, 'User registered successfully', { userId: result.insertId }, 201);
    } catch (err) {
        console.error('[AUTH ERROR] Register:', err);
        return error(res, 'Internal server error during registration');
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return error(res, 'Email and password required', 400);
    }

    try {
        const pool = getPool();
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return error(res, 'Invalid credentials', 401);
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return error(res, 'Invalid credentials', 401);
        }

        // Generate Token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'your_super_secret_key',
            { expiresIn: '7d' }
        );

        return success(res, 'Login successful', {
            token,
            userId: user.id,
            name: user.name,
            email: user.email
        });
    } catch (err) {
        console.error('[AUTH ERROR] Login:', err);
        return error(res, 'Internal server error during login');
    }
};

exports.getProfile = async (req, res) => {
    try {
        const [users] = await getPool().query('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.userData.userId]);
        if (users.length === 0) return error(res, 'User not found', 404);
        return success(res, 'Profile fetched', users[0]);
    } catch (err) {
        return error(res, 'Internal server error');
    }
};
