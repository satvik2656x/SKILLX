require('dotenv').config();
const pool = require('./src/db/pool');

async function checkVideos() {
  try {
    const result = await pool.query("SELECT id, title, status, category FROM videos");
    console.log("Videos in DB:", JSON.stringify(result.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkVideos();
