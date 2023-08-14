const { SlashCommandBuilder } = require('discord.js');
const { updateLeaderboard } = require('../utilities/scoreboardmanager');
const { addRecord } = require('../utilities/commandHandlers');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('recordblade')
		.setDescription('Records a duel between two players.')
        .addUserOption(option =>
            option.setName('player1')
            .setDescription('The name of the first user.')
            .setRequired(true))
        .addUserOption(option =>
            option.setName('player2')
            .setDescription('The name of the second user.')
            .setRequired(true))
        .addNumberOption(option =>
            option.setName('score1')
            .setDescription('The score of the first user.')
            .setRequired(true))
        .addNumberOption(option =>
            option.setName('score2')
            .setDescription('The score of the second user.')
            .setRequired(true))
        .addNumberOption(option =>
            option.setName('roundsplayed')
            .setDescription('The number of rounds played.')
            .setRequired(true))
        .addStringOption(option =>
            option.setName('mod1')
            .setDescription('The mod player 1 used.')
            .setRequired(false))
        .addStringOption(option =>
            option.setName('mod2')
            .setDescription('The mod player 2 used.')
            .setRequired(false)),
	async execute(interaction) {
        if (!interaction.member.roles.cache.some(role => role.name === 'Admin' || role.name === 'Mod')) {
			return await interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
		}
        // id, bot, system, flags, username, discriminator, avatar, ...
        const player1 = interaction.options.getUser('player1');
        const player2 = interaction.options.getUser('player2');

        const player1Score = interaction.options.getNumber('score1');
        const player2Score = interaction.options.getNumber('score2');
        const roundsPlayed = interaction.options.getNumber('roundsplayed');

        const mod1 = interaction.options.getString('mod1');
        const mod2 = interaction.options.getString('mod2');

        const id = await addRecord(
            interaction,
            'blade',
            {
                player1: player1,
                score1: player1Score,
                mod1: mod1,
            },
            {
                player2: player2,
                score2: player2Score,
                mod2: mod2,
            },
            roundsPlayed,
        );

        // Update the leaderboard.
        try {
            await updateLeaderboard(interaction, 'blade');
        }
        catch (error) {
            console.log(error);
        }

        // Log the results to the channel.
        let result = `Participants: ${player1} - ${player2}\n`;
        result += `Number of rounds: ${roundsPlayed} kills\n`;
        if (mod1 && mod2) {
            result += `Mods: ${mod1} - ${mod2}\n`;
        }
        result += `Score: ${player1Score} - ${player2Score}\n`;
        const winner = player1Score > player2Score ? player1 : player2;
        result += `Winner: ${winner}\n`;
        result += `Duel ID: ${id}\n`;
        return await interaction.reply({
            content: result,
            ephemeral: false,
        });
	},
};