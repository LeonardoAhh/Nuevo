"use client"

export default function LoginHero() {
  return (
    <div className="login-hero-fallback">
      <div className="login-hero-fallback__glow" aria-hidden />
      <div className="login-hero-fallback__content">
        <div className="login-hero-fallback__brand">Capacitación Qro</div>
        <p className="login-hero-fallback__text">
          Tu espacio de capacitación está listo. Inicia sesión para continuar.
        </p>
      </div>
      <style jsx>{`
        .login-hero-fallback {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: radial-gradient(circle at top, hsl(var(--primary, 345 65% 28%) / 0.95), hsl(var(--primary, 345 65% 20%) / 0.95) 55%);
          color: hsl(var(--background));
          overflow: hidden;
        }

        .login-hero-fallback__glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.14), transparent 35%),
            radial-gradient(circle at 70% 25%, rgba(255,255,255,0.08), transparent 25%);
          pointer-events: none;
        }

        .login-hero-fallback__content {
          position: relative;
          z-index: 1;
          max-width: 34rem;
          text-align: center;
          padding: 3rem 2rem;
          background: hsla(var(--background), 0.08);
          border: 1px solid hsla(var(--background), 0.14);
          border-radius: 2rem;
          backdrop-filter: blur(18px);
        }

        .login-hero-fallback__brand {
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 800;
          letter-spacing: 0.08em;
          margin-bottom: 1rem;
        }

        .login-hero-fallback__text {
          margin: 0;
          font-size: 1.05rem;
          line-height: 1.8;
          color: hsl(var(--background) / 0.95);
        }
      `}</style>
    </div>
  )
}
