import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadFromQuickBooks } from './adapters/quickbooks.js';
import { query } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, '..', 'fixtures');

const FIXTURE_IDS = [
  'acme-plumbing',
  'riverside-consulting',
  'metro-bakery',
  'peak-fitness',
  'summit-hvac',
];

let fixtureCache = {};

function loadFixture(id) {
  if (!id) id = process.env.CLARA_BUSINESS_ID || 'acme-plumbing';
  if (fixtureCache[id]) return fixtureCache[id];
  if (!FIXTURE_IDS.includes(id)) {
    throw new Error(`Unknown business ID: "${id}". Available: ${FIXTURE_IDS.join(', ')}`);
  }
  const raw = readFileSync(join(FIXTURES_DIR, `${id}.json`), 'utf8');
  fixtureCache[id] = JSON.parse(raw);
  return fixtureCache[id];
}

// Routes to QuickBooks adapter if the business_id is a QBO realm_id (has a token in DB).
// Falls back to synthetic fixtures for demo IDs.
export async function loadBusiness(id) {
  if (!id) id = process.env.CLARA_BUSINESS_ID || 'acme-plumbing';

  // Fixture IDs always use synthetic data
  if (FIXTURE_IDS.includes(id)) return loadFixture(id);

  // Check if this ID corresponds to a QBO-connected business
  const { rows } = await query(
    'SELECT realm_id FROM qbo_tokens WHERE realm_id = $1',
    [id]
  );
  if (rows.length > 0) {
    return loadFromQuickBooks(id);
  }

  // Fall back to fixture if nothing matched
  throw new Error(`Unknown business ID: "${id}". Not a fixture and no QBO connection found.`);
}

export function listBusinesses() {
  return FIXTURE_IDS.map(id => {
    const b = loadFixture(id);
    return { id, name: b.business.name, industry: b.business.industry };
  });
}
