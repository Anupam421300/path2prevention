'use strict';
require('dotenv').config();
const { connectDB } = require('../src/config/db');
const models = require('../src/models');
const data = require('../src/data/seedData');

async function seed() {
  await connectDB();
  console.log('Connected. Seeding...\n');

  const ops = [
    ['EvidenceSource',  'sourceId',  data.EVIDENCE_SOURCES],
    ['Tip',             'tipId',     data.TIPS],
    ['ActivityGuide',   'type',      data.ACTIVITY_GUIDES],
  ];

  for (const [modelName, key, items] of ops) {
    const Model = models[modelName];
    for (const item of items) {
      await Model.findOneAndUpdate({ [key]: item[key] }, item, { upsert: true, new: true });
    }
    console.log(`✓ Seeded ${items.length} items → ${modelName}`);
  }

  console.log('\nAll seeds complete.');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
