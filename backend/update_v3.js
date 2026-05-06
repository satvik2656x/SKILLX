require('dotenv').config();
const pool = require('./src/db/pool');

async function update() {
  try {
    await pool.query(`
      ALTER TABLE disputes ADD COLUMN IF NOT EXISTS evidence_url TEXT;
      ALTER TABLE video_disputes ADD COLUMN IF NOT EXISTS evidence_url TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP DEFAULT NOW();
    `);
    console.log("Database schema updated with evidence and last_active_at.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

update();
