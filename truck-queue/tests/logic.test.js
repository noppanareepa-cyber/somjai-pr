// รัน: node --test truck-queue/tests
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../apps-script/Logic.gs'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../apps-script/Seed.gs'), 'utf8'), ctx);
const L = ctx;
// อ็อบเจกต์จาก vm อยู่คนละ realm — แปลงก่อนเทียบ
const plain = (x) => JSON.parse(JSON.stringify(x));

test('ระยะส่งฟรีตามยอดซื้อ', () => {
  assert.equal(L.freeKm_(2999), 0);
  assert.equal(L.freeKm_(3000), 5);
  assert.equal(L.freeKm_(4999), 5);
  assert.equal(L.freeKm_(5000), 10);
  assert.equal(L.freeKm_(39500), 50);   // ช่วงที่ประกาศเว้นไว้ ถือต่อเนื่อง
  assert.equal(L.freeKm_(59500), 100);
  assert.equal(L.freeKm_(60000), 150);
  assert.equal(L.freeKm_(100000), 300);
});

test('ตัวอย่างในประกาศ COO009/69 (กทม.และปริมณฑล)', () => {
  assert.equal(L.policyFee_(5, 3000), 0);
  assert.equal(L.policyFee_(33, 5500), 360);
  assert.equal(L.policyFee_(150, 20000), 1200);
});

test('ตัวอย่างในประกาศ COO009/69 (อัตราต่างจังหวัด 90 บาท)', () => {
  assert.equal(L.policyFee_(20, 8000, null, 90), 0);
  assert.equal(L.policyFee_(145, 20000, null, 90), 900);
  assert.equal(L.policyFee_(220, 50000, null, 90), 1080);
});

test('ค่าส่งปัดขึ้นทุก 10 กม. และยอดต่ำกว่า 3,000 ไม่มีระยะฟรี', () => {
  assert.equal(L.policyFee_(10.04, 5000), 0);   // ปัดทศนิยม 1 ตำแหน่งก่อน
  assert.equal(L.policyFee_(10.1, 5000), 120);
  assert.equal(L.policyFee_(20, 5000), 120);
  assert.equal(L.policyFee_(20.1, 5000), 240);
  assert.equal(L.policyFee_(7, 1500), 120);
  assert.equal(L.policyFee_(0, 1500), 0);
});

test('จังหวัดปริมณฑล', () => {
  assert.equal(L.isMetro_('กรุงเทพมหานคร'), true);
  assert.equal(L.isMetro_('จังหวัดนนทบุรี'), true);
  assert.equal(L.isMetro_('จ. สมุทรสาคร'), true);
  assert.equal(L.isMetro_('Chang Wat Pathum Thani'), true);
  assert.equal(L.isMetro_('Bangkok'), true);
  assert.equal(L.isMetro_('นครราชสีมา'), false);
  assert.equal(L.isMetro_('ฉะเชิงเทรา'), false);
  assert.equal(L.isMetro_(''), false);
});

test('อ่านพิกัดจากลิงก์ Google Maps', () => {
  assert.deepEqual(plain(L.parseLatLng_('https://www.google.com/maps/place/X/@13.75,100.49,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d13.7512!4d100.4934')),
    { lat: 13.7512, lng: 100.4934 });          // !3d!4d มาก่อน @
  assert.deepEqual(plain(L.parseLatLng_('https://maps.google.com/?q=13.80,100.55')), { lat: 13.8, lng: 100.55 });
  assert.deepEqual(plain(L.parseLatLng_('https://www.google.com/maps/search/13.7,+100.5?entry=tts')), { lat: 13.7, lng: 100.5 });
  assert.deepEqual(plain(L.parseLatLng_('13.7563, 100.5018')), { lat: 13.7563, lng: 100.5018 });
  assert.equal(L.parseLatLng_('https://maps.app.goo.gl/abc'), null);
  assert.equal(L.parseLatLng_('@48.85,2.35'), null);  // นอกประเทศไทย
});

test('วันแรกที่จองได้ตามเวลาตัดรอบ 16:00', () => {
  assert.equal(L.earliestDate_('2026-10-15', 15, 16), '2026-10-16');
  assert.equal(L.earliestDate_('2026-10-15', 16, 16), '2026-10-17');
  assert.equal(L.weekday_('2026-10-19'), 1); // จันทร์
});

