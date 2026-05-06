import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Search, FileText, Monitor, Wallet,
  Star, AlertTriangle, LogOut, Zap, Shield, Play, Users, ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { getTrustColor, getTrustLabel, getInitials, avatarColor, formatCredits } from '../lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/videos', label: 'Video Library', icon: Search },
  { to: '/my-videos', label: 'My Videos', icon: Monitor },
  { to: '/wallet', label: 'Wallet', icon: Wallet },
  { to: '/ratings', label: 'Ratings', icon: Star },
  { to: '/disputes', label: 'Disputes', icon: AlertTriangle },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [adminStats, setAdminStats] = useState({ pending: 0, users: 0 });

  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/videos/pending').then(r => setAdminStats(s => ({ ...s, pending: r.data.length })));
      api.get('/users').then(r => setAdminStats(s => ({ ...s, users: r.data.length })));
    }
  }, [user]);

  const handleLogout = () => { logout(); navigate('/'); };

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const trustPct = Math.min(Math.max(user.trust_score * 100, 0), 100);
  const trustColor = getTrustColor(user.trust_score);

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        width: 240, minHeight: '100vh', flexShrink: 0,
        background: 'rgba(0,0,0,0.4)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: '1.6rem', letterSpacing: '-0.5px',
          color: '#fff', display: 'flex', alignItems: 'center', gap: 8
        }}>
          <Zap size={18} strokeWidth={2.5} style={{ color: '#facc15' }} />
          SKILLX
        </span>
        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Peer Skill Exchange</p>
      </div>

      {/* User Card */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: avatarColor(user.name),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 700, color: '#fff', flexShrink: 0
          }}>
            {getInitials(user.name)}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
            <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>{formatCredits(user.credits)} credits</p>
          </div>
        </div>
        {isAdmin ? (
          <div style={{ 
            marginTop: 8, padding: '6px 10px', 
            background: 'rgba(34,197,94,0.1)', 
            borderRadius: 6, border: '1px solid rgba(34,197,94,0.2)' 
          }}>
            <p style={{ fontSize: '0.65rem', color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Shield size={10} /> Authorized System Admin
            </p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>Trust Score</span>
              <span style={{ fontSize: '0.65rem', color: trustColor, fontWeight: 600 }}>{getTrustLabel(user.trust_score)}</span>
            </div>
            <div className="trust-bar">
              <div className="trust-fill" style={{ width: `${trustPct}%`, background: trustColor }} />
            </div>
            <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{(user.trust_score * 100).toFixed(0)}% trusted</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
        {isAdmin ? (
          <>
            <NavLink to="/admin" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} style={{ color: '#22c55e', marginBottom: 12, background: 'rgba(34,197,94,0.08)' }}>
              <Shield size={16} />
              <span>Admin Panel</span>
            </NavLink>
            
            {/* Admin Sub-Tabs */}
            <div style={{ paddingLeft: 12, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { label: 'Moderation', id: 'moderation', icon: Monitor, count: adminStats.pending },
                { label: 'Library', id: 'library', icon: Play, count: 1 },
                { label: 'Platform', id: 'users', icon: Users, count: adminStats.users },
                { label: 'Dispute', id: 'disputes', icon: AlertTriangle }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('switch-admin-tab', { detail: sub.id }));
                    navigate('/admin');
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: 8, border: 'none', background: 'none',
                    color: 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.2s',
                    fontSize: '0.75rem', fontWeight: 500
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <sub.icon size={14} />
                    <span>{sub.label}</span>
                  </div>
                  {sub.count !== undefined && sub.count > 0 && (
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>{sub.count}</span>
                  )}
                </button>
              ))}
            </div>
          </>
        ) : (
          navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))
        )}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px' }}>
        <button onClick={handleLogout} className="sidebar-item" style={{ width: '100%', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
      </div>
    </motion.aside>
  );
}
