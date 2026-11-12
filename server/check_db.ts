
import { db } from './src/db';

const rows = db.prepare('SELECT id, invoice_number, template FROM invoices').all();
console.log('Invoices template in DB:', rows);

const settings: any = db.prepare('SELECT default_template FROM company_settings WHERE id = 1').get();
console.log('Settings default_template in DB:', settings);
