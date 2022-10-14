const { DataTypes, Model } = require('sequelize');

module.exports = class Pool extends Model {
    static init(sequelize) {
        return super.init({
            pooltype: {
                type: DataTypes.STRING,
                unique: true,
            },
            guildId: { type: DataTypes.STRING },
            Submissions: { type: DataTypes.ARRAY(DataTypes.STRING) },
            approvedby: { type: DataTypes.INTEGER },
            rejectedby: { type: DataTypes.INTEGER },
            result: { type: DataTypes.STRING }
        },
        {
            tableName: 'Pool',
            timestamps: true,
            sequelize
        });
    }
}
