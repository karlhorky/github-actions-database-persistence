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

type Message = {
  id: number;
  message: string;
  expiry_timestamp: string;
};

const db = new Database(filePath);
db.pragma('journal_mode = WAL');

db.prepare(
  `
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT NOT NULL,
      expiry_timestamp TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+14 days'))
    )
  `,
).run();

const deletedRecords = db
  .prepare(
    `
      DELETE FROM messages
      WHERE expiry_timestamp < strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
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

const allRecords = db.prepare('SELECT * FROM messages').all() as Message[];

console.log(
  `Updated ${filePath}:
${
  deletedRecords.length < 1
    ? ''
    : `- ${deletedRecords.length} expired records removed\n`
}- ${allRecords.length - newRecords.length} non-expired existing records kept
- ${newRecords.length} new records added\n`,
);

console.log(
  tableFromRecords(
    allRecords.map((record) => ({
      id: String(record.id),
      message: record.message,
      expiry_timestamp: record.expiry_timestamp,
    })),
  ),
);
