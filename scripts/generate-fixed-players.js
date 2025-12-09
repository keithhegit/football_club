import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import Papa from 'papaparse';

const csvPath = path.resolve('data/fixed_spanish_english.csv');
const jsonOut = path.resolve('data/players_fixed.json');
const sqlOut = path.resolve('data/players_fixed.sql');

const readCsv = async () => {
  const raw = await readFile(csvPath, 'utf8');
  const parsed = Papa.parse(raw, { header: true, skipEmptyLines: true });
  if (parsed.errors?.length) {
    console.error('CSV parse errors:', parsed.errors.slice(0, 3));
    throw new Error('CSV parse failed');
  }
  return parsed.data;
};

const sanitizeName = name => (name || '').trim().replace(/\s+/g, ' ');
const escapeSql = value => value.replace(/'/g, "''");

const main = async () => {
  const rows = await readCsv();
  const players = rows
    .map(r => {
      const id = String(r.UID || '').trim();
      const name = sanitizeName(r.Name);
      if (!id || !name) return null;
      return {
        id: Number(id),
        uid: id,
        name,
        club: sanitizeName(r.Club),
        nationality: sanitizeName(r.Nat),
        nameNorm: sanitizeName(r.Name_Norm),
      };
    })
    .filter(Boolean);

  await writeFile(jsonOut, JSON.stringify(players, null, 2), 'utf8');

  const sqlLines = [
    '-- players_fixed.sql',
    '-- Update player names from UTF-8 clean seed',
    'BEGIN TRANSACTION;',
  ];

  players.forEach(p => {
    sqlLines.push(
      `UPDATE players SET name = '${escapeSql(p.name)}' WHERE id = ${p.id};`
    );
  });

  sqlLines.push('COMMIT;');
  await writeFile(sqlOut, sqlLines.join('\n'), 'utf8');

  console.log(
    `Generated ${players.length} players -> ${path.relative(process.cwd(), jsonOut)} & ${path.relative(
      process.cwd(),
      sqlOut
    )}`
  );
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});


