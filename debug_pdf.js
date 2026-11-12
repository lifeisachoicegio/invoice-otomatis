
const http = require('http');

http.get('http://localhost:5000/api/invoices/1/pdf', (res) => {
  console.log('Status code:', res.statusCode);
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.log('Error Body:', data);
    } else {
      console.log('Success, length:', data.length);
    }
  });
}).on('error', (e) => {
  console.log('HTTP GET error:', e.message);
});
