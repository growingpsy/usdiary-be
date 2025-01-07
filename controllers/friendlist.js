const Friend = require('../models/friend');
const User = require('../models/user');
const Diary = require('../models/diary');
const Profile = require('../models/profile');
const { gainPoints } = require('./point'); 

// 맞팔 관계
exports.getFriends = async (req, res) => {
    try {
        const signId = res.locals.decoded.sign_id; // JWT에서 sign_id 가져오기
        console.log(signId)
        const user = await User.findOne({ where: { sign_id: signId } });
  
        // 팔로우 중인 유저 목록 조회 (팔로잉)
        const following = await Friend.findAll({
            where: { follower_id: signId },
            attributes: ['following_id']
        });

        // 나를 팔로우 중인 유저 목록 조회 (팔로워)
        const followers = await Friend.findAll({
            where: { following_id: user.user_id },
            attributes: ['follower_id']
        });

        // 친구 목록 (팔로우와 팔로워 관계가 일치하는 유저)
        const friends = following
            .map(f => f.following_id)
            .filter(followingId => followers.some(f => f.follower_id  === followingId));

        // 친구 수 계산
        const friendCount = friends.length;

        // 5명당 2포인트 획득
        const pointsToAdd = Math.floor(friendCount / 5) * 2;
        if (pointsToAdd > 0) {
            await gainPoints(req, res, '서로 무너 관계 맺기', pointsToAdd);
        }

        // 친구 목록에 해당하는 유저 정보 조회
        const friendUsers = await User.findAll({
            where: { sign_id: friends },
            
        });

        res.status(200).json({
            message: 'Friend list retrieved successfully',
            data: friendUsers
        });
    } catch (error) {
        console.error('Error retrieving friend list:', error);
        res.status(500).json({ error: 'An error occurred while retrieving the friend list' });
    }
};
// 1. 팔로워 목록 조회
exports.getFollowers = async (req, res) => {
    try {
        const signId = res.locals.decoded.sign_id; // JWT에서 sign_id 가져오기
        
        // 나를 팔로우 중인 유저 목록 조회
        const followers = await Friend.findAll({
            where: { following_id: signId },
            include: [{
                model: User,  // 팔로워 유저 정보
                as: 'Follower',  // 팔로워 유저와의 관계 (별칭)
                attributes: ['sign_id', 'user_nick', 'user_name', 'user_tendency']
            }]
        });

        if (!followers.length) {
            return res.status(404).json({ message: 'No followers found' });
        }

        const followerList = followers.map(f => f.Follower);

        res.status(200).json({
            message: 'Follower list retrieved successfully',
            data: followerList
        });
    } catch (error) {
        console.error('Error retrieving followers:', error);
        res.status(500).json({ error: 'An error occurred while retrieving the followers' });
    }
};
// 2. 팔로잉 목록 조회
exports.getFollowing = async (req, res) => {
    try {
        const signId = res.locals.decoded.sign_id; // JWT에서 sign_id 가져오기
        
        // 내가 팔로우 중인 유저 목록 조회
        const following = await Friend.findAll({
            where: { follower_id: signId },
            include: [{
                model: User,  // 팔로우된 유저 정보
                as: 'Following',  // 팔로우된 유저와의 관계 (별칭)
                attributes: ['sign_id', 'user_nick', 'user_name', 'user_tendency']
            }]
        });

        if (!following.length) {
            return res.status(404).json({ message: 'No following found' });
        }

        const followingList = following.map(f => f.Following);

        res.status(200).json({
            message: 'Following list retrieved successfully',
            data: followingList
        });
    } catch (error) {
        console.error('Error retrieving following:', error);
        res.status(500).json({ error: 'An error occurred while retrieving the following list' });
    }
};

