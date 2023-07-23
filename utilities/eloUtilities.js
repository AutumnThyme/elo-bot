    /**
     * Calculates the elo changes for user1.
     * Based on https://towardsdatascience.com/developing-a-generalized-elo-rating-system-for-multiplayer-games-b9b495e87802
     * @param {*} user1 The user we are computing the elo change for.
     * @param {*} user2 The user user1 was against.
     * @param {*} score1 The score for user1.
     * @param {*} score2 The score for user2.
     * @param {*} roundsPlayed The number of rounds played.
     * @param {*} discriminator The spread of the prediction function.
     * @param {*} kValue The max amount a user can increase or decrease their elo.
     */
const updateElo = (user1, user2, score1, score2, roundsPlayed, discriminator, kValue) => {
    // Find the probability that of a score.
    // Formula 1 / (1 + 10^((a - b) / d)) = (0 <= x <= 1), multiply by rounds played.
    const exponent = (user2.elo - user1.elo) / discriminator;
    const expectedScore = 1 / (1 + Math.pow(10, exponent));

    const observedScore = score1 > score2 ? 1 : 0;
    const scoreDiff = Math.abs((score1 - score2) / roundsPlayed);
    const probDiff = observedScore - expectedScore;

    const eloDelta = scoreDiff * kValue * probDiff;

    return eloDelta;
};

/**
 * Based on https://www.gamedeveloper.com/design/rising-from-the-ranks-rating-for-multiplayer-games
 * @param {*} user1 The first user in the duel.
 * @param {*} user2 The second user in the duel.
 * @param {*} score1 The first users score.
 * @param {*} score2 The second users score.
 * @param {*} roundsPlayed The number of rounds played.
 */
const updateRoundPQ = (user1, user2, score1, score2, roundsPlayed, temperature, max_gain) => {
    // Handle error case.
    if (roundsPlayed == 0) {
        throw 'Error: Cannot update player rating with 0 rounds played.';
    }

    // Calculate current user base statistics
    const fermi = (x, T) => 1 / (1 + Math.exp(-x / T));

    // Predict game result based on current PQ's.
    const deltaRating = user2.pq - user1.pq;
    const expectedResult = fermi(deltaRating, temperature);

    // Sample results from the game.
    let result = 1;

    // Clamp the result to (0,1)
    if (score1 < score2) {
        result = 0;
    }
    else if (score1 == score2) {
        result = 0.5;
    }

    // Update PQ's based on difference between expected and actual result.
    const pratingChange = max_gain * (result - expectedResult);

    return pratingChange;
};

module.exports = {
    updateElo,
    updateRoundPQ,
};