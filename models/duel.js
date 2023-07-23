const mongoose = require('mongoose');

const duelSchema = new mongoose.Schema({
  player1: { type: String },
  player2: { type: String },
  player1EloPrior: { type: Number },
  player2EloPrior: { type: Number },
  player1PQPrior: { type: Number },
  player2PQPrior: { type: Number },
  player1Score: { type: Number },
  player2Score: { type: Number },
  roundsPlayed: { type: Number },
  timestamp: { type: String },
});
const Duel = mongoose.model('Duel', duelSchema);
module.exports = { Duel };