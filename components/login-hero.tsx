"use client"

export default function LoginHero() {
  const fallbackImg = process.env.NEXT_PUBLIC_LOGIN_VIDEO_POSTER || "/HERO.png"

  return (
    <div className="login-hero-fallback">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={fallbackImg} 
        alt="Capacitación Qro" 
        className="login-hero-fallback__img"
      />
      <div className="login-hero-fallback__veil" aria-hidden />

      <style jsx>{`
        .login-hero-fallback {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: hsl(var(--muted));
        }

        .login-hero-fallback__img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        .login-hero-fallback__veil {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(120% 90% at 50% 0%, transparent 40%, rgba(0, 0, 0, 0.15) 100%),
            linear-gradient(180deg, transparent 55%, rgba(0, 0, 0, 0.25) 100%);
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
