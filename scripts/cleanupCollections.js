/**
 * Path2Prevention — One-Time DB Cleanup Script
 *
 * Drops collections that are no longer used by any backend route or frontend feature.
 * Run once: node scripts/cleanupCollections.js
 */

'use strict';
require('dotenv').config();
const mongoose = require('mongoose');

const COLLECTIONS_TO_DROP = [
  'push_subscriptions',   // PushSubscription — web push was never implemented (no web-push lib)
  'rule_versions',        // RuleVersion — no route reads/writes this collection
  'feedback',             // Feedback — /api/feedback route removed
  'personal_records',     // PersonalRecord — no route was ever created for this
];

async function main() {
  console.log('Connecting to MongoDB…');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const existing = (await db.listCollections().toArray()).map(c => c.name);
  console.log('Existing collections:', existing.join(', '));

  for (const col of COLLECTIONS_TO_DROP) {
    if (existing.includes(col)) {
      await db.dropCollection(col);
      console.log(`✅  Dropped: ${col}`);
    } else {
      console.log(`⏭   Not found (skipped): ${col}`);
    }
  }

  console.log('\nCleanup complete.');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
