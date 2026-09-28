/**
 * Genera íconos PNG modernos para PWA/iOS/Android/Desktop usando sólo
 * módulos nativos de Node (zlib). Renderiza un check mark blanco sobre
 * un cuadrado azul redondeado con antialiasing por supersampling 2x2 y
 * campos de distancia firmados (SDF).
 *
 * Variantes:
 *   - "maskable"  → fondo a sangre (toda la lona), contenido en safe area
 *                   central (zone 0.58) para soportar máscaras circulares
 *                   en Android / esquinas redondeadas en iOS.
 *   - "any"       → fondo con esquinas redondeadas (22% del tamaño) estilo
 *                   app icon clásico.
 */
import { deflateSync } from "zlib"
import { writeFileSync, mkdirSync } from "fs"
import { join } from "path"

// ─── PNG encoder (RGBA, 8-bit) ───────────────────────────────────────────────
function crc(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeB = Buffer.from(type, "ascii")
  const lenB = Buffer.alloc(4)
  lenB.writeUInt32BE(data.length, 0)
  const crcB = Buffer.alloc(4)
  crcB.writeUInt32BE(crc(Buffer.concat([typeB, data])), 0)
  return Buffer.concat([lenB, typeB, data, crcB])
}

function encodePNG(size, pixels) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 6  // color type: RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const rowSize = 1 + size * 4
  const raw = Buffer.alloc(size * rowSize)
  for (let y = 0; y < size; y++) {
    const off = y * rowSize
    raw[off] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 4
      const dst = off + 1 + x * 4
      raw[dst + 0] = pixels[src + 0]
      raw[dst + 1] = pixels[src + 1]
      raw[dst + 2] = pixels[src + 2]
      raw[dst + 3] = pixels[src + 3]
    }
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ])
}

// ─── Signed distance functions ──────────────────────────────────────────────
function sdRoundedRect(px, py, hw, hh, r) {
  // px,py relativos al centro
  const qx = Math.abs(px) - hw + r
  const qy = Math.abs(py) - hh + r
  const mx = Math.max(qx, 0)
  const my = Math.max(qy, 0)
  return Math.min(Math.max(qx, qy), 0) + Math.sqrt(mx * mx + my * my) - r
}

function sdSegment(px, py, ax, ay, bx, by) {
  const pax = px - ax, pay = py - ay
  const bax = bx - ax, bay = by - ay
  const denom = bax * bax + bay * bay
  const h = denom === 0 ? 0 : Math.min(1, Math.max(0, (pax * bax + pay * bay) / denom))
  const dx = pax - bax * h
  const dy = pay - bay * h
  return Math.sqrt(dx * dx + dy * dy)
}

function sdCoverage(sd) {
  if (sd <= -0.5) return 1
  if (sd >= 0.5) return 0
  return 0.5 - sd
}

// ─── Pixel blending (source-over) ───────────────────────────────────────────
function blendPixel(pixels, size, x, y, color, a) {
  const off = (y * size + x) * 4
  const da = pixels[off + 3] / 255
  const outA = a + da * (1 - a)
  if (outA < 1e-6) return
  pixels[off + 0] = Math.round((color[0] * a + pixels[off + 0] * da * (1 - a)) / outA)
  pixels[off + 1] = Math.round((color[1] * a + pixels[off + 1] * da * (1 - a)) / outA)
  pixels[off + 2] = Math.round((color[2] * a + pixels[off + 2] * da * (1 - a)) / outA)
  pixels[off + 3] = Math.round(outA * 255)
}

// ─── Drawing (supersampled) ─────────────────────────────────────────────────
function drawShape(pixels, size, color, sdFn) {
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let acc = 0
      for (let sy = 0; sy < 2; sy++) {
        for (let sx = 0; sx < 2; sx++) {
          const fx = px + 0.25 + sx * 0.5
          const fy = py + 0.25 + sy * 0.5
          acc += sdCoverage(sdFn(fx, fy))
        }
      }
      const a = acc / 4
      if (a > 0) blendPixel(pixels, size, px, py, color, a)
    }
  }
}

// ─── Icon renderer ──────────────────────────────────────────────────────────
function generateIcon(size, { maskable = false }) {
  const pixels = new Uint8Array(size * size * 4)

  // 1) Fondo — azul marca (#2563eb)
  const bg = [37, 99, 235]
  const half = size / 2
  const bgRadius = maskable ? 0 : size * 0.22
  drawShape(pixels, size, bg, (x, y) =>
    sdRoundedRect(x - half, y - half, half, half, bgRadius),
  )

  // 2) Glifo — check mark blanco, trazo redondeado.
  //    Safe zone: maskable usa 58% de la lona (margen amplio frente a la
  //    máscara circular de Android); la variante "any" usa 68%.
  const fg = [255, 255, 255]
  const zone = maskable ? 0.58 : 0.68
  const s = size * zone
  const cx = half
  const cy = half

  // Tres puntos de la polilínea del check
  const p1x = cx - s * 0.35, p1y = cy + s * 0.00
  const p2x = cx - s * 0.05, p2y = cy + s * 0.25
  const p3x = cx + s * 0.36, p3y = cy - s * 0.28
  const strokeHalf = (s * 0.15) / 2

  drawShape(pixels, size, fg, (x, y) => {
    const d1 = sdSegment(x, y, p1x, p1y, p2x, p2y)
    const d2 = sdSegment(x, y, p2x, p2y, p3x, p3y)
    return Math.min(d1, d2) - strokeHalf
  })

  return encodePNG(size, pixels)
}

// ─── Output ─────────────────────────────────────────────────────────────────
const outDir = join(process.cwd(), "public", "icons")
mkdirSync(outDir, { recursive: true })

const tasks = [
  // PWA manifest (Android / Chrome / Edge)
  { name: "icon-192.png",          size: 192, maskable: true  },
  { name: "icon-512.png",          size: 512, maskable: true  },
  { name: "icon-192-any.png",      size: 192, maskable: false },
  { name: "icon-512-any.png",      size: 512, maskable: false },
  // iOS / iPadOS home screen
  { name: "apple-touch-icon.png",  size: 180, maskable: true  },
  // Favicons (pestañas / desktop)
  { name: "favicon-32.png",        size:  32, maskable: false },
  { name: "favicon-16.png",        size:  16, maskable: false },
]

for (const t of tasks) {
  const png = generateIcon(t.size, { maskable: t.maskable })
  writeFileSync(join(outDir, t.name), png)
  const tag = t.maskable ? "maskable, full-bleed" : "any, rounded 22%"
  console.log(`✓ public/icons/${t.name} (${t.size}×${t.size}, ${tag})`)
}
