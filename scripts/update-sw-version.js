const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '../public/sw.js');

try {
  let swContent = fs.readFileSync(swPath, 'utf8');

  // Buscar si ya existe un timestamp previo
  const timestampRegex = /^\/\/ TIMESTAMP: .*\n/m;
  const newTimestamp = `// TIMESTAMP: ${new Date().toISOString()}\n`;

  if (timestampRegex.test(swContent)) {
    // Si existe, lo reemplazamos
    swContent = swContent.replace(timestampRegex, newTimestamp);
  } else {
    // Si no existe, lo agregamos al inicio del archivo
    swContent = newTimestamp + swContent;
  }

  fs.writeFileSync(swPath, swContent, 'utf8');
  console.log(`✅ [Service Worker] Inyectado nuevo timestamp para forzar actualización: ${new Date().toISOString()}`);
} catch (error) {
  console.error("❌ Error al actualizar sw.js:", error);
  process.exit(1);
}
