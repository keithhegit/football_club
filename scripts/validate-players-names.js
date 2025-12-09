import { readFile } from 'fs/promises';
import path from 'path';
import Papa from 'papaparse';

const csvPath = path.resolve('data/fixed_spanish_english.csv');

const isAscii = str => /^[\u0000-\u007f]*$/.test(str);
const hasMojibake = str => /�|爀|锟|�\?|�\\|�'/.test(str);

const main = async () => {
  const raw = await readFile(csvPath, 'utf8');
  const parsed = Papa.parse(raw, { header: true, skipEmptyLines: true });
  if (parsed.errors?.length) {
    console.error('CSV parse errors:', parsed.errors.slice(0, 3));
    process.exit(1);
  }

  const names = parsed.data
    .map(r => (r.Name || '').trim())
    .filter(Boolean);

  const nonAscii = names.filter(n => !isAscii(n));
  const mojibake = names.filter(n => hasMojibake(n));
  const sample = Array.from(new Set(nonAscii)).slice(0, 30);

  console.log(`Total names: ${names.length}`);
  console.log(`Non-ASCII names: ${nonAscii.length}`);
  console.log(`Mojibake suspects: ${mojibake.length}`);
  if (sample.length) {
    console.log('Sample non-ASCII names:');
    sample.forEach(n => console.log(` - ${n}`));
  }

  if (mojibake.length > 0) {
    console.error('Mojibake detected. Please fix source CSV before proceeding.');
    process.exit(2);
  }

  console.log('Validation passed (no mojibake detected).');
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});


