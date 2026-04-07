'use strict';
const express = require('express');
const router = express.Router();
const { ActivityGuide, EvidenceSource } = require('../models');

// GET /api/activity-guides — used by log.js
router.get('/activity-guides', async (req, res, next) => {
  try {
    const guides = await ActivityGuide.find({});
    res.json(guides);
  } catch (err) { next(err); }
});

// GET /api/content/evidence?ids=id1,id2,id3
// Returns EvidenceSource documents by sourceId for the Evidence Panel popup
router.get('/content/evidence', async (req, res, next) => {
  try {
    const ids = (req.query.ids || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!ids.length) return res.json([]);
    const sources = await EvidenceSource.find({ sourceId: { $in: ids } });
    res.json(sources);
  } catch (err) { next(err); }
});

module.exports = router;
