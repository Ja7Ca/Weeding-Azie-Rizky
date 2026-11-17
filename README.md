# Undangan Azie & Rizky

Website undangan satu halaman, dibuat dengan HTML, CSS, dan JS biasa, dengan GSAP + ScrollTrigger + Lenis yang disimpan lokal di `js/vendor/`. Font pengganti juga lokal di `assets/fonts/fallback/`, jadi website tidak bergantung pada CDN. Tidak perlu proses build.

## Preview di komputer
```bash
python -m http.server 5500
```
Lalu buka:
- `http://localhost:5500/?to=Nayu%20%26%20Partner` → nama tamu tampil di hero
- tambahkan `&skip=1` untuk melewati amplop saat mengedit

## Struktur
| Path | Isi |
|---|---|
| `index.html` | Semua section |
| `css/style.css` | Gaya. Ukuran memakai satuan desain Figma (`calc(N * var(--s))`) |
| `css/fonts.css` | Tempat mengaktifkan font asli |
| `js/config.js` | **URL Apps Script**, link Maps, link YouTube |
| `js/main.js` | Amplop, animasi, galeri, RSVP, ucapan, tombol salin |
| `apps-script/` | Backend Google Sheets + panduan deploy |
| `assets/img/` | Aset hasil ekspor Figma (WebP) |
| `_figma-source/` | Aset asli resolusi penuh. **Jangan di-upload** ke hosting |

## Masih perlu dilengkapi
Kuota Figma MCP (paket Starter) habis sebelum layer berikut sempat diekspor. Ekspor manual dari Figma sebagai PNG @2x, lalu kirimkan:
- [ ] Foto mempelai pria: layer **"REYY0590 3"** di section Mempelai. Saat ini memakai potongan screenshot beresolusi rendah (`assets/img/groom-placeholder.webp`).
- [ ] **"Pink Bellflower Group 1"** (pojok kanan bawah section Mempelai)
- [ ] **"White Poppy Flower Group 2"** dan **"Mask group" (Bell Flower Cluster)** di section Tanda Kasih
