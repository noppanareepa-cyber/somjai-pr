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
      deleteRow: (n) => { rows.splice(n - 1, 1); },
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
    'https://maps.app.goo.gl/rama9': 'https://www.google.com/maps/place/D/@13.751,100.571,17z/data=!3d13.751!4d100.571',
    'https://maps.app.goo.gl/korat': 'https://www.google.com/maps/place/C/data=!3d14.97!4d102.10'
  };
  const province = (lat) => lat > 14.5 ? 'นครราชสีมา' : lat > 13.9 ? 'ปทุมธานี' : 'กรุงเทพมหานคร';
  const logs = [];
  const mails = [];
  // ── Drive จำลอง ──
  const drive = { folders: [], files: {} };
  const DriveApp = {
    createFolder: (name) => { const f = { id: 'fold' + drive.folders.length, name, getId: () => f.id,
      createFile: (blob) => { const id = 'file' + Object.keys(drive.files).length; drive.files[id] = blob; return { getId: () => id }; } };
      drive.folders.push(f); return f; },
    getFolderById: (id) => { const f = drive.folders.find(x => x.id === id); if (!f) throw new Error('no folder'); return f; },
    getFileById: (id) => { const b = drive.files[id]; if (!b) throw new Error('no file'); return { getBlob: () => b, setTrashed: () => { delete drive.files[id]; } }; }
  };
  const triggers = [];
  const env = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, getUi() { throw new Error('no ui'); } },
    Utilities: {
      formatDate: fmt,
      DigestAlgorithm: { MD5: 'md5' },
      computeDigest: (a, s) => [...crypto.createHash('md5').update(s).digest()],
      computeHmacSha256Signature: (v, k) => [...crypto.createHmac('sha256', k).update(v).digest()],
      base64EncodeWebSafe: (b) => Buffer.from(b.map(x => x & 255)).toString('base64url'),
      base64Encode: (b) => Buffer.from(b.map(x => x & 255)).toString('base64'),
      base64Decode: (s) => [...Buffer.from(s, 'base64')].map(x => (x << 24) >> 24),
      newBlob: (bytes, mime, name) => ({ bytes, mime, name, getBytes: () => bytes, getContentType: () => mime }),
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
    DriveApp,
    MailApp: { sendEmail: (m) => mails.push(m) },
    Date: FakeDate,
    Intl, Math, JSON, String, Number, Object, Array, Error, RegExp, encodeURIComponent, decodeURIComponent
  };
  const ctx = vm.createContext(env);
  for (const f of ['Logic', 'Seed', 'Db', 'Maps', 'Auth', 'Api', 'Files', 'Notify', 'Confirm', 'Main']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../apps-script', f + '.gs'), 'utf8'), ctx, { filename: f + '.gs' });
  }
  ctx.__setNow = (iso) => { now = Date.parse(iso); };
  ctx.__sheets = sheets; ctx.__props = props; ctx.__triggers = triggers; ctx.__drive = drive; ctx.__mails = mails;
  return ctx;
}

function ready() {
  const S = makeEnv();
  S.setup();
  // พิกัดสาขาจำลอง (จริงๆ เติมจากเมนู "เติมพิกัดสาขา")
  const coords = { '00005': [13.70, 100.40], '00019': [13.75, 100.57], '00025': [13.67, 100.61] };
  const sh = S.__sheets['สาขา'];
  sh._rows.forEach((r, i) => { if (i && coords[r[0]]) { r[6] = coords[r[0]][0]; r[7] = coords[r[0]][1]; } });
  S.addMyName('สมชาย ใจดี', '00005', 'ผจก.สาขา');   // ผู้จัดการสาขาสายสี่ (ผู้ขอรอบรถต่างจังหวัด)
  S.__sheets['พนักงาน']._rows.find(r => r[0] === 'สมชาย ใจดี')[3] = 'ใช้งาน';
  Object.assign(S.__props, { PIN_WH: 'Klangsk', PIN_ZONE: 'zonemgr', PIN_CEO: 'ceoppp', PIN_COO: 'cooqqq' });
  return S;
}

const base = { area: 'metro', requester: 'หน่อย', branchCode: '00005', customer: 'โรงเรียน ก', mapsUrl: 'https://maps.app.goo.gl/near',
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
  const codes = b.branches.map(x => x.code);
  assert.deepEqual(codes, [...codes].sort());   // เรียงตามรหัสสาขา
  assert.equal(codes[0], '00000');
});

test('ชีตตัดเลข 0 หน้ารหัสสาขา (00005 → 5) ยังเปิดใช้ได้', () => {
  const S = ready();
  const row = S.__sheets['ตั้งค่า']._rows.find(r => r[0] === 'pilotBranches');
  row[1] = 5;
  assert.equal(J(S.getBootstrap()).branches.find(x => x.code === '00005').bookable, true);
  row[1] = '5, 19';
  assert.equal(J(S.getBootstrap()).branches.find(x => x.code === '00019').bookable, true);
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
});

const korat = { ...base, area: 'up', mapsUrl: 'https://maps.app.goo.gl/korat', value: 20000, qty: '550 ชิ้น', productType: 'เฟรมผ้าใบ',
  phone: '081-000-0000', grossProfit: 4000, poNo: 'PO-1', date: '2026-10-26', branchManager: 'สมชาย ใจดี',
  poFiles: [{ name: 'po.jpg', mime: 'image/jpeg', data: Buffer.from('fake-jpeg').toString('base64') }] };

