const express = require('express');
const {
    listUsers,
    deleteUser, listAllRequests, updateRequest
} = require('../controllers/adminController');

const router = express.Router();

router.get('/users', listUsers);
router.delete('/users/', deleteUser);
router.get('/requests', listAllRequests);
router.put('/requests/:id', updateRequest);

module.exports = router;