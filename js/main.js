/* =========================================================
   Azie & Rizky — interaksi & animasi
   ========================================================= */
(() => {
  "use strict";

  const CFG = window.WEDDING_CONFIG || {};
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  // Banyak HP Android mengaktifkan "kurangi animasi" (mis. mode hemat daya).
  // Animasi utama tetap jalan; yang dimatikan hanya gerakan terus-menerus, parallax & smooth scroll.
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined";
  // tanpa GSAP tidak ada animasi pembuka → tampilkan isi hero apa adanya
  if (!hasGsap) document.documentElement.classList.remove("js-anim");

  /* ---------- nama tamu dari URL (?to=Nama) ---------- */
  const params = new URLSearchParams(location.search);
  const guestFromUrl = (params.get("to") || params.get("kepada") || "").trim().slice(0, 80);
  const guestName = guestFromUrl || CFG.defaultGuest || "Tamu Undangan";
  $("#guestName").textContent = guestName;

  /* ---------- link dari config ---------- */
  $$("[data-map]").forEach((a) => { a.href = (CFG.maps || {})[a.dataset.map] || "#"; });
  $("#youtubeLink").href = CFG.youtube || "#";

  /* ---------- siapkan foto lebih awal ----------
     Foto mempelai di-decode sejak amplop masih tertutup; foto galeri mulai diunduh
     di latar belakang sesudah halaman siap, supaya saat di-scroll semuanya sudah ada. */
  $$(".oval__photo img").forEach((img) => { if (img.decode) img.decode().catch(() => {}); });
  window.addEventListener("load", () => {
    setTimeout(() => $$(".gallery img[loading='lazy']").forEach((img) => { img.loading = "eager"; }), 1500);
  });

  /* ---------- sparkle di kartu love story (posisi sesuai Figma) ---------- */
  const sparklePos = [[18, 17], [115, 17], [221.4, 17], [327.8, 17], [18, 75], [327.8, 75], [18, 133.4], [327.8, 133.4], [18, 191.4], [327.8, 191.4], [18, 249.8], [115, 249.8], [221.4, 249.8], [327.8, 249.8]];
  $$(".story__sparkles").forEach((box) => {
    sparklePos.forEach(([x, y]) => {
      const i = document.createElement("i");
      i.style.left = `calc(${x - 1} * var(--s))`;
      i.style.top = `calc(${y - 1} * var(--s))`;
      box.appendChild(i);
    });
  });

  /* =========================================================
     SMOOTH SCROLL
     ========================================================= */
  let lenis = null;
  if (!reduceMotion && typeof window.Lenis !== "undefined") {
    lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
    lenis.stop();
    if (hasGsap) {
      lenis.on("scroll", () => window.ScrollTrigger && ScrollTrigger.update());
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* =========================================================
     HERO — animasi pembuka, dipecah dua:
       • teks  : muncul berurutan (saat ada cover, terlihat lewat jendela oval)
       • flora : daun & bunga tumbuh (saat cover dibuka)
     ========================================================= */
  const qh = (k) => $(`[data-hero="${k}"]`);

  function buildHeroText() {
    gsap.set(["overline", "azie", "amp", "rizky", "date", "kepada", "guest", "dots", "scroll"].map(qh), { opacity: 0 });
    return gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
      .fromTo(qh("overline"), { opacity: 0, y: 10, letterSpacing: "0.5em" }, { opacity: 1, y: 0, letterSpacing: "0.2em", duration: 1 }, 0)
      .fromTo(qh("azie"), { opacity: 0, x: -18, filter: "blur(6px)" }, { opacity: 1, x: 0, filter: "blur(0px)", duration: 1.1 }, 0.3)
      .fromTo(qh("amp"), { opacity: 0, scale: 0.4, rotate: -90 }, { opacity: 1, scale: 1, rotate: 0, duration: 1, ease: "back.out(1.8)" }, 0.7)
      .fromTo(qh("rizky"), { opacity: 0, x: 18, filter: "blur(6px)" }, { opacity: 1, x: 0, filter: "blur(0px)", duration: 1.1 }, 0.9)
      .fromTo(qh("date"), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.9 }, 1.4)
      .fromTo(qh("kepada"), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.9 }, 1.9)
      .fromTo(qh("guest"), { opacity: 0, clipPath: "inset(0 100% 0 0)" }, { opacity: 1, clipPath: "inset(0 0% 0 0)", duration: 1.4, ease: "power2.inOut" }, 2.1)
      .fromTo(qh("dots"), { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: 1, ease: "power2.inOut" }, 2.7);
  }

  function buildHeroFlora() {
    const leaves = $$(".hero [data-leaf]");
    const flowers = $$(".hero [data-flower]");
    gsap.set([...leaves, ...flowers], { opacity: 0 });
    return gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
      .fromTo(leaves,
        { opacity: 0, scale: 0.82, rotate: (i) => (i % 2 ? 6 : -6) },
        { opacity: 1, scale: 1, rotate: 0, duration: 1.6, stagger: 0.08 }, 0)
      .fromTo(flowers,
        { opacity: 0, scale: 0.7, y: 12 },
        { opacity: 1, scale: 1, y: 0, duration: 1.4, stagger: 0.1, ease: "back.out(1.4)" }, 0.4)
      // "Scroll to open" hero baru muncul setelah cover terbuka (supaya tidak terlihat di jendela oval)
      .fromTo(qh("scroll"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 1 }, 2.2)
      .add(startIdleSway, 1.8);
  }

  /* Goyangan kiri-kanan seperti tertiup angin (terus-menerus).
     Berayun dari titik tangkai: 0 -> kanan -> 0 -> kiri -> 0. */
  function sway(el, angle, dur, delay = 0, shift = 0) {
    // berayun di sekitar rotasi asli elemen (mis. daun yang di desain miring -135°)
    const base = gsap.getProperty(el, "rotation") || 0;
    return gsap.to(el, {
      keyframes: { rotate: [base, base + angle, base, base - angle, base], x: [0, shift, 0, -shift, 0], easeEach: "sine.inOut" },
      duration: dur, delay, repeat: -1, ease: "none",
    });
  }
  function startIdleSway() {
    // Angin pelan: sudut kecil (±1.2–1.8°), tempo lambat (7–9 dtk per ayunan penuh)
    $$(".hero [data-flower]").forEach((el, i) => sway(el, 1.2 + (i % 3) * 0.3, 7 + (i % 3) * 1, i * 0.6));
    $$(".hero [data-leaf]").forEach((el, i) => sway(el, 0.6, 9 + (i % 3) * 1.2, i * 0.7));
  }

  const heroText = hasGsap ? buildHeroText() : null;
  const heroFlora = hasGsap ? buildHeroFlora() : null;
  const whenFontsReady = (fn) => {
    if (document.fonts && document.fonts.ready) Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]).then(fn);
    else fn();
  };
  // tanpa cover: bunga tumbuh dulu, teks menyusul (seperti versi awal)
  const playHeroFull = () => {
    if (heroFlora) heroFlora.play(0);
    if (heroText) gsap.delayedCall(1.7, () => heroText.play(0));
  };

  function unlockScroll() {
    document.body.classList.remove("is-locked");
    if (lenis) lenis.start();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }
  function lockScroll() {
    document.body.classList.add("is-locked");
    if (lenis) lenis.stop();
  }

  /* =========================================================
     MUSIK (komponen "Music")
     ========================================================= */
  const musicBtn = $("#musicBtn");
  const audio = $("#bgm");
  let resumeOnReturn = false;
  if (CFG.music) audio.src = CFG.music;
  const songName = [CFG.musicArtist, CFG.musicTitle].filter(Boolean).join(" – ");
  if (songName) musicBtn.title = songName;  // keterangan saat kursor diarahkan ke tombol
  // judul lagu di notifikasi pemutar / layar kunci HP
  if (CFG.music && "mediaSession" in navigator && window.MediaMetadata) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: CFG.musicTitle || "Musik", artist: CFG.musicArtist || "", album: "The Wedding of Azie & Rizky",
      artwork: [{ src: "assets/img/music-playing.webp", sizes: "128x128", type: "image/webp" }],
    });
  }
  function setPlaying(on) {
    musicBtn.classList.toggle("is-playing", on);
    musicBtn.setAttribute("aria-label", `${on ? "Jeda" : "Putar"} musik${songName ? ": " + songName : ""}`);
  }
  /* Browser hanya mengizinkan suara setelah "aktivasi" dari tamu: ketuk, klik, atau tombol
     keyboard. Swipe (touchmove) & scroll mouse TIDAK termasuk. Jadi bila percobaan pertama
     ditolak, lagu otomatis diputar pada sentuhan/klik berikutnya di mana pun. */
  const ACTIVATION = ["pointerup", "touchend", "click", "keydown"];
  let wantMusic = false;
  function retryOnActivation(e) {
    if (!wantMusic || !audio.paused) return;
    if (e && e.target && e.target.closest && e.target.closest("#musicBtn")) return; // tombol musik mengurus sendiri
    startMusic();
  }
  function startMusic() {
    if (!CFG.music) return;
    wantMusic = true;
    const p = audio.play();
    if (p && p.then) {
      p.then(() => {
        setPlaying(true);
        ACTIVATION.forEach((ev) => window.removeEventListener(ev, retryOnActivation, true));
      }).catch(() => {
        setPlaying(false);
        ACTIVATION.forEach((ev) => window.addEventListener(ev, retryOnActivation, { capture: true, passive: true }));
      });
    } else setPlaying(!audio.paused);
  }
  function showMusicButton() {
    if (!CFG.music) return;
    musicBtn.hidden = false;
    if (hasGsap) gsap.from(musicBtn, { opacity: 0, scale: 0.6, duration: 0.8, ease: "back.out(1.6)", clearProps: "transform,opacity" });
  }
  musicBtn.addEventListener("click", () => {
    if (audio.paused) startMusic();
    else { audio.pause(); setPlaying(false); }
  });
  // jeda saat tamu pindah aplikasi/tab, lanjut lagi saat kembali
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !audio.paused) { audio.pause(); resumeOnReturn = true; }
    else if (!document.hidden && resumeOnReturn) { resumeOnReturn = false; startMusic(); }
  });

  /* =========================================================
     COVER (frame "Hero + Cover")
     Kertas krem + jendela oval yang pas dengan teks hero; ujung bawah runcing.
     Swipe up / scroll / ketuk → cover naik, bunga hero tumbuh, musik mulai.
     ========================================================= */
  const cover = $("#cover");
  const paper = $("#coverPaper");
  const coverCta = $("#coverOpen");
  const coverBtn = $("#coverBtn");
  // Ukuran gambar "Kertas Cover" dalam satuan desain (lebar 390):
  //   potongan atas 0–740 (pusat oval y=420), potongan bawah 740–981 (sisi panel
  //   berakhir di y=862, ujung runcing di y=981), isian tengah diulang bila layar lebih tinggi.
  const PAPER = { ovalY: 420, topH: 740, bottomH: 241, sideInBottom: 122, tipInBottom: 241, ctaY: 727 };
  let coverOpened = false;
  let coverHeight = 0;

  function drawCover() {
    const W = cover.clientWidth || Math.min(window.innerWidth, 430);
    const s = W / 390;
    const vh = window.innerHeight;
    const hc = $(".hero__content").getBoundingClientRect();
    const cy = (hc.top + window.scrollY + hc.height / 2) / s;   // pusat teks hero (satuan desain)
    const off = (cy - PAPER.ovalY) * s;                          // geser kertas agar oval pas di teks
    const topY = off, topEnd = off + PAPER.topH * s;
    // sisi panel minimal sampai bawah layar; ujung runcing di bawahnya
    const sideY = Math.max(vh + 2, topY + (PAPER.topH + PAPER.sideInBottom) * s);
    const bottomY = sideY - PAPER.sideInBottom * s;
    const px = (v) => `${v}px`;
    const [cap, mid, top, bottom] = paper.children;

    Object.assign(top.style, { top: px(topY), height: px(PAPER.topH * s) });
    Object.assign(bottom.style, { top: px(bottomY), height: px(PAPER.bottomH * s) });
    // isian tengah (bila ada celah antara potongan atas & bawah)
    Object.assign(mid.style, { top: px(topEnd - 2), height: px(Math.max(0, bottomY - topEnd + 4)), backgroundSize: `100% ${60 * s}px` });
    // isian atas (bila kertas tergeser ke bawah)
    Object.assign(cap.style, { top: "0px", height: px(Math.max(0, topY + 2)), backgroundSize: `100% ${18 * s}px` });
    // posisi "Swipe up | To open" sesuai desain, tapi tetap di dalam layar pada HP pendek
    coverCta.style.top = px(Math.min(topY + PAPER.ctaY * s, vh - 46 * s));
    coverBtn.style.top = coverCta.style.top;
    coverHeight = bottomY + PAPER.tipInBottom * s;
    paper.style.height = px(coverHeight);
  }

  function openCover() {
    if (coverOpened) return;
    coverOpened = true;
    startMusic();                                     // gestur tamu = izin memutar audio
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("keydown", onKey);
    if (!hasGsap) { cover.remove(); unlockScroll(); showMusicButton(); return; }
    const dist = coverHeight + 40;
    gsap.to(cover, {
      y: -dist, duration: 1.6, ease: "power3.inOut",
      onComplete: () => { cover.remove(); showMusicButton(); },
    });
    if (heroFlora) heroFlora.play(0);                 // bunga tumbuh saat sampul terangkat
    gsap.delayedCall(0.9, unlockScroll);
  }
  /* Browser (desktop & HP) hanya mengizinkan musik setelah ketukan/klik, bukan scroll/swipe.
     Jadi cover dibuka lewat tombol "Buka Undangan" (atau ketuk di mana saja pada cover);
     scroll/swipe hanya menggoyangkan tombol sebagai petunjuk. */
  let nudging = false;
  function nudgeButton() {
    if (nudging || !hasGsap || coverOpened) return;
    nudging = true;
    gsap.fromTo(coverBtn, { scale: 1 }, { scale: 1.08, duration: 0.18, yoyo: true, repeat: 3, ease: "power1.inOut", clearProps: "transform,translate,scale,rotate", onComplete: () => { nudging = false; } });
  }
  function onWheel(e) { if (e.deltaY > 4) nudgeButton(); }
  function onKey(e) { if (["ArrowDown", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); openCover(); } }

  function setupCover() {
    // selalu mulai dari paling atas supaya teks hero tepat di jendela oval
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    cover.hidden = false;
    lockScroll();
    drawCover();
    // unduh lagu di latar belakang selagi tamu melihat cover, supaya bisa langsung berbunyi
    if (CFG.music) window.addEventListener("load", () => { audio.preload = "auto"; audio.load(); }, { once: true });
    whenFontsReady(() => { drawCover(); if (heroText) heroText.play(0); });
    window.addEventListener("resize", () => { if (!coverOpened) drawCover(); });

    cover.addEventListener("click", openCover);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    // swipe ke atas: tarik cover sedikit mengikuti jari, lalu buka bila cukup jauh
    let startY = null;
    cover.addEventListener("touchstart", (e) => { startY = e.touches[0].clientY; }, { passive: true });
    cover.addEventListener("touchmove", (e) => {
      if (startY == null || coverOpened) return;
      const dy = startY - e.touches[0].clientY;
      // kertas ikut tertarik sedikit, lalu tombol bergoyang memberi petunjuk untuk diketuk
      if (hasGsap && dy > 0) gsap.set(cover, { y: -Math.min(dy, 120) * 0.35 });
      if (dy > 45) nudgeButton();
    }, { passive: true });
    cover.addEventListener("touchend", () => {
      if (!coverOpened && hasGsap) gsap.to(cover, { y: 0, duration: 0.45, ease: "power2.out" });
      startY = null;
    });
  }

  /* =========================================================
     AMPLOP (placeholder, nonaktif) — dipertahankan untuk nanti
     ========================================================= */
  const envelope = $("#envelope");

  function openInvitation() {
    if (envelope.dataset.opened) return;
    envelope.dataset.opened = "1";
    startMusic();
    if (!hasGsap) { envelope.remove(); unlockScroll(); showMusicButton(); return; }
    const seal = $(".envelope__seal");
    seal.style.animation = "none";
    gsap.timeline({ defaults: { ease: "power3.inOut" } })
      .to(seal, { scale: 1.15, duration: 0.25, ease: "power2.out" })
      .to(seal, { scale: 0.6, opacity: 0, rotate: 40, duration: 0.45 })
      .to(".envelope__hint", { opacity: 0, duration: 0.3 }, "<")
      .to(".envelope__flap", { rotateX: 180, duration: 0.9, transformPerspective: 900 }, "-=0.1")
      .set(".envelope__flap", { zIndex: 0 })
      .to(".envelope__body", { y: "60vh", opacity: 0, duration: 0.9, ease: "power2.in" }, "+=0.05")
      .to(envelope, { opacity: 0, duration: 0.7 }, "-=0.45")
      .add(playHeroFull, "-=0.5")
      .add(() => { envelope.remove(); unlockScroll(); showMusicButton(); });
  }

  /* ---------- pilih pembuka sesuai js/config.js ---------- */
  if (CFG.showCover && params.get("skip") !== "1") {
    envelope.remove();
    setupCover();
  } else if (CFG.showEnvelope && params.get("skip") !== "1") {
    cover.remove();
    envelope.hidden = false;
    lockScroll();
    $("#openInvitation").addEventListener("click", openInvitation);
    envelope.addEventListener("click", (e) => { if (e.target === envelope) openInvitation(); });
  } else {
    // tanpa pembuka (atau ?skip=1 saat mengedit): langsung hero
    cover.remove();
    envelope.remove();
    unlockScroll();
    showMusicButton();
    whenFontsReady(playHeroFull);
  }

  /* =========================================================
     ANIMASI SAAT SCROLL
     ========================================================= */
  function setupScrollAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    const st = (el, start = "top 85%") => ({ trigger: el, start, toggleActions: "play none none none" });

    // Kumpulkan elemen [data-reveal="up"] per section supaya muncul berurutan
    $$("section, footer").forEach((section) => {
      const ups = $$('[data-reveal="up"]', section);
      ups.forEach((el, i) => {
        gsap.from(el, { opacity: 0, y: 22, duration: 1, ease: "power3.out", delay: (i % 4) * 0.08, scrollTrigger: st(el, "top 90%") });
      });
    });

    // Kartu lengkung (Q.S. Ar-Rum & Live Streaming): kartu cukup fade, lalu teks naik tipis.
    // clearProps supaya efek hover tombol "Live Youtube" (CSS) tidak tertimpa style GSAP.
    $$(".ayat, .live").forEach((section) => {
      gsap.timeline({ scrollTrigger: st(section, "top 75%") })
        .from($('[data-soft="card"]', section), { opacity: 0, duration: 1.4, ease: "power1.out" })
        .from($$('[data-soft="text"]', section), { opacity: 0, y: 8, duration: 1.1, ease: "power2.out", stagger: 0.18, clearProps: "transform" }, "-=0.6");
    });

    $$('[data-reveal="card"]').forEach((el) => {
      gsap.from(el, { opacity: 0, y: 50, scale: 0.94, duration: 1.3, ease: "power3.out", scrollTrigger: st(el, "top 92%") });
    });

    // Foto mempelai: sudah tampil saat masuk layar (animasi dimulai begitu bingkai menyentuh
    // tepi bawah layar), hanya fade + zoom halus — tanpa efek "terbuka" yang menunda foto.
    $$('[data-reveal="oval"]').forEach((el) => {
      const tl = gsap.timeline({ scrollTrigger: st(el, "top bottom") });
      tl.from(el, { opacity: 0, scale: 0.94, duration: 0.9, ease: "power2.out" })
        .from($(".oval__photo img", el), { scale: 1.08, duration: 1.6, ease: "power2.out" }, 0);
    });

    $$('[data-reveal="ghost"]').forEach((el) => {
      gsap.from(el, { opacity: 0, x: -30, duration: 1.6, ease: "power3.out", scrollTrigger: st(el) });
    });

    $$('[data-reveal="amp"]').forEach((el) => {
      gsap.from(el, { opacity: 0, scale: 0.4, rotate: -120, duration: 1.2, ease: "back.out(1.6)", scrollTrigger: st(el) });
    });

    $$('[data-reveal="line"]').forEach((el) => {
      gsap.from(el, { scaleX: 0, opacity: 0, duration: 1.2, ease: "power2.inOut", scrollTrigger: st(el, "top 90%") });
    });

    $$('[data-reveal="sketch"]').forEach((el) => {
      // ilustrasi "tergambar" dari atas ke bawah
      gsap.from($("img", el), { clipPath: "inset(0 0 100% 0)", opacity: 0.2, duration: 2, ease: "power2.inOut", scrollTrigger: st(el, "top 85%") });
    });

    $$('[data-reveal="pop"]').forEach((el) => {
      gsap.from(el, { opacity: 0, scale: 0.6, duration: 1, ease: "back.out(2)", scrollTrigger: st(el, "top 92%") });
    });


    // Love story: kartu menempel (CSS sticky); saat kartu berikutnya datang menumpuk,
    // kartu di bawahnya sedikit mengecil dan meredup. Jarak scroll = tinggi kartu + jarak (±300px).
    (function storyStack() {
      const items = $$(".story__item");
      // kartu pertama + pitanya muncul; dianimasikan pada isinya (bukan pembungkus) agar tidak
      // bentrok dengan skala tumpukan yang memakai pembungkus .story__item
      const firstParts = [$(".story__card", items[0]), ...$$(".story__ribbon", items[0])];
      gsap.from(firstParts, { opacity: 0, y: 40, duration: 1.2, ease: "power3.out", scrollTrigger: st(items[0], "top 92%") });
      items.slice(0, -1).forEach((item, i) => {
        const next = items[i + 1];
        const card = $(".story__card", item);
        gsap.timeline({
          scrollTrigger: {
            trigger: next,
            start: "top bottom",
            end: () => `top ${parseFloat(getComputedStyle(next).top) || 0}px`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        })
          // yang mengecil pembungkusnya (kartu + pita), supaya pita ikut ukuran kartu
          .to(item, { scale: 0.94, ease: "none" }, 0)
          .to($(".story__dim", card), { opacity: 0.45, ease: "none" }, 0)
          // pita kartu yang tertutup memudar; pita kartu paling depan tetap terlihat di atas
          .to($$(".story__ribbon", item), { opacity: 0, ease: "none" }, 0.4);
      });

    })();

    // Galeri: foto masuk satu per satu
    gsap.from(".photo", {
      opacity: 0, y: 40, rotate: (i) => (i % 2 ? 6 : -6),
      duration: 1.1, ease: "power3.out", stagger: 0.09,
      scrollTrigger: st(".gallery__viewport", "top 85%"),
    });

    // Ornamen bunga & daun di tiap section: muncul + bergoyang
    $$("section [data-sway], section [data-leaf-sway]").forEach((el, i) => {
      // pita Love Story: muncul bersama kartunya & opacity-nya diatur tumpukan kartu
      if (!el.closest(".story__item")) {
        gsap.from(el, { opacity: 0, scale: 0.8, duration: 1.4, ease: "power3.out", scrollTrigger: st(el, "top 95%") });
      }
      // hembusan angin tipis: cukup terasa (±2–2.6° bunga, ±1.3° daun) tapi tetap pelan & lembut
      const leaf = el.hasAttribute("data-leaf-sway");
      sway(el, leaf ? 1.3 : 2 + (i % 3) * 0.3, 5.5 + (i % 4) * 0.7, (i % 5) * 0.45, leaf ? 0.8 : 1.2);
    });

    if (!reduceMotion) $$("[data-parallax]").forEach((el) => {
      const speed = parseFloat(el.dataset.parallax) || 0.1;
      gsap.to(el, {
        yPercent: speed * 100,
        ease: "none",
        scrollTrigger: { trigger: el.closest("section") || el, start: "top bottom", end: "bottom top", scrub: true },
      });
    });

    // Footer: foto muncul dari blur, monogram & tanggal menyusul
    const ft = gsap.timeline({ scrollTrigger: st(".footer__photo", "top 75%") });
    ft.from(".footer__img", { scale: 1.15, filter: "blur(10px) grayscale(1)", opacity: 0.3, duration: 2.2, ease: "power2.out" })
      .from(".footer__monogram", { opacity: 0, y: 20, scale: 0.85, duration: 1.4, ease: "power3.out" }, 0.9)
      .from(".footer__date", { opacity: 0, letterSpacing: "0.6em", duration: 1.2, ease: "power3.out" }, 1.3);
    if (!reduceMotion) gsap.to(".footer__img", {
      yPercent: 6, ease: "none",
      scrollTrigger: { trigger: ".footer__photo", start: "top bottom", end: "bottom top", scrub: true },
    });
  }

  if (hasGsap && window.ScrollTrigger) setupScrollAnimations();

  /* =========================================================
     GALERI — geser, panah, progress bar
     ========================================================= */
  (function gallery() {
    const vp = $("#galleryViewport");
    const thumb = $("#galleryThumb");
    const track = $(".gallery__track", vp);

    function updateThumb() {
      const max = vp.scrollWidth - vp.clientWidth;
      const ratio = vp.clientWidth / vp.scrollWidth;
      const p = max > 0 ? vp.scrollLeft / max : 0;
      thumb.style.width = `${Math.max(ratio * 100, 12)}%`;
      const barW = thumb.parentElement.clientWidth;
      thumb.style.transform = `translateX(${p * (barW - thumb.clientWidth)}px)`;
    }

    function step(dir) {
      const items = $$(".photo", track);
      const left = vp.scrollLeft;
      const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      let target;
      if (dir > 0) target = items.find((it) => it.offsetLeft - pad > left + 4);
      else target = [...items].reverse().find((it) => it.offsetLeft - pad < left - 4);
      const x = target ? target.offsetLeft - pad : dir > 0 ? vp.scrollWidth : 0;
      vp.scrollTo({ left: x, behavior: "smooth" });
    }

    $("#galleryPrev").addEventListener("click", () => step(-1));
    $("#galleryNext").addEventListener("click", () => step(1));
    vp.addEventListener("scroll", updateThumb, { passive: true });
    window.addEventListener("resize", updateThumb);
    $$("img", track).forEach((img) => img.addEventListener("load", updateThumb));
    updateThumb();

    // drag dengan mouse (desktop)
    let down = false, startX = 0, startLeft = 0, moved = false;
    vp.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse") return;
      down = true; moved = false; startX = e.clientX; startLeft = vp.scrollLeft;
      vp.classList.add("is-dragging");
    });
    window.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) moved = true;
      vp.scrollLeft = startLeft - dx;
    });
    window.addEventListener("pointerup", () => {
      if (!down) return;
      down = false; vp.classList.remove("is-dragging");
    });
    vp.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  })();

  /* =========================================================
     KIRIM DATA KE GOOGLE SHEETS (Apps Script)
     ========================================================= */
  async function sendToSheet(payload) {
    if (!CFG.scriptUrl) {
      console.info("[mode demo] scriptUrl belum diisi di js/config.js. Data:", payload);
      await new Promise((r) => setTimeout(r, 700));
      return { ok: true, demo: true };
    }
    const body = new URLSearchParams(payload); // form-urlencoded → tanpa preflight CORS
    try {
      const res = await fetch(CFG.scriptUrl, { method: "POST", body });
      const data = await res.json().catch(() => ({ ok: res.ok }));
      if (!data.ok) throw new Error(data.error || "Gagal mengirim");
      return data;
    } catch (err) {
      // Cadangan: kirim tanpa membaca respons (beberapa browser memblokir redirect Apps Script)
      await fetch(CFG.scriptUrl, { method: "POST", body, mode: "no-cors" });
      return { ok: true, opaque: true };
    }
  }

  /* =========================================================
     RSVP
     ========================================================= */
  (function rsvp() {
    const form = $("#rsvpForm");
    const nameInput = $("#rsvpName");
    const numEl = $("#countValue");
    const done = $("#rsvpDone");
    const max = CFG.maxGuests || 10;
    const storeKey = `rsvp:${guestName.toLowerCase()}`;
    let count = 1;

    if (!guestFromUrl) nameInput.hidden = false;

    function render() {
      numEl.textContent = count;
      if (hasGsap) gsap.fromTo(numEl, { y: -8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" });
    }
    $("#countPlus").addEventListener("click", () => { if (count < max) { count++; render(); } });
    $("#countMinus").addEventListener("click", () => { if (count > 1) { count--; render(); } });

    const titleEl = $("#rsvpTitle");
    const descEl = $("#rsvpDesc");
    const badge = $("#rsvpBadge");
    const original = { title: titleEl.textContent, desc: descEl.textContent };

    function swapIn(els) {
      if (hasGsap) gsap.fromTo(els, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.08, clearProps: "transform" });
    }

    function showDone(status, jumlah, animate = true) {
      const who = guestFromUrl || (nameInput.value.trim() || "");
      if (status === "Hadir") {
        titleEl.textContent = "See you there!";
        descEl.textContent = who ? `Thank you, ${who}! Sampai jumpa di hari bahagia kami.` : "Thank you! Sampai jumpa di hari bahagia kami.";
        badge.className = "rsvp-badge rsvp-badge--yes";
        badge.innerHTML = '<img src="assets/img/icon-check.svg" alt=""><span></span>';
        $("span", badge).textContent = `Hadir · ${jumlah} orang`;
      } else {
        titleEl.textContent = "We'll miss you";
        descEl.textContent = "Thank you for letting us know. Doa baikmu tetap berarti untuk kami.";
        badge.className = "rsvp-badge rsvp-badge--no";
        badge.textContent = "Berhalangan hadir";
      }
      form.hidden = true;
      done.hidden = false;
      if (animate) swapIn([titleEl, descEl, badge, $("#rsvpChange")]);
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }

    const saved = (() => { try { return JSON.parse(localStorage.getItem(storeKey)); } catch { return null; } })();
    if (saved) showDone(saved.status, saved.jumlah, false);

    $("#rsvpChange").addEventListener("click", () => {
      titleEl.textContent = original.title;
      descEl.textContent = original.desc;
      done.hidden = true; form.hidden = false;
      swapIn([titleEl, descEl, form]);
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });

    // e.submitter belum didukung Safari lama -> catat tombol yang diklik
    let clicked = "Hadir";
    $$('button[type="submit"]', form).forEach((b) => b.addEventListener("click", () => { clicked = b.value; }));

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const status = (e.submitter && e.submitter.value) || clicked;
      const nama = guestFromUrl || nameInput.value.trim();
      if (!nama) {
        nameInput.classList.add("is-invalid");
        nameInput.focus();
        return;
      }
      nameInput.classList.remove("is-invalid");
      if (form.website.value) return; // honeypot (bot)

      const buttons = $$("button", form);
      buttons.forEach((b) => (b.disabled = true));
      const jumlah = status === "Hadir" ? count : 0;
      try {
        await sendToSheet({ type: "rsvp", nama, kehadiran: status, jumlah });
        try { localStorage.setItem(storeKey, JSON.stringify({ status, jumlah })); } catch {}
        showDone(status, jumlah);
      } catch (err) {
        alert("Maaf, konfirmasi gagal terkirim. Periksa koneksi lalu coba lagi.");
      } finally {
        buttons.forEach((b) => (b.disabled = false));
      }
    });
  })();

  /* =========================================================
     UCAPAN & DOA
     ========================================================= */
  (function wishes() {
    const form = $("#wishForm");
    const nameEl = $("#wishName");
    const textEl = $("#wishText");
    const btn = $("#wishSubmit");
    const btnLabel = $("span", btn);
    const list = $("#wishList");
    if (guestFromUrl) nameEl.value = guestFromUrl;

    /* ---- daftar ucapan dari Spreadsheet ---- */
    function wishItem(nama, ucapan) {
      const li = document.createElement("li");
      li.className = "wish";
      const n = document.createElement("p");
      n.className = "wish__name";
      n.textContent = nama;           // textContent: aman dari HTML/skrip yang diketik tamu
      const t = document.createElement("p");
      t.className = "wish__text";
      t.textContent = ucapan;
      li.append(n, t);
      return li;
    }
    function refreshLayout() {
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }

    /* Ucapan terbaru di atas. Bila tidak muat dalam satu "jendela", daftar bergulir
       otomatis pelan ke atas dan berulang tanpa putus (isi digandakan untuk sambungan). */
    const track = $(".wish-track", list);
    const SPEED = 18; // px per detik (versi desain 390px), makin kecil makin lambat
    let wishes = [];
    let marquee = null;

    function renderWishes() {
      if (marquee) { marquee.kill(); marquee = null; }
      if (hasGsap) gsap.set(track, { y: 0 });
      track.replaceChildren(...wishes.map((w) => wishItem(w.nama, w.ucapan)));
      list.hidden = !wishes.length;
      if (!wishes.length) return refreshLayout();

      // ukur dengan gaya mode bergulir (padding/garis seragam) supaya sambungan loop mulus
      list.classList.add("is-marquee");
      const scale = list.clientWidth / 300;                 // lebar daftar di desain = 300
      const windowH = 380 * scale;                          // tinggi jendela (sama dgn CSS)
      const contentH = track.scrollHeight;
      if (!hasGsap || contentH <= windowH) list.classList.remove("is-marquee");
      else {
        // gandakan isi supaya ujung bawah menyambung ke awal lagi
        wishes.forEach((w) => {
          const li = wishItem(w.nama, w.ucapan);
          li.setAttribute("aria-hidden", "true");
          track.appendChild(li);
        });
        marquee = gsap.to(track, {
          y: -contentH, duration: contentH / (SPEED * scale), ease: "none", repeat: -1,
        });
      }
      refreshLayout();
    }

    // ukur ulang bila font selesai dimuat atau lebar layar berubah (tinggi item ikut berubah)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => wishes.length && renderWishes());
    let lastW = window.innerWidth, rT;
    window.addEventListener("resize", () => {
      if (window.innerWidth === lastW) return; // abaikan resize karena address bar HP
      lastW = window.innerWidth;
      clearTimeout(rT); rT = setTimeout(() => wishes.length && renderWishes(), 250);
    });

    // berhenti sejenak saat disentuh / disorot supaya mudah dibaca
    const pause = () => marquee && marquee.pause();
    const resume = () => marquee && marquee.resume();
    list.addEventListener("mouseenter", pause);
    list.addEventListener("mouseleave", resume);
    list.addEventListener("touchstart", pause, { passive: true });
    list.addEventListener("touchend", resume);
    list.addEventListener("touchcancel", resume);

    async function loadWishes() {
      if (!CFG.scriptUrl) return;
      try {
        const res = await fetch(`${CFG.scriptUrl}?type=ucapan`);
        const data = await res.json();
        if (!data.ok || !Array.isArray(data.items)) return;
        wishes = data.items; // sudah urut terbaru -> terlama dari Apps Script
        renderWishes();
        if (hasGsap && window.ScrollTrigger && wishes.length) {
          gsap.from(list, { opacity: 0, y: 10, duration: 1, ease: "power2.out", scrollTrigger: { trigger: list, start: "top 92%" } });
        }
      } catch (err) {
        console.warn("Gagal memuat ucapan:", err);
      }
    }
    loadWishes();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      let ok = true;
      [nameEl, textEl].forEach((el) => {
        const bad = !el.value.trim();
        el.classList.toggle("is-invalid", bad);
        if (bad) ok = false;
      });
      if (!ok) return;
      if (form.website.value) return;

      btn.disabled = true;
      btnLabel.textContent = "Mengirim...";
      try {
        const nama = nameEl.value.trim();
        const ucapan = textEl.value.trim();
        await sendToSheet({ type: "ucapan", nama, ucapan });
        textEl.value = "";
        // tampilkan langsung di paling atas daftar
        wishes.unshift({ nama, ucapan });
        renderWishes();
        if (hasGsap) gsap.from($(".wish", track), { opacity: 0, y: -8, duration: 0.7, ease: "power2.out" });
        btnLabel.textContent = "Terkirim, terima kasih!";
        setTimeout(() => { btnLabel.textContent = "Kirim ucapan"; }, 3000);
      } catch (err) {
        btnLabel.textContent = "Kirim ucapan";
        alert("Maaf, ucapan gagal terkirim. Periksa koneksi lalu coba lagi.");
      } finally {
        btn.disabled = false;
      }
    });
    [nameEl, textEl].forEach((el) => el.addEventListener("input", () => el.classList.remove("is-invalid")));
  })();

  /* =========================================================
     SALIN NOMOR REKENING / ALAMAT
     ========================================================= */
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); ta.remove();
    }
  }
  $$(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = btn.dataset.copy || ($("#" + btn.dataset.copyTarget) || {}).textContent || "";
      await copyText(text.trim());
      btn.classList.add("is-copied");
      btn.setAttribute("aria-label", "Tersalin");
      setTimeout(() => btn.classList.remove("is-copied"), 1600);
    });
  });
})();
