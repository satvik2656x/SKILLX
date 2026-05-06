const pool = require('./src/db/pool');
async function check() {
  const res = await pool.query('SELECT email, role FROM users');
  console.log(JSON.stringify(res.rows, null, 2));
  process.exit();
}
check();
