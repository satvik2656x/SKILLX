import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Shield, BookOpen, Mail, ChevronRight, ArrowUpRight } from 'lucide-react';

export default function LandingPage() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ background: '#020617', color: '#fff', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>
      
      {/* Cinematic Hero Header */}
      <header style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
        <video 
          autoPlay loop muted playsInline 
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
        >
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4" type="video/mp4" />
        </video>
        
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.4)', zIndex: 1 }} />

        {/* Navbar */}
        <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 40px', maxWidth: '1440px', left: '50%', transform: 'translateX(-50%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.8rem', fontWeight: 400 }}>SKILLX<sup style={{ fontSize: '0.7rem' }}>®</sup></span>
          </div>
          
          <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            <div className="hidden md:flex" style={{ display: 'flex', gap: 32 }}>
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>Home</button>
              <button onClick={() => scrollToSection('studio')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }} className="nav-link">Studio</button>
              <button onClick={() => scrollToSection('about')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }} className="nav-link">About</button>
              <button onClick={() => scrollToSection('journal')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }} className="nav-link">Journal</button>
              <button onClick={() => scrollToSection('reach')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }} className="nav-link">Reach Us</button>
            </div>
            <Link to="/login" className="liquid-glass" style={{ padding: '8px 24px', borderRadius: 30, fontSize: '0.85rem', textDecoration: 'none', color: '#fff' }}>
              Begin Journey
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '0 24px' }}>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(3rem, 10vw, 7rem)', lineHeight: 0.95, letterSpacing: '-0.03em', maxWidth: 1200 }}
          >
            Where <em style={{ fontStyle: 'normal', color: 'rgba(255,255,255,0.4)' }}>dreams</em> rise <em style={{ fontStyle: 'normal', color: 'rgba(255,255,255,0.4)' }}>through the silence.</em>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.5)', maxWidth: 600, marginTop: 32, lineHeight: 1.6 }}
          >
            Designing tools for deep thinkers and bold creators. Built on a foundation of trust, SKILLX is the premier ecosystem for skill exchange.
          </motion.p>
        </div>
      </header>

      {/* Studio Section (The Marketplace) */}
      <section id="studio" style={{ padding: '120px 60px', maxWidth: 1440, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 80, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '3.5rem', marginBottom: 24 }}>The Studio</h2>
            <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 40 }}>
              A high-performance workspace where expertise becomes capital. Upload your tutorial videos, host live workshops, and monetize your knowledge through our audit-ready video marketplace.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
                 <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Marketplace</p>
                 <p style={{ fontSize: '1rem', fontWeight: 600 }}>Video Content Hub</p>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
                 <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Exchange</p>
                 <p style={{ fontSize: '1rem', fontWeight: 600 }}>Live Mastery Sessions</p>
              </div>
            </div>
          </div>
          <div className="liquid-glass" style={{ height: 450, borderRadius: 32, background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
             <img 
               src="/studio.png" 
               alt="Digital Studio Workspace" 
               style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} 
             />
          </div>
        </div>
      </section>

      {/* About Section (Trust & Reputation) */}
      <section id="about" style={{ padding: '120px 60px', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '4rem', marginBottom: 40 }}>Built on Trust</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40, marginTop: 60 }}>
            {[
              { icon: <Shield />, title: "Reputation Layer", desc: "Every user starts with a 30% baseline. Your actions define your growth. Decay logic prevents stagnation." },
              { icon: <Zap />, title: "Credit Ledger", desc: "A decentralized ledger of time-credits. Earn through teaching, spend to learn. No exploitation allowed." },
              { icon: <BookOpen />, title: "Audit Ready", desc: "Complete transparency in every transaction. Dispute resolution handled by our platform masters." }
            ].map((card, i) => (
              <div key={i} className="liquid-glass" style={{ padding: 48, borderRadius: 32, textAlign: 'left' }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>{card.icon}</div>
                <h4 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: 16 }}>{card.title}</h4>
                <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journal Section (Project Updates) */}
      <section id="journal" style={{ padding: '120px 60px', maxWidth: 1440, margin: '0 auto' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 60 }}>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '3.5rem' }}>Journal</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Exploring the future of human capital.</p>
         </div>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 40 }}>
            {[
              { date: "May 2026", title: "Implementing Reputation Decay Models", desc: "How we ensure consistent quality through time-based trust degradation." },
              { date: "April 2026", title: "The Peer-to-Peer Credit Economy", desc: "A deep dive into why time-credits are superior to fiat for skills." }
            ].map((post, i) => (
              <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 40 }}>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>{post.date}</p>
                <h4 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>{post.title} <ArrowUpRight size={18} /></h4>
                <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{post.desc}</p>
              </div>
            ))}
         </div>
      </section>

      {/* Reach Us Section (Contact) */}
      <section id="reach" style={{ padding: '160px 60px', textAlign: 'center' }}>
         <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '4.5rem', marginBottom: 24 }}>Reach Us</h2>
            <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.5)', marginBottom: 48 }}>Have questions about the ecosystem? Our team is here to guide your journey.</p>
            <a href="mailto:maiticmaitic@gmail.com" className="liquid-glass" style={{ padding: '20px 48px', borderRadius: 40, fontSize: '1.1rem', textDecoration: 'none', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 12 }}>
               <Mail size={18} /> maiticmaitic@gmail.com
            </a>
         </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '60px', background: '#000', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1440, margin: '0 auto' }}>
           <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>© 2026 SKILLX® — Built for deep thinkers.</p>
           <div style={{ display: 'flex', gap: 24 }}>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>Privacy Policy</span>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>Terms of Service</span>
           </div>
        </div>
      </footer>

      <style>{`
        .nav-link:hover { color: #fff !important; }
        .hidden { display: none; }
        @media (min-width: 768px) { .md\\:flex { display: flex; } }
      `}</style>
    </div>
  );
}
