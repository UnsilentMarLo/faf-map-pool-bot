const db = require('../database/database');
const Submission = require('../models/Submission');
const Pool = require('../models/Pool');
const PoolSubmission = require('../models/PoolSubmission');
const Vote = require('../models/Vote');

module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
        db.authenticate().then(() => {
            Submission.init(db);
            Submission.sync();
            Pool.init(db);
            Pool.sync();
            PoolSubmission.init(db);
            PoolSubmission.sync();
            Vote.init(db);
            Vote.sync();
            console.log("Logged in to DB.");
        }).catch(err => console.log(err));
	},
};
