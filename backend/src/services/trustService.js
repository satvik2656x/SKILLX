const pool = require('../db/pool');

/**
 * Recalculates trust score for a user.
 * trust = (avg_rating * 0.5) + (completed_sessions * 0.03) - (disputes * 0.2)
 * Clamped to [0.1, 1.0]
 */
/**
 * Recalculates trust score for a user.
 * trust = (avg_rating * 0.4) + (completed_sessions * factor) - (disputes * 0.25) - (decay)
 * factor: 0.06 (bootstrapping) or 0.03 (regular)
 * Clamped to [0.1, 1.0]
 */
async function recalculateTrust(userId) {
  // 1. Get user data
  const userRes = await pool.query('SELECT created_at, trust_score, last_active_at, is_flagged FROM users WHERE id = $1', [userId]);
  const user = userRes.rows[0];

  // 2. Average rating (Live Skills)
  const ratingRes = await pool.query(
    'SELECT AVG(score) as avg_score, COUNT(*) as count FROM ratings WHERE to_user = $1',
    [userId]
  );
  const avgRating = parseFloat(ratingRes.rows[0].avg_score) || 0;

  // 3. Video Ratings (Courses)
  const vRatingRes = await pool.query(
    'SELECT AVG(score) as avg_score FROM video_ratings vr JOIN videos v ON vr.video_id = v.id WHERE v.user_id = $1',
    [userId]
  );
  const vAvgRating = parseFloat(vRatingRes.rows[0].avg_score) || 0;

  // Weighted Average Rating
  const combinedAvg = (avgRating + vAvgRating) > 0 ? (avgRating + vAvgRating) / ( (avgRating > 0 ? 1 : 0) + (vAvgRating > 0 ? 1 : 0) ) : 0;

  // 4. Completed sessions
  const sessionRes = await pool.query(
    `SELECT COUNT(*) as count FROM sessions s
     JOIN transactions t ON s.transaction_id = t.id
     WHERE (t.sender_id = $1 OR t.receiver_id = $1) AND s.status = 'completed'`,
    [userId]
  );
  const completedSessions = parseInt(sessionRes.rows[0].count) || 0;

  // 5. Active Disputes (Penalty)
  const disputeRes = await pool.query(
    `SELECT COUNT(*) as count FROM disputes d
     JOIN transactions t ON d.transaction_id = t.id
     WHERE (t.sender_id = $1 OR t.receiver_id = $1) AND d.status = 'open'`,
    [userId]
  );
  const activeDisputes = parseInt(disputeRes.rows[0].count) || 0;

  // 6. Resolved Disputes against user
  const lostDisputeRes = await pool.query(
    `SELECT COUNT(*) as count FROM disputes d
     JOIN transactions t ON d.transaction_id = t.id
     WHERE t.receiver_id = $1 AND d.status = 'resolved'`,
    [userId]
  );
  const lostDisputes = parseInt(lostDisputeRes.rows[0].count) || 0;

  // 7. Bootstrapping: Higher multiplier for first 3 sessions
  const sessionFactor = completedSessions <= 3 ? 0.08 : 0.04;

  // 8. Reputation Decay: -0.02 for every 14 days of inactivity
  const daysInactive = Math.floor((new Date() - new Date(user.last_active_at)) / (1000 * 60 * 60 * 24));
  const decay = Math.floor(daysInactive / 14) * 0.02;

  // 9. Flagged Penalty
  const flagPenalty = user.is_flagged ? 0.3 : 0;

  // Formula
  let trust = (combinedAvg / 5) * 0.4 + (completedSessions * sessionFactor) - (lostDisputes * 0.3) - (activeDisputes * 0.1) - decay - flagPenalty;
  trust = Math.max(0.05, Math.min(1.0, parseFloat(trust.toFixed(3))));

  await pool.query('UPDATE users SET trust_score = $1, last_active_at = NOW() WHERE id = $2', [trust, userId]);
  return trust;
}

/**
 * Fraud detection: runs after session completion or rating.
 */
async function runFraudDetection(userId) {
  let suspicious = false;
  let reasons = [];

  // Check 1: Rapid Reciprocal Rating Fraud (A rates B, B rates A within 6 hours)
  const reciprocalRes = await pool.query(
    `SELECT r1.from_user, r1.to_user
     FROM ratings r1
     JOIN ratings r2 ON r1.from_user = r2.to_user AND r1.to_user = r2.from_user
     WHERE (r1.from_user = $1 OR r1.to_user = $1)
       AND ABS(EXTRACT(EPOCH FROM (r1.created_at - r2.created_at))) < 21600`,
    [userId]
  );
  if (reciprocalRes.rows.length > 0) {
    suspicious = true;
    reasons.push('Rapid reciprocal rating exchange detected');
  }

  // Check 2: Credit Farming (Multiple transactions with same user in 24h)
  const farmingRes = await pool.query(
    `SELECT sender_id, receiver_id, COUNT(*) as cnt
     FROM transactions
     WHERE (sender_id = $1 OR receiver_id = $1)
       AND created_at > NOW() - INTERVAL '24 hours'
     GROUP BY sender_id, receiver_id
     HAVING COUNT(*) > 2`,
    [userId]
  );
  if (farmingRes.rows.length > 0) {
    suspicious = true;
    reasons.push('High-frequency transactions between same pair');
  }

  // Check 3: Sybil Detection (Multiple account watch farm)
  const sybilRes = await pool.query(
    `SELECT video_id, COUNT(DISTINCT user_id) as viewers
     FROM video_access
     WHERE video_id IN (SELECT id FROM videos WHERE user_id = $1)
       AND created_at > NOW() - INTERVAL '1 hour'
     GROUP BY video_id
     HAVING COUNT(*) > 10`,
    [userId]
  );
  if (sybilRes.rows.length > 0) {
    suspicious = true;
    reasons.push('Abnormal video view spike: possible bot farm');
  }

  if (suspicious) {
    await pool.query(
      'UPDATE users SET is_flagged = true, trust_score = GREATEST(trust_score - 0.2, 0.05) WHERE id = $1',
      [userId]
    );
    console.log(`🚨 Fraud Detected for User ${userId}: ${reasons.join(', ')}`);
  }

  return { suspicious, reasons };
}

module.exports = { recalculateTrust, runFraudDetection };
