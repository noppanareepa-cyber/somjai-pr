/**
 * รายงานยืนยันการจัดส่งให้สาขา — คลังส่งให้สาขาทราบล่วงหน้า 1 วันก่อนส่ง
 * - แยกตามสาขา: งานของวันนั้น รถ/คนขับ สถานะ (ยืนยันแล้ว / ยังไม่ยืนยัน)
 * - ส่งได้ 2 ทาง: อีเมลถึงสาขา (ใส่อีเมลสาขาในชีต อีเมลแจ้งเตือน กลุ่ม "สาขา") หรือคัดลอกข้อความไปวางใน LINE
 * - สาขาเปิดรายงานผ่านลิงก์ที่มีโทเคน (ผูกวันที่ + รหัสสาขา) ไม่ต้องใส่ PIN
 */

var GROUP_BRANCH = 'สาขา';

/** งานของสาขาในวันส่งนั้น (ไม่รวมงานที่ยกเลิก/ไม่อนุมัติ) */
function confirmData_(date, code) {
  var b = branchMap_()[code] || {};
  var trucks = {};
  trucks_().forEach(function (t) { trucks[t.plate] = t; });
  var items = requests_().filter(function (r) {
    return String(r.date) === date && padCode_(r.branchCode) === code && r.legacy !== true &&
      HOLDING_STATUSES.concat([STATUS.DELIVERED, STATUS.FAILED]).indexOf(r.status) !== -1;
  }).sort(function (a, c) { return String(a.plate).localeCompare(String(c.plate)) || (a.id < c.id ? -1 : 1); }).map(function (r) {
    return { id: r.id, customer: r.customer, requester: r.requester, qty: r.qty, plate: r.plate || '',
      driver: r.driver || (trucks[r.plate] || {}).driver || '', timeWindow: r.timeWindow || '', phone: r.phone || '',
      fee: Number(r.feeCharged) || 0, status: r.status, confirmed: r.status !== STATUS.PENDING && r.status !== STATUS.APPROVAL,
      upcountry: r.kind === KIND_UP };
  });
  return { date: date, dateLabel: thaiDate_(date), code: code, branchName: b.name || code, items: items,
    confirmed: items.filter(function (x) { return x.confirmed; }).length };
}

function confirmUrl_(date, code) {
  return ScriptApp.getService().getUrl() + '?view=confirm&date=' + date + '&b=' + encodeURIComponent(code) + '&t=' + sheetToken_('confirm|' + date, code);
}

function branchEmails_(code) {
  return readAll_(SHEET.MAIL).filter(function (m) {
    return m.group === GROUP_BRANCH && m.email && String(m.name).trim().slice(0, 5) === code;
  }).map(function (m) { return String(m.email).trim(); }).filter(function (e) { return /@/.test(e); });
}

/** ข้อความสำหรับวางใน LINE */
function confirmText_(d, url) {
  var lines = ['✅ ยืนยันรอบส่งสินค้า ' + d.dateLabel, 'สาขา' + d.branchName + ' (' + d.code + ') · ' + d.items.length + ' รายการ'];
  d.items.forEach(function (x, i) {
    lines.push((i + 1) + '. ' + x.customer + ' · ' + x.qty + ' · ' + (x.plate ? x.plate + (x.driver ? ' (' + x.driver + ')' : '') : 'รอจัดรถ') +
      (x.timeWindow ? ' · เวลารับ ' + x.timeWindow : '') + (x.confirmed ? '' : ' · ⚠️ ยังไม่ยืนยัน') + ' · ' + x.id);
  });
  lines.push('ดูรายงาน: ' + url, '— คลังสินค้า');
  return lines.join('\n');
}

/** ภาพรวมทุกสาขาของวันส่ง (คลัง) */
function confirmReport(pin, date) {
  requireRole_('wh', pin);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) throw new Error('วันที่ไม่ถูกต้อง');
  var codes = {};
  requests_().forEach(function (r) {
    if (String(r.date) === date && r.legacy !== true && HOLDING_STATUSES.concat([STATUS.DELIVERED, STATUS.FAILED]).indexOf(r.status) !== -1) {
      codes[padCode_(r.branchCode)] = true;
    }
  });
  var sent = {};
  readAll_(SHEET.LOG).forEach(function (l) {
    if (l.action === 'แจ้งยืนยันสาขา' && String(l.detail).indexOf(date) === 0) sent[String(l.detail).split(' ')[1]] = l.ts + ' · ' + l.actor;
  });
  return Object.keys(codes).sort().map(function (code) {
    var d = confirmData_(date, code), url = confirmUrl_(date, code);
    return { code: code, branchName: d.branchName, total: d.items.length, confirmed: d.confirmed,
      emails: branchEmails_(code), url: url, text: confirmText_(d, url), lastSent: sent[code] || '' };
  });
}

