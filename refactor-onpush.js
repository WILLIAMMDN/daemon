const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.ts')) {
            processFile(fullPath);
        }
    }
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Only process files that have @Component
    if (!content.includes('@Component(')) return;
    
    // Skip if already has OnPush
    if (content.includes('ChangeDetectionStrategy.OnPush')) return;
    
    // Add import if missing
    if (!content.includes('ChangeDetectionStrategy')) {
        // Find existing @angular/core import
        const coreImportRegex = /import\s+{([^}]*)}\s+from\s+['"]@angular\/core['"]/;
        const match = content.match(coreImportRegex);
        if (match) {
            const currentImports = match[1];
            const newImports = currentImports + ', ChangeDetectionStrategy';
            content = content.replace(match[0], `import {${newImports}} from '@angular/core'`);
        } else {
            content = `import { ChangeDetectionStrategy } from '@angular/core';\n` + content;
        }
    }
    
    // Add changeDetection to @Component config
    // We look for `@Component({` and add it right after
    const componentRegex = /@Component\s*\(\s*{/;
    if (componentRegex.test(content)) {
        content = content.replace(componentRegex, `@Component({\n  changeDetection: ChangeDetectionStrategy.OnPush,`);
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log('Updated:', filePath);
    }
}

processDir(path.join(__dirname, 'frontend-angular', 'src', 'app'));
console.log('Done.');
