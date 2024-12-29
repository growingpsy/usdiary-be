const express = require('express');
const router = express.Router();
const { likeDiary, deleteLike } = require('../controllers/like');
const { verifyToken } = require('../middlewares/jwt');


// 일기 좋아요 조회
router.get('/:diary_id/likes', verifyToken, likeDiary)

// 일기 좋아요 생성
router.post('/:diary_id/likes', verifyToken, likeDiary)

//일기 좋아요 삭제
router.delete('/:diary_id/likes', verifyToken, deleteLike);

module.exports = router;

