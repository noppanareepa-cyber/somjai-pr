/**
 * หาพิกัด จังหวัด และระยะทางขับรถ ด้วยบริการ Maps ที่มากับ Apps Script
 * ผลลัพธ์เก็บแคชไว้ 6 ชั่วโมง เพื่อไม่ให้เปลืองโควตา
 */

/** ตามลิงก์ย่อ (maps.app.goo.gl, goo.gl, g.co) ไปจนถึง URL จริง */
function expandUrl_(url) {
  var u = String(url || '').trim();
  for (var i = 0; i < 5; i++) {
    if (!/^https?:\/\/(maps\.app\.goo\.gl|goo\.gl|g\.co)\//.test(u)) break;
    var res = UrlFetchApp.fetch(u, { followRedirects: false, muteHttpExceptions: true });
    var loc = res.getHeaders()['Location'] || res.getHeaders()['location'];
    if (!loc) break;
    u = loc;
  }
  return u;
}

function geocodeText_(text) {
  var r = Maps.newGeocoder().setRegion('th').setLanguage('th').geocode(text);
  if (r.status !== 'OK' || !r.results.length) return null;
  var loc = r.results[0].geometry.location;
  return { lat: loc.lat, lng: loc.lng };
}

function provinceOf_(lat, lng) {
  var r = Maps.newGeocoder().setLanguage('th').reverseGeocode(lat, lng);
  if (r.status !== 'OK') return { province: '', formatted: '' };
  var province = '';
  r.results.some(function (res) {
    return res.address_components.some(function (c) {
      if (c.types.indexOf('administrative_area_level_1') !== -1) { province = c.long_name; return true; }
      return false;
    });
  });
  return { province: province, formatted: r.results[0] ? r.results[0].formatted_address : '' };
}

/** หาพิกัดจากลิงก์แผนที่ก่อน ถ้าไม่ได้ค่อยค้นหาจากที่อยู่/ชื่อ */
function locate_(mapsUrl, address) {
  var key = 'loc_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(
    Utilities.DigestAlgorithm.MD5, String(mapsUrl) + '|' + String(address)));
  var cache = CacheService.getScriptCache();
  var hit = cache.get(key);
  if (hit) return JSON.parse(hit);

  var pos = null;
  if (mapsUrl) {
    var full = expandUrl_(mapsUrl);
    pos = parseLatLng_(full);
    if (!pos) {
      var place = full.match(/\/maps\/place\/([^/@]+)/) || full.match(/[?&]q=([^&]+)/);
      if (place) pos = geocodeText_(decodeURIComponent(place[1].replace(/\+/g, ' ')));
    }
  }
  if (!pos && address) pos = parseLatLng_(address) || geocodeText_(address);
  if (!pos) return null;
  var p = provinceOf_(pos.lat, pos.lng);
  var out = { lat: pos.lat, lng: pos.lng, province: p.province, formatted: p.formatted };
  cache.put(key, JSON.stringify(out), 21600);
  return out;
}

/** ระยะทางขับรถ (กม. ทศนิยม 1 ตำแหน่ง) */
function drivingKm_(from, to) {
  var key = ['km', from.lat, from.lng, to.lat, to.lng].join('_');
  var cache = CacheService.getScriptCache();
  var hit = cache.get(key);
  if (hit) return Number(hit);
  var d = Maps.newDirectionFinder().setOrigin(from.lat, from.lng).setDestination(to.lat, to.lng)
    .setMode(Maps.DirectionFinder.Mode.DRIVING).setRegion('th').getDirections();
  if (!d.routes || !d.routes.length) throw new Error('หาเส้นทางขับรถไม่ได้ กรุณาตรวจลิงก์แผนที่');
  var km = Math.round(d.routes[0].legs[0].distance.value / 100) / 10;
  cache.put(key, String(km), 21600);
  return km;
}

/** รันจากเมนู: เติมพิกัดสาขาที่ยังว่างจากลิงก์แผนที่ (หรือชื่อร้านบน Google Maps) */
function updateBranchCoords() {
  var updated = [], failed = [];
  readAll_(SHEET.BRANCH).forEach(function (b) {
    if (Number(b.lat) && Number(b.lng)) return;
    var loc = null;
    try {
      loc = locate_(b.mapsUrl, 'ร้านสมใจ สาขา ' + b.name + ' (' + b.code + ')');
    } catch (e) { /* ข้ามไป รายงานด้านล่าง */ }
    if (!loc) { failed.push(b.code + ' ' + b.name); return; }
    b.lat = loc.lat; b.lng = loc.lng; b.province = loc.province;
    writeRow_(SHEET.BRANCH, b);
    updated.push(b.code + ' ' + b.name);
  });
  var msg = 'เติมพิกัดแล้ว ' + updated.length + ' สาขา' +
    (failed.length ? '\nหาไม่เจอ (ใส่ lat/lng เองในชีต "สาขา"): ' + failed.join(', ') : '');
  Logger.log(msg);
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { /* รันจากตัวแก้ไขสคริปต์ */ }
}
