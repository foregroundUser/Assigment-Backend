const express = require('express');
const multer = require('multer');
const path = require('path');
const {
    requestRepair,
    listUserRequests,
    getUserProfile,
    getUserHistory,
    submitFeedback,
    deleteRequest
} = require('../controllers/userController');

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {fileSize: 5 * 1024 * 1024},
    fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, ['.png', '.jpg', '.jpeg'].includes(ext));
    }
});

router.post(
    '/request',
    (req, res) => {
        upload.array('images', 2)(req, res, err => {
            if (err) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({error: 'Fayl hajmi 5 MB dan oshmasligi kerak.'});
                }
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return res.status(400).json({error: 'Faqat 2 ta rasm yuborish mumkin.'});
                }
                return res.status(400).json({error: err.message});
            }
            requestRepair(req, res);
        });
    }
);

router.get('/requests/:uid', listUserRequests);

router.get('/profile/:uid', getUserProfile);
router.get('/history/:uid', getUserHistory);

router.post('/feedback', submitFeedback);
router.delete('/request/:id', deleteRequest);

module.exports = router;
