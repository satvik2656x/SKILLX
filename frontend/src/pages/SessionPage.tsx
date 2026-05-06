import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import api from '../lib/api';
import { Session } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { formatTime, avatarColor, getInitials } from '../lib/utils';
import { Send, PhoneOff, Clock } from 'lucide-react';

interface ChatMsg { userId: number; userName: string; text: string; timestamp: number; }

export default function SessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [ending, setEnding] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.get(`/sessions/${id}`).then(r => { setSession(r.data); });

    socketRef.current = io('/', { auth: { token } });
    const socket = socketRef.current;
    socket.emit('join-session', id);
    socket.on('chat-message', (msg: ChatMsg) => {
      setMessages(prev => [...prev, msg]);
    });

    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      socket.disconnect();
    };
  }, [id, token]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !user || !socketRef.current) return;
    const msg: ChatMsg = { userId: user.id, userName: user.name, text: input.trim(), timestamp: Date.now() };
    socketRef.current.emit('chat-message', { sessionId: id, ...msg });
    setMessages(prev => [...prev, msg]);
    setInput('');
  };

  const endSession = async () => {
    setEnding(true);
    try {
      await api.patch(`/sessions/${id}/end`);
      if (timerRef.current) clearInterval(timerRef.current);
      navigate(`/rate/${id}`);
    } catch { setEnding(false); }
  };

  const radius = 54;
  const circum = 2 * Math.PI * radius;
  const maxSeconds = (session ? 60 * 60 : 3600);
  const dash = Math.min((elapsed / maxSeconds) * circum, circum);

  if (!session) return <div style={{ padding: 40, color: 'rgba(255,255,255,0.4)' }}>Loading session...</div>;

  return (
    <div style={{ padding: '32px 36px', maxWidth: 900 }}>
      <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.8rem', color: '#fff', fontWeight: 400, marginBottom: 24 }}>
        Live Session — {session.skill_title}
      </motion.h1>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* Left: Timer + Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Timer */}
          <div className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>Session Time</p>
            <div style={{ position: 'relative' }}>
              <svg width={124} height={124} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={62} cy={62} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
                <circle cx={62} cy={62} r={radius} fill="none" stroke="#22c55e" strokeWidth={6}
                  strokeDasharray={circum} strokeDashoffset={circum - dash}
                  strokeLinecap="round" className="timer-ring" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <Clock size={14} style={{ color: 'rgba(255,255,255,0.3)', marginBottom: 2 }} />
                <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{formatTime(elapsed)}</span>
              </div>
            </div>
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '6px 14px' }}>
              <span style={{ fontSize: '0.72rem', color: '#86efac' }}>● Session Active</span>
            </div>
          </div>

          {/* Participant */}
          <div className="glass-card" style={{ padding: 20 }}>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>Session with</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: avatarColor(session.other_user_name || ''), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
                {getInitials(session.other_user_name || '?')}
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{session.other_user_name}</p>
                <p style={{ fontSize: '0.68rem', color: '#22c55e' }}>● Online</p>
              </div>
            </div>
          </div>

          {/* End session */}
          <button onClick={endSession} disabled={ending} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px', borderRadius: 10, border: '1px solid rgba(248,113,113,0.3)',
            background: 'rgba(248,113,113,0.08)', color: '#f87171', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 500,
            opacity: ending ? 0.6 : 1, transition: 'all 0.2s'
          }}>
            <PhoneOff size={16} />{ending ? 'Ending...' : 'End Session'}
          </button>
        </div>

        {/* Right: Chat */}
        <div className="glass-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: 480, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Session Chat</p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', margin: 'auto', color: 'rgba(255,255,255,0.2)', fontSize: '0.82rem' }}>
                No messages yet. Say hello!
              </div>
            )}
            {messages.map((m, i) => {
              const isMine = m.userId === user?.id;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                  {!isMine && <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginBottom: 3, marginLeft: 4 }}>{m.userName}</span>}
                  <div className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>{m.text}</div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10 }}>
            <input className="skillx-input" placeholder="Type a message..." value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              style={{ flex: 1 }} />
            <button onClick={sendMessage} style={{ background: '#fff', border: 'none', borderRadius: 10, padding: '0 14px', cursor: 'pointer', color: '#000' }}>
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
