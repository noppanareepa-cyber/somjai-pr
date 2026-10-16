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
      depreciationPerKm: s.depreciationPerKm },
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

  return {
    lat: loc.lat, lng: loc.lng, province: loc.province, formatted: loc.formatted, metro: metro,
    distanceKm: km, freeKm: freeKm_(value, tiers_()), feePolicy: policyFee_(km, value, tiers_(), rate), ratePer10Km: rate,
    rounds: rounds, urgentEarliest: earliestDate_(today_(), nowHour_(), s.cutoffHour),
    upcountryEarliest: addDays_(today_(), Math.max(1, s.upcountryLeadDays))
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
    log_(rec.id, requester, 'ส่งคำขอ', thaiDate_(date) + (plate ? ' · ' + plate : ' · นอกรอบ/ด่วน') +
      (needsApproval ? ' · ต้องอนุมัติ' : ''));
    return { id: rec.id, status: rec.status, date: date, dateLabel: thaiDate_(date) };
  });
}

/**
 * ขอรอบรถส่งลูกค้าต่างจังหวัด (แทนใบแจ้งกระดาษ ตาม MEMO COO009/69)
 * อนุมัติทีละฝั่ง: ผจก.เขต → CEO แล้วคลังประเมินค่าใช้จ่าย/ยืนยันวัน → COO
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
  if (!po || !po.length) throw new Error('ส่งต่างจังหวัดต้องแนบรูปใบสั่งซื้ออย่างน้อย 1 รูป');
  var date = clean_(f.date, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < q.upcountryEarliest) {
    throw new Error('วันส่งต่างจังหวัดต้องไม่ก่อน ' + thaiDate_(q.upcountryEarliest));
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
    if (role === 'wh' && approve && round) {
      var plate = clean_(round.plate, 20), date = clean_(round.date, 10);
      if (plate && !trucks_().some(function (t) { return t.plate === plate; })) throw new Error('ไม่พบทะเบียนรถ');
      if (date) r.date = date;
      if (plate) { r.plate = plate; r.driver = (trucks_().filter(function (t) { return t.plate === plate; })[0] || {}).driver || ''; }
    }
    if (role === 'wh' && approve && !r.plate) throw new Error('กรุณาเลือกรถก่อนอนุมัติ');
    if (role === 'wh' && approve && up) {
      var c = upcountryCostInput_(round && round.cost);
      if (!(c.roundTripKm > 0)) throw new Error('กรุณาใส่ระยะทางไป-กลับจากคลัง');
      var est = upcountryCost_(c);
      c.fuel = est.fuel; c.depreciation = est.depreciation; c.total = est.total;
      r.cost = JSON.stringify(c); r.costTotal = est.total;
    }
    var stamp = (approve ? 'อนุมัติ' : 'ไม่อนุมัติ') + ': ' + actor + ' ' + nowStr_() + (reason ? ' · ' + reason : '');
    r[{ zone: 'apprZone', ceo: 'apprCeo', wh: 'apprWh', coo: 'apprCoo' }[step]] = stamp;
    r.status = approvalStatus_(apprOf_(r));
    if (r.status === STATUS.REJECTED) r.reason = ROLES[role] + 'ไม่อนุมัติ: ' + reason;
    r.updatedAt = nowStr_(); r.updatedBy = actor;
    writeRow_(SHEET.REQ, r);
    log_(id, actor, ROLES[role] + (approve ? ' อนุมัติ' : ' ไม่อนุมัติ'), reason);
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
