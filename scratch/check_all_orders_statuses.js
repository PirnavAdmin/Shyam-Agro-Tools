const mysql = require('mysql2/promise');

const mapStatus = (status, paymentStatus) => {
  if (!status) return 'Pending';
  const s = status.toUpperCase();
  const ps = (paymentStatus || '').toUpperCase();
  const isPaid = ps === 'PAID' || ps === 'VERIFIED PAID' || ps === 'SUCCESS' || ps === 'PAID VERIFIED';
  const isPendingPay = ps === 'PENDING' || ps === 'PENDING VERIFICATION' || ps === 'PENDINGVERIFICATION' || ps === 'UNPAID';

  if (s === 'CANCELLED' || s === 'CANCELED') return 'Cancelled';
  if (s === 'COMPLETED' || s === 'DELIVERED') return 'Completed';
  if (s === 'SHIPPED' || s === 'DISPATCHED') return 'Dispatched';
  if (s === 'PACKED') return 'Packed';
  if (s === 'PROCESSING') return isPendingPay ? 'Pending' : 'Processing';
  if (s === 'PENDING' || s === 'PLACED') return isPaid ? 'Processing' : 'Pending';
  return status;
};

async function run() {
  const connection = await mysql.createConnection({
    host: 'srv1061.hstgr.io',
    port: 3306,
    user: 'u819242402_Agrodb',
    password: 'Pirnav@2026',
    database: 'u819242402_shyam_agro_db'
  });

  try {
    const [rows] = await connection.execute('SELECT Id, Status, Fulfillment, PaymentStatus FROM Orders');
    console.log(`Total orders in DB: ${rows.length}`);

    const mappedCounts = {};
    rows.forEach(o => {
      const ful = o.Fulfillment || o.Status;
      const m = mapStatus(ful, o.PaymentStatus);
      mappedCounts[m] = (mappedCounts[m] || 0) + 1;
    });

    console.log('Mapped Status Breakdown:', mappedCounts);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await connection.end();
  }
}

run();
