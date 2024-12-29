const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Admin = require('../models/admin');
dotenv.config(); // .env 파일에서 JWT_SECRET 가져오기

exports.verifyToken = (req, res, next) => {
    try {
        const token = req.headers['authorization'];
        console.log('Authorization header:', req.headers['authorization']); // 토큰 존재 확인

        if (!token) {
            return res.status(403).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET); // 'Bearer ' 부분 제거하고 검증
        
        // req.locals가 없으면 초기화
        if (!req.locals) {
            req.locals = {};
        }
        req.locals.decoded = decoded; // decoded를 저장


        console.log('Decoded JWT:', decoded); // JWT 디코딩 확인

        res.locals.decoded = decoded;

        return next(); 
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(419).json({
                code: 419,
                message: '토큰이 만료되었습니다',
            });
        }
        return res.status(401).json({
            code: 401,
            message: '유효하지 않은 토큰입니다',
        });
    }
};
// 관리자 권한 확인 미들웨어 (JWT 토큰 검증 + Admin 테이블에서 관리자 확인)
exports.verifyAdmin = async (req, res, next) => {
    try {
        const token = req.headers['authorization'];
        if (!token) {
            return res.status(403).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET); // 'Bearer ' 부분 제거하고 검증
        res.locals.decoded = decoded;

        // Admin 테이블에서 관리자 확인
        const admin = await Admin.findOne({ where: { admin_id: decoded.admin_id } });
        if (!admin) {
            return res.status(403).json({
                message: '관리자 권한이 필요합니다',
            });
        }

        console.log('Admin access granted:', decoded); // 관리자 토큰 디버깅용 로그
        return next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(419).json({
                code: 419,
                message: '토큰이 만료되었습니다',
            });
        }
        return res.status(401).json({
            code: 401,
            message: '유효하지 않은 토큰입니다',
        });
    }
};