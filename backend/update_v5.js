require('dotenv').config();
const pool = require('./src/db/pool');

async function update() {
  try {
    // 1. Drop the old strict subcategory check
    // In PostgreSQL, it's often named table_check or similar if not named explicitly.
    // Based on the error log, it's named 'videos_check'.
    await pool.query(`
      ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_check;
    `);

    console.log("Strict subcategory check dropped. Video uploads should now work.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

update();
