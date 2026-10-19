/**
 * ระบบขอคิวรถคลังสินค้า · สมใจ — ไฟล์รวม (สร้างอัตโนมัติจาก truck-queue/apps-script ห้ามแก้ไฟล์นี้โดยตรง)
 * วางทั้งไฟล์แทน Code.gs ใน Apps Script แล้วทำตาม truck-queue/README.md
 */
var EMBEDDED_HTML = {
  Index: "<!DOCTYPE html>\n<html lang=\"th\">\n<head>\n  <base target=\"_top\">\n  <meta charset=\"utf-8\">\n  <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n  <link href=\"https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap\" rel=\"stylesheet\">\n  <?!= include_('Css') ?>\n</head>\n<body>\n  <header class=\"top\">\n    <div class=\"brand\">สมใจ <span>ขอคิวรถคลังสินค้า</span></div>\n    <button id=\"who\" class=\"chip\" hidden></button>\n  </header>\n\n  <main id=\"app\">\n    <p class=\"muted center\" id=\"loading\">กำลังโหลด…</p>\n  </main>\n\n  <footer class=\"foot\">\n    <button class=\"link\" id=\"staffLink\">สำหรับคลัง / ผู้อนุมัติ</button>\n  </footer>\n\n  <div id=\"modal\" class=\"modal\" hidden></div>\n  <div id=\"toast\" class=\"toast\" hidden></div>\n\n  <script><?!= logicSource_() ?></script>\n  <?!= include_('App') ?>\n</body>\n</html>\n",
  Css: "<style>\n  :root {\n    --green: #1f7a3a; --green-soft: #e7f3ea; --ink: #1d2420; --muted: #66706a; --line: #dfe5e1;\n    --bg: #f6f8f6; --card: #fff; --warn: #9a5b00; --warn-soft: #fff4e0; --bad: #b3261e; --bad-soft: #fdecea;\n    --info: #1b5fa8; --info-soft: #e8f1fb;\n  }\n  * { box-sizing: border-box; }\n  [hidden] { display: none !important; }\n  body { margin: 0; font-family: 'Sarabun', system-ui, sans-serif; font-size: 16px; color: var(--ink); background: var(--bg); }\n  .top { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; justify-content: space-between;\n    gap: 8px; padding: 10px 16px; background: var(--green); color: #fff; }\n  .brand { font-weight: 700; font-size: 20px; }\n  .brand span { font-weight: 400; font-size: 15px; opacity: .9; margin-left: 4px; }\n  main { max-width: 720px; margin: 0 auto; padding: 12px 16px 24px; }\n  .foot { text-align: center; padding: 8px 16px 32px; }\n  h2 { font-size: 19px; margin: 8px 0 12px; }\n  h3 { font-size: 16px; margin: 18px 0 8px; color: var(--green); }\n  .card { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 14px; margin-bottom: 10px; }\n  label { display: block; font-weight: 600; margin: 12px 0 4px; }\n  label .opt { font-weight: 400; color: var(--muted); font-size: 14px; }\n  input[type=text], input[type=number], input[type=tel], input[type=date], input[type=password], select, textarea {\n    width: 100%; padding: 10px 12px; font: inherit; border: 1px solid var(--line); border-radius: 8px; background: #fff; }\n  textarea { min-height: 64px; }\n  input:focus, select:focus, textarea:focus { outline: 2px solid var(--green); border-color: transparent; }\n  .row { display: flex; gap: 10px; } .row > * { flex: 1; min-width: 0; }\n  .check { display: flex; align-items: center; gap: 8px; font-weight: 400; margin: 10px 0; }\n  .check input { width: 20px; height: 20px; }\n  .seg { display: flex; flex-wrap: wrap; gap: 6px; }\n  .seg label { margin: 0; font-weight: 400; }\n  .seg input { display: none; }\n  .seg span { display: inline-block; padding: 8px 12px; border: 1px solid var(--line); border-radius: 999px; background: #fff; cursor: pointer; }\n  .seg input:checked + span { background: var(--green); color: #fff; border-color: var(--green); }\n  button { font: inherit; cursor: pointer; }\n  .btn { display: inline-block; padding: 11px 16px; border-radius: 10px; border: 1px solid var(--green); background: var(--green);\n    color: #fff; font-weight: 600; }\n  .btn.ghost { background: #fff; color: var(--green); }\n  .btn.bad { background: #fff; color: var(--bad); border-color: var(--bad); }\n  .btn.small { padding: 6px 10px; font-size: 14px; border-radius: 8px; font-weight: 400; }\n  .btn.block { width: 100%; margin-top: 16px; }\n  .btn:disabled { opacity: .5; cursor: default; }\n  .link { background: none; border: 0; color: var(--green); text-decoration: underline; padding: 4px; }\n  .chip { background: rgba(255,255,255,.18); color: #fff; border: 0; border-radius: 999px; padding: 6px 12px; font-size: 14px; }\n  .tabs { display: flex; gap: 4px; margin: 4px 0 12px; overflow-x: auto; }\n  .tabs button { flex: 1; white-space: nowrap; padding: 10px 12px; border: 0; border-bottom: 3px solid transparent; background: none; color: var(--muted); font-weight: 600; }\n  .tabs button.on { color: var(--green); border-bottom-color: var(--green); }\n  .muted { color: var(--muted); } .center { text-align: center; } .small { font-size: 14px; }\n  .note { padding: 10px 12px; border-radius: 8px; margin: 10px 0; font-size: 15px; }\n  .note.ok { background: var(--green-soft); } .note.warn { background: var(--warn-soft); color: var(--warn); }\n  .note.bad { background: var(--bad-soft); color: var(--bad); } .note.info { background: var(--info-soft); color: var(--info); }\n  .rounds { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }\n  .round { text-align: left; padding: 10px; border: 1px solid var(--line); border-radius: 10px; background: #fff; }\n  .round b { display: block; } .round small { color: var(--muted); }\n  .round.on { border: 2px solid var(--green); background: var(--green-soft); }\n  .round:disabled { opacity: .45; }\n  .badge { display: inline-block; font-size: 13px; padding: 2px 8px; border-radius: 999px; background: var(--line); }\n  .badge.ok { background: var(--green-soft); color: var(--green); } .badge.warn { background: var(--warn-soft); color: var(--warn); }\n  .badge.bad { background: var(--bad-soft); color: var(--bad); } .badge.info { background: var(--info-soft); color: var(--info); }\n  .item { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }\n  .item .title { font-weight: 600; }\n  .actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }\n  .kv { display: grid; grid-template-columns: auto 1fr; gap: 2px 10px; font-size: 15px; margin-top: 6px; }\n  .kv dt { color: var(--muted); } .kv dd { margin: 0; overflow-wrap: anywhere; }\n  .late { border-left: 4px solid var(--bad); }\n  .modal { position: fixed; inset: 0; z-index: 20; background: rgba(0,0,0,.4); display: flex; align-items: flex-end; justify-content: center; }\n  .modal .sheet { background: #fff; width: 100%; max-width: 560px; max-height: 92vh; overflow: auto; border-radius: 16px 16px 0 0; padding: 16px; }\n  @media (min-width: 600px) { .modal { align-items: center; } .modal .sheet { border-radius: 16px; } }\n  .toast { position: fixed; left: 16px; right: 16px; bottom: 16px; z-index: 30; max-width: 560px; margin: 0 auto;\n    background: var(--ink); color: #fff; padding: 12px 14px; border-radius: 10px; }\n  .toast.bad { background: var(--bad); }\n  .req { color: var(--bad); font-weight: 400; font-size: 14px; }\n  .thumbs { display: flex; flex-wrap: wrap; gap: 8px; margin: 4px 0; }\n  .thumb { position: relative; width: 84px; height: 84px; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; background: #fff; }\n  .thumb img { width: 100%; height: 100%; object-fit: cover; }\n  .thumb button { position: absolute; top: 2px; right: 2px; width: 24px; height: 24px; border: 0; border-radius: 50%; background: rgba(0,0,0,.6); color: #fff; font-size: 13px; padding: 0; }\n  .pdfx { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bad-soft); color: var(--bad); padding: 4px; text-align: center; }\n  .pdfx span { font-size: 11px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 76px; }\n  .thumb.add { display: flex; align-items: center; justify-content: center; text-align: center; font-size: 13px; color: var(--green); border-style: dashed; cursor: pointer; }\n  .count { display: inline-block; min-width: 22px; padding: 0 6px; border-radius: 999px; background: var(--bad); color: #fff; font-size: 13px; text-align: center; }\n</style>\n",
  App: "<script>\n/* หน้าเว็บขอคิวรถ — ฟังก์ชันค่าส่ง/วันที่ (policyFee_, thaiDate_ …) ฝังมาจาก Logic.gs */\nvar B = null;            // ข้อมูลตั้งต้นจาก getBootstrap()\nvar me = load('tq_me');  // {name, branchCode}\nvar staff = load('tq_staff'); // {role, pin, actor}\nvar view = 'request';\nvar Q = null;            // ผลคำนวณล่าสุดจาก quote()\nvar pick = null;         // รอบที่เลือก {date, plate}\nvar PO = [];             // ไฟล์ใบสั่งซื้อที่เลือกไว้ (รูปย่อแล้ว / PDF) [{name, mime, data, url}]\nvar PO_MAX = 5;\n\nfunction load(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }\nfunction save(k, v) { try { v ? localStorage.setItem(k, JSON.stringify(v)) : localStorage.removeItem(k); } catch (e) {} }\nfunction $(s, el) { return (el || document).querySelector(s); }\nfunction esc(s) { return String(s == null ? '' : s).replace(/[&<>\"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }\nfunction money(n) { return Number(n || 0).toLocaleString('th-TH'); }\nfunction branchName(code) { var b = B.branches.filter(function (x) { return x.code === code; })[0]; return b ? b.name : code; }\n\nfunction call(fn) {\n  var args = Array.prototype.slice.call(arguments, 1);\n  return new Promise(function (ok, fail) {\n    var r = google.script.run.withSuccessHandler(ok).withFailureHandler(function (e) { fail(e); });\n    r[fn].apply(r, args);\n  });\n}\n\nfunction toast(msg, bad) {\n  var t = $('#toast'); t.textContent = msg; t.className = 'toast' + (bad ? ' bad' : ''); t.hidden = false;\n  clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, bad ? 6000 : 3500);\n}\nfunction fail(e) { toast((e && e.message) || String(e), true); }\n\n/** กล่องถามข้อมูล · fields: [{name, label, type, value, options, required}] → Promise(values|null) */\nfunction ask(title, fields, okLabel) {\n  return new Promise(function (resolve) {\n    var m = $('#modal');\n    m.innerHTML = '<form class=\"sheet\"><h2>' + esc(title) + '</h2>' + fields.map(function (f) {\n      var v = esc(f.value == null ? '' : f.value);\n      var input = f.type === 'select'\n        ? '<select name=\"' + f.name + '\">' + f.options.map(function (o) {\n            var val = typeof o === 'object' ? o.value : o, lab = typeof o === 'object' ? o.label : o;\n            return '<option value=\"' + esc(val) + '\"' + (String(val) === String(f.value) ? ' selected' : '') + '>' + esc(lab) + '</option>'; }).join('') + '</select>'\n        : f.type === 'textarea' ? '<textarea name=\"' + f.name + '\">' + v + '</textarea>'\n        : f.type === 'note' ? '<div class=\"note info\">' + esc(f.value) + '</div>'\n        : '<input name=\"' + f.name + '\" type=\"' + (f.type || 'text') + '\" value=\"' + v + '\"' + (f.type === 'number' ? ' inputmode=\"numeric\"' : '') + '>';\n      return (f.label ? '<label>' + esc(f.label) + (f.required ? '' : ' <span class=\"opt\">(ถ้ามี)</span>') + '</label>' : '') + input;\n    }).join('') + '<div class=\"row\" style=\"margin-top:16px\"><button type=\"button\" class=\"btn ghost\" data-x>ปิด</button>' +\n      '<button class=\"btn\">' + esc(okLabel || 'บันทึก') + '</button></div></form>';\n    m.hidden = false;\n    var form = $('form', m);\n    $('[data-x]', m).onclick = function () { m.hidden = true; resolve(null); };\n    form.onsubmit = function (ev) {\n      ev.preventDefault();\n      var out = {};\n      for (var i = 0; i < fields.length; i++) {\n        var f = fields[i]; if (f.type === 'note') continue;\n        out[f.name] = form.elements[f.name].value.trim();\n        if (f.required && !out[f.name]) { toast('กรุณากรอก ' + f.label, true); return; }\n      }\n      m.hidden = true; resolve(out);\n    };\n  });\n}\n\n/** ย่อรูปเป็น JPEG ด้านยาวไม่เกิน 1800px ให้ส่งเร็วแต่ยังอ่านตัวหนังสือในใบสั่งซื้อได้ */\nfunction shrink(file) {\n  return new Promise(function (ok, bad) {\n    var rd = new FileReader();\n    rd.onerror = function () { bad(new Error('อ่านไฟล์ ' + file.name + ' ไม่ได้')); };\n    rd.onload = function () {\n      var img = new Image();\n      img.onerror = function () { bad(new Error('ไฟล์ ' + file.name + ' ไม่ใช่รูปที่เปิดได้ (ใช้ JPG/PNG หรือถ่ายรูปใหม่)')); };\n      img.onload = function () {\n        var k = Math.min(1, 1800 / Math.max(img.naturalWidth, img.naturalHeight));\n        var c = document.createElement('canvas');\n        c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);\n        var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);\n        g.drawImage(img, 0, 0, c.width, c.height);\n        var url = c.toDataURL('image/jpeg', 0.8);\n        ok({ name: file.name, mime: 'image/jpeg', data: url.split(',')[1], url: url });\n      };\n      img.src = rd.result;\n    };\n    rd.readAsDataURL(file);\n  });\n}\n/** PDF ส่งทั้งไฟล์ (ไม่เกิน 4 MB) */\nfunction readPdf(file) {\n  return new Promise(function (ok, bad) {\n    if (file.size > 4 * 1024 * 1024) return bad(new Error('ไฟล์ ' + file.name + ' ใหญ่เกิน 4 MB'));\n    var rd = new FileReader();\n    rd.onerror = function () { bad(new Error('อ่านไฟล์ ' + file.name + ' ไม่ได้')); };\n    rd.onload = function () { ok({ name: file.name, mime: 'application/pdf', data: String(rd.result).split(',')[1], pdf: true }); };\n    rd.readAsDataURL(file);\n  });\n}\nfunction isPdf(file) { return file.type === 'application/pdf' || /\\.pdf$/i.test(file.name); }\nfunction poPayload(list) { return list.map(function (x) { return { name: x.name, mime: x.mime, data: x.data }; }); }\n\n/** ช่องแนบใบสั่งซื้อ (รูป JPG/PNG หรือ PDF): ภาพย่อ + ปุ่มลบ + ปุ่มถ่าย/เลือกไฟล์ · list ถูกแก้ในที่ */\nfunction poPicker(box, list, max) {\n  box.innerHTML = '<div class=\"thumbs\">' + list.map(function (x, i) {\n    return '<div class=\"thumb\">' + (x.pdf ? '<div class=\"pdfx\"><b>PDF</b><span>' + esc(x.name) + '</span></div>' : '<img src=\"' + x.url + '\" alt=\"\">') +\n      '<button type=\"button\" data-rm=\"' + i + '\" aria-label=\"ลบไฟล์\">✕</button></div>';\n  }).join('') + (list.length < max ? '<label class=\"thumb add\"><input type=\"file\" accept=\"image/*,application/pdf,.pdf\" multiple hidden><span>＋<br>ถ่ายรูป/<br>เลือกไฟล์</span></label>' : '') + '</div>' +\n    '<div class=\"small muted\">' + (list.length ? list.length + ' ไฟล์ · ' : '') + 'JPG, PNG หรือ PDF ไม่เกิน ' + max + ' ไฟล์ · ให้เห็นเลขที่ ยอดเงิน และรายการชัดเจน</div>';\n  box.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { list.splice(+b.dataset.rm, 1); poPicker(box, list, max); }; });\n  var inp = $('input[type=file]', box);\n  if (inp) inp.onchange = function () {\n    var files = Array.prototype.slice.call(inp.files, 0, max - list.length);\n    if (inp.files.length > files.length) toast('แนบได้ไม่เกิน ' + max + ' ไฟล์', true);\n    box.querySelector('.add span').textContent = 'กำลังเตรียมไฟล์…';\n    files.reduce(function (p, file) {\n      return p.then(function () { return (isPdf(file) ? readPdf(file) : shrink(file)).then(function (x) { list.push(x); }); });\n    }, Promise.resolve()).catch(fail).then(function () { poPicker(box, list, max); });\n  };\n}\n\n// ───────────────────────────── เริ่มต้น ─────────────────────────────\n\ncall('getBootstrap').then(function (b) {\n  B = b;\n  if (me && !B.sales.some(function (s) { return s.name === me.name && s.branchCode === me.branchCode; })) {\n    // ชื่อถูกเปลี่ยน/ปิดโดยคลัง — ให้เลือกใหม่\n    if (!B.sales.some(function (s) { return s.branchCode === me.branchCode; })) me = null;\n  }\n  render();\n}).catch(fail);\n\n$('#who').onclick = function () { me = null; save('tq_me', null); view = 'request'; render(); };\n$('#staffLink').onclick = function () { staffLogin(); };\n\nfunction render() {\n  var who = $('#who');\n  if (staff) {\n    who.hidden = false; who.textContent = staff.actor + ' · ' + { wh: 'คลัง', zone: 'ผจก.เขต', ceo: 'CEO', coo: 'COO' }[staff.role] + ' ✕';\n    who.onclick = function () { staff = null; save('tq_staff', null); view = 'request'; render(); };\n  } else {\n    who.hidden = !me; who.textContent = me ? me.name + ' · ' + branchName(me.branchCode) + ' ✎' : '';\n    who.onclick = function () { me = null; save('tq_me', null); view = 'request'; render(); };\n  }\n  if (staff) return renderStaff();\n  if (!me) return renderWho();\n  var app = $('#app');\n  app.innerHTML = '<div class=\"tabs\"><button data-v=\"request\">ขอคิวส่งลูกค้า</button><button data-v=\"mine\">คำขอของสาขา</button></div><div id=\"pane\"></div>';\n  app.querySelectorAll('.tabs button').forEach(function (b) {\n    b.classList.toggle('on', b.dataset.v === view);\n    b.onclick = function () { view = b.dataset.v; render(); };\n  });\n  if (view === 'mine') renderMine(); else renderForm();\n}\n\n// ───────────────────────────── เลือกชื่อ ─────────────────────────────\n\nfunction renderWho() {\n  var app = $('#app');\n  var opts = B.branches.map(function (b) { return '<option value=\"' + b.code + '\">' + esc(b.name + ' (' + b.code + ')') + '</option>'; }).join('');\n  app.innerHTML = '<div class=\"card\"><h2>คุณคือใคร</h2><p class=\"muted small\">เลือกครั้งเดียว เครื่องนี้จะจำไว้</p>' +\n    '<label>สาขา</label><select id=\"wb\"><option value=\"\">— เลือกสาขา —</option>' + opts + '</select>' +\n    '<label>ชื่อ</label><select id=\"wn\" disabled><option>— เลือกสาขาก่อน —</option></select>' +\n    '<button class=\"link\" id=\"wadd\" hidden>+ ไม่มีชื่อฉันในรายการ</button>' +\n    '<button class=\"btn block\" id=\"wok\" disabled>เริ่มใช้งาน</button></div>';\n  var wb = $('#wb'), wn = $('#wn');\n  wb.onchange = function () {\n    var names = B.sales.filter(function (s) { return s.branchCode === wb.value; });\n    wn.disabled = !wb.value;\n    wn.innerHTML = '<option value=\"\">— เลือกชื่อ —</option>' + names.map(function (s) {\n      return '<option value=\"' + esc(s.name) + '\">' + esc(s.name) + (s.manager ? ' (ผจก.สาขา)' : '') + '</option>'; }).join('');\n    $('#wadd').hidden = !wb.value; $('#wok').disabled = true;\n  };\n  wn.onchange = function () { $('#wok').disabled = !wn.value; };\n  $('#wadd').onclick = function () {\n    ask('เพิ่มชื่อของฉัน', [{ name: 'role', label: 'ตำแหน่ง', type: 'select', required: true,\n        options: [{ value: 'ขาย', label: 'พนักงานขาย' }, { value: 'ผจก.สาขา', label: 'ผู้จัดการสาขา' }] },\n      { name: 'name', label: 'ชื่อ (ผู้จัดการสาขาใส่ชื่อ-นามสกุล)', required: true },\n      { type: 'note', value: 'สาขา: ' + branchName(wb.value) + ' · คลังจะตรวจชื่อใหม่อีกครั้ง' }], 'เพิ่มชื่อ').then(function (v) {\n      if (!v) return;\n      call('addMyName', v.name, wb.value, v.role).then(function (p) {\n        B.sales.push(p); me = p; save('tq_me', me); render();\n      }).catch(fail);\n    });\n  };\n  $('#wok').onclick = function () { me = { name: wn.value, branchCode: wb.value }; save('tq_me', me); render(); };\n}\n\n// ───────────────────────────── ฟอร์มขอคิว ─────────────────────────────\n\nfunction renderForm() {\n  var b = B.branches.filter(function (x) { return x.code === me.branchCode; })[0] || {};\n  var pane = $('#pane');\n  if (!b.bookable) {\n    pane.innerHTML = '<div class=\"note warn\">สาขา ' + esc(b.name || me.branchCode) + ' ยังไม่เปิดใช้ระบบขอคิว (ช่วงทดลองเปิดเฉพาะบางสาขา) กรุณาใช้วิธีเดิมไปก่อน</div>';\n    return;\n  }\n  PO = [];\n  pane.innerHTML = '<form id=\"f\" class=\"card\" autocomplete=\"off\">' +\n    '<label>ส่งสินค้าให้ลูกค้า</label><div class=\"seg\">' +\n      '<label><input type=\"radio\" name=\"area\" value=\"metro\"><span>กรุงเทพฯ และปริมณฑล</span></label>' +\n      '<label><input type=\"radio\" name=\"area\" value=\"up\"><span>ต่างจังหวัด</span></label></div>' +\n    '<div class=\"small muted\" id=\"areaHint\">ปริมณฑล = นนทบุรี สมุทรปราการ สมุทรสาคร นครปฐม ปทุมธานี</div>' +\n    '<label>ลูกค้า / หน่วยงาน</label><input type=\"text\" name=\"customer\">' +\n    '<label>ลิงก์ Google Maps ของลูกค้า</label><input type=\"text\" name=\"mapsUrl\" placeholder=\"https://maps.app.goo.gl/…\">' +\n    '<label>ที่อยู่ <span class=\"opt\">(ถ้าไม่มีลิงก์ ต้องใส่)</span></label><textarea name=\"address\"></textarea>' +\n    '<div class=\"row\"><div><label>มูลค่าสินค้า ก่อน VAT (บาท)</label><input type=\"number\" name=\"value\" min=\"0\" inputmode=\"decimal\"></div>' +\n    '<div><label>จำนวนสินค้า</label><input type=\"text\" name=\"qty\" placeholder=\"เช่น 10 ลัง\"></div></div>' +\n    '<label>ของอยู่ที่</label><div class=\"seg\">' + B.stockOptions.map(function (o) {\n      return '<label><input type=\"radio\" name=\"stock\" value=\"' + esc(o) + '\"><span>' + esc(o) + '</span></label>'; }).join('') + '</div>' +\n    '<label class=\"check\"><input type=\"checkbox\" name=\"lowMargin\"> สินค้ากลุ่มกระดาษ / Low Margin (คลังพิจารณาค่าส่งเป็นรายกรณี)</label>' +\n    '<label>ใบสั่งซื้อ (รูป/PDF) <span class=\"opt\" id=\"poReq\">(ถ้ามี · ส่งต่างจังหวัดต้องแนบ)</span></label><div id=\"poBox\"></div>' +\n    '<button type=\"button\" class=\"btn ghost block\" id=\"qbtn\">ตรวจระยะทาง ค่าส่ง และวันส่ง</button>' +\n    '<div id=\"qres\"></div></form>';\n  var f = $('#f');\n  poPicker($('#poBox'), PO, PO_MAX);\n  f.querySelectorAll('input[name=area]').forEach(function (r) { r.onchange = function () { areaChanged(f); }; });\n  $('#qbtn').onclick = function () { doQuote(f); };\n  ['mapsUrl', 'address'].forEach(function (n) { f.elements[n].oninput = function () { Q = null; pick = null; $('#qres').innerHTML = ''; }; });\n  f.elements.value.oninput = function () { if (Q) renderQuote(f); };\n  f.elements.lowMargin.onchange = function () { if (Q) renderQuote(f); };\n  f.onsubmit = function (ev) { ev.preventDefault(); };\n}\n\nfunction areaOf(f) { return (f.querySelector('input[name=area]:checked') || {}).value || ''; }\n\n/** เปลี่ยนกล่อง กรุงเทพฯ/ต่างจังหวัด: บอกกำหนดล่วงหน้า และช่องใบสั่งซื้อบังคับหรือไม่ */\nfunction areaChanged(f) {\n  var a = areaOf(f), st = B.settings;\n  $('#areaHint').innerHTML = a === 'up'\n    ? '<b>ต่างจังหวัด:</b> ต้องขออนุมัติล่วงหน้าอย่างน้อย <b>' + st.upcountryLeadWorkDays + ' วันทำการ</b> (จ.–ส.) · ต้องแนบใบสั่งซื้อ · อนุมัติ ผจก.เขต → คลัง → CEO → COO'\n    : '<b>กรุงเทพฯ และปริมณฑล:</b> งานปกติจองรอบพรุ่งนี้ได้ถ้าขอก่อน ' + st.cutoffHour + ':00 น. · งานที่ต้องอนุมัติ (ยอดต่ำกว่า ' + money(st.minValue) + ' บาทนอกเส้นทาง) ต้องขอล่วงหน้า <b>' + st.approvalLeadWorkDays + ' วันทำการ</b>';\n  $('#poReq').textContent = a === 'up' ? '(ต่างจังหวัด — ต้องแนบอย่างน้อย 1 ไฟล์)' : '(ถ้ามี)';\n  $('#poReq').className = a === 'up' ? 'req' : 'opt';\n  if (Q) { pick = null; renderQuote(f); }\n}\n\nfunction doQuote(f) {\n  if (!areaOf(f)) { $('.seg').scrollIntoView({ block: 'center' }); return toast('กรุณาเลือกว่าส่งลูกค้า กรุงเทพฯ และปริมณฑล หรือ ต่างจังหวัด', true); }\n  var btn = $('#qbtn'); btn.disabled = true; btn.textContent = 'กำลังคำนวณ…';\n  call('quote', { branchCode: me.branchCode, mapsUrl: f.elements.mapsUrl.value, address: f.elements.address.value, value: f.elements.value.value })\n    .then(function (q) { Q = q; pick = null; renderQuote(f); })\n    .catch(fail)\n    .then(function () { btn.disabled = false; btn.textContent = 'คำนวณใหม่'; });\n}\n\nfunction renderQuote(f) {\n  var value = Number(f.elements.value.value) || 0;\n  var low = f.elements.lowMargin.checked;\n  var fee = policyFee_(Q.distanceKm, value, B.settings.tiers, B.settings.ratePer10Km);\n  var free = freeKm_(value, B.settings.tiers);\n  var out = '';\n  var area = areaOf(f);\n  if ((area === 'metro') !== Q.metro) {\n    var want = Q.metro ? 'metro' : 'up';\n    $('#qres').innerHTML = '<div class=\"note bad\">ลูกค้าอยู่ <b>' + esc(Q.province || 'จังหวัดที่ตรวจไม่ได้') + '</b> ซึ่งเป็น<b>' + (Q.metro ? 'กรุงเทพฯ และปริมณฑล' : 'ต่างจังหวัด') +\n      '</b> แต่เลือกไว้เป็น' + (area === 'metro' ? 'กรุงเทพฯ และปริมณฑล' : 'ต่างจังหวัด') + ' · ถ้าที่อยู่ถูกต้อง กดเปลี่ยนด้านล่าง ถ้าไม่ถูก ให้แก้ลิงก์แผนที่แล้วตรวจใหม่</div>' +\n      (Q.formatted ? '<p class=\"small muted\">ตำแหน่งที่พบ: ' + esc(Q.formatted) + ' · <a target=\"_blank\" href=\"https://www.google.com/maps?q=' + Q.lat + ',' + Q.lng + '\">ดูบนแผนที่</a></p>' : '') +\n      '<button type=\"button\" class=\"btn block\" id=\"fixArea\">เปลี่ยนเป็น ' + (Q.metro ? 'กรุงเทพฯ และปริมณฑล' : 'ต่างจังหวัด') + '</button>';\n    $('#fixArea').onclick = function () { f.querySelector('input[name=area][value=' + want + ']').checked = true; areaChanged(f); };\n    return;\n  }\n  if (!Q.metro) return renderUpcountry(f, value, low);\n  out += '<div class=\"note ' + (low ? 'info' : fee ? 'warn' : 'ok') + '\"><b>' + Q.distanceKm + ' กม.</b> จากสาขา · ' + esc(Q.province) +\n    (low ? '<br>สินค้ากลุ่มกระดาษ/Low Margin — คลังพิจารณาค่าส่ง'\n      : '<br>ยอด ' + money(value) + ' บาท ส่งฟรี ' + free + ' กม. · <b>ค่าส่งตามนโยบาย ' + money(fee) + ' บาท</b>') + '</div>';\n  if (Q.formatted) out += '<p class=\"small muted\">ตำแหน่งที่พบ: ' + esc(Q.formatted) + ' · <a target=\"_blank\" href=\"https://www.google.com/maps?q=' + Q.lat + ',' + Q.lng + '\">ดูบนแผนที่</a></p>';\n\n  out += '<h3>เลือกวันส่ง</h3>';\n  if (!Q.rounds.length) out += '<div class=\"note warn\">ช่วง 2 สัปดาห์นี้ไม่มีรอบรถผ่านสาขา ติ๊ก \"นอกรอบ/ด่วน\" แล้วให้คลังจัดรถให้</div>';\n  out += '<div class=\"rounds\">' + Q.rounds.map(function (r, i) {\n    var appr = value < B.settings.minValue && !r.onRoute;\n    var soon = appr && r.date < Q.approvalEarliest;   // งานต้องอนุมัติ ต้องขอล่วงหน้าตามวันทำการ\n    var on = pick && pick.date === r.date && pick.plate === r.plate && !soon;\n    return '<button type=\"button\" class=\"round' + (on ? ' on' : '') + '\" data-i=\"' + i + '\"' + (r.left <= 0 || soon ? ' disabled' : '') + '>' +\n      '<b>' + esc(r.label) + '</b><small>' + (r.left <= 0 ? 'เต็มแล้ว' : soon ? 'ต้องขอล่วงหน้า ' + Q.approvalLeadWorkDays + ' วันทำการ' : 'เหลือ ' + r.left + ' จุด') + '</small>' +\n      (appr ? '<br><span class=\"badge warn\">ต้องอนุมัติ</span>' : r.onRoute ? '<br><span class=\"badge ok\">อยู่บนเส้นทาง</span>' : '') + '</button>';\n  }).join('') + '</div>';\n  out += '<label class=\"check\"><input type=\"checkbox\" id=\"urgent\"' + (pick && pick.urgent ? ' checked' : '') + '> นอกรอบ / ด่วน (คลังจัดรถเอง)</label>' +\n    '<div id=\"udate\"' + (pick && pick.urgent ? '' : ' hidden') + '><label>วันที่ต้องการส่ง' + (value < B.settings.minValue ? ' <span class=\"opt\">(ยอดต่ำ ต้องอนุมัติ — ขอล่วงหน้า ' + Q.approvalLeadWorkDays + ' วันทำการ)</span>' : '') + '</label><input type=\"date\" id=\"ud\" min=\"' + (value < B.settings.minValue ? Q.approvalEarliest : Q.urgentEarliest) + '\" value=\"' + (pick && pick.urgent ? pick.date : '') + '\"></div>';\n  var chosen = pick && !pick.urgent ? Q.rounds.filter(function (r) { return r.date === pick.date && r.plate === pick.plate; })[0] : null;\n  var needAppr = pick && value < B.settings.minValue && !(chosen && chosen.onRoute);\n  if (needAppr) out += '<div class=\"note warn\">ยอดต่ำกว่า ' + money(B.settings.minValue) + ' บาทและอยู่นอกเส้นทาง — ต้องได้รับอนุมัติจาก ผจก.เขต → CEO และ คลัง → COO ก่อนส่ง</div>';\n\n  out += '<h3>รายละเอียดเพิ่มเติม</h3>' +\n    '<div class=\"row\"><div><label>ค่าส่งที่เก็บลูกค้า (บาท)</label><input type=\"number\" name=\"feeCharged\" inputmode=\"numeric\" value=\"' + (low ? '' : fee) + '\"></div>' +\n    '<div><label>เลขที่ TR <span class=\"opt\">(ถ้ามี)</span></label><input type=\"text\" name=\"trNo\"></div></div>' +\n    '<div id=\"feeWhy\" hidden><label>เหตุผลที่เก็บค่าส่งต่ำกว่านโยบาย</label><input type=\"text\" name=\"feeReason\"></div>' +\n    '<div class=\"row\"><div><label>เบอร์ผู้รับ <span class=\"opt\">(ถ้ามี)</span></label><input type=\"tel\" name=\"phone\"></div>' +\n    '<div><label>เวลาสะดวกรับ <span class=\"opt\">(ถ้ามี)</span></label><input type=\"text\" name=\"timeWindow\" placeholder=\"เช่น 9:00–12:00\"></div></div>' +\n    '<label>หมายเหตุ <span class=\"opt\">(ถ้ามี)</span></label><textarea name=\"note\"></textarea>' +\n    '<button type=\"button\" class=\"btn block\" id=\"send\">ส่งคำขอ</button>';\n  $('#qres').innerHTML = out;\n\n  $('#qres').querySelectorAll('.round').forEach(function (el) {\n    el.onclick = function () { var r = Q.rounds[+el.dataset.i]; pick = { date: r.date, plate: r.plate }; renderQuote(f); };\n  });\n  $('#urgent').onchange = function () {\n    pick = this.checked ? { urgent: true, date: '' } : null; renderQuote(f);\n  };\n  if ($('#ud')) $('#ud').onchange = function () { pick = { urgent: true, date: this.value }; };\n  var fc = f.elements.feeCharged;\n  var whyCheck = function () { $('#feeWhy').hidden = low || fc.value === '' || Number(fc.value) >= fee; };\n  fc.oninput = whyCheck; whyCheck();\n  $('#send').onclick = function () { submit(f, fee, low); };\n}\n\n/** ปลายทางต่างจังหวัด: ฟอร์มตามใบแจ้งขอรอบรถส่งสินค้าลูกค้าต่างจังหวัด */\nfunction renderUpcountry(f, value, low) {\n  var fee = policyFee_(Q.distanceKm, value, B.settings.tiers, Q.ratePer10Km);\n  var free = freeKm_(value, B.settings.tiers);\n  var keep = function (n) { var el = f.elements[n]; return el ? esc(el.value) : ''; };\n  var collect = !f.elements.collectFee || f.elements.collectFee.value !== 'no';\n  $('#qres').innerHTML = '<div class=\"note warn\"><b>ปลายทางต่างจังหวัด · ' + esc(Q.province) + ' · ' + Q.distanceKm + ' กม.</b> จากสาขา<br>' +\n    'ต้องขออนุมัติตามลำดับ: ผจก.เขต → คลังใส่ค่าขนส่งและยืนยันวันส่ง → CEO → COO</div>' +\n    '<div class=\"note ' + (low ? 'info' : fee ? 'warn' : 'ok') + '\">' + (low ? 'สินค้ากลุ่มกระดาษ/Low Margin — พิจารณาค่าส่งเป็นรายกรณี'\n      : 'ยอด ' + money(value) + ' บาท ส่งฟรี ' + free + ' กม. · <b>ค่าส่งตามนโยบาย (ต่างจังหวัด ' + Q.ratePer10Km + ' บาท/10 กม.) ' + money(fee) + ' บาท</b>') + '</div>' +\n    (Q.formatted ? '<p class=\"small muted\">ตำแหน่งที่พบ: ' + esc(Q.formatted) + ' · <a target=\"_blank\" href=\"https://www.google.com/maps?q=' + Q.lat + ',' + Q.lng + '\">ดูบนแผนที่</a></p>' : '') +\n    '<h3>ข้อมูลจากฝ่ายขาย</h3>' + bmField(f) +\n    '<div class=\"row\"><div><label>ประเภทสินค้า</label><input type=\"text\" name=\"productType\" value=\"' + keep('productType') + '\" placeholder=\"เช่น เฟรมผ้าใบ\"></div>' +\n    '<div><label>เบอร์ติดต่อลูกค้า</label><input type=\"tel\" name=\"phone\" value=\"' + keep('phone') + '\"></div></div>' +\n    '<div class=\"row\"><div><label>กำไรขั้นต้น (บาท)</label><input type=\"number\" name=\"grossProfit\" inputmode=\"decimal\" value=\"' + keep('grossProfit') + '\"></div>' +\n    '<div><label>เลขที่ใบสั่งซื้อ <span class=\"opt\">(ถ้ามี)</span></label><input type=\"text\" name=\"poNo\" value=\"' + keep('poNo') + '\"></div></div>' +\n    '<div id=\"gpPct\" class=\"small muted\"></div>' +\n    '<label>เก็บค่าส่งลูกค้า</label><div class=\"seg\">' +\n      '<label><input type=\"radio\" name=\"collectFee\" value=\"yes\"' + (collect ? ' checked' : '') + '><span>เก็บ</span></label>' +\n      '<label><input type=\"radio\" name=\"collectFee\" value=\"no\"' + (collect ? '' : ' checked') + '><span>ไม่เก็บ</span></label></div>' +\n    '<div class=\"row\" id=\"feeRow\"' + (collect ? '' : ' hidden') + '><div><label>ค่าส่งที่เก็บ (บาท)</label><input type=\"number\" name=\"feeCharged\" inputmode=\"numeric\" value=\"' + (low ? '' : fee) + '\"></div>' +\n    '<div><label>เลขที่ TR <span class=\"opt\">(ถ้ามี)</span></label><input type=\"text\" name=\"trNo\" value=\"' + keep('trNo') + '\"></div></div>' +\n    '<div id=\"feeWhy\" hidden><label>เหตุผลที่เก็บค่าส่งต่ำกว่านโยบาย</label><input type=\"text\" name=\"feeReason\" value=\"' + keep('feeReason') + '\"></div>' +\n    '<label>วันที่ลูกค้าต้องการ <span class=\"opt\">(ขออนุมัติล่วงหน้าอย่างน้อย ' + Q.upcountryLeadWorkDays + ' วันทำการ · เร็วสุด ' + esc(thaiDate_(Q.upcountryEarliest)) + ' · คลังจะยืนยันวันส่งจริง)</span></label><input type=\"date\" id=\"ud\" min=\"' + Q.upcountryEarliest + '\" value=\"' + (pick && pick.date ? pick.date : '') + '\">' +\n    '<label>หมายเหตุ <span class=\"opt\">(ถ้ามี)</span></label><textarea name=\"note\">' + keep('note') + '</textarea>' +\n    '<button type=\"button\" class=\"btn block\" id=\"send\">ส่งขออนุมัติ</button>';\n  var gp = f.elements.grossProfit;\n  var pct = function () { var g = Number(gp.value); $('#gpPct').textContent = value > 0 && gp.value !== '' ? 'กำไรขั้นต้น ' + (Math.round(g / value * 1000) / 10) + '% ของยอดขาย' : ''; };\n  gp.oninput = pct; pct();\n  var fc = f.elements.feeCharged;\n  var whyCheck = function () {\n    var yes = (f.querySelector('input[name=collectFee]:checked') || {}).value !== 'no';\n    $('#feeRow').hidden = !yes;\n    $('#feeWhy').hidden = low || (yes && (fc.value === '' || Number(fc.value) >= fee));\n  };\n  f.querySelectorAll('input[name=collectFee]').forEach(function (r) { r.onchange = whyCheck; });\n  fc.oninput = whyCheck; whyCheck();\n  $('#ud').onchange = function () { pick = { upcountry: true, date: this.value }; };\n  $('#send').onclick = function () { submitUpcountry(f, fee, low); };\n  $('#addBm').onclick = function () {\n    ask('เพิ่มชื่อผู้จัดการสาขา', [{ name: 'name', label: 'ชื่อ-นามสกุล ผู้จัดการสาขา', required: true },\n      { type: 'note', value: 'สาขา: ' + branchName(me.branchCode) + ' · คลังจะตรวจชื่อใหม่อีกครั้ง' }], 'เพิ่มชื่อ').then(function (v) {\n      if (!v) return;\n      call('addMyName', v.name, me.branchCode, 'ผจก.สาขา').then(function (p) {\n        B.sales.push(p);\n        renderQuote(f);\n        f.elements.branchManager.value = p.name;\n      }).catch(fail);\n    });\n  };\n}\n\n/** ผู้ขอรอบรถต่างจังหวัด = ผู้จัดการสาขา (พนักงานขายกรอกแทนได้) */\nfunction bmField(f) {\n  var mgrs = B.sales.filter(function (x) { return x.manager && x.branchCode === me.branchCode; });\n  var cur = f.elements.branchManager ? f.elements.branchManager.value : (mgrs.some(function (x) { return x.name === me.name; }) ? me.name : '');\n  return '<label>ผู้ขอรอบรถ (ผู้จัดการสาขา)</label><select name=\"branchManager\"><option value=\"\">— เลือกผู้จัดการสาขา —</option>' +\n    mgrs.map(function (x) { return '<option value=\"' + esc(x.name) + '\"' + (x.name === cur ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') +\n    '</select><button type=\"button\" class=\"link\" id=\"addBm\">+ ไม่มีชื่อผู้จัดการสาขาในรายการ</button>' +\n    (!mgrs.some(function (x) { return x.name === me.name; }) ? '<div class=\"small muted\">กรอกโดย ' + esc(me.name) + ' · ชื่อผู้จัดการสาขาจะขึ้นในช่อง \"ขอรอบรถโดย\" บนใบแจ้ง</div>' : '');\n}\n\nfunction submitUpcountry(f, fee, low) {\n  var e = f.elements;\n  var stock = (f.querySelector('input[name=stock]:checked') || {}).value;\n  var collect = (f.querySelector('input[name=collectFee]:checked') || {}).value !== 'no';\n  if (!e.customer.value.trim()) return toast('กรุณาใส่ชื่อลูกค้า', true);\n  if (!(Number(e.value.value) > 0)) return toast('กรุณาใส่มูลค่าสินค้า', true);\n  if (!e.qty.value.trim()) return toast('กรุณาใส่จำนวนสินค้า', true);\n  if (!stock) return toast('กรุณาเลือกว่าของอยู่ที่ไหน', true);\n  if (!e.branchManager.value) return toast('กรุณาเลือกผู้จัดการสาขาที่เป็นผู้ขอรอบรถ', true);\n  if (!e.productType.value.trim()) return toast('กรุณาใส่ประเภทสินค้า', true);\n  if (!e.phone.value.trim()) return toast('กรุณาใส่เบอร์ติดต่อลูกค้า', true);\n  if (e.grossProfit.value === '') return toast('กรุณาใส่กำไรขั้นต้น', true);\n  if (!PO.length) { $('#poBox').scrollIntoView({ block: 'center' }); return toast('ส่งต่างจังหวัดต้องแนบใบสั่งซื้ออย่างน้อย 1 ไฟล์ (รูปหรือ PDF)', true); }\n  if (!pick || !pick.date) return toast('กรุณาเลือกวันที่ลูกค้าต้องการ', true);\n  var fc = collect ? e.feeCharged.value : '0';\n  if (!low && Number(fc || fee) < fee && !e.feeReason.value.trim()) return toast('กรุณาใส่เหตุผลที่เก็บค่าส่งต่ำกว่านโยบาย', true);\n  var btn = $('#send'); btn.disabled = true; btn.textContent = 'กำลังส่ง…';\n  call('submitRequest', {\n    requester: me.name, branchCode: me.branchCode, area: areaOf(f), customer: e.customer.value, mapsUrl: e.mapsUrl.value,\n    address: e.address.value, value: e.value.value, qty: e.qty.value, stock: stock, lowMargin: e.lowMargin.checked,\n    date: pick.date, branchManager: e.branchManager.value, productType: e.productType.value, phone: e.phone.value, grossProfit: e.grossProfit.value,\n    poNo: e.poNo.value, collectFee: collect, feeCharged: fc, feeReason: e.feeReason.value, trNo: e.trNo.value, note: e.note.value,\n    poFiles: poPayload(PO)\n  }).then(function (r) {\n    Q = null; pick = null; PO = [];\n    $('#pane').innerHTML = '<div class=\"card center\"><h2>ส่งขออนุมัติแล้ว</h2><p>เลขคิว <b>' + esc(r.id) + '</b></p>' +\n      '<p>วันที่ลูกค้าต้องการ ' + esc(r.dateLabel) + '</p><p><span class=\"badge warn\">' + esc(r.status) + '</span></p>' +\n      '<p class=\"small muted\">ติดตามที่แท็บ \"คำขอของสาขา\" · คลังจะใส่ค่าขนส่งและยืนยันวันส่งจริงหลัง ผจก.เขต อนุมัติ แล้วส่งต่อ CEO และ COO</p>' +\n      '<button class=\"btn block\" id=\"again\">ขอคิวรายการใหม่</button><button class=\"btn ghost block\" id=\"tomine\">ดูคำขอของสาขา</button></div>';\n    $('#again').onclick = function () { render(); };\n    $('#tomine').onclick = function () { view = 'mine'; render(); };\n  }).catch(function (err) { fail(err); btn.disabled = false; btn.textContent = 'ส่งขออนุมัติ'; });\n}\n\nfunction submit(f, fee, low) {\n  var e = f.elements;\n  var stock = (f.querySelector('input[name=stock]:checked') || {}).value;\n  if (!e.customer.value.trim()) return toast('กรุณาใส่ชื่อลูกค้า', true);\n  if (!(Number(e.value.value) > 0)) return toast('กรุณาใส่มูลค่าสินค้า', true);\n  if (!e.qty.value.trim()) return toast('กรุณาใส่จำนวนสินค้า', true);\n  if (!stock) return toast('กรุณาเลือกว่าของอยู่ที่ไหน', true);\n  if (!pick || !pick.date) return toast('กรุณาเลือกวันส่ง', true);\n  if (!low && e.feeCharged.value !== '' && Number(e.feeCharged.value) < fee && !e.feeReason.value.trim()) return toast('กรุณาใส่เหตุผลที่เก็บค่าส่งต่ำกว่านโยบาย', true);\n  var btn = $('#send'); btn.disabled = true; btn.textContent = 'กำลังส่ง…';\n  call('submitRequest', {\n    requester: me.name, branchCode: me.branchCode, area: areaOf(f), customer: e.customer.value, mapsUrl: e.mapsUrl.value,\n    address: e.address.value, value: e.value.value, qty: e.qty.value, stock: stock, lowMargin: e.lowMargin.checked,\n    urgent: !!pick.urgent, date: pick.date, plate: pick.plate || '', feeCharged: e.feeCharged.value,\n    feeReason: e.feeReason.value, trNo: e.trNo.value, phone: e.phone.value, timeWindow: e.timeWindow.value, note: e.note.value,\n    poFiles: poPayload(PO)\n  }).then(function (r) {\n    Q = null; pick = null; PO = [];\n    $('#pane').innerHTML = '<div class=\"card center\"><h2>ส่งคำขอแล้ว</h2><p>เลขคิว <b>' + esc(r.id) + '</b></p>' +\n      '<p>วันส่ง ' + esc(r.dateLabel) + '</p><p><span class=\"badge ' + (r.status === STATUS.APPROVAL ? 'warn' : 'info') + '\">' + esc(r.status) + '</span></p>' +\n      '<button class=\"btn block\" id=\"again\">ขอคิวรายการใหม่</button><button class=\"btn ghost block\" id=\"tomine\">ดูคำขอของสาขา</button></div>';\n    $('#again').onclick = function () { render(); };\n    $('#tomine').onclick = function () { view = 'mine'; render(); };\n  }).catch(function (err) { fail(err); btn.disabled = false; btn.textContent = 'ส่งคำขอ'; });\n}\n\n// ───────────────────────────── คำขอของสาขา ─────────────────────────────\n\nvar BADGE = {};\nBADGE[STATUS.PENDING] = 'info'; BADGE[STATUS.APPROVAL] = 'warn'; BADGE[STATUS.CONFIRMED] = 'ok';\nBADGE[STATUS.DELIVERED] = 'ok'; BADGE[STATUS.FAILED] = 'bad'; BADGE[STATUS.CANCELLED] = ''; BADGE[STATUS.REJECTED] = 'bad';\n\nfunction statusBadge(s) { return '<span class=\"badge ' + (BADGE[s] || '') + '\">' + esc(s) + '</span>'; }\n\nfunction apprLine(a, up) {\n  var mark = function (v) { return !v ? '…' : v.indexOf('ไม่อนุมัติ') === 0 ? '✗' : '✓'; };\n  return up ? 'ผจก.เขต ' + mark(a.zone) + ' → คลังค่าขนส่ง ' + mark(a.wh) + ' → CEO ' + mark(a.ceo) + ' → COO ' + mark(a.coo)\n    : 'ขาย: ผจก.เขต ' + mark(a.zone) + ' → CEO ' + mark(a.ceo) + ' · คลัง ' + mark(a.wh) + ' → COO ' + mark(a.coo);\n}\n\nfunction renderMine() {\n  var pane = $('#pane'); pane.innerHTML = '<p class=\"muted center\">กำลังโหลด…</p>';\n  call('branchRequests', me.branchCode).then(function (list) {\n    if (!list.length) { pane.innerHTML = '<p class=\"muted center\">ยังไม่มีคำขอใน 30 วันที่ผ่านมา</p>'; return; }\n    pane.innerHTML = list.map(function (r) {\n      var canCancel = r.status === STATUS.PENDING || r.status === STATUS.APPROVAL;\n      var canAttach = [STATUS.PENDING, STATUS.APPROVAL, STATUS.CONFIRMED].indexOf(r.status) !== -1 && r.poCount < PO_MAX;\n      return '<div class=\"card\"><div class=\"item\"><div><div class=\"title\">' + esc(r.customer) + '</div>' +\n        '<div class=\"small muted\">' + esc(r.id) + ' · ' + esc(r.requester) + ' · ' + esc(r.qty) + '</div>' +\n        (r.upcountry ? '<span class=\"badge warn\">ต่างจังหวัด · ' + esc(r.province) + '</span>' : '') + '</div>' + statusBadge(r.status) + '</div>' +\n        '<div class=\"small\">' + (r.upcountry && !r.plate ? 'วันที่ขอ' : 'วันส่ง') + ' <b>' + esc(r.dateLabel) + '</b>' + (r.plate ? ' · ' + esc(r.plate) : r.urgent ? ' · นอกรอบ/ด่วน' : '') +\n        (Number(r.feeCharged) ? ' · ค่าส่ง ' + money(r.feeCharged) + ' บาท' : '') + '</div>' +\n        (r.needsApproval ? '<div class=\"small muted\">' + apprLine(r.approvals, r.upcountry) + '</div>' : '') +\n        (r.reason ? '<div class=\"note warn small\">' + esc(r.reason) + '</div>' : '') +\n        '<div class=\"actions\">' + (canCancel ? '<button class=\"btn bad small\" data-c=\"' + esc(r.id) + '\">ยกเลิกคำขอ</button>' : '') +\n        (r.formUrl ? '<a class=\"btn small ghost\" target=\"_blank\" href=\"' + esc(r.formUrl) + '\">ใบแจ้ง (พิมพ์)</a>' : '') +\n        (r.poUrl ? '<a class=\"btn small ghost\" target=\"_blank\" href=\"' + esc(r.poUrl) + '\">ใบสั่งซื้อ (' + r.poCount + ' ไฟล์)</a>' : '') +\n        (canAttach ? '<button class=\"btn small ghost\" data-po=\"' + esc(r.id) + '\" data-n=\"' + r.poCount + '\">＋ แนบใบสั่งซื้อ</button>' : '') + '</div></div>';\n    }).join('');\n    pane.querySelectorAll('[data-c]').forEach(function (b) {\n      b.onclick = function () {\n        if (!confirm('ยกเลิกคำขอ ' + b.dataset.c + ' ?')) return;\n        call('cancelMine', b.dataset.c, me.name).then(function () { toast('ยกเลิกแล้ว'); renderMine(); }).catch(fail);\n      };\n    });\n    pane.querySelectorAll('[data-po]').forEach(function (b) { b.onclick = function () { attachForm(b.dataset.po, +b.dataset.n); }; });\n  }).catch(fail);\n}\n\n// ───────────────────────────── คลัง / ผู้อนุมัติ ─────────────────────────────\n\nfunction staffLogin() {\n  ask('เข้าสู่ระบบสำหรับคลัง / ผู้อนุมัติ', [\n    { name: 'role', label: 'กลุ่ม', type: 'select', required: true,\n      options: [{ value: 'wh', label: 'คลังสินค้า' }, { value: 'zone', label: 'ผู้จัดการเขต' }, { value: 'ceo', label: 'CEO' }, { value: 'coo', label: 'COO' }] },\n    { name: 'pin', label: 'PIN', type: 'password', required: true }\n  ], 'ถัดไป').then(function (v) {\n    if (!v) return;\n    call('staffCheck', v.role, v.pin).then(function () {\n      var names = v.role === 'wh' ? B.warehouse : v.role === 'zone' ? B.zoneManagers : [v.role === 'ceo' ? 'CEO' : 'COO'];\n      if (names.length === 1) return finish(names[0]);\n      ask('คุณคือใคร', [{ name: 'actor', label: 'ชื่อ', type: 'select', options: names, required: true }], 'เข้าใช้งาน')\n        .then(function (a) { if (a) finish(a.actor); });\n      function finish(actor) {\n        staff = { role: v.role, pin: v.pin, actor: actor }; save('tq_staff', staff);\n        view = v.role === 'wh' ? 'board' : 'approve'; render();\n      }\n    }).catch(fail);\n  });\n}\n\nfunction renderStaff() {\n  var tabs = staff.role === 'wh'\n    ? [['board', 'งานส่ง'], ['approve', 'รออนุมัติ'], ['sheets', 'ใบงาน/ปิดรอบ'], ['names', 'รายชื่อใหม่']]\n    : [['approve', 'รออนุมัติ']];\n  if (!tabs.some(function (t) { return t[0] === view; })) view = tabs[0][0];\n  $('#app').innerHTML = '<div class=\"tabs\">' + tabs.map(function (t) {\n    return '<button data-v=\"' + t[0] + '\" class=\"' + (t[0] === view ? 'on' : '') + '\">' + t[1] + '</button>'; }).join('') + '</div><div id=\"pane\"></div>';\n  $('#app').querySelectorAll('.tabs button').forEach(function (b) { b.onclick = function () { view = b.dataset.v; render(); }; });\n  ({ board: renderBoard, approve: renderApprove, sheets: renderSheets, names: renderNames })[view]();\n}\n\n/** แนบใบสั่งซื้อเพิ่มให้คำขอที่ส่งไปแล้ว */\nfunction attachForm(id, have) {\n  var list = [], m = $('#modal');\n  m.innerHTML = '<div class=\"sheet\"><h2>แนบใบสั่งซื้อ · ' + esc(id) + '</h2><div id=\"poAdd\"></div>' +\n    '<div class=\"row\" style=\"margin-top:16px\"><button type=\"button\" class=\"btn ghost\" data-x>ปิด</button><button type=\"button\" class=\"btn\" id=\"poSave\">บันทึกไฟล์</button></div></div>';\n  m.hidden = false;\n  poPicker($('#poAdd'), list, PO_MAX - have);\n  $('[data-x]', m).onclick = function () { m.hidden = true; };\n  $('#poSave').onclick = function () {\n    if (!list.length) return toast('กรุณาถ่ายรูปหรือเลือกไฟล์ใบสั่งซื้อ', true);\n    var btn = this; btn.disabled = true; btn.textContent = 'กำลังบันทึก…';\n    call('attachPo', id, me.name, me.branchCode, poPayload(list)).then(function () {\n      m.hidden = true; toast('แนบไฟล์แล้ว'); renderMine();\n    }).catch(function (e) { fail(e); btn.disabled = false; btn.textContent = 'บันทึกไฟล์'; });\n  };\n}\n\nfunction staffFail(e) {\n  if (/PIN/.test((e && e.message) || '')) { staff = null; save('tq_staff', null); render(); }\n  fail(e);\n}\n\nfunction detailKv(r) {\n  var rows = [['สาขา', r.branchName + ' · ' + r.requester], ['ที่อยู่', r.address], ['ระยะ', (r.distanceKm || '-') + ' กม. · ' + (r.province || '')],\n    ['สินค้า', r.qty + ' · ' + money(r.value) + ' บาท · ของอยู่ที่' + r.stock],\n    ['ค่าส่ง', r.lowMargin ? 'กระดาษ/Low Margin · เก็บ ' + money(r.feeCharged) : 'นโยบาย ' + money(r.feePolicy) + ' · เก็บ ' + money(r.feeCharged) + (r.feeReason ? ' (' + r.feeReason + ')' : '')],\n    ['TR', r.trNo], ['ผู้รับ', [r.phone, r.timeWindow].filter(String).join(' · ')], ['หมายเหตุ', r.note]];\n  if (r.upcountry) {\n    if (r.branchManager) rows.splice(1, 0, ['ผู้ขอรอบรถ', r.branchManager + ' (ผจก.สาขา) · กรอกโดย ' + r.requester]);\n    rows.splice(1, 0, ['ต่างจังหวัด', (r.productType || '') + (r.poNo ? ' · PO ' + r.poNo : '') + ' · กำไรขั้นต้น ' + money(r.grossProfit) +\n      ' บาท' + (r.grossProfitPct !== '' && r.grossProfitPct != null ? ' (' + r.grossProfitPct + '%)' : '') + (r.collectFee ? '' : ' · ไม่เก็บค่าส่ง')]);\n    if (r.cost) rows.push(['ประมาณการ', 'รวม ' + money(r.cost.total) + ' บาท (น้ำมัน ' + money(r.cost.fuel) + ' · ค่าเสื่อม ' + money(r.cost.depreciation) +\n      ' · ค่าแรง ' + money(r.cost.labor) + ' · ทางด่วน ' + money(r.cost.toll) + ' · ที่พัก ' + money(r.cost.lodging) + ' · อื่นๆ ' + money(r.cost.other) + ')' +\n      ' · ไป-กลับ ' + r.cost.roundTripKm + ' กม. ' + r.cost.days + ' วัน ' + r.cost.staff + ' คน' +\n      (r.cost.privateCost ? ' · ขนส่งเอกชน ' + money(r.cost.privateCost) + ' บาท' + (r.cost.privateCost < r.cost.total ? ' (ถูกกว่า)' : '') : '') +\n      (r.cost.branchGoods ? ' · มีสินค้ารวมส่งสาขา ' + money(r.cost.branchGoodsValue) + ' บาท' : '') +\n      (r.cost.scheduleImpact ? ' · กระทบตารางประจำวัน: ' + (r.cost.impactNote || '-') : ' · ไม่กระทบตารางประจำวัน') +\n      (r.cost.departTime ? ' · ออกจากคลัง ' + r.cost.departTime : '')]);\n  }\n  return '<dl class=\"kv\">' + rows.filter(function (x) { return x[1]; }).map(function (x) {\n    return '<dt>' + x[0] + '</dt><dd>' + esc(x[1]) + '</dd>'; }).join('') +\n    (r.mapsUrl ? '<dt>แผนที่</dt><dd><a target=\"_blank\" href=\"' + esc(r.mapsUrl) + '\">เปิดลิงก์</a></dd>' : '') +\n    '<dt>ใบสั่งซื้อ</dt><dd>' + (r.poUrl ? '<a target=\"_blank\" href=\"' + esc(r.poUrl) + '\">ดู ' + r.poCount + ' ไฟล์</a>' : '<span class=\"muted\">ไม่ได้แนบ</span>') + '</dd></dl>';\n}\n\nvar boardFrom = null;\nfunction renderBoard() {\n  var pane = $('#pane');\n  boardFrom = boardFrom || B.today;\n  pane.innerHTML = '<div class=\"row\"><div><label>ตั้งแต่</label><input type=\"date\" id=\"bf\" value=\"' + boardFrom + '\"></div>' +\n    '<div><label>ถึง</label><input type=\"date\" id=\"bt\" value=\"' + addDays_(boardFrom, 7) + '\"></div></div><div id=\"blist\"><p class=\"muted center\">กำลังโหลด…</p></div>';\n  var reload = function () { boardFrom = $('#bf').value; loadBoard($('#bf').value, $('#bt').value); };\n  $('#bf').onchange = reload; $('#bt').onchange = reload;\n  loadBoard(boardFrom, addDays_(boardFrom, 7));\n}\n\nfunction loadBoard(from, to) {\n  call('whBoard', staff.pin, from, to).then(function (d) {\n    var plates = d.trucks.map(function (t) { return { value: t.plate, label: t.plate + (t.driver ? ' · ' + t.driver : '') }; });\n    var html = '';\n    if (d.reschedule.length) html += '<h3>งานที่ต้องจัดใหม่ (ตารางรอบรถเปลี่ยน) <span class=\"count\">' + d.reschedule.length + '</span></h3>' + d.reschedule.map(cardWh).join('');\n    var late = d.requests.filter(function (r) { return r.date < d.today; });\n    if (late.length) html += '<h3>เลยวันส่งแล้ว ยังไม่ปิด <span class=\"count\">' + late.length + '</span></h3>' + late.map(cardWh).join('');\n    var byDate = {};\n    d.requests.filter(function (r) { return r.date >= d.today; }).forEach(function (r) { (byDate[r.date] = byDate[r.date] || []).push(r); });\n    Object.keys(byDate).sort().forEach(function (date) {\n      var list = byDate[date].sort(function (a, b) { return String(a.plate).localeCompare(String(b.plate)); });\n      var pend = list.filter(function (r) { return r.status === STATUS.PENDING; }).length;\n      html += '<h3>' + esc(thaiDate_(date)) + (pend ? ' <span class=\"count\">' + pend + '</span>' : '') + '</h3>' + list.map(cardWh).join('');\n    });\n    if (d.newStaff.length) html = '<div class=\"note info\">มีชื่อพนักงานใหม่ ' + d.newStaff.length + ' ชื่อ รอตรวจที่แท็บ \"รายชื่อใหม่\"</div>' + html;\n    $('#blist').innerHTML = html || '<p class=\"muted center\">ไม่มีงานในช่วงนี้</p>';\n    bindWh(plates, d);\n  }).catch(staffFail);\n\n  function cardWh(r) {\n    var late = r.date < B.today && (r.status === STATUS.PENDING || r.status === STATUS.CONFIRMED || r.status === STATUS.APPROVAL);\n    var acts = [];\n    if (r.status === STATUS.PENDING) acts.push(['confirm', 'ยืนยัน', '']);\n    if ([STATUS.PENDING, STATUS.CONFIRMED, STATUS.APPROVAL].indexOf(r.status) !== -1) acts.push(['move', 'ย้ายวัน/รถ', 'ghost'], ['cancel', 'ยกเลิก', 'bad']);\n    if (r.status === STATUS.CONFIRMED) acts.push(['fail', 'ส่งไม่สำเร็จ', 'bad']);\n    acts.push(['edit', 'แก้ค่าส่ง/TR', 'ghost']);\n    if (r.upcountry && r.status === STATUS.APPROVAL && !r.approvals.wh) acts.unshift(['cost', r.cost ? 'แก้ค่าขนส่ง (ใบแจ้ง)' : 'กรอกค่าขนส่ง (ใบแจ้ง)', '']);\n    return '<div class=\"card' + (late ? ' late' : '') + '\"><div class=\"item\"><div><div class=\"title\">' + esc(r.customer) + '</div>' +\n      '<div class=\"small muted\">' + esc(r.id) + ' · ' + (r.plate ? esc(r.plate) : r.urgent ? 'นอกรอบ/ด่วน — ยังไม่มีรถ' : 'ยังไม่มีรถ') + ' · ' + esc(r.dateLabel) + '</div></div>' +\n      statusBadge(r.status) + '</div>' +\n      (r.underPolicy ? '<span class=\"badge warn\">เก็บค่าส่งต่ำกว่านโยบาย</span> ' : '') + (r.lowMargin ? '<span class=\"badge info\">กระดาษ/Low Margin</span> ' : '') +\n      (r.needsApproval ? '<div class=\"small muted\">' + apprLine(r.approvals, r.upcountry) + '</div>' : '') +\n      detailKv(r) + (r.reason ? '<div class=\"note warn small\">' + esc(r.reason) + '</div>' : '') +\n      '<div class=\"actions\">' + (r.formUrl ? '<a class=\"btn small ghost\" target=\"_blank\" href=\"' + esc(r.formUrl) + '\">ใบแจ้ง (พิมพ์)</a>' : '') + acts.map(function (a) {\n        return '<button class=\"btn small ' + a[2] + '\" data-a=\"' + a[0] + '\" data-id=\"' + esc(r.id) + '\" data-date=\"' + r.date + '\" data-plate=\"' + esc(r.plate || '') + '\" data-fee=\"' + esc(r.feeCharged) + '\" data-tr=\"' + esc(r.trNo || '') + '\">' + a[1] + '</button>';\n      }).join('') + '</div></div>';\n  }\n\n  function bindWh(plates, d) {\n    $('#blist').querySelectorAll('[data-a]').forEach(function (b) {\n      b.onclick = function () {\n        var a = b.dataset.a, id = b.dataset.id, ds = b.dataset;\n        if (a === 'cost') return costForm(d.requests.concat(d.reschedule).filter(function (x) { return x.id === id; })[0], d.trucks, 'save');\n        var fields = {\n          confirm: [{ name: 'date', label: 'วันส่ง', type: 'date', value: ds.date, required: true },\n            { name: 'plate', label: 'รถ', type: 'select', options: plates, value: ds.plate, required: true }],\n          move: [{ name: 'date', label: 'วันส่งใหม่', type: 'date', value: ds.date, required: true },\n            { name: 'plate', label: 'รถ', type: 'select', options: [{ value: '', label: '— ยังไม่ระบุ —' }].concat(plates), value: ds.plate },\n            { name: 'reason', label: 'เหตุผล (คนขอจะเห็น)', required: true }],\n          cancel: [{ name: 'reason', label: 'เหตุผลที่ยกเลิก', required: true }],\n          fail: [{ name: 'reason', label: 'เหตุผลที่ส่งไม่สำเร็จ', required: true }],\n          edit: [{ name: 'feeCharged', label: 'ค่าส่งที่เก็บ (บาท)', type: 'number', value: ds.fee },\n            { name: 'trNo', label: 'เลขที่ TR', value: ds.tr }, { name: 'reason', label: 'เหตุผลค่าส่ง' }]\n        }[a];\n        ask(b.textContent + ' · ' + id, fields).then(function (v) {\n          if (!v) return;\n          call('whUpdate', staff.pin, staff.actor, id, a, v).then(function () { toast('บันทึกแล้ว'); renderBoard(); }).catch(staffFail);\n        });\n      };\n    });\n  }\n}\n\nfunction renderApprove() {\n  var pane = $('#pane'); pane.innerHTML = '<p class=\"muted center\">กำลังโหลด…</p>';\n  Promise.all([call('approvals', staff.role, staff.pin, staff.actor), staff.role === 'wh' ? call('whBoard', staff.pin, B.today, B.today) : null])\n    .then(function (res) {\n      var list = res[0], trucks = res[1] ? res[1].trucks : [];\n      if (!list.length) { pane.innerHTML = '<p class=\"muted center\">ไม่มีรายการรออนุมัติ</p>'; return; }\n      pane.innerHTML = '<div class=\"note info\">งานยอดต่ำกว่า ' + money(B.settings.minValue) + ' บาทที่อยู่นอกเส้นทาง: ถ้าอนุมัติไม่ครบภายใน ' + B.settings.cutoffHour +\n        ':00 น. ของวันก่อนส่ง ระบบจะเลื่อนไปรอบถัดไป · งานต่างจังหวัด: อนุมัติตามลำดับ ผจก.เขต → คลังใส่ค่าขนส่ง → CEO → COO</div>' + list.map(function (r) {\n        var soon = r.date <= addDays_(B.today, 1);\n        return '<div class=\"card' + (soon ? ' late' : '') + '\"><div class=\"item\"><div><div class=\"title\">' + esc(r.customer) + '</div>' +\n          '<div class=\"small muted\">' + esc(r.id) + ' · ส่ง ' + esc(r.dateLabel) + ' · ' + esc(r.plate || 'ยังไม่มีรถ') + '</div></div>' + statusBadge(r.status) + '</div>' +\n          '<div class=\"small muted\">' + apprLine(r.approvals, r.upcountry) + '</div>' +\n          (r.verdict ? '<div class=\"note ' + (r.verdictGood ? 'ok' : 'bad') + '\"><b>' + esc(r.verdict) + '</b></div>' : '') + detailKv(r) +\n          (r.upcountry ? '<span class=\"badge warn\">ต่างจังหวัด · ' + esc(r.province) + '</span>' : '') +\n          '<div class=\"actions\"><button class=\"btn small\" data-ok=\"' + esc(r.id) + '\" data-date=\"' + r.date + '\" data-plate=\"' + esc(r.plate || '') + '\">อนุมัติ</button>' +\n          '<button class=\"btn small bad\" data-no=\"' + esc(r.id) + '\">ไม่อนุมัติ</button>' + (r.formUrl ? '<a class=\"btn small ghost\" target=\"_blank\" href=\"' + esc(r.formUrl) + '\">ใบแจ้ง (พิมพ์)</a>' : '') + '</div></div>';\n      }).join('');\n      pane.querySelectorAll('[data-ok]').forEach(function (b) {\n        b.onclick = function () {\n          var item = list.filter(function (x) { return x.id === b.dataset.ok; })[0];\n          if (staff.role === 'wh' && item && item.upcountry) return costForm(item, trucks);\n          var fields = [{ name: 'reason', label: 'หมายเหตุ' }];\n          if (staff.role === 'wh') fields = [{ name: 'date', label: 'วันส่ง', type: 'date', value: b.dataset.date, required: true },\n            { name: 'plate', label: 'รถ', type: 'select', value: b.dataset.plate, required: true,\n              options: trucks.map(function (t) { return { value: t.plate, label: t.plate + (t.driver ? ' · ' + t.driver : '') }; }) }].concat(fields);\n          ask('อนุมัติ ' + b.dataset.ok, fields, 'อนุมัติ').then(function (v) {\n            if (!v) return;\n            call('decide', staff.role, staff.pin, staff.actor, b.dataset.ok, true, v.reason, { date: v.date, plate: v.plate })\n              .then(function () { toast('อนุมัติแล้ว'); renderApprove(); }).catch(staffFail);\n          });\n        };\n      });\n      pane.querySelectorAll('[data-no]').forEach(function (b) {\n        b.onclick = function () {\n          ask('ไม่อนุมัติ ' + b.dataset.no, [{ name: 'reason', label: 'เหตุผล (คนขอจะเห็น)', required: true }], 'ไม่อนุมัติ').then(function (v) {\n            if (!v) return;\n            call('decide', staff.role, staff.pin, staff.actor, b.dataset.no, false, v.reason, null)\n              .then(function () { toast('บันทึกแล้ว'); renderApprove(); }).catch(staffFail);\n          });\n        };\n      });\n    }).catch(staffFail);\n}\n\n/** คลังประเมินค่าใช้จ่ายส่งต่างจังหวัด แล้วอนุมัติฝั่งคลัง (ตามใบแจ้งกระดาษ ส่วน \"ข้อมูลจากคลังสินค้า\") */\n/** ค่าขนส่งตามใบแจ้ง (ส่วนคลังสินค้า) · mode 'save' = บันทึกไว้ก่อน ยังไม่อนุมัติ · อื่นๆ = อนุมัติฝั่งคลัง */\nfunction costForm(r, trucks, mode) {\n  var st = B.settings, m = $('#modal'), c0 = r.cost || {}, save = mode === 'save';\n  var v = function (k, d) { return c0[k] != null && c0[k] !== '' ? c0[k] : d; };\n  var num = function (n, label, v, opt) {\n    return '<div><label>' + label + (opt ? ' <span class=\"opt\">(ถ้ามี)</span>' : '') + '</label><input type=\"number\" inputmode=\"decimal\" name=\"' + n + '\" value=\"' + (v == null ? '' : v) + '\"></div>';\n  };\n  m.innerHTML = '<form class=\"sheet\"><h2>ค่าขนส่งตามใบแจ้ง · ' + esc(r.id) + '</h2>' +\n    (save ? '<p class=\"note info small\">บันทึกไว้ก่อนได้ ยังไม่ถือว่าอนุมัติ · แก้ได้จนกว่าคลังจะกดอนุมัติ (หลัง ผจก.เขต อนุมัติ) จากนั้นส่งต่อ CEO และ COO</p>' : '') +\n    '<p class=\"small muted\">' + esc(r.customer) + ' · ' + esc(r.province) + ' · วันที่ลูกค้าต้องการ ' + esc(r.dateLabel) + '</p>' +\n    '<div class=\"row\"><div><label>วันส่งจริง</label><input type=\"date\" name=\"date\" value=\"' + r.date + '\"></div>' +\n    '<div><label>เวลาออกจากคลัง</label><input type=\"text\" name=\"departTime\" placeholder=\"เช่น 9:00\" value=\"' + esc(v('departTime', '')) + '\"></div></div>' +\n    '<label>รถ</label><select name=\"plate\">' + trucks.map(function (t) { return '<option value=\"' + esc(t.plate) + '\"' + (t.plate === r.plate ? ' selected' : '') + '>' + esc(t.plate + (t.driver ? ' · ' + t.driver : '')) + '</option>'; }).join('') + '</select>' +\n    '<div class=\"row\">' + num('roundTripKm', 'ระยะไป-กลับ (กม.)', v('roundTripKm', r.whRoundTripKm || '')) + num('kmPerLiter', 'อัตราสิ้นเปลือง (กม./ลิตร)', v('kmPerLiter', st.kmPerLiter)) + '</div>' +\n    '<div class=\"row\">' + num('fuelPrice', 'ราคาน้ำมัน (บาท/ลิตร)', v('fuelPrice', st.fuelPrice)) + num('days', 'จำนวนวันไป-กลับ', v('days', 1)) + '</div>' +\n    '<div class=\"row\">' + num('staff', 'จำนวนพนักงาน', v('staff', 2)) + num('labor', 'ค่าแรง/OT/เบี้ยเลี้ยง (บาท)', v('labor', 0)) + '</div>' +\n    '<div class=\"row\">' + num('toll', 'ค่าทางด่วน (บาท)', v('toll', 0)) + num('lodging', 'ค่าที่พัก (บาท)', v('lodging', 0)) + '</div>' +\n    '<div class=\"row\">' + num('other', 'อื่นๆ (บาท)', v('other', 0)) + num('privateCost', 'ถ้าใช้ขนส่งเอกชน (บาท)', v('privateCost', '') || '', true) + '</div>' +\n    '<label class=\"check\"><input type=\"checkbox\" name=\"branchGoods\"' + (c0.branchGoods ? ' checked' : '') + '> มีสินค้ารวมส่งให้สาขาต่างจังหวัด</label>' +\n    '<div id=\"bgv\" hidden>' + num('branchGoodsValue', 'มูลค่าสินค้าที่ส่งสาขา (บาท)', v('branchGoodsValue', '') || '') + '</div>' +\n    '<label class=\"check\"><input type=\"checkbox\" name=\"scheduleImpact\"' + (c0.scheduleImpact ? ' checked' : '') + '> กระทบตารางส่งของประจำวัน</label>' +\n    '<div id=\"imp\" hidden><label>กระทบอย่างไร</label><input type=\"text\" name=\"impactNote\" value=\"' + esc(v('impactNote', '')) + '\"></div>' +\n    '<div class=\"note info\" id=\"sum\"></div>' +\n    (save ? '' : '<label>หมายเหตุ <span class=\"opt\">(ถ้ามี)</span></label><input type=\"text\" name=\"reason\">') +\n    '<div class=\"row\" style=\"margin-top:16px\"><button type=\"button\" class=\"btn ghost\" data-x>ปิด</button><button class=\"btn\">' + (save ? 'บันทึกค่าขนส่ง' : 'อนุมัติฝั่งคลัง · ส่งต่อ CEO') + '</button></div></form>';\n  m.hidden = false;\n  var f = $('form', m), e = f.elements;\n  var read = function () {\n    var c = {};\n    ['roundTripKm', 'kmPerLiter', 'fuelPrice', 'days', 'staff', 'labor', 'toll', 'lodging', 'other', 'privateCost', 'branchGoodsValue']\n      .forEach(function (k) { c[k] = e[k].value; });\n    c.depreciationPerKm = st.depreciationPerKm;\n    c.branchGoods = e.branchGoods.checked; c.scheduleImpact = e.scheduleImpact.checked;\n    c.impactNote = e.impactNote.value; c.departTime = e.departTime.value;\n    return c;\n  };\n  var upd = function () {\n    var x = upcountryCost_(read());\n    $('#bgv').hidden = !e.branchGoods.checked; $('#imp').hidden = !e.scheduleImpact.checked;\n    $('#sum').innerHTML = 'น้ำมัน ' + money(x.fuel) + ' + ค่าเสื่อม ' + money(x.depreciation) + ' (' + st.depreciationPerKm + ' บาท/กม.) + ค่าแรง + ทางด่วน + ที่พัก + อื่นๆ<br><b>รวมประมาณการ ' + money(x.total) + ' บาท</b>' +\n      (x.privateCost ? ' · ขนส่งเอกชน ' + money(x.privateCost) + ' บาท' + (x.cheaperPrivate ? ' <b>(เอกชนถูกกว่า)</b>' : '') : '') +\n      (r.feeCharged ? '<br>ค่าส่งที่เก็บลูกค้า ' + money(r.feeCharged) + ' บาท' : '');\n  };\n  f.oninput = upd; f.onchange = upd; upd();\n  $('[data-x]', m).onclick = function () { m.hidden = true; };\n  f.onsubmit = function (ev) {\n    ev.preventDefault();\n    if (!(Number(e.roundTripKm.value) > 0)) return toast('กรุณาใส่ระยะไป-กลับ', true);\n    if (!e.date.value) return toast('กรุณาเลือกวันส่งจริง', true);\n    if (save) return call('whSaveCost', staff.pin, staff.actor, r.id, { date: e.date.value, plate: e.plate.value, cost: read() })\n      .then(function () { m.hidden = true; toast('บันทึกค่าขนส่งแล้ว (ยังไม่อนุมัติ)'); renderBoard(); }).catch(staffFail);\n    call('decide', 'wh', staff.pin, staff.actor, r.id, true, e.reason.value.trim(), { date: e.date.value, plate: e.plate.value, cost: read() })\n      .then(function () { m.hidden = true; toast('อนุมัติฝั่งคลังแล้ว ส่งต่อ CEO → COO'); renderApprove(); }).catch(staffFail);\n  };\n}\n\nvar sheetDate = null;\nfunction renderSheets() {\n  sheetDate = sheetDate || addDays_(B.today, 1);\n  var pane = $('#pane');\n  pane.innerHTML = '<label>วันที่</label><input type=\"date\" id=\"sd\" value=\"' + sheetDate + '\"><div id=\"slist\"><p class=\"muted center\">กำลังโหลด…</p></div>';\n  $('#sd').onchange = function () { sheetDate = this.value; renderSheets(); };\n  call('dailySheets', staff.pin, sheetDate).then(function (list) {\n    $('#slist').innerHTML = list.length ? list.map(function (s) {\n      return '<div class=\"card\"><div class=\"item\"><div><div class=\"title\">' + esc(s.plate) + '</div><div class=\"small muted\">' + esc(s.driver || '') +\n        ' · ' + s.count + ' จุดส่งลูกค้า' + (s.pending ? ' · <b style=\"color:var(--warn)\">ยังไม่ยืนยัน ' + s.pending + '</b>' : '') + '</div></div></div>' +\n        '<div class=\"actions\"><a class=\"btn small\" target=\"_blank\" href=\"' + esc(s.url) + '&print=1\">พิมพ์ใบงาน</a>' +\n        '<a class=\"btn small ghost\" target=\"_blank\" href=\"' + esc(s.url) + '\">เปิดบนมือถือ</a>' +\n        '<button class=\"btn small ghost\" data-close=\"' + esc(s.plate) + '\">ปิดรอบ</button></div></div>';\n    }).join('') : '<p class=\"muted center\">วันนี้ไม่มีรอบรถ</p>';\n    $('#slist').querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { closeRound(b.dataset.close); }; });\n  }).catch(staffFail);\n}\n\nfunction closeRound(plate) {\n  call('whBoard', staff.pin, sheetDate, sheetDate).then(function (d) {\n    var stops = d.requests.filter(function (r) { return r.plate === plate && r.date === sheetDate && r.status === STATUS.CONFIRMED; });\n    if (!stops.length) return toast('ไม่มีงาน \"ยืนยันแล้ว\" ของรถคันนี้ในวันที่เลือก', true);\n    var m = $('#modal');\n    m.innerHTML = '<div class=\"sheet\"><h2>ปิดรอบ ' + esc(plate) + ' · ' + esc(thaiDate_(sheetDate)) + '</h2>' +\n      '<p class=\"small muted\">ทุกจุดจะเป็น \"จัดส่งเรียบร้อย\" ยกเว้นจุดที่ติ๊กว่าส่งไม่สำเร็จ</p>' + stops.map(function (r) {\n        return '<div class=\"card\"><label class=\"check\"><input type=\"checkbox\" data-f=\"' + esc(r.id) + '\"> ส่งไม่สำเร็จ — ' + esc(r.customer) + '</label>' +\n          '<input type=\"text\" data-why=\"' + esc(r.id) + '\" placeholder=\"เหตุผล\" hidden></div>';\n      }).join('') + '<div class=\"row\"><button class=\"btn ghost\" data-x>ปิด</button><button class=\"btn\" data-go>ปิดรอบ</button></div></div>';\n    m.hidden = false;\n    m.querySelectorAll('[data-f]').forEach(function (c) { c.onchange = function () { m.querySelector('[data-why=\"' + c.dataset.f + '\"]').hidden = !c.checked; }; });\n    $('[data-x]', m).onclick = function () { m.hidden = true; };\n    $('[data-go]', m).onclick = function () {\n      var failed = {}, missing = false;\n      m.querySelectorAll('[data-f]:checked').forEach(function (c) {\n        var why = m.querySelector('[data-why=\"' + c.dataset.f + '\"]').value.trim();\n        if (!why) missing = true; failed[c.dataset.f] = why;\n      });\n      if (missing) return toast('กรุณาใส่เหตุผลของจุดที่ส่งไม่สำเร็จ', true);\n      call('whCloseRound', staff.pin, staff.actor, sheetDate, plate, failed).then(function (r) {\n        m.hidden = true; toast('ปิดรอบแล้ว · ส่งเรียบร้อย ' + r.delivered + ' · ไม่สำเร็จ ' + r.failed); renderSheets();\n      }).catch(staffFail);\n    };\n  }).catch(staffFail);\n}\n\nfunction renderNames() {\n  var pane = $('#pane'); pane.innerHTML = '<p class=\"muted center\">กำลังโหลด…</p>';\n  call('whBoard', staff.pin, B.today, B.today).then(function (d) {\n    if (!d.newStaff.length) { pane.innerHTML = '<p class=\"muted center\">ไม่มีชื่อใหม่รอตรวจ</p>'; return; }\n    pane.innerHTML = '<p class=\"small muted\">ชื่อที่พนักงานเพิ่มเอง · ถ้าซ้ำกับชื่อเดิม ให้แก้ชื่อให้ตรงกัน หรือปิดชื่อนี้</p>' + d.newStaff.map(function (p, i) {\n      return '<div class=\"card\"><div class=\"title\">' + esc(p.name) + '</div><div class=\"small muted\">' + esc(p.role === 'ผจก.สาขา' ? 'ผู้จัดการสาขา' : p.role === 'คลัง' ? 'คลัง' : 'พนักงานขาย') + ' · ' + esc(branchName(p.branchCode)) + ' · เพิ่มเมื่อ ' + esc(p.createdAt) + '</div>' +\n        '<div class=\"actions\"><button class=\"btn small\" data-op=\"approve\" data-i=\"' + i + '\">ยืนยันชื่อ</button>' +\n        '<button class=\"btn small ghost\" data-op=\"rename\" data-i=\"' + i + '\">แก้ชื่อ</button>' +\n        '<button class=\"btn small bad\" data-op=\"close\" data-i=\"' + i + '\">ปิดชื่อนี้</button></div></div>';\n    }).join('');\n    pane.querySelectorAll('[data-op]').forEach(function (b) {\n      b.onclick = function () {\n        var p = d.newStaff[+b.dataset.i];\n        var go = function (newName) {\n          call('staffAdmin', staff.pin, staff.actor, b.dataset.op, p.name, p.branchCode, newName || '')\n            .then(function () { toast('บันทึกแล้ว'); renderNames(); }).catch(staffFail);\n        };\n        if (b.dataset.op === 'rename') ask('แก้ชื่อ ' + p.name, [{ name: 'n', label: 'ชื่อที่ถูกต้อง', value: p.name, required: true }]).then(function (v) { if (v) go(v.n); });\n        else go();\n      };\n    });\n  }).catch(staffFail);\n}\n</script>\n",
  Sheet: "<!DOCTYPE html>\n<html lang=\"th\">\n<head>\n  <base target=\"_top\">\n  <meta charset=\"utf-8\">\n  <link href=\"https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap\" rel=\"stylesheet\">\n  <script src=\"https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js\"></script>\n  <style>\n    * { box-sizing: border-box; }\n    body { margin: 0; font-family: 'Sarabun', system-ui, sans-serif; font-size: 14px; color: #111; background: #fff; }\n    .page { max-width: 800px; margin: 0 auto; padding: 16px; }\n    header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; border-bottom: 2px solid #1f7a3a; padding-bottom: 8px; }\n    h1 { font-size: 20px; margin: 0; color: #1f7a3a; }\n    .meta { font-size: 15px; } .meta b { font-size: 17px; }\n    h2 { font-size: 15px; margin: 14px 0 6px; }\n    .branches { padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px; }\n    table { width: 100%; border-collapse: collapse; }\n    th, td { border: 1px solid #999; padding: 5px 6px; vertical-align: top; text-align: left; }\n    th { background: #eef4ef; font-weight: 600; }\n    .qr { width: 74px; } .qr img { width: 70px; height: 70px; display: block; }\n    .sign { width: 110px; } .tick { width: 70px; font-size: 13px; line-height: 1.8; }\n    .muted { color: #555; font-size: 12px; }\n    .warn { color: #9a5b00; font-weight: 600; }\n    .foot { margin-top: 16px; display: flex; justify-content: space-between; gap: 16px; }\n    .foot div { flex: 1; border-top: 1px dotted #555; padding-top: 4px; text-align: center; }\n    .bar { margin: 12px 0; }\n    .bar button { font: inherit; padding: 8px 14px; border-radius: 8px; border: 1px solid #1f7a3a; background: #1f7a3a; color: #fff; }\n    @media print { .bar { display: none; } .page { padding: 0; } tr { page-break-inside: avoid; } }\n    @media (max-width: 600px) { .sign, .tick, th.sign, th.tick { display: none; } }\n  </style>\n</head>\n<body>\n  <div class=\"page\" id=\"p\"></div>\n  <script>\n    var D = <?!= data ?>;\n    var PRINT = <?= print ? 'true' : 'false' ?>;\n    function esc(s) { return String(s == null ? '' : s).replace(/[&<>\"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }\n    function qr(text) {\n      if (typeof qrcode === 'undefined' || !text) return '';\n      var q = qrcode(0, 'M'); q.addData(text); q.make();\n      return q.createImgTag(3, 0);\n    }\n    function mapLink(s) { return s.lat && s.lng ? 'https://www.google.com/maps/search/?api=1&query=' + s.lat + ',' + s.lng : s.mapsUrl; }\n    var total = D.stops.reduce(function (a, s) { return a + (s.fee || 0); }, 0);\n    document.getElementById('p').innerHTML =\n      '<header><div><h1>ใบงานรถส่งสินค้า · สมใจ</h1><div class=\"meta\"><b>' + esc(D.dateLabel) + '</b> · ทะเบียน <b>' + esc(D.plate) + '</b></div>' +\n      '<div class=\"meta\">คนขับ ' + esc(D.driver || '..................') + ' · เด็กรถ ' + esc(D.crew || '..................') + '</div></div>' +\n      '<div class=\"qr\">' + qr(location.href.replace(/&print=1/, '')) + '<div class=\"muted\">เปิดบนมือถือ</div></div></header>' +\n      '<div class=\"bar\"><button onclick=\"print()\">พิมพ์</button></div>' +\n      '<h2>1. สาขาที่แวะ (ตามลำดับ)</h2><div class=\"branches\">' + (D.branches.length ? D.branches.map(esc).join(' → ') : 'ไม่มีในตารางรอบรถ (รอบพิเศษ)') + '</div>' +\n      '<h2>2. จุดส่งลูกค้า (' + D.stops.length + ' จุด · ค่าส่งที่ต้องเก็บรวม ' + total.toLocaleString('th-TH') + ' บาท)</h2>' +\n      (D.stops.length ? '<table><thead><tr><th>#</th><th>ลูกค้า</th><th>สินค้า</th><th>เก็บเงิน</th><th class=\"qr\">แผนที่</th><th class=\"tick\">ผล</th><th class=\"sign\">ผู้รับเซ็น</th></tr></thead><tbody>' +\n        D.stops.map(function (s, i) {\n          var link = mapLink(s);\n          return '<tr><td>' + (i + 1) + '</td><td><b>' + esc(s.customer) + '</b><div class=\"muted\">' + esc(s.id) + ' · สาขา ' + esc(s.branchName) + '</div>' +\n            (s.phone ? '<div>☎ <a href=\"tel:' + esc(s.phone) + '\">' + esc(s.phone) + '</a></div>' : '') +\n            (s.timeWindow ? '<div>เวลา ' + esc(s.timeWindow) + '</div>' : '') +\n            '<div class=\"muted\">' + esc(s.address) + '</div>' + (s.note ? '<div class=\"muted\">หมายเหตุ: ' + esc(s.note) + '</div>' : '') +\n            (s.status !== 'ยืนยันแล้ว' ? '<div class=\"warn\">' + esc(s.status) + '</div>' : '') + '</td>' +\n            '<td>' + esc(s.qty) + '<div class=\"muted\">ของอยู่ที่' + esc(s.stock) + (s.trNo ? ' · TR ' + esc(s.trNo) : '') + '</div></td>' +\n            '<td>' + (s.fee ? '<b>' + s.fee.toLocaleString('th-TH') + '</b> บาท' : '-') + '</td>' +\n            '<td class=\"qr\">' + (link ? '<a href=\"' + esc(link) + '\">' + qr(link) + '</a>' : '') + '</td>' +\n            '<td class=\"tick\">☐ ส่งแล้ว<br>☐ ไม่สำเร็จ<br>เหตุผล ......</td><td class=\"sign\"></td></tr>';\n        }).join('') + '</tbody></table>' : '<p>ไม่มีจุดส่งลูกค้า</p>') +\n      '<div class=\"foot\"><div>คนขับ</div><div>ผู้จัดรถ</div><div>คลังตรวจรับกลับ</div></div>';\n    if (PRINT) setTimeout(function () { window.print(); }, 600);\n  </script>\n</body>\n</html>\n",
  Form: "<!DOCTYPE html>\n<html lang=\"th\">\n<head>\n  <base target=\"_top\">\n  <meta charset=\"utf-8\">\n  <link href=\"https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap\" rel=\"stylesheet\">\n  <style>\n    * { box-sizing: border-box; }\n    body { margin: 0; font-family: 'Sarabun', system-ui, sans-serif; font-size: 13.5px; color: #111; background: #eef1ee; }\n    .page { width: 210mm; min-height: 297mm; margin: 12px auto; padding: 12mm 12mm 10mm; background: #fff; box-shadow: 0 1px 6px rgba(0,0,0,.12); }\n    .top { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #1f7a3a; padding-bottom: 6px; }\n    .logo { font: 700 30px/1 'Sarabun', sans-serif; color: #1f7a3a; }\n    .addr { font-size: 11px; color: #1f7a3a; text-align: right; line-height: 1.35; }\n    h1 { font-size: 17px; text-align: center; margin: 10px 0 2px; }\n    .sub { text-align: center; font-size: 11.5px; color: #555; margin-bottom: 8px; }\n    table { width: 100%; border-collapse: collapse; margin-top: 6px; }\n    th, td { border: 1px solid #888; padding: 4px 6px; vertical-align: top; }\n    th.sec { background: #eef4ef; text-align: center; font-weight: 700; }\n    td.k { width: 22%; font-weight: 600; background: #fafbfa; }\n    td.v { width: 28%; }\n    .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }\n    .c { display: inline-block; width: 18px; height: 18px; line-height: 16px; text-align: center; border: 1px solid #555; border-radius: 50%; font-size: 11px; margin-left: 4px; }\n    .box { display: inline-block; width: 12px; height: 12px; border: 1px solid #222; vertical-align: -1px; margin-right: 4px; text-align: center; line-height: 10px; font-size: 11px; }\n    .sign td { text-align: center; height: 92px; vertical-align: bottom; width: 33.33%; }\n    .sign .h { height: auto; vertical-align: middle; font-weight: 700; background: #eef4ef; }\n    .stamp { display: inline-block; border: 1.5px solid #1f7a3a; color: #1f7a3a; border-radius: 6px; padding: 2px 8px; font-weight: 700; font-size: 12px; margin-bottom: 4px; }\n    .stamp.no { border-color: #a3261d; color: #a3261d; }\n    .pend { color: #999; font-size: 12px; }\n    .nm { font-weight: 600; }\n    .muted { color: #555; font-size: 11.5px; }\n    .total td { font-weight: 700; background: #f6faf6; }\n    .foot { margin-top: 8px; font-size: 11px; color: #555; display: flex; justify-content: space-between; gap: 8px; }\n    .bar { text-align: center; margin: 12px; }\n    .bar button { font: 600 15px 'Sarabun', sans-serif; padding: 8px 18px; border-radius: 8px; border: 1px solid #1f7a3a; background: #1f7a3a; color: #fff; cursor: pointer; }\n    .po h2 { font-size: 15px; margin: 0 0 8px; }\n    .po img { display: block; max-width: 100%; max-height: 255mm; margin: 0 auto 8px; }\n    @page { size: A4; margin: 0; }\n    @media print { body { background: #fff; } .bar { display: none; } .page { margin: 0; box-shadow: none; } .po { page-break-before: always; } }\n    @media (max-width: 820px) { .page { width: auto; min-height: 0; margin: 0; padding: 14px; } }\n  </style>\n</head>\n<body>\n  <div class=\"bar\"><button onclick=\"print()\">พิมพ์ / บันทึกเป็น PDF</button></div>\n  <div class=\"page\" id=\"p\"></div>\n  <div id=\"po\"></div>\n  <?!= include_('PdfView') ?>\n  <script>\n    var D = <?!= data ?>;\n    function esc(s) { return String(s == null ? '' : s).replace(/[&<>\"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }\n    function m(n) { return n === '' || n == null || isNaN(Number(n)) ? '' : Number(n).toLocaleString('th-TH'); }\n    function box(on) { return '<span class=\"box\">' + (on ? '✓' : '') + '</span>'; }\n    function signer(stamp, title, fallbackName) {\n      if (!stamp) return '<div class=\"pend\">รออนุมัติในระบบ</div><div class=\"nm\">(' + esc(fallbackName || '................................') + ')</div><div class=\"muted\">' + esc(title) + '</div>';\n      return '<div class=\"stamp' + (stamp.ok ? '' : ' no') + '\">' + (stamp.ok ? 'อนุมัติในระบบ' : 'ไม่อนุมัติ') + '</div>' +\n        '<div class=\"nm\">(' + esc(stamp.name) + ')</div><div class=\"muted\">' + esc(title) + '</div>' +\n        '<div class=\"muted\">' + esc(stamp.date) + ' ' + esc(stamp.time) + (stamp.note ? ' · ' + esc(stamp.note) : '') + '</div>';\n    }\n    function requester() {\n      return '<div class=\"stamp\">ส่งคำขอในระบบ</div><div class=\"nm\">(' + esc(D.branchManager) + ')</div><div class=\"muted\">ผู้จัดการสาขา ' + esc(D.branchName) + '</div>' +\n        '<div class=\"muted\">' + esc(D.createdLabel) + (D.requester && D.requester !== D.branchManager ? ' · กรอกโดย ' + esc(D.requester) : '') + '</div>';\n    }\n    var c = D.cost || {};\n    var hasCost = !!D.cost;\n    var row = function (k1, v1, k2, v2) { return '<tr><td class=\"k\">' + k1 + '</td><td class=\"v\">' + v1 + '</td><td class=\"k\">' + k2 + '</td><td class=\"v\">' + v2 + '</td></tr>'; };\n    var cv = function (v, unit, n) { return hasCost ? '<span class=\"num\">' + m(v) + '</span> ' + unit + (n ? ' <span class=\"c\">' + n + '</span>' : '') : ''; };\n    document.getElementById('p').innerHTML =\n      '<div class=\"top\"><div class=\"logo\">สมใจ</div><div class=\"addr\">เลขที่ 131-133,135-137,139<br>ถนนตรีเพชร แขวงวังบูรพาภิรมย์<br>เขตพระนคร กรุงเทพฯ 10200</div></div>' +\n      '<h1>ใบแจ้งขอรอบรถส่งสินค้าลูกค้าต่างจังหวัด</h1>' +\n      '<div class=\"sub\">(ไม่รวมส่งลูกค้ากรุงเทพ นนทบุรี สมุทรปราการ สมุทรสาคร นครปฐม ปทุมธานี) · ตามประกาศ MEMO COO009/69</div>' +\n      '<table><tr><td class=\"k\">เลขที่คำขอ</td><td class=\"v\">' + esc(D.id) + '</td><td class=\"k\">วัน/เดือน/ปี</td><td class=\"v\">' + esc(D.createdLabel) + '</td></tr>' +\n      '<tr><td class=\"k\">สาขา</td><td class=\"v\">' + esc(D.branchName) + ' (' + esc(D.branchCode) + ')</td><td class=\"k\">สถานะ</td><td class=\"v\">' + esc(D.status) + '</td></tr></table>' +\n\n      '<table><tr><th class=\"sec\" colspan=\"4\">ข้อมูลจากฝ่ายขาย (ฝ่ายขายกรอกข้อมูล)</th></tr>' +\n      row('ชื่อ - นามสกุล (ลูกค้า)', esc(D.customer), 'เบอร์ติดต่อ', esc(D.phone)) +\n      row('เลขที่ใบสั่งซื้อ', esc(D.poNo || '-') + (D.poImages.length ? '<div class=\"muted\">แนบใบสั่งซื้อ ' + D.poImages.length + ' ไฟล์ (หน้าถัดไป)</div>' : ''), 'ยอดขายรวม', '<span class=\"num\">' + m(D.value) + '</span> บาท') +\n      row('กำไรขั้นต้น (บาท)', '<span class=\"num\">' + m(D.grossProfit) + '</span> บาท', 'กำไรขั้นต้น (%)', esc(D.grossProfitPct === '' ? '-' : D.grossProfitPct + '%')) +\n      row('ประเภทสินค้า', esc(D.productType), 'จำนวนสินค้า', esc(D.qty)) +\n      row('ระยะทางขาไปส่งให้ลูกค้า', '<span class=\"num\">' + m(D.distanceKm) + '</span> กม. (จากสาขา)', 'การเก็บค่าส่งลูกค้า',\n        box(D.collectFee) + 'เก็บ ' + (D.collectFee ? '<b>' + m(D.feeCharged) + '</b> บาท' : '') + ' &nbsp; ' + box(!D.collectFee) + 'ไม่เก็บ' +\n        (D.feePolicy !== '' ? '<div class=\"muted\">ตามนโยบาย ' + m(D.feePolicy) + ' บาท' + (D.feeReason ? ' · เหตุผล: ' + esc(D.feeReason) : '') + '</div>' : '')) +\n      '<tr><td class=\"k\">ที่อยู่จัดส่ง</td><td colspan=\"3\">' + esc(D.address) + ' · ' + esc(D.province) + (D.mapsUrl ? '<div class=\"muted\">' + esc(D.mapsUrl) + '</div>' : '') + '</td></tr>' +\n      '<tr><td class=\"k\">หมายเหตุ</td><td colspan=\"3\">' + esc(D.note || '-') + '</td></tr></table>' +\n      '<div class=\"muted\" style=\"margin-top:3px\">หมายเหตุ 1. ระยะทางจากสาขาไปถึงที่อยู่ลูกค้า คำนวณจาก Google Maps &nbsp; 2. สาขาเช็กข้อมูลการเก็บค่าส่งสินค้าตามนโยบายและจัดเก็บค่าขนส่งตามนโยบายให้เรียบร้อย</div>' +\n\n      '<table class=\"sign\"><tr><td class=\"h\">ขอรอบรถโดย</td><td class=\"h\">ผู้จัดการเขตตรวจสอบ</td><td class=\"h\">อนุมัติโดย</td></tr>' +\n      '<tr><td>' + requester() + '</td><td>' + signer(D.appr.zone, 'ผู้จัดการเขต', D.zoneManager) + '</td><td>' + signer(D.appr.ceo, 'ประธานเจ้าหน้าที่บริหาร', D.ceoName) + '</td></tr></table>' +\n\n      '<table><tr><th class=\"sec\" colspan=\"4\">ข้อมูลจากคลังสินค้า (คลังสินค้ากรอกข้อมูล) — ค่าใช้จ่ายในการออกรถส่งตรง (ประมาณการ) · ระยะทางไป-กลับจากคลังสินค้าถึงที่อยู่ลูกค้า</th></tr>' +\n      row('ระยะทางไป-กลับรวม', cv(c.roundTripKm, 'กม.'), 'ทะเบียนรถที่ส่งของ', esc(hasCost ? D.plate : '')) +\n      row('อัตราสิ้นเปลืองน้ำมัน', cv(c.kmPerLiter, 'กม./ลิตร'), 'ค่าน้ำมันต่อลิตร', cv(c.fuelPrice, 'บาท')) +\n      row('ค่าน้ำมัน', cv(c.fuel, 'บาท', '1'), 'ค่าเสื่อม (' + m(c.depreciationPerKm || 5) + ' บาท/ก.ม.)', cv(c.depreciation, 'บาท', '2')) +\n      row('จำนวนวันเดินทางไป-กลับ', cv(c.days, 'วัน'), 'จำนวนพนักงาน', cv(c.staff, 'คน')) +\n      row('ค่าแรง / OT / เบี้ยเลี้ยง', cv(c.labor, 'บาท', '3'), 'ค่าทางด่วน', cv(c.toll, 'บาท', '4')) +\n      row('ค่าที่พัก (ถ้ามี)', cv(c.lodging, 'บาท', '5'), 'อื่นๆ', cv(c.other, 'บาท', '6')) +\n      '<tr class=\"total\"><td class=\"k\">รวมประมาณ ค่าใช้จ่ายในการออกรถส่งสินค้า</td><td colspan=\"3\">' + (hasCost ? '<span class=\"num\">' + m(c.total) + '</span> บาท (1+2+3+4+5+6)' : '') + '</td></tr>' +\n      row('ค่าใช้จ่ายหากใช้บริษัทขนส่งเอกชน', hasCost ? (c.privateCost ? '<span class=\"num\">' + m(c.privateCost) + '</span> บาท' : '-') : '', 'มีสินค้ารวมส่งให้สาขา',\n        hasCost ? box(!c.branchGoods) + 'ไม่มี &nbsp; ' + box(c.branchGoods) + 'มี' + (c.branchGoods ? ' มูลค่า ' + m(c.branchGoodsValue) + ' บาท' : '') : '') +\n      row('ผลกระทบต่อตารางส่งประจำวัน', hasCost ? box(!c.scheduleImpact) + 'ไม่มีผลกระทบ &nbsp; ' + box(c.scheduleImpact) + 'มีผลกระทบ' + (c.impactNote ? '<div class=\"muted\">' + esc(c.impactNote) + '</div>' : '') : '',\n        'ยืนยันวันที่ส่งสินค้า', hasCost ? esc(D.dateLabel) + (c.departTime ? ' ออกจากคลังเวลา ' + esc(c.departTime) + ' น.' : '') : '') +\n      '</table>' +\n\n      '<table class=\"sign\"><tr><td class=\"h\">รับเรื่อง / ตรวจสอบโดย</td><td class=\"h\">ตรวจสอบโดย</td><td class=\"h\">อนุมัติโดย</td></tr>' +\n      '<tr><td>' + signer(D.appr.wh, 'คลังสินค้า', '') + '</td><td>' + (D.appr.wh ? '<div class=\"nm\">(' + esc(D.appr.wh.name) + ')</div><div class=\"muted\">ผู้จัดการฝ่ายคลังสินค้า / ผู้แทน</div>' : '<div class=\"pend\">รอคลังประเมิน</div><div class=\"nm\">(คุณจรินทร มีเจริญ)</div><div class=\"muted\">ผู้จัดการฝ่ายคลังสินค้า</div>') + '</td>' +\n      '<td>' + signer(D.appr.coo, 'ประธานเจ้าหน้าที่สายงานปฏิบัติการ', D.cooName) + '</td></tr></table>' +\n\n      '<div class=\"foot\"><span>เอกสารนี้พิมพ์จากระบบขอคิวรถคลังสินค้า · การอนุมัติบันทึกในระบบพร้อมชื่อและเวลา</span><span>พิมพ์เมื่อ ' + esc(D.printedAt) + '</span></div>';\n    // ใบสั่งซื้อที่แนบ — รูปละ 1 หน้า · PDF วาดทีละหน้า ต่อท้ายใบแจ้ง\n    var poBox = document.getElementById('po');\n    D.poImages.forEach(function (im, i) {\n      var head = '<h2>ใบสั่งซื้อที่แนบ · ' + esc(D.id) + (D.poNo ? ' · เลขที่ ' + esc(D.poNo) : '') + ' · ไฟล์ที่ ' + (i + 1) + '/' + D.poImages.length;\n      var page = function (html) { var d = document.createElement('div'); d.className = 'page po'; d.innerHTML = html; poBox.appendChild(d); return d; };\n      if (im.missing) return page(head + '</h2><p class=\"muted\">ไม่พบไฟล์ ' + esc(im.name) + '</p>');\n      if (!im.pdf) return page(head + '</h2><img src=\"' + im.src + '\" alt=\"ใบสั่งซื้อ\">');\n      var slot = page(head + '</h2><p class=\"muted\">กำลังเปิด PDF…</p>');\n      renderPdf(im.src, function (img, n, total) {\n        var d = n === 1 ? slot : page('');\n        d.innerHTML = head + ' · หน้า ' + n + '/' + total + '</h2>'; d.appendChild(img);\n      }).catch(function (e) { slot.innerHTML = head + '</h2><p class=\"muted\">เปิด PDF ไม่ได้ (' + esc(e.message) + ') — ดูไฟล์จากปุ่มใบสั่งซื้อในระบบ</p>'; });\n    });\n  </script>\n</body>\n</html>\n",
  Po: "<!DOCTYPE html>\n<html lang=\"th\">\n<head>\n  <base target=\"_top\">\n  <meta charset=\"utf-8\">\n  <link href=\"https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap\" rel=\"stylesheet\">\n  <style>\n    * { box-sizing: border-box; }\n    body { margin: 0; font-family: 'Sarabun', system-ui, sans-serif; color: #111; background: #eef1ee; }\n    header { background: #1f7a3a; color: #fff; padding: 12px 16px; }\n    header b { font-size: 18px; } header div { font-size: 14px; opacity: .9; }\n    main { max-width: 900px; margin: 0 auto; padding: 12px 16px 24px; }\n    figure { margin: 0 0 14px; background: #fff; border-radius: 10px; padding: 8px; box-shadow: 0 1px 4px rgba(0,0,0,.1); }\n    figure img { display: block; width: 100%; height: auto; border-radius: 6px; }\n    .pdf img { display: block; width: 100%; height: auto; border: 1px solid #ddd; margin-bottom: 6px; }\n    .wait { color: #555; padding: 16px; }\n    figcaption { font-size: 13px; color: #555; margin-top: 4px; display: flex; justify-content: space-between; gap: 8px; }\n    figcaption a { color: #1f7a3a; }\n    .miss { color: #a3261d; padding: 16px; }\n    .bar { text-align: center; margin: 4px 0 12px; }\n    .bar button { font: 600 15px 'Sarabun', sans-serif; padding: 8px 18px; border-radius: 8px; border: 1px solid #1f7a3a; background: #1f7a3a; color: #fff; cursor: pointer; }\n    @media print { body { background: #fff; } .bar, figcaption a { display: none; } figure { box-shadow: none; page-break-inside: avoid; } }\n  </style>\n</head>\n<body>\n  <header id=\"h\"></header>\n  <main id=\"m\"></main>\n  <?!= include_('PdfView') ?>\n  <script>\n    var D = <?!= data ?>;\n    function esc(s) { return String(s == null ? '' : s).replace(/[&<>\"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }\n    var N = D.images.length;\n    document.getElementById('h').innerHTML = '<b>ใบสั่งซื้อ · ' + esc(D.id) + '</b><div>' + esc(D.branchName) + ' · ' + esc(D.customer) +\n      (D.poNo ? ' · เลขที่ ' + esc(D.poNo) : '') + '</div>';\n    document.getElementById('m').innerHTML = !N ? '<p class=\"miss\">คำขอนี้ยังไม่ได้แนบใบสั่งซื้อ</p>' :\n      '<div class=\"bar\"><button onclick=\"print()\">พิมพ์</button></div>' + D.images.map(function (im, i) {\n        var cap = '<figcaption><span>ไฟล์ที่ ' + (i + 1) + ' / ' + N + (im.pdf ? ' · PDF' : '') + '</span>' +\n          (im.missing ? '' : '<a href=\"' + im.src + '\" download=\"' + esc(im.name) + '\">บันทึกไฟล์</a>') + '</figcaption>';\n        if (im.missing) return '<figure><div class=\"miss\">ไม่พบไฟล์ ' + esc(im.name) + ' (อาจถูกลบออกจาก Drive)</div>' + cap + '</figure>';\n        if (im.pdf) return '<figure><div class=\"pdf\" id=\"pdf' + i + '\"><p class=\"wait\">กำลังเปิด PDF…</p></div>' + cap + '</figure>';\n        return '<figure><img src=\"' + im.src + '\" alt=\"ใบสั่งซื้อ ไฟล์ที่ ' + (i + 1) + '\">' + cap + '</figure>';\n      }).join('');\n    D.images.forEach(function (im, i) {\n      if (!im.pdf || im.missing) return;\n      var box = document.getElementById('pdf' + i);\n      renderPdf(im.src, function (img, n, total) {\n        if (n === 1) box.innerHTML = '';\n        img.alt = 'หน้า ' + n + '/' + total; box.appendChild(img);\n      }).catch(function (e) {\n        box.innerHTML = '<p class=\"miss\">เปิด PDF ในหน้านี้ไม่ได้ (' + esc(e.message) + ') · กด \"บันทึกไฟล์\" แล้วเปิดในเครื่อง</p>';\n      });\n    });\n  </script>\n</body>\n</html>\n",
  PdfView: "<script src=\"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js\"></script>\n<script src=\"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js\"></script>\n<script>\n  /**\n   * แสดงไฟล์ PDF (data URL) เป็นภาพทีละหน้า — ใช้ได้ทั้งมือถือและตอนพิมพ์\n   * (ตัวอ่าน PDF ในเบราว์เซอร์เปิด data URL ในหน้าเว็บแอปไม่ได้ จึงวาดเป็นภาพเอง)\n   * onPage(img, หน้าที่, จำนวนหน้า) · คืน Promise\n   */\n  function renderPdf(src, onPage) {\n    if (!window.pdfjsLib) return Promise.reject(new Error('โหลดตัวอ่าน PDF ไม่สำเร็จ'));\n    var raw = atob(src.slice(src.indexOf(',') + 1)), bytes = new Uint8Array(raw.length);\n    for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);\n    return pdfjsLib.getDocument({ data: bytes }).promise.then(function (pdf) {\n      var chain = Promise.resolve();\n      for (var n = 1; n <= pdf.numPages; n++) {\n        chain = chain.then(renderPage.bind(null, pdf, n));\n      }\n      return chain;\n    });\n    function renderPage(pdf, n) {\n      return pdf.getPage(n).then(function (page) {\n        var vp = page.getViewport({ scale: 2 });\n        var c = document.createElement('canvas');\n        c.width = Math.round(vp.width); c.height = Math.round(vp.height);\n        return page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise.then(function () {\n          var img = new Image();\n          img.src = c.toDataURL('image/jpeg', 0.85);\n          onPage(img, n, pdf.numPages);\n        });\n      });\n    }\n  }\n</script>\n",
  Act: "<!DOCTYPE html>\n<html lang=\"th\">\n<head>\n  <base target=\"_top\">\n  <meta charset=\"utf-8\">\n  <link href=\"https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap\" rel=\"stylesheet\">\n  <style>\n    * { box-sizing: border-box; }\n    body { margin: 0; font-family: 'Sarabun', system-ui, sans-serif; font-size: 16px; color: #111; background: #eef1ee; }\n    header { background: #1f7a3a; color: #fff; padding: 12px 16px; font-weight: 700; font-size: 18px; }\n    main { max-width: 560px; margin: 0 auto; padding: 14px 16px 28px; }\n    .card { background: #fff; border-radius: 12px; padding: 14px; box-shadow: 0 1px 4px rgba(0,0,0,.1); }\n    table { width: 100%; border-collapse: collapse; }\n    td { padding: 6px 4px; border-bottom: 1px solid #eee; vertical-align: top; }\n    td:first-child { color: #555; white-space: nowrap; padding-right: 10px; }\n    .verdict { font-size: 18px; font-weight: 700; margin: 12px 0 4px; }\n    .good { color: #1f7a3a; } .bad { color: #a3261d; }\n    .links a { color: #1f7a3a; margin-right: 14px; }\n    button { font: 600 17px 'Sarabun', sans-serif; width: 100%; padding: 14px; border-radius: 10px; border: 0; color: #fff; margin-top: 10px; cursor: pointer; }\n    .ok { background: #1f7a3a; } .no { background: #a3261d; } .ghost { background: #fff; color: #555; border: 1px solid #ccc; }\n    button:disabled { opacity: .5; }\n    textarea { width: 100%; font: inherit; padding: 10px; border: 1px solid #ccc; border-radius: 8px; min-height: 70px; margin-top: 6px; }\n    .msg { padding: 14px; border-radius: 10px; margin-top: 12px; font-weight: 600; }\n    .msg.okm { background: #e6f2e9; color: #1f7a3a; } .msg.err { background: #fbe9e7; color: #a3261d; }\n    .muted { color: #555; font-size: 14px; }\n  </style>\n</head>\n<body>\n  <header>ระบบขอคิวรถคลังสินค้า · สมใจ</header>\n  <main id=\"m\"></main>\n  <script>\n    var D = <?!= data ?>;\n    function esc(s) { return String(s == null ? '' : s).replace(/[&<>\"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }\n    var m = document.getElementById('m');\n    function render() {\n      if (!D.ok) { m.innerHTML = '<div class=\"msg err\">' + esc(D.error) + '</div>'; return; }\n      var s = D.summary;\n      m.innerHTML = '<div class=\"card\"><div class=\"muted\">' + esc(D.roleLabel) + ' · ' + esc(s.kind) + '</div>' +\n        '<table>' + s.rows.map(function (x) { return '<tr><td>' + esc(x[0]) + '</td><td>' + esc(x[1]) + '</td></tr>'; }).join('') + '</table>' +\n        (s.verdict ? '<div class=\"verdict ' + (s.good ? 'good' : 'bad') + '\">' + esc(s.verdict) + '</div>' : '') +\n        '<div class=\"links\">' + (D.poUrl ? '<a href=\"' + esc(D.poUrl) + '\" target=\"_blank\">ดูใบสั่งซื้อ</a>' : '') +\n        (D.formUrl ? '<a href=\"' + esc(D.formUrl) + '\" target=\"_blank\">ดูใบแจ้งเต็ม</a>' : '') + '</div></div>' +\n        (!D.pending ? '<div class=\"msg okm\">รายการนี้ไม่ต้องรอ ' + esc(D.roleLabel) + ' แล้ว (สถานะ: ' + esc(D.status) + ')</div>' :\n          D.approve ? '<button class=\"ok\" id=\"go\">ยืนยัน อนุมัติ</button><button class=\"ghost\" id=\"sw\">เปลี่ยนเป็น ไม่อนุมัติ</button>'\n            : '<label>เหตุผลที่ไม่อนุมัติ (สาขาจะเห็น)</label><textarea id=\"why\"></textarea>' +\n              '<button class=\"no\" id=\"go\">ยืนยัน ไม่อนุมัติ</button><button class=\"ghost\" id=\"sw\">เปลี่ยนเป็น อนุมัติ</button>') +\n        '<div id=\"out\"></div>';\n      if (!D.pending) return;\n      document.getElementById('sw').onclick = function () { D.approve = !D.approve; render(); };\n      document.getElementById('go').onclick = function () {\n        var why = D.approve ? '' : document.getElementById('why').value.trim();\n        if (!D.approve && !why) { out('กรุณาใส่เหตุผลที่ไม่อนุมัติ', true); return; }\n        var b = this; b.disabled = true; b.textContent = 'กำลังบันทึก…';\n        google.script.run.withSuccessHandler(function (r) {\n          D.pending = false; D.status = r.status; render();\n          out((D.approve ? 'อนุมัติแล้ว' : 'บันทึกไม่อนุมัติแล้ว') + ' · สถานะตอนนี้: ' + r.status, false);\n        }).withFailureHandler(function (e) {\n          b.disabled = false; b.textContent = D.approve ? 'ยืนยัน อนุมัติ' : 'ยืนยัน ไม่อนุมัติ'; out(e.message || String(e), true);\n        }).emailDecide(D.id, D.role, D.exp, D.t, D.approve, why);\n      };\n    }\n    function out(msg, bad) { document.getElementById('out').innerHTML = '<div class=\"msg ' + (bad ? 'err' : 'okm') + '\">' + esc(msg) + '</div>'; }\n    render();\n  </script>\n</body>\n</html>\n"
};

