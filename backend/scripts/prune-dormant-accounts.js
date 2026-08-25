// Enforces the retention policy published in the privacy notice: accounts with no
// sign-in for DORMANT_ACCOUNT_MONTHS are deleted. Run periodically (e.g. monthly cron):
//   node backend/scripts/prune-dormant-accounts.js
// Pass --dry-run to list what would be deleted without deleting anything.

const mongoose = require('mongoose');
const config = require('../config');
const User = require('../models/User');

const DORMANT_ACCOUNT_MONTHS = 24;
const dryRun = process.argv.includes('--dry-run');

async function pruneDormantAccounts() {
  await mongoose.connect(config.mongoUri);

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - DORMANT_ACCOUNT_MONTHS);

  // Accounts that have never been signed in to fall back to their creation date,
  // so a signup that was never used is still eventually cleaned up.
  const query = {
    $or: [
      { lastLoginAt: { $lt: cutoff } },
      { lastLoginAt: { $exists: false }, createdAt: { $lt: cutoff } },
      { lastLoginAt: null, createdAt: { $lt: cutoff } },
    ],
  };

  const dormant = await User.find(query).select('username lastLoginAt createdAt');

  if (dormant.length === 0) {
    console.log(`No accounts dormant for ${DORMANT_ACCOUNT_MONTHS}+ months.`);
  } else {
    console.log(`${dormant.length} dormant account(s) past the ${DORMANT_ACCOUNT_MONTHS} month cutoff:`);
    for (const user of dormant) {
      console.log(`  ${user.username} (last active ${(user.lastLoginAt ?? user.createdAt).toISOString()})`);
    }

    if (dryRun) {
      console.log('\nDry run — nothing deleted.');
    } else {
      const { deletedCount } = await User.deleteMany(query);
      console.log(`\nDeleted ${deletedCount} account(s).`);
    }
  }

  await mongoose.disconnect();
}

pruneDormantAccounts().catch(async (error) => {
  console.error('Prune failed:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});
