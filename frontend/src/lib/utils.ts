export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function getTrustColor(score: number): string {
  if (score >= 0.7) return '#22c55e';
  if (score >= 0.45) return '#f59e0b';
  return '#3b82f6';
}

export function getTrustLabel(score: number): string {
  if (score >= 0.75) return 'Highly Trusted';
  if (score >= 0.5) return 'Trusted';
  if (score >= 0.35) return 'Building Trust';
  return 'New User';
}

export function formatCredits(c: number) {
  return c.toFixed(1);
}

export function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

export function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function avatarColor(name: string) {
  const colors = [
    '#6366f1','#8b5cf6','#ec4899','#f43f5e',
    '#f97316','#eab308','#22c55e','#14b8a6','#3b82f6'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
