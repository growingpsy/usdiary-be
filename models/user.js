const {Sequelize} = require("sequelize");

class User extends Sequelize.Model {
  static initiate(sequelize) {
    return super.init(
      {
        user_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true

        },
        sign_id: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true,

        },
        user_pwd: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        user_name: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },

        user_gender: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
        },
        user_birthday: {
          type: Sequelize.DATEONLY, //날짜만 가져오기
          allowNull: false,
        },
        ban_count: {
          type: Sequelize.BIGINT,
          allowNull: false,
          defaultValue: 0,
        },
        user_email: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true,
        },
        user_tendency:{
          type: Sequelize.ENUM('숲','도시'),
          allowNull: true,

        },
        user_nick:{
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        user_point:{
          type: Sequelize.BIGINT,
          allowNull: false,
          defaultValue: 0,
        },
        last_login: {
          type: Sequelize.DATE, // 최근 접속일 필드
          allowNull: true,
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: "User",
        tableName: "users",
        paranoid: false,
        charset: "utf8",
        collate: "utf8_general_ci",
      }
    );
  }
    static associate(db) {
      db.User.hasMany(db.Diary, { foreignKey: "user_id", //상대 테이블에 참조하는 값의 칼럼 이름
        sourceKey: "user_id", //이 테이블의 참조당하는 값
        onDelete: "CASCADE",
      });
      db.User.hasMany(db.Comment, { foreignKey: "user_id", sourceKey: "user_id" });
      db.User.hasMany(db.Like, { foreignKey: "diary_user", sourceKey: "user_id" });
      db.User.hasMany(db.Notification, { foreignKey: "user_id", sourceKey: "user_id" });
      db.User.hasMany(db.QnA, { foreignKey: "user_id", sourceKey: "user_id" });
      db.User.hasMany(db.Answer, { foreignKey: "user_id", sourceKey: "user_id" });
      db.User.hasMany(db.TodayAnswer, {foreignKey: "user_id",sourceKey: "user_id", onDelete: "CASCADE"});
      db.User.hasMany(db.Point, {foreignKey: "user_id",sourceKey: "user_id", onDelete: "CASCADE"});
      db.User.hasMany(db.Routine, {foreignKey: "user_id",sourceKey: "user_id", onDelete: "CASCADE"});
      // 이 유저가 팔로우하는 다른 유저들 (팔로잉 관계)
      db.User.belongsToMany(db.User, {through: db.Friend, foreignKey: 'follower_id', as: 'Following',otherKey: 'following_id'});
      // 이 유저를 팔로우하는 유저들 (팔로워 관계)
      db.User.belongsToMany(db.User, { through: db.Friend, foreignKey: 'following_id',as: 'Followers',otherKey: 'follower_id', });
    }

    
}

module.exports = User;