/* =========================================================
   KONFIGURASI UNDANGAN — ubah bagian ini saja
   ========================================================= */
window.WEDDING_CONFIG = {
  // URL Web App Google Apps Script (lihat apps-script/README.md).
  // Selama masih kosong, form berjalan dalam "mode demo" (data tidak terkirim).
  scriptUrl: "https://script.google.com/macros/s/AKfycbyzK7jcKZyBt3o7jgiW7sqUc6vba1G5ABMJxnPmpr49hyI4PE5klF4vKLFjuYwlOc3K/exec",

  // Cover kertas dengan jendela oval (desain "Hero + Cover"). Tamu swipe up untuk membuka.
  showCover: true,

  // Musik latar (diputar saat tamu membuka cover). Kosong = tombol musik disembunyikan.
  music: "assets/audio/music.mp3",
  // Judul lagu: tampil sebagai keterangan tombol musik & di notifikasi pemutar HP (layar kunci)
  musicTitle: "Back At One",
  musicArtist: "Brian McKnight",

  // Intro amplop sebelum hero. Dimatikan sampai desain amplop final siap;
  // ubah ke true untuk menampilkan amplop (versi placeholder) lagi.
  showEnvelope: false,

  // Nama default bila link tidak memuat ?to=Nama
  defaultGuest: "Tamu Undangan",

  // Batas jumlah orang di RSVP
  maxGuests: 10,

  // Link "VIEW MAP"
  maps: {
    akad: "https://maps.app.goo.gl/hjr7HZ59aiGdzvP9A",     // Masjid Raya Sheikh Zayed Solo
    resepsi: "https://maps.app.goo.gl/JJZbokrvM8sjuWzx8",  // Gedung IPHI Nglorog Sragen
  },

  // Link tombol "Live Youtube"
  youtube: "https://www.youtube.com/live/nt3W-rmT1K4",
};
