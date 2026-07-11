import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const src = fs.readFileSync('lib/catalogo.ts', 'utf8');
const allPuestos = new Set();

// Extract all puestos from catalogo.ts
const pBlocks = src.split('puestos:');
for (let i = 1; i < pBlocks.length; i++) {
  const arr = pBlocks[i].match(/\[([^\]]+)\]/);
  if (!arr) continue;
  const re = /"([^"]+)"/g;
  let m;
  while ((m = re.exec(arr[1]))) allPuestos.add(m[1]);
}

console.log('Puestos en catálogo:', allPuestos.size);

const { data } = await s.from('employees').select('puesto');
const map = {};
data.forEach(e => {
  if (!e.puesto) return;
  if (!map[e.puesto]) map[e.puesto] = 0;
  map[e.puesto]++;
});

const keys = Object.keys(map).sort();
let miss = 0;
keys.forEach(p => {
  if (!allPuestos.has(p)) {
    miss++;
    console.log(`❌ ${p} (${map[p]} empleados)`);
  }
});

if (miss === 0) console.log('✅ Todos los puestos de la BD coinciden con el catálogo!');
else console.log(`\nTotal no encontrados: ${miss}`);