// ═════ Main.gs ═════
/**
 * จุดเข้าเว็บแอป + การติดตั้งครั้งแรก
 */

/**
 * ติดตั้งครั้งแรก: สร้างชีต ใส่ข้อมูลตั้งต้น และตั้งเวลาเลื่อนงานอัตโนมัติ
 * รันซ้ำได้ — ชีตที่มีข้อมูลแล้วจะไม่ถูกเขียนทับ
 */
function setup() {
  var ss = ss_();
  Object.keys(COLS).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    var headers = COLS[name].map(function (c) { return c[1]; });
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#e8f0e8');
    sh.setFrozenRows(1);
  });
  // วันที่และรหัสเก็บเป็นข้อความ กันชีตแปลงเป็นวันที่/ตัดเลข 0 นำหน้า
  textColumns_(SHEET.REQ, ['id', 'branchCode', 'date', 'createdAt', 'updatedAt', 'phone', 'trNo']);
  textColumns_(SHEET.BRANCH, ['code']);
  textColumns_(SHEET.STAFF, ['branchCode', 'createdAt']);
  textColumns_(SHEET.SCHED, ['effectiveFrom', 'branches']);
  textColumns_(SHEET.HOLIDAY, ['date']);
  textColumns_(SHEET.LOG, ['ts']);
  textColumns_(SHEET.SETTING, ['value']);

  seedIfEmpty_(SHEET.SETTING, DEFAULT_SETTINGS.map(function (d) { return { key: d[0], value: d[1], note: d[2] }; }));
  // รันซ้ำหลังอัปเดตโค้ด: เพิ่มค่าตั้งค่าใหม่ที่ยังไม่มีในชีต (ไม่แตะค่าที่มีอยู่)
  var haveKeys = readAll_(SHEET.SETTING).map(function (r) { return r.key; });
  DEFAULT_SETTINGS.forEach(function (d) {
    if (haveKeys.indexOf(d[0]) === -1) append_(SHEET.SETTING, { key: d[0], value: d[1], note: d[2] });
  });
  seedIfEmpty_(SHEET.TIER, DEFAULT_TIERS.map(function (t) { return { minValue: t[0], freeKm: t[1] }; }));
  seedIfEmpty_(SHEET.BRANCH, seedBranches_().sort(function (a, b) { return a[0] < b[0] ? -1 : 1; }).map(function (b) {
    return { code: b[0], name: b[1], zone: b[2], zoneManager: b[3], mapsUrl: b[4], status: b[5] };
  }));
  seedIfEmpty_(SHEET.TRUCK, seedTrucks_().map(function (t) {
    return { plate: t.plate, aliases: t.aliases.join(', '), brand: t.brand, driver: t.driver, crew: t.crew };
  }));
  seedIfEmpty_(SHEET.SCHED, seedSchedule_().map(function (r) {
    return { effectiveFrom: r.effectiveFrom, plate: r.plate, weekday: r.weekday, branches: r.branches.join(','), slots: r.slots };
  }));
  var now = nowStr_();
  var st = settings_();
  seedIfEmpty_(SHEET.MAIL, branches_().reduce(function (a, b) {
    if (b.zoneManager && a.indexOf(b.zoneManager) === -1) a.push(b.zoneManager);
    return a;
  }, []).map(function (n) { return { group: ROLES.zone, name: n, email: '' }; })
    .concat(seedWarehouseStaff_().map(function (n) { return { group: ROLES.wh, name: n, email: '' }; }))
    .concat([{ group: ROLES.ceo, name: st.ceoName, email: st.ceoEmail || '' }, { group: ROLES.coo, name: st.cooName, email: st.cooEmail || '' }]));
  seedIfEmpty_(SHEET.STAFF, seedSalesStaff_().map(function (s) {
    return { name: s[0], branchCode: s[1], role: 'ขาย', status: 'ใช้งาน', createdAt: now };
  }).concat(seedWarehouseStaff_().map(function (n) {
    return { name: n, branchCode: '', role: 'คลัง', status: 'ใช้งาน', createdAt: now };
  })));

  poFolder_();   // โฟลเดอร์เก็บรูปใบสั่งซื้อ (ครั้งแรกจะขอสิทธิ์ Google Drive)

  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'autoPostpone') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('autoPostpone').timeBased().everyDays(1)
    .atHour(settings_().cutoffHour).nearMinute(5).inTimezone(TZ).create();

  Logger.log('ติดตั้งเรียบร้อย · ขั้นต่อไป: แก้ PIN ใน setPins() แล้วรัน, รันเมนู "เติมพิกัดสาขา", แล้ว Deploy เป็น Web app');
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.view === 'sheet') return driverSheet_(p);
  if (p.view === 'form') return upcountryForm_(p);
  if (p.view === 'po') return poView_(p);
  if (p.view === 'act') return actView_(p);
  return template_('Index').evaluate()
    .setTitle('ขอคิวรถคลังสินค้า · สมใจ')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

