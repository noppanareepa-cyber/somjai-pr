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
  // สาขา (สำหรับรายงานยืนยันรอบส่ง) — เพิ่มสาขาที่ยังไม่มีในชีตทุกครั้งที่รัน setup
  var mailNames = readAll_(SHEET.MAIL).filter(function (m) { return m.group === GROUP_BRANCH; })
    .map(function (m) { return String(m.name).trim().slice(0, 5); });
  branches_().filter(function (b) { return b.status === 'เปิด' && mailNames.indexOf(b.code) === -1; })
    .sort(function (a, b) { return a.code < b.code ? -1 : 1; })
    .forEach(function (b) { append_(SHEET.MAIL, { group: GROUP_BRANCH, name: b.code + ' ' + b.name, email: '' }); });
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
  if (p.view === 'confirm') return confirmView_(p);
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
    .addSeparator()
    .addItem('ล้างข้อมูลทดสอบ (คำขอที่ติดป้าย ทดสอบ)', 'clearTestData')
    .addToUi();
}

/** ลบคำขอทดสอบทั้งหมด (คอลัมน์ ข้อมูลทดสอบ = TRUE) พร้อมประวัติและไฟล์ใบสั่งซื้อของคำขอนั้น */
function clearTestData() {
  var ui = null;
  try { ui = SpreadsheetApp.getUi(); } catch (e) { /* รันจากตัวแก้ไขสคริปต์ */ }
  var reqs = readAll_(SHEET.REQ).filter(function (r) { return r.test === true; });
  if (!reqs.length) { if (ui) ui.alert('ไม่มีข้อมูลทดสอบ'); return 0; }
  if (ui && ui.alert('ลบคำขอทดสอบ ' + reqs.length + ' รายการ (รวมประวัติและไฟล์ใบสั่งซื้อ) ?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return 0;
  return withLock_(function () {
    var ids = {};
    reqs.forEach(function (r) {
      ids[r.id] = true;
      poFilesOf_(r).forEach(function (f) { try { DriveApp.getFileById(f.id).setTrashed(true); } catch (e) { /* ไฟล์ถูกลบไปแล้ว */ } });
    });
    var deleteRows = function (name, rows) {
      var sh = sheet_(name);
      rows.sort(function (a, b) { return b - a; }).forEach(function (n) { sh.deleteRow(n); });
    };
    deleteRows(SHEET.REQ, reqs.map(function (r) { return r._row; }));
    deleteRows(SHEET.LOG, readAll_(SHEET.LOG).filter(function (l) { return ids[l.id]; }).map(function (l) { return l._row; }));
    var msg = 'ลบคำขอทดสอบแล้ว ' + reqs.length + ' รายการ';
    Logger.log(msg);
    if (ui) ui.alert(msg + '\nก่อนใช้งานจริง อย่าลืมเปลี่ยน ตั้งค่า → testMode เป็น ไม่');
    return reqs.length;
  });
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
