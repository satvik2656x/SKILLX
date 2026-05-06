require('dotenv').config();
const pool = require('./src/db/pool');

async function update() {
  try {
    // Add views column to videos table
    await pool.query(`
      ALTER TABLE videos ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
    `);

    console.log("Column 'views' added to videos table.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

update();
