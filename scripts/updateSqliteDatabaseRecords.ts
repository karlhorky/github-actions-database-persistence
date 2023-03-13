import process from 'node:process';
import Database from 'better-sqlite3';
import { generateUniqueMessage } from '../util/messages.js';
import { tableFromRecords } from '../util/table.js';

const filePath = process.argv[2];

if (!filePath) {
  console.error(`File path missing. Usage:

  $ pnpm tsx scripts/updateSqliteDatabaseRows.ts data/persisted-to-cache/database.db
`);
  process.exit(1);
}

const db = new Database(filePath);
db.pragma('journal_mode = WAL');

// TODO: Fix null expiry_timestamp
//
// pnpm tsx scripts/updateSqliteDatabaseRows.ts data/persisted-to-cache/database.db
// Updated data/persisted-to-cache/database.db:
// - 2 non-expired existing records kept
// - 1 new records added

// ╔════╤═══════════════════════════════════╤══════════════════╗
// ║ id │ message                           │ expiry_timestamp ║
// ╟────┼───────────────────────────────────┼──────────────────╢
// ║ 1  │ Hello at 2023-03-13T07:12:01.175Z │ null             ║
// ╟────┼───────────────────────────────────┼──────────────────╢
// ║ 2  │ Hello at 2023-03-13T07:12:05.362Z │ null             ║
// ╟────┼───────────────────────────────────┼──────────────────╢
// ║ 3  │ Hello at 2023-03-13T07:14:07.348Z │ null             ║
// ╚════╧═══════════════════════════════════╧══════════════════╝
db.prepare(
  `
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT NOT NULL,
      expiry_timestamp TEXT DEFAULT (strftime('%Y-%m-%d', 'now', '+2 weeks'))
    )
  `,
).run();

const deletedRecords = db
  .prepare(
    `
    DELETE FROM messages
    WHERE expiry_timestamp < strftime('%Y-%m-%d', 'now')
    RETURNING *
  `,
  )
  .all();

const newRecords = [
  {
    message: generateUniqueMessage(),
  },
];

const insert = db.prepare(
  `
    INSERT INTO messages (message)
    VALUES (@message)
  `,
);

for (const newRecord of newRecords) {
  insert.run(newRecord);
}

const allRecords = db.prepare('SELECT * FROM messages').all();

console.log(
  `Updated ${filePath}:
${
  deletedRecords.length < 1
    ? ''
    : `- ${deletedRecords.length} expired records removed\n`
}- ${allRecords.length - newRecords.length} non-expired existing records kept
- ${newRecords.length} new records added\n`,
);

console.log(tableFromRecords(allRecords));
