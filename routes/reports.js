const express = require('express');
const router = express.Router();
const { createReport } = require('../controllers/report');
const { verifyToken } = require('../middlewares/jwt');

// 신고 생성
router.post('/systems/reports', verifyToken, createReport);

module.exports = router;