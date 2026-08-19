// Copies the SQLite database (using the online backup API so an in-use DB is
// copied consistently) into backend/backups/ with a timestamped name and keeps
// the most recent 30 copies. Run manually or from cron / Task Scheduler:
//   node backend/scripts/backup-db.js
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'database.sqlite');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const KEEP = 30;

if (!fs.existsSync(DB_PATH)) {
  console.error('No database found at', DB_PATH);
  process.exit(1);
}
fs.mkdirSync(BACKUP_DIR, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const target = path.join(BACKUP_DIR, `database-${stamp}.sqlite`);

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Failed to open database:', err.message);
    process.exit(1);
  }
  // VACUUM INTO produces a consistent single-file snapshot even in WAL mode
  db.run(`VACUUM INTO '${target.replace(/'/g, "''")}'`, (verr) => {
    if (verr) {
      console.error('Backup failed:', verr.message);
      process.exit(1);
    }
    const size = (fs.statSync(target).size / 1024).toFixed(1);
    console.log(`Backup written: ${target} (${size} KB)`);

    const old = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith('database-') && f.endsWith('.sqlite'))
      .sort()
      .slice(0, -KEEP);
    old.forEach((f) => fs.unlinkSync(path.join(BACKUP_DIR, f)));
    if (old.length) console.log(`Pruned ${old.length} old backup(s); keeping ${KEEP}.`);
    db.close();
  });
});
