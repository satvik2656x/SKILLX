import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { Rating } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Star, TrendingUp } from 'lucide-react';
import { formatDate, avatarColor, getInitials } from '../lib/utils';

export default function RatingsPage() {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) api.get(`/ratings/user/${user.id}`).then(r => setRatings(r.data)).finally(() => setLoading(false));
  }, [user]);

  const avg = ratings.length > 0 ? ratings.reduce((s, r) => s + r.score, 0) / ratings.length : 0;

  return (
    <div style={{ padding: '32px 36px', maxWidth: 720 }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2rem', color: '#fff', fontWeight: 400 }}>My Ratings</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: 4 }}>Feedback from your skill exchange partners</p>
      </motion.div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Star size={18} style={{ color: '#facc15' }} fill="#facc15" />
            <span style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>{avg.toFixed(1)}</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>Average Rating</p>
        </div>
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <TrendingUp size={18} style={{ color: '#818cf8' }} />
            <span style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>{ratings.length}</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>Total Reviews</p>
        </div>
      </div>

      {/* Distribution */}
      {ratings.length > 0 && (
        <div className="glass-card" style={{ padding: '20px 24px', marginBottom: 24 }}>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>Rating Distribution</p>
          {[5, 4, 3, 2, 1].map(s => {
            const count = ratings.filter(r => r.score === s).length;
            const pct = ratings.length > 0 ? (count / ratings.length) * 100 : 0;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 2, width: 80 }}>
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} size={11} fill={i <= s ? '#facc15' : 'transparent'} stroke={i <= s ? '#facc15' : 'rgba(255,255,255,0.2)'} />)}
                </div>
                <div className="trust-bar" style={{ flex: 1 }}>
                  <div className="trust-fill" style={{ width: `${pct}%`, background: '#facc15' }} />
                </div>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', width: 24, textAlign: 'right' }}>{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {loading ? <p style={{ color: 'rgba(255,255,255,0.3)' }}>Loading...</p> : ratings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Star size={28} style={{ color: 'rgba(255,255,255,0.15)', margin: '0 auto 10px' }} />
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>No ratings yet. Complete sessions to receive feedback.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ratings.map((r, i) => (
            <motion.div key={r.id} className="glass-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} style={{ padding: '18px 22px' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: avatarColor(r.from_name || ''), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {getInitials(r.from_name || '?')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{r.from_name}</p>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map(s => <Star key={s} size={13} fill={s <= r.score ? '#facc15' : 'transparent'} stroke={s <= r.score ? '#facc15' : 'rgba(255,255,255,0.2)'} />)}
                    </div>
                  </div>
                  {r.feedback && <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 4 }}>{r.feedback}</p>}
                  <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)' }}>{formatDate(r.created_at)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
