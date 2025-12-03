import fs from 'fs';
import Papa from 'papaparse';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvFile = fs.readFileSync(path.join(__dirname, '../src/data/fm2023.csv'), 'utf-8');

Papa.parse(csvFile, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    complete: (results) => {
        const uids = new Map<string, number>();
        const duplicates: string[] = [];

        results.data.forEach((row: any, index: number) => {
            const uid = row.UID?.trim();
            if (uid) {
                if (uids.has(uid)) {
                    duplicates.push(`UID ${uid} appears at row ${uids.get(uid)} and ${index + 2}`);
                } else {
                    uids.set(uid, index + 2);
                }
            }
        });

        console.log(`Total rows: ${results.data.length}`);
        console.log(`Unique UIDs: ${uids.size}`);
        console.log(`Duplicates found: ${duplicates.length}`);

        if (duplicates.length > 0) {
            console.log('\nFirst 20 duplicates:');
            duplicates.slice(0, 20).forEach(dup => console.log(dup));
        }
    }
});