// 3. 팔로워 삭제
exports.deleteFollowers = async (req, res) => {
    try {
        const signId = res.locals.decoded.sign_id; // JWT에서 sign_id 가져오기
        const user = await User.findOne({ where: { sign_id: signId } });
        const followerId = req.body.follower_id; // 삭제할 팔로워의 sign_id
        
        // 특정 팔로워 삭제
        const result = await Friend.destroy({
            where: {
                follower_id: followerId,
                following_id: user.user_id
            }
        });

        if (result === 0) {
            return res.status(404).json({ message: 'Follower not found' });
        }

        res.status(200).json({ message: 'Follower deleted successfully' });
    } catch (error) {
        console.error('Error deleting follower:', error);
        res.status(500).json({ error: 'An error occurred while deleting the follower' });
    }
};
// 4. 팔로잉 삭제
exports.deleteFollowing = async (req, res) => {
    try {
        const signId = res.locals.decoded.sign_id; // JWT에서 sign_id 가져오기
        //const user = await User.findOne({ where: { sign_id: signId } });
        const followingId = req.body.following_id; // 삭제할 팔로잉의 sign_id

        // 특정 팔로잉 삭제
        const result = await Friend.destroy({
            where: {
                follower_id: signId,
                following_id: followingId
            }
        });

        if (result === 0) {
            return res.status(404).json({ message: 'Following not found' });
        }

        res.status(200).json({ message: 'Following deleted successfully' });
    } catch (error) {
        console.error('Error deleting following:', error);
        res.status(500).json({ error: 'An error occurred while deleting the following' });
    }
};

