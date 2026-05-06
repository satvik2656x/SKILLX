import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Play, Monitor, FileText, CheckCircle, Star, Clock } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { CATEGORIES } from '../types';

export default function SkillsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  
  const [videos, setVideos] = useState<any[]>([]);
  const [ownedVideos, setOwnedVideos] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const handleWatch = async (video: any) => {
    if (ownedVideos.includes(video.id) || video.user_id === user?.id) {
      // For legacy page, we can either open a modal or redirect to the new gallery
      // To keep it consistent, let's redirect to the new gallery with a specific search
      navigate(`/videos?category=${video.category}&search=${video.title}`);
    } else {
      if (confirm(`Unlock "${video.title}" for 1 credit?`)) {
        try {
          await api.post(`/videos/${video.id}/watch`);
          setOwnedVideos(prev => [...prev, video.id]);
          await refreshUser();
          navigate(`/videos?category=${video.category}&search=${video.title}`);
        } catch (err: any) {
          alert(err.response?.data?.error || 'Failed to unlock');
        }
      }
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vRes, oRes] = await Promise.all([
        api.get('/videos'),
        api.get('/videos/my-access')
      ]);
      setVideos(vRes.data);
      setOwnedVideos(oRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter(v => {
    // 1. Ownership Filter
    if (activeTab === 'mine') {
      const isOwned = ownedVideos.includes(v.id) || v.user_id === user?.id;
      if (!isOwned) return false;
    }

    // 2. Search Filter (Global if searching)
    const searchTerm = search.toLowerCase();
    const matchesSearch = !search || 
      v.title.toLowerCase().includes(searchTerm) || 
      v.category.toLowerCase().includes(searchTerm) || 
      v.subcategory.toLowerCase().includes(searchTerm);
    
    if (search) return matchesSearch;

    // 3. Category Filter (Only if not searching)
    return !activeCategory || v.category === activeCategory.toLowerCase();
  });

  return (
    <div style={{ padding: '32px 36px' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.5rem', color: '#fff', fontWeight: 400 }}>Video Library</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem', marginTop: 4 }}>Premium courses on-demand. 1 Credit per video.</p>
        </div>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontSize: '0.85rem' }} onClick={() => navigate('/videos')}>
          <Plus size={16} /> Upload Video
        </button>
      </motion.div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button 
          onClick={() => { setActiveTab('all'); setActiveCategory(''); }} 
          style={{ 
            padding: '12px 4px', background: 'none', border: 'none', 
            color: activeTab === 'all' ? '#fff' : 'rgba(255,255,255,0.4)', 
            borderBottom: activeTab === 'all' ? '2px solid #fff' : '2px solid transparent',
            fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer'
          }}
        >
          All Courses
        </button>
        <button 
          onClick={() => { setActiveTab('mine'); setActiveCategory(''); }} 
          style={{ 
            padding: '12px 4px', background: 'none', border: 'none', 
            color: activeTab === 'mine' ? '#fff' : 'rgba(255,255,255,0.4)', 
            borderBottom: activeTab === 'mine' ? '2px solid #fff' : '2px solid transparent',
            fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer'
          }}
        >
          My Courses
        </button>
        {activeTab === 'mine' && (
          <button 
            className="btn-secondary" 
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', padding: '6px 12px' }}
            onClick={async () => {
              try {
                const res = await api.get('/videos/my-stats/csv', { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'my_video_stats.csv');
                document.body.appendChild(link);
                link.click();
              } catch (err) {
                alert('No data available to download.');
              }
            }}
          >
            <FileText size={14} /> Download Stats (CSV)
          </button>
        )}
      </div>

      {/* Search & Chips */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input className="skillx-input" placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`category-chip ${activeCategory === '' ? 'active' : ''}`} onClick={() => setActiveCategory('')}>All</button>
          {CATEGORIES.slice(0, 6).map(cat => (
            <button key={cat} className={`category-chip ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat === activeCategory ? '' : cat)}>{cat}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>Loading courses...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {filteredVideos.map((v, i) => (
            <motion.div 
              key={v.id} 
              className="glass-card" 
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
              onClick={() => handleWatch(v)}
            >
              <div style={{ width: '100%', height: 160, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <Play size={40} style={{ color: 'rgba(255,255,255,0.5)', zIndex: 2 }} />
                <img src={`https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400`} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
              </div>
              <div style={{ padding: 16 }}>
                <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 600 }}>{v.title}</h3>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{v.category.toUpperCase()} • 1 Credit</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                   <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                     <Play size={10} /> {v.views || 0} views
                   </span>
                   <span style={{ fontSize: '0.7rem', color: Number(v.avg_rating) > 0 ? '#facc15' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                     ★ {Number(v.avg_rating) > 0 ? Number(v.avg_rating).toFixed(1) : 'New'}
                   </span>
                </div>
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: ownedVideos.includes(v.id) || v.user_id === user?.id ? '#22c55e' : '#facc15' }}>
                  <Monitor size={14} /> {ownedVideos.includes(v.id) || v.user_id === user?.id ? 'Purchased' : 'On-Demand Course'}
                </div>
              </div>
            </motion.div>
          ))}
          {filteredVideos.length === 0 && (
            <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '60px 0' }}>
               <p style={{ color: 'rgba(255,255,255,0.3)' }}>{activeTab === 'mine' ? 'You haven\'t purchased or uploaded any courses yet.' : 'No video courses found.'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
