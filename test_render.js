
const http = require('http');

http.get('http://localhost:5000/api/invoices/1/pdf?template=neobrutalism&format=html', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status HTML render:', res.statusCode);
    console.log('Contains INVOICE title:', data.includes('main-title'));
    console.log('Length:', data.length);
  });
}).on('error', (e) => {
  console.log('Server not responding:', e.message);
});