// 5. 팔로우 요청
exports.sendFollowRequest = async (req, res) => {
    try {
        const signId = res.locals.decoded.sign_id; // JWT에서 sign_id 가져오기
        const me = await User.findOne({ where: { sign_id: signId } });
        const requestedId = req.body.requested_sign_id; // 팔로우 요청을 보낼 대상 sign_id

        // 이미 요청이 있는지 확인
        const existingRequest = await Friend.findOne({
            where: {
                follower_id: me.user_id,
                following_id: requestedId
            }
        });

        if (existingRequest) {
            if (existingRequest.status === 'pending') {
                return res.status(400).json({ message: '팔로우 요청 중입니다.' });
            } else if (existingRequest.status === 'accepted') {
                return res.status(400).json({ message: '이미 팔로우 상태입니다.' });
            }
        }

        // 팔로우 요청 보내기 (상태를 pending으로 설정)
        if (existingRequest) {
            // 기존 요청이 있을 경우 상태를 업데이트
            await existingRequest.update({ status: 'pending' });
        } else {
            // 새로운 팔로우 요청 생성
            await Friend.create({
                follower_id: signId,
                following_id: requestedId,
                status: 'pending'
            });
        }

        const user = await User.findOne({
            where: { sign_id: requestedId },
            attributes: ['sign_id', 'user_nick'],
            include: [
                {
                    model: Profile,
                    attributes: ['profile_img']
                }
            ]
        });

        return res.status(201).json({
            message: `${user.user_nick}님에게 팔로우 요청을 보냈습니다.`,
            data: {
                sign_id: user.sign_id,
                user_nick: user.user_nick,
                profile_img: user.Profile ? user.Profile.profile_img : null
            }
        });
    } catch (error) {
        console.error('Error sending follow request:', error);
        return res.status(500).json({ error: error.message });
    }
};
// 6. 팔로우 요청 처리 (수락 또는 거절)
exports.handleFollowRequest = async (req, res) => {
    try {
        const signId = res.locals.decoded.sign_id; // JWT에서 요청 처리하는 유저의 sign_id 가져오기
        const user = await User.findOne({ where: { sign_id: signId } });
        const followerSignId = req.body.follower_id; // 팔로우 요청을 보낸 유저의 sign_id
        const action = req.body.action; // "accepted" 또는 "rejected"

        // 팔로우 요청이 있는지 확인
        const followRequest = await Friend.findOne({
            where: {
                follower_id: followerSignId, // 팔로우 요청을 보낸 유저
                following_id: user.user_id, // 팔로우 요청을 받은 유저 (현재 로그인된 유저)
                status: 'pending' // 대기 중인 요청만 처리
            }
        });

        if (!followRequest) {
            return res.status(404).json({ message: '팔로우 요청을 찾을 수 없습니다.' });
        }

        const followerUser = await User.findOne({
            where: { sign_id: followerSignId },
            attributes: ['sign_id', 'user_nick'],
            include: [
                {
                    model: Profile,
                    attributes: ['profile_img'] 
                }
            ]
        });

        if (!followerUser) {
            return res.status(404).json({ message: '팔로우 요청을 보낸 사용자를 찾을 수 없습니다.' });
        }

        if (action === 'accepted') {
            // 팔로우 요청 수락
            await followRequest.update({ status: 'accepted' });

            // 팔로우 관계 설정
            await Friend.create({
                follower_id: followerSignId, 
                following_id: signId, 
                status: 'accepted' // 팔로우 관계 수락
            });

            // 팔로우 관계 확인: 서로 팔로우하는지 확인
            const reciprocalFollow = await Friend.findOne({
                where: {
                    follower_id: signId, // 현재 사용자가 팔로워
                    following_id: followerSignId, // 팔로우 요청을 보낸 유저가 팔로잉
                    status: 'accepted'
                }
            });

            // 서로 팔로우 관계가 형성된 경우 친구 관계로 설정
            if (reciprocalFollow) {
                console.log("친구가 되었습니다.");
            }

            return res.status(200).json({
                message: `${followerUser.user_nick}님의 팔로우 요청을 수락하였습니다.`,
                data: {
                    follower_id: followerUser.sign_id, // 팔로우 요청을 보낸 유저의 sign_id
                    follower_user_nick: followerUser.user_nick, // 팔로우 요청을 보낸 유저의 닉네임
                    follower_profile_img: followerUser.Profile ? followerUser.Profile.profile_img : null,
                    status: 'accepted'
                }
            });
        } else if (action === 'rejected') {
            // 팔로우 요청 거절
            await followRequest.update({ status: 'rejected' });

            return res.status(200).json({
                message: `${followerUser.user_nick}님의 팔로우 요청을 거절했습니다.`,
                status: 'rejected'
            });
        } else {
            return res.status(400).json({ message: '잘못된 요청입니다.' });
        }
    } catch (error) {
        console.error('Error handling follow request:', error);
        return res.status(500).json({ error: error.message });
    }
};
// 7. 친구 목록에서 특정 친구 sign_id 검색
exports.searchFriend = async (req, res) => {
    try {
        const signId = res.locals.decoded.sign_id; // JWT에서 sign_id 가져오기
        const user = await User.findOne({ where: { sign_id: signId } });
        const searchSignId = req.query.sign_id; // 검색할 친구의 sign_id

        const following = await Friend.findOne({
            where: {
                follower_id: user.user_id,
                following_id: searchSignId,
                status: 'accepted'
            }
        });

        const follower = await Friend.findOne({
            where: {
                follower_id: searchSignId,
                following_id: user.user_id,
                status: 'accepted'
            }
        });

        // 양방향 팔로우 상태인지 확인
        if (!following || !follower) {
            return res.status(404).json({ message: '해당 사용자는 친구 목록에 없습니다.' });
        }

        // 친구 관계가 성립된 경우, 해당 친구의 정보 조회
        const friend = await User.findOne({
            where: { sign_id: searchSignId },
            attributes: ['sign_id', 'user_name', 'user_nick'],
            include: [
                {
                    model: Profile,
                    attributes: ['profile_img']
                }
            ]
        });

        return res.status(200).json({
            message: '친구 목록에서 사용자를 찾았습니다.',
            data: {
                sign_id: friend.sign_id,
                user_name: friend.user_name,
                user_nick: friend.user_nick,
                profile_img: friend.Profile ? friend.Profile.profile_img : null
            }
        });
    } catch (error) {
        console.error('Error searching friend in list:', error);
        return res.status(500).json({ error: '친구 목록에서 사용자를 검색하는 중 오류가 발생했습니다.' });
    }
};
// 8. 친구 게시글 조회
exports.getFriendDiaries = async (req, res) => {
    try {
        const signId = res.locals.decoded.sign_id; // JWT에서 sign_id 가져오기
        const followingId = req.params.following_id; // 조회할 친구의 ID (팔로우하는 친구 sign_id))

        // 현재 유저가 팔로우하고 있는 친구 목록 조회
        const following = await Friend.findAll({
            where: { follower_id: signId  },
            attributes: ['following_id']
        });

        // 팔로우하는 친구 목록에서 선택한 친구 ID가 존재하는지 확인
        const followingIds = following.map(f => f.following_id);
        if (!followingIds.includes(followingId)) {
            return res.status(404).json({ message: 'Selected following ID is not in the following list' });
        }

        // 선택된 친구의 게시글 조회
        const friendPosts = await Diary.findAll({
            where: {
                sign_id: followingId
            },
            order: [['created_at', 'DESC']] // 최신 게시글 순으로 정렬
        });

        if (!friendPosts.length) {
            return res.status(404).json({ message: 'No posts found from the selected following' });
        }

        res.status(200).json({
            message: 'Friend posts retrieved successfully',
            data: friendPosts
        });
    } catch (error) {
        console.error('Error retrieving friend posts:', error);
        res.status(500).json({ error: 'An error occurred while retrieving friend posts' });
    }
};
// 닉네임으로 사용자 검색 후 최근 게시물 3개 포함
exports.searchUserByNickname = async (req, res) => {
    try {
        const searchNickname = req.query.user_nick; // 검색할 닉네임

        // 닉네임으로 사용자 정보 가져오기
        const user = await User.findOne({
            where: { user_nick: searchNickname },
            attributes: ['sign_id', 'user_id', 'user_tendency', 'user_nick']
        });

        if (!user) {
            return res.status(404).json({ message: '해당 닉네임의 사용자를 찾을 수 없습니다.' });
        }

        // user_id로 프로필 정보 가져오기
        const profile = await Profile.findOne({
            where: { user_id: user.user_id },
            attributes: ['profile_img']
        });

        // sign_id로 최근 게시물 3개 가져오기
        const recentDiaries = await Diary.findAll({
            where: { user_id: user.user_id },
            order: [['createdAt', 'DESC']],
            limit: 3,
            attributes: ['diary_id', 'diary_title', 'diary_content', 'createdAt', 'access_level', 'post_photo'],
        });

        // 응답 데이터 구성
        const response = {
            user: {
                sign_id: user.sign_id,
                user_id: user.user_id,
                user_tendency: user.user_tendency,
                user_nick: user.user_nick,
                profile_img: profile ? profile.profile_img : null
            },
            recent_diaries: recentDiaries.map(diary => ({
                diary_id: diary.diary_id,
                diary_title: diary.diary_title,
                diary_content: diary.diary_content.slice(0, 30) + (diary.diary_content.length > 30 ? '...' : ''), // 30자만 표시하고, 30자 초과 시 '...' 추가
                createdAt: diary.createdAt,
                access_level: diary.access_level,
                post_photo: diary.post_photo
            }))
        };

        return res.status(200).json({
            message: '닉네임으로 사용자 정보와 최근 게시물을 찾았습니다.',
            data: response
        });
    } catch (error) {
        console.error('Error searching user by nickname with recent diaries:', error);
        return res.status(500).json({ error: '닉네임으로 사용자와 최근 게시물을 검색하는 중 오류가 발생했습니다.' });
    }
};
// 팔로우 요청 조회
  exports.getFollowRequests = async (req, res) => {
    try {
      const signId = res.locals.decoded.sign_id;
      const { status } = req.query;
  
      const whereClause = { following_id: signId };
      if (status) {
        whereClause.status = status;
      }
  
      const followRequests = await Friend.findAll({
        where: whereClause,
        attributes: ['follower_id', 'status'],
        include: [
          {
            model: User,
            as: 'Follower',
            attributes: ['sign_id', 'user_nick'],
            include: [
              {
                model: Profile,
                attributes: ['profile_img'],
              },
            ],
          },
        ],
      });
  
      const result = followRequests.map(request => ({
        follower_sign_id: request.Follower?.sign_id || '데이터 없음',
        follower_user_nick: request.Follower?.user_nick || '데이터 없음',
        follower_profile_img: request.Follower?.Profile?.profile_img || null,
        status: request.status,
      }));
  
      return res.status(200).json({
        message: '팔로우 요청 목록을 성공적으로 조회했습니다.',
        data: result,
      });
    } catch (error) {
      console.error('Error fetching follow requests:', error);
      return res.status(500).json({ error: error.message });
    }
  };
  