require('dotenv').config();
const pool = require('./src/db/pool');

async function update() {
  try {
    // Add watched column to video_access
    await pool.query(`
      ALTER TABLE video_access ADD COLUMN IF NOT EXISTS watched BOOLEAN DEFAULT FALSE;
    `);

    console.log("Column 'watched' added to video_access table.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

update();