/** ใบงานรายวัน (พิมพ์ / เปิดบนมือถือคนขับ) — ต้องมีโทเคนที่ตรงกับวันที่+ทะเบียน */
function driverSheet_(p) {
  var date = String(p.date || ''), plate = String(p.plate || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !plate || p.t !== sheetToken_(date, plate)) {
    return HtmlService.createHtmlOutput('<p style="font-family:sans-serif">ลิงก์ใบงานไม่ถูกต้อง</p>');
  }
  var t = template_('Sheet');
  t.data = JSON.stringify(sheetData_(date, plate)).replace(/</g, '\\u003c');
  t.print = p.print === '1';
  return t.evaluate().setTitle('ใบงาน ' + plate + ' ' + thaiDate_(date))
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** ไฟล์ HTML: ใช้ไฟล์ในโปรเจกต์ หรือข้อความที่ฝังไว้ใน Code.gs ฉบับรวมไฟล์ (dist/) */
function html_(name) {
  if (typeof EMBEDDED_HTML !== 'undefined') return EMBEDDED_HTML[name];
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}
function template_(name) { return HtmlService.createTemplate(html_(name)); }
/** ใบแจ้งขอรอบรถส่งสินค้าลูกค้าต่างจังหวัด — เปิดได้เฉพาะลิงก์ที่มีโทเคนของเลขคิวนั้น */
function upcountryForm_(p) {
  var id = String(p.id || '');
  if (!id || p.t !== sheetToken_('form', id)) {
    return HtmlService.createHtmlOutput('<p style="font-family:sans-serif">ลิงก์ใบแจ้งไม่ถูกต้อง</p>');
  }
  var t = template_('Form');
  t.data = JSON.stringify(formData_(id)).replace(/</g, '\\u003c');
  return t.evaluate().setTitle('ใบแจ้งขอรอบรถ ' + id).addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** หน้าดูรูปใบสั่งซื้อของคำขอ — เปิดได้เฉพาะลิงก์ที่มีโทเคนของเลขคิวนั้น */
function poView_(p) {
  var id = String(p.id || '');
  if (!id || p.t !== sheetToken_('po', id)) {
    return HtmlService.createHtmlOutput('<p style="font-family:sans-serif">ลิงก์รูปใบสั่งซื้อไม่ถูกต้อง</p>');
  }
  var r = findRequest_(id);
  var t = template_('Po');
  t.data = JSON.stringify({ id: r.id, customer: r.customer, branchName: r.branchName, poNo: r.poNo || '', images: poImages_(r) })
    .replace(/</g, '\\u003c');
  return t.evaluate().setTitle('ใบสั่งซื้อ ' + id).addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include_(name) { return html_(name); }

/** ฝังฟังก์ชันจาก Logic.gs ให้หน้าเว็บใช้ — สูตรค่าส่งมีที่เดียว */
function logicSource_() {
  return 'var STATUS=' + JSON.stringify(STATUS) + ';var DEFAULT_TIERS=' + JSON.stringify(DEFAULT_TIERS) + ';' +
    [freeKm_, policyFee_, addDays_, weekday_, thaiDate_, upcountryCost_].map(String).join('\n') +
    'var THAI_DAYS=' + JSON.stringify(THAI_DAYS) + ';var THAI_MONTHS=' + JSON.stringify(THAI_MONTHS) + ';';
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('ระบบขอคิวรถ')
    .addItem('เติมพิกัดสาขาจากลิงก์แผนที่', 'updateBranchCoords')
    .addToUi();
}

function textColumns_(name, keys) {
  var sh = sheet_(name);
  keys.forEach(function (k) {
    var col = keys_(name).indexOf(k) + 1;
    sh.getRange(1, col, sh.getMaxRows(), 1).setNumberFormat('@');
  });
}

function seedIfEmpty_(name, rows) {
  var sh = sheet_(name);
  if (sh.getLastRow() > 1 || !rows.length) return;
  sh.getRange(2, 1, rows.length, keys_(name).length).setValues(rows.map(function (r) { return toRow_(name, r); }));
}

// ═════ Logic.gs ═════
/**
 * ตรรกะล้วน — ไม่เรียกบริการของ Apps Script เลย
 * ใช้ทั้งฝั่งเซิร์ฟเวอร์ ฝั่งหน้าเว็บ (ฝังผ่าน logicSource_) และทดสอบด้วย node (tests/logic.test.js)
 *
 * วันที่ทั้งหมดเป็นสตริง 'yyyy-MM-dd' (ค.ศ.) ตามเวลากรุงเทพฯ
 */

var STATUS = {
  PENDING: 'รอยืนยัน',
  APPROVAL: 'รออนุมัติ',
  CONFIRMED: 'ยืนยันแล้ว',
  DELIVERED: 'จัดส่งเรียบร้อย',
  FAILED: 'ส่งไม่สำเร็จ',
  CANCELLED: 'ยกเลิก',
  REJECTED: 'ไม่อนุมัติ',
  LEGACY_UNKNOWN: 'ไม่ทราบ (ข้อมูลเก่า)'
};

/** สถานะที่ยังกันที่ในรอบรถ */
var HOLDING_STATUSES = [STATUS.PENDING, STATUS.APPROVAL, STATUS.CONFIRMED];

/** MEMO COO009/69 — [ยอดซื้อขั้นต่ำ, ระยะส่งฟรี (กม.)] เรียงจากน้อยไปมาก */
var DEFAULT_TIERS = [
  [3000, 5], [5000, 10], [8000, 20], [10000, 30],
  [20000, 50], [40000, 100], [60000, 150], [100000, 300]
];

var METRO_PROVINCES = [
  ['กรุงเทพมหานคร', 'กรุงเทพ', 'bangkok'],
  ['นนทบุรี', 'nonthaburi'],
  ['สมุทรปราการ', 'samut prakan'],
  ['สมุทรสาคร', 'samut sakhon'],
  ['นครปฐม', 'nakhon pathom'],
  ['ปทุมธานี', 'pathum thani']
];

function freeKm_(value, tiers) {
  tiers = tiers || DEFAULT_TIERS;
  var km = 0;
  for (var i = 0; i < tiers.length; i++) {
    if (value >= tiers[i][0]) km = tiers[i][1];
  }
  return km;
}

/** ค่าส่งตามนโยบาย: ส่วนที่เกินระยะฟรี ปัดขึ้นทุก 10 กม. × อัตรา */
function policyFee_(distanceKm, value, tiers, ratePer10Km) {
  ratePer10Km = ratePer10Km || 120;
  var d = Math.round(Number(distanceKm) * 10) / 10;
  var excess = Math.round((d - freeKm_(Number(value), tiers)) * 10) / 10;
  if (excess <= 0) return 0;
  return Math.ceil(excess / 10) * ratePer10Km;
}

function isMetro_(province) {
  var p = String(province || '').toLowerCase()
    .replace(/^จังหวัด|^จ\.\s*|^chang wat\s*/g, '').replace(/\s+province$/, '').trim();
  if (!p) return false;
  return METRO_PROVINCES.some(function (names) {
    return names.some(function (n) { return p.indexOf(n) !== -1; });
  });
}

function haversineKm_(lat1, lng1, lat2, lng2) {
  var r = Math.PI / 180;
  var a = Math.pow(Math.sin((lat2 - lat1) * r / 2), 2) +
    Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.pow(Math.sin((lng2 - lng1) * r / 2), 2);
  return 12742 * Math.asin(Math.sqrt(a));
}

/** ดึงพิกัดจาก URL ของ Google Maps (หลังตามลิงก์ย่อแล้ว) หรือข้อความ "lat,lng" */
function parseLatLng_(text) {
  if (!text) return null;
  var s = String(text);
  try { s = decodeURIComponent(s); } catch (e) { /* ใช้ข้อความเดิม */ }
  var patterns = [
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    /[?&](?:q|query|ll|destination|center)=(?:loc:)?(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/,
    /\/search\/(-?\d+\.\d+)\s*,\s*\+?(-?\d+\.\d+)/,
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{2,3}\.\d+)\s*$/
  ];
  for (var i = 0; i < patterns.length; i++) {
    var m = s.match(patterns[i]);
    if (m) {
      var lat = Number(m[1]), lng = Number(m[2]);
      if (lat >= 5 && lat <= 21 && lng >= 97 && lng <= 106) return { lat: lat, lng: lng };
    }
  }
  return null;
}

function addDays_(ymd, n) {
  var p = ymd.split('-');
  var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + n));
  return d.toISOString().slice(0, 10);
}

/** 0 = อาทิตย์ … 6 = เสาร์ */
function weekday_(ymd) {
  var p = ymd.split('-');
  return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).getUTCDay();
}

