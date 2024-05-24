import { readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { parse, stringify } from 'csv/sync';
import { generateUniqueMessage } from '../util/messages.js';
import { tableFromRecords } from '../util/table.js';

const filePath = process.argv[2];

if (!filePath) {
  console.error(`File path missing. Usage:

  $ pnpm tsx scripts/updateCsvDatabaseRecords.ts data/persisted-to-cache/database.csv
`);
  process.exit(1);
}

const newRecords = [
  {
    id: '1',
    message: generateUniqueMessage(),
    expiryTimestamp:
      // Two weeks from now
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
];

let existingRecords: typeof newRecords = [];

try {
  existingRecords = parse(readFileSync(filePath, 'utf8'), {
    columns: true,
  });
  // Increment id in new records
  newRecords[0]!.id = String(parseInt(existingRecords.at(-1)!.id) + 1);
} catch {
  // Swallow error if file doesn't exist
}

const existingNonExpiredRecords = existingRecords.filter(
  (record) => new Date(record.expiryTimestamp) > new Date(),
);

const updatedRecords = [...existingNonExpiredRecords, ...newRecords];

writeFileSync(filePath, stringify(updatedRecords, { header: true }));

const removedRecordsCount =
  existingRecords.length - existingNonExpiredRecords.length;

console.log(
  `Updated ${filePath}:
${
  !removedRecordsCount
    ? ''
    : `- ${removedRecordsCount} expired records removed\n`
}- ${existingNonExpiredRecords.length} non-expired existing records kept
- ${newRecords.length} new records added\n`,
);

console.log(tableFromRecords([...existingNonExpiredRecords, ...newRecords]));