/** ส่งอีเมลยืนยันให้สาขา (codes = รายการรหัสสาขา) */
function sendBranchConfirm(pin, actor, date, codes) {
  requireRole_('wh', pin);
  actor = clean_(actor, 60);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) throw new Error('วันที่ไม่ถูกต้อง');
  return (codes || []).map(function (code) {
    code = padCode_(code);
    var to = branchEmails_(code);
    if (!to.length) return { code: code, ok: false, why: 'ยังไม่มีอีเมลสาขา' };
    var d = confirmData_(date, code);
    if (!d.items.length) return { code: code, ok: false, why: 'ไม่มีงาน' };
    var url = confirmUrl_(date, code);
    var e = function (x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (ch) { return '&#' + ch.charCodeAt(0) + ';'; }); };
    var td = 'padding:5px 8px;border-bottom:1px solid #eee;vertical-align:top';
    var html = '<div style="font-family:sans-serif;font-size:15px;color:#111;max-width:640px">' +
      '<p>เรียน สาขา' + e(d.branchName) + '</p><p>คลังขอยืนยันรอบส่งสินค้า <b>' + e(d.dateLabel) + '</b> จำนวน ' + d.items.length + ' รายการ</p>' +
      '<table style="border-collapse:collapse;width:100%"><tr style="background:#eef4ef"><th style="' + td + ';text-align:left">ลูกค้า</th><th style="' + td +
      ';text-align:left">สินค้า</th><th style="' + td + ';text-align:left">รถ / คนขับ</th><th style="' + td + ';text-align:left">สถานะ</th></tr>' +
      d.items.map(function (x) {
        return '<tr><td style="' + td + '">' + e(x.customer) + '<div style="color:#777;font-size:12px">' + e(x.id) + (x.timeWindow ? ' · เวลารับ ' + e(x.timeWindow) : '') + '</div></td>' +
          '<td style="' + td + '">' + e(x.qty) + '</td><td style="' + td + '">' + e(x.plate || 'รอจัดรถ') + (x.driver ? '<div style="color:#777;font-size:12px">' + e(x.driver) + '</div>' : '') + '</td>' +
          '<td style="' + td + ';color:' + (x.confirmed ? '#1f7a3a' : '#9a5b00') + '">' + e(x.confirmed ? x.status : 'ยังไม่ยืนยัน') + '</td></tr>';
      }).join('') + '</table>' +
      '<p><a href="' + e(url) + '" style="display:inline-block;padding:10px 18px;border-radius:8px;background:#1f7a3a;color:#fff;text-decoration:none;font-weight:bold">เปิดรายงาน / พิมพ์</a></p>' +
      '<p style="font-size:13px;color:#555">กรุณาแจ้งลูกค้าตามวันส่งนี้ · ถ้ามีเปลี่ยนแปลงติดต่อคลังโดยตรง</p></div>';
    try {
      MailApp.sendEmail({ to: to.join(','), subject: '[ยืนยันรอบส่ง] ' + d.dateLabel + ' · สาขา' + d.branchName + ' · ' + d.items.length + ' รายการ',
        htmlBody: html, name: 'คลังสินค้า สมใจ' });
    } catch (err) {
      return { code: code, ok: false, why: err.message };
    }
    log_('', actor, 'แจ้งยืนยันสาขา', date + ' ' + code + ' ' + d.items.length + ' รายการ → ' + to.join(','));
    return { code: code, ok: true };
  });
}

/** หน้ารายงานสำหรับสาขา (เปิดจากลิงก์ในอีเมล/LINE) */
function confirmView_(p) {
  var date = String(p.date || ''), code = padCode_(p.b || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !code || p.t !== sheetToken_('confirm|' + date, code)) {
    return HtmlService.createHtmlOutput('<p style="font-family:sans-serif">ลิงก์รายงานไม่ถูกต้อง</p>');
  }
  var t = template_('ConfirmPage');
  t.data = JSON.stringify(confirmData_(date, code)).replace(/</g, '\\u003c');
  return t.evaluate().setTitle('ยืนยันรอบส่ง ' + date).addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
