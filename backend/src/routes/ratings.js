const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const { recalculateTrust, runFraudDetection } = require('../services/trustService');

const router = express.Router();

// POST /api/ratings — submit a rating
router.post('/', auth, async (req, res) => {
  const { session_id, score, feedback } = req.body;
  if (!session_id || !score) return res.status(400).json({ message: 'session_id and score are required.' });
  if (score < 1 || score > 5) return res.status(400).json({ message: 'Score must be between 1 and 5.' });

  try {
    // Get session → find the other user
    const sessRes = await pool.query(
      `SELECT s.*, t.sender_id, t.receiver_id
       FROM sessions s JOIN transactions t ON s.transaction_id = t.id
       WHERE s.id = $1`,
      [session_id]
    );
    if (sessRes.rows.length === 0) return res.status(404).json({ message: 'Session not found.' });
    const sess = sessRes.rows[0];

    // Determine to_user (the other participant)
    let to_user;
    if (sess.sender_id === req.user.id) to_user = sess.receiver_id;
    else if (sess.receiver_id === req.user.id) to_user = sess.sender_id;
    else return res.status(403).json({ message: 'Not part of this session.' });

    // Prevent duplicate ratings
    const dup = await pool.query(
      'SELECT id FROM ratings WHERE from_user = $1 AND session_id = $2',
      [req.user.id, session_id]
    );
    if (dup.rows.length > 0) return res.status(409).json({ message: 'You have already rated this session.' });

    const result = await pool.query(
      'INSERT INTO ratings (from_user, to_user, session_id, score, feedback) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user.id, to_user, session_id, score, feedback || '']
    );

    // Immediate Trust Update & Fraud Check
    await runFraudDetection(to_user);
    await recalculateTrust(to_user);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/ratings/user/:userId — ratings for a user
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.name as from_name
       FROM ratings r LEFT JOIN users u ON r.from_user = u.id
       WHERE r.to_user = $1
       ORDER BY r.created_at DESC`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
