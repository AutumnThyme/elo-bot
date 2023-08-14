const { SlashCommandBuilder } = require('discord.js');
const { Scoreboard } = require('../models/scoreboard');
const { updateLeaderboard } = require('../utilities/scoreboardmanager');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('makescoreboard')
		.setDescription('Creates a scoreboard under this channel!')
		.addStringOption(option =>
			option.setName('scoreboardname')
			.setDescription('The name of the scoreboard, leave default for leaderboard.')
			.setRequired(true)
            .addChoices(
                { name: 'bomb', value: 'bomb' },
                { name: 'blade', value: 'blade' },
            )),
	async execute(interaction) {
        if (!interaction.member.roles.cache.some(role => role.name === 'Admin' || role.name === 'Mod')) {
			return await interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
		}
		const scoreboardName = interaction.options.getString('scoreboardname');
        if (!['bomb', 'blade'].includes(scoreboardName)) {
            return await interaction.reply({ content: 'Must use type bomb or blade.', ephemeral: true });
        }

        // Check if we have a scoreboard object already.
        const scoreboardDB = await Scoreboard.findOne({ name: `${scoreboardName} Leaderboard` });

        if (scoreboardDB) {
            return await interaction.reply({ content: `${scoreboardName} already exists...`, ephemeral: false });
        }

        // Create a new message for the scoreboard and store the reference inside the database.
        const scoreboardMessage = await interaction.reply({ content: 'Placeholder message', fetchReply: true });
        const guildID = scoreboardMessage.guild.id;
        const channelID = scoreboardMessage.channel.id;
        const messageID = scoreboardMessage.id;
        await Scoreboard.create({
            name: `${scoreboardName} Leaderboard`,
            messageID: messageID,
            channelID: channelID,
            guildID: guildID,
        });

        // Update the leaderboard message.
        await updateLeaderboard(interaction, scoreboardName);
        return;
	},
};