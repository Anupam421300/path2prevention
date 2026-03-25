'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { connectDB, mongoose } = require('../src/config/db');
const models = require('../src/models');
const seedData = require('../src/data/seedData');

async function importRules() {
  await connectDB();
  console.log('Connected to DB. Starting rule import...\n');

  try {
    // 1. Read and parse rule.md
    const rulePath = path.join(__dirname, '../rule.md');
    let rawContent = fs.readFileSync(rulePath, 'utf8');

    // Make sure to parse it exactly as JSON. 
    // If there is any markdown formatting (like ```json), strip it.
    if (rawContent.startsWith('```json')) {
      rawContent = rawContent.substring(7);
      if (rawContent.endsWith('```')) {
        rawContent = rawContent.substring(0, rawContent.length - 3);
      }
    } else if (rawContent.startsWith('```')) {
      rawContent = rawContent.substring(3);
      if (rawContent.endsWith('```')) {
        rawContent = rawContent.substring(0, rawContent.length - 3);
      }
    }

    const rulesData = JSON.parse(rawContent.trim());
    console.log(`Parsed rules for version: ${rulesData.version}`);

    // 2. Upsert Evidence Sources
    if (rulesData.evidenceSources && rulesData.evidenceSources.length > 0) {
      console.log(`Importing ${rulesData.evidenceSources.length} evidence sources...`);
      for (const source of rulesData.evidenceSources) {
        await models.EvidenceSource.findOneAndUpdate(
          { sourceId: source.sourceId },
          source,
          { upsert: true, new: true }
        );
      }
      console.log('✓ Evidence sources imported successfully.');
    }

    // 3. Keep the existing family history modifiers from seedData
    const familyHistoryMods = seedData.RULES.familyHistoryModifiers || {};

    // 4. Upsert RuleVersion
    await models.RuleVersion.findOneAndUpdate(
      { version: rulesData.version },
      { 
        version: rulesData.version, 
        active: true, 
        baseRules: rulesData.baseRules,
        familyHistoryModifiers: familyHistoryMods,
        conditionModifiers: [] 
      },
      { upsert: true }
    );
    console.log(`✓ Seeded rule version ${rulesData.version} and set to ACTIVE`);

    // Ensure older versions are no longer active, if we want only one active.
    await models.RuleVersion.updateMany(
      { version: { $ne: rulesData.version } },
      { active: false }
    );
    console.log('✓ Deactivated older rule versions.');

    console.log('\nSuccess! Rules imported.');
  } catch (err) {
    console.error('Error importing rules:', err);
  } finally {
    process.exit(0);
  }
}

importRules();
