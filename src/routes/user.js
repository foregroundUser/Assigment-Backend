const express = require('express');
const router = express.Router();
const {
    requestRepair,
    listUserRequests,
    getUserProfile,
    getUserHistory,
    submitFeedback,
    confirmOtherRequest,
    deleteRequest,
    getMyMails
} = require('../controllers/userController');

const multer = require('multer');
const path = require('path');
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
 * /user/request:
 *   post:
 *     summary: Yangi ta'mirlash so'rovi yuborish
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               uid:
 *                 type: string
 *               issueName:
 *                 type: string
 *               problemType:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: So'rov yaratildi
 */
router.post('/request', (req, res) => {
    upload.array('images', 2)(req, res, err => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        requestRepair(req, res);
    });
});

/**
 * @swagger
 * /user/requests/{uid}:
 *   get:
 *     summary: Foydalanuvchining barcha so'rovlari
 */
router.get('/requests/:uid', listUserRequests);

/**
 * @swagger
 * /user/profile/{uid}:
 *   get:
 *     summary: Foydalanuvchi profilini olish
 */
router.get('/profile/:uid', getUserProfile);

/**
 * @swagger
 * /user/history/{uid}:
 *   get:
 *     summary: Foydalanuvchining tarixiy so'rovlari
 */
router.get('/history/:uid', getUserHistory);

/**
 * @swagger
 * /user/feedback:
 *   post:
 *     summary: Foydalanuvchi fikr bildirish
 */
router.post('/feedback', submitFeedback);

/**
 * @swagger
 * /user/confirm-request/{id}:
 *   post:
 *     summary: Other tipidagi so'rovni tasdiqlash
 */
router.post('/confirm-request/:id', confirmOtherRequest);

/**
 * @swagger
 * /user/request/{id}:
 *   delete:
 *     summary: So‘rovni o‘chirish
 */
router.delete('/request/:id', deleteRequest);

/**
 * @swagger
 * /user/mymails/{uid}:
 *   get:
 *     summary: Foydalanuvchiga yuborilgan admin habarlari (only other requests)
 */
router.get('/mymails/:uid', getMyMails);

module.exports = router;