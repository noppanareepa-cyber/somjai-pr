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
  if (!expected || String(pin || '') !== expected) {
    cache.put('pin_fails', String(fails + 1), 900);
    throw new Error('PIN ไม่ถูกต้อง');
  }
}

/** รันจากตัวแก้ไขสคริปต์ครั้งแรก แล้วแก้ค่าในนี้ก่อนรัน — อย่า commit PIN จริงกลับเข้า git */
function setPins() {
  var pins = {
    PIN_WH: '',    // คลัง (จรินทร, ชาญวิทย์)
    PIN_ZONE: '',  // ผู้จัดการเขต
    PIN_CEO: '',
    PIN_COO: ''
  };
  var props = PropertiesService.getScriptProperties();
  Object.keys(pins).forEach(function (k) {
    if (!/^\d{6,}$/.test(pins[k])) throw new Error(k + ' ต้องเป็นตัวเลขอย่างน้อย 6 หลัก');
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
