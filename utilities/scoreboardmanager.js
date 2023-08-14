const { EloPlayer } = require('../models/eloPlayer');
const { Scoreboard } = require('../models/scoreboard');

const updateLeaderboard = async (interaction, duelType) => {
    // Check if we have a scoreboard object already.
    const scoreboardDB = await Scoreboard.findOne({ name: `${duelType} Leaderboard` });

    if (!scoreboardDB) {
        throw new Error('Could not find an existing scoreboard.');
    }

    // Update the scoreboard.
    const channel = interaction.client.channels.cache.get(scoreboardDB.channelID);
    const fetchedMessage = await channel.messages.fetch(scoreboardDB.messageID);
    let leaderboardMessage = '---------------- Top 5 ----------------\n';

    const sortKey = `${duelType}DiscreteElo`;
    const players = await EloPlayer.find({}).sort({ [sortKey]: -1 }).limit(100);

    let i = 1;
    for (const player of players) {
        if (i === 1) {
            leaderboardMessage += `**${i}) ${player[`${duelType}DiscreteElo`].toFixed(0)} elo - <@${player.discordID}>**\n`;
        }
        else if (i <= 5) {
            leaderboardMessage += `${i}) ${player[`${duelType}DiscreteElo`].toFixed(0)} elo - <@${player.discordID}>\n`;
        }
        else {
            leaderboardMessage += `${i}) ${player[`${duelType}DiscreteElo`].toFixed(0)} elo - <@${player.discordID}>\n`;
        }

        if (i === 5) {
            leaderboardMessage += '----------------------------------------\n';
        }
        i++;
    }

    // Add this styling if there are less than 5 players to close off the top 5.
    if (i < 5) {
        leaderboardMessage += '----------------------------------------\n';
    }

    fetchedMessage.edit(leaderboardMessage);
};

module.exports = {
    updateLeaderboard,
};