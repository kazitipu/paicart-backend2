/**
 * One-time backfill: gives every 1688Category document an `above_100kg` air
 * rate, seeded from that same category's `eleven` value (the "Above 5kg"
 * tier shown on /ship-for-me-2/air-1688).
 *
 * Run this once after the "Above 100kg" slot ships. Until it runs, the rates
 * table shows "—" for the new tier and the edit modal opens it empty.
 *
 * Re-running is safe: by default it only fills documents that are missing the
 * field, so rates an admin has since edited by hand are left alone. Pass
 * --overwrite to reset every document back to its "Above 5kg" rate.
 *
 * Usage:
 *   node scripts/backfillAbove100kgRate.js             # fill the gaps
 *   node scripts/backfillAbove100kgRate.js --dry-run   # preview only, no writes
 *   node scripts/backfillAbove100kgRate.js --overwrite  # reset every document
 */
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

const serviceAccount = require(path.join(
  __dirname,
  '../src/firebase/paicart-firebase-adminsdk-o3ae6-d93c2a1069.json'
));

admin.initializeApp({
  credential: admin.cert(serviceAccount),
});

const db = getFirestore();
const DRY_RUN = process.argv.includes('--dry-run');
const OVERWRITE = process.argv.includes('--overwrite');

// Rates are stored as strings elsewhere in this collection ("900", not 900),
// so keep the new field the same shape.
const isBlank = (value) =>
  value === undefined || value === null || String(value).trim() === '';

async function main() {
  console.log(
    `Backfilling above_100kg from eleven (Above 5kg)${
      DRY_RUN ? ' (dry run)' : ''
    }${OVERWRITE ? ' (overwrite mode)' : ''}...\n`
  );

  const snap = await db.collection('1688Category').get();
  console.log(`1688Category: ${snap.size} documents\n`);

  const pending = [];
  let alreadySet = 0;
  let skippedNoSource = 0;

  snap.forEach((doc) => {
    const data = doc.data();

    if (!OVERWRITE && !isBlank(data.above_100kg)) {
      alreadySet += 1;
      return;
    }

    // No "Above 5kg" rate to copy — leave the document untouched rather than
    // writing an empty or zero rate that would quietly undercharge.
    if (isBlank(data.eleven)) {
      skippedNoSource += 1;
      console.log(
        `  SKIP ${doc.id} (${data.translatedName || 'unnamed'}): no "Above 5kg" rate to copy`
      );
      return;
    }

    pending.push({ ref: doc.ref, id: doc.id, data });
  });

  console.log(
    `\n${pending.length} document(s) to update, ${alreadySet} already set, ${skippedNoSource} without a source rate.\n`
  );

  let written = 0;

  // Firestore batches cap at 500 writes.
  for (let i = 0; i < pending.length; i += 400) {
    const chunk = pending.slice(i, i + 400);
    const batch = db.batch();

    for (const { ref, id, data } of chunk) {
      const above_100kg = String(data.eleven);
      console.log(
        `  ${id} (${data.translatedName || 'unnamed'}): above_100kg -> ${above_100kg}`
      );
      if (!DRY_RUN) {
        batch.update(ref, { above_100kg });
      }
      written += 1;
    }

    if (!DRY_RUN && chunk.length > 0) {
      await batch.commit();
    }
  }

  console.log(
    `\nDone. ${written} document(s) ${DRY_RUN ? 'would be' : 'were'} updated.`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
