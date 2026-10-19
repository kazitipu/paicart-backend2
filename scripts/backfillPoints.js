/**
 * One-time backfill: computes totalPoints (1 point per verified Tk paid)
 * and buyerLvl for every existing user, from their full payment history
 * across ordersApi, bookingRequest, and shipForMe.
 *
 * This only needs to run ONCE, before the points-awarding hooks in
 * firebase.utils.js (updatePaymentRequestStatus / updatePaymentRequestOrderStatus)
 * go live — those hooks handle everything going forward. Re-running this
 * script later is safe (it recomputes totalPoints from source-of-truth
 * payment history rather than incrementing), but any points already
 * awarded live for events that happened AFTER the last successful backfill
 * run are already reflected in `payments`, so recomputation stays correct.
 *
 * Usage:
 *   node scripts/backfillPoints.js            # writes the results
 *   node scripts/backfillPoints.js --dry-run  # preview only, no writes
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

const computeBuyerLvl = (totalPoints) => {
  if (totalPoints > 500000) return 4;
  if (totalPoints > 300000) return 3;
  if (totalPoints > 100000) return 2;
  return 1;
};

async function sumPaymentsByUser(collectionName) {
  const snap = await db.collection(collectionName).get();
  const totals = new Map(); // userId -> points
  let docsWithPayments = 0;

  snap.forEach((doc) => {
    const data = doc.data();
    const userId = data.userId;
    if (!userId || !Array.isArray(data.payments) || data.payments.length === 0) return;

    const docTotal = data.payments.reduce((sum, p) => sum + (parseInt(p.amount) || 0), 0);
    if (docTotal <= 0) return;

    docsWithPayments += 1;
    totals.set(userId, (totals.get(userId) || 0) + docTotal);
  });

  console.log(`  ${collectionName}: ${snap.size} docs, ${docsWithPayments} with payments`);
  return totals;
}

function mergeInto(target, source) {
  source.forEach((points, userId) => {
    target.set(userId, (target.get(userId) || 0) + points);
  });
}

async function main() {
  console.log(`Scanning payment history${DRY_RUN ? ' (dry run)' : ''}...`);

  const grandTotals = new Map();
  mergeInto(grandTotals, await sumPaymentsByUser('ordersApi'));
  mergeInto(grandTotals, await sumPaymentsByUser('bookingRequest'));
  mergeInto(grandTotals, await sumPaymentsByUser('shipForMe'));

  console.log(`\nFound payment history for ${grandTotals.size} users.\n`);

  const entries = [...grandTotals.entries()];
  let written = 0;
  let skippedNoUserDoc = 0;

  // Firestore batches cap at 500 writes.
  for (let i = 0; i < entries.length; i += 400) {
    const chunk = entries.slice(i, i + 400);
    const batch = db.batch();
    let batchHasWrites = false;

    for (const [userId, totalPoints] of chunk) {
      const userRef = db.collection('users').doc(userId);
      const userSnap = await userRef.get();
      if (!userSnap.exists) {
        skippedNoUserDoc += 1;
        continue;
      }
      const buyerLvl = computeBuyerLvl(totalPoints);
      console.log(`  user ${userId}: ${totalPoints.toLocaleString()} pts -> lvl ${buyerLvl}`);
      if (!DRY_RUN) {
        batch.update(userRef, { totalPoints, buyerLvl });
        batchHasWrites = true;
      }
      written += 1;
    }

    if (!DRY_RUN && batchHasWrites) {
      await batch.commit();
    }
  }

  console.log(`\nDone. ${written} users ${DRY_RUN ? 'would be' : 'were'} updated.`);
  if (skippedNoUserDoc > 0) {
    console.log(`Skipped ${skippedNoUserDoc} userId(s) with payment history but no matching users/{id} doc.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
