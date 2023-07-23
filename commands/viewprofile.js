const { SlashCommandBuilder } = require('discord.js');
const { EloPlayer } = require('../models/eloPlayer');
const { Duel } = require('../models/Duel');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('viewprofile')
		.setDescription('Sends a message in chat with the users profile.')
        .addUserOption(option =>
            option.setName('player')
            .setDescription('The name of the user.')
            .setRequired(false)),
	async execute(interaction) {
        // id, bot, system, flags, username, discriminator, avatar, ...
        let player = interaction.options.getUser('player');

        if (!player) {
            player = interaction.user;
        }

        // Check if we have this player.
        const playerDb = await EloPlayer.findOne({ discordID: player.id });

        // If we don't, no work is needed.
        if (!playerDb) {
            return await interaction.reply({ content: `<@${player.id}> does not have any duels.`, ephemeral: false });
        }

        // Populate players ranks with assignables.
        const populatedPlayer = await EloPlayer.findOne({ discordID: player.id });
        let message = `<@${player.id}>'s scoreboard:\n`;
        message += `Elo: ${populatedPlayer.elo.toFixed(2)}\n`;
        message += `PQ: ${populatedPlayer.pq.toFixed(2)}\n`;

        const numDuels = populatedPlayer.duels.length;
        let numWins = 0;
        for (const duel of populatedPlayer.duels) {
            const duelObj = await Duel.findOne({ _id: duel });
            if (duelObj) {
                const winner = duelObj.score1 > duelObj.score2 ? duelObj.player1 : duelObj.player2;
                if (winner == player.id) {
                    numWins++;
                }
            }
        }
        message += `Win Rate: ${(numWins * 100 / numDuels).toFixed(2)}%\n`;
        message += `(${numWins} wins, ${numDuels - numWins} losses, ${numDuels} total)\n`;

        return await interaction.reply({ content: message, ephemeral: false });
	},
};