/** วันแรกที่จองได้: ก่อนเวลาตัดรอบ → พรุ่งนี้ · หลังเวลาตัดรอบ → มะรืน */
/** วันที่ถัดจากวันนี้ไป n วันทำการ (จันทร์–เสาร์ ไม่นับวันหยุด) — ใช้กับกำหนดขออนุมัติล่วงหน้า */
function addWorkDays_(ymd, n, holidays) {
  var d = ymd, c = 0;
  while (c < n) {
    d = addDays_(d, 1);
    if (weekday_(d) !== 0 && !(holidays && holidays[d])) c++;
  }
  return d;
}

function earliestDate_(nowYmd, nowHour, cutoffHour) {
  return addDays_(nowYmd, nowHour < cutoffHour ? 1 : 2);
}

/**
 * แถวตารางรอบรถที่ใช้อยู่ ณ วันที่ ymd (ชุดที่ effectiveFrom ล่าสุดที่ไม่เกิน ymd)
 * schedule: [{effectiveFrom, plate, weekday, branches: [code…], slots}]
 */
function activeSchedule_(schedule, ymd) {
  var eff = '';
  schedule.forEach(function (r) {
    if (r.effectiveFrom <= ymd && r.effectiveFrom > eff) eff = r.effectiveFrom;
  });
  return schedule.filter(function (r) { return r.effectiveFrom === eff; });
}

