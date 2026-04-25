'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const correlationSnapshotSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  computedAt: { type: Date, default: Date.now },
  windowDays: { type: Number, default: 28 },
  pairs: [{
    signalA: String,
    signalB: String,
    r: Number,
    n: Number,
    insight: String,
    actionSuggestion: String,
    _id: false,
  }],
});
correlationSnapshotSchema.index({ userId: 1, computedAt: -1 });

module.exports = mongoose.models.CorrelationSnapshot || mongoose.model('CorrelationSnapshot', correlationSnapshotSchema, 'correlation_snapshots');
