const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./public/REPORTE JUNIO.json', 'utf8'));
const errors = [];
data.forEach((rawRow, i) => {
    const row = {};
    for (const [k, v] of Object.entries(rawRow)) row[k.trim()] = v;
    const normalizeString = (val) => typeof val === 'string' ? val.trim() : typeof val === 'number' ? String(val) : '';
    const mes = normalizeString(row.mes);
    const numero_empleado = normalizeString(row.numero_empleado);
    const nombre = normalizeString(row.nombre);
    const departamento = normalizeString(row.departamento);
    const area = normalizeString(row.area ?? row['área']);
    
    if (mes === 'mes' && numero_empleado === 'numero_empleado') return;
    
    if (!mes || !/^\d{4}-\d{2}$/.test(mes)) errors.push('mes error ' + i);
    if (!numero_empleado) errors.push('numero_empleado error ' + i);
    if (!nombre) errors.push('nombre error ' + i);
    if (!departamento) errors.push('departamento error ' + i);
    if (!area) errors.push('area error ' + i);
});
console.log('Total errors:', errors.length);
if (errors.length > 0) console.log(errors.slice(0, 10));
