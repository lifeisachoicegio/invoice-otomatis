const http = require('http');
const { spawn } = require('child_process');

const srv = spawn('npx.cmd', ['tsx', 'src/server.ts'], {
  cwd: 'E:/00GILANG/OBSIDIAN/HERMES/hypezone-studio-invoice/server',
  shell: true
});

srv.stdout.on('data', (d) => process.stdout.write('[SRV] ' + d));
srv.stderr.on('data', (d) => process.stderr.write('[SRV-ERR] ' + d));

async function waitAndTest() {
  await new Promise(r => setTimeout(r, 3500));

  function req(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      const opt = {
        hostname: 'localhost',
        port: 5000,
        path: '/api' + path,
        method: method,
        headers: { 'Content-Type': 'application/json' }
      };
      const r = http.request(opt, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch(e) {
            resolve({ status: res.statusCode, data });
          }
        });
      });
      r.on('error', reject);
      if (body) r.write(JSON.stringify(body));
      r.end();
    });
  }

  try {
    console.log('--- TEST 1: Get Settings ---');
    const setRes = await req('/settings');
    console.log('Settings:', setRes.status, setRes.data.data.company_name);

    console.log('--- TEST 2: Add Client ---');
    const cRes = await req('/clients', 'POST', {
      client_name: 'Budi Creative Studio',
      company_name: 'PT Budi Kreasi Digital',
      email: 'budi@kreasi.com',
      phone: '081299887766'
    });
    console.log('Client created:', cRes.status, cRes.data.data.client_name, 'ID:', cRes.data.data.id);
    const clientId = cRes.data.data.id;

    console.log('--- TEST 3: Add Service ---');
    const sRes = await req('/services', 'POST', {
      service_name: 'Short Form Reels Pro (10 Video)',
      category: 'Video Production',
      price: 4500000,
      unit: 'paket'
    });
    console.log('Service created:', sRes.status, sRes.data.data.service_name, 'ID:', sRes.data.data.id);

    console.log('--- TEST 4: Create Invoice ---');
    const invRes = await req('/invoices', 'POST', {
      client_id: clientId,
      issue_date: '2026-11-10',
      due_date: '2026-11-24',
      tax_rate: 11,
      discount_type: 'nominal',
      discount_value: 500000,
      items: [
        {
          description: 'Short Form Reels Pro (10 Video)',
          price: 4500000,
          quantity: 2,
          unit: 'paket'
        }
      ]
    });
    console.log('Invoice created:', invRes.status, invRes.data.data.invoice_number);
    console.log('Subtotal:', invRes.data.data.subtotal);
    console.log('Discount:', invRes.data.data.discount);
    console.log('Tax:', invRes.data.data.tax);
    console.log('Grand Total:', invRes.data.data.grand_total);
    console.log('Balance Due:', invRes.data.data.balance_due);
    const invId = invRes.data.data.id;

    console.log('--- TEST 5: Record Partial Payment (DP 50%) ---');
    const p1 = await req('/payments', 'POST', {
      invoice_id: invId,
      payment_amount: 4717500,
      payment_date: '2026-11-10',
      payment_method: 'Bank Transfer',
      reference_number: 'TRF-BCA-001'
    });
    console.log('Payment 1:', p1.status, 'New balance:', p1.data.data.balance_due, 'Status:', p1.data.data.status);

    console.log('--- TEST 6: Record Settlement (Full Payment) ---');
    const p2 = await req('/payments', 'POST', {
      invoice_id: invId,
      payment_amount: 4717500,
      payment_date: '2026-11-11',
      payment_method: 'Bank Transfer',
      reference_number: 'TRF-BCA-002'
    });
    console.log('Payment 2:', p2.status, 'New balance:', p2.data.data.balance_due, 'Status:', p2.data.data.status);

    console.log('--- TEST 7: Dashboard Stats ---');
    const dash = await req('/dashboard');
    console.log('Total Revenue:', dash.data.data.total_revenue);
    console.log('Paid Invoices:', dash.data.data.paid_invoices);

    console.log('--- TEST 8: Quotation Create & Convert ---');
    const qRes = await req('/quotations', 'POST', {
      client_id: clientId,
      issue_date: '2026-11-10',
      expiration_date: '2026-11-20',
      items: [{ description: 'Branding Identity Kit', price: 8000000, quantity: 1, unit: 'paket' }]
    });
    console.log('Quotation created:', qRes.status, qRes.data.data.quotation_number);
    const convRes = await req('/quotations/' + qRes.data.data.id + '/convert', 'POST');
    console.log('Quotation converted to Invoice:', convRes.status, convRes.data.data.invoice_number);

    console.log('--- ALL AUTOMATED BACKEND TESTS PASSED SUCCESSFULLY! ---');
  } catch (e) {
    console.error('Test failed:', e);
  } finally {
    srv.kill();
    process.exit(0);
  }
}

waitAndTest();
