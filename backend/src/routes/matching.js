const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/matching/recommendations
 * Suggests skills based on:
 * 1. Categories the user has previously interacted with (ratings/sessions).
 * 2. Categories that complement the user's own skills.
 */
router.get('/recommendations', auth, async (req, res) => {
  try {
    // 1. Get categories of skills this user has previously rated or had sessions in
    const historyRes = await pool.query(
      `SELECT DISTINCT sk.category 
       FROM sessions s
       JOIN transactions t ON s.transaction_id = t.id
       JOIN skills sk ON t.skill_id = sk.id
       WHERE t.sender_id = $1 OR t.receiver_id = $1`,
      [req.user.id]
    );
    const historyCategories = historyRes.rows.map(r => r.category);

    // 2. Get categories of skills this user offers
    const ownSkillsRes = await pool.query('SELECT category FROM skills WHERE user_id = $1', [req.user.id]);
    const ownCategories = ownSkillsRes.rows.map(r => r.category);

    // Simple matching: find skills in similar categories or trending categories
    // excluding user's own skills
    let query = `
      SELECT sk.*, u.name as user_name, u.trust_score
      FROM skills sk
      JOIN users u ON sk.user_id = u.id
      WHERE sk.user_id != $1
    `;
    let params = [req.user.id];

    if (historyCategories.length > 0) {
      query += ` AND sk.category = ANY($2)`;
      params.push(historyCategories);
    }

    query += ` ORDER BY u.trust_score DESC, sk.created_at DESC LIMIT 10`;

    const result = await pool.query(query, params);
    
    // Fallback if no specific match
    if (result.rows.length === 0) {
      const fallback = await pool.query(
        `SELECT sk.*, u.name as user_name, u.trust_score
         FROM skills sk
         JOIN users u ON sk.user_id = u.id
         WHERE sk.user_id != $1
         ORDER BY u.trust_score DESC LIMIT 5`,
        [req.user.id]
      );
      return res.json(fallback.rows);
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching recommendations.' });
  }
});

router.get('/video-recommendations', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Get categories of videos this user has previously accessed or rated
    const historyRes = await pool.query(
      `SELECT DISTINCT v.category 
       FROM video_access va
       JOIN videos v ON va.video_id = v.id
       WHERE va.user_id = $1`,
      [userId]
    );
    const historyCategories = historyRes.rows.map(r => r.category);

    // 2. Recommend videos from these categories or top trusted creators
    let query = `
      SELECT v.*, u.name as user_name, u.trust_score,
      (SELECT COALESCE(AVG(score), 0) FROM video_ratings WHERE video_id = v.id) as avg_rating
      FROM videos v
      JOIN users u ON v.user_id = u.id
      WHERE v.user_id != $1 AND v.status = 'approved'
    `;
    let params = [userId];

    if (historyCategories.length > 0) {
      query += ` AND v.category = ANY($2)`;
      params.push(historyCategories);
    }

    query += ` ORDER BY u.trust_score DESC, v.created_at DESC LIMIT 10`;
    const result = await pool.query(query, params);

    // Fallback: Top videos by rating/trust
    if (result.rows.length === 0) {
      const fallback = await pool.query(
        `SELECT v.*, u.name as user_name, u.trust_score,
         (SELECT COALESCE(AVG(score), 0) FROM video_ratings WHERE video_id = v.id) as avg_rating
         FROM videos v
         JOIN users u ON v.user_id = u.id
         WHERE v.user_id != $1 AND v.status = 'approved'
         ORDER BY u.trust_score DESC, v.views DESC LIMIT 6`,
        [userId]
      );
      return res.json(fallback.rows);
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
