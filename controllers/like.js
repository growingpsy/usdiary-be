const { Op } = require('sequelize');
const dayjs = require('dayjs');
const Like = require('../models/like');
const Diary = require('../models/diary');
const gainPoints = require('../controllers/point').gainPoints; // 포인트 획득 함수 가져오기

// 좋아요 누르기
exports.likeDiary = async (req, res) => {
    try {
        console.log('req.locals:', req.locals); // req.locals 디버깅
        const signId = req.locals.decoded.sign_id; // decoded에 sign_id가 있는지 확인
        const diaryId = req.params.diary_id;
        
        console.log('signId:', signId);
        console.log('diaryId:', diaryId);
        
        const diary = await Diary.findOne({
            where: {
                diary_id: diaryId
            }
        });
        if (!diary) {
            console.error('Diary not found for ID:', diaryId);
            return res.status(404).json({ error: 'Diary not found' });
        }
        
        console.log('Diary found:', diary);

        console.log('다이어리 ID',diaryId)
        console.log('signId:', signId);
        console.log('diaryId:', diaryId);


        // 좋아요 생성
        const createLike = await Like.create({
            diary_id: diaryId,
            sign_id: signId,
        });

        // 해당 일기의 like_count 증가
        await Diary.increment('like_count', {
            by: 1, // like_count 값을 1 증가
            where: {
                diary_id: diaryId
            }
        });

        const startOfWeek = dayjs().startOf('week').add(1, 'day').toDate();
        const endOfWeek = dayjs().endOf('week').add(1, 'day').toDate();

        // 이번 주에 사용자가 누른 좋아요 수 계산
        const likesThisWeek = await Like.count({
            where: {
                sign_id: signId,
                createdAt: {
                    [Op.between]: [startOfWeek, endOfWeek],
                },
            },
        });

        // 5개의 좋아요마다 1포인트 추가, 최대 5포인트 제한
        const earnedPoints = Math.floor(likesThisWeek / 5);
        const maxWeeklyPoints = 5;

        if (earnedPoints > 0) {
            const currentWeekPoints = await getWeeklyPoints(signId); 
            const pointsToAdd = Math.min(earnedPoints, maxWeeklyPoints - currentWeekPoints);

            if (pointsToAdd > 0) {
                await gainPoints(req, res, '일기에 좋아요', pointsToAdd);
            }
        }

        res.status(201).json({
            message: 'Like created successfully',
            data: createLike
        });
    } catch (error) {
        console.error('Error creating like:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// 좋아요 삭제
exports.deleteLike = async (req, res) => {
    try {
        console.log('req.locals:', req.locals); // req.locals 디버깅
        const signId = req.locals.decoded.sign_id; // decoded에 sign_id가 있는지 확인
        const diaryId = req.params.diary_id;
        
        console.log('signId:', signId);
        console.log('diaryId:', diaryId);

        // diary_id가 존재하지 않으면 에러 반환
        if (!diaryId) {
            return res.status(400).json({ message: 'Diary ID is missing' });
        }


      const like = await Like.findOne({
        where: {
          diary_id: diaryId,
          sign_id: signId
        },
        attributes: ['like_id']  // 선택할 컬럼만 지정
      });
  
      if (!like) {
        return res.status(404).json({ message: 'Like not found' });
      }
  
      await like.destroy();
      return res.status(200).json({ message: 'Like deleted successfully' });
      
    } catch (error) {
      console.error('Error deleting like:', error);
      return res.status(500).json({ error: error.message });
    }
  };