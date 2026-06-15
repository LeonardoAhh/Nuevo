import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Search, Printer, ArrowLeft, X as XIcon, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { notify } from '../lib/notify';
import { TURNOS_REALES, normalizeTurno } from '../lib/turnos';

/* ============================================================
   QR PRINT PAGE — Hoja carta con credenciales tipo CR80
   ------------------------------------------------------------
   • Pantalla: filtros + grid responsive (mobile-first)
   • Print:    @page letter, grid 2 × 5 (10 credenciales / hoja)
   • B/N puro: keywords CSS `black` / `white` (no hex, no grises)
   ============================================================ */

const ITEMS_PER_PAGE_PRINT = 12; // 3 columnas × 4 filas

/* ─── Helpers ─────────────────────────────────────────────── */
const parseRuta = (ruta) => {
  if (!ruta) return { code: '—', desc: '—' };
  const m = ruta.match(/^(R\d+)[\s\-:]*(.*)$/i);
  if (m) return { code: m[1].toUpperCase(), desc: (m[2] || '').trim() || '—' };
  return { code: ruta, desc: '—' };
};

const splitName = (full) => {
  if (!full) return { apellidos: '', nombres: '' };
  const parts = full.trim().split(/\s+/);
  if (parts.length <= 1) return { apellidos: '', nombres: parts.join(' ') };
  if (parts.length === 2) return { apellidos: parts[0], nombres: parts[1] };
  return { apellidos: parts.slice(0, 2).join(' '), nombres: parts.slice(2).join(' ') };
};

/* ─── Credencial individual ───────────────────────────────── */
const QrCard = ({ emp }) => {
  const { nombres } = splitName(emp.nombre);
  const ruta = parseRuta(emp.ruta);
  const turno = normalizeTurno(emp.turno);

  return (
    <article
      data-testid={`qr-card-${emp.numero_empleado}`}
      className="vp-qr-card"
      aria-label={`Credencial de ${emp.nombre}`}
    >
      {/* Cabecera negra horizontal */}
      <header className="vp-qr-rail" aria-hidden="true">
        <span className="vp-qr-rail-text">VIÑO·PLASTIC</span>
        <span className="vp-qr-rail-chev" />
      </header>

      {/* QR central con corchetes */}
      <div className="vp-qr-frame" aria-hidden="true">
        <span className="vp-qr-brackets vp-qr-brackets--tl" />
        <span className="vp-qr-brackets vp-qr-brackets--tr" />
        <span className="vp-qr-brackets vp-qr-brackets--bl" />
        <span className="vp-qr-brackets vp-qr-brackets--br" />
        {emp.qr_code ? (
          <img src={emp.qr_code} alt="" className="vp-qr-img" />
        ) : (
          <div className="vp-qr-missing">SIN QR</div>
        )}
      </div>

      {/* Datos abajo */}
      <div className="vp-qr-data">
        <div className="vp-qr-numrow">
          <span className="vp-qr-numlabel">N°</span>
          <span className="vp-qr-num">{emp.numero_empleado}</span>
          <span className="vp-qr-name">{nombres}</span>
        </div>
        <div className="vp-qr-meta">
          <span className="vp-qr-badge">
            <span className="vp-qr-badge-label">R</span>
            <span className="vp-qr-badge-value">{ruta.code.replace(/^R/i, '')}</span>
          </span>
          <span className="vp-qr-badge vp-qr-badge--alt">
            <span className="vp-qr-badge-label">T</span>
            <span className="vp-qr-badge-value">{turno}</span>
          </span>
        </div>
      </div>
    </article>
  );
};