function slotKey_(ymd, plate) { return ymd + '|' + plate; }

/**
 * รอบรถที่สาขานี้จองได้
 * opts: {branchCode, schedule, holidays: {ymd:true}, nowYmd, nowHour, cutoffHour, horizonDays, used: {slotKey: n}}
 * คืน [{date, plate, branches, slots, used, left}]
 */
function bookableRounds_(opts) {
  var out = [];
  var start = earliestDate_(opts.nowYmd, opts.nowHour, opts.cutoffHour);
  for (var i = 0; i < (opts.horizonDays || 14); i++) {
    var d = addDays_(start, i);
    if (opts.holidays && opts.holidays[d]) continue;
    var wd = weekday_(d);
    activeSchedule_(opts.schedule, d).forEach(function (r) {
      if (r.weekday !== wd || r.branches.indexOf(opts.branchCode) === -1) return;
      var used = (opts.used && opts.used[slotKey_(d, r.plate)]) || 0;
      out.push({ date: d, plate: r.plate, branches: r.branches, slots: r.slots, used: used, left: r.slots - used });
    });
  }
  return out;
}

/** ลูกค้าอยู่บนเส้นทาง = ห่างจากสาขาใดสาขาหนึ่งที่รถแวะวันนั้นไม่เกิน maxKm (วัดเส้นตรง) */
function isOnRoute_(lat, lng, routeBranchCoords, maxKm) {
  return routeBranchCoords.some(function (b) {
    return b && b.lat && haversineKm_(lat, lng, b.lat, b.lng) <= maxKm;
  });
}

function needsApproval_(value, onRoute, minValue) {
  return Number(value) < (minValue || 3000) && !onRoute;
}

function normPlate_(s) { return String(s || '').replace(/\s+/g, ''); }

/** แปลงทะเบียนที่พิมพ์ต่างกันเป็นทะเบียนหลัก · trucks: [{plate, aliases: [..]}] */
function canonicalPlate_(s, trucks) {
  var n = normPlate_(s);
  if (!n) return '';
  for (var i = 0; i < trucks.length; i++) {
    var all = [trucks[i].plate].concat(trucks[i].aliases || []);
    for (var j = 0; j < all.length; j++) {
      if (normPlate_(all[j]) === n) return trucks[i].plate;
    }
  }
  return '';
}

/**
 * สถานะหลังการอนุมัติ (ฝั่งขาย ผจก.เขต→CEO และฝั่งคลัง คลัง→COO ทำพร้อมกัน)
 * appr: {zone, ceo, wh, coo} แต่ละค่า '' | 'อนุมัติ…' | 'ไม่อนุมัติ…'
 */
function approvalStatus_(appr) {
  var keys = ['zone', 'ceo', 'wh', 'coo'];
  for (var i = 0; i < keys.length; i++) {
    if (String(appr[keys[i]] || '').indexOf('ไม่อนุมัติ') === 0) return STATUS.REJECTED;
  }
  var ok = function (k) { return String(appr[k] || '').indexOf('อนุมัติ') === 0; };
  return ok('ceo') && ok('coo') ? STATUS.CONFIRMED : STATUS.APPROVAL;
}

/**
 * ขั้นอนุมัติที่บทบาทนี้ทำได้ตอนนี้ (null = ยังไม่ถึงคิว / ทำไปแล้ว)
 * sequential = ส่งต่างจังหวัด: ผจก.เขต → คลังใส่ค่าขนส่ง/ยืนยันวัน → CEO → COO
 *   (CEO และ COO ตัดสินใจเมื่อเห็นค่าขนส่งของคลังแล้ว)
 * ไม่ sequential = ยอดต่ำนอกเส้นทาง: ฝั่งขาย ผจก.เขต → CEO และฝั่งคลัง คลัง → COO ทำพร้อมกัน
 */
function approvalStepFor_(role, appr, sequential) {
  var done = function (k) { return !!String(appr[k] || ''); };
  var ok = function (k) { return String(appr[k] || '').indexOf('อนุมัติ') === 0; };
  if (role === 'zone') return done('zone') ? null : 'zone';
  if (sequential) {
    var order = ['zone', 'wh', 'ceo', 'coo'], i = order.indexOf(role);
    if (i < 1 || done(role)) return null;
    return ok(order[i - 1]) ? role : null;
  }
  if (role === 'ceo') return done('zone') && !done('ceo') ? 'ceo' : null;
  if (role === 'wh') return done('wh') ? null : 'wh';
  if (role === 'coo') return done('wh') && !done('coo') ? 'coo' : null;
  return null;
}

/**
 * ประมาณการค่าใช้จ่ายออกรถส่งต่างจังหวัด (ตามใบแจ้งขอรอบรถส่งสินค้าลูกค้าต่างจังหวัด)
 * c: {roundTripKm, kmPerLiter, fuelPrice, depreciationPerKm, labor, toll, lodging, other, privateCost}
 * รวม = ①ค่าน้ำมัน + ②ค่าเสื่อม + ③ค่าแรง/OT/เบี้ยเลี้ยง + ④ทางด่วน + ⑤ที่พัก + ⑥อื่นๆ
 */
function upcountryCost_(c) {
  var n = function (v) { var x = Number(v); return x > 0 ? x : 0; };
  var km = n(c.roundTripKm), kmpl = n(c.kmPerLiter);
  var fuel = kmpl ? Math.round(km / kmpl * n(c.fuelPrice)) : 0;
  var depreciation = Math.round(km * n(c.depreciationPerKm));
  var total = fuel + depreciation + n(c.labor) + n(c.toll) + n(c.lodging) + n(c.other);
  var privateCost = n(c.privateCost);
  return { fuel: fuel, depreciation: depreciation, total: total,
    privateCost: privateCost, cheaperPrivate: privateCost > 0 && privateCost < total };
}

