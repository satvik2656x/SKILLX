import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { Transaction } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, formatCredits, getTrustColor } from '../lib/utils';
import { Wallet, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import TrustBadge from '../components/TrustBadge';

export default function WalletPage() {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshUser();
    api.get('/transactions/me').then(r => setTransactions(r.data)).finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const totalEarned = transactions.filter(t => t.receiver_id === user.id && t.status === 'completed').reduce((s, t) => s + t.credits, 0);
  const totalSpent = transactions.filter(t => t.sender_id === user.id && t.status === 'completed').reduce((s, t) => s + t.credits, 0);

  return (
    <div style={{ padding: '32px 36px', maxWidth: 820 }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2rem', color: '#fff', fontWeight: 400 }}>Wallet</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: 4 }}>Your time credit balance and history</p>
      </motion.div>

      {/* Balance card */}
      <div className="glass-card" style={{ padding: '28px 32px', marginBottom: 24, background: 'rgba(250,204,21,0.04)', border: '1px solid rgba(250,204,21,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Current Balance</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '3.5rem', color: '#facc15', lineHeight: 1 }}>{formatCredits(user.credits)}</span>
              <span style={{ fontSize: '1rem', color: 'rgba(250,204,21,0.6)' }}>credits</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>1 credit = 1 hour of skill exchange</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
            <TrustBadge score={user.trust_score} size="md" />
            <Wallet size={28} style={{ color: 'rgba(250,204,21,0.3)' }} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Earned', value: formatCredits(totalEarned), icon: TrendingUp, color: '#22c55e' },
          { label: 'Total Spent', value: formatCredits(totalSpent), icon: TrendingDown, color: '#f87171' },
          { label: 'In Escrow', value: formatCredits(transactions.filter(t => t.status === 'escrow').reduce((s, t) => s + t.credits, 0)), icon: Clock, color: '#f59e0b' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card" style={{ padding: '18px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Icon size={16} style={{ color }} />
            </div>
            <p style={{ fontSize: '1.4rem', fontWeight: 700, color, marginBottom: 2 }}>{value}</p>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Transaction history */}
      <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', marginBottom: 14 }}>Transaction History</h3>
      {loading ? <p style={{ color: 'rgba(255,255,255,0.3)' }}>Loading...</p> : transactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Wallet size={28} style={{ color: 'rgba(255,255,255,0.15)', margin: '0 auto 10px' }} />
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>No transactions yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {transactions.map((tx, i) => {
            const isSender = tx.sender_id === user.id;
            const sign = isSender ? '-' : '+';
            const color = isSender ? '#f87171' : '#22c55e';
            return (
              <motion.div key={tx.id} className="glass-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.85rem', fontWeight: 500, color: '#fff' }}>{tx.skill_title || 'Skill Exchange'}</p>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                    {isSender ? `To ${tx.receiver_name}` : `From ${tx.sender_name}`} · {formatDate(tx.created_at)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color }}>{sign}{formatCredits(tx.credits)}</p>
                  <span style={{ fontSize: '0.65rem', color: tx.status === 'completed' ? '#22c55e' : tx.status === 'escrow' ? '#f59e0b' : 'rgba(255,255,255,0.3)', textTransform: 'capitalize' }}>{tx.status}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
