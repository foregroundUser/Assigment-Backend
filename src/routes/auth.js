// ✅ src/routes/auth.routes.js
const express = require('express');
const {
    register,
    login,
    getUser,
    updateUser,
    forgotPassword,
    checkIsAdmin
} = require('../controllers/authController');

const router = express.Router();

/**
 * @swagger
 * /register:
 *   post:
 *     tags: [auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - password
 *               - confirmPassword
 *             properties:
 *               email:
 *                 type: string
 *                 example: "azamovhud007@gmail.com"
 *               username:
 *                 type: string
 *                 example: "azamov"
 *               password:
 *                 type: string
 *                 example: "StrongPassword123"
 *               confirmPassword:
 *                 type: string
 *                 example: "StrongPassword123"
 *     responses:
 *       201:
 *         description: User registered
 *       400:
 *         description: Invalid input
 */
router.post('/register', register);

/**
 * @swagger
 * /login:
 *   post:
 *     tags: [auth]
 *     summary: Log in a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "azamovhud007@gmail.com"
 *               password:
 *                 type: string
 *                 example: "StrongPassword123"
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Unauthorized
 */
router.post('/login', login);

/**
 * @swagger
 * /users/{uid}:
 *   get:
 *     tags: [auth]
 *     summary: Get user information
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *           example: "NaUF20wrgJdz3qBgSc2g2cvf5P32"
 *     responses:
 *       200:
 *         description: User data retrieved
 *       404:
 *         description: User not found
 */
router.get('/users/:uid', getUser);

/**
 * @swagger
 * /users/{uid}:
 *   put:
 *     tags: [auth]
 *     summary: Update user information
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *           example: "NaUF20wrgJdz3qBgSc2g2cvf5P32"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "azamov_updated"
 *               isAdmin:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: User updated
 *       503:
 *         description: Update failed
 */
router.put('/users/:uid', updateUser);

/**
 * @swagger
 * /forgot-password:
 *   post:
 *     tags: [auth]
 *     summary: Send password reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: "azamovhud007@gmail.com"
 *     responses:
 *       200:
 *         description: Email sent
 *       404:
 *         description: Email not found
 */
router.post('/forgot-password', forgotPassword);
/**
 * @swagger
 * /isAdmin:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Check if a user is an admin
 *     description: Verifies if the user associated with the provided UID has admin privileges.
 *     parameters:
 *       - in: query
 *         name: uid
 *         required: true
 *         description: Firebase UID of the user
 *         schema:
 *           type: string
 *           example: "NaUF20wrgJdz3qBgSc2g2cvf5P32"
 *     responses:
 *       200:
 *         description: Successful check
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isAdmin:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Missing UID in query
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "UID is required"
 *       404:
 *         description: User not found or not authorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found"
 */
router.get('/isAdmin', checkIsAdmin);
module.exports = router;
