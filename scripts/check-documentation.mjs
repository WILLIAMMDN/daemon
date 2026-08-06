import fs from 'fs';
import path from 'path';

console.log('Validando documentación...');
let hasErrors = false;

// Comprobar que docs/30-design-system tiene 4 archivos
const designDir = path.join(process.cwd(), 'docs', '30-design-system');
if (fs.existsSync(designDir)) {
    const files = fs.readdirSync(designDir).filter(f => f.endsWith('.md'));
    if (files.length !== 4) {
        console.error(`ERROR: docs/30-design-system debe tener exactamente 4 archivos, tiene ${files.length}: ${files.join(', ')}`);
        hasErrors = true;
    }
}

if (hasErrors) {
    process.exit(1);
} else {
    console.log('Docs check passed.');
}
