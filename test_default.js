
const http = require('http');

http.get('http://localhost:5000/api/invoices/1/pdf?format=html', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('Status default PDF:', res.statusCode);
    console.log('Is Neo-Brutalism HTML?:', data.includes('class="main-title">INVOICE</div>'));
    console.log('Has Yellow Box?:', data.includes('yellow-card'));
  });
}).on('error', (e) => console.log('Error:', e.message));
