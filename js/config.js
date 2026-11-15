/* =========================================================
   KONFIGURASI UNDANGAN — ubah bagian ini saja
   ========================================================= */
window.WEDDING_CONFIG = {
  // URL Web App Google Apps Script (lihat apps-script/README.md).
  // Selama masih kosong, form berjalan dalam "mode demo" (data tidak terkirim).
  scriptUrl: "https://script.google.com/macros/s/AKfycbyzK7jcKZyBt3o7jgiW7sqUc6vba1G5ABMJxnPmpr49hyI4PE5klF4vKLFjuYwlOc3K/exec",

  // Intro amplop sebelum hero. Dimatikan sampai desain amplop final siap;
  // ubah ke true untuk menampilkan amplop (versi placeholder) lagi.
  showEnvelope: false,

  // Nama default bila link tidak memuat ?to=Nama
  defaultGuest: "Tamu Undangan",

  // Batas jumlah orang di RSVP
  maxGuests: 10,

  // Link "VIEW MAP"
  maps: {
    akad: "https://maps.google.com/?q=Masjid+Raya+Sheikh+Zayed+Solo",
    resepsi: "https://maps.google.com/?q=Gedung+IPHI+Nglorog+Sragen",
  },

  // Link tombol "Live Youtube"
  youtube: "https://www.youtube.com/",
};
