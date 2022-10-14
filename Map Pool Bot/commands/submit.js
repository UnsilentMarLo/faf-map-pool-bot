const { SlashCommandBuilder, PermissionFlagsBits, ComponentType } = require('discord.js');
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
		.setName('submit')
		.setDescription('Submit a map to the TMM Team for the next TMM map pool.')
		.addStringOption(option =>
			option.setName('pool')
				.setDescription('Select the pool you want to submit the map to')
				.setRequired(true)
				.addChoices(
					{ name: '1v1', value: '1v1' },
					{ name: '2v2', value: '2v2' },
					{ name: '4v4', value: '4v4' }
			))
		.addStringOption(option =>
			option.setName('name')
				.setDescription('Please enter the full name of the map as it is in the map Vault.')
				.setRequired(true))
		.addStringOption(option =>
				option.setName('description')
					.setDescription('describe why the map would be good for TMM in a short sentence.')
					.setRequired(true)),

	async execute(interaction) {
		const PoolSelection = interaction.options.getString('pool');
		const today = new Date()
		var MapName = interaction.options.getString('name');
		const month = today.getMonth()     // 10 (Month is 0-based, so 10 means 11th Month)
		const year = today.getFullYear()   // 2020
		var MapNameAndPool = `${MapName}${PoolSelection}${month}${year}`
		const MapDescription = interaction.options.getString('description');
		const channel = interaction.client.channels.cache.get('1029446191190126652');
		const threadAuthor = interaction.user.tag;
		
		var fail = false;

		const Embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(`${interaction.user.username} Submitting map: ${MapName} for the ${PoolSelection} pool `)
			.setAuthor({ name: `Submitted by ${interaction.user.username}`, iconURL: `${interaction.user.displayAvatarURL()}`, url: `${interaction.user.displayAvatarURL()}`  })
			.setDescription(`${MapDescription}`)

		// buttons for easy moderating
		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('pool1v1')
					.setLabel('Add to 1v1 pool')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('pool2v2')
					.setLabel('Add to 2v2 pool')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('pool4v4')
					.setLabel('Add to 4v4 pool')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('delete')
					.setLabel('Delete')
					.setStyle(ButtonStyle.Danger),
		);

		MapNameAndPool = escapeArguments(MapNameAndPool);
		MapName = escapeArguments(MapName);

		// check to see if the map is valid
		try {
			var content = await fetchMapPromise(MapName, data)
		} catch (error) {
			console.log(`invalid map ${content}`);
			return interaction.reply({ content: 'Cant find that map, please upload your map to the vault or enter the correct map name.', ephemeral: true });
		}

		// create database entry for the submission
		try {
			await Submission.create({
				name: MapNameAndPool,
				authorId: threadAuthor,
				channelId: `Submission: ${MapName} ${PoolSelection} pool`,
				guildId: interaction.guildId,
				SubmissiondId: 'undefined',
				ThreadId: 'undefined',
				approvedby: 0,
				rejectedby: 0,
				result: 'result',
			});
		}
		catch (error) {
			if (error.name === 'SequelizeUniqueConstraintError') {
				return interaction.reply({ content: 'That map has already been submitted for this month.', ephemeral: true });
			}

			console.log(`Error: ${error}`);
	return interaction.reply({ content: 'Something went wrong.', ephemeral: true });
		}

		// this is the main message
		// const submission = await channel.send({ embeds: [Embed] });

		// check if the mods created tags, do it for those lazy mfs
		var tags = []
		for (const tag of channel.availableTags) {
			if (!tag.name == '1v1' && !tag.name == '2v2' && !tag.name == '4v4' ) {
				tags.push(ForumTag(name = "1v1", moderated = True))
				tags.push(ForumTag(name = "2v2", moderated = True))
				tags.push(ForumTag(name = "4v4", moderated = True))
				await channel.edit(available_tags = tags)
			}
		}

		var AppropriateTag = 'undefined'

		// console.log(`ChannelTags: ${channel.availableTags}`);

		for (const tag of channel.availableTags) {
			// console.log(`tag: ${tag.name} against ${PoolSelection}`);
			if (tag.name == `${PoolSelection}`) {
				AppropriateTag = `${tag.id}`
			}
		}

		AppropriateTag = AppropriateTag.toString();

		// console.log(`AppropriateTag: ${AppropriateTag}`);

		// this is the thread message, the IDs of the thread and the message are same
		const thread = await channel.threads.create({
			name: `Submission: ${MapName} ${PoolSelection} pool`,
			autoArchiveDuration: 10080,
			message: {
				embeds: [Embed],
			},
			appliedTags: [AppropriateTag],
			reason: 'This is a thread where the TMM team can discuss your map and give feedback',
		});
		
		// join the thread
		thread.join();

		// update the Database with the IDs of the Submission and its thread
		// await Submission.update({ SubmissiondId: submission.id }, { where: { name: MapNameAndPool } });
		await Submission.update({ ThreadId: thread.id }, { where: { name: MapNameAndPool } });

		// this could have improved performance, since we needlessly call fetchmap again
		try {
			var content = await fetchMapPromise(MapName, data)
			var threadmessage = await thread.send({ embeds: [content], components: [row] });
		} catch (error) {
			console.log(`invalid map after map check ${content}`);
		}

		return interaction.reply({ content: `Thank you ${interaction.user.username} for submitting, the TMM will consider this map for the next map pool.`, ephemeral: true });
	},
};

