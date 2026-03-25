'use strict';
require('dotenv').config();
const { connectDB } = require('../src/config/db');
const { User, CorrelationSnapshot } = require('../src/models');

async function main() {
  await connectDB();
  const emailArg = process.argv.find(a => a.startsWith('--email='));
  const email = emailArg ? emailArg.split('=')[1] : null;
  
  let user;
  if (email) {
    user = await User.findOne({ email });
  } else {
    user = await User.findOne().sort({ createdAt: -1 });
  }
  if (!user) { console.log('No user found'); process.exit(1); }
  console.log('User:', user.email);

  const snap = await CorrelationSnapshot.findOne({ userId: user._id }).sort({ computedAt: -1 });
  if (!snap) {
    console.log('❌ No CorrelationSnapshot found for this user!');
  } else {
    console.log('✅ CorrelationSnapshot found:');
    console.log('  hasEnoughData:', snap.hasEnoughData);
    console.log('  pairs count:', snap.pairs?.length);
    console.log('  computedAt:', snap.computedAt);
    console.log('  pairs:', JSON.stringify(snap.pairs, null, 2));
  }
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
