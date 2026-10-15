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
  seedIfEmpty_(SHEET.TIER, DEFAULT_TIERS.map(function (t) { return { minValue: t[0], freeKm: t[1] }; }));
  seedIfEmpty_(SHEET.BRANCH, seedBranches_().map(function (b) {
    return { code: b[0], name: b[1], zone: b[2], zoneManager: b[3], mapsUrl: b[4], status: b[5] };
  }));
  seedIfEmpty_(SHEET.TRUCK, seedTrucks_().map(function (t) {
    return { plate: t.plate, aliases: t.aliases.join(', '), brand: t.brand, driver: t.driver, crew: t.crew };
  }));
  seedIfEmpty_(SHEET.SCHED, seedSchedule_().map(function (r) {
    return { effectiveFrom: r.effectiveFrom, plate: r.plate, weekday: r.weekday, branches: r.branches.join(','), slots: r.slots };
  }));
  var now = nowStr_();
  seedIfEmpty_(SHEET.STAFF, seedSalesStaff_().map(function (s) {
    return { name: s[0], branchCode: s[1], role: 'ขาย', status: 'ใช้งาน', createdAt: now };
  }).concat(seedWarehouseStaff_().map(function (n) {
    return { name: n, branchCode: '', role: 'คลัง', status: 'ใช้งาน', createdAt: now };
  })));

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
function include_(name) { return html_(name); }

/** ฝังฟังก์ชันจาก Logic.gs ให้หน้าเว็บใช้ — สูตรค่าส่งมีที่เดียว */
function logicSource_() {
  return 'var STATUS=' + JSON.stringify(STATUS) + ';var DEFAULT_TIERS=' + JSON.stringify(DEFAULT_TIERS) + ';' +
    [freeKm_, policyFee_, addDays_, weekday_, thaiDate_].map(String).join('\n') +
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
