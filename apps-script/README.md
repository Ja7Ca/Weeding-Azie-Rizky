# Menghubungkan form ke Google Sheets

Form **Konfirmasi Kehadiran** dan **Ucapan** mengirim data ke Google Sheets lewat Google Apps Script. Gratis dan tidak butuh server.

## 1. Buat spreadsheet
1. Buka [sheets.new](https://sheets.new) lalu beri nama, misalnya `Undangan Azie & Rizky`.
2. Buka menu **Ekstensi → Apps Script**.

## 2. Tempel kode
1. Hapus isi `Code.gs` di editor, lalu tempel seluruh isi file [`Code.gs`](Code.gs) dari folder ini.
2. Ubah `SITE_URL` menjadi alamat website undangan setelah di-hosting.
3. Klik **Simpan** (ikon disket).

## 3. Deploy sebagai Web App
1. Klik **Terapkan (Deploy) → Deployment baru**.
2. Klik ikon roda gigi, lalu pilih **Aplikasi web**.
3. Isi pengaturannya:
   - **Jalankan sebagai:** *Saya (email kamu)*
   - **Siapa yang memiliki akses:** *Siapa saja*
4. Klik **Terapkan**, lalu izinkan akses saat diminta. Kalau muncul "Google belum memverifikasi aplikasi ini", klik **Lanjutan → Buka (tidak aman)**. Ini wajar karena script-nya buatan sendiri.
5. Salin **URL aplikasi web**. Bentuknya seperti `https://script.google.com/macros/s/AKfy.../exec`.

## 4. Pasang URL di website
Buka `js/config.js`, lalu isi:

```js
scriptUrl: "https://script.google.com/macros/s/AKfy.../exec",
```

Untuk mengetes, buka URL tadi di browser. Kalau muncul `{"ok":true,"message":"Backend undangan aktif"}`, artinya backend sudah aktif.

> Setiap kali `Code.gs` diubah, buka **Terapkan → Kelola deployment → Edit (ikon pensil) → Versi: Versi baru → Terapkan**. URL-nya tetap sama.

## 5. Membuat link pribadi tiap tamu
1. Muat ulang spreadsheet. Akan muncul menu **Undangan**.
2. Buka sheet **Tamu** (dibuat otomatis setelah menu dijalankan sekali), lalu isi nama tamu di kolom A mulai baris 2.
3. Klik **Undangan → Buat link untuk semua tamu**. Kolom B akan terisi link seperti `https://.../?to=Nayu%20%26%20Partner`.
4. Kirim link itu lewat WhatsApp. Nama tamu otomatis muncul di halaman pembuka dan tercatat di sheet RSVP saat mereka konfirmasi.

## Isi sheet
| Sheet | Kolom |
|---|---|
| RSVP | Waktu, Nama, Kehadiran (Hadir/Berhalangan), Jumlah Orang |
| Ucapan | Waktu, Nama, Ucapan |
| Tamu | Nama, Link Undangan |

Kalau seorang tamu mengubah jawaban RSVP, barisnya **diperbarui**, bukan ditambah baris baru.

## Ucapan di website
Ucapan di sheet **Ucapan** tampil di bawah form "Titipkan Doa Baikmu", yang terbaru di atas. Daftarnya diambil saat halaman dibuka. Ucapan baru langsung terlihat oleh tamu yang membuka halaman setelahnya. Ucapan yang disembunyikan atau dihapus manual di sheet bisa butuh hingga 30 detik sebelum hilang dari website.

Untuk **menyembunyikan** ucapan tertentu, misalnya spam atau ucapan yang tidak pantas, isi kolom **D (Sembunyikan)** di baris itu dengan `x`. Barisnya tetap tersimpan di sheet, tapi tidak tampil di website.
