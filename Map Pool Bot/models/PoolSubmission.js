const { DataTypes, Model } = require('sequelize');

module.exports = class PoolSubmission extends Model {
    static init(sequelize) {
        return super.init({
            name: {
                type: DataTypes.STRING,
                unique: true,
            },
            authorId: { type: DataTypes.STRING },
            channelId: { type: DataTypes.STRING },
            guildId: { type: DataTypes.STRING },
            SubmissiondId: { type: DataTypes.STRING },
            ThreadId: { type: DataTypes.STRING },
            approvedby1v1: { type: DataTypes.INTEGER },
            approvedby2v2: { type: DataTypes.INTEGER },
            approvedby4v4: { type: DataTypes.INTEGER },
            rejectedby: { type: DataTypes.INTEGER },
            result: { type: DataTypes.STRING }
        },
        {
            tableName: 'PoolSubmission',
            timestamps: true,
            sequelize
        });
    }
}