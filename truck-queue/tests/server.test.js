// ทดสอบฝั่งเซิร์ฟเวอร์ทั้งระบบด้วยชีต/Maps จำลอง · รัน: node --test truck-queue/tests/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const NOW = Date.parse('2026-10-19T03:00:00Z'); // จันทร์ 19 ต.ค. 2569 10:00 น. เวลากรุงเทพฯ

function makeEnv() {
  // ── ชีตจำลอง ──
  const sheets = {};
  function makeSheet(name) {
    const rows = [];
    const sh = {
      name,
      getLastRow: () => rows.length,
      getMaxRows: () => Math.max(rows.length, 1000),
      appendRow: (r) => { rows.push(r.slice()); },
      setFrozenRows() {},
      getRange: (r, c, nr = 1, nc = 1) => ({
        setValues(v) { v.forEach((row, i) => { rows[r - 1 + i] = rows[r - 1 + i] || []; row.forEach((x, j) => { rows[r - 1 + i][c - 1 + j] = x; }); }); return this; },
        getValues() { return Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => { const v = (rows[r - 1 + i] || [])[c - 1 + j]; return v === undefined ? '' : v; })); },
        setFontWeight() { return this; }, setBackground() { return this; }, setNumberFormat() { return this; }
      }),
      _rows: rows
    };
    return sh;
  }
  const ss = {
    getSheetByName: (n) => sheets[n] || null,
    insertSheet: (n) => (sheets[n] = makeSheet(n))
  };

  // ── เวลา ──
  let now = NOW;
  const RealDate = Date;
  class FakeDate extends RealDate { constructor(...a) { if (a.length) super(...a); else super(now); } static now() { return now; } }

  function fmt(d, tz, f) {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d).map(x => [x.type, x.value]));
    return f.replace('yyyy', p.year).replace('MM', p.month).replace('dd', p.day).replace('HH', p.hour).replace('mm', p.minute)
      .replace(/^H$/, String(Number(p.hour)));
  }

  const props = {}, cache = {};
  // ── Maps จำลอง: พิกัดตายตัว ──
  const places = {
    'https://maps.app.goo.gl/near': 'https://www.google.com/maps/place/A/@13.72,100.42,17z/data=!3d13.72!4d100.42',
    'https://maps.app.goo.gl/far': 'https://www.google.com/maps/place/B/@14.02,100.62,17z/data=!3d14.02!4d100.62',
    'https://maps.app.goo.gl/korat': 'https://www.google.com/maps/place/C/data=!3d14.97!4d102.10'
  };
  const province = (lat) => lat > 14.5 ? 'นครราชสีมา' : lat > 13.9 ? 'ปทุมธานี' : 'กรุงเทพมหานคร';
  const logs = [];
  const triggers = [];
  const env = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, getUi() { throw new Error('no ui'); } },
    Utilities: {
      formatDate: fmt,
      DigestAlgorithm: { MD5: 'md5' },
      computeDigest: (a, s) => [...crypto.createHash('md5').update(s).digest()],
      computeHmacSha256Signature: (v, k) => [...crypto.createHmac('sha256', k).update(v).digest()],
      base64EncodeWebSafe: (b) => Buffer.from(b.map(x => x & 255)).toString('base64url'),
      getUuid: () => crypto.randomUUID()
    },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] ?? null, setProperty: (k, v) => { props[k] = v; } }) },
    CacheService: { getScriptCache: () => ({ get: (k) => cache[k] ?? null, put: (k, v) => { cache[k] = v; } }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    ScriptApp: {
      getProjectTriggers: () => triggers.slice(), deleteTrigger: (t) => triggers.splice(triggers.indexOf(t), 1),
      newTrigger: (h) => { const t = { h, getHandlerFunction: () => h, timeBased: () => t, everyDays: () => t, atHour: () => t, nearMinute: () => t, inTimezone: () => t, create: () => triggers.push(t) }; return t; },
      getService: () => ({ getUrl: () => 'https://script.google.com/macros/s/X/exec' })
    },
    UrlFetchApp: { fetch: (u) => ({ getHeaders: () => (places[u] ? { Location: places[u] } : {}) }) },
    Maps: {
      DirectionFinder: { Mode: { DRIVING: 'driving' } },
      newGeocoder: () => {
        const g = { setRegion: () => g, setLanguage: () => g,
          geocode: () => ({ status: 'ZERO_RESULTS', results: [] }),
          reverseGeocode: (lat) => ({ status: 'OK', results: [{ formatted_address: 'ที่อยู่จำลอง', address_components: [{ types: ['administrative_area_level_1'], long_name: province(lat) }] }] }) };
        return g;
      },
      newDirectionFinder: () => {
        let o, d;
        const f = { setOrigin: (a, b) => { o = [a, b]; return f; }, setDestination: (a, b) => { d = [a, b]; return f; }, setMode: () => f, setRegion: () => f,
          getDirections: () => ({ routes: [{ legs: [{ distance: { value: Math.round(ctx.haversineKm_(o[0], o[1], d[0], d[1]) * 1300) } }] }] }) };
        return f;
      }
    },
    Logger: { log: (m) => logs.push(m) },
    HtmlService: {},
    Date: FakeDate,
    Intl, Math, JSON, String, Number, Object, Array, Error, RegExp, encodeURIComponent, decodeURIComponent
  };
  const ctx = vm.createContext(env);
  for (const f of ['Logic', 'Seed', 'Db', 'Maps', 'Auth', 'Api', 'Main']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../apps-script', f + '.gs'), 'utf8'), ctx, { filename: f + '.gs' });
  }
  ctx.__setNow = (iso) => { now = Date.parse(iso); };
  ctx.__sheets = sheets; ctx.__props = props; ctx.__triggers = triggers;
  return ctx;
}

