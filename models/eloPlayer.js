const mongoose = require('mongoose');

const eloPlayerSchema = new mongoose.Schema({
  discordID: { type: String, unique: true },
  elo: { type: Number },
  pq: { type: Number },
  duels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'duel' }],
});
const EloPlayer = mongoose.model('EloPlayer', eloPlayerSchema);
module.exports = { EloPlayer };