function escapeArguments(str) {
	str = str.replace(/\\/g, "\\\\")
		.replace(/\$/g, "\\$")
		.replace(/'/g, "\\'")
		.replace(/"/g, "\\\"");
	return str;
}

function isNumeric(str) {
	if (/[^0-9]/.test(str)) {
		return false;
	}
	return true;
}

function httpsFetchPromise(address) {
	return new Promise((resolve, reject) => {
		//Single HTTPS-GET should get us everything we need

		https.get(address, (res) => {

			let ok = false;
			switch (res.statusCode) {
				default:
					ok = true;
					break;

				case 400:
					log("[" + address + "] ==> Malformed request ?! 400 - doing nothing.", "WW");
					break;

				case 403:
					log("[" + address + "] ==> Access forbidden ?! 403 - doing nothing.", "WW");
					break;

				case 404:
					log("[" + address + "] ==> Server not found ?! 404 - doing nothing.", "WW");
					break;

				case 500:
					log("[" + address + "] ==> Server error ?! 500 - doing nothing.", "WW");
					break;

				case 504:
					log("[" + address + "] ==> Server error ?! 504 - doing nothing.", "WW");
					break;
			}

			if (ok) {

				let d = '';

				res.setEncoding('utf8');

				res.on('readable', function () {
					const chunk = this.read() || '';

					d += chunk;
				});

				res.on('end', function () {
					resolve(d);
				});

			}
			else {
				reject(res.statusCode);
			}

		}).on('error', (e) => {
			reject(e);
		});
	})
}

async function fetchMapPromise(mapNameOrId, apiUrl) {

	let filter = 'displayName=="' + mapNameOrId + '"';
	if (isNumeric(mapNameOrId) && !isNaN(parseFloat(mapNameOrId))) {
		filter = 'id==' + mapNameOrId + '';
	}
	const fetchUrl = apiUrl + 'map?filter=' + filter + '&page[size]=1&include=versions,author';

	try {
		var d = await httpsFetchPromise(fetchUrl);
	} catch (error) {
		reject(error);
	}

	return new Promise((resolve, reject) => {

		let filter = 'displayName=="' + mapNameOrId + '"';
		if (isNumeric(mapNameOrId) && !isNaN(parseFloat(mapNameOrId))) {
			filter = 'id==' + mapNameOrId + '';
		}

		const data = JSON.parse(d);
		if (data != undefined && data.included != undefined) {

			let map = {};
			map.author = "Unknown";

			const mapData = data.data[0];
			const includes = data.included;

			for (let i = 0; i < includes.length; i++) {
				let thisData = includes[i];
				switch (thisData.type) {
					default:
						continue;
						break;

					case "mapVersion":
						map.imgUrl = thisData.attributes.thumbnailUrlLarge.replace(/( )/g, "%20");
						map.version = thisData.attributes.version;
						map.size = ((thisData.attributes.width / 512) * 10) + "x" + ((thisData.attributes.height / 512) * 10) + " km";
						map.description = thisData.attributes.description.replace(/<\/?[^>]+(>|$)/g, "");;
						map.downloadUrl = thisData.attributes.downloadUrl;
						map.maxPlayers = thisData.attributes.maxPlayers;
						map.ranked = thisData.attributes.ranked;
						break;

					case "player":
						map.author = thisData.attributes.login;
						break;
				}
			}

			map.id = mapData.id;
			map.displayName = mapData.attributes.displayName;
			map.createTime = mapData.attributes.createTime;

			let embedMes = {
				title: "" + map.displayName + " (id #" + map.id + ")",
				description: map.description,
				color: 0x0099FF,
				image: {
					url: map.imgUrl
				},
				fields: [
					{
						name: "Size",
						value: map.size,
						inline: true
					},
					{
						name: "Max players",
						value: map.maxPlayers,
						inline: true
					},
					{
						name: "Ranked",
						value: map.ranked,
						inline: true
					},
					{
						name: "Author",
						value: map.author,
						inline: true
					}
				]
			}

			if (map.downloadUrl != undefined) {
				embedMes.url = map.downloadUrl.replace(/ /g, "%20");
			}

			resolve(embedMes);

		}
		else {
			reject("Uknown map");
		}

	});
}
