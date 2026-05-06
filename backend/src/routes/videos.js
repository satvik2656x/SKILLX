const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const { recalculateTrust, runFraudDetection } = require('../services/trustService');
const { upload, uploadEvidence, cloudinary } = require('../config/cloudinary');
const { 
  sendVideoDenialEmail, 
  sendVideoApprovalEmail,
  sendVideoPurchaseEmail,
  sendVideoSaleEmail
} = require('../services/emailService');

const router = express.Router();

const allowedCategories = {
  programming: ["Python", "JavaScript", "AI/ML", "Web Dev", "Mobile Dev", "Data Science", "Blockchain", "Cloud Computing", "Cybersecurity", "DevOps", "Java", "C++", "Rust", "Go"],
  design: ["UI/UX", "3D Modeling", "Branding", "Motion Graphics", "Graphic Design", "Photography", "Interior Design", "Game Design", "Illustration", "Architecture"],
  marketing: ["SEO", "Ads", "Branding", "Social Media", "Content Marketing", "Email Marketing", "Affiliate Marketing", "Market Research", "Influencer Marketing", "Public Relations"],
  finance: ["Investing", "Crypto", "Trading", "Personal Finance", "Accounting", "Real Estate", "Fintech", "Stock Market", "Economics", "Taxation"]
};

