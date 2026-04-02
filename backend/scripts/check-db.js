const { createConnection } = require('mysql2/promise');

async function main() {
  const connection = await createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'qlnt_db'
  });

  console.log('--- TABLES ---');
  const [tables] = await connection.execute('SHOW TABLES');
  console.log(JSON.stringify(tables, null, 2));

  console.log('--- USER PREVIEW (first 1) ---');
  // Try table 'tenant' first
  try {
    const [rows] = await connection.execute('SELECT email, role FROM tenant LIMIT 1');
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.log('Table tenant not found, trying tenants');
    const [rows] = await connection.execute('SELECT email, role FROM tenants LIMIT 1');
    console.log(JSON.stringify(rows, null, 2));
  }

  await connection.end();
}

main().catch(console.error);
