require('dotenv').config();
const pool = require('./src/db/pool');

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS video_ratings (
        id SERIAL PRIMARY KEY,
        video_id INT REFERENCES videos(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        score INT CHECK (score BETWEEN 1 AND 5),
        feedback TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(video_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS video_disputes (
        id SERIAL PRIMARY KEY,
        video_id INT REFERENCES videos(id) ON DELETE CASCADE,
        raised_by INT REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'open',
        admin_note TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_video_ratings_video ON video_ratings(video_id);
      CREATE INDEX IF NOT EXISTS idx_video_disputes_video ON video_disputes(video_id);
    `);
    console.log("Database updated successfully");
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