/* ─── Página principal ────────────────────────────────────── */
export const QrPrintPage = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [query, setQuery]         = useState('');
  const [rutaFilter, setRutaFilter]   = useState('');
  const [turnoFilter, setTurnoFilter] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('empleados')
        .select('id, numero_empleado, nombre, turno, ruta, qr_code')
        .order('ruta', { ascending: true })
        .order('nombre', { ascending: true });

      if (error) {
        notify.error('No se pudieron cargar los empleados', { description: error.message });
        setEmployees([]);
      } else {
        setEmployees(data || []);
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  /* ── Filtros ── */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter((e) => {
      if (q && !(
        (e.nombre || '').toLowerCase().includes(q) ||
        String(e.numero_empleado || '').toLowerCase().includes(q)
      )) return false;
      if (rutaFilter && parseRuta(e.ruta).code !== rutaFilter) return false;
      if (turnoFilter && normalizeTurno(e.turno) !== turnoFilter) return false;
      return true;
    });
  }, [employees, query, rutaFilter, turnoFilter]);

  const withQr      = filtered.filter((e) => e.qr_code);
  const withoutQr   = filtered.length - withQr.length;

  /* ── Opciones para filtros ── */
  const rutaOptions = useMemo(() => {
    const set = new Set(employees.map((e) => parseRuta(e.ruta).code).filter((c) => c && c !== '—'));
    return Array.from(set).sort();
  }, [employees]);

  const turnoOptions = useMemo(() => {
    // Solo turnos reales (1-4) que existan en la BD tras la normalización
    const set = new Set(
      employees
        .map((e) => normalizeTurno(e.turno))
        .filter((t) => TURNOS_REALES.includes(t))
    );
    return TURNOS_REALES.filter((t) => set.has(t));
  }, [employees]);

  /* ── Acciones ── */
  const handlePrint = () => {
    if (withQr.length === 0) {
      notify.warning('Nada que imprimir', { description: 'No hay empleados con QR en la selección.' });
      return;
    }
    window.print();
  };

  const clearFilters = () => { setQuery(''); setRutaFilter(''); setTurnoFilter(''); };

  /* ── Render ── */
  const totalPages = Math.ceil(withQr.length / ITEMS_PER_PAGE_PRINT);

  return (
    <>
      <PrintStyles />

      <section data-testid="qr-print-page" style={S.page} aria-labelledby="qr-print-title">

        {/* ── Toolbar (oculto al imprimir) ── */}
        <div className="vp-no-print" style={S.toolbar}>
          <div style={S.toolbarHead}>
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/empresa')}
              data-testid="qr-print-back"
              aria-label="Volver a Empresa"
              style={S.backBtn}
            >
              <ArrowLeft size={14} strokeWidth={2} />
              Volver
            </motion.button>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 id="qr-print-title" style={S.title}>Imprimir credenciales</h1>
              <p style={S.subtitle} data-testid="qr-print-meta">
                {loading ? '—' : (
                  <>
                    <strong>{withQr.length}</strong> credencial{withQr.length === 1 ? '' : 'es'}
                    {withoutQr > 0 && <> · <span style={S.warning}>{withoutQr} sin QR</span></>}
                    {totalPages > 0 && <> · {totalPages} hoja{totalPages === 1 ? '' : 's'} carta</>}
                  </>
                )}
              </p>
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={handlePrint}
              disabled={loading || withQr.length === 0}
              data-testid="qr-print-action"
              style={{
                ...S.printBtn,
                opacity: loading || withQr.length === 0 ? 0.5 : 1,
                cursor:  loading || withQr.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              <Printer size={15} strokeWidth={1.75} />
              Imprimir
            </motion.button>
          </div>

          {/* Filtros */}
          <div style={S.filters}>
            <label style={S.searchWrap}>
              <Search size={15} strokeWidth={1.75} style={S.searchIcon} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre o número…"
                aria-label="Buscar empleado"
                data-testid="qr-print-search"
                style={S.searchInput}
              />
            </label>

            <select
              value={rutaFilter}
              onChange={(e) => setRutaFilter(e.target.value)}
              aria-label="Filtrar por ruta"
              data-testid="qr-print-ruta"
              style={S.select}
            >
              <option value="">Todas las rutas</option>
              {rutaOptions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>

            <select
              value={turnoFilter}
              onChange={(e) => setTurnoFilter(e.target.value)}
              aria-label="Filtrar por turno"
              data-testid="qr-print-turno"
              style={S.select}
            >
              <option value="">Todos los turnos</option>
              {turnoOptions.map((t) => <option key={t} value={t}>Turno {t}</option>)}
            </select>

            {(query || rutaFilter || turnoFilter) && (
              <button
                type="button"
                onClick={clearFilters}
                aria-label="Limpiar filtros"
                data-testid="qr-print-clear"
                style={S.clearBtn}
              >
                <XIcon size={14} strokeWidth={2} />
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* ── Hint impresión (solo pantalla) ── */}
        <div className="vp-no-print" style={S.hintBox} role="note">
          <p style={S.hintTitle}>Antes de imprimir</p>
          <ul style={S.hintList}>
            <li>Hoja tamaño <strong>carta</strong> · márgenes mínimos en el diálogo de impresión.</li>
            <li>Activa la opción <strong>"Imprimir gráficos de fondo"</strong> en algunos navegadores.</li>
            <li>Se imprimirán <strong>{ITEMS_PER_PAGE_PRINT} credenciales por hoja</strong> en blanco y negro.</li>
          </ul>
        </div>

        {/* ── Sin QR (advertencia) ── */}
        {!loading && withoutQr > 0 && (
          <div className="vp-no-print" style={S.warnBox} role="alert" data-testid="qr-print-warning">
            Hay {withoutQr} empleado{withoutQr === 1 ? '' : 's'} sin código QR generado. No aparecerán en la impresión.
          </div>
        )}

        {/* ── Skeleton ── */}
        {loading && (
          <div className="vp-no-print" style={S.skeletonWrap}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={S.skeletonCard} />
            ))}
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && withQr.length === 0 && (
          <div className="vp-no-print" role="status" data-testid="qr-print-empty" style={S.empty}>
            <div style={S.emptyIcon} aria-hidden="true">
              <Users size={22} strokeWidth={1.5} />
            </div>
            <p style={S.emptyTitle}>Sin credenciales</p>
            <p style={S.emptySub}>
              No hay empleados con QR que coincidan con los filtros aplicados.
            </p>
          </div>
        )}

        {/* ── Sheet container ── */}
        {!loading && withQr.length > 0 && (
          <div className="vp-print-area" data-testid="qr-print-sheet">
            {Array.from({ length: totalPages }, (_, pageIdx) => {
              const slice = withQr.slice(
                pageIdx * ITEMS_PER_PAGE_PRINT,
                (pageIdx + 1) * ITEMS_PER_PAGE_PRINT
              );
              return (
                <section key={pageIdx} className="vp-print-sheet" aria-label={`Hoja ${pageIdx + 1}`}>
                  <div className="vp-print-grid">
                    {slice.map((emp) => (
                      <QrCard key={emp.id} emp={emp} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
};

/* ============================================================
   PRINT-SPECIFIC STYLES
   ============================================================ */
const PrintStyles = () => (
  <style>{`
    @page {
      size: letter;
      margin: 8mm;
    }

    /* ── Sheet container ───────────────────────────────────── */
    .vp-print-area {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xl);
    }

    .vp-print-sheet {
      background: white;
      border: 1px solid var(--color-hairline-soft);
      border-radius: var(--rounded-md);
      padding: 8mm;
      box-sizing: border-box;
    }

    .vp-print-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(4, 1fr);
      gap: 3mm;
      width: 100%;
    }

    /* ============================================================
       CREDENCIAL COMPACTA — 12 por hoja (3 × 4) · layout vertical
       Cell ≈ 65 × 63mm · QR protagonista · sólo nombre
       B&W puro · keywords \`black\` / \`white\` · sin grises
       ============================================================ */
    .vp-qr-card {
      position: relative;
      box-sizing: border-box;
      width: 100%;
      min-height: 62mm;
      background: white;
      color: black;
      border: 1pt solid black;
      border-radius: 2mm;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Cabecera negra horizontal */
    .vp-qr-rail {
      flex-shrink: 0;
      background: black;
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5mm;
      padding: 1.2mm 2mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .vp-qr-rail-text {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 6.5pt;
      letter-spacing: 0.22em;
      color: white;
      white-space: nowrap;
    }
    .vp-qr-rail-chev {
      display: block;
      width: 2.5mm; height: 2.5mm;
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      clip-path: polygon(0 0, 60% 0, 100% 50%, 60% 100%, 0 100%, 40% 50%);
      flex-shrink: 0;
    }

    /* QR frame con corchetes (centrado, protagonista) */
    .vp-qr-frame {
      position: relative;
      align-self: center;
      width: 36mm;
      height: 36mm;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5mm;
      box-sizing: border-box;
      margin: 2mm 0 1mm;
    }
    .vp-qr-brackets {
      position: absolute;
      width: 3.5mm; height: 3.5mm;
      pointer-events: none;
    }
    .vp-qr-brackets::before,
    .vp-qr-brackets::after {
      content: '';
      position: absolute;
      background: black;
    }
    .vp-qr-brackets--tl { top: 0; left: 0; }
    .vp-qr-brackets--tl::before { top: 0; left: 0; width: 3.5mm; height: 0.6pt; }
    .vp-qr-brackets--tl::after  { top: 0; left: 0; width: 0.6pt; height: 3.5mm; }
    .vp-qr-brackets--tr { top: 0; right: 0; }
    .vp-qr-brackets--tr::before { top: 0; right: 0; width: 3.5mm; height: 0.6pt; }
    .vp-qr-brackets--tr::after  { top: 0; right: 0; width: 0.6pt; height: 3.5mm; }
    .vp-qr-brackets--bl { bottom: 0; left: 0; }
    .vp-qr-brackets--bl::before { bottom: 0; left: 0; width: 3.5mm; height: 0.6pt; }
    .vp-qr-brackets--bl::after  { bottom: 0; left: 0; width: 0.6pt; height: 3.5mm; }
    .vp-qr-brackets--br { bottom: 0; right: 0; }
    .vp-qr-brackets--br::before { bottom: 0; right: 0; width: 3.5mm; height: 0.6pt; }
    .vp-qr-brackets--br::after  { bottom: 0; right: 0; width: 0.6pt; height: 3.5mm; }

    .vp-qr-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
      filter: grayscale(100%) contrast(1.3);
    }
    .vp-qr-missing {
      font-family: var(--font-display);
      font-size: 8pt;
      font-weight: 800;
      letter-spacing: 0.1em;
      color: black;
    }

    /* Datos (debajo del QR, ancho completo) */
    .vp-qr-data {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1mm;
      padding: 0 2.5mm 2mm;
      min-width: 0;
      align-items: center;
    }
    .vp-qr-numrow {
      display: inline-flex;
      align-items: baseline;
      gap: 1.2mm;
      max-width: 100%;
      flex-wrap: nowrap;
      justify-content: center;
    }
    .vp-qr-numlabel {
      flex-shrink: 0;
      font-family: var(--font-body);
      font-size: 5pt;
      font-weight: 700;
      letter-spacing: 0.16em;
      color: black;
      text-transform: uppercase;
      padding: 0.3mm 0.9mm;
      border: 0.4pt solid black;
      border-radius: 0.6mm;
      line-height: 1;
    }
    .vp-qr-num {
      flex-shrink: 0;
      font-family: var(--font-display);
      font-size: 10pt;
      font-weight: 800;
      letter-spacing: -0.01em;
      font-variant-numeric: tabular-nums;
      color: black;
      line-height: 1;
    }
    .vp-qr-name {
      font-family: var(--font-display);
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 0;
      text-transform: uppercase;
      line-height: 1.05;
      color: black;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }
    .vp-qr-meta {
      display: flex;
      gap: 1.2mm;
      flex-wrap: nowrap;
      justify-content: center;
    }
    .vp-qr-badge {
      display: inline-flex;
      align-items: stretch;
      border: 0.5pt solid black;
      border-radius: 0.8mm;
      overflow: hidden;
    }
    .vp-qr-badge-label {
      background: black;
      color: white;
      padding: 0.3mm 1mm;
      font-family: var(--font-display);
      font-size: 6pt;
      font-weight: 800;
      letter-spacing: 0.08em;
      display: inline-flex;
      align-items: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .vp-qr-badge-value {
      background: white;
      color: black;
      padding: 0.3mm 1.2mm;
      font-family: var(--font-display);
      font-size: 7pt;
      font-weight: 800;
      letter-spacing: 0.02em;
      font-variant-numeric: tabular-nums;
      display: inline-flex;
      align-items: center;
    }
    .vp-qr-badge--alt .vp-qr-badge-label { background: white; color: black; border-right: 0.4pt solid black; }
    .vp-qr-badge--alt .vp-qr-badge-value { background: black; color: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

    /* ── Pantalla (preview) ────────────────────────────────── */
    @media screen {
      .vp-print-area {
        margin-top: var(--spacing-lg);
      }
      .vp-print-sheet {
        background: white;
        border-radius: var(--rounded-md);
        max-width: 100%;
        margin: 0 auto;
        box-shadow: 0 1px 0 var(--color-hairline-soft);
      }
      /* Móvil / tablet */
      @media (max-width: 900px) {
        .vp-print-grid { grid-template-columns: repeat(2, 1fr); grid-template-rows: none; gap: var(--spacing-xs); }
      }
      @media (max-width: 480px) {
        .vp-print-grid { grid-template-columns: 1fr; }
        .vp-qr-frame   { width: 32mm; height: 32mm; }
      }
    }

    /* ── Impresión ─────────────────────────────────────────── */
    @media print {
      html, body {
        background: white !important;
        margin: 0 !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      body * { visibility: hidden !important; }

      .vp-print-area,
      .vp-print-area * { visibility: visible !important; }

      .vp-print-area {
        position: absolute !important;
        left: 0 !important; top: 0 !important; right: 0 !important;
        width: 100% !important;
        margin: 0 !important; padding: 0 !important;
        gap: 0 !important;
      }

      .vp-print-sheet {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        background: white !important;
        page-break-after: always;
        break-after: page;
      }
      .vp-print-sheet:last-child {
        page-break-after: auto;
        break-after: auto;
      }

      .vp-qr-card {
        background: white !important;
        color: black !important;
        border-color: black !important;
        box-shadow: none !important;
      }
      .vp-qr-rail,
      .vp-qr-badge-label,
      .vp-qr-badge--alt .vp-qr-badge-value {
        background: black !important;
        color: white !important;
      }
      .vp-qr-img {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        color-adjust: exact;
      }
    }
  `}</style>
);

/* ============================================================
   STYLES — pantalla (toolbar, filtros, skeletons, empty)
   ============================================================ */
const S = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-lg)',
  },

  /* Toolbar */
  toolbar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-base)',
  },
  toolbarHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    flexWrap: 'wrap',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--spacing-xxs)',
    minHeight: '2.25rem',
    padding: '0 var(--spacing-sm)',
    borderRadius: 'var(--rounded-md)',
    border: '1px solid var(--color-hairline-soft)',
    background: 'transparent',
    color: 'var(--color-muted)',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--typography-caption-size)',
    fontWeight: 500,
    cursor: 'pointer',
  },
  title: {
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(var(--typography-title-md-size), 4vw, var(--typography-display-sm-size))',
    fontWeight: 'var(--typography-title-md-weight)',
    color: 'var(--color-ink)',
    letterSpacing: '-0.02em',
    lineHeight: 1.15,
  },
  subtitle: {
    margin: 'var(--spacing-xxs) 0 0',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--typography-body-sm-size)',
    color: 'var(--color-muted)',
  },
  warning: {
    color: 'var(--color-semantic-warning)',
    fontWeight: 600,
  },
  printBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--spacing-xs)',
    minHeight: '2.5rem',
    padding: '0 var(--spacing-base)',
    borderRadius: 'var(--rounded-md)',
    border: 'none',
    background: 'var(--color-accent)',
    color: 'var(--color-on-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--typography-body-sm-size)',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 120ms ease',
  },

  /* Filtros */
  filters: {
    display: 'flex',
    gap: 'var(--spacing-xs)',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchWrap: {
    position: 'relative',
    flex: '1 1 14rem',
    minWidth: '12rem',
  },
  searchIcon: {
    position: 'absolute',
    left: 'var(--spacing-sm)',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--color-muted-soft)',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    minHeight: '2.5rem',
    paddingLeft: '2.25rem',
    paddingRight: 'var(--spacing-base)',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--typography-body-sm-size)',
    color: 'var(--color-ink)',
    background: 'var(--color-canvas-soft)',
    border: '1px solid var(--color-hairline)',
    borderRadius: 'var(--rounded-md)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    minHeight: '2.5rem',
    padding: '0 var(--spacing-base)',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--typography-body-sm-size)',
    color: 'var(--color-ink)',
    background: 'var(--color-canvas-soft)',
    border: '1px solid var(--color-hairline)',
    borderRadius: 'var(--rounded-md)',
    outline: 'none',
    cursor: 'pointer',
  },
  clearBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--spacing-xxs)',
    minHeight: '2.5rem',
    padding: '0 var(--spacing-sm)',
    borderRadius: 'var(--rounded-md)',
    border: '1px solid var(--color-hairline)',
    background: 'transparent',
    color: 'var(--color-muted)',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--typography-caption-size)',
    fontWeight: 500,
    cursor: 'pointer',
  },

  /* Hint */
  hintBox: {
    padding: 'var(--spacing-base) var(--spacing-lg)',
    border: '1px dashed var(--color-hairline-strong)',
    borderRadius: 'var(--rounded-md)',
    background: 'var(--color-canvas-soft)',
  },
  hintTitle: {
    margin: '0 0 var(--spacing-xs)',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--typography-caption-uppercase-size)',
    fontWeight: 'var(--typography-caption-uppercase-weight)',
    letterSpacing: 'var(--typography-caption-uppercase-ls)',
    textTransform: 'uppercase',
    color: 'var(--color-muted)',
  },
  hintList: {
    margin: 0,
    paddingLeft: '1.2rem',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--typography-caption-size)',
    color: 'var(--color-muted)',
    lineHeight: 1.55,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-xxs)',
  },

  /* Warn box */
  warnBox: {
    padding: 'var(--spacing-sm) var(--spacing-base)',
    borderRadius: 'var(--rounded-md)',
    background: 'rgb(var(--color-semantic-warning-raw) / 0.08)',
    border: '1px solid rgb(var(--color-semantic-warning-raw) / 0.3)',
    color: 'var(--color-semantic-warning)',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--typography-body-sm-size)',
  },

  /* Skeleton */
  skeletonWrap: {
    display: 'grid',
    gap: 'var(--spacing-sm)',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 18rem), 1fr))',
  },
  skeletonCard: {
    height: '4rem',
    borderRadius: 'var(--rounded-md)',
    background: 'var(--color-hairline-soft)',
    animation: 'vp-emp-pulse 1.4s ease-in-out infinite',
  },

  /* Empty */
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--spacing-xs)',
    padding: 'var(--spacing-xxl) var(--spacing-lg)',
    textAlign: 'center',
  },
  emptyIcon: {
    width: '3rem', height: '3rem', borderRadius: '50%',
    background: 'rgb(var(--color-accent-raw) / 0.08)',
    color: 'var(--color-accent)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 'var(--spacing-xxs)',
  },
  emptyTitle: {
    margin: 0,
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--typography-body-sm-size)',
    fontWeight: 'var(--typography-title-sm-weight)',
    color: 'var(--color-ink)',
  },
  emptySub: {
    margin: 0,
    maxWidth: '20rem',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--typography-caption-size)',
    color: 'var(--color-muted)',
    lineHeight: 'var(--typography-caption-lh)',
  },
};