test('ต่างจังหวัด: ใช้อัตรา 90 บาท และต้องกรอกข้อมูลตามใบแจ้ง', () => {
  const S = ready();
  const q = J(S.quote({ branchCode: '00005', mapsUrl: korat.mapsUrl, value: 20000 }));
  assert.equal(q.metro, false);
  assert.equal(q.rounds.length, 0);
  assert.equal(q.feePolicy, S.policyFee_(q.distanceKm, 20000, null, 90));
  assert.equal(q.upcountryEarliest, '2026-10-24');   // จ. 19 + 5 วันทำการ (จ.–ส.) = ส. 24
  assert.throws(() => S.submitRequest({ ...korat, branchManager: '' }), /ผู้จัดการสาขา/);
  assert.throws(() => S.submitRequest({ ...korat, branchManager: 'หน่อย' }), /ผู้จัดการสาขา/);   // พนักงานขาย ไม่ใช่ ผจก.สาขา
  assert.ok(J(S.getBootstrap()).sales.some(x => x.name === 'สมชาย ใจดี' && x.manager === true));
  assert.throws(() => S.submitRequest({ ...korat, productType: '' }), /ประเภทสินค้า/);
  assert.throws(() => S.submitRequest({ ...korat, poFiles: [] }), /แนบใบสั่งซื้อ/);   // ต่างจังหวัดต้องแนบไฟล์
  assert.throws(() => S.submitRequest({ ...korat, grossProfit: '' }), /กำไรขั้นต้น/);
  assert.throws(() => S.submitRequest({ ...korat, date: '2026-10-23' }), /5 วันทำการ/);
  const r = S.submitRequest(korat);
  assert.equal(r.status, 'รออนุมัติ');
  const v = J(S.branchRequests('00005')).find(x => x.id === r.id);
  assert.equal(v.upcountry, true);
  assert.equal(v.plate, '');
});

test('ต่างจังหวัด: ผจก.เขต → คลังใส่ค่าขนส่ง → CEO → COO', () => {
  const S = ready();
  S.__sheets['ตั้งค่า']._rows.find(x => x[0] === 'warehouseLocation')[1] = '13.70,100.40';
  const r = S.submitRequest(korat);
  const wh = ['wh', 'klangsk', 'จรินทร มีเจริญ'];
  assert.equal(J(S.approvals(...wh)).length, 0);                       // คลังยังไม่เห็นจนกว่า ผจก.เขต อนุมัติ
  assert.throws(() => S.decide(...wh.slice(0, 2), wh[2], r.id, true, '', { date: '2026-10-24', plate: 'บห 1782' }), /ยังไม่ถึงขั้น/);
  S.decide('zone', 'zonemgr', 'อธินันท์ วีระจิตต์ (อัฐ)', r.id, true, '', null);
  assert.throws(() => S.decide('ceo', 'ceoppp', 'CEO', r.id, true, '', null), /ยังไม่ถึงขั้น/);   // CEO รอคลังใส่ค่าขนส่ง
  assert.equal(J(S.approvals('ceo', 'ceoppp', 'CEO')).length, 0);
  const list = J(S.approvals(...wh));
  assert.equal(list.length, 1);
  assert.ok(list[0].whRoundTripKm > 0);                                  // คำนวณระยะไป-กลับจากคลังให้
  assert.throws(() => S.decide('wh', 'klangsk', wh[2], r.id, true, '', { date: '2026-10-24', plate: 'บห 1782', cost: {} }), /ไป-กลับ/);
  const out = J(S.decide('wh', 'klangsk', wh[2], r.id, true, '', { date: '2026-10-24', plate: 'บห 1782',
    cost: { roundTripKm: 496, kmPerLiter: 8, fuelPrice: 32, labor: 300, toll: 300, lodging: 500, privateCost: 8000 } }));
  assert.equal(out.status, 'รออนุมัติ');
  assert.equal(out.cost.fuel, 1984);
  assert.equal(out.cost.depreciation, 2480);
  assert.equal(out.costTotal, 1984 + 2480 + 300 + 300 + 500);
  assert.throws(() => S.decide('coo', 'cooqqq', 'COO', r.id, true, '', null), /ยังไม่ถึงขั้น/);   // COO รอ CEO
  const ceoList = J(S.approvals('ceo', 'ceoppp', 'CEO'));
  assert.equal(ceoList[0].cost.total, out.costTotal);                   // CEO เห็นค่าขนส่งของคลังก่อนตัดสินใจ
  assert.equal(S.decide('ceo', 'ceoppp', 'CEO', r.id, true, '', null).status, 'รออนุมัติ');
  assert.equal(S.decide('coo', 'cooqqq', 'COO', r.id, true, '', null).status, 'ยืนยันแล้ว');
});

test('ต่างจังหวัด: ใบแจ้งสำหรับพิมพ์', () => {
  const S = ready();
  const r = S.submitRequest(korat);
  S.decide('zone', 'zonemgr', 'อธินันท์ วีระจิตต์ (อัฐ)', r.id, true, 'ลูกค้าประจำ', null);
  const v = J(S.branchRequests('00005')).find(x => x.id === r.id);
  assert.match(v.formUrl, new RegExp('view=form&id=' + r.id + '&t='));
  const d = J(S.formData_(r.id));
  assert.equal(d.customer, korat.customer);
  assert.equal(d.grossProfitPct, 20);
  assert.deepEqual(d.appr.zone, { ok: true, name: 'อธินันท์ วีระจิตต์ (อัฐ)', date: 'จ. 19 ต.ค. 69', time: '10:00', note: 'ลูกค้าประจำ' });
  assert.equal(d.appr.ceo, null);
  assert.equal(d.cost, null);
  assert.equal(d.zoneManager, 'อธินันท์ วีระจิตต์ (อัฐ)');
  assert.equal(d.branchManager, 'สมชาย ใจดี');
  assert.equal(d.requester, 'หน่อย');
  const metro = S.submitRequest({ ...base, date: '2026-10-21', plate: 'ถศ 6598' });
  assert.throws(() => S.formData_(metro.id), /ไม่ใช่งานต่างจังหวัด/);
  assert.equal(J(S.branchRequests('00005')).find(x => x.id === metro.id).formUrl, '');
});

test('ต่างจังหวัด: ไม่เลื่อนอัตโนมัติ และไม่กินที่รอบกรุงเทพฯ', () => {
  const S = ready();
  const r = S.submitRequest({ ...korat, date: '2026-10-26' });
  S.__setNow('2026-10-24T09:05:00Z');
  S.autoPostpone();
  assert.equal(J(S.branchRequests('00005')).find(x => x.id === r.id).date, '2026-10-26');
});

