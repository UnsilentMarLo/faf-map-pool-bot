const db = require('../database/database');
const Submission = require('../models/Submission');
const Pool = require('../models/Pool');
const PoolSubmission = require('../models/PoolSubmission');
const Vote = require('../models/Vote');
const role = '832712537173655572';
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { data } = require('../config.json');
const https = require('https');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (interaction.isButton()) {
            if (!interaction.isButton()) return;
            // console.log(interaction);

            // matchmaker team role

            // console.log(`${interaction.member._roles}.`);

            try {
                await RoleCheck(interaction)
            } catch (error) {
                await interaction.reply({ content: `${error}`, ephemeral: true });
                return;
            }

            // get the database entry from the threads ID
            const threadid = interaction.channelId;
            const MapSub = await Submission.findOne({ where: { ThreadId: threadid } });
            const button = interaction.customId;

            if (button == `pool1v1`) {
                try {
                    await PoolCheck(interaction, MapSub, button)
                    await interaction.reply({ content: `Added to pool`, ephemeral: true });
                } catch (error) {
                    await interaction.reply({ content: `${error}`, ephemeral: true });
                    return;
                }
                return;
            } else if (button == `pool2v2`) {
                try {
                    await PoolCheck(interaction, MapSub, button)
                    await interaction.reply({ content: `Added to pool`, ephemeral: true });
                } catch (error) {
                    await interaction.reply({ content: `${error}`, ephemeral: true });
                    return;
                }
                return;
            } else if (button == `pool4v4`) {
                try {
                    await PoolCheck(interaction, MapSub, button)
                    await interaction.reply({ content: `Added to pool`, ephemeral: true });
                } catch (error) {
                    await interaction.reply({ content: `${error}`, ephemeral: true });
                    return;
                }
                return;
            } else if (button == `delete`) {
                try {
                    // delete database entry
                    const rowCount = await Submission.destroy({ where: { ThreadId: threadid } });
                    if (!rowCount) return interaction.reply({ content: 'That Submission doesn\'t exist.', ephemeral: true });

                    // delete forum thread
                    interaction.channel.delete();
                    return;
                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: 'Ooops, something went wrong!', ephemeral: true });
                    return;
                }
            }

        } else {
            return;
        }
	},
};

async function RoleCheck(interaction) {
    return new Promise((resolve, reject) => {

        if (interaction.member.id == '212160745553526784') {
            resolve();
        }

        for (const [i, value] of interaction.member._roles.entries()) {
            // console.log(`at ${i} out of ${interaction.member._roles.length - 1} with ${value} vs ${role}.`);
            if (value === role) {
                resolve();
            } else if (i === interaction.member._roles.length - 1) {
                reject("Only members of the matchmaker team can use these buttons!");
            }
        }

	});
}

async function PoolCheck(interaction, MapSub, button) {
    const today = await new Date()
    const month = today.getMonth() // 0-11
    const lastmonth = month - 1 // if we hit 0 month we should increment a year down, gotta add this     TODO
    const year = today.getFullYear()
    var LastPoolName = `${button}${lastmonth}${year}`
    var PoolName = `${button}${month}${year}`
    var PoolSelection = `${button}`.replace("pool", "");
    var alreadyexists = false
    var channel = interaction.channel.parent
    var fail = 'undefined'
    var failed = false
    // const channel = interaction.client.channels.cache.get('1029446191190126652');
    const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];


    // first we try to create the pool if it doesnt exist already
    const Embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`${PoolSelection} pool forum thread, for ${monthNames[month]}`)

        // create Pool thread for this pool if not already present
        try {
            await Pool.create({
                pooltype: PoolName,
                guildId: interaction.guildId,
                ThreadId: 'undefined',
                approvedby: 0,
                rejectedby: 0,
                result: 'result',
            });
        }
        catch (error) {
            alreadyexists = true
        }

    if (!alreadyexists) {
        var AppropriateTag = 'undefined'

        for (const tag of channel.availableTags) {
            // console.log(`tag: ${tag.name} against ${PoolSelection}`);
            if (tag.name == `${PoolSelection}`) {
                AppropriateTag = `${tag.id}`
            }
        }

        // this is the thread message, the IDs of the thread and the message are same
        var thread = await channel.threads.create({
            name: `${PoolSelection} pool from ${monthNames[month]}`,
            autoArchiveDuration: 10080,
            message: {
                embeds: [Embed],
            },
            appliedTags: [AppropriateTag],
            reason: 'Displays the pool for the next month',
        });

        await Pool.update({ ThreadId: thread.id }, { where: { pooltype: PoolName } });

    // join the thread
        thread.join();
    // seems discord API cannot pin channels yet?
        // thread.pin();
    }

    // then we try and find the last pool and delete it
    const LastPool = await Pool.findOne({ where: { pooltype: LastPoolName } })
        .catch(console.error);

    // console.log(`LastPool: ${LastPool}`);

    if (LastPool) {
    channel.threads.fetch(`${LastPool.ThreadId}`)
        .then(thread => thread.delete())
        .catch(console.error);

        await Pool.destroy({ where: { pooltype: LastPoolName } });
    }

    // post the selected map to the pool, avoid duplicates
    const CurrPool = await Pool.findOne({ where: { pooltype: PoolName } })
        .catch(console.error);

    const CurrChannel = channel.threads.cache.get(`${CurrPool.ThreadId}`);

    // console.log(`CurrPool: ${CurrPool}`);
    // console.log(`CurrChannel: ${CurrChannel}`);

    var MapName = MapSub.mapname
    var MapNameAndPool = `${MapName}${PoolSelection}${month}${year}`

    MapNameAndPool = escapeArguments(MapNameAndPool);

    // create database entry for the submission
    try {
        await PoolSubmission.create({
            name: MapNameAndPool,
            channelId: `${CurrPool}`,
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
            fail = 'That map has already been added to this pool.'
            failed = true
        }
        if (!failed) {
            fail = `Something went wrong, ${error}.`
            failed = true
        }
    }

    if (!failed) {
        try {
            var content = await fetchMapPromise(MapName, data)
        } catch (error) {
            console.log(`invalid map after map check ${content}`);
            failed = true
            fail = 'Something went wrong, invalid map after map check.'
        }
        var threadmessage = await CurrChannel.send({ embeds: [content] });
    }

    return new Promise((resolve, reject) => {
        if (!failed) {
            resolve();
        }

        reject(fail);

    });
}

// support functions
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