var THAI_DAYS =['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
var THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

/** '2026-10-20' → 'อ. 20 ต.ค. 69' */
function thaiDate_(ymd) {
  if (!ymd) return '';
  var p = String(ymd).split('-');
  return THAI_DAYS[weekday_(ymd)] + ' ' + (+p[2]) + ' ' + THAI_MONTHS[+p[1] - 1] + ' ' + String(+p[0] + 543).slice(2);
}

// ═════ Seed.gs ═════
/**
 * ข้อมูลตั้งต้น — ใช้ตอนรัน setup() ครั้งแรกเท่านั้น หลังจากนั้นแก้ในชีตโดยตรง
 * ที่มา: Memo HR-2026-091 (เขต), ชีต "ตารางขอรอบรถโกดัง" (รถ/รอบรถ/ชื่อพนักงาน),
 *        ชีต "ข้อมูล google maps / เวลาเปิด-ปิดร้าน" (ลิงก์แผนที่สาขา)
 */

/** [รหัส, ชื่อ, เขต, ผู้จัดการเขต, ลิงก์แผนที่, สถานะ, ชื่อบน Google Maps (ใช้ค้นหาถ้าลิงก์ไม่มีพิกัด)] */
function seedBranches_() {
  var Z1 = 'อธินันท์ วีระจิตต์ (อัฐ)', Z2 = 'จิรัฏฐ์ นาคปาน (เรย์)', Z3 = 'บุตรชญา แก้วแสง (ต่าย)',
    Z4 = 'อนุชา ชัยนิวัติ (โจ้)', Z5 = 'วันชัย ตรีโอสถ (ปุ้ม)';
  var g = 'https://maps.app.goo.gl/';
  var A = 'เปิด', C = 'ปิดแล้ว';
  return [
    ['00009', 'สามย่าน', 1, Z1, g + 'BYHCzLNXH1r9PcM86', A],
    ['00011', 'MBK', 1, Z1, g + '48p4yQTudLWde8y27', A],
    ['00020', 'สยามกิตติ์', 1, Z1, g + 'MvsMkKZf7SzSMY1o9', A],
    ['00019', 'พระราม 9', 1, Z1, g + 'Mre6QagjuCRvZBrB6', A],
    ['00034', 'เดอะไนน์ พระราม 9', 1, Z1, '', A],
    ['00005', 'สายสี่', 1, Z1, g + 'svgpwN9vvqYJ3THG9', A],
    ['00007', 'มหาสารคาม', 2, Z2, g + 'pQZ1eyMJitzcMjoH6', A],
    ['00014', 'โคราช', 2, Z2, g + 'dKsNygY4hpZWzm4x9', A],
    ['00029', 'ศาลายา', 2, Z2, g + 'oXfmCRv78NhFVTcR9', A],
    ['00042', 'หาดใหญ่', 2, Z2, '', A],
    ['00043', 'ซัสโก้ (พุทธบูชา)', 2, Z2, '', A],
    ['00032', 'ตลาดยิ่งเจริญ', 3, Z3, '', A],
    ['00036', 'ตลาดอมรพันธุ์', 3, Z3, '', A],
    ['00025', 'ลาซาล', 3, Z3, g + 'ap8SWDHqMdUABYqo7', A],
    ['00033', 'พาราไดซ์', 3, Z3, '', A],
    ['00038', 'Big C อ่อนนุช', 3, Z3, '', A],
    ['00006', 'อ้อมน้อย', 3, Z3, g + '7G6mNYPAW2EsoTqy8', A],
    ['00018', 'หัวหิน', 3, Z3, g + '36x97SavYKRCGXXb8', A],
    ['00000', 'ร้าน 2', 4, Z4, g + 'sy42KmtnZgTjDssu6', A],
    ['00001', 'ร้าน 3', 4, Z4, g + 'nJWJgv5CXrQiMZQCA', A],
    ['00013', 'เชียงใหม่', 4, Z4, g + 'TN7VYTRmRwBnsgCw6', A],
    ['00015', 'ราชพฤกษ์', 4, Z4, g + 'MUh48NEjMV9pFxNk8', A],
    ['00016', 'ไร่ขิง', 4, Z4, g + 'wzuQKoCczFtezpMX6', A],
    ['00017', 'กัลปพฤกษ์', 4, Z4, g + 'MnBpSSrBb6AiKwvu7', A],
    ['00031', 'บางใหญ่', 4, Z4, 'https://g.co/kgs/VxKaRbu', A],
    ['00039', 'ตลาดธนบุรี', 4, Z4, '', A],
    ['00021', 'โลตัสนอร์ธ', 5, Z5, g + 'Fm2hGQGTFANKysKo8', A],
    ['00008', 'รังสิต', 5, Z5, g + 'hC4onZ9oujrgjs3a6', A],
    ['00037', 'Mingle รังสิต', 5, Z5, '', A],
    ['00035', 'เดอะไนน์ ติวานนท์', 5, Z5, '', A],
    ['00024', 'ออนไลน์', 5, Z5, '', A],
    ['00027', 'คอสโม่', '', '', g + 'BDLdkpZnvahqc2Eq9', C],
    ['00028', 'ซีคอน', '', '', g + 'u7KAKkfF5QSiFNWd7', C],
    ['00030', 'พระราม 3', '', '', g + '3vJ9zJaG1wSvXufr7', C]
  ];
}

/** ชื่อเดิมที่พบในชีตเก่า → รหัสสาขา (ใช้ตอนย้ายประวัติ) */
function seedBranchAliases_() {
  return { 'สาย4': '00005', 'สมใจ2': '00000', 'สมใจ3': '00001', 'สยาม': '00020', 'นอร์ธ': '00021',
    'โลตัส': '00021', 'โลตัสนอร์ท': '00021', 'เดอะไนน์': '00034', 'ติวานนท์': '00035',
    'มิงเกิ้ล': '00037', 'พุทธบูชา': '00043', 'ซัสโก้': '00043', 'อมรพันธ์': '00036',
    'ยิ่งเจริญ': '00032', 'ตลาดธน': '00039', 'สารคาม': '00007' };
}

function seedTrucks_() {
  return [
    { plate: '3ฒจ 6064', aliases: ['3ฒ6064', '3ฒ 6064'], brand: 'ISUZU', driver: 'อำนวย อาจหาญ', crew: 'ธีระพงศ์ โกมลมุกสิทธิ์' },
    { plate: '2ฒช 9770', aliases: [], brand: '', driver: 'บุญมา ป้อมตะขบ', crew: '' },
    { plate: 'ถศ 6598', aliases: ['ถศ6568', 'ถศ 6568'], brand: 'TOYOTA', driver: 'ชวกร แน่นแคว้น (ชินจัง)', crew: '' },
    { plate: 'บห 1782', aliases: [], brand: 'ISUZU', driver: 'กิตติ สาคร', crew: 'กัณฑ์เอนก รอดกรณ์' },
    { plate: 'ฮบ 1373', aliases: [], brand: '', driver: 'ชาญวิทย์ สีสะอาด', crew: 'อุดมพร เจริญใส' },
    { plate: 'ถส 1114', aliases: [], brand: '', driver: '', crew: '' }
  ];
}

/**
 * ตารางรอบรถจากแท็บ "รอบรถ ใหม่" · weekday 1 = จันทร์ … 6 = เสาร์
 * slots = จำนวนจุดส่งลูกค้าที่รับได้ในรอบนั้น
 */
function seedSchedule_() {
  var eff = '2026-01-01';
  var rows = [];
  function both(plate, wdA, wdB, branches, slots) {
    [wdA, wdB].forEach(function (wd) {
      rows.push({ effectiveFrom: eff, plate: plate, weekday: wd, branches: branches, slots: slots });
    });
  }
  // 3ฒจ 6064 — อำนวย
  both('3ฒจ 6064', 1, 4, ['00017', '00043', '00015'], 3);
  both('3ฒจ 6064', 2, 5, ['00000', '00001', '00031'], 3);
  both('3ฒจ 6064', 3, 6, ['00029', '00039', '00021'], 3);
  // 2ฒช 9770 — บุญมา
  both('2ฒช 9770', 1, 4, ['00020', '00009', '00011'], 2);
  both('2ฒช 9770', 2, 5, ['00008', '00037', '00035'], 3);
  both('2ฒช 9770', 3, 6, ['00024'], 5);
  // ถศ 6598 — ชวกร
  both('ถศ 6598', 1, 4, ['00019', '00034'], 2);
  both('ถศ 6598', 2, 5, ['00016', '00006'], 5);
  rows.push({ effectiveFrom: eff, plate: 'ถศ 6598', weekday: 3, branches: ['00005'], slots: 5 });
  rows.push({ effectiveFrom: eff, plate: 'ถศ 6598', weekday: 6, branches: ['00018', '00014', '00007', '00013', '00042'], slots: 2 });
  // บห 1782 — กิตติ
  both('บห 1782', 1, 4, ['00025', '00033', '00038'], 2);
  both('บห 1782', 2, 5, ['00036', '00032'], 2);
  rows.push({ effectiveFrom: eff, plate: 'บห 1782', weekday: 3, branches: ['00018', '00014', '00007', '00013', '00042'], slots: 2 });
  rows.push({ effectiveFrom: eff, plate: 'บห 1782', weekday: 6, branches: ['00005'], slots: 5 });
  return rows;
}

/** [ชื่อ, รหัสสาขา] — รวมชื่อที่สะกดต่างกันจากชีตเดิม (เม.ย.–ต.ค. 69) ให้ตรวจอีกครั้ง */
function seedSalesStaff_() {
  var s = [];
  function add(code, names) { names.forEach(function (n) { s.push([n, code]); }); }
  add('00005', ['หน่อย', 'กบ', 'ผึ้ง', 'โบว์', 'กาน', 'เฟิร์น', 'ตง', 'พิมพ์', 'กัน', 'เนส', 'ฟร้อง', 'มิน']);
  add('00016', ['ป๊อป', 'เบ้นซ์', 'อาร์ต', 'เจา']);
  add('00015', ['แคท', 'ดา', 'วี', 'ก๊วย']);
  add('00021', ['แอ๊ด']);
  add('00008', ['พลอย']);
  add('00019', ['ท็อป', 'มอญ', 'มร']);
  add('00006', ['แพน']);
  add('00031', ['บอย']);
  add('00011', ['อ๋อม']);
  add('00009', ['น้อง']);
  add('00033', ['เต', 'กัน']);
  add('00037', ['แคท']);
  add('00025', ['ป้านุ้ย']);
  add('00035', ['บุ๊']);
  add('00043', ['แบงค์']);
  add('00029', ['แบงค์', 'สัก']);
  add('00036', ['เมย์', 'แบงค์']);
  add('00032', ['แบม']);
  add('00000', ['แตน']);
  add('00034', ['นัท']);
  add('00017', ['แจน']);
  return s;
}

function seedWarehouseStaff_() {
  return ['จรินทร มีเจริญ', 'ชาญวิทย์ สีสะอาด'];
}

// ═════ Db.gs ═════
/**
 * ชีตฐานข้อมูล — ทุกชีตใช้แถวที่ 1 เป็นหัวตาราง และอ่าน/เขียนตามลำดับคอลัมน์ที่กำหนดในนี้
 * (ห้ามสลับลำดับคอลัมน์ในชีต · เพิ่มคอลัมน์ใหม่ได้ที่ท้ายตารางเท่านั้น)
 */

var TZ = 'Asia/Bangkok';
var KIND_UP = 'ต่างจังหวัด';
var ROLE_BM = 'ผจก.สาขา';

var SHEET = {
  REQ: 'คำขอ',
  LOG: 'ประวัติการแก้ไข',
  BRANCH: 'สาขา',
  STAFF: 'พนักงาน',
  TRUCK: 'รถ',
  SCHED: 'ตารางรอบรถ',
  HOLIDAY: 'วันหยุด',
  TIER: 'ค่าส่ง',
  SETTING: 'ตั้งค่า',
  MAIL: 'อีเมลแจ้งเตือน'
};

/** [คีย์, หัวคอลัมน์ในชีต] */
var COLS = {};
COLS[SHEET.REQ] = [
  ['id', 'เลขคิว'], ['createdAt', 'เวลาที่ขอ'], ['requester', 'คนขอ'], ['branchCode', 'รหัสสาขา'],
  ['branchName', 'สาขา'], ['customer', 'ลูกค้า'], ['address', 'ที่อยู่'], ['mapsUrl', 'ลิงก์แผนที่'],
  ['lat', 'lat'], ['lng', 'lng'], ['province', 'จังหวัด'], ['distanceKm', 'ระยะทาง (กม.)'],
  ['qty', 'จำนวนสินค้า'], ['value', 'มูลค่าก่อน VAT'], ['trNo', 'เลขที่ TR'],
  ['feePolicy', 'ค่าส่งตามนโยบาย'], ['feeCharged', 'ค่าส่งที่เก็บ'], ['feeReason', 'เหตุผลค่าส่ง'],
  ['stock', 'ของอยู่ที่'], ['phone', 'เบอร์ผู้รับ'], ['timeWindow', 'เวลาสะดวกรับ'], ['note', 'หมายเหตุ'],
  ['lowMargin', 'กระดาษ/Low Margin'], ['urgent', 'นอกรอบ/ด่วน'], ['date', 'วันส่ง'], ['plate', 'ทะเบียนรถ'],
  ['driver', 'คนขับ'], ['onRoute', 'อยู่บนเส้นทาง'], ['needsApproval', 'ต้องอนุมัติ'], ['status', 'สถานะ'],
  ['apprZone', 'ผจก.เขต'], ['apprCeo', 'CEO'], ['apprWh', 'คลัง (อนุมัติ)'], ['apprCoo', 'COO'],
  ['reason', 'เหตุผลล่าสุด'], ['updatedAt', 'แก้ไขล่าสุด'], ['updatedBy', 'แก้ไขโดย'],
  ['legacy', 'ข้อมูลเก่า'], ['legacyText', 'ข้อความเดิม'],
  // ส่งต่างจังหวัด (เพิ่มท้ายตาราง — ห้ามย้ายขึ้นไป)
  ['kind', 'ประเภทงาน'], ['poNo', 'เลขที่ใบสั่งซื้อ'], ['grossProfit', 'กำไรขั้นต้น (บาท)'],
  ['grossProfitPct', 'กำไรขั้นต้น (%)'], ['productType', 'ประเภทสินค้า'], ['collectFee', 'เก็บค่าส่งลูกค้า'],
  ['whRoundTripKm', 'ระยะไป-กลับจากคลัง (กม.)'], ['cost', 'ประมาณการค่าใช้จ่าย (JSON)'], ['costTotal', 'รวมค่าใช้จ่ายประมาณการ'],
  ['branchManager', 'ผู้ขอรอบรถ (ผจก.สาขา)'],
  ['poFiles', 'รูปใบสั่งซื้อ (ไฟล์ใน Drive)']
];
COLS[SHEET.LOG] = [['ts', 'เวลา'], ['id', 'เลขคิว'], ['actor', 'ผู้ทำ'], ['action', 'การกระทำ'], ['detail', 'รายละเอียด']];
COLS[SHEET.BRANCH] = [
  ['code', 'รหัส'], ['name', 'ชื่อสาขา'], ['zone', 'เขต'], ['zoneManager', 'ผู้จัดการเขต'],
  ['mapsUrl', 'ลิงก์แผนที่'], ['status', 'สถานะ'], ['lat', 'lat'], ['lng', 'lng'], ['province', 'จังหวัด']
];
COLS[SHEET.STAFF] = [['name', 'ชื่อ'], ['branchCode', 'รหัสสาขา'], ['role', 'กลุ่ม'], ['status', 'สถานะ'], ['createdAt', 'เพิ่มเมื่อ']];
COLS[SHEET.TRUCK] = [['plate', 'ทะเบียน'], ['aliases', 'ทะเบียนที่เคยพิมพ์ (คั่นด้วย ,)'], ['brand', 'ยี่ห้อ'], ['driver', 'คนขับ'], ['crew', 'เด็กรถ']];
COLS[SHEET.SCHED] = [
  ['effectiveFrom', 'เริ่มใช้ (yyyy-mm-dd)'], ['plate', 'ทะเบียน'], ['weekday', 'วัน (1=จ. … 6=ส.)'],
  ['branches', 'รหัสสาขาที่แวะ ตามลำดับ (คั่นด้วย ,)'], ['slots', 'จำนวนจุดส่งลูกค้า']
];
COLS[SHEET.HOLIDAY] = [['date', 'วันที่ (yyyy-mm-dd)'], ['name', 'วันหยุด']];
COLS[SHEET.TIER] = [['minValue', 'ยอดซื้อตั้งแต่ (บาท)'], ['freeKm', 'ส่งฟรี (กม.)']];
COLS[SHEET.SETTING] = [['key', 'ค่า'], ['value', 'ตั้งเป็น'], ['note', 'คำอธิบาย']];
COLS[SHEET.MAIL] = [['group', 'กลุ่ม (ผจก.เขต / คลัง / CEO / COO)'], ['name', 'ชื่อ (ผจก.เขต ต้องตรงกับชีต สาขา)'], ['email', 'อีเมล (ว่าง = ไม่ส่ง · ใช้ Gmail ได้)']];

var DEFAULT_SETTINGS = [
  ['cutoffHour', 16, 'หลังเวลานี้ (ชั่วโมง) จองวันพรุ่งนี้ไม่ได้ · ใช้เป็นเวลาเลื่อนงานที่อนุมัติไม่ครบด้วย'],
  ['ratePer10Km', 120, 'ค่าส่งส่วนที่เกิน ทุก 10 กม. (กทม.และปริมณฑล)'],
  ['minValue', 3000, 'ยอดต่ำกว่านี้และอยู่นอกเส้นทาง ต้องอนุมัติ'],
  ['onRouteKm', 5, 'ห่างจากสาขาที่รถแวะไม่เกินกี่ กม. ถือว่าอยู่บนเส้นทาง'],
  ['horizonDays', 14, 'เปิดให้จองล่วงหน้ากี่วัน'],
  ['pilotBranches', '00005', 'รหัสสาขาที่เปิดใช้ (คั่นด้วย ,) · เว้นว่าง = ทุกสาขา'],
  ['ceoName', 'นพนารี พัวรัตนอรุณกร', 'CEO'],
  ['cooName', 'วิภวานี วิทยานนท์', 'COO'],
  ['upcountryRatePer10Km', 90, 'ค่าส่งส่วนที่เกิน ทุก 10 กม. (ต่างจังหวัด)'],
  ['upcountryLeadWorkDays', 5, 'ส่งต่างจังหวัด: ต้องขออนุมัติล่วงหน้าอย่างน้อยกี่วันทำการ (จ.–ส. ไม่นับวันหยุดในชีต วันหยุด)'],
  ['approvalLeadWorkDays', 3, 'กรุงเทพฯ/ปริมณฑล งานที่ต้องอนุมัติ (ยอดต่ำนอกเส้นทาง): ต้องขอล่วงหน้าอย่างน้อยกี่วันทำการ'],
  ['warehouseLocation', '', 'พิกัดคลัง "lat,lng" หรือลิงก์ Google Maps — ใช้คำนวณระยะไป-กลับส่งต่างจังหวัด'],
  ['kmPerLiter', 8, 'อัตราสิ้นเปลืองน้ำมันตั้งต้น (กม./ลิตร)'],
  ['fuelPrice', 33, 'ราคาน้ำมันตั้งต้น (บาท/ลิตร)'],
  ['depreciationPerKm', 5, 'ค่าเสื่อมรถ (บาท/กม.)'],
  ['ceoEmail', '', 'อีเมล CEO — ใส่แล้วระบบส่งอีเมลพร้อมปุ่มอนุมัติเมื่อถึงคิว CEO (เว้นว่าง = ไม่ส่ง)'],
  ['cooEmail', '', 'อีเมล COO — ใส่แล้วระบบส่งอีเมลพร้อมปุ่มอนุมัติเมื่อถึงคิว COO (เว้นว่าง = ไม่ส่ง)']
];

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function sheet_(name) {
  var sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('ไม่พบชีต "' + name + '" — ให้ผู้ดูแลรัน setup()');
  return sh;
}

function keys_(name) { return COLS[name].map(function (c) { return c[0]; }); }

/** อ่านทั้งชีตเป็นอ็อบเจกต์ (มี _row = เลขแถวในชีต) */
function readAll_(name) {
  var sh = sheet_(name);
  var n = sh.getLastRow() - 1;
  if (n < 1) return [];
  var keys = keys_(name);
  return sh.getRange(2, 1, n, keys.length).getValues().map(function (r, i) {
    var o = { _row: i + 2 };
    keys.forEach(function (k, j) { o[k] = r[j] instanceof Date ? ymd_(r[j]) : r[j]; });
    return o;
  });
}

function toRow_(name, obj) {
  return keys_(name).map(function (k) { return obj[k] === undefined || obj[k] === null ? '' : obj[k]; });
}

function append_(name, obj) {
  sheet_(name).appendRow(toRow_(name, obj));
}

function writeRow_(name, obj) {
  sheet_(name).getRange(obj._row, 1, 1, keys_(name).length).setValues([toRow_(name, obj)]);
}

function ymd_(d) { return Utilities.formatDate(d, TZ, 'yyyy-MM-dd'); }
function nowStr_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm'); }
function nowHour_() { return Number(Utilities.formatDate(new Date(), TZ, 'H')); }

function settings_() {
  var s = {};
  readAll_(SHEET.SETTING).forEach(function (r) { s[r.key] = r.value; });
  DEFAULT_SETTINGS.forEach(function (d) { if (s[d[0]] === undefined || s[d[0]] === '') s[d[0]] = d[1]; });
  ['cutoffHour', 'ratePer10Km', 'minValue', 'onRouteKm', 'horizonDays', 'upcountryRatePer10Km', 'upcountryLeadWorkDays', 'approvalLeadWorkDays',
    'kmPerLiter', 'fuelPrice', 'depreciationPerKm'].forEach(function (k) { s[k] = Number(s[k]); });
  return s;
}

function tiers_() {
  var t = readAll_(SHEET.TIER).map(function (r) { return [Number(r.minValue), Number(r.freeKm)]; })
    .filter(function (r) { return r[0] > 0; });
  t.sort(function (a, b) { return a[0] - b[0]; });
  return t.length ? t : DEFAULT_TIERS;
}

function branches_() {
  return readAll_(SHEET.BRANCH).map(function (b) {
    b.code = padCode_(b.code); b.lat = Number(b.lat) || null; b.lng = Number(b.lng) || null;
    return b;
  });
}

function branchMap_() {
  var m = {};
  branches_().forEach(function (b) { m[b.code] = b; });
  return m;
}

function trucks_() {
  return readAll_(SHEET.TRUCK).map(function (t) {
    return { plate: String(t.plate), aliases: String(t.aliases || '').split(',').map(function (s) { return s.trim(); }).filter(String),
      driver: t.driver, crew: t.crew };
  });
}

function schedule_() {
  return readAll_(SHEET.SCHED).map(function (r) {
    return { effectiveFrom: String(r.effectiveFrom), plate: String(r.plate), weekday: Number(r.weekday),
      branches: String(r.branches).split(',').map(function (s) { return s.trim(); }).filter(String),
      slots: Number(r.slots) || 0 };
  }).filter(function (r) { return r.plate && r.weekday; });
}

function holidays_() {
  var h = {};
  readAll_(SHEET.HOLIDAY).forEach(function (r) { if (r.date) h[String(r.date)] = r.name || true; });
  return h;
}

function requests_() {
  return readAll_(SHEET.REQ).filter(function (r) { return r.id; });
}

function findRequest_(id) {
  var r = requests_().filter(function (x) { return x.id === id; })[0];
  if (!r) throw new Error('ไม่พบคำขอ ' + id);
  return r;
}

/** จำนวนงานที่กันที่ในแต่ละรอบ {วันที่|ทะเบียน: n} */
function usedSlots_(reqs, excludeId) {
  var used = {};
  reqs.forEach(function (r) {
    if (r.id === excludeId || !r.date || !r.plate || r.urgent === true || r.legacy === true || r.kind === KIND_UP) return;
    if (HOLDING_STATUSES.indexOf(r.status) === -1) return;
    var k = slotKey_(String(r.date), String(r.plate));
    used[k] = (used[k] || 0) + 1;
  });
  return used;
}

function log_(id, actor, action, detail) {
  append_(SHEET.LOG, { ts: nowStr_(), id: id, actor: actor, action: action, detail: detail || '' });
}

/** เลขคิว Q69-10-0001 (ปี พ.ศ. 2 หลัก-เดือน-ลำดับในเดือน) — เรียกภายใน lock เท่านั้น */
function nextId_() {
  var now = new Date();
  var be = Number(Utilities.formatDate(now, TZ, 'yyyy')) + 543;
  var prefix = 'Q' + String(be).slice(2) + '-' + Utilities.formatDate(now, TZ, 'MM') + '-';
  var props = PropertiesService.getScriptProperties();
  var key = 'seq_' + prefix;
  var n = Number(props.getProperty(key) || 0) + 1;
  props.setProperty(key, String(n));
  return prefix + ('000' + n).slice(-4);
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('ระบบกำลังบันทึกคำขออื่นอยู่ กรุณาลองใหม่อีกครั้ง');
  try { return fn(); } finally { lock.releaseLock(); }
}

// ═════ Maps.gs ═════
/**
 * หาพิกัด จังหวัด และระยะทางขับรถ ด้วยบริการ Maps ที่มากับ Apps Script
 * ผลลัพธ์เก็บแคชไว้ 6 ชั่วโมง เพื่อไม่ให้เปลืองโควตา
 */

/** ตามลิงก์ย่อ (maps.app.goo.gl, goo.gl, g.co) ไปจนถึง URL จริง */
function expandUrl_(url) {
  var u = String(url || '').trim();
  for (var i = 0; i < 5; i++) {
    if (!/^https?:\/\/(maps\.app\.goo\.gl|goo\.gl|g\.co)\//.test(u)) break;
    var res = UrlFetchApp.fetch(u, { followRedirects: false, muteHttpExceptions: true });
    var loc = res.getHeaders()['Location'] || res.getHeaders()['location'];
    if (!loc) break;
    u = loc;
  }
  return u;
}

function geocodeText_(text) {
  var r = Maps.newGeocoder().setRegion('th').setLanguage('th').geocode(text);
  if (r.status !== 'OK' || !r.results.length) return null;
  var loc = r.results[0].geometry.location;
  return { lat: loc.lat, lng: loc.lng };
}

function provinceOf_(lat, lng) {
  var r = Maps.newGeocoder().setLanguage('th').reverseGeocode(lat, lng);
  if (r.status !== 'OK') return { province: '', formatted: '' };
  var province = '';
  r.results.some(function (res) {
    return res.address_components.some(function (c) {
      if (c.types.indexOf('administrative_area_level_1') !== -1) { province = c.long_name; return true; }
      return false;
    });
  });
  return { province: province, formatted: r.results[0] ? r.results[0].formatted_address : '' };
}

/** หาพิกัดจากลิงก์แผนที่ก่อน ถ้าไม่ได้ค่อยค้นหาจากที่อยู่/ชื่อ */
function locate_(mapsUrl, address) {
  var key = 'loc_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(
    Utilities.DigestAlgorithm.MD5, String(mapsUrl) + '|' + String(address)));
  var cache = CacheService.getScriptCache();
  var hit = cache.get(key);
  if (hit) return JSON.parse(hit);

  var pos = null;
  if (mapsUrl) {
    var full = expandUrl_(mapsUrl);
    pos = parseLatLng_(full);
    if (!pos) {
      var place = full.match(/\/maps\/place\/([^/@]+)/) || full.match(/[?&]q=([^&]+)/);
      if (place) pos = geocodeText_(decodeURIComponent(place[1].replace(/\+/g, ' ')));
    }
  }
  if (!pos && address) pos = parseLatLng_(address) || geocodeText_(address);
  if (!pos) return null;
  var p = provinceOf_(pos.lat, pos.lng);
  var out = { lat: pos.lat, lng: pos.lng, province: p.province, formatted: p.formatted };
  cache.put(key, JSON.stringify(out), 21600);
  return out;
}

/** ระยะทางขับรถ (กม. ทศนิยม 1 ตำแหน่ง) */
function drivingKm_(from, to) {
  var key = ['km', from.lat, from.lng, to.lat, to.lng].join('_');
  var cache = CacheService.getScriptCache();
  var hit = cache.get(key);
  if (hit) return Number(hit);
  var d = Maps.newDirectionFinder().setOrigin(from.lat, from.lng).setDestination(to.lat, to.lng)
    .setMode(Maps.DirectionFinder.Mode.DRIVING).setRegion('th').getDirections();
  if (!d.routes || !d.routes.length) throw new Error('หาเส้นทางขับรถไม่ได้ กรุณาตรวจลิงก์แผนที่');
  var km = Math.round(d.routes[0].legs[0].distance.value / 100) / 10;
  cache.put(key, String(km), 21600);
  return km;
}

/** รันจากเมนู: เติมพิกัดสาขาที่ยังว่างจากลิงก์แผนที่ (หรือชื่อร้านบน Google Maps) */
function updateBranchCoords() {
  var updated = [], failed = [];
  readAll_(SHEET.BRANCH).forEach(function (b) {
    if (Number(b.lat) && Number(b.lng)) return;
    var loc = null;
    try {
      loc = locate_(b.mapsUrl, 'ร้านสมใจ สาขา ' + b.name + ' (' + b.code + ')');
    } catch (e) { /* ข้ามไป รายงานด้านล่าง */ }
    if (!loc) { failed.push(b.code + ' ' + b.name); return; }
    b.lat = loc.lat; b.lng = loc.lng; b.province = loc.province;
    writeRow_(SHEET.BRANCH, b);
    updated.push(b.code + ' ' + b.name);
  });
  var msg = 'เติมพิกัดแล้ว ' + updated.length + ' สาขา' +
    (failed.length ? '\nหาไม่เจอ (ใส่ lat/lng เองในชีต "สาขา"): ' + failed.join(', ') : '');
  Logger.log(msg);
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { /* รันจากตัวแก้ไขสคริปต์ */ }
}

// ═════ Auth.gs ═════
/**
 * PIN แยกตามกลุ่ม เก็บใน Script Properties (PIN_WH, PIN_ZONE, PIN_CEO, PIN_COO)
 * ตั้ง/เปลี่ยนด้วยฟังก์ชัน setPins() ในตัวแก้ไขสคริปต์ — ไม่มี PIN อยู่ในโค้ด
 *
 * เว็บเปิดให้ทุกคนที่มีลิงก์ จึงล็อกการใส่ PIN ทั้งระบบ 15 นาที เมื่อผิดเกิน 10 ครั้งใน 15 นาที
 */

var ROLES = { wh: 'คลัง', zone: 'ผจก.เขต', ceo: 'CEO', coo: 'COO' };

function requireRole_(role, pin) {
  if (!ROLES[role]) throw new Error('ไม่รู้จักกลุ่มผู้ใช้');
  var cache = CacheService.getScriptCache();
  var fails = Number(cache.get('pin_fails') || 0);
  if (fails >= 10) throw new Error('ใส่ PIN ผิดหลายครั้ง ระบบล็อกไว้ 15 นาที');
  var expected = PropertiesService.getScriptProperties().getProperty('PIN_' + role.toUpperCase());
  if (!expected || String(pin || '').trim().toLowerCase() !== expected.toLowerCase()) {
    cache.put('pin_fails', String(fails + 1), 900);
    throw new Error('PIN ไม่ถูกต้อง');
  }
}

/**
 * รันจากตัวแก้ไขสคริปต์ครั้งแรก แล้วแก้ค่าในนี้ก่อนรัน — อย่า commit PIN จริงกลับเข้า git
 * PIN เป็นตัวอักษรเท่านั้น (อังกฤษหรือไทย) อย่างน้อย 6 ตัว · ไม่สนตัวพิมพ์เล็ก/ใหญ่
 */
function setPins() {
  var pins = {
    PIN_WH: '',    // คลัง (จรินทร, ชาญวิทย์)
    PIN_ZONE: '',  // ผู้จัดการเขต
    PIN_CEO: '',
    PIN_COO: ''
  };
  var props = PropertiesService.getScriptProperties();
  Object.keys(pins).forEach(function (k) {
    if (!/^[A-Za-z\u0E01-\u0E4E]{6,}$/.test(pins[k])) throw new Error(k + ' ต้องเป็นตัวอักษรเท่านั้น อย่างน้อย 6 ตัว (ห้ามมีตัวเลขหรือช่องว่าง)');
    props.setProperty(k, pins[k]);
  });
  Logger.log('ตั้ง PIN เรียบร้อย');
}

/** โทเคนสำหรับลิงก์ใบงานบนมือถือคนขับ (อ่านอย่างเดียว ผูกกับวันที่+ทะเบียน) */
function sheetToken_(date, plate) {
  var props = PropertiesService.getScriptProperties();
  var secret = props.getProperty('SHEET_SECRET');
  if (!secret) { secret = Utilities.getUuid(); props.setProperty('SHEET_SECRET', secret); }
  var sig = Utilities.computeHmacSha256Signature(date + '|' + plate, secret);
  return Utilities.base64EncodeWebSafe(sig).slice(0, 22);
}

// ═════ Api.gs ═════
/**
 * ฟังก์ชันที่หน้าเว็บเรียกผ่าน google.script.run
 * ฟังก์ชันที่ไม่ลงท้ายด้วย _ ทุกตัวเรียกได้จากใครก็ได้ที่มีลิงก์ —
 * งานของคลัง/ผู้อนุมัติต้องผ่าน requireRole_() ก่อนเสมอ
 */

var STOCK_OPTIONS = ['โกดัง', 'สาขา', 'ทั้งโกดังและสาขา'];

function today_() { return ymd_(new Date()); }

/** รหัสสาขา 5 หลัก — ชีตมักตัดเลข 0 ข้างหน้า (00005 → 5) */
function padCode_(c) {
  c = String(c === undefined || c === null ? '' : c).trim();
  return /^\d{1,4}$/.test(c) ? ('00000' + c).slice(-5) : c;
}

