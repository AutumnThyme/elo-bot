const { SlashCommandBuilder } = require('discord.js');
const { updateLeaderboard } = require('../utilities/scoreboardmanager');
const { EloPlayer } = require('../models/eloPlayer');
const { Duel } = require('../models/Duel');
const { updateElo, updateRoundPQ } = require('../utilities/eloUtilities');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('record')
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

        // Check if we have this player.
        let player1Db = await EloPlayer.findOne({ discordID: player1.id });
        let player2Db = await EloPlayer.findOne({ discordID: player2.id });

        // If we don't, create a new one with average elo and pq.
        if (!player1Db) {
            player1Db = await EloPlayer.create({
                discordID: player1.id,
                elo: 10,
                pq: 10,
                duels: [],
            });
        }
        // If we don't, create a new one with average elo and pq.
        if (!player2Db) {
            player2Db = await EloPlayer.create({
                discordID: player2.id,
                elo: 10,
                pq: 10,
                duels: [],
            });
        }

        // Create a new duel object.
        const duel = await Duel.create({
            player1: player1,
            player2: player2,
            player1EloPrior: player1Db.elo,
            player2EloPrior: player2Db.elo,
            player1PQPrior: player1Db.pq,
            player2PQPrior: player2Db.pq,
            player1Score: player1Score,
            player2Score: player2Score,
            roundsPlayed: roundsPlayed,
            timestamp: Date.now().toString(),
        });

        // Assign the duel to each user.
        player1Db.duels.push(duel._id);
        player2Db.duels.push(duel._id);

        // Update the elo.
        player1Db.elo += updateElo(player1Db, player2Db, player1Score, player2Score, roundsPlayed, 400, 32);
        player2Db.elo += updateElo(player2Db, player1Db, player2Score, player1Score, roundsPlayed, 400, 32);

        // Update the pq.
        const pqDelta = updateRoundPQ(player1Db, player2Db, player1Score, player2Score, roundsPlayed, 10, 10);
        player1Db.pq += pqDelta;
        player2Db.pq -= pqDelta;

        // Save to the database.
        await player1Db.save();
        await player2Db.save();

        // Update the leaderboard.
        try {
            await updateLeaderboard(interaction);
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
        return await interaction.reply({
            content: result,
            ephemeral: false,
        });
	},
};