test('รอบที่สาขาสาย4 จองได้จากตารางตั้งต้น', () => {
  const schedule = L.seedSchedule_();
  const r = L.bookableRounds_({
    branchCode: '00005', schedule, holidays: {}, nowYmd: '2026-10-19', nowHour: 9,
    cutoffHour: 16, horizonDays: 7, used: { '2026-10-21|ถศ 6598': 4 }
  });
  // สาย4: พุธ (ถศ 6598, 5 จุด) และเสาร์ (บห 1782, 5 จุด)
  assert.deepEqual(plain(r.map(x => [x.date, x.plate, x.left])), [
    ['2026-10-21', 'ถศ 6598', 1],
    ['2026-10-24', 'บห 1782', 5]
  ]);
});

test('ตารางใหม่มีผลตามวันที่เริ่มใช้ และข้ามวันหยุด', () => {
  const schedule = [
    { effectiveFrom: '2026-01-01', plate: 'A', weekday: 3, branches: ['X'], slots: 2 },
    { effectiveFrom: '2026-10-22', plate: 'B', weekday: 5, branches: ['X'], slots: 3 }
  ];
  const r = L.bookableRounds_({
    branchCode: 'X', schedule, holidays: { '2026-10-30': true }, nowYmd: '2026-10-19',
    nowHour: 9, cutoffHour: 16, horizonDays: 14, used: {}
  });
  assert.deepEqual(plain(r.map(x => [x.date, x.plate])), [['2026-10-21', 'A'], ['2026-10-23', 'B']]);
});

test('อยู่บนเส้นทางและการต้องอนุมัติ', () => {
  const route = [{ lat: 13.70, lng: 100.40 }, null, { lat: 13.80, lng: 100.60 }];
  assert.equal(L.isOnRoute_(13.72, 100.41, route, 5), true);
  assert.equal(L.isOnRoute_(14.20, 100.41, route, 5), false);
  assert.equal(L.needsApproval_(2999, false), true);
  assert.equal(L.needsApproval_(2999, true), false);
  assert.equal(L.needsApproval_(3000, false), false);
});

test('ทะเบียนรถที่พิมพ์ต่างกัน', () => {
  const trucks = L.seedTrucks_();
  assert.equal(L.canonicalPlate_('ถศ6568', trucks), 'ถศ 6598');
  assert.equal(L.canonicalPlate_('3ฒ6064', trucks), '3ฒจ 6064');
  assert.equal(L.canonicalPlate_('2 ฒช 9770', trucks), '2ฒช 9770');
  assert.equal(L.canonicalPlate_('กข 1', trucks), '');
});

test('การอนุมัติสองฝั่งพร้อมกัน', () => {
  const S = L.STATUS;
  assert.equal(L.approvalStatus_({}), S.APPROVAL);
  assert.equal(L.approvalStatus_({ zone: 'อนุมัติ', ceo: 'อนุมัติ' }), S.APPROVAL);
  assert.equal(L.approvalStatus_({ zone: 'อนุมัติ', ceo: 'อนุมัติ', wh: 'อนุมัติ', coo: 'อนุมัติ' }), S.CONFIRMED);
  assert.equal(L.approvalStatus_({ wh: 'ไม่อนุมัติ: รถเต็ม' }), S.REJECTED);
  assert.equal(L.approvalStepFor_('ceo', {}), null);            // ต้องรอ ผจก.เขต
  assert.equal(L.approvalStepFor_('ceo', { zone: 'อนุมัติ' }), 'ceo');
  assert.equal(L.approvalStepFor_('wh', { zone: '' }), 'wh');   // ฝั่งคลังไม่ต้องรอฝั่งขาย
  assert.equal(L.approvalStepFor_('coo', { wh: 'อนุมัติ' }), 'coo');
  assert.equal(L.approvalStepFor_('coo', { wh: 'อนุมัติ', coo: 'อนุมัติ' }), null);
});

test('วันที่ภาษาไทย', () => {
  assert.equal(L.thaiDate_('2026-10-20'), 'อ. 20 ต.ค. 69');
});

test('ข้อมูลตั้งต้น: ทุกสาขาในตารางรอบรถมีอยู่ในรายชื่อสาขา', () => {
  const codes = new Set(L.seedBranches_().map(b => b[0]));
  for (const r of L.seedSchedule_()) for (const c of r.branches) assert.ok(codes.has(c), c);
  for (const s of L.seedSalesStaff_()) assert.ok(codes.has(s[1]), s.join());
});
