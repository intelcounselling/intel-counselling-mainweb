// Prints recent payment orders so you can check payments without opening the DB.
//   node backend/scripts/orders-report.js [days]   (default 30)
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'database.sqlite');
const days = Number(process.argv[2]) || 30;

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Failed to open database:', err.message);
    process.exit(1);
  }
});

db.all(
  `SELECT order_id, service_id, amount, status, result_id IS NOT NULL AS has_result, created_at
   FROM orders
   WHERE created_at >= datetime('now', ?)
   ORDER BY created_at DESC`,
  [`-${days} days`],
  (err, rows) => {
    if (err) {
      console.error('Query failed:', err.message);
      process.exit(1);
    }
    if (!rows.length) {
      console.log(`No orders in the last ${days} days.`);
    } else {
      const totals = {};
      console.log(`Orders in the last ${days} days:\n`);
      console.log('ORDER ID'.padEnd(26), 'SERVICE'.padEnd(24), 'AMOUNT'.padStart(8), '  STATUS'.padEnd(10), 'RESULT', 'CREATED');
      rows.forEach((r) => {
        console.log(
          r.order_id.padEnd(26),
          r.service_id.padEnd(24),
          String(r.amount).padStart(8),
          `  ${r.status}`.padEnd(10),
          r.has_result ? 'linked' : '-     ',
          r.created_at
        );
        totals[r.status] = (totals[r.status] || 0) + r.amount;
      });
      console.log('\nTotals by status:', Object.entries(totals).map(([s, a]) => `${s}: Rs.${a}`).join('  '));
    }
    db.close();
  }
);
