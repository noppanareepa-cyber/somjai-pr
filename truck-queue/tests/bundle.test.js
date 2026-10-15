// ไฟล์รวม dist/Code.gs ต้องตรงกับโค้ดล่าสุด และโหลด HTML ที่ฝังไว้ได้
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

test('dist/Code.gs เป็นฉบับล่าสุดและใช้ HTML ที่ฝังไว้', () => {
  const file = path.join(__dirname, '../dist/Code.gs');
  const before = fs.readFileSync(file, 'utf8');
  execFileSync('node', [path.join(__dirname, '../tools/bundle.js')]);
  assert.equal(fs.readFileSync(file, 'utf8'), before, 'รัน node truck-queue/tools/bundle.js แล้ว commit ใหม่');
  const made = [];
  const ctx = vm.createContext({ HtmlService: { createTemplate: (s) => { made.push(s); return { evaluate: () => ({}) }; } } });
  vm.runInContext(before, ctx);
  for (const n of ['Index', 'Css', 'App', 'Sheet']) assert.ok(ctx.html_(n).length > 500, n);
  ctx.template_('Index');
  assert.match(made[0], /include_\('App'\)/);
  for (const f of ['setup', 'setPins', 'doGet', 'quote', 'submitRequest', 'whBoard', 'decide', 'autoPostpone', 'updateBranchCoords']) {
    assert.equal(typeof ctx[f], 'function', f);
  }
});
