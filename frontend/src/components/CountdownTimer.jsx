import { useEffect, useState } from 'react';

export default function CountdownTimer({ endsAt }) {
  const [left, setLeft] = useState(getLeft(endsAt));
  useEffect(() => {
    const t = setInterval(() => setLeft(getLeft(endsAt)), 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  if (left.total <= 0) return null;
  return (
    <div className="text-xs text-neon-gold font-mono">
      Ket thuc sau: {pad(left.h)}:{pad(left.m)}:{pad(left.s)}
    </div>
  );
}

function getLeft(endsAt) {
  const total = new Date(endsAt) - new Date();
  return {
    total,
    h: Math.max(0, Math.floor(total / 3600000)),
    m: Math.max(0, Math.floor((total / 60000) % 60)),
    s: Math.max(0, Math.floor((total / 1000) % 60)),
  };
}
function pad(n) { return String(n).padStart(2, '0'); }