test('ยอดต่ำกว่า 3,000 นอกเส้นทาง: อนุมัติสองฝั่งพร้อมกันจนยืนยัน', () => {
  const S = ready();
  const r = S.submitRequest({ ...base, mapsUrl: 'https://maps.app.goo.gl/far', value: 2000, feeCharged: '', date: '2026-10-24', plate: 'บห 1782' });
  assert.equal(r.status, 'รออนุมัติ');
  // ใกล้สาขา (อยู่บนเส้นทาง) ไม่ต้องอนุมัติ
  assert.equal(S.submitRequest({ ...base, value: 1000, date: '2026-10-21', plate: 'ถศ 6598' }).status, 'รอยืนยัน');

  assert.throws(() => S.decide('ceo', 'CEOPPP', 'CEO', r.id, true, '', null), /ยังไม่ถึงขั้น/);
  assert.throws(() => S.decide('zone', 'zonemgr', 'อนุชา ชัยนิวัติ (โจ้)', r.id, true, '', null), /ไม่อยู่ในเขต/);
  assert.equal(J(S.approvals('zone', 'zonemgr', 'อธินันท์ วีระจิตต์ (อัฐ)')).length, 1);
  S.decide('zone', 'zonemgr', 'อธินันท์ วีระจิตต์ (อัฐ)', r.id, true, '', null);
  S.decide('wh', 'klangsk', 'ชาญวิทย์ สีสะอาด', r.id, true, '', { date: '2026-10-24', plate: 'บห 1782' }); // ฝั่งคลังไม่ต้องรอ CEO
  assert.equal(S.decide('ceo', 'CEOPPP', 'CEO', r.id, true, '', null).status, 'รออนุมัติ');
  assert.equal(S.decide('coo', 'cooqqq', 'COO', r.id, true, '', null).status, 'ยืนยันแล้ว');
  const log = S.__sheets['ประวัติการแก้ไข']._rows.filter(x => x[1] === r.id).map(x => x[3]);
  assert.deepEqual(log, ['ส่งคำขอ', 'ผจก.เขต อนุมัติ', 'คลัง อนุมัติ', 'CEO อนุมัติ', 'COO อนุมัติ']);
});

test('ไม่อนุมัติขั้นใดขั้นหนึ่ง = จบ และต้องมีเหตุผล', () => {
  const S = ready();
  const r = S.submitRequest({ ...base, mapsUrl: 'https://maps.app.goo.gl/far', value: 2000, feeCharged: '', date: '2026-10-24', plate: 'บห 1782' });
  assert.throws(() => S.decide('wh', 'klangsk', 'จรินทร มีเจริญ', r.id, false, '', null), /เหตุผล/);
  const out = S.decide('wh', 'klangsk', 'จรินทร มีเจริญ', r.id, false, 'รถเต็ม', null);
  assert.equal(out.status, 'ไม่อนุมัติ');
  assert.match(out.reason, /รถเต็ม/);
});

test('คลัง: ยืนยัน ย้ายวัน และปิดรอบ', () => {
  const S = ready();
  const a = S.submitRequest({ ...base, date: '2026-10-21', plate: 'ถศ 6598' });
  const b = S.submitRequest({ ...base, customer: 'ลูกค้า ข', date: '2026-10-21', plate: 'ถศ 6598' });
  assert.throws(() => S.whUpdate('wrongx', 'ชาญวิทย์ สีสะอาด', a.id, 'confirm', {}), /PIN ไม่ถูกต้อง/);
  S.whUpdate('klangsk', 'ชาญวิทย์ สีสะอาด', a.id, 'confirm', { date: '2026-10-21', plate: 'ถศ 6598' });
  S.whUpdate('klangsk', 'ชาญวิทย์ สีสะอาด', b.id, 'confirm', { date: '2026-10-21', plate: 'ถศ 6598' });
  assert.throws(() => S.whUpdate('klangsk', 'ชาญวิทย์ สีสะอาด', b.id, 'move', { date: '2026-10-24', plate: 'บห 1782' }), /เหตุผล/);
  const sheets = J(S.dailySheets('klangsk', '2026-10-21'));
  const t = sheets.find(x => x.plate === 'ถศ 6598');
  assert.equal(t.count, 2);
  assert.match(t.url, /view=sheet&date=2026-10-21&plate=/);
  const res = S.whCloseRound('klangsk', 'จรินทร มีเจริญ', '2026-10-21', 'ถศ 6598', { [b.id]: 'ลูกค้าไม่อยู่' });
  assert.deepEqual(J(res), { delivered: 1, failed: 1 });
  const list = J(S.branchRequests('00005'));
  assert.equal(list.find(x => x.id === a.id).status, 'จัดส่งเรียบร้อย');
  assert.equal(list.find(x => x.id === b.id).status, 'ส่งไม่สำเร็จ');
  assert.throws(() => S.cancelMine(a.id, 'หน่อย'), /ปิดแล้ว/);
});

test('เลื่อนอัตโนมัติเมื่ออนุมัติไม่ครบภายใน 16:00 วันก่อนส่ง', () => {
  const S = ready();
  const r = S.submitRequest({ ...base, mapsUrl: 'https://maps.app.goo.gl/far', value: 2000, feeCharged: '', date: '2026-10-24', plate: 'บห 1782' });
  S.__setNow('2026-10-23T09:05:00Z'); // ศุกร์ 16:05 น.
  S.autoPostpone();
  const moved = J(S.branchRequests('00005')).find(x => x.id === r.id);
  assert.equal(moved.date, '2026-10-28');
  assert.equal(moved.plate, 'ถศ 6598');
  assert.match(moved.reason, /เลื่อนอัตโนมัติ/);
});

test('ใส่ PIN ผิดเกิน 10 ครั้ง ล็อกทั้งระบบ', () => {
  const S = ready();
  for (let i = 0; i < 10; i++) assert.throws(() => S.staffCheck('wh', 'x'), /PIN ไม่ถูกต้อง/);
  assert.throws(() => S.staffCheck('wh', 'klangsk'), /ล็อก/);
});