function ready() {
  const S = makeEnv();
  S.setup();
  // พิกัดสาขาจำลอง (จริงๆ เติมจากเมนู "เติมพิกัดสาขา")
  const coords = { '00005': [13.70, 100.40], '00019': [13.75, 100.57], '00025': [13.67, 100.61] };
  const sh = S.__sheets['สาขา'];
  sh._rows.forEach((r, i) => { if (i && coords[r[0]]) { r[6] = coords[r[0]][0]; r[7] = coords[r[0]][1]; } });
  Object.assign(S.__props, { PIN_WH: '111111', PIN_ZONE: '222222', PIN_CEO: '333333', PIN_COO: '444444' });
  return S;
}

const base = { requester: 'หน่อย', branchCode: '00005', customer: 'โรงเรียน ก', mapsUrl: 'https://maps.app.goo.gl/near',
  value: 5500, qty: '10 ลัง', stock: 'โกดัง' };
const J = (x) => JSON.parse(JSON.stringify(x));

test('setup สร้างชีต ข้อมูลตั้งต้น และตั้งเวลาเลื่อนงาน', () => {
  const S = ready();
  for (const n of ['คำขอ', 'ประวัติการแก้ไข', 'สาขา', 'พนักงาน', 'รถ', 'ตารางรอบรถ', 'วันหยุด', 'ค่าส่ง', 'ตั้งค่า']) assert.ok(S.__sheets[n], n);
  assert.equal(S.__sheets['สาขา']._rows.length, 35);
  assert.equal(S.__triggers.length, 1);
  S.setup(); // รันซ้ำไม่ซ้ำข้อมูล
  assert.equal(S.__sheets['สาขา']._rows.length, 35);
  const b = J(S.getBootstrap());
  assert.equal(b.branches.find(x => x.code === '00005').bookable, true);
  assert.equal(b.branches.find(x => x.code === '00015').bookable, false); // ช่วงทดลองเปิดเฉพาะสาย4
  assert.ok(b.sales.some(s => s.name === 'หน่อย' && s.branchCode === '00005'));
});

test('quote: ระยะทาง ค่าส่ง และรอบที่จองได้ของสาย4', () => {
  const S = ready();
  const q = J(S.quote({ branchCode: '00005', mapsUrl: base.mapsUrl, value: 5500 }));
  assert.equal(q.metro, true);
  assert.equal(q.province, 'กรุงเทพมหานคร');
  assert.equal(q.feePolicy, S.policyFee_(q.distanceKm, 5500));
  assert.deepEqual(q.rounds.slice(0, 2).map(r => [r.date, r.plate, r.left, r.onRoute]),
    [['2026-10-21', 'ถศ 6598', 5, true], ['2026-10-24', 'บห 1782', 5, true]]);
  assert.throws(() => S.quote({ branchCode: '00015', mapsUrl: base.mapsUrl, value: 1 }), /ยังไม่เปิดใช้/);
});

