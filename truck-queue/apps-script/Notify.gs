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

/** เกณฑ์งานต่างจังหวัด: กำไรขั้นต้น ≥ ค่าขนส่ง × gpCostRatio (1.5 = มากกว่าค่าใช้จ่าย 50%) */
function gpCheck_(r) {
  var cost = Number(r.costTotal) || 0, gp = Number(r.grossProfit) || 0;
  if (r.kind !== KIND_UP || !cost) return null;
  var ratio = Number(settings_().gpCostRatio) || 1.5, need = Math.ceil(cost * ratio);
  return { ok: gp >= need, gp: gp, cost: cost, need: need, ratio: ratio, pct: Math.round((ratio - 1) * 100),
    gpPctOfCost: Math.round(gp / cost * 100), gap: gp - need };
}

/**
 * ตัวเลขที่ผู้บริหารใช้ตัดสินใจ — role เปลี่ยนจุดเน้น
 * zone / ceo: คำขอจากสาขา (ยอดขาย กำไร ค่าส่ง ใบสั่งซื้อ) · coo: ค่าใช้จ่ายขนส่ง (อนุมัติขั้นสุดท้าย)
 */
function decisionSummary_(r, role) {
  var up = r.kind === KIND_UP;
  var n = function (v) { return Number(v) || 0; };
  var b = function (v) { return money_(v) + ' บาท'; };
  var c = {}; try { c = r.cost ? JSON.parse(r.cost) : {}; } catch (e) { c = {}; }
  var cost = n(r.costTotal), gp = n(r.grossProfit), fee = r.collectFee === false ? 0 : n(r.feeCharged);
  var chk = gpCheck_(r);
  var verdict = '', good = true;
  if (up && chk) {
    good = chk.ok;
    verdict = (chk.ok ? '✓ ผ่านเกณฑ์' : '✗ ไม่ผ่านเกณฑ์') + ' · กำไรขั้นต้น ' + b(chk.gp) + ' = ' + chk.gpPctOfCost + '% ของค่าขนส่ง ' + b(chk.cost) +
      ' (เกณฑ์: กำไรต้องมากกว่าค่าใช้จ่าย ' + chk.pct + '% คืออย่างน้อย ' + b(chk.need) + (chk.ok ? '' : ' · ขาดอีก ' + b(-chk.gap)) + ')';
  } else if (up) {
    verdict = 'คลังยังไม่ประเมินค่าขนส่ง';
  }
  var head = [['เลขคิว', r.id], ['สาขา', r.branchName + (r.branchManager ? ' · ผู้ขอ ' + r.branchManager : ' · ' + r.requester)],
    ['ลูกค้า', r.customer + ' · ' + (r.province || '')]];
  if (!up) {
    return { kind: 'ยอดต่ำนอกเส้นทาง (กรุงเทพฯ/ปริมณฑล)', good: true, verdict: 'ยอดต่ำกว่าเกณฑ์และอยู่นอกเส้นทางรถ',
      rows: head.concat([['วันส่ง', thaiDate_(String(r.date)) + (r.plate ? ' · ' + r.plate : '')], ['ยอดขาย (ก่อน VAT)', b(r.value)],
        ['ระยะทาง', (r.distanceKm || '-') + ' กม. จากสาขา'],
        ['ค่าส่ง', 'นโยบาย ' + money_(r.feePolicy) + ' · เก็บ ' + b(r.feeCharged) + (r.feeReason ? ' (' + r.feeReason + ')' : '')]]) };
  }
  var feeRow = ['ค่าส่งที่เก็บลูกค้า', r.collectFee === false ? 'ไม่เก็บ' : b(fee) + (r.feePolicy !== '' && n(r.feePolicy) !== fee ? ' (นโยบาย ' + b(r.feePolicy) + ')' : '')];
  var gpRow = ['กำไรขั้นต้น', b(gp) + (r.grossProfitPct !== '' ? ' (' + r.grossProfitPct + '% ของยอดขาย)' : '')];
  if (role === 'coo') {
    var st = parseStamp_(r.apprCeo);
    var rows = head.concat([
      ['วันส่ง / รถ', thaiDate_(String(r.date)) + (r.plate ? ' · ' + r.plate : '') + (c.departTime ? ' · ออก ' + c.departTime + ' น.' : '')],
      ['ระยะไป-กลับ', (c.roundTripKm || '-') + ' กม. · ' + (c.days || 1) + ' วัน · ' + (c.staff || '-') + ' คน'],
      ['ค่าน้ำมัน', b(c.fuel)], ['ค่าเสื่อม', b(c.depreciation)], ['ค่าแรง/OT/เบี้ยเลี้ยง', b(c.labor)],
      ['ทางด่วน · ที่พัก · อื่นๆ', b(n(c.toll)) + ' · ' + b(n(c.lodging)) + ' · ' + b(n(c.other))],
      ['รวมค่าขนส่ง (คลังประเมิน)', cost ? b(cost) : 'ยังไม่ประเมิน']]);
    if (c.privateCost) rows.push(['ถ้าใช้ขนส่งเอกชน', b(c.privateCost) + (c.privateCost < cost ? ' (ถูกกว่า)' : '')]);
    rows.push(gpRow, feeRow);
    if (st) rows.push(['CEO', (st.ok ? 'อนุมัติ' : 'ไม่อนุมัติ') + ' · ' + st.date + ' ' + st.time + (st.note ? ' · ' + st.note : '')]);
    return { kind: 'อนุมัติขั้นสุดท้าย · ค่าใช้จ่ายขนส่งต่างจังหวัด', rows: rows, verdict: verdict, good: good };
  }
  if (role === 'zone' || role === 'ceo') {
    var rr = head.concat([['ประเภทสินค้า', (r.productType || '-') + ' · ' + (r.qty || '')], ['เลขที่ใบสั่งซื้อ', r.poNo || '-'],
      ['ยอดขาย (ก่อน VAT)', b(r.value)], gpRow, feeRow,
      ['วันส่ง', thaiDate_(String(r.date)) + (r.plate ? ' · ' + r.plate : '')], ['ระยะทาง', (r.distanceKm || '-') + ' กม. จากสาขา']]);
    if (cost) rr.push(['ค่าขนส่ง (คลังประเมิน)', b(cost) + (c.roundTripKm ? ' · ไป-กลับ ' + c.roundTripKm + ' กม.' : '')]);
    return { kind: 'คำขอจากสาขา · ส่งลูกค้าต่างจังหวัด', rows: rr, verdict: verdict, good: good };
  }
  var all = head.concat([['วันส่ง', thaiDate_(String(r.date)) + (r.plate ? ' · ' + r.plate : '')], ['ยอดขาย (ก่อน VAT)', b(r.value)],
    ['ระยะทาง', (r.distanceKm || '-') + ' กม. จากสาขา'], gpRow, feeRow,
    ['ค่าขนส่งที่คลังประเมิน', cost ? b(cost) + (c.roundTripKm ? ' (ไป-กลับ ' + c.roundTripKm + ' กม.)' : '') : 'คลังยังไม่ประเมิน']]);
  if (c.privateCost) all.push(['ถ้าใช้ขนส่งเอกชน', b(c.privateCost) + (c.privateCost < cost ? ' (ถูกกว่า)' : '')]);
  return { kind: 'ส่งลูกค้าต่างจังหวัด', rows: all, verdict: verdict, good: good };
}

