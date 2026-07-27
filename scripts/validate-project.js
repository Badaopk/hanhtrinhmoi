'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const entries = fs.readdirSync(root, { withFileTypes: true });
const files = new Set(entries.filter(entry => entry.isFile()).map(entry => entry.name));
const htmlFiles = [...files].filter(file => file.endsWith('.html'));
const jsFiles = [...files].filter(file => file.endsWith('.js') && !file.endsWith('.bak'));
const failures = [];

for (const file of jsFiles) {
    try {
        execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' });
    } catch (error) {
        failures.push(`JavaScript không hợp lệ: ${file}\n${error.stderr?.toString() || error.message}`);
    }
}

const localRefPattern = /(?:href|src)\s*=\s*["']([^"']+)["']/gi;
for (const htmlFile of htmlFiles) {
    const content = fs.readFileSync(path.join(root, htmlFile), 'utf8');
    for (const match of content.matchAll(localRefPattern)) {
        const value = match[1];
        if (!value || value.includes('${') || /^(?:https?:|data:|mailto:|javascript:|#|\/socket\.io)/i.test(value)) continue;
        const target = value.split(/[?#]/)[0].replace(/^\//, '');
        if (target && !files.has(target)) failures.push(`${htmlFile}: thiếu tệp ${target}`);
    }
}

const serverSource = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const serverRoutes = new Set(
    [...serverSource.matchAll(/app\.(?:get|post|put|delete)\(\s*['"]([^'"]+)['"]/g)].map(match => match[1])
);
for (const sourceFile of [...htmlFiles, ...jsFiles.filter(file => file !== 'server.js')]) {
    const content = fs.readFileSync(path.join(root, sourceFile), 'utf8');
    for (const match of content.matchAll(/fetch\(\s*[`'"]([^`'"]+)/g)) {
        const raw = match[1];
        if (!raw.startsWith('/api/') || raw.includes('${')) continue;
        const route = raw.split('?')[0];
        if (!serverRoutes.has(route)) failures.push(`${sourceFile}: API chưa tồn tại ${route}`);
    }
}

if (failures.length) {
    console.error(`❌ Phát hiện ${failures.length} lỗi:\n- ${failures.join('\n- ')}`);
    process.exit(1);
}

console.log(`✅ Kiểm tra thành công: ${htmlFiles.length} trang HTML, ${jsFiles.length} tệp JavaScript, ${serverRoutes.size} API.`);
