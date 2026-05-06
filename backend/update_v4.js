require('dotenv').config();
const pool = require('./src/db/pool');

async function update() {
  try {
    // 1. Drop existing constraints
    await pool.query(`
      ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_category_check;
    `);

    // 2. Add new category check
    await pool.query(`
      ALTER TABLE videos ADD CONSTRAINT videos_category_check 
      CHECK (category IN ('programming', 'design', 'music', 'language', 'cooking', 'fitness', 'writing', 'photography', 'marketing', 'finance', 'teaching', 'Other'));
    `);

    console.log("Video categories updated successfully.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

update();
