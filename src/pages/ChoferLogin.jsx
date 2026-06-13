import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Truck } from 'lucide-react';
import { LogoMockup } from '../components/LogoMockup';
import { LoginTransition } from '../components/LoginTransition';

/* ============================================================
   LOGIN — Chofer
   Mismo diseño que Login.jsx (Admin) · rol: chofer
   ============================================================ */

export const ChoferLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [successAnim, setSuccessAnim]   = useState(false);
  const [userName, setUserName]         = useState('');

  const handleLogin = async () => {
    if (!email || !password) return;
    setError('');
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      const role = data.user?.user_metadata?.role || '';
      const name = data.user?.user_metadata?.nombre || data.user?.email || '';

      if (role !== 'chofer' && role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Esta cuenta no tiene acceso de Chofer.');
      }

      setUserName(name);
      setSuccessAnim(true);
      setTimeout(() => navigate('/chofer'), 2500);

    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === 'Enter') handleLogin(); };

  return (
    <>
      <LoginTransition isVisible={successAnim} userName={userName} />
      <main style={s.page}>
        <h2 style={s.srOnly}>Inicio de sesión — Chofer ViñoPlastic</h2>

        <div style={s.container}>

          {/* Brand */}
          <header style={s.brand}>
            <LogoMockup />
            <div style={{ textAlign: 'center' }}>
              <h1 style={s.brandName}>VIÑOPLASTIC</h1>
            </div>
          </header>

          {/* Badge de rol */}
          <div style={s.roleBadge}>
            <Truck size={14} />
            <span>CHOFERES</span>
          </div>

          {/* Card */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <p style={s.cardTitle}>Bienvenido</p>
              <p style={s.cardSubtitle}>Ingresa tus credenciales</p>
            </div>

            {/* Feedback */}
            {error && (
              <div role="alert" style={s.feedback}>{error}</div>
            )}

            {/* Email */}
            <div style={s.field}>
              <label htmlFor="chofer-email" style={s.label}>Correo electrónico</label>
              <div style={s.inputWrap}>
                <Mail size={16} style={s.inputIcon} aria-hidden="true" />
                <input
                  id="chofer-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="chofer@vinoplastic.com"
                  disabled={loading}
                  style={s.input}
                  aria-required="true"
                />
              </div>
            </div>

            {/* Password */}
            <div style={s.field}>
              <label htmlFor="chofer-password" style={s.label}>Contraseña</label>
              <div style={s.inputWrap}>
                <Lock size={16} style={s.inputIcon} aria-hidden="true" />
                <input
                  id="chofer-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="••••••••"
                  disabled={loading}
                  style={{ ...s.input, paddingRight: '44px' }}
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={s.eyeBtn}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading || !email || !password}
              style={{
                ...s.btnPrimary,
                opacity: (loading || !email || !password) ? 0.55 : 1,
                cursor:  (loading || !email || !password) ? 'not-allowed' : 'pointer',
              }}
              aria-busy={loading}
            >
              {loading ? 'Verificando…' : 'Iniciar turno'}
              {!loading && <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />}
            </button>
          </div>

          {/* Back */}
          <button type="button" onClick={() => navigate('/')} style={s.backBtn}>
            ← Volver al inicio
          </button>

          <p style={s.footerNote}>
            Planta Querétaro&nbsp;&nbsp;·&nbsp;&nbsp;Sistema de Transporte
          </p>
        </div>
      </main>
    </>
  );
};

/* ============================================================
   STYLES — 100 % design tokens
   ============================================================ */
