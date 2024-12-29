const {Sequelize} = require("sequelize");

class Like extends Sequelize.Model {
  static initiate(sequelize) {
    return super.init(
      {
        like_id: {
          type: Sequelize.BIGINT, 
          allowNull: false,
          primaryKey: true,
          autoIncrement: true
        },
        diary_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
        },
        sign_id: { 
          type: Sequelize.STRING(255),
          allowNull: false,
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: "Like",
        tableName: "likes",
        paranoid: false,
        charset: "utf8",
        collate: "utf8_general_ci",
      }
    );
  }
  static associate(models) {
    this.belongsTo(models.Diary, { through: 'Like', foreignKey: "diary_id", targetKey: "diary_id" });  //(1:N)하나의 다이어리에 여러 개의 좋아요가 달릴 수 있음
    this.belongsTo(models.User, { through: 'Like', foreignKey: "user_id", targetKey: "user_id" });  //(N:1)여러 개의 좋아요가 한 명의 사용자에 의해 달릴 수 있음
  }
    }

module.exports = Like;