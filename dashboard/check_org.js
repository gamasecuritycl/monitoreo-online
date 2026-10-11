const fs = require('fs');

const targetPath = 'src/components/operacion/OrganigramaModule.tsx';
let content = fs.readFileSync(targetPath, 'utf8');

console.log('Original content lines:', content.split('\n').length);