const s = {
  srOnly: {
    position: 'absolute', width: '1px', height: '1px',
    padding: 0, margin: '-1px', overflow: 'hidden',
    clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0,
  },
  page: {
    minHeight: '100dvh',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: 'clamp(var(--spacing-lg), 5vw, var(--spacing-xxl)) var(--spacing-base)',
    background: 'var(--color-canvas)',
  },
  container: {
    width: '100%', maxWidth: '400px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 'var(--spacing-xl)',
  },
  brand: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 'var(--spacing-base)', textAlign: 'center',
  },
  brandName: {
    fontSize: 'var(--typography-title-md-size)',
    fontWeight: 'var(--typography-title-md-weight)',
    color: 'var(--color-ink)',
    letterSpacing: '-0.03em', lineHeight: 1.2, margin: 0,
  },
  brandTagline: {
    fontSize: 'var(--typography-caption-size)',
    color: 'var(--color-muted)',
    margin: '4px 0 0',
  },
  roleBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '6px 14px', borderRadius: '999px',
    background: 'rgb(var(--color-accent-raw) / 0.08)',
    border: '1px solid rgb(var(--color-accent-raw) / 0.2)',
    color: 'var(--color-accent)',
    fontSize: 'var(--typography-caption-size)',
    fontWeight: 600, letterSpacing: '0.02em',
  },
  card: {
    width: '100%',
    background: 'var(--color-surface-card)',
    border: '1px solid var(--color-hairline-soft)',
    borderRadius: 'var(--rounded-xl)',
    padding: 'var(--spacing-xl) var(--spacing-lg)',
    display: 'flex', flexDirection: 'column', gap: 0,
  },
  cardHeader: { marginBottom: 'var(--spacing-lg)' },
  cardTitle: {
    fontSize: 'var(--typography-display-sm-size)', fontWeight: 400,
    color: 'var(--color-ink)',
    letterSpacing: 'var(--typography-display-sm-ls)',
    lineHeight: 'var(--typography-display-sm-lh)', margin: 0,
  },
  cardSubtitle: {
    fontSize: 'var(--typography-body-sm-size)',
    color: 'var(--color-muted)', margin: '4px 0 0',
  },
  feedback: {
    fontSize: 'var(--typography-body-sm-size)', lineHeight: 1.5,
    borderRadius: 'var(--rounded-md)',
    padding: 'var(--spacing-sm) var(--spacing-base)',
    marginBottom: 'var(--spacing-lg)', textAlign: 'center',
    background: 'rgb(var(--color-semantic-error-raw) / 0.08)',
    color: 'var(--color-semantic-error)',
    border: '1px solid rgb(var(--color-semantic-error-raw) / 0.2)',
  },
  field: { marginBottom: 'var(--spacing-md)' },
  label: {
    display: 'block',
    fontSize: 'var(--typography-caption-uppercase-size)',
    fontWeight: 'var(--typography-caption-uppercase-weight)',
    letterSpacing: 'var(--typography-caption-uppercase-ls)',
    textTransform: 'uppercase', color: 'var(--color-muted)',
    marginBottom: 'var(--spacing-xs)',
  },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: {
    position: 'absolute', left: 'var(--spacing-sm)',
    color: 'var(--color-muted-soft)', pointerEvents: 'none', flexShrink: 0,
  },
  input: {
    width: '100%', height: '44px',
    paddingLeft: '36px', paddingRight: 'var(--spacing-sm)',
    fontSize: 'var(--typography-body-sm-size)',
    fontFamily: 'var(--font-body)', color: 'var(--color-ink)',
    background: 'var(--color-canvas-soft)',
    border: '1px solid var(--color-hairline)',
    borderRadius: 'var(--rounded-md)',
    outline: 'none',
    transition: 'border-color 120ms ease, box-shadow 120ms ease',
  },
  eyeBtn: {
    position: 'absolute', right: 'var(--spacing-sm)',
    background: 'none', border: 'none', padding: '4px',
    cursor: 'pointer', color: 'var(--color-muted-soft)',
    display: 'flex', alignItems: 'center', lineHeight: 0,
  },
  btnPrimary: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 'var(--spacing-xs)', width: '100%', height: '44px',
    marginTop: 'var(--spacing-md)',
    background: 'var(--color-accent)', color: 'var(--color-on-primary)',
    fontSize: 'var(--typography-button-size)',
    fontWeight: 'var(--typography-button-weight)',
    fontFamily: 'var(--font-body)',
    letterSpacing: 'var(--typography-button-ls)',
    border: 'none', borderRadius: 'var(--rounded-md)',
    transition: 'background-color 120ms ease',
  },
  backBtn: {
    background: 'none', border: 'none', padding: 0,
    fontSize: 'var(--typography-caption-size)',
    color: 'var(--color-muted)', cursor: 'pointer',
    fontFamily: 'var(--font-body)', transition: 'color 120ms ease',
  },
  footerNote: {
    fontSize: 'var(--typography-caption-size)',
    color: 'var(--color-muted-soft)', textAlign: 'center', margin: 0,
  },
};
