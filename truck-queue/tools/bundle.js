// รวมโค้ดทั้งหมดเป็นไฟล์เดียว → truck-queue/dist/Code.gs (วางใน Apps Script ไฟล์เดียวจบ)
// รัน: node truck-queue/tools/bundle.js
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, '../apps-script'), out = path.join(__dirname, '../dist');
// Main ก่อน — ให้ setup เป็นฟังก์ชันแรกในช่อง "เรียกใช้" ของ Apps Script
const gs = ['Main', 'Logic', 'Seed', 'Db', 'Maps', 'Auth', 'Api', 'Files', 'Notify', 'Confirm'];
const html = ['Index', 'Css', 'App', 'Sheet', 'Form', 'Po', 'PdfView', 'Act', 'ConfirmPage'];
const head = '/**\n * ระบบขอคิวรถคลังสินค้า · สมใจ — ไฟล์รวม (สร้างอัตโนมัติจาก truck-queue/apps-script ห้ามแก้ไฟล์นี้โดยตรง)\n' +
  ' * วางทั้งไฟล์แทน Code.gs ใน Apps Script แล้วทำตาม truck-queue/README.md\n */\n';
const body = gs.map(n => '// ═════ ' + n + '.gs ═════\n' + fs.readFileSync(path.join(src, n + '.gs'), 'utf8')).join('\n');
const emb = 'var EMBEDDED_HTML = {\n' + html.map(n => '  ' + n + ': ' + JSON.stringify(fs.readFileSync(path.join(src, n + '.html'), 'utf8'))).join(',\n') + '\n};\n';
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'Code.gs'), head + emb + '\n' + body);
fs.copyFileSync(path.join(src, 'appsscript.json'), path.join(out, 'appsscript.json'));
console.log('dist/Code.gs', fs.statSync(path.join(out, 'Code.gs')).size, 'bytes');
