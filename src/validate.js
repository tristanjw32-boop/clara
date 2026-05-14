// Input validation for all MCP tool parameters.
// MCP tool args come from an orchestrating agent and must be treated as untrusted.

const ALLOWED_BUSINESS_IDS = new Set([
  'acme-plumbing',
  'riverside-consulting',
  'metro-bakery',
  'peak-fitness',
  'summit-hvac',
]);

const MAX_QUESTION_LENGTH = 1000;

// Patterns that indicate an attempt to override the system prompt
const INJECTION_PATTERNS = [
  /ignore (previous|prior|all|above) instructions/i,
  /disregard (previous|prior|all|above)/i,
  /you are now/i,
  /new instructions:/i,
  /system prompt/i,
  /\[INST\]/i,
  /<\|system\|>/i,
  /forget (everything|all)/i,
];

export function validateBusinessId(raw) {
  if (!raw) return null; // callers fall back to env default
  const id = String(raw).trim().toLowerCase();
  if (ALLOWED_BUSINESS_IDS.has(id)) return id;
  // QBO realm IDs are numeric strings (9–25 digits). loadBusiness() validates against DB.
  if (/^\d{9,25}$/.test(raw.trim())) return raw.trim();
  throw new Error(`Invalid business_id "${id}". Expected a fixture name or a QuickBooks realm ID.`);
}

export function validateQuestion(raw) {
  if (!raw || typeof raw !== 'string') throw new Error('question is required and must be a string');
  const q = raw.trim().slice(0, MAX_QUESTION_LENGTH);
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(q)) {
      throw new Error('Question contains disallowed content.');
    }
  }
  return q;
}

export function validateDays(raw) {
  const n = Number(raw ?? 90);
  if (![30, 60, 90].includes(n)) return 90;
  return n;
}

const MAX_SHORT_LENGTH = 200;

export function validateShortString(raw, fieldName) {
  if (!raw || typeof raw !== 'string') throw new Error(`${fieldName} is required`);
  const s = raw.trim().slice(0, MAX_SHORT_LENGTH);
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(s)) throw new Error(`${fieldName} contains disallowed content.`);
  }
  return s;
}
