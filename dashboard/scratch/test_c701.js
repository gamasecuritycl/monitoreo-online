const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../src/lib/clientes_general.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const keys = Object.keys(data);
console.log('Total accounts in JSON:', keys.length);

const c701 = keys.filter(k => k.toLowerCase().includes('701'));
console.log('Keys matching 701:', c701);

c701.forEach(k => console.log(k, '=>', data[k]));
