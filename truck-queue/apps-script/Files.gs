/**
 * ใบสั่งซื้อที่แนบกับคำขอ (รูป JPG/PNG หรือ PDF) — เก็บในโฟลเดอร์ Google Drive ของบัญชีที่ติดตั้ง (ไม่แชร์ออกนอก)
 * เปิดดูผ่านลิงก์ของเว็บแอปที่มีโทเคนผูกกับเลขคิวเท่านั้น
 */

var PO_MAX_FILES = 5;
var PO_MAX_BYTES = 4 * 1024 * 1024;
var PO_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };
var PO_FOLDER_NAME = 'ระบบขอคิวรถ - รูปใบสั่งซื้อ';

/** ตรวจไฟล์จากหน้าเว็บ [{name, mime, data(base64)}] → blob · ทำก่อนเข้า lock */
function decodePoFiles_(files, already) {
  if (!files || !files.length) return [];
  if (!Array.isArray(files)) throw new Error('ไฟล์แนบไม่ถูกต้อง');
  if (files.length + (already || 0) > PO_MAX_FILES) throw new Error('แนบรูปใบสั่งซื้อได้ไม่เกิน ' + PO_MAX_FILES + ' ไฟล์ต่อคำขอ');
  return files.map(function (f, i) {
    var mime = String((f && f.mime) || '');
    if (!PO_TYPES[mime]) throw new Error('แนบได้เฉพาะไฟล์ JPG, PNG หรือ PDF');
    var bytes;
    try { bytes = Utilities.base64Decode(String(f.data || '')); } catch (e) { throw new Error('อ่านไฟล์ที่แนบไม่ได้'); }
    if (!bytes.length) throw new Error('อ่านไฟล์ที่แนบไม่ได้');
    if (bytes.length > PO_MAX_BYTES) throw new Error('ไฟล์ใหญ่เกินไป (ไม่เกิน 4 MB ต่อไฟล์)');
    return { bytes: bytes, mime: mime, ext: PO_TYPES[mime], n: i + 1 };
  });
}

function poFolder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('PO_FOLDER');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* โฟลเดอร์ถูกลบ → สร้างใหม่ */ } }
  var folder = DriveApp.createFolder(PO_FOLDER_NAME);
  props.setProperty('PO_FOLDER', folder.getId());
  return folder;
}

/** บันทึกลง Drive แล้วคืนรายการสำหรับเก็บในคอลัมน์ poFiles */
function storePoFiles_(reqId, decoded, startAt) {
  if (!decoded.length) return [];
  var folder = poFolder_();
  return decoded.map(function (d, i) {
    var name = reqId + '-PO-' + ((startAt || 0) + i + 1) + '.' + d.ext;
    var file = folder.createFile(Utilities.newBlob(d.bytes, d.mime, name));
    return { id: file.getId(), name: name };
  });
}

function poFilesOf_(r) {
  if (!r.poFiles) return [];
  try { var a = JSON.parse(r.poFiles); return Array.isArray(a) ? a : []; } catch (e) { return []; }
}

/** ลิงก์หน้าดูใบสั่งซื้อ — มีโทเคนผูกกับเลขคิว */
function poUrl_(id) {
  return ScriptApp.getService().getUrl() + '?view=po&id=' + encodeURIComponent(id) + '&t=' + sheetToken_('po', id);
}

/** ไฟล์ทั้งหมดของคำขอเป็น data URL (ใช้ในหน้าดูใบสั่งซื้อและใบแจ้งพิมพ์) · pdf=true ให้หน้าเว็บวาดเป็นภาพ */
function poImages_(r) {
  return poFilesOf_(r).map(function (f) {
    try {
      var blob = DriveApp.getFileById(f.id).getBlob();
      var mime = blob.getContentType();
      return { name: f.name, pdf: mime === 'application/pdf', src: 'data:' + mime + ';base64,' + Utilities.base64Encode(blob.getBytes()) };
    } catch (e) {
      return { name: f.name, missing: true };
    }
  });
}

/** สาขาแนบใบสั่งซื้อเพิ่มภายหลัง (เฉพาะงานที่ยังไม่จบ) */
function attachPo(id, actor, branchCode, files) {
  actor = clean_(actor, 40);
  if (!actor) throw new Error('กรุณาเลือกชื่อก่อนแนบไฟล์');
  var r0 = findRequest_(id);
  if (padCode_(r0.branchCode) !== padCode_(branchCode)) throw new Error('แนบไฟล์ได้เฉพาะคำขอของสาขาตัวเอง');
  var decoded = decodePoFiles_(files, poFilesOf_(r0).length);
  if (!decoded.length) throw new Error('กรุณาเลือกไฟล์ใบสั่งซื้อ');
  return withLock_(function () {
    var r = findRequest_(id);
    if ([STATUS.CANCELLED, STATUS.REJECTED, STATUS.DELIVERED, STATUS.FAILED].indexOf(r.status) !== -1) {
      throw new Error('คำขอนี้ปิดแล้ว แนบไฟล์เพิ่มไม่ได้');
    }
    var have = poFilesOf_(r);
    if (have.length + decoded.length > PO_MAX_FILES) throw new Error('แนบรูปใบสั่งซื้อได้ไม่เกิน ' + PO_MAX_FILES + ' ไฟล์ต่อคำขอ');
    r.poFiles = JSON.stringify(have.concat(storePoFiles_(r.id, decoded, have.length)));
    r.updatedAt = nowStr_(); r.updatedBy = actor;
    writeRow_(SHEET.REQ, r);
    log_(r.id, actor, 'แนบใบสั่งซื้อ', decoded.length + ' ไฟล์');
    return publicView_(r);
  });
}
