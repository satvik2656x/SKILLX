const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/transactions — create + lock escrow
router.post('/', auth, async (req, res) => {
  const { receiver_id, skill_id, credits } = req.body;
  if (!receiver_id || !skill_id || !credits)
    return res.status(400).json({ message: 'receiver_id, skill_id and credits are required.' });
  if (receiver_id === req.user.id)
    return res.status(400).json({ message: 'Cannot request your own skill.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Check sender balance
    const senderRes = await client.query('SELECT credits FROM users WHERE id = $1 FOR UPDATE', [req.user.id]);
    if (senderRes.rows[0].credits < credits)
      return res.status(400).json({ message: 'Insufficient credits.' });

    // Deduct from sender (escrow)
    await client.query('UPDATE users SET credits = credits - $1 WHERE id = $2', [credits, req.user.id]);

    // Create transaction
    const txRes = await client.query(
      'INSERT INTO transactions (sender_id, receiver_id, skill_id, credits, status) VALUES ($1,$2,$3,$4,\'escrow\') RETURNING *',
      [req.user.id, receiver_id, skill_id, credits]
    );
    await client.query('COMMIT');
    res.status(201).json(txRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  } finally {
    client.release();
  }
});

// GET /api/transactions/me — my transactions
router.get('/me', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, COALESCE(s.title, t.skill_title) as skill_title,
              su.name as sender_name, ru.name as receiver_name
       FROM transactions t
       LEFT JOIN skills s ON t.skill_id = s.id
       LEFT JOIN users su ON t.sender_id = su.id
       LEFT JOIN users ru ON t.receiver_id = ru.id
       WHERE t.sender_id = $1 OR t.receiver_id = $1
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// PATCH /api/transactions/:id/complete — complete, release escrow to receiver
router.patch('/:id/complete', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const txRes = await client.query('SELECT * FROM transactions WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (txRes.rows.length === 0) return res.status(404).json({ message: 'Transaction not found.' });
    const tx = txRes.rows[0];
    if (tx.status !== 'escrow') return res.status(400).json({ message: 'Transaction not in escrow.' });
    if (tx.receiver_id !== req.user.id) return res.status(403).json({ message: 'Not authorized.' });

    // Release credits to receiver
    await client.query('UPDATE users SET credits = credits + $1 WHERE id = $2', [tx.credits, tx.receiver_id]);
    await client.query('UPDATE transactions SET status = \'completed\' WHERE id = $1', [tx.id]);
    await client.query('COMMIT');
    res.json({ message: 'Transaction completed.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Server error.' });
  } finally {
    client.release();
  }
});

// PATCH /api/transactions/:id/cancel — refund to sender
router.patch('/:id/cancel', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const txRes = await client.query('SELECT * FROM transactions WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (txRes.rows.length === 0) return res.status(404).json({ message: 'Transaction not found.' });
    const tx = txRes.rows[0];
    if (tx.status !== 'escrow') return res.status(400).json({ message: 'Only escrow transactions can be cancelled.' });
    if (tx.sender_id !== req.user.id) return res.status(403).json({ message: 'Not authorized.' });

    // Refund sender
    await client.query('UPDATE users SET credits = credits + $1 WHERE id = $2', [tx.credits, tx.sender_id]);
    await client.query('UPDATE transactions SET status = \'cancelled\' WHERE id = $1', [tx.id]);
    await client.query('COMMIT');
    res.json({ message: 'Transaction cancelled and credits refunded.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Server error.' });
  } finally {
    client.release();
  }
});

module.exports = router;
