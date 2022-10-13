const db = require('../database/database');
const Submission = require('../models/Submission');

module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
        db.authenticate().then(() => {
            Submission.init(db);
            Submission.sync();
            console.log("Logged in to DB.");
        }).catch(err => console.log(err));
	},
};
