import React from 'react';
import { getTrustColor, getTrustLabel } from '../lib/utils';

interface Props { score: number; showLabel?: boolean; size?: 'sm' | 'md' | 'lg'; }

export default function TrustBadge({ score, showLabel = true, size = 'md' }: Props) {
  const color = getTrustColor(score);
  const label = getTrustLabel(score);
  const pct = Math.min(Math.max(score * 100, 0), 100);
  const radius = size === 'lg' ? 36 : size === 'md' ? 28 : 20;
  const stroke = size === 'lg' ? 4 : 3;
  const circum = 2 * Math.PI * radius;
  const dash = (pct / 100) * circum;
  const totalSize = (radius + stroke) * 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', width: totalSize, height: totalSize }}>
        <svg width={totalSize} height={totalSize} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={radius + stroke} cy={radius + stroke} r={radius}
            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
          <circle cx={radius + stroke} cy={radius + stroke} r={radius}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circum} strokeDashoffset={circum - dash}
            strokeLinecap="round" className="timer-ring" />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size === 'lg' ? '0.8rem' : '0.65rem',
          fontWeight: 700, color
        }}>
          {(score * 100).toFixed(0)}%
        </div>
      </div>
      {showLabel && (
        <span style={{ fontSize: '0.65rem', color, fontWeight: 600 }}>{label}</span>
      )}
    </div>
  );
}
