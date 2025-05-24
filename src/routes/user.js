const express = require('express');
const router = express.Router();
const {
    requestRepair,
    listUserRequests,
    getUserProfile,
    getUserHistory,
    getMyMails,
    submitFeedback,
    confirmOtherRequest,
    deleteRequest,
    cancelPendingRequest,
    getUserFeedbacks
} = require('../controllers/userController');

const multer = require('multer');
const path = require('path');
const { authenticate } = require('../middlewares/authMiddleware');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, ['.png', '.jpg', '.jpeg'].includes(ext));
    }
});

/**
 * @swagger
 * tags:
 *   - name: User
 *     description: Foydalanuvchi amallari
 */
/**
 * @swagger
 * /user/request:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     tags: [User]
 *     summary: Yangi ta'mirlash so'rovi yuborish
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - issueName
 *               - problemType
 *               - images
 *               - location
 *             properties:
 *               issueName:
 *                 type: string
 *               problemType:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               location:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: So'rov yaratildi
 *       400:
 *         description: Xato so'rov parametrlari
 */
router.post('/request', authenticate, (req, res) => {
    upload.array('images', 2)(req, res, err => {
        if (err) return res.status(400).json({ error: err.message });
        requestRepair(req, res);
    });
});


/**
 * @swagger
 * /user/requests/{uid}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags: [User]
 *     summary: Foydalanuvchining barcha so'rovlari
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: So'rovlar ro'yxati
 *       503:
 *         description: Serverda xato yuz berdi
 */
router.get('/requests/:uid', authenticate, listUserRequests);

/**
 * @swagger
 * /user/profile/{uid}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags: [User]
 *     summary: Foydalanuvchi profilini olish
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profil ma'lumotlari
 *       404:
 *         description: Profil topilmadi
 */
router.get('/profile/:uid', authenticate, getUserProfile);

/**
 * @swagger
 * /user/history/{uid}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags: [User]
 *     summary: Foydalanuvchining tarixiy so'rovlari
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tarixiy so'rovlar ro'yxati
 *       503:
 *         description: Serverda xato yuz berdi
 */
router.get('/history/:uid', authenticate, getUserHistory);

/**
 * @swagger
 * /user/mymails/{uid}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags: [User]
 *     summary: Foydalanuvchiga yuborilgan admin xabarlari (faqat “other” turi)
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xabarlar ro'yxati
 *       500:
 *         description: Serverda xato yuz berdi
 */
router.get('/mymails/:uid', authenticate, getMyMails);

/**
 * @swagger
 * /user/feedback:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     tags: [User]
 *     summary: Foydalanuvchi fikr bildirish
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requestId
 *               - rating
 *             properties:
 *               requestId:
 *                 type: string
 *               rating:
 *                 type: integer
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Fikr muvaffaqiyatli saqlandi
 *       400:
 *         description: Xato parametrlari
 *       404:
 *         description: So'rov topilmadi
 */
router.post('/feedback', authenticate, submitFeedback);

/**
 * @swagger
 * /user/confirm-request/{id}:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     tags: [User]
 *     summary: Other turidagi so'rovni tasdiqlash
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
 *               uid:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tasdiqlash muvaffaqiyatli
 *       400:
 *         description: Noto‘g‘ri holat yoki parametrlari
 *       403:
 *         description: Ruxsat yo‘q
 *       404:
 *         description: So‘rov topilmadi
 */
router.post('/confirm-request/:id', authenticate, confirmOtherRequest);

/**
 * @swagger
 * /user/request/{id}:
 *   delete:
 *     security:
 *       - bearerAuth: []
 *     tags: [User]
 *     summary: So‘rovni o‘chirish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: So‘rov o‘chirildi
 *       400:
 *         description: Xato parametrlari yoki holat
 *       403:
 *         description: Ruxsat yo‘q
 *       404:
 *         description: So‘rov topilmadi
 */
router.delete('/request/:id', authenticate, deleteRequest);

/**
 * @swagger
 * /user/cancel-request/{id}:
 *   delete:
 *     security:
 *       - bearerAuth: []
 *     tags: [User]
 *     summary: Foydalanuvchi PENDING yoki WAITING holatidagi so‘rovni bekor qilish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: So‘rov muvaffaqiyatli bekor qilindi
 *       400:
 *         description: Bekor qilish uchun yaroqsiz
 *       403:
 *         description: Ruxsat yo‘q
 *       404:
 *         description: So‘rov topilmadi
 *       500:
 *         description: Ichki server xatosi
 */
router.delete('/cancel-request/:id', authenticate, cancelPendingRequest);

/**
 * @swagger
 * /feedback/user:
 *   get:
 *     summary: Get feedbacks submitted by the authenticated user
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's feedbacks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 feedbacks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       requestId:
 *                         type: string
 *                       rating:
 *                         type: integer
 *                         enum: [1, 2, 3, 4, 5]
 *                       comment:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 */
router.get('/feedback/user', authenticate, getUserFeedbacks);

module.exports = router;
