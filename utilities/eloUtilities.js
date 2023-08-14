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

class Tier {
    constructor(name, lowerRange, upperRange, lossModifier, victoryModifier, decayPenalty) {
        this.name = name;
        this.lowerRange = lowerRange;
        this.upperRange = upperRange;
        this.lossModifier = lossModifier;
        this.victoryModifier = victoryModifier;
        this.decayPenalty = decayPenalty;
    }

    userInTier(elo) {
        return this.lowerRange <= elo && elo < this.upperRange;
    }
}

const loss = modifier => (x) => x - modifier;
const win = modifier => (x) => Math.floor(x * modifier);

// Ensure these are sorted and have valid ranges.
const FixedEloTiers = [
    new Tier('D', 0, 450, loss(0), win(1.5), 0),
    new Tier('C', 450, 750, loss(3), win(1.25), 13),
    new Tier('B', 750, 1200, loss(5), win(1), 25),
    new Tier('A', 1200, 2250, loss(7), win(0.75), 75),
    new Tier('S', 2250, Infinity, loss(10), win(0.7), 100),
];

const findTier = (elo) => FixedEloTiers.find(x => x.userInTier(elo));

/**
 * This metric is based on Ishtars Elo Metric.
 * @param {*} user1 The first user in the duel.
 * @param {*} user2 The second user in the duel.
 * @param {*} score1 The first users score.
 * @param {*} score2 The second users score.
 * @param {*} roundsPlayed The number of rounds played.
 * @returns An object in the format of { user1Change: x, user2Change: x }
 */
const updateDiscreteElo = (user1, user2, score1, score2, roundsPlayed) => {
    if (roundsPlayed == 0) {
        throw new Error('Cannot record a duel with zero rounds.');
    }
    if (score1 == score2) {
        return {
            user1Change: 0,
            user2Change: 0,
        };
    }
    const user1Tier = findTier(user1.discreteElo);
    const user2Tier = findTier(user2.discreteElo);

    // Score difference metric is put into a fixed-value of some interval per point difference.
    const scoreDiff = (score1 - score2) / roundsPlayed;

    // Map max points to 30 and min to 3 (ties being 0)
    const eloDiff = Math.floor(scoreDiff * 30);

    let user1EloDiff = eloDiff;
    let user2EloDiff = -eloDiff;

    // If opponent greater, losses halved, winnings doubled.
    const isOpponentGreater = user1Tier.lowerRange < user2Tier.lowerRange;
    const isLoss = score1 < score2;
    const multiplier = (isOpponentGreater === isLoss) ? 0.5 : 2;
    user1EloDiff *= multiplier;
    user2EloDiff *= multiplier;

    // Apply loss and win rules
    if (isLoss) {
        user1EloDiff = user1Tier.lossModifier(user1EloDiff);
        user2EloDiff = user1Tier.victoryModifier(user2EloDiff);
    }
    else {
        user1EloDiff = user1Tier.victoryModifier(user1EloDiff);
        user2EloDiff = user1Tier.lossModifier(user2EloDiff);
    }

    return {
        user1Change: user1EloDiff,
        user2Change: user2EloDiff,
    };
};

module.exports = {
    updateElo,
    updateRoundPQ,
    updateDiscreteElo,
    findTier,
    FixedEloTiers,
};
