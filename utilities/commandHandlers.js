const { EloPlayer } = require('../models/eloPlayer');
const { Duel } = require('../models/Duel');
const { updateElo, updateRoundPQ, updateDiscreteElo } = require('../utilities/eloUtilities');

const addRecord = async (interaction, duelType, player1Stats, player2Stats, roundsPlayed) => {
    const { player1, score1, mod1 } = player1Stats;
    const { player2, score2, mod2 } = player2Stats;
    if (roundsPlayed == 0) {
        throw new Error('Cannot record a duel with zero rounds played');
    }
    if (!['blade', 'bomb'].includes(duelType)) {
        throw new Error(`Unknown duel type ${duelType}`);
    }

    // Check if we have this player.
    let player1Db = await EloPlayer.findOne({ discordID: player1.id });
    let player2Db = await EloPlayer.findOne({ discordID: player2.id });

    // If we don't, create a new one with average elo and pq.
    if (!player1Db) {
        player1Db = await EloPlayer.create({
            discordID: player1.id,
            bombDiscreteElo: 10,
            bombElo: 10,
            bombPQ: 10,
            bladeDiscreteElo: 10,
            bladeElo: 10,
            bladePQ: 10,
            duels: [],
        });
    }
    // If we don't, create a new one with average elo and pq.
    if (!player2Db) {
        player2Db = await EloPlayer.create({
            discordID: player2.id,
            bombDiscreteElo: 10,
            bombElo: 10,
            bombPQ: 10,
            bladeDiscreteElo: 10,
            bladeElo: 10,
            bladePQ: 10,
            duels: [],
        });
    }

    // Create a new duel object.
    const duel = await Duel.create({
        duelType: duelType,
        adminName: interaction.user.tag,
        player1: player1.id,
        player2: player2.id,
        player1Score: score1,
        player2Score: score2,
        mod1: mod1,
        mod2: mod2,
        roundsPlayed: roundsPlayed,
        timestamp: Date.now().toString(),
    });

    // Assign the duel to each user.
    player1Db.duels.push(duel._id);
    player2Db.duels.push(duel._id);

    let generic1;
    let generic2;

    if (duelType == 'blade') {
        // Create generic player to send
        generic1 = {
            pq: player1Db.bladePQ,
            elo: player1Db.bladeElo,
            discreteElo: player1Db.bladeDiscreteElo,
        };
        generic2 = {
            pq: player2Db.bladePQ,
            elo: player2Db.bladeElo,
            discreteElo: player2Db.bladeDiscreteElo,
        };

        // Update the elo.
        player1Db.bladeElo += updateElo(generic1, generic2, score1, score2, roundsPlayed, 400, 32);
        player2Db.bladeElo += updateElo(generic2, generic1, score2, score1, roundsPlayed, 400, 32);

        // Update the pq.
        const pqDelta = updateRoundPQ(generic1, generic2, score1, score2, roundsPlayed, 10, 10);
        player1Db.bladePQ += pqDelta;
        player2Db.bladePQ -= pqDelta;

        // Update the discrete elo.
        const { user1Change, user2Change } = updateDiscreteElo(generic1, generic2, score1, score2, roundsPlayed);
        player1Db.bladeDiscreteElo += user1Change;
        player2Db.bladeDiscreteElo += user2Change;

        // Clamp this metric to 0.
        player1Db.bladeDiscreteElo = player1Db.bladeDiscreteElo < 0 ? 0 : player1Db.bladeDiscreteElo;
        player2Db.bladeDiscreteElo = player2Db.bladeDiscreteElo < 0 ? 0 : player2Db.bladeDiscreteElo;

    }
    else if (duelType == 'bomb') {
        // Create generic player to send
        generic1 = {
            pq: player1Db.bombPQ,
            elo: player1Db.bombElo,
            discreteElo: player1Db.bombDiscreteElo,
        };
        generic2 = {
            pq: player2Db.bombPQ,
            elo: player2Db.bombElo,
            discreteElo: player2Db.bombDiscreteElo,
        };

        // Update the elo.
        player1Db.bombElo += updateElo(generic1, generic2, score1, score2, roundsPlayed, 400, 32);
        player2Db.bombElo += updateElo(generic2, generic1, score2, score1, roundsPlayed, 400, 32);

        // Update the pq.
        const pqDelta = updateRoundPQ(generic1, generic2, score1, score2, roundsPlayed, 10, 10);
        player1Db.bombPQ += pqDelta;
        player2Db.bombPQ -= pqDelta;

        // Update the discrete elo.
        const { user1Change, user2Change } = updateDiscreteElo(generic1, generic2, score1, score2, roundsPlayed);

        player1Db.bombDiscreteElo += user1Change;
        player2Db.bombDiscreteElo += user2Change;

        // Clamp this metric to 0.
        player1Db.bombDiscreteElo = player1Db.bombDiscreteElo < 0 ? 0 : player1Db.bombDiscreteElo;
        player2Db.bombDiscreteElo = player2Db.bombDiscreteElo < 0 ? 0 : player2Db.bombDiscreteElo;
    }

    // Save to the database.
    await player1Db.save();
    await player2Db.save();
};


module.exports = {
    addRecord,
};