// POST /api/videos/upload
router.post('/upload', auth, upload.single('video'), async (req, res) => {
  const { title, description, category, subcategory } = req.body;
  
  if (!req.file) return res.status(400).json({ error: "No video file uploaded" });

  if (!allowedCategories[category] || !allowedCategories[category].includes(subcategory)) {
    // Delete the file from cloudinary if validation fails
    await cloudinary.uploader.destroy(req.file.filename, { resource_type: "video" });
    return res.status(400).json({ error: "Invalid category/subcategory" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO videos (user_id, title, description, category, subcategory, cloudinary_url, cloudinary_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING *`,
      [req.user.id, title, description || '', category, subcategory, req.file.path, req.file.filename]
    );

    res.status(201).json({ message: "Video uploaded successfully and is pending review.", video: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/videos - list approved videos
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.*, u.name as user_name, u.trust_score,
       (SELECT COALESCE(AVG(score), 0) FROM video_ratings WHERE video_id = v.id) as avg_rating,
       (SELECT COUNT(*) FROM video_ratings WHERE video_id = v.id) as total_ratings
       FROM videos v JOIN users u ON v.user_id = u.id 
       WHERE v.status = 'approved' 
       ORDER BY v.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/videos/pending - ADMIN ONLY
router.get('/pending', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Access Denied" });
  try {
    const result = await pool.query(
      `SELECT v.*, u.name as user_name 
       FROM videos v JOIN users u ON v.user_id = u.id 
       WHERE v.status = 'pending' 
       ORDER BY v.created_at ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/videos/all-admin - ADMIN ONLY
router.get('/all-admin', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Access Denied" });
  try {
    const result = await pool.query(
      `SELECT v.*, u.name as user_name, u.email as user_email,
       (SELECT COALESCE(AVG(score), 0) FROM video_ratings WHERE video_id = v.id) as avg_rating
       FROM videos v JOIN users u ON v.user_id = u.id 
       ORDER BY v.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/videos/:id/approve - ADMIN ONLY
router.patch('/:id/approve', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Access Denied" });
  try {
    const result = await pool.query("UPDATE videos SET status = 'approved' WHERE id = $1 RETURNING *", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Video not found" });
    
    // Send Email
    const userRes = await pool.query("SELECT email FROM users WHERE id = $1", [result.rows[0].user_id]);
    if (userRes.rows.length > 0) {
      sendVideoApprovalEmail(userRes.rows[0].email, result.rows[0].title);
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/videos/:id/reject - ADMIN ONLY
router.patch('/:id/reject', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Access Denied" });
  try {
    const result = await pool.query("UPDATE videos SET status = 'rejected' WHERE id = $1 RETURNING *", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Video not found" });

    // Send Email
    const userRes = await pool.query("SELECT email FROM users WHERE id = $1", [result.rows[0].user_id]);
    if (userRes.rows.length > 0) {
      sendVideoDenialEmail(
        userRes.rows[0].email, 
        result.rows[0].title, 
        result.rows[0].category, 
        result.rows[0].subcategory
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/videos/:id - ADMIN ONLY
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Access Denied" });
  try {
    const vidRes = await pool.query("SELECT * FROM videos WHERE id = $1", [req.params.id]);
    if (vidRes.rows.length === 0) return res.status(404).json({ error: "Video not found" });
    const video = vidRes.rows[0];

    // Defensive Cloudinary destruction
    if (video.cloudinary_id) {
      try {
        await cloudinary.uploader.destroy(video.cloudinary_id, { resource_type: "video" });
      } catch (cloudErr) {
        console.warn("Cloudinary cleanup failed for video:", video.id, cloudErr.message);
      }
    }

    await pool.query("DELETE FROM videos WHERE id = $1", [req.params.id]);

    res.json({ message: "Video deleted successfully from the vault" });
  } catch (err) {
    console.error("Video Delete Error:", err);
    res.status(500).json({ error: "Server error during vault clearance" });
  }
});

// POST /api/videos/:id/watch
router.post('/:id/watch', auth, async (req, res) => {
  const videoId = req.params.id;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    // Fetch video and creator info (including creator email)
    const videoRes = await client.query(`
      SELECT v.user_id, v.status, v.title, u.email as creator_email 
      FROM videos v 
      JOIN users u ON v.user_id = u.id 
      WHERE v.id=$1
    `, [videoId]);

    if (videoRes.rows.length === 0) {
       client.release();
       return res.status(404).json({ error: "Video not found" });
    }
    const video = videoRes.rows[0];
    
    if (video.status !== "approved") {
      client.release();
      return res.status(403).json({ error: "Video not available" });
    }

    // Free access if they are the uploader
    if (video.user_id === userId) {
      client.release();
      return res.json({ message: "Access granted (uploader)", videoId });
    }

    await client.query("BEGIN");

    // Check if user already owns access
    const exists = await client.query(
      "SELECT 1 FROM video_access WHERE user_id=$1 AND video_id=$2",
      [userId, videoId]
    );

    let purchased = false;
    if (exists.rowCount === 0) {
      // Deduct credit from viewer
      const updateRes = await client.query(
        "UPDATE users SET credits = credits - 1 WHERE id = $1 AND credits >= 1 RETURNING credits, email",
        [userId]
      );

      if (updateRes.rowCount === 0) {
        await client.query("ROLLBACK");
        client.release();
        return res.status(400).json({ error: "Not enough credits" });
      }

      const viewerEmail = updateRes.rows[0].email;

      // Transfer credit to uploader
      await client.query(
        "UPDATE users SET credits = credits + 1 WHERE id = $1",
        [video.user_id]
      );

      // Grant access
      await client.query(
        "INSERT INTO video_access(user_id, video_id) VALUES($1,$2)",
        [userId, videoId]
      );

      // Record transaction
      await client.query(
        `INSERT INTO transactions (sender_id, receiver_id, credits, status, skill_title) 
         VALUES ($1, $2, 1, 'completed', $3)`,
        [userId, video.user_id, `Video: ${video.title}`]
      );
      
      purchased = true;
      
      await client.query("COMMIT");

      // Send Email Notifications
      sendVideoPurchaseEmail(viewerEmail, video.title);
      sendVideoSaleEmail(video.creator_email, video.title);
    } else {
      await client.query("COMMIT");
    }

    // Recalculate trust for uploader after a successful purchase/view
    await recalculateTrust(video.user_id);
    await runFraudDetection(video.user_id);

    res.json({ message: purchased ? "Course Unlocked" : "Access granted", videoId });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

// POST /api/videos/:id/view - Increment view count
router.post('/:id/view', auth, async (req, res) => {
  try {
    await pool.query("UPDATE videos SET views = views + 1 WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/videos/my-uploads - List user's own uploads
router.get('/my-uploads', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.*,
       (SELECT COALESCE(AVG(score), 0) FROM video_ratings WHERE video_id = v.id) as avg_rating,
       (SELECT COUNT(*) FROM video_ratings WHERE video_id = v.id) as total_ratings
       FROM videos v
       WHERE v.user_id = $1
       ORDER BY v.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/videos/my-stats/csv - Export CSV stats for uploader
router.get('/my-stats/csv', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.title, v.category, v.subcategory, v.views, v.created_at,
       (SELECT COALESCE(AVG(score), 0) FROM video_ratings WHERE video_id = v.id) as avg_rating,
       (SELECT COUNT(*) FROM video_ratings WHERE video_id = v.id) as total_ratings
       FROM videos v
       WHERE v.user_id = $1
       ORDER BY v.created_at DESC`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No videos found to export" });
    }

    // Convert to CSV
    const headers = ["Title", "Category", "Subcategory", "Views", "Avg Rating", "Total Ratings", "Created At"];
    const rows = result.rows.map(r => [
      `"${r.title.replace(/"/g, '""')}"`,
      r.category,
      r.subcategory,
      r.views,
      Number(r.avg_rating).toFixed(1),
      r.total_ratings,
      new Date(r.created_at).toLocaleDateString()
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=skillx_video_stats.csv');
    res.status(200).send(csvContent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/videos/my-access
router.get('/my-access', auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT video_id FROM video_access WHERE user_id = $1",
      [req.user.id]
    );
    res.json(result.rows.map(r => r.video_id));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/videos/:id/complete - Mark video as fully watched
router.post('/:id/complete', auth, async (req, res) => {
  try {
    await pool.query(
      "UPDATE video_access SET watched = TRUE WHERE user_id = $1 AND video_id = $2",
      [req.user.id, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/videos/:id/ratings
router.post('/:id/ratings', auth, async (req, res) => {
  const { score, feedback } = req.body;
  const videoId = req.params.id;
  const userId = req.user.id;

  if (!score || score < 1 || score > 5) return res.status(400).json({ error: "Score must be between 1 and 5" });

  try {
    // 1. Get video info
    const videoRes = await pool.query("SELECT user_id FROM videos WHERE id=$1", [videoId]);
    if (videoRes.rows.length === 0) return res.status(404).json({ error: "Video not found" });
    const video = videoRes.rows[0];

    // 2. Block self-rating
    if (video.user_id === userId) {
      return res.status(403).json({ error: "You cannot rate your own video." });
    }

    // 3. Check access AND if watched
    const access = await pool.query(
      "SELECT watched FROM video_access WHERE user_id=$1 AND video_id=$2", 
      [userId, videoId]
    );
    
    if (access.rowCount === 0) {
      return res.status(403).json({ error: "You must unlock the video to rate it." });
    }
    if (!access.rows[0].watched) {
      return res.status(403).json({ error: "You must watch the video completely before rating." });
    }

    await pool.query(
      `INSERT INTO video_ratings(video_id, user_id, score, feedback) 
       VALUES($1, $2, $3, $4)
       ON CONFLICT (video_id, user_id) 
       DO UPDATE SET score = EXCLUDED.score, feedback = EXCLUDED.feedback`,
      [videoId, userId, score, feedback || '']
    );

    // Update trust for creator
    await runFraudDetection(video.user_id);
    await recalculateTrust(video.user_id);

    res.json({ message: "Rating submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/videos/:id/ratings
router.get('/:id/ratings', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.name as user_name 
       FROM video_ratings r JOIN users u ON r.user_id = u.id 
       WHERE r.video_id = $1 ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/videos/:id/comments
router.post('/:id/comments', auth, async (req, res) => {
  const { comment } = req.body;
  const videoId = req.params.id;
  const userId = req.user.id;

  if (!comment || !comment.trim()) return res.status(400).json({ error: "Comment cannot be empty" });

  try {
    // Check if user has access (purchased or is uploader)
    const videoRes = await pool.query("SELECT user_id FROM videos WHERE id=$1", [videoId]);
    if (videoRes.rows.length === 0) return res.status(404).json({ error: "Video not found" });

    const isUploader = videoRes.rows[0].user_id === userId;
    if (!isUploader) {
      const access = await pool.query("SELECT 1 FROM video_access WHERE user_id=$1 AND video_id=$2", [userId, videoId]);
      if (access.rowCount === 0) return res.status(403).json({ error: "You must unlock the video to comment." });
    }

    const result = await pool.query(
      "INSERT INTO video_comments(video_id, user_id, comment) VALUES($1, $2, $3) RETURNING *",
      [videoId, userId, comment.trim()]
    );

    // Fetch user name for response
    const userRes = await pool.query("SELECT name FROM users WHERE id=$1", [userId]);

    res.status(201).json({ 
      ...result.rows[0], 
      user_name: userRes.rows[0]?.name || 'Unknown' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/videos/:id/comments
router.get('/:id/comments', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.name as user_name 
       FROM video_comments c JOIN users u ON c.user_id = u.id 
       WHERE c.video_id = $1 ORDER BY c.created_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/videos/:id/disputes
router.post('/:id/disputes', auth, uploadEvidence.single('evidence'), async (req, res) => {
  const { reason } = req.body;
  const videoId = req.params.id;
  const userId = req.user.id;
  const evidence_url = req.file ? req.file.path : null;

  if (!reason) return res.status(400).json({ error: "Reason is required" });
  if (!evidence_url) return res.status(400).json({ error: "Proof/Evidence is required to raise a dispute." });

  try {
    // Check access
    const access = await pool.query("SELECT 1 FROM video_access WHERE user_id=$1 AND video_id=$2", [userId, videoId]);
    if (access.rowCount === 0) return res.status(403).json({ error: "You must unlock the video to dispute it." });

    const result = await pool.query(
      `INSERT INTO video_disputes(video_id, raised_by, reason, evidence_url) 
       VALUES($1, $2, $3, $4) RETURNING *`,
      [videoId, userId, reason, evidence_url]
    );

    // Update trust for creator after a dispute is raised
    const creatorRes = await pool.query("SELECT user_id FROM videos WHERE id=$1", [videoId]);
    if (creatorRes.rows.length > 0) {
      await recalculateTrust(creatorRes.rows[0].user_id);
    }

    res.status(201).json({ message: "Dispute submitted successfully", dispute: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/videos/disputes - ADMIN ONLY
router.get('/disputes', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Access Denied" });
  try {
    const result = await pool.query(`
      SELECT d.*, v.title as video_title, u.name as user_name 
      FROM video_disputes d 
      JOIN videos v ON d.video_id = v.id 
      JOIN users u ON d.raised_by = u.id 
      ORDER BY d.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/videos/disputes/:id/resolve - ADMIN ONLY
router.post('/disputes/:id/resolve', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Access Denied" });
  const { action, notes } = req.body; // action: 'refund' or 'dismiss'
  const disputeId = req.params.id;

  const client = await pool.connect();
  try {
    const disputeRes = await client.query("SELECT * FROM video_disputes WHERE id = $1", [disputeId]);
    if (disputeRes.rows.length === 0) return res.status(404).json({ error: "Dispute not found" });
    const dispute = disputeRes.rows[0];

    const videoRes = await client.query("SELECT user_id, title FROM videos WHERE id = $1", [dispute.video_id]);
    const video = videoRes.rows[0];

    await client.query("BEGIN");

    if (action === 'refund') {
      // 1. Deduct 1 credit from creator
      await client.query("UPDATE users SET credits = credits - 1 WHERE id = $1", [video.user_id]);
      // 2. Add 1 credit to viewer
      await client.query("UPDATE users SET credits = credits + 1 WHERE id = $1", [dispute.raised_by]);
      // 3. Record transaction
      await client.query(
        "INSERT INTO transactions (sender_id, receiver_id, credits, status, skill_title) VALUES ($1, $2, 1, 'completed', $3)",
        [video.user_id, dispute.raised_by, `Refund: ${video.title}`]
      );
    }

    await client.query(
      "UPDATE video_disputes SET status = $1, admin_notes = $2 WHERE id = $3",
      [action === 'refund' ? 'resolved' : 'dismissed', notes || '', disputeId]
    );

    await client.query("COMMIT");

    // Email user about the decision
    const userRes = await client.query("SELECT email FROM users WHERE id = $1", [dispute.raised_by]);
    if (userRes.rows.length > 0) {
       const nodemailer = require('nodemailer');
       const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
       await transporter.sendMail({
          from: `"SKILLX Admin" <${process.env.EMAIL_USER}>`,
          to: userRes.rows[0].email,
          subject: `Dispute Decision: ${video.title}`,
          html: `<p>Decision: <strong>${action === 'refund' ? 'Refunded' : 'Dismissed'}</strong></p><p>Admin Notes: ${notes || 'None'}</p>`
       });
    }

    res.json({ message: "Dispute resolved successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

module.exports = router;