function money_(v) { return Number(v || 0).toLocaleString('en-US'); }

function sendApprovalMail_(r, role) {
  var rcpt;
  try { rcpt = recipients_(role, r); } catch (e) { return; }
  if (!rcpt.length) return;
  try {
    var canAct = !!ACT_ROLES[role];
    var exp = Date.now() + ACT_TTL_MS;
    var sum = decisionSummary_(r, role);
    var e = function (x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (ch) { return '&#' + ch.charCodeAt(0) + ';'; }); };
    var btn = function (href, label, bg) {
      return '<a href="' + e(href) + '" style="display:inline-block;padding:12px 22px;margin:4px 8px 4px 0;border-radius:8px;background:' + bg +
        ';color:#fff;font-weight:bold;text-decoration:none;font-size:16px">' + label + '</a>';
    };
    var html = '<div style="font-family:sans-serif;font-size:15px;color:#111;max-width:560px">' +
      '<p>เรียน ' + e(rcpt.map(function (m) { return m.name ? 'คุณ' + String(m.name).replace(/^คุณ\s*/, '') : ''; }).filter(String).join(', ') || ROLES[role]) + '</p>' +
      '<p>มีคำขอรอบรถรอ' + (role === 'wh' ? 'คลังใส่ค่าขนส่ง/ยืนยันวันและรถ' : ' ' + ROLES[role] + ' อนุมัติ') + ' (' + e(sum.kind) + ')</p>' +
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
    MailApp.sendEmail({ to: rcpt.map(function (m) { return m.email; }).join(','), subject: (r.test === true ? '[ทดสอบ] ' : '') + (role === 'wh' ? '[รอคลัง] ' : '[รออนุมัติ] ') + r.id + ' · ' + r.customer + ' · ' + r.branchName, htmlBody: html, name: 'ระบบขอคิวรถคลังสินค้า' });
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
      status: r.status, summary: decisionSummary_(r, role), poUrl: poFilesOf_(r).length ? poUrl_(id) : '',
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
