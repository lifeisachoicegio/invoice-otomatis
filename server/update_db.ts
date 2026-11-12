
import { db } from './src/db';

const update = db.prepare("UPDATE invoices SET template = 'neobrutalism'");
const info = update.run();
console.log('Invoices updated to neobrutalism:', info.changes);

const rows = db.prepare('SELECT id, invoice_number, template FROM invoices').all();
console.log('Current DB state:', rows);
