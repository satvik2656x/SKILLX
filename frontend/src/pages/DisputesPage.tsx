import React from 'react';
import { motion } from 'framer-motion';

export default function DisputesPage() {
  return (
    <div style={{ padding: '32px 36px' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.5rem', color: '#fff' }}>Disputes</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>Manage your active disputes and resolution requests.</p>
        
        <div className="glass-card" style={{ marginTop: 32, padding: 24 }}>
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>No active disputes.</p>
        </div>
      </motion.div>
    </div>
  );
}
