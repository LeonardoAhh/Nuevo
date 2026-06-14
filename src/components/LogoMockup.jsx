import React from 'react';

/**
 * LogoMockup — Marca visual ViñoPlastic
 * SVG decorativo (extrusión de plástico) + wordmark VIÑO · PLASTIC
 */
export const LogoMockup = () => (
  <div
    role="img"
    aria-label="ViñoPlastic"
    style={{
      width: '5rem',
      height: '5rem',
      borderRadius: 'var(--rounded-xl)',
      background: 'linear-gradient(135deg, var(--color-canvas-soft) 0%, var(--color-surface-strong) 100%)',
      border: '1px solid var(--color-hairline-soft)',
      boxShadow: '0 4px 16px rgba(26, 35, 126, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2px',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {/* Decoración esquina */}
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: '-1.25rem',
        right: '-1.25rem',
        width: '3rem',
        height: '3rem',
        borderRadius: '50%',
        background: 'rgba(0, 180, 219, 0.08)',
        zIndex: 0,
      }}
    />

    {/* Símbolo de extrusión */}
    <svg
      width="28"
      height="28"
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
      style={{ zIndex: 1 }}
    >
      <rect x="4" y="14" width="28" height="8" rx="2" fill="url(#extrusionGradient)" stroke="#1a237e" strokeWidth="1.2" />
      <path d="M8 18 L12 15 L16 18 L20 15 L24 18 L28 15" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 14 L16 6 L20 6 L22 14" fill="#1a237e" opacity="0.15" />
      <path d="M14 14 L16 6 L20 6 L22 14" stroke="#1a237e" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
      <defs>
        <linearGradient id="extrusionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00b4db" />
          <stop offset="100%" stopColor="#0083b0" />
        </linearGradient>
      </defs>
    </svg>

    {/* Wordmark: VIÑO · PLASTIC */}
    <div
      style={{
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1px',
        lineHeight: 1,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '9px',
          letterSpacing: '0.18em',
          color: '#1a237e',
        }}
      >
        VIÑO
      </span>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '9px',
          letterSpacing: '0.18em',
          color: '#00b4db',
        }}
      >
        PLASTIC
      </span>
    </div>
  </div>
);
