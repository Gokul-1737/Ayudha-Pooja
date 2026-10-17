import React from 'react'

export default function Toran({ src, intensity }: { src: string; intensity: number }) {
  // Realistic hanging decorative accents along the top at natural intervals
  const bells = [12, 27, 42, 57, 72, 87]

  return (
    <div className="toran-wrap" style={{ '--k': intensity } as React.CSSProperties}>
      {/* 3D realistic garland banner */}
      <div className="toran-banner">
        {/* Realistic repeating garland texture with natural aspect ratio */}
        <div 
          className="toran-garland-strip"
          style={{ backgroundImage: `url(${src})` }}
        />
        {/* Soft shadow below garland for authentic 3D pop */}
        <div className="toran-shadow-bar" />
      </div>

      {/* Swaying decorative hanging brass bells */}
      <div className="toran-bells-row">
        {bells.map((pct, idx) => (
          <div
            key={idx}
            className="toran-bell-hanger"
            style={{
              left: `${pct}%`,
              animationDelay: `${idx * 0.4}s`,
              animationDuration: `${3.2 + (idx % 3) * 0.4}s`,
            }}
          >
            <div className="toran-bell-string" />
            <div className="toran-golden-bell">
              <svg width="22" height="26" viewBox="0 0 24 28" fill="none">
                <defs>
                  <linearGradient id={`goldGrad-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fff2a3" />
                    <stop offset="30%" stopColor="#f5c242" />
                    <stop offset="70%" stopColor="#b27812" />
                    <stop offset="100%" stopColor="#694103" />
                  </linearGradient>
                  <filter id={`bellShadow-${idx}`} x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.45" />
                  </filter>
                </defs>
                <circle cx="12" cy="3" r="2" fill={`url(#goldGrad-${idx})`} />
                <path
                  d="M12 4 C9 4 7 8 7 15 C7 18 5 20 4 21 L20 21 C19 20 17 18 17 15 C17 8 15 4 12 4 Z"
                  fill={`url(#goldGrad-${idx})`}
                  filter={`url(#bellShadow-${idx})`}
                />
                <ellipse cx="12" cy="21" rx="8" ry="2" fill="#8f5b08" />
                <circle cx="12" cy="24" r="2.5" fill="#f5c242" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
