import { table } from 'table';

export function tableFromRecords(records: { id: string }[]) {
  return table([
    Object.keys(records[0]!),
    ...records.map((record) => Object.values(record)),
  ]);
}
