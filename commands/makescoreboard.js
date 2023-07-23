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
			.setRequired(false)),
	async execute(interaction) {
        if (!interaction.member.roles.cache.some(role => role.name === 'Admin' || role.name === 'Mod')) {
			return await interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
		}
		let scoreboardName = interaction.options.getString('scoreboardname');
        if (!scoreboardName) {
            scoreboardName = 'EloLeaderboard';
        }

        // Check if we have a scoreboard object already.
        const scoreboardDB = await Scoreboard.findOne({ name: scoreboardName });

        if (scoreboardDB) {
            return await interaction.reply({ content: `${scoreboardName} already exists...`, ephemeral: false });
        }

        // Create a new message for the scoreboard and store the reference inside the database.
        const scoreboardMessage = await interaction.reply({ content: 'Placeholder message', fetchReply: true });
        const guildID = scoreboardMessage.guild.id;
        const channelID = scoreboardMessage.channel.id;
        const messageID = scoreboardMessage.id;
        await Scoreboard.create({
            name: scoreboardName,
            messageID: messageID,
            channelID: channelID,
            guildID: guildID,
        });

        // Update the leaderboard message.
        await updateLeaderboard(interaction);
        return;
	},
};