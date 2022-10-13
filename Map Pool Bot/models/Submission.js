const { DataTypes, Model } = require('sequelize');

module.exports = class Submission extends Model {
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
            approvedby: { type: DataTypes.INTEGER },
            rejectedby: { type: DataTypes.INTEGER },
            result: { type: DataTypes.STRING }
        },
        {
            tableName: 'Submission',
            timestamps: true,
            sequelize
        });
    }
}