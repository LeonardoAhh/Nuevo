const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./public/REPORTE JUNIO.json', 'utf8'));
const errors = [];

data.slice(0, 5).forEach((rawRow, index) => {
    const row = {};
    for (const [k, v] of Object.entries(rawRow)) {
        row[k.trim()] = v;
    }
    
    const normalizeString = (val) => typeof val === 'string' ? val.trim() : typeof val === 'number' ? String(val) : '';
    const mes = normalizeString(row.mes);
    
    if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
        errors.push(`Fila ${index + 1}: mes inválido, use YYYY-MM. got: '${mes}' (type: ${typeof row.mes})`);
    }
});

console.log('Errors:', errors);
