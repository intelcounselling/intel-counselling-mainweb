import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// Storage driver selection
//
//   production (Render):  DATABASE_URL is set → PostgreSQL (Supabase). Data
//                         persists across redeploys/restarts.
//   local dev / CI:       no DATABASE_URL → the original file-based SQLite
//                         (SQLITE_PATH override supported, used by tests).
//
// All queries are written once with `?` placeholders and translated to `$n`
// for Postgres, so every function below has a single SQL source of truth.
// ---------------------------------------------------------------------------
const USE_PG = !!process.env.DATABASE_URL;

let pgPool = null;
let sqliteDb = null;
let readyPromise = null;

function pgSql(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

async function initPg() {
  const { default: pg } = await import('pg');
  let ssl;
  try {
    const host = new URL(process.env.DATABASE_URL).hostname;
    // Supabase poolers present certificates Node cannot verify against the
    // default CA bundle, so relax verification for non-local hosts.
    ssl = /localhost|127\.0\.0\.1|::1/.test(host)
      ? false
      : { rejectUnauthorized: false };
  } catch (_) {
    ssl = { rejectUnauthorized: false };
  }
  pgPool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl });
  pgPool.on('error', (err) => console.error('Postgres pool error:', err.message));

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      otp_code TEXT,
      otp_expires_at TIMESTAMPTZ,
      otp_purpose TEXT,
      otp_last_sent_at TIMESTAMPTZ,
      otp_attempts INTEGER DEFAULT 0,
      token_version INTEGER DEFAULT 0,
      email_verified INTEGER
    )
  `);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS assessment_results (
      id TEXT PRIMARY KEY,
      encrypted_answers TEXT NOT NULL,
      iv TEXT NOT NULL,
      user_id TEXT,
      test_id TEXT,
      registration TEXT,
      registration_iv TEXT,
      order_id TEXT,
      emailed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id TEXT PRIMARY KEY,
      service_id TEXT NOT NULL,
      amount DOUBLE PRECISION NOT NULL,
      status TEXT NOT NULL DEFAULT 'CREATED',
      result_id TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ
    )
  `);
  await pgPool.query('CREATE INDEX IF NOT EXISTS idx_results_user ON assessment_results(user_id)');
  await pgPool.query('CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at)');
  console.log('Connected to PostgreSQL database (persistent — survives redeploys)');
}

async function initSqlite() {
  const { default: sqlite3 } = await import('sqlite3');
  const DB_PATH = process.env.SQLITE_PATH || join(__dirname, '..', 'database.sqlite');
  sqliteDb = await new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => (err ? reject(err) : resolve(db)));
  });
  console.log('Connected to SQLite database at', DB_PATH);

  const runSqlite = (sql, params = []) =>
    new Promise((resolve, reject) => {
      sqliteDb.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });

  await runSqlite('PRAGMA journal_mode = WAL');
  await runSqlite(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await runSqlite(`
    CREATE TABLE IF NOT EXISTS assessment_results (
      id TEXT PRIMARY KEY,
      encrypted_answers TEXT NOT NULL,
      iv TEXT NOT NULL,
      user_id TEXT,
      test_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await runSqlite(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id TEXT PRIMARY KEY,
      service_id TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'CREATED',
      result_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME
    )
  `);
  await runSqlite('CREATE INDEX IF NOT EXISTS idx_results_user ON assessment_results(user_id)');
  await runSqlite('CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at)');

  // Idempotent column migrations (SQLite has no ADD COLUMN IF NOT EXISTS)
  const addColumn = async (table, column, ddl) => {
    const cols = await new Promise((resolve, reject) => {
      sqliteDb.all(`PRAGMA table_info(${table})`, (err, rows) => (err ? reject(err) : resolve(rows || [])));
    });
    if (!cols.some((r) => r.name === column)) {
      await runSqlite(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
    }
  };
  await addColumn('users', 'otp_code', 'TEXT');
  await addColumn('users', 'otp_expires_at', 'DATETIME');
  await addColumn('users', 'otp_purpose', 'TEXT');
  await addColumn('users', 'otp_last_sent_at', 'DATETIME');
  await addColumn('users', 'otp_attempts', 'INTEGER DEFAULT 0');
  await addColumn('users', 'token_version', 'INTEGER DEFAULT 0');
  await addColumn('users', 'email_verified', 'INTEGER');
  await addColumn('assessment_results', 'registration', 'TEXT');
  await addColumn('assessment_results', 'registration_iv', 'TEXT');
  await addColumn('assessment_results', 'order_id', 'TEXT');
  await addColumn('assessment_results', 'emailed_at', 'DATETIME');
}

function ready() {
  if (!readyPromise) {
    readyPromise = (USE_PG ? initPg() : initSqlite()).catch((err) => {
      readyPromise = null;
      throw err;
    });
  }
  return readyPromise;
}

// --- unified query helpers -------------------------------------------------

async function all(sql, params = []) {
  await ready();
  if (USE_PG) {
    const result = await pgPool.query(pgSql(sql), params);
    return result.rows;
  }
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
  });
}

