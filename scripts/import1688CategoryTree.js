/**
 * Imports the full 1688 category tree into Firestore.
 *
 * Before this runs, `1688Category` holds only the 59 root categories. Their
 * children exist purely as bare id arrays (level2 / level3) with no names and
 * no parent links, so the admin UI cannot show, search, or price them.
 *
 * This script walks the 1688 translation API from each root downwards and
 * writes ONE document per category at every level, carrying the ancestry that
 * the rates explorer needs:
 *
 *   categoryId, translatedName, chineseName, level, parentCateId, leaf
 *   ancestors  [rootId, ..., parentId]   ordered, [] for a root
 *   pathNames  ["Agriculture", "Feed"]   same order, for breadcrumbs
 *   searchName lowercased name, for the search box
 *
 * Prices are left alone. Whatever rates a category already carries are
 * recorded as that category's OWN rates, and every descendant without its own
 * price inherits the nearest priced ancestor's — materialised into the flat
 * parcel/ten/eleven/... fields so the customer app keeps reading them
 * unchanged.
 *
 * Usage:
 *   node scripts/import1688CategoryTree.js --dry-run       # fetch + report, no writes
 *   node scripts/import1688CategoryTree.js --root=1        # one root only
 *   node scripts/import1688CategoryTree.js                 # full import (resumable)
 *   node scripts/import1688CategoryTree.js --fresh         # ignore the checkpoint
 *
 * Needs Node 18+ (the default `node` here is v14 and fails on node:crypto):
 *   ~/.nvm/versions/node/v20.18.3/bin/node scripts/import1688CategoryTree.js
 */
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const CryptoJS = require('crypto-js');
const qs = require('qs');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const serviceAccount = require(path.join(
  __dirname,
  '../src/firebase/paicart-firebase-adminsdk-o3ae6-d93c2a1069.json'
));

admin.initializeApp({ credential: admin.cert(serviceAccount) });
const db = getFirestore();

const DRY_RUN = process.argv.includes('--dry-run');
const FRESH = process.argv.includes('--fresh');
const ROOT_ARG = (process.argv.find((a) => a.startsWith('--root=')) || '').split('=')[1];

const CHECKPOINT = path.join(__dirname, '.import1688CategoryTree.checkpoint.json');
const CONCURRENCY = 4;
const MAX_RETRIES = 3;

const AIR_FIELDS = ['parcel', 'ten', 'eleven', 'above_100kg'];
const SEA_FIELDS = ['100kg', 'below_1000kg', 'above_1000kg'];

// --- 1688 API ---------------------------------------------------------------

