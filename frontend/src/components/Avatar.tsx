import React from 'react';
import { getInitials, avatarColor, getTrustColor, getTrustLabel } from '../lib/utils';

interface Props {
  name: string;
  trustScore: number;
  size?: number;
  showTrust?: boolean;
}

export default function Avatar({ name, trustScore, size = 40, showTrust = false }: Props) {
  const color = avatarColor(name);
  const trustColor = getTrustColor(trustScore);
  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.35, fontWeight: 700, color: '#fff',
        border: `2px solid ${trustColor}33`,
        flexShrink: 0,
      }}>
        {getInitials(name)}
      </div>
      {showTrust && (
        <span style={{ fontSize: '0.6rem', color: trustColor, fontWeight: 600, whiteSpace: 'nowrap' }}>
          {getTrustLabel(trustScore)}
        </span>
      )}
    </div>
  );
}
