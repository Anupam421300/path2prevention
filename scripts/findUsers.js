'use strict';
require('dotenv').config();
const { connectDB } = require('../src/config/db');
const { User } = require('../src/models');

async function main() {
  await connectDB();
  const users = await User.find().sort({ createdAt: -1 }).limit(10).select('email createdAt');
  console.log('Recent users:');
  users.forEach(u => console.log(`  ${u.email}  (created: ${u.createdAt?.toISOString()})`));
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