async function get(sql, params = []) {
  const rows = await all(sql, params);
  return rows[0] || null;
}

// Resolves with the number of affected rows (this.changes / rowCount).
async function run(sql, params = []) {
  await ready();
  if (USE_PG) {
    const result = await pgPool.query(pgSql(sql), params);
    return result.rowCount ?? 0;
  }
  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
}

// --- Users ------------------------------------------------------------------

export function createUser(id, name, email, password, phone) {
  return run(
    'INSERT INTO users (id, name, email, password, phone, email_verified) VALUES (?, ?, ?, ?, ?, 0)',
    [id, name, email, password, phone]
  ).then(() => id);
}

export async function getUserByEmail(email) {
  return get('SELECT * FROM users WHERE email = ?', [email]);
}

export async function getUserById(id) {
  return get('SELECT id, token_version FROM users WHERE id = ?', [id]);
}

// Invalidates every outstanding session token for a user (see token.js authenticateRequest)
export async function bumpTokenVersion(userId) {
  const changes = await run(
    'UPDATE users SET token_version = COALESCE(token_version, 0) + 1 WHERE id = ?',
    [userId]
  );
  return changes > 0;
}

export async function linkResultToUser(resultId, userId) {
  // Only claim unowned results — never re-assign a result that already belongs to a user
  const changes = await run(
    'UPDATE assessment_results SET user_id = ? WHERE id = ? AND user_id IS NULL',
    [userId, resultId]
  );
  return changes > 0;
}

