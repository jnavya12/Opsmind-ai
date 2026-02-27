const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { handleChat, getChatHistory } = require('../controllers/chatController');

const router = express.Router();

router.post('/chat', protect, handleChat);
router.get('/chat/history', protect, getChatHistory);

module.exports = router;
