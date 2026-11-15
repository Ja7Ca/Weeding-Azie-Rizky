/**
 * Backend undangan Azie & Rizky — Google Apps Script
 * --------------------------------------------------
 * Sheet yang dipakai (dibuat otomatis bila belum ada):
 *   - "RSVP"   : Waktu | Nama | Kehadiran | Jumlah Orang
 *   - "Ucapan" : Waktu | Nama | Ucapan
 *   - "Tamu"   : Nama | Link Undangan   (untuk membuat link pribadi tiap tamu)
 *
 * Cara pasang: lihat apps-script/README.md
 */

// Alamat website undangan setelah di-hosting (dipakai untuk membuat link tamu)
const SITE_URL = 'https://azie-rizky.example.com/';

const SHEETS = {
  rsvp: { name: 'RSVP', headers: ['Waktu', 'Nama', 'Kehadiran', 'Jumlah Orang'] },
  ucapan: { name: 'Ucapan', headers: ['Waktu', 'Nama', 'Ucapan', 'Sembunyikan'] },
  tamu: { name: 'Tamu', headers: ['Nama', 'Link Undangan'] },
};

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const p = (e && e.parameter) || {};

    if (p.website) return json({ ok: true }); // honeypot terisi → bot

    if (p.type === 'rsvp') {
      const nama = clean(p.nama, 80);
      const kehadiran = p.kehadiran === 'Berhalangan' ? 'Berhalangan' : 'Hadir';
      const jumlah = kehadiran === 'Hadir' ? Math.max(1, Math.min(20, parseInt(p.jumlah, 10) || 1)) : 0;
      if (!nama) return json({ ok: false, error: 'Nama wajib diisi' });
      upsertRsvp(nama, kehadiran, jumlah);
      return json({ ok: true });
    }

    if (p.type === 'ucapan') {
      const nama = clean(p.nama, 80);
      const ucapan = clean(p.ucapan, 600);
      if (!nama || !ucapan) return json({ ok: false, error: 'Nama dan ucapan wajib diisi' });
      sheet(SHEETS.ucapan).appendRow([new Date(), nama, ucapan]);
      CacheService.getScriptCache().remove('ucapan'); // ucapan baru langsung terlihat tamu lain
      return json({ ok: true });
    }

    return json({ ok: false, error: 'Tipe data tidak dikenal' });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/**
 * GET ?type=ucapan → daftar ucapan untuk ditampilkan di website (terbaru di atas).
 * Untuk menyembunyikan ucapan tertentu, isi kolom D ("Sembunyikan") dengan apa saja, mis. "x".
 * Tanpa parameter → cek cepat bahwa Web App aktif.
 */
function doGet(e) {
  const type = e && e.parameter && e.parameter.type;
  if (type !== 'ucapan') return json({ ok: true, message: 'Backend undangan aktif' });

  const cache = CacheService.getScriptCache();
  const cached = cache.get('ucapan');
  if (cached) return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);

  const sh = sheet(SHEETS.ucapan);
  const last = sh.getLastRow();
  let items = [];
  if (last > 1) {
    items = sh.getRange(2, 1, last - 1, 4).getValues()
      .filter((r) => r[1] && r[2] && !String(r[3] || '').trim())
      .map((r) => ({ nama: String(r[1]), ucapan: String(r[2]), waktu: r[0] instanceof Date ? r[0].toISOString() : '' }))
      .reverse()
      .slice(0, 200);
  }
  const out = JSON.stringify({ ok: true, items: items });
  cache.put('ucapan', out, 30); // simpan 30 detik supaya cepat saat banyak tamu membuka
  return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
}

/** Satu tamu = satu baris. Bila tamu mengubah jawaban, barisnya diperbarui. */
function upsertRsvp(nama, kehadiran, jumlah) {
  const sh = sheet(SHEETS.rsvp);
  const last = sh.getLastRow();
  if (last > 1) {
    const names = sh.getRange(2, 2, last - 1, 1).getValues();
    for (let i = 0; i < names.length; i++) {
      if (String(names[i][0]).trim().toLowerCase() === nama.toLowerCase()) {
        sh.getRange(i + 2, 1, 1, 4).setValues([[new Date(), nama, kehadiran, jumlah]]);
        return;
      }
    }
  }
  sh.appendRow([new Date(), nama, kehadiran, jumlah]);
}

/* ---------- Generator link undangan per tamu ---------- */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Undangan')
    .addItem('Buat link untuk semua tamu', 'buatLinkTamu')
    .addToUi();
}

function buatLinkTamu() {
  const sh = sheet(SHEETS.tamu);
  const last = sh.getLastRow();
  if (last < 2) {
    SpreadsheetApp.getUi().alert('Isi nama tamu di kolom A sheet "Tamu" mulai baris 2.');
    return;
  }
  const names = sh.getRange(2, 1, last - 1, 1).getValues();
  const links = names.map(([n]) => [n ? SITE_URL + '?to=' + encodeURIComponent(String(n).trim()) : '']);
  sh.getRange(2, 2, links.length, 1).setValues(links);
}

/* ---------- helper ---------- */
function sheet(def) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(def.name);
  if (!sh) {
    sh = ss.insertSheet(def.name);
    sh.appendRow(def.headers);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, def.headers.length).setFontWeight('bold');
  }
  return sh;
}

function clean(v, max) {
  // buang spasi berlebih & cegah formula injection di Sheets
  let s = String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
