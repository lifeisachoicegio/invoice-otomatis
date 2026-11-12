
const http = require('http');
const fs = require('fs');

http.get('http://localhost:5000/api/invoices/1/pdf?template=neobrutalism', (res) => {
  console.log('PDF status:', res.statusCode);
  console.log('Content-Type:', res.headers['content-type']);
  const chunks = [];
  res.on('data', c => chunks.push(c));
  res.on('end', () => {
    const buf = Buffer.concat(chunks);
    console.log('PDF buffer size:', buf.length);
    fs.writeFileSync('E:/00GILANG/OBSIDIAN/HERMES/hypezone-studio-invoice/test_out.pdf', buf);
    console.log('Saved test_out.pdf successfully!');
  });
}).on('error', (e) => {
  console.log('Error:', e.message);
});
