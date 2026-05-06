import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Star, FileText, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function MyVideosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyVideos();
  }, []);

  const fetchMyVideos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/videos/my-uploads');
      setVideos(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    try {
      const res = await api.get('/videos/my-stats/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'my_video_performance.csv');
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      alert('Failed to download stats.');
    }
  };

  return (
    <div style={{ padding: '32px 36px' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.5rem', color: '#fff', fontWeight: 400 }}>My Videos</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem', marginTop: 4 }}>Manage your uploaded content and track performance.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontSize: '0.85rem' }} onClick={downloadCSV}>
            <FileText size={16} /> Export Stats
          </button>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontSize: '0.85rem' }} onClick={() => navigate('/videos')}>
            <Plus size={16} /> Upload New
          </button>
        </div>
      </motion.div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>Loading your videos...</div>
      ) : videos.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Play size={48} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: 16 }} />
          <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>No videos uploaded yet</h3>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: 8, maxWidth: 400, margin: '8px auto' }}>
            Start sharing your skills with the community and earn credits for every view.
          </p>
          <button className="btn-primary" style={{ marginTop: 24 }} onClick={() => navigate('/videos')}>Upload Your First Video</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {videos.map((v, i) => (
            <motion.div 
              key={v.id} 
              className="glass-card" 
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{ padding: 0, overflow: 'hidden' }}
            >
              <div style={{ width: '100%', height: 180, background: '#000', position: 'relative' }}>
                <img src={`https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=600`} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
                <div style={{ position: 'absolute', top: 12, right: 12 }}>
                   <span style={{ 
                     fontSize: '0.65rem', 
                     color: v.status === 'approved' ? '#22c55e' : v.status === 'pending' ? '#f59e0b' : '#f87171',
                     background: v.status === 'approved' ? 'rgba(34,197,94,0.1)' : v.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(248,113,113,0.1)',
                     padding: '4px 10px', borderRadius: 100, fontWeight: 600, border: '1px solid currentColor', borderOpacity: 0.2
                   }}>
                     {v.status.toUpperCase()}
                   </span>
                </div>
              </div>
              <div style={{ padding: 20 }}>
                <h3 style={{ fontSize: '1rem', color: '#fff', fontWeight: 600, marginBottom: 4 }}>{v.title}</h3>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{v.category} • {v.subcategory}</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                  <div>
                    <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Total Views</p>
                    <p style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}>{v.views || 0}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Avg Rating</p>
                    {Number(v.avg_rating) > 0 ? (
                      <p style={{ fontSize: '1.2rem', color: '#facc15', fontWeight: 700 }}>★ {Number(v.avg_rating).toFixed(1)}</p>
                    ) : (
                      <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.2)', fontWeight: 600, marginTop: 4 }}>No ratings</p>
                    )}
                  </div>
                </div>

                {v.status === 'rejected' && (
                  <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(248,113,113,0.05)', borderRadius: 8, display: 'flex', gap: 8 }}>
                    <AlertCircle size={14} style={{ color: '#f87171', flexShrink: 0 }} />
                    <p style={{ fontSize: '0.7rem', color: 'rgba(248,113,113,0.8)' }}>
                      This video was rejected. Please review our guidelines and try again.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