const APP_SECRET = 'U1IH8T6UoQxf';
const ACCESS_TOKEN = '793b6857-359d-494b-bc2b-e3b37bc87c12';
const URI_PATH =
  'param2/1/com.alibaba.fenxiao.crossborder/category.translation.getById/9077165';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchCategory(categoryId, attempt = 1) {
  const params = { access_token: ACCESS_TOKEN, language: 'en', categoryId };
  const paramStr = Object.keys(params)
    .sort()
    .map((k) => k + params[k])
    .join('');
  const signature = CryptoJS.HmacSHA1(URI_PATH + paramStr, APP_SECRET)
    .toString(CryptoJS.enc.Hex)
    .toUpperCase();

  try {
    const res = await axios.post(
      `https://gw.open.1688.com/openapi/${URI_PATH}`,
      qs.stringify({
        language: 'en',
        categoryId,
        access_token: ACCESS_TOKEN,
        _aop_signature: signature,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 30000 }
    );
    return (res.data && res.data.result && res.data.result.result) || null;
  } catch (error) {
    if (attempt >= MAX_RETRIES) {
      console.log(`\n  ! ${categoryId}: giving up after ${attempt} attempts (${error.message})`);
      return null;
    }
    await sleep(500 * attempt);
    return fetchCategory(categoryId, attempt + 1);
  }
}

// --- Checkpoint -------------------------------------------------------------

function loadCheckpoint() {
  if (FRESH || !fs.existsSync(CHECKPOINT)) return { done: [], categories: {} };
  try {
    return JSON.parse(fs.readFileSync(CHECKPOINT, 'utf8'));
  } catch (error) {
    return { done: [], categories: {} };
  }
}

function saveCheckpoint(state) {
  if (DRY_RUN) return;
  fs.writeFileSync(CHECKPOINT, JSON.stringify(state));
}

// --- Tree walk --------------------------------------------------------------

/**
 * Expands `parents` one level down, in parallel batches. Returns the child
 * categories found, each stamped with its parent's ancestry.
 */
async function expandLevel(parents, collected, state) {
  const next = [];
  const doneSet = new Set(state.done);

  // A checkpointed parent's children were already fetched on an earlier run —
  // replay them instead of spending another API call.
  parents
    .filter((p) => doneSet.has(String(p.categoryId)))
    .forEach((p) => {
      (state.categories[String(p.categoryId)] || []).forEach((child) => {
        collected.set(String(child.categoryId), child);
        next.push(child);
      });
    });

  const pending = parents.filter((p) => !p.leaf && !doneSet.has(String(p.categoryId)));
  const skipped = parents.length - pending.length;
  if (skipped > 0) console.log(`  (${skipped} leaf or already expanded)`);

  for (let i = 0; i < pending.length; i += CONCURRENCY) {
    const chunk = pending.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      chunk.map(async (parent) => ({
        parent,
        children: ((await fetchCategory(parent.categoryId)) || {}).children || [],
      }))
    );

    for (const { parent, children } of results) {
      const stamped = children.map((c) => ({
        categoryId: Number(c.categoryId),
        translatedName: c.translatedName || c.chineseName || String(c.categoryId),
        chineseName: c.chineseName || '',
        level: String(c.level),
        parentCateId: Number(parent.categoryId),
        leaf: String(c.leaf) === 'true' || c.leaf === true,
        ancestors: [...parent.ancestors, parent.categoryId],
        pathNames: [...parent.pathNames, parent.translatedName],
      }));

      stamped.forEach((child) => {
        collected.set(String(child.categoryId), child);
        next.push(child);
      });

      state.done.push(String(parent.categoryId));
      state.categories[String(parent.categoryId)] = stamped;
    }

    saveCheckpoint(state);
    process.stdout.write(
      `\r  expanded ${Math.min(i + CONCURRENCY, pending.length)}/${pending.length} parents, ${collected.size} categories so far`
    );
  }

  if (pending.length > 0) process.stdout.write('\n');
  return next;
}

// --- Rate resolution --------------------------------------------------------

const hasValue = (v) => v !== undefined && v !== null && String(v).trim() !== '';

function pickRates(data, fields) {
  const out = {};
  let any = false;
  fields.forEach((f) => {
    if (hasValue(data[f])) {
      out[f] = String(data[f]);
      any = true;
    }
  });
  return any ? out : null;
}

/**
 * Effective rates = this category's own rates, else the nearest ancestor that
 * has its own. `ownById` maps categoryId -> own rates (or null).
 */
function resolve(node, ownById) {
  const own = ownById[String(node.categoryId)];
  if (own) return { rates: own, source: 'own', from: node.categoryId };

  for (let i = node.ancestors.length - 1; i >= 0; i--) {
    const ancestorOwn = ownById[String(node.ancestors[i])];
    if (ancestorOwn) {
      return { rates: ancestorOwn, source: 'inherited', from: node.ancestors[i] };
    }
  }
  return { rates: null, source: 'none', from: null };
}

// --- Main -------------------------------------------------------------------

