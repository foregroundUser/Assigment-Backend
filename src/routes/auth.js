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

router.post('/register', register);
router.post('/login', login);
router.get('/users/:uid', getUser);
router.put('/users/:uid', updateUser);
router.post('/forgot-password', forgotPassword);
router.get("/isAdmin/",checkIsAdmin)
module.exports = router;
