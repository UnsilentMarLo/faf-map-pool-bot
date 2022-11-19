const { Sequelize } = require('sequelize');
const path = require("path")
const dataPath = path.join(process.env.volP || "./database.sqlite")

console.log(`process: ${process.env.vol}`);
console.log(`dataPath: ${dataPath}`);

module.exports = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: dataPath,
});