const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const transporter = require('../config/mailer');
const { uploadEvidence } = require('../config/cloudinary');

const router = express.Router();

// POST /api/disputes — raise a dispute
router.post('/', auth, uploadEvidence.single('evidence'), async (req, res) => {
  const { transaction_id, reason } = req.body;
  const evidence_url = req.file ? req.file.path : null;

  if (!transaction_id || !reason) {
    return res.status(400).json({ message: 'transaction_id and reason are required.' });
  }

  if (!evidence_url) {
    return res.status(400).json({ message: 'Proof/Evidence image is required to raise a dispute.' });
  }

  try {
    // Verify transaction exists and user is part of it
    const txRes = await pool.query('SELECT * FROM transactions WHERE id = $1', [transaction_id]);
    if (txRes.rows.length === 0) return res.status(404).json({ message: 'Transaction not found.' });
    
    const tx = txRes.rows[0];
    if (tx.sender_id !== req.user.id && tx.receiver_id !== req.user.id) {
      return res.status(403).json({ message: 'Not part of this transaction.' });
    }

    // Prevent duplicate disputes
    const dup = await pool.query(
      'SELECT id FROM disputes WHERE transaction_id = $1 AND raised_by = $2',
      [transaction_id, req.user.id]
    );
    if (dup.rows.length > 0) return res.status(409).json({ message: 'You already have an open dispute for this transaction.' });

    // Insert dispute
    const result = await pool.query(
      `INSERT INTO disputes (transaction_id, raised_by, reason, evidence_url, status) 
       VALUES ($1, $2, $3, $4, 'open') RETURNING *`,
      [transaction_id, req.user.id, reason, evidence_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/disputes — user's disputes
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, u.name as raised_by_name, sk.title as skill_title
       FROM disputes d
       LEFT JOIN users u ON d.raised_by = u.id
       LEFT JOIN transactions t ON d.transaction_id = t.id
       LEFT JOIN skills sk ON t.skill_id = sk.id
       WHERE d.raised_by = $1
       ORDER BY d.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/disputes/all — admin views all session disputes
router.get('/all', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access Denied' });
  try {
    const result = await pool.query(
      `SELECT d.*, u.name as raised_by_name, u.email as raised_by_email, 
              sk.title as skill_title, t.credits
       FROM disputes d
       JOIN users u ON d.raised_by = u.id
       JOIN transactions t ON d.transaction_id = t.id
       LEFT JOIN skills sk ON t.skill_id = sk.id
       ORDER BY d.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// PATCH /api/disputes/:id/resolve — admin resolves (refund or confirm)
router.patch('/:id/resolve', auth, async (req, res) => {
  const { resolution, admin_note } = req.body; // resolution: 'refund' | 'confirm'
  if (!resolution) return res.status(400).json({ message: 'resolution is required (refund or confirm).' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const dispRes = await client.query('SELECT * FROM disputes WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (dispRes.rows.length === 0) return res.status(404).json({ message: 'Dispute not found.' });
    const dispute = dispRes.rows[0];

    if (dispute.status !== 'open') return res.status(400).json({ message: 'Dispute already resolved.' });

    const txRes = await client.query('SELECT * FROM transactions WHERE id = $1 FOR UPDATE', [dispute.transaction_id]);
    const tx = txRes.rows[0];

    if (resolution === 'refund') {
      // Return credits to sender
      await client.query('UPDATE users SET credits = credits + $1 WHERE id = $2', [tx.credits, tx.sender_id]);
      await client.query('UPDATE transactions SET status = \'cancelled\' WHERE id = $1', [tx.id]);
      await client.query('UPDATE disputes SET status = \'resolved\', admin_note = $1 WHERE id = $2', [admin_note || 'Credits refunded to sender.', dispute.id]);
    } else {
      // Confirm — credits stay with receiver
      await client.query('UPDATE disputes SET status = \'rejected\', admin_note = $1 WHERE id = $2', [admin_note || 'Dispute rejected. Transaction confirmed.', dispute.id]);
    }

    await client.query('COMMIT');
    res.json({ message: `Dispute ${resolution === 'refund' ? 'resolved with refund' : 'rejected'}.` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  } finally {
    client.release();
  }
});

// GET /api/disputes/videos — admin views all video disputes
router.get('/videos', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access Denied' });
  try {
    const result = await pool.query(
      `SELECT d.*, u.name as raised_by_name, u.email as raised_by_email, v.title as video_title, v.user_id as uploader_id 
       FROM video_disputes d
       JOIN users u ON d.raised_by = u.id
       JOIN videos v ON d.video_id = v.id
       ORDER BY d.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// PATCH /api/disputes/videos/:id/resolve — admin resolves video dispute
router.patch('/videos/:id/resolve', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access Denied' });
  const { resolution, admin_note } = req.body; // 'refund' | 'reject'
  
  if (!resolution) return res.status(400).json({ message: 'resolution is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const dispRes = await client.query(
      `SELECT d.*, u.email, v.user_id as uploader_id 
       FROM video_disputes d 
       JOIN users u ON d.raised_by = u.id 
       JOIN videos v ON d.video_id = v.id
       WHERE d.id = $1 FOR UPDATE`, 
      [req.params.id]
    );
    
    if (dispRes.rows.length === 0) return res.status(404).json({ message: 'Dispute not found.' });
    const dispute = dispRes.rows[0];

    if (dispute.status !== 'open') return res.status(400).json({ message: 'Dispute already resolved.' });

    if (resolution === 'refund') {
      // Subtract credit from uploader, give back to complaining user
      await client.query('UPDATE users SET credits = credits - 1 WHERE id = $1', [dispute.uploader_id]);
      await client.query('UPDATE users SET credits = credits + 1 WHERE id = $1', [dispute.raised_by]);
      await client.query('UPDATE video_disputes SET status = $1, admin_note = $2 WHERE id = $3', ['refunded', admin_note || 'Refund issued.', dispute.id]);
    } else {
      await client.query('UPDATE video_disputes SET status = $1, admin_note = $2 WHERE id = $3', ['rejected', admin_note || 'Dispute rejected.', dispute.id]);
    }

    await client.query('COMMIT');

    // Send Email
    try {
      await transporter.sendMail({
        from: `"SKILLX Admin" <${process.env.EMAIL_USER}>`,
        to: dispute.email,
        subject: `Your Video Dispute has been ${resolution === 'refund' ? 'Refunded' : 'Rejected'}`,
        text: `Hello,\n\nYour dispute regarding the video has been reviewed.\nResolution: ${resolution.toUpperCase()}\nAdmin Note: ${admin_note || 'No additional notes.'}\n\nThank you,\nSKILLX Team`,
      });
    } catch (emailErr) {
      console.error("Failed to send email", emailErr);
    }

    res.json({ message: `Dispute ${resolution}.` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  } finally {
    client.release();
  }
});

module.exports = router;
