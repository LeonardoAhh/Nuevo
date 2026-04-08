/**
 * Genera íconos PNG para el PWA manifest usando solo módulos de Node.js
 * (sin dependencias externas — usa zlib nativo para comprimir)
 */
import { deflateSync, crc32 } from "zlib"
import { writeFileSync, mkdirSync } from "fs"
import { join } from "path"

function crc(buf) {
  // CRC-32 manual (mismo que usa el spec de PNG)
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
  const crcInput = Buffer.concat([typeB, data])
  const crcB = Buffer.alloc(4)
  crcB.writeUInt32BE(crc(crcInput), 0)
  return Buffer.concat([lenB, typeB, data, crcB])
}

function solidPNG(size, r, g, b) {
  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 2  // RGB
  ihdr[10] = 0 // deflate
  ihdr[11] = 0 // adaptive filter
  ihdr[12] = 0 // no interlace

  // Raw image data: filter byte (0) + RGB per pixel per row
  const rowSize = 1 + size * 3
  const raw = Buffer.alloc(size * rowSize)
  for (let y = 0; y < size; y++) {
    const off = y * rowSize
    raw[off] = 0 // filter none
    for (let x = 0; x < size; x++) {
      raw[off + 1 + x * 3 + 0] = r
      raw[off + 1 + x * 3 + 1] = g
      raw[off + 1 + x * 3 + 2] = b
    }
  }

  const compressed = deflateSync(raw)

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ])
}

const outDir = join(process.cwd(), "public", "icons")
mkdirSync(outDir, { recursive: true })

// Azul principal: #2563eb → rgb(37, 99, 235)
for (const size of [192, 512]) {
  const png = solidPNG(size, 37, 99, 235)
  writeFileSync(join(outDir, `icon-${size}.png`), png)
  console.log(`✓ public/icons/icon-${size}.png (${size}×${size})`)
}
