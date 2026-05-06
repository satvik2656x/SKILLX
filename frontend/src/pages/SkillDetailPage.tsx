import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { Skill } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { avatarColor, getInitials, getTrustColor, getTrustLabel, formatDate } from '../lib/utils';
import { Clock, ArrowLeft, Shield, Star, AlertCircle } from 'lucide-react';

export default function SkillDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/skills/${id}`).then(r => setSkill(r.data)).finally(() => setLoading(false));
  }, [id]);

  const handleRequest = async () => {
    if (!skill || !user) return;
    if (user.credits < skill.hours_required) { setError('Insufficient credits.'); return; }
    setRequesting(true); setError('');
    try {
      await api.post('/transactions', { receiver_id: skill.user_id, skill_id: skill.id, credits: skill.hours_required });
      setSuccess('Request sent! Credits moved to escrow.');
      setTimeout(() => navigate('/requests'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send request.');
    } finally { setRequesting(false); }
  };

  if (loading) return <div style={{ padding: 40, color: 'rgba(255,255,255,0.4)' }}>Loading...</div>;
  if (!skill) return <div style={{ padding: 40, color: '#f87171' }}>Skill not found.</div>;

  const isOwn = skill.user_id === user?.id;
  const tColor = getTrustColor(skill.user_trust_score || 0.3);
  const canAfford = (user?.credits || 0) >= skill.hours_required;

  return (
    <div style={{ padding: '32px 36px', maxWidth: 720 }}>
      <button onClick={() => navigate('/skills')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', marginBottom: 24 }}>
        <ArrowLeft size={16} />Back to Skills
      </button>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: avatarColor(skill.user_name || ''), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: '#fff', border: `2px solid ${tColor}66` }}>
              {getInitials(skill.user_name || '?')}
            </div>
            <div>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>{skill.user_name}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <Shield size={12} style={{ color: tColor }} />
                <span style={{ fontSize: '0.72rem', color: tColor }}>{getTrustLabel(skill.user_trust_score || 0.3)} · {((skill.user_trust_score || 0.3) * 100).toFixed(0)}%</span>
              </div>
            </div>
            <span className="category-chip" style={{ marginLeft: 'auto' }}>{skill.category}</span>
          </div>

          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2rem', color: '#fff', fontWeight: 400, marginBottom: 12 }}>{skill.title}</h1>
          <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>{skill.description}</p>

          <div style={{ display: 'flex', gap: 20, marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={15} style={{ color: '#facc15' }} />
              <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>{skill.hours_required} credit{skill.hours_required !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>Posted {formatDate(skill.created_at)}</div>
          </div>
        </div>

        {/* Request panel */}
        {!isOwn ? (
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', marginBottom: 6 }}>Request this Skill</h3>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: 16, lineHeight: 1.6 }}>
              {skill.hours_required} credit{skill.hours_required !== 1 ? 's' : ''} will be locked in escrow until the session completes.
            </p>

            {/* Credit balance check */}
            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>Your balance</p>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: '#facc15' }}>{user?.credits.toFixed(1)} credits</p>
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>Required</p>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{skill.hours_required} credits</p>
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>After</p>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: canAfford ? '#22c55e' : '#f87171' }}>
                  {((user?.credits || 0) - skill.hours_required).toFixed(1)} credits
                </p>
              </div>
            </div>

            {!canAfford && (
              <div style={{ display: 'flex', gap: 8, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                <AlertCircle size={15} style={{ color: '#f87171', flexShrink: 0 }} />
                <p style={{ fontSize: '0.78rem', color: '#f87171' }}>You don't have enough credits. Complete sessions to earn more.</p>
              </div>
            )}

            {success && <p style={{ fontSize: '0.82rem', color: '#86efac', background: 'rgba(34,197,94,0.08)', padding: '10px 14px', borderRadius: 8, marginBottom: 12 }}>{success}</p>}
            {error && <p style={{ fontSize: '0.82rem', color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '10px 14px', borderRadius: 8, marginBottom: 12 }}>{error}</p>}

            <button className="btn-primary" disabled={requesting || !canAfford} onClick={handleRequest}
              style={{ width: '100%', opacity: (!canAfford || requesting) ? 0.5 : 1 }}>
              {requesting ? 'Sending...' : `Request · ${skill.hours_required} Credit${skill.hours_required !== 1 ? 's' : ''}`}
            </button>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
            <Star size={20} style={{ color: 'rgba(255,255,255,0.2)', margin: '0 auto 8px' }} />
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>This is your own skill listing.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
