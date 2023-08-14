const mongoose = require('mongoose');

const duelSchema = new mongoose.Schema({
  duelType: { type: String },
  adminName: { type: String },
  player1: { type: String },
  player2: { type: String },
  player1Score: { type: Number },
  player2Score: { type: Number },
  mod1: { type: String },
  mod2: { type: String },
  roundsPlayed: { type: Number },
  timestamp: { type: String },
});
const Duel = mongoose.model('Duel', duelSchema);
module.exports = { Duel };