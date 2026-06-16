import React, { useEffect, useState } from 'react';
import { webauthn } from '../lib/webauthn';
import { empleadoSession } from '../lib/empleadoSession';

/**
 * WebAuthnDiagnostics — Panel para diagnosticar problemas de biometría.
 * Muestra toda la info útil para identificar fallos de configuración.
 */
export const WebAuthnDiagnostics = ({ lastError }) => {
  const [info, setInfo] = useState({ checking: true });

  useEffect(() => {
    (async () => {
      const data = {
        // Entorno
        url: window.location.href,
        origin: window.location.origin,
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        // PWA?
        displayMode: window.matchMedia('(display-mode: standalone)').matches
          ? 'standalone (PWA instalada)'
          : 'browser',
        // Soporte WebAuthn
        webAuthnSupported: webauthn.isSupported(),
        platformAuthenticator: false,
        // Sesión
        hasEmpleadoToken: empleadoSession.isAuthenticated(),
        userAgent: navigator.userAgent.slice(0, 120),
      };
      try {
        data.platformAuthenticator = await webauthn.hasPlatformAuthenticator();
      } catch (e) {
        data.platformAuthenticatorError = e.message;
      }
      data.checking = false;
      setInfo(data);
    })();
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify({ ...info, lastError }, null, 2));
    } catch { /* noop */ }
  };

  return (
    <details style={S.details} data-testid="webauthn-diag">
      <summary style={S.summary}>Ver diagnóstico</summary>
      <div style={S.body}>
        <Row k="URL"               v={info.url} />
        <Row k="Origin"            v={info.origin} />
        <Row k="Hostname (RP_ID esperado)" v={info.hostname} />
        <Row k="Protocolo"         v={info.protocol} mustBe="https:" />
        <Row k="Modo de display"   v={info.displayMode} />
        <Row k="WebAuthn soportado" v={String(info.webAuthnSupported)} mustBe="true" />
        <Row k="Face/Touch ID disponible" v={String(info.platformAuthenticator)} mustBe="true" />
        <Row k="Sesión empleado activa" v={String(info.hasEmpleadoToken)} />
        {info.platformAuthenticatorError && (
          <Row k="Error de capacidad" v={info.platformAuthenticatorError} bad />
        )}
        <Row k="User Agent" v={info.userAgent} />

        {lastError && (
          <>
            <p style={S.sectionTitle}>Último error</p>
            <Row k="Tipo"     v={lastError.name || lastError.code || 'Error'} bad />
            <Row k="Mensaje"  v={lastError.message} bad />
            {lastError.code && lastError.code !== lastError.name && (
              <Row k="Código backend" v={lastError.code} bad />
            )}
            {lastError.stack && (
              <details style={{ marginTop: 'var(--spacing-xs)' }}>
                <summary style={{ ...S.summary, fontSize: 'var(--typography-caption-size)' }}>Stack</summary>
                <pre style={S.pre}>{lastError.stack}</pre>
              </details>
            )}
          </>
        )}

        <button
          type="button"
          onClick={copy}
          data-testid="webauthn-diag-copy"
          style={S.copyBtn}
        >
          Copiar diagnóstico
        </button>
      </div>
    </details>
  );
};

const Row = ({ k, v, mustBe, bad }) => {
  const isBad = bad || (mustBe !== undefined && String(v) !== String(mustBe));
  return (
    <div style={S.row}>
      <span style={S.k}>{k}</span>
      <span style={{ ...S.v, color: isBad ? 'var(--color-semantic-error)' : 'var(--color-ink)' }}>
        {v ?? '—'}
      </span>
    </div>
  );
};

const S = {
  details: {
    border: '1px solid var(--color-hairline-soft)',
    borderRadius: 'var(--rounded-md)',
    background: 'var(--color-canvas-soft)',
  },
  summary: {
    cursor: 'pointer',
    padding: 'var(--spacing-xs) var(--spacing-sm)',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--typography-caption-size)',
    color: 'var(--color-muted)',
    listStyle: 'none',
  },
  body: {
    padding: 'var(--spacing-sm)',
    paddingTop: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-xxs)',
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: 'var(--spacing-xxs) 0',
    borderBottom: '1px dashed var(--color-hairline-soft)',
  },
  k: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--typography-caption-size)',
    color: 'var(--color-muted)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  v: {
    fontFamily: 'monospace, var(--font-body)',
    fontSize: 'var(--typography-caption-size)',
    color: 'var(--color-ink)',
    wordBreak: 'break-all',
  },
  sectionTitle: {
    margin: 'var(--spacing-sm) 0 var(--spacing-xxs)',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--typography-caption-uppercase-size)',
    fontWeight: 'var(--typography-caption-uppercase-weight)',
    letterSpacing: 'var(--typography-caption-uppercase-ls)',
    textTransform: 'uppercase',
    color: 'var(--color-semantic-error)',
  },
  pre: {
    margin: 0,
    padding: 'var(--spacing-xs)',
    background: 'var(--color-canvas)',
    border: '1px solid var(--color-hairline-soft)',
    borderRadius: 'var(--rounded-sm)',
    fontSize: '11px',
    fontFamily: 'monospace',
    color: 'var(--color-ink)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    maxHeight: '10rem',
    overflowY: 'auto',
  },
  copyBtn: {
    marginTop: 'var(--spacing-xs)',
    minHeight: '2.25rem',
    padding: '0 var(--spacing-base)',
    borderRadius: 'var(--rounded-md)',
    border: '1px solid var(--color-hairline)',
    background: 'var(--color-surface-card)',
    color: 'var(--color-ink)',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--typography-caption-size)',
    fontWeight: 500,
  },
};
