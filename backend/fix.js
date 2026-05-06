require('dotenv').config();
const pool = require('./src/db/pool');
(async () => {
  try {
    const res = await pool.query(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
    console.log(res.rows);
    
    // Also drop both constraints just in case
    await pool.query('ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL').catch(e => console.log('No password_hash'));
    await pool.query('ALTER TABLE users ALTER COLUMN password DROP NOT NULL').catch(e => console.log('No password'));
    
    console.log('Fixed constraints');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
