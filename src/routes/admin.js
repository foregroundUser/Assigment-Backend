const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middlewares/authMiddleware');

const {
    listUsers,
    deleteUser,
    notifyOtherRequestByEmail,
    updateRequest,
    listAllRequests, getAllFeedbackStats, getAllFeedbacks
} = require('../controllers/adminController');

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Admin so'rovlari
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags: [Admin]
 *     summary: Foydalanuvchilar ro'yxatini oling (isAdmin false)
 *     responses:
 *       200:
 *         description: Foydalanuvchilar ro'yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   email:
 *                     type: string
 *                   isAdmin:
 *                     type: boolean
 *                   name:
 *                     type: string
 *       503:
 *         description: Xizmat vaqtiinchalik mavjud emas
 */
router.get('/users', authenticate, requireAdmin, listUsers);

/**
 * @swagger
 * /admin/user:
 *   delete:
 *     security:
 *       - bearerAuth: []
 *     tags: [Admin]
 *     summary: Foydalanuvchini o‘chirish (Auth + Firestore + so‘rovlar)
 *     parameters:
 *       - in: query
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: Foydalanuvchi identifikatori
 *     responses:
 *       200:
 *         description: Foydalanuvchi muvaffaqiyatli o‘chirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       400:
 *         description: UID talab qilinadi
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Ichki xato
 */
router.delete('/user', authenticate, requireAdmin, deleteUser);

/**
 * @swagger
 * /admin/notify-other/{id}:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     tags: [Admin]
 *     summary: “other” turdagi so‘rov uchun narx yuborish va status→PENDING
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: RepairRequest hujjat IDsi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - price
 *               - adminMessage
 *             properties:
 *               price:
 *                 type: number
 *               adminMessage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Narx yuborildi va notified=true qaytarildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 notified:
 *                   type: boolean
 *       400:
 *         description: Xato parametr yoki noto‘g‘ri holat
 *       404:
 *         description: So‘rov yoki foydalanuvchi topilmadi
 *       500:
 *         description: Ichki xato
 */
router.post('/notify-other/:id', authenticate, requireAdmin, notifyOtherRequestByEmail);

/**
 * @swagger
 * /admin/request/{id}:
 *   patch:
 *     security:
 *       - bearerAuth: []
 *     tags: [Admin]
 *     summary: So‘rov holatini yangilash (faqat status)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: RepairRequest hujjat IDsi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 description: Yangi status (masalan, CONFIRMED yoki DONE)
 *     responses:
 *       200:
 *         description: Status muvaffaqiyatli yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       400:
 *         description: Xato parametr yoki noto‘g‘ri holat
 *       404:
 *         description: So‘rov topilmadi
 *       500:
 *         description: Ichki xato
 */
router.patch('/request/:id', authenticate, requireAdmin, updateRequest);

/**
 * @swagger
 * /admin/requests:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags: [Admin]
 *     summary: Barcha RepairRequests ro'yxatini oling (status bo'yicha filtrlash mumkin)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filtrlash uchun status (PENDING, WAITING, CONFIRMED, DONE)
 *     responses:
 *       200:
 *         description: So‘rovlar ro‘yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   uid:
 *                     type: string
 *                   problemType:
 *                     type: string
 *                   status:
 *                     type: string
 *                   price:
 *                     type: number
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Ichki xato yoki indeks muammosi
 */
router.get('/requests', authenticate, requireAdmin, listAllRequests);

router.get("/feedbacks", authenticate, requireAdmin, getAllFeedbacks);
router.get("/feedbacksStats", authenticate, requireAdmin, getAllFeedbackStats);
module.exports = router;
