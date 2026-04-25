'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const tipSchema = new Schema({
  tipId: { type: Number, unique: true },
  text: String,
  category: String,
  evidenceRef: String,
});

module.exports = mongoose.models.Tip || mongoose.model('Tip', tipSchema, 'tips');
