import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Play, Upload, X, Crown, Star, Gem, FilterX, MessageCircle, Send, AlertTriangle, Paperclip } from 'lucide-react';

export default function VideoLibraryPage() {
  const { user, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCategory = searchParams.get('category');
  
  const [videos, setVideos] = useState<any[]>([]);
  const [ownedVideos, setOwnedVideos] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState(false);
  const [watchModal, setWatchModal] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingDone, setRatingDone] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeFile, setDisputeFile] = useState<File | null>(null);
  const [showDispute, setShowDispute] = useState(false);
  const [sideTab, setSideTab] = useState<'details'|'comments'|'dispute'>('details');
  const [submitting, setSubmitting] = useState(false);

  const allowedCategories: any = {
    programming: ["Python", "JavaScript", "AI/ML", "Web Dev", "Mobile Dev", "Data Science", "Blockchain", "Cloud Computing", "Cybersecurity", "DevOps", "Java", "C++", "Rust", "Go"],
    design: ["UI/UX", "3D Modeling", "Branding", "Motion Graphics", "Graphic Design", "Photography", "Interior Design", "Game Design", "Illustration", "Architecture"],
    marketing: ["SEO", "Ads", "Branding", "Social Media", "Content Marketing", "Email Marketing", "Affiliate Marketing", "Market Research", "Influencer Marketing", "Public Relations"],
    finance: ["Investing", "Crypto", "Trading", "Personal Finance", "Accounting", "Real Estate", "Fintech", "Stock Market", "Economics", "Taxation"]
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [vRes, aRes] = await Promise.all([api.get('/videos'), api.get('/videos/my-access')]);
      setVideos(vRes.data);
      setOwnedVideos(aRes.data);
    } finally { setLoading(false); }
  };

  const openWatch = async (video: any) => {
    if (ownedVideos.includes(video.id) || video.user_id === user?.id) {
      setWatchModal(video);
      setSideTab('details');
      setRatingDone(false);
      setMyRating(0);
      setShowDispute(false);
      setDisputeReason('');
      setDisputeFile(null);
      // Load comments
      const cRes = await api.get(`/videos/${video.id}/comments`).catch(() => ({ data: [] }));
      setComments(cRes.data);
    } else {
      if (confirm(`Unlock "${video.title}" for 1 credit?`)) {
        try {
          await api.post(`/videos/${video.id}/watch`);
          setOwnedVideos(prev => [...prev, video.id]);
          await refreshUser();
          setWatchModal(video);
          setSideTab('details');
          setComments([]);
        } catch (err: any) {
          alert(err.response?.data?.error || 'Failed to unlock');
        }
      }
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || !watchModal) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/videos/${watchModal.id}/comments`, { comment: newComment });
      setComments(prev => [res.data, ...prev]);
      setNewComment('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to post comment');
    } finally { setSubmitting(false); }
  };

  const submitRating = async (star: number) => {
    if (!watchModal || ratingDone) return;
    try {
      await api.post(`/videos/${watchModal.id}/ratings`, { score: star });
      setMyRating(star);
      setRatingDone(true);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Rating failed');
    }
  };

  const submitDispute = async () => {
    if (!disputeReason.trim() || !disputeFile || !watchModal) return;
    setSubmitting(true);
    const formData = new FormData();
    formData.append('reason', disputeReason);
    formData.append('evidence', disputeFile);
    try {
      await api.post(`/videos/${watchModal.id}/disputes`, formData);
      alert('Dispute filed. Admin will review and email you.');
      setShowDispute(false);
      setDisputeReason('');
      setDisputeFile(null);
      setSideTab('details');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to file dispute');
    } finally { setSubmitting(false); }
  };

  const renderCategoryRow = (cat: string, label: string) => {
    // If we have a URL category filter, only show that category
    if (urlCategory && urlCategory.toLowerCase() !== cat.toLowerCase()) return null;

    const rowVideos = videos.filter(v => v.category.toLowerCase() === cat.toLowerCase());
    if (rowVideos.length === 0) return null;

    return (
      <div style={{ marginBottom: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
           <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4AF37' }} />
           <h2 style={{ fontSize: '1.8rem', color: '#fff', fontFamily: "'Instrument Serif', serif", fontWeight: 400 }}>{label}</h2>
           <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(212, 175, 55, 0.2), transparent)' }} />
        </div>
        <div style={{ display: 'flex', overflowX: 'auto', gap: 24, paddingBottom: 24 }} className="hide-scrollbar">
          {rowVideos.map(v => (
            <motion.div 
              key={v.id} 
              whileHover={{ y: -10 }}
              onClick={() => openWatch(v)} 
              style={{ minWidth: 320, width: 320, borderRadius: 24, overflow: 'hidden', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}
            >
              <div style={{ width: '100%', height: 180, background: '#000', position: 'relative' }}>
                 <img src={`https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=600`} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
                 <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                       <Play size={20} style={{ color: '#D4AF37' }} fill="#D4AF37" />
                    </div>
                 </div>
                 {ownedVideos.includes(v.id) && (
                    <div style={{ position: 'absolute', top: 16, left: 16, background: '#D4AF37', color: '#000', padding: '4px 12px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 800 }}>COLLECTED</div>
                 )}
              </div>
              <div style={{ padding: 20 }}>
                <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 600, marginBottom: 8 }}>{v.title}</h3>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{v.subcategory} • {v.user_name}</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}><Star size={12} style={{ color: '#D4AF37' }} /> {Number(v.avg_rating || 0).toFixed(1)}</span>
                   </div>
                   {!ownedVideos.includes(v.id) && v.user_id !== user?.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#D4AF37', fontWeight: 700, fontSize: '0.8rem' }}>
                         <Gem size={14} /> 1 CREDIT
                      </div>
                   ) : (
                      <div style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 700 }}>UNLOCKED</div>
                   )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '40px 60px', maxWidth: 1400, margin: '0 auto', minHeight: '100vh', background: '#020617' }}>
      
      {/* Royal Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 60, borderBottom: '1px solid rgba(212, 175, 55, 0.2)', paddingBottom: 32 }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Crown size={20} style={{ color: '#D4AF37' }} />
              <span style={{ fontSize: '0.75rem', color: '#D4AF37', fontWeight: 800, letterSpacing: '0.15em' }}>THE SKILL GALLERY</span>
           </div>
           <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '3.5rem', color: '#fff', fontWeight: 400, letterSpacing: '-0.02em' }}>
              Skill Library
           </h1>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
           {urlCategory && (
              <button 
                onClick={() => setSearchParams({})}
                style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)', color: '#D4AF37', padding: '10px 16px', borderRadius: 12, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
              >
                <FilterX size={14} /> Clear {urlCategory}
              </button>
           )}
           <button onClick={() => setUploadModal(true)} style={{ padding: '0 24px', height: 50, borderRadius: 16, background: '#D4AF37', color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Upload size={18} /> Contribute
           </button>
        </div>
      </div>

      {loading ? <p style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: 100 }}>Opening the vault...</p> : (
        <div style={{ marginTop: 40 }}>
           {Object.keys(allowedCategories).map(cat => renderCategoryRow(cat, cat.charAt(0).toUpperCase() + cat.slice(1)))}
        </div>
      )}

      {/* Upload Modal - Elite Edition */}
      <AnimatePresence>
         {uploadModal && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#0d0d0d', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', padding: '40px 36px', position: 'relative' }}>
                 <button onClick={() => setUploadModal(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                 
                 <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', border: '1px solid rgba(212,175,55,0.2)' }}>
                       <Upload size={22} style={{ color: '#D4AF37' }} />
                    </div>
                    <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.8rem', color: '#fff', marginBottom: 6 }}>Share Your Mastery</h3>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>Contribute to the collective wisdom of SKILLX.</p>
                 </div>

                 <form onSubmit={async (e) => {
                   e.preventDefault();
                   const form = e.currentTarget;
                   const formData = new FormData(form);
                   
                   const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
                   btn.disabled = true;
                   btn.innerText = 'Transmitting...';

                   try {
                     await api.post('/videos/upload', formData);
                     alert('Contribution received. Pending system audit.');
                     setUploadModal(false);
                     fetchData();
                   } catch (err: any) {
                     alert(err.response?.data?.error || 'Transmission failed');
                   } finally {
                     btn.disabled = false;
                     btn.innerText = 'Complete Contribution';
                   }
                 }} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                    {/* Title */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                       <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.08em' }}>COURSE TITLE</label>
                       <input name="title" required placeholder="e.g. Advanced Neural Architectures" style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', outline: 'none', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }} />
                    </div>

                    {/* Description */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                       <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.08em' }}>DESCRIPTION</label>
                       <textarea name="description" placeholder="A brief summary of the knowledge shared..." style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', outline: 'none', minHeight: 80, resize: 'vertical', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }} />
                    </div>

                    {/* Category */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                       <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.08em' }}>CATEGORY</label>
                       <select name="category" required
                         style={{ padding: '12px 14px', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', outline: 'none', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}
                         onChange={(e) => {
                           const sub = document.getElementById('sub-select') as HTMLSelectElement;
                           const cat = e.target.value;
                           if (sub && allowedCategories[cat]) {
                             sub.innerHTML = allowedCategories[cat].map((s: string) => `<option value="${s}">${s}</option>`).join('');
                           } else if (sub) {
                             sub.innerHTML = '<option value="">Choose category first</option>';
                           }
                         }}>
                          <option value="">Select a category...</option>
                          {Object.keys(allowedCategories).map(cat => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
                       </select>
                    </div>

                    {/* Subcategory */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                       <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.08em' }}>SUBCATEGORY</label>
                       <select id="sub-select" name="subcategory" required style={{ padding: '12px 14px', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', outline: 'none', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}>
                          <option value="">Choose category first</option>
                       </select>
                    </div>

                    {/* Video File */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                       <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.08em' }}>VIDEO FILE (.MP4)</label>
                       <label style={{ position: 'relative', display: 'block', cursor: 'pointer' }}>
                          <input type="file" name="video" accept="video/mp4,video/mov,video/avi,video/mkv" required style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }} onChange={(e) => {
                            const p = document.getElementById('file-label');
                            if (p && e.target.files?.[0]) p.textContent = '📎 ' + e.target.files[0].name;
                          }} />
                          <div id="file-label" style={{ padding: '14px 16px', background: 'rgba(212, 175, 55, 0.04)', border: '1px dashed rgba(212, 175, 55, 0.3)', borderRadius: 12, color: 'rgba(212,175,55,0.7)', textAlign: 'center', fontSize: '0.85rem', pointerEvents: 'none' }}>
                             📁 Click to select video file
                          </div>
                       </label>
                    </div>

                    <button type="submit" style={{ marginTop: 8, padding: '15px', borderRadius: 12, background: '#D4AF37', color: '#000', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '0.95rem' }}>
                       Complete Contribution
                    </button>
                 </form>
              </motion.div>
           </motion.div>
         )}
      </AnimatePresence>

      {/* Watch Modal - Full Interaction Layer */}
      <AnimatePresence>
        {watchModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.97)', zIndex: 1000, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
            
            {/* Top bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid rgba(212,175,55,0.1)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Crown size={16} style={{ color: '#D4AF37' }} />
                <span style={{ color: '#D4AF37', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.15em' }}>SKILLX SCREENING ROOM</span>
              </div>
              <button onClick={() => setWatchModal(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><X size={16} /> Close</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 0, flex: 1 }}>
              {/* Left: Video + Info */}
              <div style={{ padding: '32px 40px', overflowY: 'auto' }}>
                <div style={{ aspectRatio: '16/9', background: '#000', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(212,175,55,0.15)', marginBottom: 28 }}>
                  <video src={watchModal.cloudinary_url} controls autoPlay style={{ width: '100%', height: '100%' }}
                    onEnded={async () => { try { await api.post(`/videos/${watchModal.id}/complete`); } catch {} }} />
                </div>
                <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.2rem', color: '#fff', marginBottom: 8 }}>{watchModal.title}</h2>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{watchModal.subcategory} · by <span style={{ color: '#D4AF37' }}>{watchModal.user_name}</span></p>
                <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginTop: 16 }}>{watchModal.description}</p>
              </div>

              {/* Right: Interaction Panel */}
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {[{id:'details', label:'Details'}, {id:'comments', label:'💬 Comments'}, {id:'dispute', label:'⚠️ Dispute'}].map(t => (
                    <button key={t.id} onClick={() => setSideTab(t.id as any)}
                      style={{ flex: 1, padding: '14px 0', background: 'none', border: 'none', borderBottom: sideTab === t.id ? '2px solid #D4AF37' : '2px solid transparent', color: sideTab === t.id ? '#D4AF37' : 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                      {t.label}
                    </button>
                  ))}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                  {/* DETAILS TAB */}
                  {sideTab === 'details' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div><p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>CONTRIBUTOR</p><p style={{ color: '#fff', fontWeight: 600 }}>{watchModal.user_name}</p></div>
                      <div><p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>CATEGORY</p><p style={{ color: '#fff', fontWeight: 600 }}>{watchModal.category} / {watchModal.subcategory}</p></div>
                      <div><p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>VIEWS</p><p style={{ color: '#fff', fontWeight: 600 }}>{watchModal.views || 0}</p></div>
                      
                      {/* Star Rating - only for buyers */}
                      {ownedVideos.includes(watchModal.id) && watchModal.user_id !== user?.id && (
                        <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 16, padding: 20 }}>
                          <p style={{ fontSize: '0.65rem', color: '#D4AF37', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 14 }}>RATE THIS MASTERCLASS</p>
                          {ratingDone ? (
                            <p style={{ color: '#22c55e', fontSize: '0.85rem', fontWeight: 600 }}>✅ You rated {myRating} star{myRating > 1 ? 's' : ''}. Thank you!</p>
                          ) : (
                            <div style={{ display: 'flex', gap: 8 }}>
                              {[1,2,3,4,5].map(star => (
                                <Star key={star} size={28}
                                  fill={(hoverRating || myRating) >= star ? '#D4AF37' : 'none'}
                                  style={{ color: '#D4AF37', cursor: 'pointer', transition: 'transform 0.15s' }}
                                  onMouseEnter={() => setHoverRating(star)}
                                  onMouseLeave={() => setHoverRating(0)}
                                  onClick={() => submitRating(star)} />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* COMMENTS TAB */}
                  {sideTab === 'comments' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {/* Post comment */}
                      {(ownedVideos.includes(watchModal.id) || watchModal.user_id === user?.id) && (
                        <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                          <input
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && submitComment()}
                            placeholder="Share your thoughts..."
                            style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', color: '#fff', outline: 'none', fontSize: '0.85rem' }} />
                          <button onClick={submitComment} disabled={submitting || !newComment.trim()}
                            style={{ background: '#D4AF37', border: 'none', borderRadius: 12, padding: '0 14px', cursor: 'pointer', color: '#000' }}>
                            <Send size={16} />
                          </button>
                        </div>
                      )}
                      {comments.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.2)' }}>
                          <MessageCircle size={32} style={{ marginBottom: 12 }} />
                          <p style={{ fontSize: '0.85rem' }}>No comments yet. Be the first!</p>
                        </div>
                      ) : comments.map(c => (
                        <div key={c.id} style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: '0.8rem', color: '#D4AF37', fontWeight: 700 }}>{c.user_name}</span>
                            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{c.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* DISPUTE TAB */}
                  {sideTab === 'dispute' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {!ownedVideos.includes(watchModal.id) ? (
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', textAlign: 'center', padding: '40px 0' }}>You must purchase this video to file a dispute.</p>
                      ) : watchModal.user_id === user?.id ? (
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', textAlign: 'center', padding: '40px 0' }}>You cannot dispute your own video.</p>
                      ) : (
                        <>
                          <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 14, padding: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <AlertTriangle size={16} style={{ color: '#ef4444' }} />
                              <p style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 800 }}>FORMAL QUALITY DISPUTE</p>
                            </div>
                            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Disputes are reviewed by our admin team. If valid, 1 credit will be refunded and you will be notified by email.</p>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>REASON FOR DISPUTE</label>
                            <textarea
                              value={disputeReason}
                              onChange={e => setDisputeReason(e.target.value)}
                              placeholder="Describe the quality issue in detail..."
                              rows={4}
                              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 14px', color: '#fff', outline: 'none', resize: 'none', fontSize: '0.85rem' }} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>EVIDENCE (image/pdf required)</label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12, cursor: 'pointer', fontSize: '0.82rem', color: disputeFile ? '#22c55e' : 'rgba(255,255,255,0.4)' }}>
                              <Paperclip size={14} />
                              {disputeFile ? disputeFile.name : 'Click to attach proof'}
                              <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => setDisputeFile(e.target.files?.[0] || null)} />
                            </label>
                          </div>
                          <button onClick={submitDispute} disabled={submitting || !disputeReason.trim() || !disputeFile}
                            style={{ padding: '14px', borderRadius: 12, background: submitting ? 'rgba(239,68,68,0.3)' : '#ef4444', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: (!disputeReason.trim() || !disputeFile) ? 0.5 : 1 }}>
                            {submitting ? 'Filing...' : 'Submit Dispute'}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .liquid-glass { background: rgba(255,255,255,0.01); backdrop-filter: blur(20px); }
      `}</style>
    </div>
  );
}