test('ส่งคำขอ: กันที่ในรอบ และรอบเต็มจองไม่ได้', () => {
  const S = ready();
  for (let i = 0; i < 5; i++) {
    const r = S.submitRequest({ ...base, customer: 'ลูกค้า ' + i, date: '2026-10-21', plate: 'ถศ 6598' });
    assert.equal(r.status, 'รอยืนยัน');
  }
  assert.throws(() => S.submitRequest({ ...base, date: '2026-10-21', plate: 'ถศ 6598' }), /เต็มแล้ว/);
  const q = J(S.quote({ branchCode: '00005', mapsUrl: base.mapsUrl, value: 5500 }));
  assert.equal(q.rounds[0].left, 0);
  // ยกเลิก 1 รายการ → ที่ว่างกลับมา
  const id = S.branchRequests('00005')[0].id;
  S.cancelMine(id, 'หน่อย');
  assert.equal(J(S.quote({ branchCode: '00005', mapsUrl: base.mapsUrl, value: 5500 })).rounds[0].left, 1);
  assert.match(S.branchRequests('00005')[0].id, /^Q69-10-000\d$/);
});

test('ค่าส่งต่ำกว่านโยบายต้องมีเหตุผล · ต่างจังหวัดไม่รับ', () => {
  const S = ready();
  const far = { ...base, mapsUrl: 'https://maps.app.goo.gl/far', value: 3000, date: '2026-10-21', plate: 'ถศ 6598' };
  assert.throws(() => S.submitRequest({ ...far, feeCharged: 0 }), /ต่ำกว่านโยบาย/);
  assert.equal(S.submitRequest({ ...far, feeCharged: 0, feeReason: 'ลูกค้าประจำ' }).status, 'รอยืนยัน');
  assert.throws(() => S.submitRequest({ ...base, mapsUrl: 'https://maps.app.goo.gl/korat', date: '2026-10-21', plate: 'ถศ 6598' }), /ต่างจังหวัด/);
});

test('ยอดต่ำกว่า 3,000 นอกเส้นทาง: อนุมัติสองฝั่งพร้อมกันจนยืนยัน', () => {
  const S = ready();
  const r = S.submitRequest({ ...base, mapsUrl: 'https://maps.app.goo.gl/far', value: 2000, feeCharged: '', date: '2026-10-21', plate: 'ถศ 6598' });
  assert.equal(r.status, 'รออนุมัติ');
  // ใกล้สาขา (อยู่บนเส้นทาง) ไม่ต้องอนุมัติ
  assert.equal(S.submitRequest({ ...base, value: 1000, date: '2026-10-21', plate: 'ถศ 6598' }).status, 'รอยืนยัน');

  assert.throws(() => S.decide('ceo', '333333', 'CEO', r.id, true, '', null), /ยังไม่ถึงขั้น/);
  assert.throws(() => S.decide('zone', '222222', 'อนุชา ชัยนิวัติ (โจ้)', r.id, true, '', null), /ไม่อยู่ในเขต/);
  assert.equal(J(S.approvals('zone', '222222', 'อธินันท์ วีระจิตต์ (อัฐ)')).length, 1);
  S.decide('zone', '222222', 'อธินันท์ วีระจิตต์ (อัฐ)', r.id, true, '', null);
  S.decide('wh', '111111', 'ชาญวิทย์ สีสะอาด', r.id, true, '', { date: '2026-10-21', plate: 'ถศ 6598' }); // ฝั่งคลังไม่ต้องรอ CEO
  assert.equal(S.decide('ceo', '333333', 'CEO', r.id, true, '', null).status, 'รออนุมัติ');
  assert.equal(S.decide('coo', '444444', 'COO', r.id, true, '', null).status, 'ยืนยันแล้ว');
  const log = S.__sheets['ประวัติการแก้ไข']._rows.filter(x => x[1] === r.id).map(x => x[3]);
  assert.deepEqual(log, ['ส่งคำขอ', 'ผจก.เขต อนุมัติ', 'คลัง อนุมัติ', 'CEO อนุมัติ', 'COO อนุมัติ']);
});

test('ไม่อนุมัติขั้นใดขั้นหนึ่ง = จบ และต้องมีเหตุผล', () => {
  const S = ready();
  const r = S.submitRequest({ ...base, mapsUrl: 'https://maps.app.goo.gl/far', value: 2000, feeCharged: '', date: '2026-10-21', plate: 'ถศ 6598' });
  assert.throws(() => S.decide('wh', '111111', 'จรินทร มีเจริญ', r.id, false, '', null), /เหตุผล/);
  const out = S.decide('wh', '111111', 'จรินทร มีเจริญ', r.id, false, 'รถเต็ม', null);
  assert.equal(out.status, 'ไม่อนุมัติ');
  assert.match(out.reason, /รถเต็ม/);
});

