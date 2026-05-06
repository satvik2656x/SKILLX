import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { Transaction } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../lib/utils';
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const statusColor: Record<string, string> = { escrow: '#f59e0b', completed: '#22c55e', cancelled: '#6b7280' };
const statusIcon: Record<string, typeof Clock> = { escrow: Clock, completed: CheckCircle, cancelled: XCircle };

export default function RequestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'sent' | 'received'>('sent');

  useEffect(() => {
    api.get('/transactions/me').then(r => setTransactions(r.data)).finally(() => setLoading(false));
  }, []);

  const sent = transactions.filter(t => t.sender_id === user?.id);
  const received = transactions.filter(t => t.receiver_id === user?.id);
  const list = tab === 'sent' ? sent : received;

  const handleCancel = async (id: number) => {
    try {
      await api.patch(`/transactions/${id}/cancel`);
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: 'cancelled' } : t));
    } catch {}
  };

  const handleStartSession = async (txId: number) => {
    try {
      const r = await api.post('/sessions', { transaction_id: txId });
      navigate(`/session/${r.data.id}`);
    } catch {}
  };

  return (
    <div style={{ padding: '32px 36px', maxWidth: 820 }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2rem', color: '#fff', fontWeight: 400 }}>My Requests</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: 4 }}>Manage your incoming and outgoing skill requests</p>
      </motion.div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4, marginBottom: 24, width: 'fit-content' }}>
        {(['sent', 'received'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s', textTransform: 'capitalize',
            background: tab === t ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: tab === t ? '#fff' : 'rgba(255,255,255,0.4)',
          }}>{t} ({(t === 'sent' ? sent : received).length})</button>
        ))}
      </div>

      {loading ? <p style={{ color: 'rgba(255,255,255,0.3)' }}>Loading...</p> : list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Clock size={32} style={{ color: 'rgba(255,255,255,0.15)', margin: '0 auto 12px' }} />
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>No {tab} requests yet.</p>
          {tab === 'sent' && <button className="btn-primary" style={{ marginTop: 16, padding: '8px 20px', fontSize: '0.85rem' }} onClick={() => navigate('/skills')}>Browse Skills</button>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {list.map((tx, i) => {
            const color = statusColor[tx.status];
            const Icon = statusIcon[tx.status];
            return (
              <motion.div key={tx.id} className="glass-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <Icon size={15} style={{ color }} />
                      <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{tx.skill_title || 'Skill Session'}</p>
                      <span style={{ fontSize: '0.68rem', color, background: `${color}18`, padding: '3px 8px', borderRadius: 6, textTransform: 'capitalize' }}>{tx.status}</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
                      {tab === 'sent' ? `To: ${tx.receiver_name}` : `From: ${tx.sender_name}`} · {tx.credits} credit{tx.credits !== 1 ? 's' : ''}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)' }}>{formatDate(tx.created_at)}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {tx.status === 'escrow' && tab === 'received' && (
                      <button className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => handleStartSession(tx.id)}>
                        Start Session
                      </button>
                    )}
                    {tx.status === 'escrow' && tab === 'sent' && (
                      <button className="btn-ghost" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => handleCancel(tx.id)}>
                        Cancel
                      </button>
                    )}
                    {tx.status === 'completed' && (
                      <button className="btn-ghost" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => navigate(`/dispute/${tx.id}`)}>
                        <AlertTriangle size={13} style={{ marginRight: 4 }} />Dispute
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