async function main() {
  console.log(`Importing the 1688 category tree${DRY_RUN ? ' (dry run)' : ''}...\n`);

  const snap = await db.collection('1688Category').get();
  const existing = new Map();
  snap.forEach((d) => existing.set(d.id, d.data()));

  let roots = snap.docs
    .map((d) => d.data())
    .filter((x) => String(x.level) === '1' || Number(x.parentCateId) === 0)
    .map((x) => ({
      categoryId: Number(x.categoryId),
      translatedName: x.translatedName || String(x.categoryId),
      chineseName: x.chineseName || '',
      level: '1',
      parentCateId: 0,
      leaf: false, // always probe a root; its stored leaf flag is unreliable
      ancestors: [],
      pathNames: [],
    }));

  if (ROOT_ARG) roots = roots.filter((r) => String(r.categoryId) === String(ROOT_ARG));

  console.log(`${roots.length} root categor${roots.length === 1 ? 'y' : 'ies'} to walk.\n`);

  const state = loadCheckpoint();
  if (state.done.length > 0) {
    console.log(`Resuming: ${state.done.length} parent(s) already expanded.\n`);
  }

  const collected = new Map();
  roots.forEach((r) => collected.set(String(r.categoryId), r));

  let level = roots;
  let depth = 1;
  while (level.length > 0 && depth < 8) {
    console.log(`Level ${depth} -> ${depth + 1}: expanding ${level.length} categor(ies)...`);
    level = await expandLevel(level, collected, state);
    depth += 1;
  }

  const all = [...collected.values()];
  const byLevel = all.reduce((acc, c) => {
    acc[c.level] = (acc[c.level] || 0) + 1;
    return acc;
  }, {});
  console.log(`\nCollected ${all.length} categories by level: ${JSON.stringify(byLevel)}\n`);

  // Whatever rates a category already carries are its OWN price — that is what
  // an admin set on the old page.
  const ownAirById = {};
  const ownSeaById = {};
  all.forEach((node) => {
    const prev = existing.get(String(node.categoryId));
    if (!prev) return;
    if (prev.ownAirRates) ownAirById[String(node.categoryId)] = prev.ownAirRates;
    else if (!prev.airRateSource) {
      // Legacy doc from before the tree existed: whatever rates it carries were
      // set on it directly. Once airRateSource exists the flag is the truth —
      // reading the flat fields back would promote INHERITED rates to own.
      const air = pickRates(prev, AIR_FIELDS);
      if (air) ownAirById[String(node.categoryId)] = air;
    }

    if (prev.ownSeaRates) ownSeaById[String(node.categoryId)] = prev.ownSeaRates;
    else if (!prev.seaRateSource) {
      const sea = pickRates(prev, SEA_FIELDS);
      if (sea) ownSeaById[String(node.categoryId)] = sea;
    }
  });

  console.log(
    `${Object.keys(ownAirById).length} categor(ies) have their own air price, ${Object.keys(ownSeaById).length} their own sea price.\n`
  );

  let created = 0;
  let updated = 0;

  for (let i = 0; i < all.length; i += 400) {
    const chunk = all.slice(i, i + 400);
    const batch = db.batch();

    for (const node of chunk) {
      const id = String(node.categoryId);
      const air = resolve(node, ownAirById);
      const sea = resolve(node, ownSeaById);

      const doc = {
        categoryId: node.categoryId,
        id: node.categoryId,
        translatedName: node.translatedName,
        chineseName: node.chineseName,
        language: 'en',
        level: node.level,
        parentCateId: node.parentCateId,
        leaf: node.leaf,
        ancestors: node.ancestors,
        pathNames: node.pathNames,
        searchName: node.translatedName.toLowerCase(),
        airRateSource: air.source,
        airInheritedFrom: air.source === 'inherited' ? air.from : null,
        seaRateSource: sea.source,
        seaInheritedFrom: sea.source === 'inherited' ? sea.from : null,
      };

      if (ownAirById[id]) doc.ownAirRates = ownAirById[id];
      if (ownSeaById[id]) doc.ownSeaRates = ownSeaById[id];

      // Materialised effective rates, so existing readers keep working.
      AIR_FIELDS.forEach((f) => {
        doc[f] = air.rates && hasValue(air.rates[f]) ? String(air.rates[f]) : '';
      });
      SEA_FIELDS.forEach((f) => {
        doc[f] = sea.rates && hasValue(sea.rates[f]) ? String(sea.rates[f]) : '';
      });

      if (existing.has(id)) updated += 1;
      else created += 1;

      if (!DRY_RUN) batch.set(db.collection('1688Category').doc(id), doc, { merge: true });
    }

    if (!DRY_RUN) await batch.commit();
    process.stdout.write(`\r  wrote ${Math.min(i + 400, all.length)}/${all.length}`);
  }

  process.stdout.write('\n');
  console.log(
    `\nDone. ${created} categor(ies) ${DRY_RUN ? 'would be' : 'were'} created, ${updated} updated.`
  );

  const sample = all.filter((c) => c.level === '3').slice(0, 5);
  if (sample.length > 0) {
    console.log('\nSample deep rows:');
    sample.forEach((c) =>
      console.log(`  ${[...c.pathNames, c.translatedName].join(' > ')}   (id ${c.categoryId})`)
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
