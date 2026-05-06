const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const { recalculateTrust, runFraudDetection } = require('../services/trustService');

const router = express.Router();

// POST /api/sessions — create session from transaction
router.post('/', auth, async (req, res) => {
  const { transaction_id } = req.body;
  
  if (!transaction_id) return res.status(400).json({ message: 'transaction_id is required.' });

  try {
    // Verify transaction exists and user is part of it
    const txRes = await pool.query('SELECT * FROM transactions WHERE id = $1', [transaction_id]);
    if (txRes.rows.length === 0) return res.status(404).json({ message: 'Transaction not found.' });
    
    const tx = txRes.rows[0];
    if (tx.sender_id !== req.user.id && tx.receiver_id !== req.user.id) {
      return res.status(403).json({ message: 'Not part of this transaction.' });
    }

    // Check if session already exists for this transaction
    const existing = await pool.query('SELECT * FROM sessions WHERE transaction_id = $1', [transaction_id]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Session already exists for this transaction.' });
    }

    // Create session
    const result = await pool.query(
      `INSERT INTO sessions (transaction_id, status) 
       VALUES ($1, 'active') RETURNING *`,
      [transaction_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating session.' });
  }
});

// GET /api/sessions/active — get current user's active sessions
router.get('/active', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, t.sender_id, t.receiver_id, sk.title as skill_title
       FROM sessions s
       JOIN transactions t ON s.transaction_id = t.id
       LEFT JOIN skills sk ON t.skill_id = sk.id
       WHERE (t.sender_id = $1 OR t.receiver_id = $1)
         AND s.status = 'active'
       ORDER BY s.started_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching active sessions.' });
  }
});

// GET /api/sessions/:id — get single session details
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, t.sender_id, t.receiver_id, t.credits, sk.title as skill_title,
              u_sender.name as sender_name, u_receiver.name as receiver_name
       FROM sessions s
       JOIN transactions t ON s.transaction_id = t.id
       LEFT JOIN skills sk ON t.skill_id = sk.id
       LEFT JOIN users u_sender ON t.sender_id = u_sender.id
       LEFT JOIN users u_receiver ON t.receiver_id = u_receiver.id
       WHERE s.id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ message: 'Session not found.' });
    
    const session = result.rows[0];
    // Verify user is part of this session
    if (session.sender_id !== req.user.id && session.receiver_id !== req.user.id) {
      return res.status(403).json({ message: 'Not part of this session.' });
    }

    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching session.' });
  }
});

// PATCH /api/sessions/:id/end — end a session (only by one participant)
router.patch('/:id/end', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Get session and transaction
    const sessRes = await client.query(
      `SELECT s.*, t.sender_id, t.receiver_id, t.credits
       FROM sessions s
       JOIN transactions t ON s.transaction_id = t.id
       WHERE s.id = $1 FOR UPDATE`,
      [req.params.id]
    );

    if (sessRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Session not found.' });
    }

    const session = sessRes.rows[0];
    
    // Verify user is part of this session
    if (session.sender_id !== req.user.id && session.receiver_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Not part of this session.' });
    }

    // Calculate duration
    const endTime = new Date();
    const startTime = new Date(session.started_at);
    const durationMinutes = Math.round((endTime - startTime) / 60000);

    // Update session
    const result = await client.query(
      `UPDATE sessions 
       SET status = 'completed', ended_at = $1, duration_minutes = $2
       WHERE id = $3 RETURNING *`,
      [endTime, durationMinutes, req.params.id]
    );

    // Release escrow: transfer credits to receiver
    const receiverId = session.sender_id === req.user.id ? session.receiver_id : session.sender_id;
    await client.query(
      'UPDATE users SET credits = credits + $1 WHERE id = $2',
      [session.credits, receiverId]
    );

    // Update transaction status
    await client.query(
      'UPDATE transactions SET status = $1 WHERE id = $2',
      ['completed', session.transaction_id || null]
    );

    // Run fraud detection
    const fraudCheck = await runFraudDetection(session.sender_id);
    const fraudCheck2 = await runFraudDetection(session.receiver_id);

    // Recalculate trust scores
    await recalculateTrust(session.sender_id);
    await recalculateTrust(session.receiver_id);

    await client.query('COMMIT');

    res.json({
      ...result.rows[0],
      message: 'Session ended successfully',
      credits_released: session.credits,
      duration_minutes: durationMinutes
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Server error ending session.' });
  } finally {
    client.release();
  }
});

// GET /api/sessions/transaction/:transactionId — get session for transaction
router.get('/transaction/:transactionId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, t.sender_id, t.receiver_id, sk.title as skill_title
       FROM sessions s
       JOIN transactions t ON s.transaction_id = t.id
       LEFT JOIN skills sk ON t.skill_id = sk.id
       WHERE t.id = $1`,
      [req.params.transactionId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No session found for this transaction.' });
    }

    const session = result.rows[0];
    if (session.sender_id !== req.user.id && session.receiver_id !== req.user.id) {
      return res.status(403).json({ message: 'Not part of this transaction.' });
    }

    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching session.' });
  }
});

module.exports = router;
