const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/users/:id — public profile
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, trust_score, credits, is_flagged, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/users — leaderboard (top trusted users)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, trust_score, credits, is_flagged, created_at FROM users ORDER BY trust_score DESC LIMIT 20'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// PATCH /api/users/:id/toggle-flag — Admin only
router.patch('/:id/toggle-flag', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access Denied' });
  try {
    const result = await pool.query(
      'UPDATE users SET is_flagged = NOT is_flagged WHERE id = $1 RETURNING is_flagged',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/users/me/stats — detailed breakdown for dashboard
router.get('/me/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 1. Average Rating (Sessions + Videos)
    const ratingRes = await pool.query('SELECT AVG(score) as avg_score FROM ratings WHERE to_user = $1', [userId]);
    const vRatingRes = await pool.query('SELECT AVG(score) as avg_score FROM video_ratings vr JOIN videos v ON vr.video_id = v.id WHERE v.user_id = $1', [userId]);
    
    const avgLive = parseFloat(ratingRes.rows[0].avg_score) || 0;
    const avgVideo = parseFloat(vRatingRes.rows[0].avg_score) || 0;
    const combinedAvg = (avgLive + avgVideo) > 0 ? (avgLive + avgVideo) / ( (avgLive > 0 ? 1 : 0) + (avgVideo > 0 ? 1 : 0) ) : 0;

    // 2. Completed Sessions
    const sessionRes = await pool.query(
      `SELECT COUNT(*) as count FROM sessions s
       JOIN transactions t ON s.transaction_id = t.id
       WHERE (t.sender_id = $1 OR t.receiver_id = $1) AND s.status = 'completed'`,
      [userId]
    );
    const completed = parseInt(sessionRes.rows[0].count) || 0;

    // 3. Disputes
    const disputeRes = await pool.query(
      `SELECT COUNT(*) as count FROM disputes d
       JOIN transactions t ON d.transaction_id = t.id
       WHERE t.receiver_id = $1 AND d.status = 'resolved'`,
      [userId]
    );
    const lostDisputes = parseInt(disputeRes.rows[0].count) || 0;

    res.json({
      avg_rating: combinedAvg,
      completed_sessions: completed,
      lost_disputes: lostDisputes,
      avg_rating_pct: (combinedAvg / 5) * 100,
      sessions_pct: Math.min(completed * 10, 100),
      disputes_pct: Math.max(0, 100 - (lostDisputes * 25))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
