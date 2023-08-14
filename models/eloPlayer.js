const mongoose = require('mongoose');

const eloPlayerSchema = new mongoose.Schema({
  discordID: { type: String, unique: true },

  // Bomb
  bombElo: { type: Number },
  bombPQ: { type: Number },
  bombDiscreteElo: { type: Number },

  // Blade
  bladeElo: { type: Number },
  bladePQ: { type: Number },
  bladeDiscreteElo: { type: Number },

  // Store all duels here and differentiate by duelType.
  duels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'duel' }],
});
const EloPlayer = mongoose.model('EloPlayer', eloPlayerSchema);
module.exports = { EloPlayer };