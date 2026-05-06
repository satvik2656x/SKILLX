import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Users, AlertTriangle, Play, CheckCircle, Trash2, FileText, Star, Activity, Crown, Globe, ShieldCheck } from 'lucide-react';
import { formatDate } from '../lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type AdminTab = 'moderation' | 'library' | 'users' | 'disputes';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('moderation');
  const [users, setUsers] = useState<any[]>([]);
  const [sessionDisputes, setSessionDisputes] = useState<any[]>([]);
  const [videoDisputes, setVideoDisputes] = useState<any[]>([]);
  const [allVideos, setAllVideos] = useState<any[]>([]);
  const [pendingVideos, setPendingVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminNote, setAdminNote] = useState('');
  const [watchVideo, setWatchVideo] = useState<any>(null);

  useEffect(() => {
    fetchAdminData();
    const handleTabSwitch = (e: any) => setActiveTab(e.detail as AdminTab);
    window.addEventListener('switch-admin-tab', handleTabSwitch);
    return () => window.removeEventListener('switch-admin-tab', handleTabSwitch);
  }, []);

  const fetchAdminData = async () => {
    try {
      const [uRes, vRes, vdRes, sdRes, allVRes] = await Promise.all([
        api.get('/users').catch(() => ({ data: [] })),
        api.get('/videos/pending').catch(() => ({ data: [] })),
        api.get('/disputes/videos').catch(() => ({ data: [] })),
        api.get('/disputes/all').catch(() => ({ data: [] })),
        api.get('/videos/all-admin').catch(() => ({ data: [] }))
      ]);
      setUsers(uRes.data);
      setPendingVideos(vRes.data);
      setVideoDisputes(vdRes.data);
      setSessionDisputes(sdRes.data);
      setAllVideos(allVRes.data);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoAction = async (id: number, action: 'approve' | 'reject' | 'delete') => {
    try {
      if (action === 'delete') {
        if (!confirm('Are you sure you want to permanently delete this video?')) return;
        await api.delete(`/videos/${id}`);
      } else {
        await api.patch(`/videos/${id}/${action}`);
      }
      fetchAdminData(); 
    } catch (err: any) {
      alert(err.response?.data?.error || 'Action failed');
    }
  };

  const downloadDisputePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('SKILLX: System Audit Report', 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    const tableData = [
      ...sessionDisputes.map(d => [formatDate(d.created_at), 'Session', d.raised_by_email, d.skill_title || 'N/A', d.status.toUpperCase(), d.admin_note || 'N/A']),
      ...videoDisputes.map(d => [formatDate(d.created_at), 'Video', d.raised_by_email, d.video_title || 'N/A', d.status.toUpperCase(), d.admin_note || 'N/A'])
    ];

    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Type', 'Raised By', 'Target', 'Status', 'Resolution Note']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [212, 175, 55] },
      styles: { fontSize: 8 }
    });
    doc.save('skillx_royal_audit.pdf');
  };

  const downloadLibraryPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('SKILLX: Vault Inventory Report', 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    const tableData = allVideos.map(v => [
      v.title,
      v.category,
      v.subcategory,
      v.user_name,
      v.status.toUpperCase(),
      `${v.views || 0} views`
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Title', 'Category', 'Subcategory', 'Contributor', 'Status', 'Engagement']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [212, 175, 55] },
      styles: { fontSize: 8 }
    });
    doc.save('skillx_library_inventory.pdf');
  };

  if (user?.role !== 'admin') {
    return <div style={{ padding: 100, color: '#fca5a5', textAlign: 'center' }}><AlertTriangle size={64} style={{ margin: '0 auto 24px', opacity: 0.5 }} />Elite Access Required.</div>;
  }

  return (
    <div style={{ padding: '40px 60px', maxWidth: 1400, margin: '0 auto', minHeight: '100vh', background: '#020617' }}>
      
      {/* Royal Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 60, borderBottom: '1px solid rgba(212, 175, 55, 0.2)', paddingBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Crown size={20} style={{ color: '#D4AF37' }} />
            <span style={{ fontSize: '0.7rem', color: '#D4AF37', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Elite Command Center</span>
          </div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '3.5rem', color: '#fff', fontWeight: 400, letterSpacing: '-0.02em' }}>
             {activeTab === 'moderation' && 'Curation'}
             {activeTab === 'library' && 'The Archive'}
             {activeTab === 'users' && 'Oversight'}
             {activeTab === 'disputes' && 'Resolution'}
          </h1>
        </div>

        {/* Status Pills */}
        <div style={{ display: 'flex', gap: 16 }}>
           {[
             { icon: <Users size={14} />, label: 'CITIZENS', val: users.length, color: '#D4AF37' },
             { icon: <Activity size={14} />, label: 'PENDING', val: pendingVideos.length, color: '#fff' },
             { icon: <ShieldCheck size={14} />, label: 'DISPUTES', val: videoDisputes.length + sessionDisputes.filter(d => d.status === 'open').length, color: '#ef4444' }
           ].map(s => (
             <div key={s.label} className="liquid-glass" style={{ padding: '12px 24px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                <div style={{ color: s.color }}>{s.icon}</div>
                <div>
                   <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 800 }}>{s.label}</p>
                   <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>{s.val}</p>
                </div>
             </div>
           ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'moderation' && (
          <motion.div key="mod" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 24 }}>
                {pendingVideos.map(v => (
                  <div key={v.id} className="liquid-glass" style={{ padding: 24, borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div onClick={() => setWatchVideo(v)} style={{ cursor: 'pointer', width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', background: '#000', marginBottom: 20, position: 'relative' }}>
                       <video src={v.cloudinary_url} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
                       <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Play size={48} style={{ color: '#D4AF37' }} />
                       </div>
                    </div>
                    <h4 style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 600, marginBottom: 4 }}>{v.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>{v.category} • Proposed by {v.user_name}</p>
                    <div style={{ display: 'flex', gap: 12 }}>
                       <button onClick={() => handleVideoAction(v.id, 'approve')} style={{ flex: 1, height: 44, borderRadius: 12, background: '#D4AF37', color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Grant Entry</button>
                       <button onClick={() => handleVideoAction(v.id, 'reject')} style={{ flex: 1, height: 44, borderRadius: 12, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 600, border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer' }}>Decline</button>
                    </div>
                  </div>
                ))}
             </div>
             {pendingVideos.length === 0 && <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: 100 }}>The curation queue is currently empty.</p>}
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div key="usr" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
             <div className="liquid-glass" style={{ borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                   <thead>
                      <tr style={{ background: 'rgba(212, 175, 55, 0.03)', borderBottom: '1px solid rgba(212, 175, 55, 0.1)' }}>
                         <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '0.7rem', color: '#D4AF37', letterSpacing: '0.1em' }}>CITIZEN</th>
                         <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '0.7rem', color: '#D4AF37', letterSpacing: '0.1em' }}>STATUS</th>
                         <th style={{ padding: '20px 24px', textAlign: 'right', fontSize: '0.7rem', color: '#D4AF37', letterSpacing: '0.1em' }}>REPUTATION</th>
                      </tr>
                   </thead>
                   <tbody>
                      {users.filter(u => u.email !== 'maiticmaitic@gmail.com').map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                           <td style={{ padding: '20px 24px' }}>
                              <p style={{ color: '#fff', fontWeight: 600 }}>{u.name}</p>
                              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>{u.email}</p>
                           </td>
                           <td style={{ padding: '20px 24px' }}>
                              <span style={{ fontSize: '0.7rem', color: u.is_flagged ? '#ef4444' : '#22c55e', fontWeight: 700 }}>{u.is_flagged ? 'EXILED' : 'ACTIVE'}</span>
                           </td>
                           <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                              <button onClick={() => handleToggleFlag(u.id)} style={{ padding: '6px 12px', borderRadius: 8, background: 'none', border: `1px solid ${u.is_flagged ? '#22c55e' : '#ef4444'}`, color: u.is_flagged ? '#22c55e' : '#ef4444', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>
                                 {u.is_flagged ? 'RESTORE' : 'FLAG FRAUD'}
                              </button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </motion.div>
        )}

        {activeTab === 'library' && (
          <motion.div key="lib" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 600 }}>System Vault</h3>
                <button 
                  onClick={downloadLibraryPDF} 
                  className="liquid-glass" 
                  style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', padding: '10px 20px', borderRadius: 12, color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.2)', fontWeight: 700, cursor: 'pointer' }}
                >
                  <FileText size={16} /> DOWNLOAD ARCHIVE REPORT (PDF)
                </button>
             </div>
             <div className="liquid-glass" style={{ borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                   <thead>
                      <tr style={{ background: 'rgba(212, 175, 55, 0.03)', borderBottom: '1px solid rgba(212, 175, 55, 0.1)' }}>
                         <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '0.7rem', color: '#D4AF37', letterSpacing: '0.1em' }}>VAULT ITEM</th>
                         <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '0.7rem', color: '#D4AF37', letterSpacing: '0.1em' }}>CONTRIBUTOR</th>
                         <th style={{ padding: '20px 24px', textAlign: 'right', fontSize: '0.7rem', color: '#D4AF37', letterSpacing: '0.1em' }}>ACTION</th>
                      </tr>
                   </thead>
                   <tbody>
                      {allVideos.map(v => (
                        <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                           <td style={{ padding: '20px 24px' }}>
                              <p style={{ color: '#fff', fontWeight: 600 }}>{v.title}</p>
                              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>{v.status.toUpperCase()}</p>
                           </td>
                           <td style={{ padding: '20px 24px' }}>
                              <p style={{ color: 'rgba(255,255,255,0.6)' }}>{v.user_name}</p>
                           </td>
                           <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                              <button onClick={() => handleVideoAction(v.id, 'delete')} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </motion.div>
        )}

        {activeTab === 'disputes' && (
          <motion.div key="dis" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h3 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 600 }}>Active Cases</h3>
                <button 
                  onClick={downloadDisputePDF} 
                  className="liquid-glass" 
                  style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', padding: '10px 20px', borderRadius: 12, color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.2)', fontWeight: 700, cursor: 'pointer' }}
                >
                  <FileText size={16} /> DOWNLOAD SYSTEM AUDIT (PDF)
                </button>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[...videoDisputes, ...sessionDisputes].map(d => (
                  <div key={d.id} className="liquid-glass" style={{ padding: 24, borderRadius: 20, borderLeft: `4px solid ${d.status === 'open' ? '#ef4444' : '#D4AF37'}` }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ color: '#fff', fontWeight: 700 }}>{d.video_title || d.skill_title || 'Private Session'}</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: d.status === 'open' ? '#f59e0b' : '#D4AF37' }}>{d.status.toUpperCase()}</span>
                     </div>
                     <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 12 }}>{d.reason}</p>
                     {d.status === 'open' && (
                        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                           <input type="text" className="skillx-input" placeholder="Verdict Note..." onChange={e => setAdminNote(e.target.value)} style={{ flex: 1, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }} />
                           <button onClick={() => d.video_id ? handleVideoDispute(d.id, 'refund') : handleSessionDispute(d.id, 'refund')} style={{ padding: '0 20px', borderRadius: 10, background: '#ef4444', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Refund</button>
                           <button onClick={() => d.video_id ? handleVideoDispute(d.id, 'reject') : handleSessionDispute(d.id, 'confirm')} style={{ padding: '0 20px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>Reject</button>
                        </div>
                     )}
                  </div>
                ))}
                {(videoDisputes.length + sessionDisputes.length) === 0 && <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: 100 }}>No cases currently require your judgment.</p>}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Preview Modal for Admin Review */}
      <AnimatePresence>
        {watchVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.97)', zIndex: 2000, display: 'flex', flexDirection: 'column' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid rgba(212,175,55,0.15)', flexShrink: 0 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Crown size={14} style={{ color: '#D4AF37' }} />
                  <span style={{ fontSize: '0.65rem', color: '#D4AF37', fontWeight: 800, letterSpacing: '0.15em' }}>ADMIN SCREENING</span>
                </div>
                <h3 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 600 }}>{watchVideo.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: 2 }}>
                  Submitted by <span style={{ color: '#D4AF37' }}>{watchVideo.user_name}</span> · {watchVideo.category} / {watchVideo.subcategory}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button
                  onClick={() => { handleVideoAction(watchVideo.id, 'approve'); setWatchVideo(null); }}
                  style={{ padding: '10px 24px', borderRadius: 12, background: '#D4AF37', color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  ✓ Grant Entry
                </button>
                <button
                  onClick={() => { handleVideoAction(watchVideo.id, 'reject'); setWatchVideo(null); }}
                  style={{ padding: '10px 24px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 600, border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  ✕ Decline
                </button>
                <button
                  onClick={() => setWatchVideo(null)}
                  style={{ padding: '10px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Video Player */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 60px' }}>
              <div style={{ width: '100%', maxWidth: 1100, aspectRatio: '16/9', background: '#000', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(212,175,55,0.2)', boxShadow: '0 0 80px rgba(0,0,0,0.8)' }}>
                <video
                  src={watchVideo.cloudinary_url}
                  controls
                  autoPlay
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .liquid-glass {
          background: rgba(255, 255, 255, 0.01);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  );
}
