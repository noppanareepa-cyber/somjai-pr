/**
 * ชีตฐานข้อมูล — ทุกชีตใช้แถวที่ 1 เป็นหัวตาราง และอ่าน/เขียนตามลำดับคอลัมน์ที่กำหนดในนี้
 * (ห้ามสลับลำดับคอลัมน์ในชีต · เพิ่มคอลัมน์ใหม่ได้ที่ท้ายตารางเท่านั้น)
 */

var TZ = 'Asia/Bangkok';

var SHEET = {
  REQ: 'คำขอ',
  LOG: 'ประวัติการแก้ไข',
  BRANCH: 'สาขา',
  STAFF: 'พนักงาน',
  TRUCK: 'รถ',
  SCHED: 'ตารางรอบรถ',
  HOLIDAY: 'วันหยุด',
  TIER: 'ค่าส่ง',
  SETTING: 'ตั้งค่า'
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
  ['legacy', 'ข้อมูลเก่า'], ['legacyText', 'ข้อความเดิม']
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

var DEFAULT_SETTINGS = [
  ['cutoffHour', 16, 'หลังเวลานี้ (ชั่วโมง) จองวันพรุ่งนี้ไม่ได้ · ใช้เป็นเวลาเลื่อนงานที่อนุมัติไม่ครบด้วย'],
  ['ratePer10Km', 120, 'ค่าส่งส่วนที่เกิน ทุก 10 กม. (กทม.และปริมณฑล)'],
  ['minValue', 3000, 'ยอดต่ำกว่านี้และอยู่นอกเส้นทาง ต้องอนุมัติ'],
  ['onRouteKm', 5, 'ห่างจากสาขาที่รถแวะไม่เกินกี่ กม. ถือว่าอยู่บนเส้นทาง'],
  ['horizonDays', 14, 'เปิดให้จองล่วงหน้ากี่วัน'],
  ['pilotBranches', '00005', 'รหัสสาขาที่เปิดใช้ (คั่นด้วย ,) · เว้นว่าง = ทุกสาขา'],
  ['ceoName', 'นพนารี พัวรัตนอรุณกร', 'CEO'],
  ['cooName', 'วิภวานี วิทยานนท์', 'COO']
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
  ['cutoffHour', 'ratePer10Km', 'minValue', 'onRouteKm', 'horizonDays'].forEach(function (k) { s[k] = Number(s[k]); });
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
    b.code = String(b.code); b.lat = Number(b.lat) || null; b.lng = Number(b.lng) || null;
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
    if (r.id === excludeId || !r.date || !r.plate || r.urgent === true || r.legacy === true) return;
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