test('เพิ่มชื่อใหม่ และคลังยืนยันชื่อ', () => {
  const S = ready();
  S.addMyName('ใหม่', '00005');
  assert.equal(J(S.whBoard('klangsk', '2026-10-19', '2026-10-26')).newStaff.length, 1);
  S.staffAdmin('klangsk', 'จรินทร มีเจริญ', 'rename', 'ใหม่', '00005', 'ใหม่จริง');
  assert.equal(J(S.whBoard('klangsk', '2026-10-19', '2026-10-26')).newStaff.length, 0);
  assert.ok(J(S.getBootstrap()).sales.some(s => s.name === 'ใหม่จริง'));
});

test('ใบงานคนขับต้องมีโทเคนที่ถูกต้อง', () => {
  const S = ready();
  assert.equal(S.sheetToken_('2026-10-21', 'ถศ 6598'), S.sheetToken_('2026-10-21', 'ถศ 6598'));
  assert.notEqual(S.sheetToken_('2026-10-21', 'ถศ 6598'), S.sheetToken_('2026-10-22', 'ถศ 6598'));
});

test('แนบรูปใบสั่งซื้อ: เก็บใน Drive ดูผ่านลิงก์มีโทเคน และแนบเพิ่มภายหลังได้', () => {
  const S = ready();
  const jpg = (n) => ({ name: 'po' + n + '.jpg', mime: 'image/jpeg', data: Buffer.from('fake-jpeg-' + n).toString('base64') });
  assert.equal(S.__drive.folders.length, 1);                 // setup สร้างโฟลเดอร์ไว้แล้ว
  const q = J(S.quote({ branchCode: '00005', mapsUrl: base.mapsUrl, value: base.value }));
  const r0 = q.rounds[0];
  const r = J(S.submitRequest({ ...base, date: r0.date, plate: r0.plate, poFiles: [jpg(1), jpg(2)] }));
  assert.equal(Object.keys(S.__drive.files).length, 2);
  const row = S.findRequest_(r.id);
  assert.equal(J(S.poFilesOf_(row)).length, 2);
  const mine = J(S.branchRequests('00005')).find(x => x.id === r.id);
  assert.equal(mine.poCount, 2);
  assert.match(mine.poUrl, /view=po&id=/);
  const imgs = J(S.poImages_(row));
  assert.equal(imgs[0].src, 'data:image/jpeg;base64,' + jpg(1).data);
  // แนบเพิ่มภายหลัง · เกิน 5 รูปไม่ได้ · สาขาอื่นแนบไม่ได้
  S.attachPo(r.id, 'หน่อย', '00005', [jpg(3), jpg(4), jpg(5)]);
  assert.equal(J(S.branchRequests('00005')).find(x => x.id === r.id).poCount, 5);
  assert.throws(() => S.attachPo(r.id, 'หน่อย', '00005', [jpg(6)]), /ไม่เกิน 5/);
  assert.throws(() => S.attachPo(r.id, 'หน่อย', '00019', [jpg(6)]), /สาขาตัวเอง/);
  // ชนิดไฟล์ต้องเป็นรูป
  assert.throws(() => S.submitRequest({ ...base, date: r0.date, plate: r0.plate, poFiles: [{ name: 'x.doc', mime: 'application/msword', data: 'AAAA' }] }), /JPG, PNG หรือ PDF/);
  // PDF แนบได้
  const pdf = { name: 'po.pdf', mime: 'application/pdf', data: Buffer.from('%PDF-1.4 fake').toString('base64') };
  const r3 = J(S.submitRequest({ ...base, date: r0.date, plate: r0.plate, poFiles: [pdf] }));
  const im3 = J(S.poImages_(S.findRequest_(r3.id)));
  assert.equal(im3[0].pdf, true);
  assert.match(im3[0].name, /-PO-1\.pdf$/);
  // ไม่แนบรูปก็ส่งได้
  const r2 = J(S.submitRequest({ ...base, date: r0.date, plate: r0.plate }));
  assert.equal(J(S.branchRequests('00005')).find(x => x.id === r2.id).poUrl, '');
  // คลังเห็นลิงก์บนกระดาน
  const board = J(S.whBoard('klangsk', r0.date, r0.date));
  assert.ok(board.requests.find(x => x.id === r.id).poUrl);
});

test('ต่างจังหวัด: คลังกรอกค่าขนส่งตามใบแจ้งไว้ก่อน แล้วอนุมัติทีหลัง', () => {
  const S = ready();
  const r = S.submitRequest(korat);
  const cost = { roundTripKm: 496, kmPerLiter: 8, fuelPrice: 32, labor: 300, toll: 300, lodging: 500, days: 2, staff: 2, departTime: '06:00' };
  // กรอกได้ตั้งแต่ยังไม่มีใครอนุมัติ — ยังไม่นับเป็นการอนุมัติ
  const v = J(S.whSaveCost('klangsk', 'ชาญวิทย์ สีสะอาด', r.id, { date: '2026-10-24', plate: 'บห 1782', cost }));
  assert.equal(v.costTotal, 1984 + 2480 + 300 + 300 + 500);
  assert.equal(v.cost.departTime, '06:00');
  assert.equal(v.plate, 'บห 1782');
  assert.equal(v.approvals.wh, '');
  assert.equal(v.status, 'รออนุมัติ');
  assert.throws(() => S.whSaveCost('klangsk', 'ชาญวิทย์ สีสะอาด', r.id, { cost: {} }), /ไป-กลับ/);
  assert.throws(() => S.whSaveCost('wrong', 'x', r.id, { cost }), /PIN/);
  // คลังเห็นบนกระดานพร้อมตัวเลข
  const board = J(S.whBoard('klangsk', '2026-10-20', '2026-10-31'));
  assert.equal(board.requests.find(x => x.id === r.id).cost.total, v.costTotal);
  // หลังคลังอนุมัติ แก้ไม่ได้
  S.decide('zone', 'zonemgr', 'อธินันท์ วีระจิตต์ (อัฐ)', r.id, true, '', null);
  S.decide('wh', 'klangsk', 'จรินทร มีเจริญ', r.id, true, '', { date: '2026-10-24', plate: 'บห 1782', cost });
  assert.throws(() => S.whSaveCost('klangsk', 'ชาญวิทย์ สีสะอาด', r.id, { cost }), /อนุมัติไปแล้ว/);
  // งานกรุงเทพฯ ใช้ไม่ได้
  const q = J(S.quote({ branchCode: '00005', mapsUrl: base.mapsUrl, value: base.value }));
  const m = J(S.submitRequest({ ...base, date: q.rounds[0].date, plate: q.rounds[0].plate }));
  assert.throws(() => S.whSaveCost('klangsk', 'x', m.id, { cost }), /เฉพาะงานต่างจังหวัด/);
});

