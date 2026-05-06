require('dotenv').config();
const fs = require('fs');
const pool = require('./src/db/pool');

async function run() {
  try {
    const sql = fs.readFileSync('./schema.sql', 'utf8');
    await pool.query(sql);
    console.log("Entire schema.sql applied successfully");
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
