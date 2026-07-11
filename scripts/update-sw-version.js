const fs   = require('fs');
const path = require('path');

const swPath  = path.join(__dirname, '../public/sw.js');
const tmpPath = swPath + '.tmp';

// ── Validar que el archivo existe antes de intentar leerlo ──────────
if (!fs.existsSync(swPath)) {
  console.error(`❌ No se encontró sw.js en: ${swPath}`);
  process.exit(1);
}

// ── Una sola instancia de fecha para consistencia total ─────────────
const now = new Date().toISOString();

try {
  let swContent = fs.readFileSync(swPath, 'utf8');

  // Cubre line endings de Windows (\r\n) y Unix (\n)
  const timestampRegex = /^\/\/ TIMESTAMP: .+\r?\n/m;
  const newTimestamp   = `// TIMESTAMP: ${now}\n`;

  swContent = timestampRegex.test(swContent)
    ? swContent.replace(timestampRegex, newTimestamp)   // reemplaza existente
    : newTimestamp + swContent;                         // inserta al inicio

  // Escritura atómica: escribe en .tmp y luego renombra
  // Si writeFileSync falla, el sw.js original queda intacto
  fs.writeFileSync(tmpPath, swContent, 'utf8');
  fs.renameSync(tmpPath, swPath);

  console.log(`✅ [Service Worker] Timestamp inyectado: ${now}`);
} catch (error) {
  // Limpiar el .tmp si quedó huérfano
  if (fs.existsSync(tmpPath)) {
    try { fs.unlinkSync(tmpPath); } catch { /* ignorar error secundario */ }
  }
  console.error('❌ Error al actualizar sw.js:', error);
  process.exit(1);
}
