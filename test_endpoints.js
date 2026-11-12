
const http = require('http');

const endpoints = [
  '/api/settings',
  '/api/dashboard',
  '/api/clients',
  '/api/services',
  '/api/invoices',
  '/api/invoices/1',
  '/api/quotations',
  '/api/recurring',
  '/api/expenses',
  '/api/reports/financial?start_date=2026-01-01&end_date=2026-12-31'
];

async function run() {
  for (const ep of endpoints) {
    await new Promise((resolve) => {
      http.get('http://localhost:5000' + ep, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          console.log(ep, '->', res.statusCode);
          if (res.statusCode >= 400) console.log('BODY:', d);
          resolve();
        });
      }).on('error', (e) => {
        console.log(ep, '-> ERROR:', e.message);
        resolve();
      });
    });
  }
}
run();
