require('dotenv').config();
const pool = require('./src/db/pool');

async function update() {
  try {
    // Add skill_title to transactions table
    await pool.query(`
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS skill_title VARCHAR(255);
    `);

    console.log("Column skill_title added to transactions table.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

update();
