const { createConnection } = require('mysql2/promise');

async function main() {
  const connection = await createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'qlnt_db'
  });

  const [rows] = await connection.execute('SELECT email, role FROM tenants');
  console.log(JSON.stringify(rows, null, 2));

  await connection.end();
}

main().catch(console.error);
