import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '..', 'database.sqlite');

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
        }
      });
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS assessment_results (
        id TEXT PRIMARY KEY,
        encrypted_answers TEXT NOT NULL,
        iv TEXT NOT NULL,
        user_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {
      // Add column if it doesn't already exist (idempotent migration)
      db.all("PRAGMA table_info(assessment_results)", (err, rows) => {
        if (!err && rows && !rows.some(r => r.name === 'user_id')) {
          db.run('ALTER TABLE assessment_results ADD COLUMN user_id TEXT', () => {});
        }
      });
    });
  }
  return db;
}

export function insertResult(id, encryptedAnswers, iv, userId = null) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.run(
      'INSERT INTO assessment_results (id, encrypted_answers, iv, user_id) VALUES (?, ?, ?, ?)',
      [id, encryptedAnswers, iv, userId],
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
      'INSERT INTO users (id, name, email, password, phone) VALUES (?, ?, ?, ?, ?)',
      [id, name, email, password, phone],
      function (err) {
        if (err) reject(err);
        else resolve(id);
      }
    );
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

export function linkResultToUser(resultId, userId) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.run(
      'UPDATE assessment_results SET user_id = ? WHERE id = ?',
      [userId, resultId],
      function (err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export function getUserResults(userId) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.all(
      'SELECT id, created_at FROM assessment_results WHERE user_id = ? ORDER BY created_at DESC',
      [userId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
}

export function updateUserOTP(email, otpCode, expiresAt) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.run(
      'UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE email = ?',
      [otpCode, expiresAt, email],
      function (err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export function resetUserPassword(email, newPasswordHash) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.run(
      'UPDATE users SET password = ?, otp_code = NULL, otp_expires_at = NULL WHERE email = ?',
      [newPasswordHash, email],
      function (err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

// Initialize DB on module load
getDb();