export async function getUserResults(userId) {
  return all(
    'SELECT id, test_id, order_id, created_at FROM assessment_results WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
}

// A result with a linked order was paid (orders are only linked to results
// after the payment webhook verifies them). Counting these for a user gives
// their career-test purchase entitlement — retakes and result re-views are
// free once they own at least one paid career result.
export async function getPaidCareerResultCount(userId) {
  const row = await get(
    "SELECT COUNT(*) AS n FROM assessment_results WHERE user_id = ? AND test_id = 'career' AND order_id IS NOT NULL",
    [userId]
  );
  return row ? Number(row.n) : 0;
}

// Total registered accounts — diagnostic for the ephemeral-disk wipe issue.
export async function countUsers() {
  const row = await get('SELECT COUNT(*) AS n FROM users');
  return row ? Number(row.n) : 0;
}

export async function updateUserOTP(email, otpCode, expiresAt, purpose) {
  // Store otp_last_sent_at as an ISO-8601 string so the resend-cooldown math
  // is unambiguous in both drivers (SQLite has no native timezone type).
  await run(
    'UPDATE users SET otp_code = ?, otp_expires_at = ?, otp_purpose = ?, otp_last_sent_at = ?, otp_attempts = 0 WHERE email = ?',
    [otpCode, expiresAt, purpose, new Date().toISOString(), email]
  );
}

export async function incrementOtpAttempts(email) {
  await run(
    'UPDATE users SET otp_attempts = COALESCE(otp_attempts, 0) + 1 WHERE email = ?',
    [email]
  );
  const row = await get('SELECT otp_attempts FROM users WHERE email = ?', [email]);
  return row ? row.otp_attempts : 0;
}

export async function clearUserOTP(email) {
  await run(
    'UPDATE users SET otp_code = NULL, otp_expires_at = NULL, otp_purpose = NULL, otp_attempts = 0 WHERE email = ?',
    [email]
  );
}

// Marks an account as email-verified and consumes any pending OTP.
export async function setUserEmailVerified(email) {
  const changes = await run(
    'UPDATE users SET email_verified = 1, otp_code = NULL, otp_expires_at = NULL, otp_purpose = NULL, otp_attempts = 0 WHERE email = ?',
    [email]
  );
  return changes > 0;
}

export async function updateUserPassword(email, newPasswordHash) {
  await run('UPDATE users SET password = ? WHERE email = ?', [newPasswordHash, email]);
}

export async function resetUserPassword(email, newPasswordHash) {
  await run(
    'UPDATE users SET password = ?, otp_code = NULL, otp_expires_at = NULL, otp_purpose = NULL, otp_attempts = 0 WHERE email = ?',
    [newPasswordHash, email]
  );
}

// --- Assessment results -----------------------------------------------------

export async function insertResult(id, encryptedAnswers, iv, userId = null, testId = null) {
  await run(
    'INSERT INTO assessment_results (id, encrypted_answers, iv, user_id, test_id) VALUES (?, ?, ?, ?, ?)',
    [id, encryptedAnswers, iv, userId, testId]
  );
  return id;
}

export async function getResultById(id) {
  return get(
    'SELECT encrypted_answers, iv, user_id FROM assessment_results WHERE id = ?',
    [id]
  );
}

// --- Orders (payment status lives server-side, never trusted from the client) ---

export async function createOrder(orderId, serviceId, amount) {
  await run(
    'INSERT INTO orders (order_id, service_id, amount) VALUES (?, ?, ?)',
    [orderId, serviceId, amount]
  );
  return orderId;
}

export async function getOrder(orderId) {
  return get('SELECT * FROM orders WHERE order_id = ?', [orderId]);
}

export async function markOrderPaid(orderId) {
  const changes = await run(
    "UPDATE orders SET status = 'PAID', updated_at = CURRENT_TIMESTAMP WHERE order_id = ?",
    [orderId]
  );
  return changes > 0;
}

export async function markOrderUsed(orderId) {
  // Only a PAID order can be consumed, and only once
  const changes = await run(
    "UPDATE orders SET status = 'USED', updated_at = CURRENT_TIMESTAMP WHERE order_id = ? AND status = 'PAID'",
    [orderId]
  );
  return changes > 0;
}

export async function linkOrderToResult(orderId, resultId) {
  // Single-use: only claim an order not already linked to another result
  const claimed = await run(
    'UPDATE orders SET result_id = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ? AND result_id IS NULL',
    [resultId, orderId]
  );
  if (claimed === 0) return false;
  await run(
    'UPDATE assessment_results SET order_id = ? WHERE id = ?',
    [orderId, resultId]
  );
  return true;
}

export async function saveResultRegistration(resultId, encryptedRegistration, iv) {
  const changes = await run(
    'UPDATE assessment_results SET registration = ?, registration_iv = ? WHERE id = ?',
    [encryptedRegistration, iv, resultId]
  );
  return changes > 0;
}

export async function getResultFull(id) {
  return get(
    'SELECT encrypted_answers, iv, user_id, test_id, order_id, registration, registration_iv, emailed_at FROM assessment_results WHERE id = ?',
    [id]
  );
}

export async function markResultEmailed(resultId) {
  const changes = await run(
    'UPDATE assessment_results SET emailed_at = CURRENT_TIMESTAMP WHERE id = ?',
    [resultId]
  );
  return changes > 0;
}

// Initialize DB on module load
ready().catch((err) => console.error('Database initialization failed:', err.message));
