const mongoose = require('mongoose');
const scoreboardSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  guildID: { type: String },
  channelID: { type: String },
  messageID: { type: String },
});
const Scoreboard = mongoose.model('scoreboard', scoreboardSchema);
module.exports = { Scoreboard };