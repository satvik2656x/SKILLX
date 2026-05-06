import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Star } from 'lucide-react';

export default function RatingPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score === 0) { setError('Please select a rating.'); return; }
    setSubmitting(true); setError('');
    try {
      await api.post('/ratings', { session_id: Number(sessionId), score, feedback });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit rating.');
    } finally { setSubmitting(false); }
  };

  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ width: '100%', maxWidth: 440, padding: '40px 36px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 8 }}>🎉</div>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.8rem', color: '#fff', fontWeight: 400, marginBottom: 6 }}>Session Complete!</h1>
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', marginBottom: 32, lineHeight: 1.6 }}>Credits have been transferred. How was your experience?</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>Rate your session partner</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} type="button"
                  onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
                  onClick={() => setScore(s)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, transition: 'transform 0.1s', transform: (hover || score) >= s ? 'scale(1.2)' : 'scale(1)' }}
                >
                  <Star size={36} fill={(hover || score) >= s ? '#facc15' : 'transparent'} stroke={(hover || score) >= s ? '#facc15' : 'rgba(255,255,255,0.2)'} />
                </button>
              ))}
            </div>
            {(hover || score) > 0 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: '0.85rem', color: '#facc15', fontWeight: 600 }}>
                {labels[hover || score]}
              </motion.p>
            )}
          </div>

          <div style={{ marginBottom: 20, textAlign: 'left' }}>
            <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>Feedback (optional)</label>
            <textarea className="skillx-input" placeholder="Share your experience..." value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} style={{ resize: 'none' }} />
          </div>

          {error && <p style={{ fontSize: '0.8rem', color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '8px 12px', borderRadius: 8, marginBottom: 14 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn-ghost" onClick={() => navigate('/dashboard')} style={{ flex: 1 }}>Skip</button>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ flex: 2, opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: 20, padding: '12px', background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.15)', borderRadius: 10 }}>
          <p style={{ fontSize: '0.72rem', color: 'rgba(129,140,248,0.9)', lineHeight: 1.5 }}>
            ✨ Your trust score will be updated after both users submit their ratings.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
