const { createConnection } = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function main() {
  const connection = await createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'qlnt_db'
  });

  const email = 'admin@smarttro.vn';
  const password = 'password123';
  const hashed = await bcrypt.hash(password, 10);

  // Check if exists
  const [rows] = await connection.execute('SELECT id FROM tenant WHERE email = ?', [email]);
  
  if (rows.length > 0) {
    console.log('Admin already exists, updating role and password...');
    await connection.execute('UPDATE tenant SET role = "admin", password = ? WHERE email = ?', [hashed, email]);
  } else {
    console.log('Creating new admin...');
    await connection.execute(
      'INSERT INTO tenant (fullName, email, password, role, isVerified) VALUES (?, ?, ?, ?, ?)',
      ['System Administrator', email, hashed, 'admin', 1]
    );
  }

  console.log('Admin user ready: admin@smarttro.vn / password123');
  await connection.end();
}

main().catch(console.error);
