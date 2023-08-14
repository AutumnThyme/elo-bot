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

        const numDuels = populatedPlayer.duels.length;
        let numBombWins = 0;
        let numBombLosses = 0;
        let numBladeWins = 0;
        let numBladeLosses = 0;
        for (const duel of populatedPlayer.duels) {
            const duelObj = await Duel.findOne({ _id: duel });
            if (duelObj) {
                const winner = duelObj.player1Score > duelObj.player2Score ? duelObj.player1 : duelObj.player2;
                if (winner == player.id) {
                    if (duelObj.duelType == 'bomb') {
                        numBombWins++;
                    }
                    else {
                        numBladeWins++;
                    }
                }
                else {
                    // Dumb linter error
                    const x = y => y;
                    x();
                    if (duelObj.duelType == 'blade') {
                        numBombLosses++;
                    }
                    else {
                        numBladeLosses++;
                    }
                }
            }
        }

        let message = `<@${player.id}>'s scoreboard:\n`;
        message += 'Bomb:\n';
        message += `\tElo: ${populatedPlayer.bombElo.toFixed(2)}\n`;
        message += `\tPQ: ${populatedPlayer.bombPQ.toFixed(2)}\n`;
        message += `\tDiscrete Elo: ${populatedPlayer.bombDiscreteElo.toFixed(0)}\n`;
        message += `\tWin Rate: ${(numBombWins * 100 / (numBombWins + numBombLosses)).toFixed(2)}%\n`;
        message += `\t(${numBombWins} wins, ${numBombLosses} losses, ${numBombWins + numBombLosses} total)\n`;
        message += 'Blade:\n';
        message += `\tElo: ${populatedPlayer.bladeElo.toFixed(2)}\n`;
        message += `\tPQ: ${populatedPlayer.bladePQ.toFixed(2)}\n`;
        message += `\tDiscrete Elo: ${populatedPlayer.bladeDiscreteElo.toFixed(0)}\n`;
        message += `\tWin Rate: ${(numBladeWins * 100 / (numBladeWins + numBladeLosses)).toFixed(2)}%\n`;
        message += `\t(${numBladeWins} wins, ${numBladeLosses} losses, ${numBladeWins + numBladeLosses} total)\n`;

        return await interaction.reply({ content: message, ephemeral: false });
	},
};