function pilotCodes_(s) {
  return String(s.pilotBranches || '').split(',').map(padCode_).filter(String);
}

function bookableBranch_(b, s) {
  var pilot = pilotCodes_(s);
  return b && b.status === 'เปิด' && (!pilot.length || pilot.indexOf(b.code) !== -1);
}

function clean_(v, max) { return String(v === undefined || v === null ? '' : v).trim().slice(0, max || 300); }

// ───────────────────────────── หน้าขอคิว (ไม่ต้องใช้ PIN) ─────────────────────────────

function getBootstrap() {
  var s = settings_();
  var branches = branches_();
  var staff = readAll_(SHEET.STAFF);
  return {
    today: today_(),
    settings: { cutoffHour: s.cutoffHour, ratePer10Km: s.ratePer10Km, minValue: s.minValue, tiers: tiers_(),
      upcountryRatePer10Km: s.upcountryRatePer10Km, kmPerLiter: s.kmPerLiter, fuelPrice: s.fuelPrice,
      depreciationPerKm: s.depreciationPerKm, upcountryLeadWorkDays: s.upcountryLeadWorkDays, approvalLeadWorkDays: s.approvalLeadWorkDays },
    branches: branches.filter(function (b) { return b.status === 'เปิด'; })
      .sort(function (a, b) { return a.code < b.code ? -1 : a.code > b.code ? 1 : 0; }).map(function (b) {
      return { code: b.code, name: b.name, zone: b.zone, zoneManager: b.zoneManager, bookable: bookableBranch_(b, s), hasCoords: !!(b.lat && b.lng) };
    }),
    sales: staff.filter(function (p) { return (p.role === 'ขาย' || p.role === ROLE_BM) && p.status !== 'ปิด'; })
      .map(function (p) { return { name: p.name, branchCode: padCode_(p.branchCode), manager: p.role === ROLE_BM }; }),
    warehouse: staff.filter(function (p) { return p.role === 'คลัง' && p.status !== 'ปิด'; }).map(function (p) { return p.name; }),
    zoneManagers: branches.reduce(function (a, b) { if (b.zoneManager && a.indexOf(b.zoneManager) === -1) a.push(b.zoneManager); return a; }, []),
    stockOptions: STOCK_OPTIONS
  };
}

/** คนที่ยังไม่มีชื่อในรายการ เพิ่มชื่อตัวเอง (ขึ้นป้าย "ใหม่" ให้คลังตรวจ) · role: 'ขาย' (ค่าเริ่มต้น) หรือ 'ผจก.สาขา' */
function addMyName(name, branchCode, role) {
  name = clean_(name, 60);
  branchCode = padCode_(clean_(branchCode, 10));
  role = role === ROLE_BM ? ROLE_BM : 'ขาย';
  if (!name) throw new Error('กรุณาใส่ชื่อ');
  if (!branchMap_()[branchCode]) throw new Error('ไม่พบสาขา');
  return withLock_(function () {
    var dup = readAll_(SHEET.STAFF).some(function (p) { return p.name === name && padCode_(p.branchCode) === branchCode && p.role === role; });
    if (!dup) append_(SHEET.STAFF, { name: name, branchCode: branchCode, role: role, status: 'ใหม่', createdAt: nowStr_() });
    return { name: name, branchCode: branchCode, manager: role === ROLE_BM };
  });
}

/**
 * คำนวณก่อนส่ง: พิกัด ระยะทาง ค่าส่งตามนโยบาย และรอบที่จองได้
 * q: {branchCode, mapsUrl, address, value}
 */
function quote(q) {
  var s = settings_();
  var bmap = branchMap_();
  var branch = bmap[clean_(q.branchCode, 10)];
  if (!bookableBranch_(branch, s)) throw new Error('สาขานี้ยังไม่เปิดใช้ระบบขอคิว');
  if (!branch.lat || !branch.lng) throw new Error('สาขานี้ยังไม่มีพิกัด แจ้งผู้ดูแลระบบให้เติมในชีต "สาขา"');
  var mapsUrl = clean_(q.mapsUrl, 500), address = clean_(q.address, 300);
  if (!mapsUrl && !address) throw new Error('กรุณาใส่ลิงก์ Google Maps หรือที่อยู่ลูกค้า');

  var loc = locate_(mapsUrl, address);
  if (!loc) throw new Error('หาตำแหน่งลูกค้าไม่เจอ ลองวางลิงก์ Google Maps ที่กดแชร์จากหมุดของลูกค้า');
  var metro = isMetro_(loc.province);
  var km = drivingKm_(branch, loc);
  var value = Number(q.value) || 0;

  var rate = metro ? s.ratePer10Km : s.upcountryRatePer10Km;
  var rounds = !metro ? [] : bookableRounds_({
    branchCode: branch.code, schedule: schedule_(), holidays: holidays_(),
    nowYmd: today_(), nowHour: nowHour_(), cutoffHour: s.cutoffHour,
    horizonDays: s.horizonDays, used: usedSlots_(requests_())
  }).map(function (r) {
    var onRoute = isOnRoute_(loc.lat, loc.lng, r.branches.map(function (c) { return bmap[c]; }), s.onRouteKm);
    return { date: r.date, plate: r.plate, left: r.left, slots: r.slots, onRoute: onRoute,
      needsApproval: needsApproval_(value, onRoute, s.minValue), label: thaiDate_(r.date) };
  });

  var hol = holidays_();
  var urgentEarliest = earliestDate_(today_(), nowHour_(), s.cutoffHour);
  var approvalEarliest = addWorkDays_(today_(), s.approvalLeadWorkDays, hol);
  if (approvalEarliest < urgentEarliest) approvalEarliest = urgentEarliest;
  rounds.forEach(function (r) { r.tooSoon = r.needsApproval && r.date < approvalEarliest; });
  return {
    lat: loc.lat, lng: loc.lng, province: loc.province, formatted: loc.formatted, metro: metro,
    distanceKm: km, freeKm: freeKm_(value, tiers_()), feePolicy: policyFee_(km, value, tiers_(), rate), ratePer10Km: rate,
    rounds: rounds, urgentEarliest: urgentEarliest,
    approvalEarliest: approvalEarliest, approvalLeadWorkDays: s.approvalLeadWorkDays,
    upcountryEarliest: addWorkDays_(today_(), s.upcountryLeadWorkDays, hol), upcountryLeadWorkDays: s.upcountryLeadWorkDays
  };
}

/** บันทึกคำขอ — คำนวณทุกอย่างซ้ำฝั่งเซิร์ฟเวอร์ ไม่เชื่อตัวเลขจากหน้าเว็บ */
function submitRequest(f) {
  var s = settings_();
  var requester = clean_(f.requester, 40);
  var customer = clean_(f.customer, 200);
  var qty = clean_(f.qty, 100);
  var value = Number(f.value);
  var stock = clean_(f.stock, 30);
  if (!requester) throw new Error('กรุณาเลือกชื่อคนขอ');
  if (!customer) throw new Error('กรุณาใส่ชื่อลูกค้า');
  if (!qty) throw new Error('กรุณาใส่จำนวนสินค้า');
  if (!(value > 0)) throw new Error('กรุณาใส่มูลค่าสินค้า (ก่อน VAT)');
  if (STOCK_OPTIONS.indexOf(stock) === -1) throw new Error('กรุณาเลือกว่าของอยู่ที่ไหน');

  var po = decodePoFiles_(f.poFiles);
  var q = quote({ branchCode: f.branchCode, mapsUrl: f.mapsUrl, address: f.address, value: value });
  checkArea_(f.area, q);
  if (!q.metro) return submitUpcountry_(f, q, s, po);

  var lowMargin = f.lowMargin === true;
  var feeCharged = f.feeCharged === '' || f.feeCharged === undefined ? q.feePolicy : Number(f.feeCharged);
  if (!(feeCharged >= 0)) throw new Error('ค่าส่งไม่ถูกต้อง');
  var feeReason = clean_(f.feeReason, 200);
  if (!lowMargin && feeCharged < q.feePolicy && !feeReason) {
    throw new Error('เก็บค่าส่งต่ำกว่านโยบาย (' + q.feePolicy + ' บาท) กรุณาใส่เหตุผล');
  }

  return withLock_(function () {
    var urgent = f.urgent === true;
    var date, plate = '', onRoute = false;
    if (urgent) {
      date = clean_(f.date, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < q.urgentEarliest) throw new Error('วันส่งด่วนต้องไม่ก่อน ' + thaiDate_(q.urgentEarliest));
      if (holidays_()[date] || weekday_(date) === 0) throw new Error('วันที่เลือกเป็นวันหยุด');
    } else {
      // จำนวนที่ว่างต้องคำนวณใหม่ภายใน lock
      var fresh = quote({ branchCode: f.branchCode, mapsUrl: f.mapsUrl, address: f.address, value: value });
      var round = fresh.rounds.filter(function (r) { return r.date === f.date && r.plate === f.plate; })[0];
      if (!round) throw new Error('รอบที่เลือกจองไม่ได้แล้ว กรุณาเลือกวันใหม่');
      if (round.left <= 0) throw new Error('รอบ ' + round.label + ' เต็มแล้ว กรุณาเลือกวันอื่น');
      date = round.date; plate = round.plate; onRoute = round.onRoute;
    }
    var needsApproval = needsApproval_(value, onRoute, s.minValue);
    if (needsApproval && date < q.approvalEarliest) {
      throw new Error('งานที่ต้องอนุมัติต้องขอล่วงหน้าอย่างน้อย ' + s.approvalLeadWorkDays + ' วันทำการ — เลือกวันส่งได้ตั้งแต่ ' + thaiDate_(q.approvalEarliest));
    }
    var truck = trucks_().filter(function (t) { return t.plate === plate; })[0];
    var branch = branchMap_()[f.branchCode];
    var rec = {
      id: nextId_(), createdAt: nowStr_(), requester: requester, branchCode: branch.code, branchName: branch.name,
      customer: customer, address: clean_(f.address, 300) || q.formatted, mapsUrl: clean_(f.mapsUrl, 500),
      lat: q.lat, lng: q.lng, province: q.province, distanceKm: q.distanceKm, qty: qty, value: value,
      trNo: clean_(f.trNo, 40), feePolicy: lowMargin ? '' : q.feePolicy, feeCharged: feeCharged, feeReason: feeReason,
      stock: stock, phone: clean_(f.phone, 40), timeWindow: clean_(f.timeWindow, 100), note: clean_(f.note, 500),
      lowMargin: lowMargin, urgent: urgent, date: date, plate: plate, driver: truck ? truck.driver : '',
      onRoute: onRoute, needsApproval: needsApproval,
      status: needsApproval ? STATUS.APPROVAL : STATUS.PENDING,
      updatedAt: nowStr_(), updatedBy: requester, legacy: false
    };
    rec.poFiles = po.length ? JSON.stringify(storePoFiles_(rec.id, po)) : '';
    append_(SHEET.REQ, rec);
    if (needsApproval) notifyNext_(rec, null);
    log_(rec.id, requester, 'ส่งคำขอ', thaiDate_(date) + (plate ? ' · ' + plate : ' · นอกรอบ/ด่วน') +
      (needsApproval ? ' · ต้องอนุมัติ' : ''));
    return { id: rec.id, status: rec.status, date: date, dateLabel: thaiDate_(date) };
  });
}

/** กล่องที่สาขาเลือก (กรุงเทพฯ/ปริมณฑล หรือ ต่างจังหวัด) ต้องตรงกับจังหวัดที่ระบบหาได้จากที่อยู่ลูกค้า */
function checkArea_(area, q) {
  if (area !== 'metro' && area !== 'up') throw new Error('กรุณาเลือกว่าส่งลูกค้า กรุงเทพฯ และปริมณฑล หรือ ต่างจังหวัด');
  if ((area === 'metro') !== q.metro) {
    throw new Error('ลูกค้าอยู่ ' + (q.province || 'จังหวัดที่ตรวจไม่ได้') + ' ซึ่งเป็น' + (q.metro ? 'กรุงเทพฯ และปริมณฑล' : 'ต่างจังหวัด') +
      ' แต่เลือกไว้เป็น' + (area === 'metro' ? 'กรุงเทพฯ และปริมณฑล' : 'ต่างจังหวัด') + ' กรุณาเลือกใหม่ หรือตรวจลิงก์แผนที่');
  }
}

/**
 * ขอรอบรถส่งลูกค้าต่างจังหวัด (แทนใบแจ้งกระดาษ ตาม MEMO COO009/69)
 * อนุมัติตามลำดับ: ผจก.เขต → คลังใส่ค่าขนส่ง/ยืนยันวัน → CEO → COO
 */
function submitUpcountry_(f, q, s, po) {
  var requester = clean_(f.requester, 40);
  var productType = clean_(f.productType, 100);
  var phone = clean_(f.phone, 40);
  var gp = f.grossProfit === '' || f.grossProfit === undefined ? NaN : Number(f.grossProfit);
  var bm = clean_(f.branchManager, 60);
  var bmOk = readAll_(SHEET.STAFF).some(function (p) {
    return p.role === ROLE_BM && p.status !== 'ปิด' && p.name === bm && padCode_(p.branchCode) === padCode_(f.branchCode);
  });
  if (!bm || !bmOk) throw new Error('กรุณาเลือกผู้จัดการสาขาที่เป็นผู้ขอรอบรถ');
  if (!productType) throw new Error('กรุณาใส่ประเภทสินค้า');
  if (!phone) throw new Error('กรุณาใส่เบอร์ติดต่อลูกค้า');
  if (!(gp >= 0)) throw new Error('กรุณาใส่กำไรขั้นต้น (บาท)');
  if (!po || !po.length) throw new Error('ส่งต่างจังหวัดต้องแนบใบสั่งซื้ออย่างน้อย 1 ไฟล์ (รูปหรือ PDF)');
  var date = clean_(f.date, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < q.upcountryEarliest) {
    throw new Error('ส่งต่างจังหวัดต้องขออนุมัติล่วงหน้าอย่างน้อย ' + s.upcountryLeadWorkDays + ' วันทำการ — เลือกวันได้ตั้งแต่ ' + thaiDate_(q.upcountryEarliest));
  }
  if (holidays_()[date] || weekday_(date) === 0) throw new Error('วันที่เลือกเป็นวันหยุด');
  var collect = f.collectFee !== false;
  var lowMargin = f.lowMargin === true;
  var feeCharged = !collect ? 0 : (f.feeCharged === '' || f.feeCharged === undefined ? q.feePolicy : Number(f.feeCharged));
  if (!(feeCharged >= 0)) throw new Error('ค่าส่งไม่ถูกต้อง');
  var feeReason = clean_(f.feeReason, 200);
  if (!lowMargin && feeCharged < q.feePolicy && !feeReason) {
    throw new Error('เก็บค่าส่งต่ำกว่านโยบาย (' + q.feePolicy + ' บาท) กรุณาใส่เหตุผล');
  }
  var whKm = '';
  var wh = parseLatLng_(s.warehouseLocation) || (s.warehouseLocation ? locate_(String(s.warehouseLocation), '') : null);
  if (wh) { try { whKm = Math.round(drivingKm_(wh, q) * 2 * 10) / 10; } catch (e) { whKm = ''; } }
  var value = Number(f.value);
  return withLock_(function () {
    var branch = branchMap_()[f.branchCode];
    var rec = {
      id: nextId_(), createdAt: nowStr_(), requester: requester, branchCode: branch.code, branchName: branch.name,
      customer: clean_(f.customer, 200), address: clean_(f.address, 300) || q.formatted, mapsUrl: clean_(f.mapsUrl, 500),
      lat: q.lat, lng: q.lng, province: q.province, distanceKm: q.distanceKm, qty: clean_(f.qty, 100), value: value,
      trNo: clean_(f.trNo, 40), feePolicy: lowMargin ? '' : q.feePolicy, feeCharged: feeCharged, feeReason: feeReason,
      stock: clean_(f.stock, 30), phone: phone, timeWindow: clean_(f.timeWindow, 100), note: clean_(f.note, 500),
      lowMargin: lowMargin, urgent: false, date: date, plate: '', driver: '', onRoute: false, needsApproval: true,
      status: STATUS.APPROVAL, updatedAt: nowStr_(), updatedBy: requester, legacy: false,
      kind: KIND_UP, poNo: clean_(f.poNo, 40), grossProfit: gp,
      grossProfitPct: value > 0 ? Math.round(gp / value * 1000) / 10 : '', productType: productType,
      collectFee: collect, whRoundTripKm: whKm, branchManager: bm
    };
    rec.poFiles = po && po.length ? JSON.stringify(storePoFiles_(rec.id, po)) : '';
    append_(SHEET.REQ, rec);
    notifyNext_(rec, null);
    log_(rec.id, requester, 'ขอรอบรถต่างจังหวัด', 'ผู้ขอ ' + bm + ' · ' + q.province + ' · ' + q.distanceKm + ' กม. · เสนอวัน ' + thaiDate_(date));
    return { id: rec.id, status: rec.status, date: date, dateLabel: thaiDate_(date) };
  });
}

/** คำขอของสาขา: ย้อนหลัง 30 วันและล่วงหน้า */
function branchRequests(branchCode) {
  var from = addDays_(today_(), -30);
  return requests_().filter(function (r) {
    return String(r.branchCode) === String(branchCode) && r.legacy !== true && String(r.date) >= from;
  }).map(publicView_).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
}

function publicView_(r) {
  return { id: r.id, requester: r.requester, customer: r.customer, qty: r.qty, date: String(r.date),
    dateLabel: thaiDate_(String(r.date)), plate: r.plate, status: r.status, reason: r.reason,
    feeCharged: r.feeCharged, urgent: r.urgent === true, needsApproval: r.needsApproval === true,
    upcountry: r.kind === KIND_UP, province: r.province, branchManager: r.branchManager || '', formUrl: r.kind === KIND_UP ? formUrl_(r.id) : '',
    poCount: poFilesOf_(r).length, poUrl: poFilesOf_(r).length ? poUrl_(r.id) : '',
    approvals: { zone: r.apprZone, ceo: r.apprCeo, wh: r.apprWh, coo: r.apprCoo } };
}

/** คนขอยกเลิกได้เฉพาะงานที่ยังไม่ยืนยัน */
function cancelMine(id, actor) {
  actor = clean_(actor, 40);
  if (!actor) throw new Error('กรุณาเลือกชื่อก่อนยกเลิก');
  return withLock_(function () {
    var r = findRequest_(id);
    if ([STATUS.PENDING, STATUS.APPROVAL].indexOf(r.status) === -1) {
      throw new Error('ยกเลิกเองไม่ได้ เพราะคลังยืนยันแล้ว กรุณาติดต่อคลัง');
    }
    r.status = STATUS.CANCELLED; r.reason = 'คนขอยกเลิก'; r.updatedAt = nowStr_(); r.updatedBy = actor;
    writeRow_(SHEET.REQ, r);
    log_(id, actor, 'ยกเลิก (คนขอ)', '');
    return publicView_(r);
  });
}

// ───────────────────────────── คลัง / ผู้อนุมัติ (ต้องใช้ PIN) ─────────────────────────────

function staffCheck(role, pin) {
  requireRole_(role, pin);
  return { ok: true, role: role, roleLabel: ROLES[role] };
}

function fullView_(r) {
  var v = publicView_(r);
  ['branchCode', 'branchName', 'address', 'mapsUrl', 'province', 'distanceKm', 'value', 'trNo', 'feePolicy',
    'feeReason', 'stock', 'phone', 'timeWindow', 'note', 'lowMargin', 'driver', 'onRoute', 'createdAt'].forEach(function (k) {
    v[k] = r[k];
  });
  v.lowMargin = r.lowMargin === true;
  v.underPolicy = !v.lowMargin && Number(r.feeCharged) < Number(r.feePolicy);
  if (r.kind === KIND_UP) {
    ['poNo', 'grossProfit', 'grossProfitPct', 'productType', 'whRoundTripKm', 'costTotal', 'branchManager'].forEach(function (k) { v[k] = r[k]; });
    v.formUrl = formUrl_(r.id);
    v.collectFee = r.collectFee !== false;
    if (r.costTotal !== '' && r.costTotal != null) { var sm = decisionSummary_(r); v.verdict = sm.verdict; v.verdictGood = sm.good; }
    try { v.cost = r.cost ? JSON.parse(r.cost) : null; } catch (e) { v.cost = null; }
  }
  return v;
}

/** กระดานคลัง: งานในช่วงวันที่ + งานที่ต้องจัดใหม่ + ชื่อใหม่ */
function whBoard(pin, from, to) {
  requireRole_('wh', pin);
  var reqs = requests_().filter(function (r) { return r.legacy !== true; });
  var sched = schedule_();
  var today = today_();
  var inRange = reqs.filter(function (r) {
    var d = String(r.date);
    return (d >= from && d <= to) || (HOLDING_STATUSES.indexOf(r.status) !== -1 && d < today);
  }).map(fullView_);
  var reschedule = reqs.filter(function (r) {
    if (HOLDING_STATUSES.indexOf(r.status) === -1 || r.urgent === true || !r.plate || String(r.date) < today) return false;
    var d = String(r.date);
    return !activeSchedule_(sched, d).some(function (x) { return x.plate === String(r.plate) && x.weekday === weekday_(d); });
  }).map(fullView_);
  var newStaff = readAll_(SHEET.STAFF).filter(function (p) { return p.status === 'ใหม่'; })
    .map(function (p) { return { name: p.name, branchCode: String(p.branchCode), role: p.role, createdAt: p.createdAt }; });
  return { today: today, requests: inRange, reschedule: reschedule, newStaff: newStaff,
    trucks: trucks_().map(function (t) { return { plate: t.plate, driver: t.driver }; }) };
}

/**
 * การกระทำของคลังกับคำขอหนึ่งรายการ
 * action: confirm | move | cancel | fail | edit
 * p: {date, plate, driver, reason, feeCharged, trNo}
 */
function whUpdate(pin, actor, id, action, p) {
  requireRole_('wh', pin);
  actor = clean_(actor, 40);
  if (!actor) throw new Error('กรุณาเลือกชื่อผู้ทำรายการ');
  p = p || {};
  return withLock_(function () {
    var r = findRequest_(id);
    var detail = '';
    var reason = clean_(p.reason, 200);
    var setRound = function () {
      var date = clean_(p.date, 10) || String(r.date);
      var plate = clean_(p.plate, 20);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('วันที่ไม่ถูกต้อง');
      if (plate && !trucks_().some(function (t) { return t.plate === plate; })) throw new Error('ไม่พบทะเบียนรถ');
      var changed = date !== String(r.date) || plate !== String(r.plate);
      r.date = date; r.plate = plate;
      if (plate) r.driver = clean_(p.driver, 60) || (trucks_().filter(function (t) { return t.plate === plate; })[0] || {}).driver || '';
      return changed;
    };
    if (action === 'confirm') {
      if (r.status !== STATUS.PENDING) throw new Error('ยืนยันได้เฉพาะงาน "รอยืนยัน"');
      setRound();
      if (!r.plate) throw new Error('กรุณาเลือกรถ');
      r.status = STATUS.CONFIRMED;
      detail = thaiDate_(r.date) + ' · ' + r.plate;
    } else if (action === 'move') {
      if (HOLDING_STATUSES.indexOf(r.status) === -1) throw new Error('ย้ายได้เฉพาะงานที่ยังไม่ปิด');
      if (!reason) throw new Error('กรุณาใส่เหตุผลที่ย้าย');
      var old = thaiDate_(String(r.date)) + ' ' + r.plate;
      setRound();
      r.reason = 'ย้ายวัน: ' + reason;
      detail = old + ' → ' + thaiDate_(r.date) + ' ' + r.plate + ' · ' + reason;
    } else if (action === 'cancel') {
      if (!reason) throw new Error('กรุณาใส่เหตุผลที่ยกเลิก');
      r.status = STATUS.CANCELLED; r.reason = 'คลังยกเลิก: ' + reason; detail = reason;
    } else if (action === 'fail') {
      if (!reason) throw new Error('กรุณาใส่เหตุผลที่ส่งไม่สำเร็จ');
      r.status = STATUS.FAILED; r.reason = 'ส่งไม่สำเร็จ: ' + reason; detail = reason;
    } else if (action === 'edit') {
      if (p.feeCharged !== undefined && p.feeCharged !== '') {
        var fee = Number(p.feeCharged);
        if (!(fee >= 0)) throw new Error('ค่าส่งไม่ถูกต้อง');
        detail += 'ค่าส่ง ' + r.feeCharged + ' → ' + fee + ' ';
        r.feeCharged = fee;
        if (reason) r.feeReason = reason;
      }
      if (p.trNo !== undefined) { detail += 'TR ' + (r.trNo || '-') + ' → ' + clean_(p.trNo, 40); r.trNo = clean_(p.trNo, 40); }
    } else {
      throw new Error('ไม่รู้จักคำสั่ง');
    }
    r.updatedAt = nowStr_(); r.updatedBy = actor;
    writeRow_(SHEET.REQ, r);
    log_(id, actor, { confirm: 'ยืนยัน', move: 'ย้ายวัน', cancel: 'ยกเลิก (คลัง)', fail: 'ส่งไม่สำเร็จ', edit: 'แก้ไข' }[action], detail);
    return fullView_(r);
  });
}

/** ปิดรอบ: ทุกงานของรถคันนี้ในวันนั้น → จัดส่งเรียบร้อย ยกเว้นที่ระบุว่าส่งไม่สำเร็จ */
function whCloseRound(pin, actor, date, plate, failed) {
  requireRole_('wh', pin);
  actor = clean_(actor, 40);
  if (!actor) throw new Error('กรุณาเลือกชื่อผู้ทำรายการ');
  failed = failed || {};
  return withLock_(function () {
    var done = 0, fail = 0;
    requests_().forEach(function (r) {
      if (String(r.date) !== date || String(r.plate) !== plate || r.status !== STATUS.CONFIRMED) return;
      if (failed[r.id]) {
        r.status = STATUS.FAILED; r.reason = 'ส่งไม่สำเร็จ: ' + clean_(failed[r.id], 200); fail++;
      } else {
        r.status = STATUS.DELIVERED; done++;
      }
      r.updatedAt = nowStr_(); r.updatedBy = actor;
      writeRow_(SHEET.REQ, r);
      log_(r.id, actor, 'ปิดรอบ', r.status + (failed[r.id] ? ' · ' + failed[r.id] : ''));
    });
    return { delivered: done, failed: fail };
  });
}

/** รายการที่บทบาทนี้ต้องอนุมัติ · ผจก.เขต เห็นเฉพาะสาขาในเขตตัวเอง */
function approvals(role, pin, actor) {
  requireRole_(role, pin);
  var bmap = branchMap_();
  return requests_().filter(function (r) {
    if (r.status !== STATUS.APPROVAL) return false;
    if (!approvalStepFor_(role, apprOf_(r), r.kind === KIND_UP)) return false;
    if (role === 'zone') return (bmap[String(r.branchCode)] || {}).zoneManager === actor;
    return true;
  }).map(fullView_);
}

/** ลิงก์ใบแจ้งขอรอบรถต่างจังหวัด (พิมพ์เก็บแฟ้ม) — มีโทเคนผูกกับเลขคิว */
function formUrl_(id) {
  return ScriptApp.getService().getUrl() + '?view=form&id=' + encodeURIComponent(id) + '&t=' + sheetToken_('form', id);
}

/** แยกข้อความอนุมัติ 'อนุมัติ: ชื่อ yyyy-MM-dd HH:mm · หมายเหตุ' */
function parseStamp_(v) {
  var m = String(v || '').match(/^(ไม่อนุมัติ|อนุมัติ): (.*?) (\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})(?: · (.*))?$/);
  if (!m) return null;
  return { ok: m[1] === 'อนุมัติ', name: m[2], date: thaiDate_(m[3]), time: m[4], note: m[5] || '' };
}

/** CEO/COO ใช้ PIN ตำแหน่ง ไม่ได้เลือกชื่อ — แสดงชื่อจริงจากชีตตั้งค่าบนใบแจ้ง */
function named_(st, fullName) {
  if (st && (st.name === 'CEO' || st.name === 'COO') && fullName) st.name = fullName;
  return st;
}

