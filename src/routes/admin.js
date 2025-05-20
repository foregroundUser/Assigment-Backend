const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management and request control
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: Returns a list of all users
 */
router.get('/users', adminController.listUsers);

/**
 * @swagger
 * /admin/users:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a user and all their requests
 *     parameters:
 *       - in: query
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: User UID
 *     responses:
 *       200:
 *         description: User and their requests deleted
 */
router.delete('/users', adminController.deleteUser);

/**
 * @swagger
 * /admin/requests:
 *   get:
 *     tags: [Admin]
 *     summary: Get all repair requests (optional filter by status)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter requests by status
 *     responses:
 *       200:
 *         description: Returns all requests
 */
router.get('/requests', adminController.listAllRequests);

/**
 * @swagger
 * /admin/requests/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update a repair request
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               price:
 *                 type: number
 *               adminMessage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request updated
 */
router.put('/requests/:id', adminController.updateRequest);

/**
 * @swagger
 * /admin/requests/{id}/notify:
 *   post:
 *     tags: [Admin]
 *     summary: Notify user about "other" request price and admin message
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price:
 *                 type: number
 *               adminMessage:
 *                 type: string
 *     responses:
 *       200:
 *         description: User notified via email
 */
router.post('/requests/:id/notify', adminController.notifyOtherRequestByEmail);

module.exports = router;

