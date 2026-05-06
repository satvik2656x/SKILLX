import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    // Fetch sessions
  }, []);

  return (
    <div style={{ padding: '32px 36px' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.5rem', color: '#fff' }}>My Sessions</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>Track your active and completed skill exchange sessions.</p>
        
        <div className="glass-card" style={{ marginTop: 32, padding: 24 }}>
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>No active sessions.</p>
        </div>
      </motion.div>
    </div>
  );
}