test('คลัง: ยืนยัน ย้ายวัน และปิดรอบ', () => {
  const S = ready();
  const a = S.submitRequest({ ...base, date: '2026-10-21', plate: 'ถศ 6598' });
  const b = S.submitRequest({ ...base, customer: 'ลูกค้า ข', date: '2026-10-21', plate: 'ถศ 6598' });
  assert.throws(() => S.whUpdate('000000', 'ชาญวิทย์ สีสะอาด', a.id, 'confirm', {}), /PIN ไม่ถูกต้อง/);
  S.whUpdate('111111', 'ชาญวิทย์ สีสะอาด', a.id, 'confirm', { date: '2026-10-21', plate: 'ถศ 6598' });
  S.whUpdate('111111', 'ชาญวิทย์ สีสะอาด', b.id, 'confirm', { date: '2026-10-21', plate: 'ถศ 6598' });
  assert.throws(() => S.whUpdate('111111', 'ชาญวิทย์ สีสะอาด', b.id, 'move', { date: '2026-10-24', plate: 'บห 1782' }), /เหตุผล/);
  const sheets = J(S.dailySheets('111111', '2026-10-21'));
  const t = sheets.find(x => x.plate === 'ถศ 6598');
  assert.equal(t.count, 2);
  assert.match(t.url, /view=sheet&date=2026-10-21&plate=/);
  const res = S.whCloseRound('111111', 'จรินทร มีเจริญ', '2026-10-21', 'ถศ 6598', { [b.id]: 'ลูกค้าไม่อยู่' });
  assert.deepEqual(J(res), { delivered: 1, failed: 1 });
  const list = J(S.branchRequests('00005'));
  assert.equal(list.find(x => x.id === a.id).status, 'จัดส่งเรียบร้อย');
  assert.equal(list.find(x => x.id === b.id).status, 'ส่งไม่สำเร็จ');
  assert.throws(() => S.cancelMine(a.id, 'หน่อย'), /ยกเลิกเองไม่ได้/);
});

test('เลื่อนอัตโนมัติเมื่ออนุมัติไม่ครบภายใน 16:00 วันก่อนส่ง', () => {
  const S = ready();
  const r = S.submitRequest({ ...base, mapsUrl: 'https://maps.app.goo.gl/far', value: 2000, feeCharged: '', date: '2026-10-21', plate: 'ถศ 6598' });
  S.__setNow('2026-10-20T09:05:00Z'); // อังคาร 16:05 น.
  S.autoPostpone();
  const moved = J(S.branchRequests('00005')).find(x => x.id === r.id);
  assert.equal(moved.date, '2026-10-24');
  assert.equal(moved.plate, 'บห 1782');
  assert.match(moved.reason, /เลื่อนอัตโนมัติ/);
});

test('ใส่ PIN ผิดเกิน 10 ครั้ง ล็อกทั้งระบบ', () => {
  const S = ready();
  for (let i = 0; i < 10; i++) assert.throws(() => S.staffCheck('wh', 'x'), /PIN ไม่ถูกต้อง/);
  assert.throws(() => S.staffCheck('wh', '111111'), /ล็อก/);
});

test('เพิ่มชื่อใหม่ และคลังยืนยันชื่อ', () => {
  const S = ready();
  S.addMyName('ใหม่', '00005');
  assert.equal(J(S.whBoard('111111', '2026-10-19', '2026-10-26')).newStaff.length, 1);
  S.staffAdmin('111111', 'จรินทร มีเจริญ', 'rename', 'ใหม่', '00005', 'ใหม่จริง');
  assert.equal(J(S.whBoard('111111', '2026-10-19', '2026-10-26')).newStaff.length, 0);
  assert.ok(J(S.getBootstrap()).sales.some(s => s.name === 'ใหม่จริง'));
});

test('ใบงานคนขับต้องมีโทเคนที่ถูกต้อง', () => {
  const S = ready();
  assert.equal(S.sheetToken_('2026-10-21', 'ถศ 6598'), S.sheetToken_('2026-10-21', 'ถศ 6598'));
  assert.notEqual(S.sheetToken_('2026-10-21', 'ถศ 6598'), S.sheetToken_('2026-10-22', 'ถศ 6598'));
});
