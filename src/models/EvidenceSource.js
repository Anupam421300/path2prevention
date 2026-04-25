'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const evidenceSourceSchema = new Schema({
  sourceId: { type: String, unique: true },
  title: String,
  publisher: String,
  url: String,
  tags: [String],
  snippet: String,
});

module.exports = mongoose.models.EvidenceSource || mongoose.model('EvidenceSource', evidenceSourceSchema, 'evidence_sources');
