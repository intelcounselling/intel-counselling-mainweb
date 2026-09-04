import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// SQLITE_PATH override lets tests run against an isolated database file
const DB_PATH = process.env.SQLITE_PATH || join(__dirname, '..', 'database.sqlite');

let db;

function getDb() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Failed to open SQLite database:', err.message);
      } else {
        console.log('Connected to SQLite database at', DB_PATH);
      }
    });

    // Enable WAL mode for better concurrent performance
    db.run('PRAGMA journal_mode=WAL;');

    // Create tables if they do not exist
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {
      // Add columns if they don't exist (idempotent migration)
      db.all("PRAGMA table_info(users)", (err, rows) => {
        if (!err && rows) {
          if (!rows.some(r => r.name === 'otp_code')) {
            db.run('ALTER TABLE users ADD COLUMN otp_code TEXT', () => {});
          }
          if (!rows.some(r => r.name === 'otp_expires_at')) {
            db.run('ALTER TABLE users ADD COLUMN otp_expires_at DATETIME', () => {});
          }
          if (!rows.some(r => r.name === 'otp_attempts')) {
            db.run('ALTER TABLE users ADD COLUMN otp_attempts INTEGER DEFAULT 0', () => {});
          }
          if (!rows.some(r => r.name === 'token_version')) {
            db.run('ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 0', () => {});
          }
          // Purpose-scoped OTPs: a code issued for email verification can never
          // be replayed against password reset (and vice versa).
          if (!rows.some(r => r.name === 'otp_purpose')) {
            db.run('ALTER TABLE users ADD COLUMN otp_purpose TEXT', () => {});
          }
          // Per-account resend cooldown timestamp (ISO string).
          if (!rows.some(r => r.name === 'otp_last_sent_at')) {
            db.run('ALTER TABLE users ADD COLUMN otp_last_sent_at DATETIME', () => {});
          }
          // Email verification flag. NULL = legacy account created before
          // verification existed — treated as verified (grandfathered) so
          // existing users are never locked out. 0 = pending verification.
          if (!rows.some(r => r.name === 'email_verified')) {
            db.run('ALTER TABLE users ADD COLUMN email_verified INTEGER', () => {});
          }
        }
      });
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS assessment_results (
        id TEXT PRIMARY KEY,
        encrypted_answers TEXT NOT NULL,
        iv TEXT NOT NULL,
        user_id TEXT,
        test_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {
      // Add columns if they don't already exist (idempotent migration)
      db.all("PRAGMA table_info(assessment_results)", (err, rows) => {
        if (!err && rows) {
          if (!rows.some(r => r.name === 'user_id')) {
            db.run('ALTER TABLE assessment_results ADD COLUMN user_id TEXT', () => {});
          }
          if (!rows.some(r => r.name === 'test_id')) {
            db.run('ALTER TABLE assessment_results ADD COLUMN test_id TEXT', () => {});
          }
          if (!rows.some(r => r.name === 'registration')) {
            db.run('ALTER TABLE assessment_results ADD COLUMN registration TEXT', () => {});
          }
          if (!rows.some(r => r.name === 'registration_iv')) {
            db.run('ALTER TABLE assessment_results ADD COLUMN registration_iv TEXT', () => {});
          }
          if (!rows.some(r => r.name === 'order_id')) {
            db.run('ALTER TABLE assessment_results ADD COLUMN order_id TEXT', () => {});
          }
          if (!rows.some(r => r.name === 'emailed_at')) {
            db.run('ALTER TABLE assessment_results ADD COLUMN emailed_at DATETIME', () => {});
          }
        }
      });
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id TEXT PRIMARY KEY,
        service_id TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'CREATED',
        result_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME
      )
    `, () => {
      // Indexes for the hot lookups (user results listing, email-based auth)
      db.run('CREATE INDEX IF NOT EXISTS idx_results_user ON assessment_results(user_id)', () => {});
      db.run('CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at)', () => {});
    });
  }
  return db;
}

export function insertResult(id, encryptedAnswers, iv, userId = null, testId = null) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.run(
      'INSERT INTO assessment_results (id, encrypted_answers, iv, user_id, test_id) VALUES (?, ?, ?, ?, ?)',
      [id, encryptedAnswers, iv, userId, testId],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

export function getResultById(id) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.get(
      'SELECT encrypted_answers, iv, user_id FROM assessment_results WHERE id = ?',
      [id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      }
    );
  });
}

export function createUser(id, name, email, password, phone) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.run(
      'INSERT INTO users (id, name, email, password, phone, email_verified) VALUES (?, ?, ?, ?, ?, 0)',
      [id, name, email, password, phone],
      function (err) {
        if (err) reject(err);
        else resolve(id);
      }
    );
  });
}

// Total registered accounts — diagnostic for the ephemeral-disk wipe issue.
export function countUsers() {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.get('SELECT COUNT(*) AS n FROM users', [], (err, row) => {
      if (err) reject(err);
      else resolve(row ? row.n : 0);
    });
  });
}

export function getUserByEmail(email) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
}

export function getUserById(id) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.get('SELECT id, token_version FROM users WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
}

// Invalidates every outstanding session token for a user (see token.js authenticateRequest)
export function bumpTokenVersion(userId) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.run(
      'UPDATE users SET token_version = COALESCE(token_version, 0) + 1 WHERE id = ?',
      [userId],
      function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      }
    );
  });
}

export function linkResultToUser(resultId, userId) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.run(
      // Only claim unowned results — never re-assign a result that already belongs to a user
      'UPDATE assessment_results SET user_id = ? WHERE id = ? AND user_id IS NULL',
      [userId, resultId],
      function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      }
    );
  });
}

export function getUserResults(userId) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.all(
      'SELECT id, test_id, created_at FROM assessment_results WHERE user_id = ? ORDER BY created_at DESC',
      [userId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
}

export function updateUserOTP(email, otpCode, expiresAt, purpose) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    // Store otp_last_sent_at as an ISO-8601 string — SQLite's CURRENT_TIMESTAMP
    // ('YYYY-MM-DD HH:MM:SS' UTC) is ambiguous to JS Date parsing and breaks
    // the resend-cooldown math across timezones.
    database.run(
      'UPDATE users SET otp_code = ?, otp_expires_at = ?, otp_purpose = ?, otp_last_sent_at = ?, otp_attempts = 0 WHERE email = ?',
      [otpCode, expiresAt, purpose, new Date().toISOString(), email],
      function (err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export function incrementOtpAttempts(email) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.run(
      'UPDATE users SET otp_attempts = COALESCE(otp_attempts, 0) + 1 WHERE email = ?',
      [email],
      function (err) {
        if (err) return reject(err);
        database.get('SELECT otp_attempts FROM users WHERE email = ?', [email], (err2, row) => {
          if (err2) reject(err2);
          else resolve(row ? row.otp_attempts : 0);
        });
      }
    );
  });
}

export function clearUserOTP(email) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.run(
      'UPDATE users SET otp_code = NULL, otp_expires_at = NULL, otp_purpose = NULL, otp_attempts = 0 WHERE email = ?',
      [email],
      function (err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

// Marks an account as email-verified and consumes any pending OTP.
export function setUserEmailVerified(email) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.run(
      'UPDATE users SET email_verified = 1, otp_code = NULL, otp_expires_at = NULL, otp_purpose = NULL, otp_attempts = 0 WHERE email = ?',
      [email],
      function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      }
    );
  });
}

export function updateUserPassword(email, newPasswordHash) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.run(
      'UPDATE users SET password = ? WHERE email = ?',
      [newPasswordHash, email],
      function (err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export function markOrderUsed(orderId) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.run(
      // Only a PAID order can be consumed, and only once
      "UPDATE orders SET status = 'USED', updated_at = CURRENT_TIMESTAMP WHERE order_id = ? AND status = 'PAID'",
      [orderId],
      function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      }
    );
  });
}

export function resetUserPassword(email, newPasswordHash) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.run(
      'UPDATE users SET password = ?, otp_code = NULL, otp_expires_at = NULL, otp_purpose = NULL, otp_attempts = 0 WHERE email = ?',
      [newPasswordHash, email],
      function (err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

// --- Orders (payment status lives server-side, never trusted from the client) ---

export function createOrder(orderId, serviceId, amount) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.run(
      'INSERT INTO orders (order_id, service_id, amount) VALUES (?, ?, ?)',
      [orderId, serviceId, amount],
      function (err) {
        if (err) reject(err);
        else resolve(orderId);
      }
    );
  });
}

export function getOrder(orderId) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.get('SELECT * FROM orders WHERE order_id = ?', [orderId], (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
}

export function markOrderPaid(orderId) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.run(
      "UPDATE orders SET status = 'PAID', updated_at = CURRENT_TIMESTAMP WHERE order_id = ?",
      [orderId],
      function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      }
    );
  });
}

export function linkOrderToResult(orderId, resultId) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.run(
      // Single-use: only claim an order not already linked to another result
      'UPDATE orders SET result_id = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ? AND result_id IS NULL',
      [resultId, orderId],
      function (err) {
        if (err) return reject(err);
        if (this.changes === 0) return resolve(false);
        database.run(
          'UPDATE assessment_results SET order_id = ? WHERE id = ?',
          [orderId, resultId],
          function (err2) {
            if (err2) reject(err2);
            else resolve(true);
          }
        );
      }
    );
  });
}

export function saveResultRegistration(resultId, encryptedRegistration, iv) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.run(
      'UPDATE assessment_results SET registration = ?, registration_iv = ? WHERE id = ?',
      [encryptedRegistration, iv, resultId],
      function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      }
    );
  });
}

export function getResultFull(id) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.get(
      'SELECT encrypted_answers, iv, user_id, test_id, order_id, registration, registration_iv, emailed_at FROM assessment_results WHERE id = ?',
      [id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      }
    );
  });
}

export function markResultEmailed(resultId) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.run(
      'UPDATE assessment_results SET emailed_at = CURRENT_TIMESTAMP WHERE id = ?',
      [resultId],
      function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      }
    );
  });
}

// Initialize DB on module load
getDb();
