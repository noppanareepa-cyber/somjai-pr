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
 * sequential = ส่งต่างจังหวัด: คลังเริ่มประเมินได้หลัง CEO อนุมัติแล้ว (ตามใบแจ้งกระดาษ)
 */
function approvalStepFor_(role, appr, sequential) {
  var done = function (k) { return !!String(appr[k] || ''); };
  if (role === 'zone') return done('zone') ? null : 'zone';
  if (role === 'ceo') return done('zone') && !done('ceo') ? 'ceo' : null;
  if (role === 'wh') {
    if (sequential && String(appr.ceo || '').indexOf('อนุมัติ') !== 0) return null;
    return done('wh') ? null : 'wh';
  }
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
