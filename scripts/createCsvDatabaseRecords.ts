import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { parse, stringify } from 'csv/sync';
import { generateUniqueMessage } from '../util/messages.js';
import { tableFromRecords } from '../util/table.js';

const filePath = process.argv[2];

if (!filePath) {
  console.error(`File path missing. Usage:

  $ pnpm tsx scripts/createCsvDatabaseRecords.ts data/persisted-to-cache/database.csv
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
  // Increment id in new records
  existingRecords = parse(readFileSync(filePath, 'utf8'), {
    columns: true,
  });
  newRecords[0]!.id = String(parseInt(existingRecords.at(-1)!.id) + 1);
} catch (error) {
  // Create file with header if it doesn't exist
  writeFileSync(filePath, Object.keys(newRecords[0]!).join(',') + '\n');
}

appendFileSync(filePath, stringify(newRecords));

console.log(
  `Added ${newRecords.length} new records to the ${existingRecords.length} existing records in ${filePath}:\n`,
);

console.log(tableFromRecords([...existingRecords, ...newRecords]));
