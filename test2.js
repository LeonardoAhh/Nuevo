const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./public/REPORTE JUNIO.json', 'utf8'));
const errors = [];
data.forEach((rawRow, i) => {
    const row = {};
    for (const [k, v] of Object.entries(rawRow)) {
        row[k.trim()] = v;
    }
    const mes = typeof row.mes === 'string' ? row.mes.trim() : typeof row.mes === 'number' ? String(row.mes) : '';
    if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
        errors.push({index: i, mes: mes, length: mes.length, chars: mes.split('').map(c => c.charCodeAt(0))});
    }
});
console.log('Total errors:', errors.length);
if (errors.length > 0) {
    console.log(errors.slice(0, 5));
}
