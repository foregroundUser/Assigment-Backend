const express = require('express');
const {
    register,
    login,
    getUser,
    updateUser,
    forgotPassword,
    checkIsAdmin
} = require('../controllers/authController');

const { authenticate } = require('../middlewares/authMiddleware');
const router = express.Router();
const upload = require('../middlewares/upload');

/**
 * @swagger
 * tags:
 *   - name: auth
 *     description: Authentication routes
 */

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
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
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
 *               password:
 *                 type: string
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
 *     security:
 *       - bearerAuth: []
 *     tags: [auth]
 *     summary: Get user information
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User data retrieved
 *       404:
 *         description: User not found
 */
router.get('/users/:uid', authenticate, getUser);

/**
 * @swagger
 * /users/{uid}:
 *   put:
 *     summary: Update user information (username, isAdmin, profileImage)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: UID of the user
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: AzamovX
 *               isAdmin:
 *                 type: boolean
 *                 example: false
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Optional profile image file
 *     responses:
 *       200:
 *         description: User successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 updatedFields:
 *                   type: object
 *       400:
 *         description: Invalid request
 *       404:
 *         description: User not found
 *       503:
 *         description: Server error
 */
router.put('/users/:uid', authenticate, upload.single('profileImage'), updateUser);
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
 *     security:
 *       - bearerAuth: []
 *     tags: [auth]
 *     summary: Check if a user is an admin
 *     parameters:
 *       - in: query
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
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
 *       400:
 *         description: Missing UID in query
 *       404:
 *         description: User not found
 */
router.get('/isAdmin', authenticate, checkIsAdmin);

module.exports = router;
