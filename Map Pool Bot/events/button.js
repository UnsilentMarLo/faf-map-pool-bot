const db = require('../database/database');
const Submission = require('../models/Submission');
const role = '1029876276732891136';

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
                    await button.execute(interaction);
                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: 'Ooops, something went wrong!', ephemeral: true });
                }
                return;
            } else if (button == `pool2v2`) {
                try {
                    await button.execute(interaction);
                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: 'Ooops, something went wrong!', ephemeral: true });
                }
                return;
            } else if (button == `pool4v4`) {
                try {
                    await button.execute(interaction);
                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: 'Ooops, something went wrong!', ephemeral: true });
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