test('กล่อง กรุงเทพฯ/ต่างจังหวัด ต้องตรงกับที่อยู่ลูกค้า และงานต้องอนุมัติขอล่วงหน้า 3 วันทำการ', () => {
  const S = ready();
  assert.throws(() => S.submitRequest({ ...base, area: '', date: '2026-10-21', plate: 'ถศ 6598' }), /กรุณาเลือกว่าส่งลูกค้า/);
  assert.throws(() => S.submitRequest({ ...base, area: 'up', date: '2026-10-21', plate: 'ถศ 6598' }), /กรุงเทพฯ และปริมณฑล แต่เลือกไว้เป็นต่างจังหวัด/);
  assert.throws(() => S.submitRequest({ ...korat, area: 'metro' }), /นครราชสีมา ซึ่งเป็นต่างจังหวัด/);
  // ยอดต่ำนอกเส้นทาง: รอบพุธ 21 (2 วันทำการ) ใกล้เกินไป · รอบเสาร์ 24 ได้
  const q = J(S.quote({ branchCode: '00005', mapsUrl: 'https://maps.app.goo.gl/far', value: 2000 }));
  assert.equal(q.approvalEarliest, '2026-10-22');
  assert.deepEqual(q.rounds.filter(r => r.date <= '2026-10-24').map(r => [r.date, r.tooSoon]), [['2026-10-21', true], ['2026-10-24', false]]);
  const low = { ...base, mapsUrl: 'https://maps.app.goo.gl/far', value: 2000, feeCharged: '' };
  assert.throws(() => S.submitRequest({ ...low, date: '2026-10-21', plate: 'ถศ 6598' }), /ล่วงหน้าอย่างน้อย 3 วันทำการ/);
  assert.throws(() => S.submitRequest({ ...low, urgent: true, date: '2026-10-21' }), /3 วันทำการ/);
  // งานปกติ (ไม่ต้องอนุมัติ) ยังจองรอบพุธได้
  assert.equal(S.submitRequest({ ...base, mapsUrl: 'https://maps.app.goo.gl/far', value: 5500, date: '2026-10-21', plate: 'ถศ 6598' }).status, 'รอยืนยัน');
  // วันหยุดไม่นับเป็นวันทำการ
  S.__sheets['วันหยุด']._rows.push(['2026-10-20', 'ทดสอบ']);
  assert.equal(J(S.quote({ branchCode: '00005', mapsUrl: 'https://maps.app.goo.gl/far', value: 2000 })).approvalEarliest, '2026-10-23');
});