/** ข้อมูลสำหรับใบแจ้งขอรอบรถส่งสินค้าลูกค้าต่างจังหวัด */
function formData_(id) {
  var r = findRequest_(id);
  if (r.kind !== KIND_UP) throw new Error('คำขอนี้ไม่ใช่งานต่างจังหวัด');
  var cost = null;
  try { cost = r.cost ? JSON.parse(r.cost) : null; } catch (e) { cost = null; }
  var s = settings_();
  return {
    id: r.id, createdLabel: thaiDate_(String(r.createdAt).slice(0, 10)), branchName: r.branchName, branchCode: String(r.branchCode),
    requester: r.requester, branchManager: r.branchManager || r.requester, customer: r.customer, phone: r.phone, poNo: r.poNo, value: Number(r.value) || 0,
    grossProfit: r.grossProfit, grossProfitPct: r.grossProfitPct, productType: r.productType, qty: r.qty,
    distanceKm: r.distanceKm, collectFee: r.collectFee !== false, feeCharged: Number(r.feeCharged) || 0,
    feePolicy: r.feePolicy, feeReason: r.feeReason, address: r.address, mapsUrl: r.mapsUrl, province: r.province,
    note: r.note, plate: r.plate, dateLabel: thaiDate_(String(r.date)), status: r.status,
    zoneManager: (branchMap_()[String(r.branchCode)] || {}).zoneManager || '',
    ceoName: s.ceoName, cooName: s.cooName,
    appr: { zone: parseStamp_(r.apprZone), ceo: named_(parseStamp_(r.apprCeo), s.ceoName),
      wh: parseStamp_(r.apprWh), coo: named_(parseStamp_(r.apprCoo), s.cooName) },
    cost: cost, printedAt: nowStr_(), poImages: poImages_(r)
  };
}

/** วันส่ง/รถที่คลังเลือก */
function applyRound_(r, round) {
  var plate = clean_(round.plate, 20), date = clean_(round.date, 10);
  if (plate && !trucks_().some(function (t) { return t.plate === plate; })) throw new Error('ไม่พบทะเบียนรถ');
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('วันส่งไม่ถูกต้อง');
  if (date) r.date = date;
  if (plate) { r.plate = plate; r.driver = (trucks_().filter(function (t) { return t.plate === plate; })[0] || {}).driver || ''; }
}

/** ค่าขนส่งตามใบแจ้ง (ส่วนคลังสินค้า) → คอลัมน์ cost / costTotal */
function applyCost_(r, input) {
  var c = upcountryCostInput_(input);
  if (!(c.roundTripKm > 0)) throw new Error('กรุณาใส่ระยะทางไป-กลับจากคลัง');
  var est = upcountryCost_(c);
  c.fuel = est.fuel; c.depreciation = est.depreciation; c.total = est.total;
  r.cost = JSON.stringify(c); r.costTotal = est.total;
  return c;
}

/**
 * คลังกรอก/แก้รายละเอียดค่าขนส่งตามใบแจ้งได้ล่วงหน้า (ยังไม่อนุมัติ)
 * ทำได้ตั้งแต่ส่งคำขอจนถึงก่อนคลังกดอนุมัติ — หลังอนุมัติแล้วตัวเลขที่ COO เห็นต้องไม่เปลี่ยน
 */
function whSaveCost(pin, actor, id, round) {
  requireRole_('wh', pin);
  actor = clean_(actor, 60);
  if (!actor) throw new Error('กรุณาเลือกชื่อ');
  return withLock_(function () {
    var r = findRequest_(id);
    if (r.kind !== KIND_UP) throw new Error('บันทึกค่าขนส่งตามใบแจ้งได้เฉพาะงานต่างจังหวัด');
    if (r.status !== STATUS.APPROVAL || r.apprWh) throw new Error('คลังอนุมัติไปแล้วหรืองานปิดแล้ว แก้ค่าขนส่งไม่ได้');
    round = round || {};
    applyRound_(r, round);
    var c = applyCost_(r, round.cost);
    r.updatedAt = nowStr_(); r.updatedBy = actor;
    writeRow_(SHEET.REQ, r);
    log_(id, actor, 'บันทึกค่าขนส่ง (ยังไม่อนุมัติ)', 'รวม ' + c.total + ' บาท · ไป-กลับ ' + c.roundTripKm + ' กม.');
    return fullView_(r);
  });
}

/** ข้อมูลประมาณการจากคลัง (ตัวเลขทุกช่อง + ข้อความบางช่อง) */
function upcountryCostInput_(c) {
  c = c || {};
  var s = settings_();
  var num = function (k, d) { var x = Number(c[k]); return x >= 0 && c[k] !== '' && c[k] !== undefined ? x : d; };
  return {
    roundTripKm: num('roundTripKm', 0), kmPerLiter: num('kmPerLiter', s.kmPerLiter), fuelPrice: num('fuelPrice', s.fuelPrice),
    depreciationPerKm: s.depreciationPerKm, days: num('days', 1), staff: num('staff', 2),
    labor: num('labor', 0), toll: num('toll', 0), lodging: num('lodging', 0), other: num('other', 0),
    privateCost: num('privateCost', 0), branchGoods: c.branchGoods === true, branchGoodsValue: num('branchGoodsValue', 0),
    scheduleImpact: c.scheduleImpact === true, impactNote: clean_(c.impactNote, 200), departTime: clean_(c.departTime, 20)
  };
}

function apprOf_(r) { return { zone: r.apprZone, ceo: r.apprCeo, wh: r.apprWh, coo: r.apprCoo }; }

/** ตัดสินการอนุมัติ · ฝั่งคลังต้องระบุรถ/วันส่งตอนอนุมัติ */
function decide(role, pin, actor, id, approve, reason, round) {
  requireRole_(role, pin);
  return decideCore_(role, actor, id, approve, reason, round, '');
}

/** บันทึกการอนุมัติ (ผ่าน PIN หรือผ่านลิงก์ในอีเมล — via = ข้อความต่อท้ายในประวัติ) */
function decideCore_(role, actor, id, approve, reason, round, via) {
  actor = clean_(actor, 60);
  reason = clean_(reason, 200);
  if (!actor) throw new Error('กรุณาเลือกชื่อผู้อนุมัติ');
  if (!approve && !reason) throw new Error('กรุณาใส่เหตุผลที่ไม่อนุมัติ');
  return withLock_(function () {
    var r = findRequest_(id);
    if (r.status !== STATUS.APPROVAL) throw new Error('รายการนี้ไม่ได้รออนุมัติแล้ว');
    var up = r.kind === KIND_UP;
    var step = approvalStepFor_(role, apprOf_(r), up);
    if (!step) throw new Error('ยังไม่ถึงขั้นของคุณ หรืออนุมัติไปแล้ว');
    if (role === 'zone' && (branchMap_()[String(r.branchCode)] || {}).zoneManager !== actor) {
      throw new Error('สาขานี้ไม่อยู่ในเขตของคุณ');
    }
    if (role === 'wh' && approve && round) applyRound_(r, round);
    if (role === 'wh' && approve && !r.plate) throw new Error('กรุณาเลือกรถก่อนอนุมัติ');
    if (role === 'wh' && approve && up) applyCost_(r, round && round.cost);
    var before = apprOf_(r);
    var stamp = (approve ? 'อนุมัติ' : 'ไม่อนุมัติ') + ': ' + actor + ' ' + nowStr_() + (reason ? ' · ' + reason : '');
    r[{ zone: 'apprZone', ceo: 'apprCeo', wh: 'apprWh', coo: 'apprCoo' }[step]] = stamp;
    r.status = approvalStatus_(apprOf_(r));
    if (r.status === STATUS.REJECTED) r.reason = ROLES[role] + 'ไม่อนุมัติ: ' + reason;
    r.updatedAt = nowStr_(); r.updatedBy = actor;
    writeRow_(SHEET.REQ, r);
    log_(id, actor, ROLES[role] + (approve ? ' อนุมัติ' : ' ไม่อนุมัติ') + (via || ''), reason);
    notifyNext_(r, before);
    return fullView_(r);
  });
}

/** ใบงานรายวัน: รายการรถของวันนั้น + ลิงก์ใบงาน (ใช้พิมพ์และเปิดบนมือถือคนขับ) */
function dailySheets(pin, date) {
  requireRole_('wh', pin);
  var plates = {};
  activeSchedule_(schedule_(), date).forEach(function (x) { if (x.weekday === weekday_(date)) plates[x.plate] = true; });
  requests_().forEach(function (r) {
    if (String(r.date) === date && r.plate && HOLDING_STATUSES.concat([STATUS.DELIVERED, STATUS.FAILED]).indexOf(r.status) !== -1) plates[r.plate] = true;
  });
  var base = ScriptApp.getService().getUrl();
  return Object.keys(plates).sort().map(function (plate) {
    var d = sheetData_(date, plate);
    return { plate: plate, driver: d.driver, count: d.stops.length, pending: d.stops.filter(function (s) { return s.status !== STATUS.CONFIRMED; }).length,
      url: base + '?view=sheet&date=' + date + '&plate=' + encodeURIComponent(plate) + '&t=' + sheetToken_(date, plate) };
  });
}

/** ข้อมูลใบงานของรถหนึ่งคันในหนึ่งวัน */
function sheetData_(date, plate) {
  var bmap = branchMap_();
  var truck = trucks_().filter(function (t) { return t.plate === plate; })[0] || {};
  var row = activeSchedule_(schedule_(), date).filter(function (x) { return x.plate === plate && x.weekday === weekday_(date); })[0];
  var stops = requests_().filter(function (r) {
    return String(r.date) === date && String(r.plate) === plate &&
      [STATUS.PENDING, STATUS.CONFIRMED, STATUS.DELIVERED, STATUS.FAILED].indexOf(r.status) !== -1;
  }).map(function (r) {
    return { id: r.id, customer: r.customer, phone: r.phone, timeWindow: r.timeWindow, qty: r.qty, stock: r.stock,
      branchName: r.branchName, address: r.address, mapsUrl: r.mapsUrl, lat: r.lat, lng: r.lng,
      fee: Number(r.feeCharged) || 0, note: r.note, trNo: r.trNo, status: r.status };
  });
  return { date: date, dateLabel: thaiDate_(date), plate: plate, driver: truck.driver || '', crew: truck.crew || '',
    branches: row ? row.branches.map(function (c) { return (bmap[c] || {}).name || c; }) : [], stops: stops };
}

/** จัดการรายชื่อ: approve (ยืนยันชื่อใหม่) | rename | close */
function staffAdmin(pin, actor, op, name, branchCode, newName) {
  requireRole_('wh', pin);
  return withLock_(function () {
    var p = readAll_(SHEET.STAFF).filter(function (x) { return x.name === name && String(x.branchCode) === String(branchCode); })[0];
    if (!p) throw new Error('ไม่พบชื่อ');
    if (op === 'approve') p.status = 'ใช้งาน';
    else if (op === 'close') p.status = 'ปิด';
    else if (op === 'rename') { if (!clean_(newName, 40)) throw new Error('กรุณาใส่ชื่อใหม่'); p.name = clean_(newName, 40); p.status = 'ใช้งาน'; }
    else throw new Error('ไม่รู้จักคำสั่ง');
    writeRow_(SHEET.STAFF, p);
    log_('', clean_(actor, 40), 'รายชื่อ: ' + op, name + ' (' + branchCode + ')' + (newName ? ' → ' + newName : ''));
    return true;
  });
}

// ───────────────────────────── งานตามเวลา ─────────────────────────────

/** รันทุกวันเวลาตัดรอบ: งานที่อนุมัติไม่ครบและส่งพรุ่งนี้ → เลื่อนไปรอบถัดไปที่ยังว่าง */
function autoPostpone() {
  var s = settings_();
  var tomorrow = addDays_(today_(), 1);
  withLock_(function () {
    var reqs = requests_();
    reqs.forEach(function (r) {
      if (r.status !== STATUS.APPROVAL || String(r.date) > tomorrow || r.kind === KIND_UP) return;
      var next = bookableRounds_({
        branchCode: String(r.branchCode), schedule: schedule_(), holidays: holidays_(),
        nowYmd: today_(), nowHour: 23, cutoffHour: s.cutoffHour, horizonDays: s.horizonDays,
        used: usedSlots_(reqs, r.id)
      }).filter(function (x) { return x.left > 0; })[0];
      var old = thaiDate_(String(r.date));
      if (next) { r.date = next.date; r.plate = next.plate; }
      else { r.date = addDays_(tomorrow, 1); r.plate = ''; }
      r.reason = 'เลื่อนอัตโนมัติ: อนุมัติไม่ครบภายใน ' + s.cutoffHour + ':00 น. ของวันก่อนส่ง';
      r.updatedAt = nowStr_(); r.updatedBy = 'ระบบ';
      writeRow_(SHEET.REQ, r);
      log_(r.id, 'ระบบ', 'เลื่อนอัตโนมัติ', old + ' → ' + thaiDate_(String(r.date)) + ' ' + (r.plate || '(รอคลังจัดรถ)'));
    });
  });
}

// ═════ Files.gs ═════
/**
 * ใบสั่งซื้อที่แนบกับคำขอ (รูป JPG/PNG หรือ PDF) — เก็บในโฟลเดอร์ Google Drive ของบัญชีที่ติดตั้ง (ไม่แชร์ออกนอก)
 * เปิดดูผ่านลิงก์ของเว็บแอปที่มีโทเคนผูกกับเลขคิวเท่านั้น
 */

var PO_MAX_FILES = 5;
var PO_MAX_BYTES = 4 * 1024 * 1024;
var PO_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };
var PO_FOLDER_NAME = 'ระบบขอคิวรถ - รูปใบสั่งซื้อ';

/** ตรวจไฟล์จากหน้าเว็บ [{name, mime, data(base64)}] → blob · ทำก่อนเข้า lock */
function decodePoFiles_(files, already) {
  if (!files || !files.length) return [];
  if (!Array.isArray(files)) throw new Error('ไฟล์แนบไม่ถูกต้อง');
  if (files.length + (already || 0) > PO_MAX_FILES) throw new Error('แนบรูปใบสั่งซื้อได้ไม่เกิน ' + PO_MAX_FILES + ' ไฟล์ต่อคำขอ');
  return files.map(function (f, i) {
    var mime = String((f && f.mime) || '');
    if (!PO_TYPES[mime]) throw new Error('แนบได้เฉพาะไฟล์ JPG, PNG หรือ PDF');
    var bytes;
    try { bytes = Utilities.base64Decode(String(f.data || '')); } catch (e) { throw new Error('อ่านไฟล์ที่แนบไม่ได้'); }
    if (!bytes.length) throw new Error('อ่านไฟล์ที่แนบไม่ได้');
    if (bytes.length > PO_MAX_BYTES) throw new Error('ไฟล์ใหญ่เกินไป (ไม่เกิน 4 MB ต่อไฟล์)');
    return { bytes: bytes, mime: mime, ext: PO_TYPES[mime], n: i + 1 };
  });
}

function poFolder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('PO_FOLDER');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* โฟลเดอร์ถูกลบ → สร้างใหม่ */ } }
  var folder = DriveApp.createFolder(PO_FOLDER_NAME);
  props.setProperty('PO_FOLDER', folder.getId());
  return folder;
}

/** บันทึกลง Drive แล้วคืนรายการสำหรับเก็บในคอลัมน์ poFiles */
function storePoFiles_(reqId, decoded, startAt) {
  if (!decoded.length) return [];
  var folder = poFolder_();
  return decoded.map(function (d, i) {
    var name = reqId + '-PO-' + ((startAt || 0) + i + 1) + '.' + d.ext;
    var file = folder.createFile(Utilities.newBlob(d.bytes, d.mime, name));
    return { id: file.getId(), name: name };
  });
}

function poFilesOf_(r) {
  if (!r.poFiles) return [];
  try { var a = JSON.parse(r.poFiles); return Array.isArray(a) ? a : []; } catch (e) { return []; }
}

/** ลิงก์หน้าดูใบสั่งซื้อ — มีโทเคนผูกกับเลขคิว */
function poUrl_(id) {
  return ScriptApp.getService().getUrl() + '?view=po&id=' + encodeURIComponent(id) + '&t=' + sheetToken_('po', id);
}

/** ไฟล์ทั้งหมดของคำขอเป็น data URL (ใช้ในหน้าดูใบสั่งซื้อและใบแจ้งพิมพ์) · pdf=true ให้หน้าเว็บวาดเป็นภาพ */
function poImages_(r) {
  return poFilesOf_(r).map(function (f) {
    try {
      var blob = DriveApp.getFileById(f.id).getBlob();
      var mime = blob.getContentType();
      return { name: f.name, pdf: mime === 'application/pdf', src: 'data:' + mime + ';base64,' + Utilities.base64Encode(blob.getBytes()) };
    } catch (e) {
      return { name: f.name, missing: true };
    }
  });
}

/** สาขาแนบใบสั่งซื้อเพิ่มภายหลัง (เฉพาะงานที่ยังไม่จบ) */
function attachPo(id, actor, branchCode, files) {
  actor = clean_(actor, 40);
  if (!actor) throw new Error('กรุณาเลือกชื่อก่อนแนบไฟล์');
  var r0 = findRequest_(id);
  if (padCode_(r0.branchCode) !== padCode_(branchCode)) throw new Error('แนบไฟล์ได้เฉพาะคำขอของสาขาตัวเอง');
  var decoded = decodePoFiles_(files, poFilesOf_(r0).length);
  if (!decoded.length) throw new Error('กรุณาเลือกไฟล์ใบสั่งซื้อ');
  return withLock_(function () {
    var r = findRequest_(id);
    if ([STATUS.CANCELLED, STATUS.REJECTED, STATUS.DELIVERED, STATUS.FAILED].indexOf(r.status) !== -1) {
      throw new Error('คำขอนี้ปิดแล้ว แนบไฟล์เพิ่มไม่ได้');
    }
    var have = poFilesOf_(r);
    if (have.length + decoded.length > PO_MAX_FILES) throw new Error('แนบรูปใบสั่งซื้อได้ไม่เกิน ' + PO_MAX_FILES + ' ไฟล์ต่อคำขอ');
    r.poFiles = JSON.stringify(have.concat(storePoFiles_(r.id, decoded, have.length)));
    r.updatedAt = nowStr_(); r.updatedBy = actor;
    writeRow_(SHEET.REQ, r);
    log_(r.id, actor, 'แนบใบสั่งซื้อ', decoded.length + ' ไฟล์');
    return publicView_(r);
  });
}

// ═════ Notify.gs ═════
/**
 * อีเมลแจ้งเตือนเมื่อถึงคิว (ผจก.เขต · คลัง · CEO · COO)
 * - ผจก.เขต / CEO / COO: มีปุ่ม "อนุมัติ" / "ไม่อนุมัติ" กดแล้วเปิดหน้ายืนยันในเว็บแอป ไม่ต้องใส่ PIN
 *   (ลิงก์ผูกกับเลขคิว + ตำแหน่ง หมดอายุใน 3 วัน)
 * - คลัง: ต้องกรอกค่าขนส่ง/เลือกรถ จึงส่งลิงก์เข้าระบบแทน
 * ใส่อีเมลในชีต "อีเมลแจ้งเตือน" (ใช้ Gmail ได้) · CEO/COO ใส่ในชีต ตั้งค่า → ceoEmail / cooEmail ก็ได้ · ว่าง = ไม่ส่ง
 */

var ACT_ROLES = { zone: true, ceo: true, coo: true };   // ตำแหน่งที่อนุมัติจากอีเมลได้
var ACT_TTL_MS = 3 * 24 * 3600 * 1000;

/** หลังส่งคำขอ / บันทึกการอนุมัติ: ส่งอีเมลให้ทุกตำแหน่งที่เพิ่งถึงคิว (before = null คือคำขอใหม่) */
function notifyNext_(r, before) {
  if (r.status !== STATUS.APPROVAL) return;
  var up = r.kind === KIND_UP, after = apprOf_(r);
  ['zone', 'wh', 'ceo', 'coo'].forEach(function (role) {
    var was = before ? approvalStepFor_(role, before, up) : null;
    if (!was && approvalStepFor_(role, after, up)) sendApprovalMail_(r, role);
  });
}

/** ผู้รับอีเมลของตำแหน่งนี้สำหรับคำขอนี้ */
function recipients_(role, r) {
  var s = settings_();
  var zm = role === 'zone' ? (branchMap_()[String(r.branchCode)] || {}).zoneManager : null;
  var list = readAll_(SHEET.MAIL).filter(function (m) {
    return m.group === ROLES[role] && m.email && (role !== 'zone' || m.name === zm);
  }).map(function (m) { return { email: String(m.email).trim(), name: m.name }; });
  var extra = { ceo: s.ceoEmail, coo: s.cooEmail }[role];
  if (extra && !list.some(function (m) { return m.email === String(extra).trim(); })) {
    list.push({ email: String(extra).trim(), name: role === 'ceo' ? s.ceoName : s.cooName });
  }
  return list.filter(function (m) { return /@/.test(m.email); });
}

/** ชื่อที่บันทึกเมื่ออนุมัติจากอีเมล */
function actActor_(role, r) {
  if (role === 'zone') return (branchMap_()[String(r.branchCode)] || {}).zoneManager || ROLES.zone;
  return ROLES[role];   // CEO/COO — ใบแจ้งแปลงเป็นชื่อจริงจากชีตตั้งค่า
}

function actToken_(id, role, exp) { return sheetToken_('act|' + role + '|' + exp, id); }

function actUrl_(id, role, exp, approve) {
  return ScriptApp.getService().getUrl() + '?view=act&id=' + encodeURIComponent(id) + '&r=' + role + '&e=' + exp +
    '&t=' + actToken_(id, role, exp) + '&a=' + (approve ? '1' : '0');
}

/** ตัวเลขที่ผู้บริหารใช้ตัดสินใจ */
function decisionSummary_(r) {
  var up = r.kind === KIND_UP;
  var n = function (v) { return Number(v) || 0; };
  var rows = [
    ['เลขคิว', r.id], ['สาขา', r.branchName + (r.branchManager ? ' · ผู้ขอ ' + r.branchManager : ' · ' + r.requester)],
    ['ลูกค้า', r.customer + ' · ' + (r.province || '')], ['วันส่ง', thaiDate_(String(r.date)) + (r.plate ? ' · ' + r.plate : '')],
    ['ยอดขาย (ก่อน VAT)', money_(r.value) + ' บาท'], ['ระยะทาง', (r.distanceKm || '-') + ' กม. จากสาขา']
  ];
  var verdict = '';
  if (up) {
    var cost = n(r.costTotal), gp = n(r.grossProfit), fee = r.collectFee === false ? 0 : n(r.feeCharged);
    var net = gp + fee - cost;
    var c = {}; try { c = r.cost ? JSON.parse(r.cost) : {}; } catch (e) { c = {}; }
    rows.push(['กำไรขั้นต้น', money_(gp) + ' บาท' + (r.grossProfitPct !== '' ? ' (' + r.grossProfitPct + '%)' : '')]);
    rows.push(['ค่าส่งที่เก็บลูกค้า', r.collectFee === false ? 'ไม่เก็บ' : money_(fee) + ' บาท']);
    rows.push(['ค่าขนส่งที่คลังประเมิน', cost ? money_(cost) + ' บาท' + (c.roundTripKm ? ' (ไป-กลับ ' + c.roundTripKm + ' กม.)' : '') : 'คลังยังไม่ประเมิน']);
    if (c.privateCost) rows.push(['ถ้าใช้ขนส่งเอกชน', money_(c.privateCost) + ' บาท' + (c.privateCost < cost ? ' (ถูกกว่า)' : '')]);
    if (cost) verdict = 'กำไรขั้นต้น + ค่าส่งที่เก็บ − ค่าขนส่ง = ' + (net >= 0 ? 'เหลือ ' : 'ขาด ') + money_(Math.abs(net)) + ' บาท';
    return { rows: rows, verdict: verdict, good: net >= 0, kind: 'ส่งลูกค้าต่างจังหวัด' };
  }
  rows.push(['ค่าส่ง', 'นโยบาย ' + money_(r.feePolicy) + ' · เก็บ ' + money_(r.feeCharged) + ' บาท' + (r.feeReason ? ' (' + r.feeReason + ')' : '')]);
  return { rows: rows, verdict: 'ยอดต่ำกว่าเกณฑ์และอยู่นอกเส้นทางรถ', good: true, kind: 'ยอดต่ำนอกเส้นทาง (กรุงเทพฯ/ปริมณฑล)' };
}

function money_(v) { return Number(v || 0).toLocaleString('en-US'); }

function sendApprovalMail_(r, role) {
  var rcpt;
  try { rcpt = recipients_(role, r); } catch (e) { return; }
  if (!rcpt.length) return;
  try {
    var canAct = !!ACT_ROLES[role];
    var exp = Date.now() + ACT_TTL_MS;
    var sum = decisionSummary_(r);
    var e = function (x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (ch) { return '&#' + ch.charCodeAt(0) + ';'; }); };
    var btn = function (href, label, bg) {
      return '<a href="' + e(href) + '" style="display:inline-block;padding:12px 22px;margin:4px 8px 4px 0;border-radius:8px;background:' + bg +
        ';color:#fff;font-weight:bold;text-decoration:none;font-size:16px">' + label + '</a>';
    };
    var html = '<div style="font-family:sans-serif;font-size:15px;color:#111;max-width:560px">' +
      '<p>เรียน ' + e(rcpt.map(function (m) { return m.name; }).filter(String).join(', ') || ROLES[role]) + '</p>' +
      '<p>มีคำขอรอบรถรอ' + (role === 'wh' ? 'คลังใส่ค่าขนส่ง/ยืนยันวันและรถ' : ROLES[role] + 'อนุมัติ') + ' (' + e(sum.kind) + ')</p>' +
      '<table style="border-collapse:collapse;width:100%">' + sum.rows.map(function (x) {
        return '<tr><td style="padding:4px 8px;color:#555;border-bottom:1px solid #eee;white-space:nowrap">' + e(x[0]) +
          '</td><td style="padding:4px 8px;border-bottom:1px solid #eee">' + e(x[1]) + '</td></tr>';
      }).join('') + '</table>' +
      (sum.verdict ? '<p style="font-size:17px;font-weight:bold;color:' + (sum.good ? '#1f7a3a' : '#a3261d') + '">' + e(sum.verdict) + '</p>' : '') +
      (canAct ? '<p>' + btn(actUrl_(r.id, role, exp, true), '✓ อนุมัติ', '#1f7a3a') + btn(actUrl_(r.id, role, exp, false), '✗ ไม่อนุมัติ', '#a3261d') + '</p>'
        : '<p>' + btn(ScriptApp.getService().getUrl(), 'เปิดระบบ (แท็บ รออนุมัติ)', '#1f7a3a') + '</p>') +
      '<p style="font-size:13px;color:#555">' + (canAct ? 'กดแล้วจะเปิดหน้ายืนยันอีกครั้งก่อนบันทึก · ลิงก์ใช้ได้ 3 วัน · กรุณาอย่าส่งต่ออีเมลนี้' : 'เข้า "สำหรับคลัง / ผู้อนุมัติ" ด้วย PIN คลัง') +
      (poFilesOf_(r).length ? ' · <a href="' + e(poUrl_(r.id)) + '">ดูใบสั่งซื้อ</a>' : '') +
      (r.kind === KIND_UP ? ' · <a href="' + e(formUrl_(r.id)) + '">ดูใบแจ้งเต็ม</a>' : '') + '</p></div>';
    MailApp.sendEmail({ to: rcpt.map(function (m) { return m.email; }).join(','), subject: (role === 'wh' ? '[รอคลัง] ' : '[รออนุมัติ] ') + r.id + ' · ' + r.customer + ' · ' + r.branchName, htmlBody: html, name: 'ระบบขอคิวรถคลังสินค้า' });
    log_(r.id, 'ระบบ', 'ส่งอีเมลขออนุมัติ', ROLES[role]);
  } catch (err) {
    log_(r.id, 'ระบบ', 'ส่งอีเมลไม่สำเร็จ', ROLES[role] + ': ' + err.message);
  }
}

function checkAct_(id, role, exp, t) {
  if (!ACT_ROLES[role] || !id || t !== actToken_(id, role, exp)) throw new Error('ลิงก์ไม่ถูกต้อง');
  if (!(Number(exp) > Date.now())) throw new Error('ลิงก์หมดอายุแล้ว กรุณาเข้าระบบด้วย PIN เพื่ออนุมัติ');
}

/** หน้ายืนยันจากลิงก์ในอีเมล */
function actView_(p) {
  var id = String(p.id || ''), role = String(p.r || ''), exp = String(p.e || ''), t = String(p.t || '');
  var data;
  try {
    checkAct_(id, role, exp, t);
    var r = findRequest_(id);
    var pending = r.status === STATUS.APPROVAL && !!approvalStepFor_(role, apprOf_(r), r.kind === KIND_UP);
    data = { ok: true, id: id, role: role, roleLabel: ROLES[role], exp: exp, t: t, approve: p.a !== '0', pending: pending,
      status: r.status, summary: decisionSummary_(r), poUrl: poFilesOf_(r).length ? poUrl_(id) : '',
      formUrl: r.kind === KIND_UP ? formUrl_(id) : '' };
  } catch (err) {
    data = { ok: false, error: err.message };
  }
  var tpl = template_('Act');
  tpl.data = JSON.stringify(data).replace(/</g, '\\u003c');
  return tpl.evaluate().setTitle('อนุมัติ ' + id).addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** กดยืนยันในหน้าจากอีเมล */
function emailDecide(id, role, exp, t, approve, reason) {
  checkAct_(String(id), String(role), String(exp), String(t));
  var v = decideCore_(role, actActor_(role, findRequest_(String(id))), String(id), approve === true, reason, null, ' (ลิงก์อีเมล)');
  return { status: v.status };
}
