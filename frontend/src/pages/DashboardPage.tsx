import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { Skill, Session } from '../types';
import { getTrustColor, getTrustLabel, formatCredits, formatDate, avatarColor, getInitials } from '../lib/utils';
import TrustBadge from '../components/TrustBadge';
import { Clock, Star, BookOpen, TrendingUp, Shield, Bell, Plus, FileText, Monitor, Play } from 'lucide-react';

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [recommendations, setRecommendations] = useState<Skill[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [myVideos, setMyVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    avg_rating_pct: 0,
    sessions_pct: 0,
    disputes_pct: 100
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin');
      return;
    }
    refreshUser();
    const fetchData = async () => {
      try {
        const [skRes, seRes, rRes, vRes, stRes] = await Promise.all([
          api.get('/skills'),
          api.get('/sessions/me'),
          api.get('/matching/video-recommendations'),
          api.get('/videos/my-uploads'),
          api.get('/users/me/stats')
        ]);
        setSkills(skRes.data.slice(0, 6));
        setSessions(seRes.data.slice(0, 5));
        setRecommendations(rRes.data);
        setMyVideos(vRes.data);
        setStats(stRes.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, navigate]);

  if (!user) return null;
  const trustPct = Math.min(user.trust_score * 100, 100);
  const trustColor = getTrustColor(user.trust_score);

  const CATEGORIES = ['Programming', 'Design', 'Marketing', 'Finance'];

  return (
    <div style={{ padding: '40px 48px', maxWidth: 1200, margin: '0 auto', minHeight: '100vh', background: '#020617' }}>
      
      {/* Cinematic Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 50, borderBottom: '1px solid rgba(212, 175, 55, 0.1)', paddingBottom: 32 }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4AF37' }} />
              <span style={{ fontSize: '0.7rem', color: '#D4AF37', fontWeight: 800, letterSpacing: '0.2em' }}>OVERVIEW</span>
           </div>
           <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '3.5rem', color: '#fff', fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1 }}>
              Welcome back, {user.name.split(' ')[0]}
           </h1>
           <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16 }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', fontWeight: 500 }}>{formatDate(user.created_at)} · {getTrustLabel(user.trust_score)}</p>
              {sessions.length < 3 && (
                <span style={{ fontSize: '0.65rem', background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', padding: '4px 12px', borderRadius: 100, border: '1px solid rgba(212, 175, 55, 0.2)', fontWeight: 700 }}>
                  ✨ BOOTSTRAPPING MODE
                </span>
              )}
           </div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
           <button onClick={() => navigate('/skills')} style={{ height: 48, padding: '0 24px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
              <Plus size={16} /> Post Skill
           </button>
           <button style={{ height: 48, width: 48, borderRadius: 14, background: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
              <Bell size={20} />
              <span style={{ position: 'absolute', top: 14, right: 14, width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
           </button>
        </div>
      </motion.div>

      {/* Stats Grid - High Fidelity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 40 }}>
        {[
          { label: 'CREDITS', value: formatCredits(user.credits), icon: Clock, color: '#facc15' },
          { label: 'TRUST SCORE', value: `${trustPct.toFixed(0)}%`, icon: Shield, color: '#D4AF37' },
          { label: 'SESSIONS', value: String(sessions.length), icon: BookOpen, color: '#818cf8' },
          { label: 'STATUS', value: user.is_flagged ? 'FLAGGED' : 'CLEAN', icon: Star, color: user.is_flagged ? '#ef4444' : '#22c55e' },
        ].map(({ label, value, icon: Icon, color }) => (
          <motion.div key={label} whileHover={{ y: -5 }} className="liquid-glass" style={{ padding: '24px', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 12 }}>{label}</p>
                <p style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>{value}</p>
              </div>
              <div style={{ background: `${color}15`, borderRadius: 12, padding: 10, border: `1px solid ${color}30` }}>
                <Icon size={20} style={{ color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, marginBottom: 48 }}>
        {/* Left Col: Reputation */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="liquid-glass" style={{ padding: 32, borderRadius: 32, border: '1px solid rgba(212, 175, 55, 0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ color: '#D4AF37', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.15em', marginBottom: 32 }}>REPUTATION ARCHIVE</h3>
          <TrustBadge score={user.trust_score} size="lg" />
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', margin: '24px 0', lineHeight: 1.6 }}>
            Elite contributors maintain high trust scores through verified mastery.
          </p>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Avg Rating', pct: Math.round(stats.avg_rating_pct) },
              { label: 'Sessions', pct: Math.round(stats.sessions_pct) },
              { label: 'No Disputes', pct: Math.round(stats.disputes_pct) },
            ].map(({ label, pct }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: '0.75rem', color: '#D4AF37', fontWeight: 700 }}>{pct}%</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: '#D4AF37', borderRadius: 2, boxShadow: '0 0 10px rgba(212, 175, 55, 0.3)' }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Col: Activity */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="liquid-glass" style={{ padding: 32, borderRadius: 32, border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>Recent Engagement</h3>
            <button onClick={() => navigate('/sessions')} style={{ fontSize: '0.8rem', color: '#D4AF37', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>View Registry →</button>
          </div>
          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
               <BookOpen size={40} style={{ color: 'rgba(255,255,255,0.05)', marginBottom: 20 }} />
               <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>No active sessions recorded.</p>
               <button className="btn-primary" style={{ marginTop: 24, background: '#D4AF37', color: '#000' }} onClick={() => navigate('/skills')}>Explore Mastery</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {sessions.map(s => (
                <div key={s.id} style={{ padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 20 }}>
                   <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.status === 'completed' ? '#22c55e' : '#facc15' }} />
                   <div style={{ flex: 1 }}>
                      <p style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{s.skill_title}</p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: 4 }}>{s.other_user_name} · {formatDate(s.created_at)}</p>
                   </div>
                   <span style={{ fontSize: '0.7rem', fontWeight: 800, color: s.status === 'completed' ? '#22c55e' : '#facc15', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.status}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Categories - Elite Row */}
      <section style={{ marginBottom: 60 }}>
        <h3 style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontWeight: 800, letterSpacing: '0.15em', marginBottom: 24 }}>EXPLORE THE ARCHIVES</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {CATEGORIES.map(cat => (
            <button key={cat} className="category-chip" style={{ padding: '10px 20px', borderRadius: 14, fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }} onClick={() => navigate(`/videos?category=${cat}`)}>{cat}</button>
          ))}
        </div>
      </section>

      {/* Recommended Videos - Elite Gallery Preview */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.4rem', color: '#fff', fontFamily: "'Instrument Serif', serif" }}>Curated for Your Mastery</h2>
          <button className="btn-ghost" style={{ border: 'none', color: '#D4AF37', fontWeight: 700 }} onClick={() => navigate('/videos')}>View Gallery →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
          {recommendations.slice(0, 4).map(v => (
            <motion.div 
              key={v.id} 
              whileHover={{ y: -8 }} 
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, overflow: 'hidden', cursor: 'pointer' }} 
              onClick={() => navigate(`/videos?category=${v.category}&search=${v.title}`)}
            >
               <div style={{ width: '100%', height: 150, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <Play size={32} style={{ color: 'rgba(212, 175, 55, 0.3)' }} fill="rgba(212, 175, 55, 0.1)" />
                  <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '4px 10px', borderRadius: 8, fontSize: '0.65rem', color: '#D4AF37', fontWeight: 800 }}>1 CREDIT</div>
               </div>
               <div style={{ padding: 20 }}>
                  <p style={{ fontSize: '0.6rem', color: '#D4AF37', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase' }}>{v.category}</p>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>{v.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                     <Star size={14} style={{ color: '#D4AF37' }} fill="#D4AF37" />
                     <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{Number(v.avg_rating || 0).toFixed(1)}</span>
                  </div>
               </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