test('อีเมลถึง CEO/COO เมื่อถึงคิว และอนุมัติจากลิงก์ได้โดยไม่ต้องใช้ PIN', () => {
  const S = ready();
  const set = (k, v) => { S.__sheets['ตั้งค่า']._rows.find(x => x[0] === k)[1] = v; };
  set('ceoEmail', 'ceo@somjai.co.th'); set('cooEmail', 'coo@somjai.co.th');
  const r = S.submitRequest(korat);
  S.decide('zone', 'zonemgr', 'อธินันท์ วีระจิตต์ (อัฐ)', r.id, true, '', null);
  assert.equal(S.__mails.length, 0);                                     // ยังไม่ถึงคิว CEO
  S.decide('wh', 'klangsk', 'จรินทร มีเจริญ', r.id, true, '', { date: '2026-10-26', plate: 'บห 1782',
    cost: { roundTripKm: 496, kmPerLiter: 8, fuelPrice: 32, labor: 300 } });
  assert.equal(S.__mails.length, 1);
  const m = S.__mails[0];
  assert.equal(m.to, 'ceo@somjai.co.th');
  assert.match(m.htmlBody, /คำขอจากสาขา/);
  assert.match(m.htmlBody, /เรียน คุณนพนารี พัวรัตนอรุณกร</);                              // CEO เห็นจุดเน้นคำขอของสาขา
  // สรุปผู้บริหาร: กำไร 4,000 − (ค่าขนส่ง 4,764 − ค่าส่งที่เก็บ 2,340 = 2,424) = เหลือ 1,576 · เกณฑ์ ≥ 2,424 × 1.5 = 3,636
  assert.match(m.htmlBody, /สรุปสำหรับผู้บริหาร/);
  assert.match(m.htmlBody, /ค่าใช้จ่ายสุทธิ<\/td><td[^>]*>2,424 บาท/);
  assert.match(m.htmlBody, /กำไรคงเหลือหลังหักค่าใช้จ่าย<\/td><td[^>]*>1,576 บาท/);
  assert.match(m.htmlBody, /✓ ผ่านเกณฑ์ · กำไรคงเหลือ 1,576 บาท · กำไรขั้นต้น = 165% ของค่าใช้จ่ายสุทธิ/);
  const link = m.htmlBody.match(/href="([^"]*view=act[^"]*a=1)"/)[1].replace(/&#38;/g, '&');
  const p = Object.fromEntries(new URL(link).searchParams);
  // ลิงก์ปลอม / ตำแหน่งไม่ตรง ใช้ไม่ได้
  assert.throws(() => S.emailDecide(p.id, 'coo', p.e, p.t, true, ''), /ลิงก์ไม่ถูกต้อง/);
  assert.throws(() => S.emailDecide(p.id, 'ceo', p.e, 'xxx', true, ''), /ลิงก์ไม่ถูกต้อง/);
  assert.throws(() => S.emailDecide(p.id, 'ceo', p.e, p.t, false, ''), /เหตุผล/);
  assert.equal(S.emailDecide(p.id, 'ceo', p.e, p.t, true, '').status, 'รออนุมัติ');
  assert.equal(S.__mails.length, 2);                                     // ต่อไปถึงคิว COO
  assert.equal(S.__mails[1].to, 'coo@somjai.co.th');
  assert.match(S.__mails[1].htmlBody, /อนุมัติขั้นสุดท้าย/);
  assert.match(S.__mails[1].htmlBody, /เรียน คุณวิภวานี วิทยานนท์</);              // COO เห็นจุดเน้นค่าใช้จ่าย
  assert.match(S.__mails[1].htmlBody, /ค่าน้ำมัน.*1,984 บาท/);
  assert.match(S.__mails[1].htmlBody, />CEO<.*อนุมัติ/);
  assert.throws(() => S.emailDecide(p.id, 'ceo', p.e, p.t, true, ''), /อนุมัติไปแล้ว/);   // กดซ้ำไม่ได้
  const log = S.__sheets['ประวัติการแก้ไข']._rows.filter(x => x[1] === r.id).map(x => x[3]);
  assert.ok(log.includes('CEO อนุมัติ (ลิงก์อีเมล)'));
  assert.equal(J(S.formData_(r.id)).appr.ceo.name, S.settings_().ceoName);  // ใบแจ้งขึ้นชื่อจริง CEO
  // ลิงก์หมดอายุ
  S.__setNow('2026-10-23T03:00:00Z');
  const link2 = S.__mails[1].htmlBody.match(/href="([^"]*view=act[^"]*a=1)"/)[1].replace(/&#38;/g, '&');
  const p2 = Object.fromEntries(new URL(link2).searchParams);
  assert.throws(() => S.emailDecide(p2.id, 'coo', p2.e, p2.t, true, ''), /หมดอายุ/);
});

test('ไม่ใส่อีเมล = ไม่ส่ง', () => {
  const S = ready();
  const r = S.submitRequest({ ...base, mapsUrl: 'https://maps.app.goo.gl/far', value: 2000, feeCharged: '', date: '2026-10-24', plate: 'บห 1782' });
  S.decide('zone', 'zonemgr', 'อธินันท์ วีระจิตต์ (อัฐ)', r.id, true, '', null);
  assert.equal(S.__mails.length, 0);
});

test('อีเมลแจ้ง ผจก.เขต (เฉพาะเขตตัวเอง) และคลัง · ผจก.เขต อนุมัติจากอีเมลได้', () => {
  const S = ready();
  const mail = S.__sheets['อีเมลแจ้งเตือน']._rows;
  assert.ok(mail.some(x => x[0] === 'ผจก.เขต' && x[1] === 'อธินันท์ วีระจิตต์ (อัฐ)'));   // setup ใส่รายชื่อไว้ให้
  assert.ok(mail.some(x => x[0] === 'คลัง' && x[1] === 'จรินทร มีเจริญ'));
  const setMail = (name, email) => { mail.find(x => x[1] === name)[2] = email; };
  setMail('อธินันท์ วีระจิตต์ (อัฐ)', 'att@gmail.com');
  setMail('อนุชา ชัยนิวัติ (โจ้)', 'joe@gmail.com');
  setMail('จรินทร มีเจริญ', 'jarin@gmail.com');
  setMail('ชาญวิทย์ สีสะอาด', 'chanwit@gmail.com');
  const r = S.submitRequest(korat);
  assert.deepEqual(S.__mails.map(m => m.to), ['att@gmail.com']);        // เขตของสายสี่เท่านั้น
  const link = S.__mails[0].htmlBody.match(/href="([^"]*view=act[^"]*a=1)"/)[1].replace(/&#38;/g, '&');
  const p = Object.fromEntries(new URL(link).searchParams);
  assert.equal(p.r, 'zone');
  S.emailDecide(p.id, p.r, p.e, p.t, true, '');
  const row = S.findRequest_(r.id);
  assert.match(row.apprZone, /^อนุมัติ: อธินันท์ วีระจิตต์ \(อัฐ\)/);
  assert.equal(S.__mails[1].to, 'jarin@gmail.com,chanwit@gmail.com');   // ต่อไปถึงคิวคลัง
  assert.match(S.__mails[1].subject, /^\[รอคลัง\]/);
  assert.doesNotMatch(S.__mails[1].htmlBody, /view=act/);               // คลังไม่มีปุ่มอนุมัติในอีเมล
  // ยอดต่ำนอกเส้นทาง: ผจก.เขต และคลังได้พร้อมกันตอนส่งคำขอ
  S.__mails.length = 0;
  S.submitRequest({ ...base, mapsUrl: 'https://maps.app.goo.gl/far', value: 2000, feeCharged: '', date: '2026-10-24', plate: 'บห 1782' });
  assert.deepEqual(S.__mails.map(m => m.to).sort(), ['att@gmail.com', 'jarin@gmail.com,chanwit@gmail.com']);
  // งานปกติ ไม่ส่งอีเมล
  S.__mails.length = 0;
  S.submitRequest({ ...base, date: '2026-10-21', plate: 'ถศ 6598' });
  assert.equal(S.__mails.length, 0);
});

test('สาขาเลื่อน/ยกเลิกเองได้ถึง 16:00 น. ของวันก่อนส่ง (แม้คลังยืนยันแล้ว)', () => {
  const S = ready();
  const a = S.submitRequest({ ...base, date: '2026-10-21', plate: 'ถศ 6598' });
  S.whUpdate('klangsk', 'ชาญวิทย์ สีสะอาด', a.id, 'confirm', { date: '2026-10-21', plate: 'ถศ 6598' });
  let v = J(S.branchRequests('00005')).find(x => x.id === a.id);
  assert.equal(v.canChange, true); assert.equal(v.canMove, true);
  assert.match(v.changeDeadline, /20 ต.ค. 69 16:00/);
  // เลื่อนไปเสาร์ 24 → กลับเป็นรอยืนยัน ให้คลังยืนยันใหม่
  const opts = J(S.moveOptions(a.id));
  assert.ok(!opts.rounds.some(x => x.date === '2026-10-21' && x.plate === 'ถศ 6598'));
  const m = J(S.moveMine(a.id, 'หน่อย', '2026-10-24', 'บห 1782'));
  assert.equal(m.status, 'รอยืนยัน'); assert.equal(m.date, '2026-10-24'); assert.match(m.reason, /สาขาเลื่อนจาก/);
  // อังคาร 20 ต.ค. 16:05 → เลยเวลาสำหรับงานพุธ 21
  const b = S.submitRequest({ ...base, customer: 'ลูกค้า ข', date: '2026-10-21', plate: 'ถศ 6598' });
  S.__setNow('2026-10-20T09:05:00Z');
  assert.equal(J(S.branchRequests('00005')).find(x => x.id === b.id).canChange, false);
  assert.throws(() => S.cancelMine(b.id, 'หน่อย'), /เลยเวลา.*ติดต่อคลัง/);
  assert.throws(() => S.moveMine(b.id, 'หน่อย', '2026-10-24', 'บห 1782'), /เลยเวลา/);
  // งานเสาร์ 24 ยังยกเลิกได้
  assert.equal(S.cancelMine(a.id, 'หน่อย').status, 'ยกเลิก');
  // งานต่างจังหวัด: ยกเลิกได้ แต่เลื่อนผ่านระบบไม่ได้
  const u = S.submitRequest(korat);
  assert.equal(J(S.branchRequests('00005')).find(x => x.id === u.id).canMove, false);
  assert.throws(() => S.moveOptions(u.id), /ต่างจังหวัด/);
});

test('รายงานยืนยันรอบส่งให้สาขา (ล่วงหน้า 1 วัน): อีเมล ข้อความ LINE และหน้ารายงาน', () => {
  const S = ready();
  const mail = S.__sheets['อีเมลแจ้งเตือน']._rows;
  const row = mail.find(x => x[0] === 'สาขา' && String(x[1]).startsWith('00005'));
  assert.ok(row);                                                         // setup ใส่รายชื่อสาขาไว้ให้
  S.setup(); assert.equal(mail.filter(x => x[0] === 'สาขา' && String(x[1]).startsWith('00005')).length, 1);   // รันซ้ำไม่ซ้ำ
  const a = S.submitRequest({ ...base, date: '2026-10-21', plate: 'ถศ 6598', timeWindow: '9-12' });
  const b = S.submitRequest({ ...base, customer: 'ลูกค้า ข', date: '2026-10-21', plate: 'ถศ 6598' });
  S.whUpdate('klangsk', 'ชาญวิทย์ สีสะอาด', a.id, 'confirm', { date: '2026-10-21', plate: 'ถศ 6598' });
  let rep = J(S.confirmReport('klangsk', '2026-10-21'));
  assert.equal(rep.length, 1);
  assert.deepEqual([rep[0].code, rep[0].total, rep[0].confirmed, rep[0].emails.length], ['00005', 2, 1, 0]);
  assert.match(rep[0].text, /ยืนยันรอบส่งสินค้า พ. 21 ต.ค. 69/);
  assert.match(rep[0].text, /โรงเรียน ก · 10 ลัง · ถศ 6598 \(ชวกร/);
  assert.match(rep[0].text, /ยังไม่ยืนยัน/);
  assert.match(rep[0].url, /view=confirm&date=2026-10-21&b=00005&t=/);
  assert.deepEqual(J(S.sendBranchConfirm('klangsk', 'จรินทร มีเจริญ', '2026-10-21', ['00005'])), [{ code: '00005', ok: false, why: 'ยังไม่มีอีเมลสาขา' }]);
  row[2] = 'saysi.branch@gmail.com';
  S.whUpdate('klangsk', 'ชาญวิทย์ สีสะอาด', b.id, 'confirm', { date: '2026-10-21', plate: 'ถศ 6598' });
  assert.deepEqual(J(S.sendBranchConfirm('klangsk', 'จรินทร มีเจริญ', '2026-10-21', ['00005'])), [{ code: '00005', ok: true }]);
  const m = S.__mails.at(-1);
  assert.equal(m.to, 'saysi.branch@gmail.com');
  assert.match(m.subject, /\[ยืนยันรอบส่ง\] พ. 21 ต.ค. 69 · สาขาสายสี่ · 2 รายการ/);
  rep = J(S.confirmReport('klangsk', '2026-10-21'));
  assert.match(rep[0].lastSent, /จรินทร มีเจริญ/);
  // หน้ารายงานของสาขา: โทเคนผิดเปิดไม่ได้
  const url = new URL(rep[0].url);
  assert.equal(S.sheetToken_('confirm|2026-10-21', '00005'), url.searchParams.get('t'));
  assert.notEqual(S.sheetToken_('confirm|2026-10-21', '00006'), url.searchParams.get('t'));
  const d = J(S.confirmData_('2026-10-21', '00005'));
  assert.equal(d.confirmed, 2);
  assert.throws(() => S.confirmReport('wrong', '2026-10-21'), /PIN/);
});

test('ตารางที่ว่างรอบรถให้สาขาดู', () => {
  const S = ready();
  S.submitRequest({ ...base, date: '2026-10-21', plate: 'ถศ 6598' });
  S.submitRequest({ ...base, customer: 'ข', date: '2026-10-21', plate: 'ถศ 6598' });
  S.__sheets['วันหยุด']._rows.push(['2026-10-23', 'วันปิยมหาราช']);
  const t = J(S.slotTable('00005'));
  assert.equal(t.days[0].date, '2026-10-20');                            // จ. 10:00 → จองได้ตั้งแต่พรุ่งนี้
  assert.ok(!t.days.some(d => d.date === '2026-10-25'));                 // ไม่แสดงวันอาทิตย์
  assert.equal(t.days.find(d => d.date === '2026-10-23').holiday, 'วันปิยมหาราช');
  const wed = t.days.find(d => d.date === '2026-10-21').rounds;
  const mine = wed.filter(r => r.mine);
  assert.deepEqual(mine.map(r => [r.plate, r.slots, r.used, r.left]), [['ถศ 6598', 5, 2, 3]]);
  assert.equal(wed[0].plate, 'ถศ 6598');                                  // รอบที่แวะสาขาตัวเองขึ้นก่อน
  assert.ok(wed.length > 1);                                             // มีรอบของรถคันอื่นให้ดูด้วย
  assert.deepEqual(mine[0].route, ['สายสี่']);
});

test('รอบมาตรฐานทุกสาย: ลูกค้าอยู่บนเส้นทางของสายอื่น เลือกรอบนั้นได้ · ตารางรอบประจำสัปดาห์', () => {
  const S = ready();
  // สาขาสายสี่ ขอส่งลูกค้าแถวพระราม 9 → เห็นรอบ จ./พฤ. ของ ถศ 6598 (พระราม 9 › เดอะไนน์) ด้วย
  const q = J(S.quote({ branchCode: '00005', mapsUrl: 'https://maps.app.goo.gl/rama9', value: 5000 }));
  const other = q.rounds.filter(r => !r.own);
  assert.ok(other.some(r => r.date === '2026-10-22' && r.plate === 'ถศ 6598' && r.onRoute));
  assert.ok(other.every(r => r.onRoute));                                // รอบสายอื่นต้องผ่านพื้นที่ลูกค้า
  assert.ok(q.rounds.some(r => r.own && r.date === '2026-10-21'));       // รอบของสาขาตัวเองยังอยู่
  const r = J(S.submitRequest({ ...base, mapsUrl: 'https://maps.app.goo.gl/rama9', value: 5000, date: '2026-10-22', plate: 'ถศ 6598' }));
  assert.equal(r.status, 'รอยืนยัน');
  // ลูกค้าใกล้สาขาตัวเอง ไม่เห็นรอบสายอื่นที่ไม่ผ่าน
  assert.ok(J(S.quote({ branchCode: '00005', mapsUrl: base.mapsUrl, value: 5000 })).rounds.every(x => x.own));
  // ตารางรอบประจำสัปดาห์
  const t = J(S.slotTable('00005'));
  assert.deepEqual(t.weekly.map(w => w.label), ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']);
  const wed = t.weekly[2].rounds.find(x => x.plate === 'ถศ 6598');
  assert.equal(wed.mine, true); assert.equal(wed.slots, 5);
  assert.ok(t.weekly[0].rounds.length >= 4);                             // วันจันทร์มีรถทุกคัน
});

test('โหมดทดสอบ: ทุกสาขาขอคิวได้ ติดป้ายทดสอบ และล้างทิ้งได้', () => {
  const S = ready();
  const set = (k, v) => { S.__sheets['ตั้งค่า']._rows.find(x => x[0] === k)[1] = v; };
  assert.equal(J(S.getBootstrap()).branches.find(x => x.code === '00019').bookable, false);
  const real = J(S.submitRequest({ ...base, customer: 'งานจริง', date: '2026-10-21', plate: 'ถศ 6598' }));
  set('testMode', 'ใช่');
  const b = J(S.getBootstrap());
  assert.equal(b.settings.testMode, true);
  assert.equal(b.branches.find(x => x.code === '00019').bookable, true);   // เปิดทุกสาขา
  const jpg = { name: 'po.jpg', mime: 'image/jpeg', data: Buffer.from('x').toString('base64') };
  const t1 = J(S.submitRequest({ ...base, customer: 'ทดสอบ 1', date: '2026-10-21', plate: 'ถศ 6598', poFiles: [jpg] }));
  const t2 = J(S.submitRequest({ ...korat, customer: 'ทดสอบ 2' }));
  const mine = J(S.branchRequests('00005'));
  assert.equal(mine.find(x => x.id === t1.id).test, true);
  assert.equal(mine.find(x => x.id === real.id).test, false);
  assert.equal(Object.keys(S.__drive.files).length, 2);                  // ใบสั่งซื้อของทั้ง 2 คำขอทดสอบ
  assert.equal(S.clearTestData(), 2);
  const ids = S.__sheets['คำขอ']._rows.slice(1).map(r => r[0]);
  assert.deepEqual(ids, [real.id]);                                       // เหลือแต่งานจริง
  assert.ok(!S.__sheets['ประวัติการแก้ไข']._rows.some(r => r[1] === t1.id || r[1] === t2.id));
  assert.equal(Object.keys(S.__drive.files).length, 0);                  // ไฟล์ใบสั่งซื้อทดสอบถูกลบ
  assert.equal(J(S.branchRequests('00005')).length, 1);
});

test('เกณฑ์กำไรขั้นต้นมากกว่าค่าใช้จ่ายสุทธิ 50% (หักค่าส่งที่เก็บก่อนเทียบ · ปรับได้ที่ gpCostRatio)', () => {
  const S = ready();
  const r = S.submitRequest({ ...korat, grossProfit: 3000 });            // ค่าส่งที่เก็บ 2,340
  S.decide('zone', 'zonemgr', 'อธินันท์ วีระจิตต์ (อัฐ)', r.id, true, '', null);
  S.decide('wh', 'klangsk', 'จรินทร มีเจริญ', r.id, true, '', { date: '2026-10-26', plate: 'บห 1782', cost: { roundTripKm: 496, kmPerLiter: 8, fuelPrice: 32, labor: 300 } });
  let c = J(S.gpCheck_(S.findRequest_(r.id)));
  assert.deepEqual([c.cost, c.fee, c.net, c.need, c.remain, c.ok], [4764, 2340, 2424, 3636, 576, false]);
  const ceo = J(S.approvals('ceo', 'ceoppp', 'CEO'))[0].summary;
  assert.equal(ceo.good, false); assert.match(ceo.verdict, /^✗ ไม่ผ่านเกณฑ์ · กำไรคงเหลือ 576 บาท/);
  assert.deepEqual(ceo.final.map(x => x[0]).slice(0, 5), ['กำไรขั้นต้น', 'หัก ค่าขนส่งที่คลังประเมิน', 'บวก ค่าส่งที่เก็บลูกค้า', 'ค่าใช้จ่ายสุทธิ', 'กำไรคงเหลือหลังหักค่าใช้จ่าย']);
  assert.match(ceo.final[5][1], /ต้องอย่างน้อย 3,636 บาท · ✗ ไม่ผ่าน ขาด 636 บาท/);
  S.__sheets['ตั้งค่า']._rows.find(x => x[0] === 'gpCostRatio')[1] = 1.2;
  c = J(S.gpCheck_(S.findRequest_(r.id)));
  assert.deepEqual([c.need, c.ok], [2909, true]);
});
