
const Database = require('better-sqlite3');
const db = new Database('E:/00GILANG/OBSIDIAN/HERMES/hypezone-studio-invoice/data/hypezone.db');

const rows = db.prepare('SELECT id, invoice_number, template FROM invoices').all();
console.log('Invoices template in DB:');
console.log(rows);

const settings = db.prepare('SELECT default_template FROM company_settings WHERE id = 1').get();
console.log('Settings default_template in DB:', settings);
