const { DataTypes, Model } = require('sequelize');

module.exports = class Vote extends Model {
    static init(sequelize) {
        return super.init({
            pooltype: {
                type: DataTypes.STRING,
                unique: true,
            },
            guildId: { type: DataTypes.STRING },
            ThreadId: { type: DataTypes.STRING },
            approvedby: { type: DataTypes.INTEGER },
            rejectedby: { type: DataTypes.INTEGER },
            result: { type: DataTypes.STRING }
        },
        {
            tableName: 'Vote',
            timestamps: true,
            sequelize
        });
    }
}
