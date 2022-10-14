const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const path = require('node:path');
const { data } = require('../config.json');
const https = require('https');
const http = require('http');
const Sequelize = require('sequelize');
const db = require('../database/database');
const Submission = require('../models/Submission');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const utils = require('../utils.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Remove a submitted map.')
		.addStringOption(option =>
			option.setName('pool')
				.setDescription('Select the pool you want to remove the map submission from.')
				.setRequired(true)
				.addChoices(
					{ name: '1v1', value: '1v1' },
					{ name: '2v2', value: '2v2' },
					{ name: '4v4', value: '4v4' }
			))
		.addStringOption(option =>
			option.setName('name')
				.setDescription('Please enter the full name of the map as it is in the map vault.')
				.setRequired(true)),

	async execute(interaction) {
		const PoolSelection = interaction.options.getString('pool');
		var MapName = interaction.options.getString('name');
		const today = new Date()
		const month = today.getMonth()     // 10 (Month is 0-based, so 10 means 11th Month)
		const year = today.getFullYear()   // 2020
		var MapNameAndPool = `${MapName}${PoolSelection}${month}${year}`
		const channel = interaction.client.channels.cache.get('1029446191190126652');
		const threadAuthor = interaction.user.tag;
		const MapSub = await Submission.findOne({ where: { name: MapNameAndPool } });

		const Embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(`Deleting Submission: ${MapName} from the ${PoolSelection} pool.`)
			.setAuthor({ name: `Deleted by ${interaction.user.username}`, iconURL: `${interaction.user.displayAvatarURL()}`, url: `${interaction.user.displayAvatarURL()}`  })

		MapNameAndPool = escapeArguments(MapNameAndPool);

		// delete the map from the database
		const rowCount = await Submission.destroy({ where: { name: MapNameAndPool } });
		if (!rowCount) return interaction.reply({ content: 'That Submission doesn\'t exist.', ephemeral: true });

		//const SubmissiondId = MapSub.get('SubmissiondId')
/*		const ThreadmessageId = MapSub.get('ThreadmessageId')*/
		const ThreadId = MapSub.get('ThreadId')

		channel.threads.fetch(`${ThreadId}`)
			.then(thread => thread.delete())
			.catch(console.error);
/*		channel.messages.fetch(`${SubmissiondId}`)
			.then(message => message.delete())
			.catch(console.error);*/
/*		channel.messages.fetch(`${ThreadId}`)
			.then(message => message.delete())
			.catch(console.error);*/

		//await channel.send({ embeds: [Embed] });

		return interaction.reply({ content: 'Submission deleted.', ephemeral: true });

	},
};

function escapeArguments(str) {
	str = str.replace(/\\/g, "\\\\")
		.replace(/\$/g, "\\$")
		.replace(/'/g, "\\'")
		.replace(/"/g, "\\\"");
	return str;
}
