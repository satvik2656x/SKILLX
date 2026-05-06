const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/skills — create a new skill
router.post('/', auth, async (req, res) => {
  const { title, description, category, hours_required } = req.body;
  
  if (!title) return res.status(400).json({ message: 'Title is required.' });
  if (!category) return res.status(400).json({ message: 'Category is required.' });

  try {
    const result = await pool.query(
      `INSERT INTO skills (user_id, title, description, category, hours_required) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, title, description || '', category, hours_required || 1.0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating skill.' });
  }
});

// GET /api/skills — list all skills with optional filters
router.get('/', async (req, res) => {
  const { category, search } = req.query;
  
  try {
    let query = `
      SELECT s.*, u.name as user_name, u.trust_score as user_trust_score
      FROM skills s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND s.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (search) {
      query += ` AND (s.title ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY s.created_at DESC LIMIT 50`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching skills.' });
  }
});

// GET /api/skills/user/:userId — get skills by a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.name as user_name, u.trust_score as user_trust_score
       FROM skills s
       JOIN users u ON s.user_id = u.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching user skills.' });
  }
});

// GET /api/skills/:id — get a single skill
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.name as user_name, u.trust_score as user_trust_score, u.email as user_email
       FROM skills s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Skill not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching skill.' });
  }
});

// PUT /api/skills/:id — update a skill (only by owner)
router.put('/:id', auth, async (req, res) => {
  const { title, description, category, hours_required } = req.body;
  
  try {
    // Verify ownership
    const skill = await pool.query('SELECT * FROM skills WHERE id = $1', [req.params.id]);
    if (skill.rows.length === 0) return res.status(404).json({ message: 'Skill not found.' });
    if (skill.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own skills.' });
    }

    const result = await pool.query(
      `UPDATE skills 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           hours_required = COALESCE($4, hours_required)
       WHERE id = $5 RETURNING *`,
      [title, description, category, hours_required, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating skill.' });
  }
});

// DELETE /api/skills/:id — delete a skill (only by owner)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Verify ownership
    const skill = await pool.query('SELECT * FROM skills WHERE id = $1', [req.params.id]);
    if (skill.rows.length === 0) return res.status(404).json({ message: 'Skill not found.' });
    if (skill.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own skills.' });
    }

    await pool.query('DELETE FROM skills WHERE id = $1', [req.params.id]);
    res.json({ message: 'Skill deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting skill.' });
  }
});

module.exports = router;
