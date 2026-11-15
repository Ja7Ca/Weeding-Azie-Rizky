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
     HERO — urutan animasi pembuka (mengikuti video referensi)
     ========================================================= */
  function buildHeroTimeline() {
    const leaves = $$(".hero [data-leaf]");
    const flowers = $$(".hero [data-flower]");
    const q = (k) => $(`[data-hero="${k}"]`);

    gsap.set([...leaves, ...flowers], { opacity: 0 });
    gsap.set(["overline", "azie", "amp", "rizky", "date", "kepada", "guest", "dots", "scroll"].map(q), { opacity: 0 });

    const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });

    tl.fromTo(leaves,
      { opacity: 0, scale: 0.82, rotate: (i) => (i % 2 ? 6 : -6) },
      { opacity: 1, scale: 1, rotate: 0, duration: 1.6, stagger: 0.08 }, 0)
      .fromTo(flowers,
        { opacity: 0, scale: 0.7, y: 12 },
        { opacity: 1, scale: 1, y: 0, duration: 1.4, stagger: 0.1, ease: "back.out(1.4)" }, 0.6)
      .fromTo(q("overline"), { opacity: 0, y: 10, letterSpacing: "0.5em" }, { opacity: 1, y: 0, letterSpacing: "0.2em", duration: 1 }, 1.7)
      .fromTo(q("azie"), { opacity: 0, x: -18, filter: "blur(6px)" }, { opacity: 1, x: 0, filter: "blur(0px)", duration: 1.1 }, 2.0)
      .fromTo(q("amp"), { opacity: 0, scale: 0.4, rotate: -90 }, { opacity: 1, scale: 1, rotate: 0, duration: 1, ease: "back.out(1.8)" }, 2.4)
      .fromTo(q("rizky"), { opacity: 0, x: 18, filter: "blur(6px)" }, { opacity: 1, x: 0, filter: "blur(0px)", duration: 1.1 }, 2.6)
      .fromTo(q("date"), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.9 }, 3.1)
      .fromTo(q("kepada"), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.9 }, 3.6)
      .fromTo(q("guest"), { opacity: 0, clipPath: "inset(0 100% 0 0)" }, { opacity: 1, clipPath: "inset(0 0% 0 0)", duration: 1.4, ease: "power2.inOut" }, 3.8)
      .fromTo(q("dots"), { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: 1, ease: "power2.inOut" }, 4.4)
      .fromTo(q("scroll"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 1 }, 4.9)
      .add(startIdleSway, 2.2);

    return tl;
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

  /* =========================================================
     AMPLOP (placeholder)
     ========================================================= */
  const envelope = $("#envelope");
  let heroTl = null;
  if (hasGsap) heroTl = buildHeroTimeline();

  function unlockScroll() {
    document.body.classList.remove("is-locked");
    if (lenis) lenis.start();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  function openInvitation() {
    if (envelope.dataset.opened) return;
    envelope.dataset.opened = "1";

    if (!hasGsap) {
      envelope.remove();
      unlockScroll();
      return;
    }

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
      .add(() => { heroTl && heroTl.play(0); }, "-=0.5")
      .add(() => { envelope.remove(); unlockScroll(); });
  }

  function startWithoutEnvelope() {
    envelope.remove();
    unlockScroll();
    // tunggu font siap supaya animasi teks hero tidak "meloncat" saat font berganti
    const play = () => heroTl && heroTl.play(0);
    if (document.fonts && document.fonts.ready) {
      Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]).then(play);
    } else play();
  }

  if (CFG.showEnvelope) {
    // Amplop diaktifkan di js/config.js → tampilkan & tunggu tamu mengetuk
    envelope.hidden = false;
    document.body.classList.add("is-locked");
    $("#openInvitation").addEventListener("click", openInvitation);
    envelope.addEventListener("click", (e) => { if (e.target === envelope) openInvitation(); });
    // Lewati amplop dengan ?skip=1 (berguna saat mengedit)
    if (params.get("skip") === "1") openInvitation();
  } else {
    startWithoutEnvelope();
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


    // Love story: section tertahan di layar, chapter berikutnya naik menumpuk kartu sebelumnya
    (function storyStack() {
      const cards = $$(".story__card");
      if (cards.length < 2) return;
      const next = cards.slice(1);
      const tilt = [1.2, -1, 0.7]; // kemiringan akhir tiap kartu, seperti tumpukan surat

      gsap.set(next, { visibility: "visible", y: () => window.innerHeight * 0.85, rotate: (i) => tilt[i] * 3 });

      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          trigger: ".story",
          start: "center center",
          end: () => "+=" + window.innerHeight * 0.75 * next.length,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      next.forEach((card, i) => {
        const at = i * 1.25;
        tl.to(card, { y: 0, rotate: tilt[i], duration: 1 }, at);
        // kartu di bawahnya sedikit mengecil, naik, dan meredup
        cards.slice(0, i + 1).forEach((prev, j) => {
          const depth = i + 1 - j;
          tl.to(prev, { scale: 1 - depth * 0.035, y: -depth * 9, duration: 1 }, at)
            .to($(".story__dim", prev), { opacity: Math.min(depth * 0.22, 0.55), duration: 1 }, at);
        });
      });
      tl.to({}, { duration: 0.35 }); // jeda sebentar di chapter terakhir sebelum lanjut
    })();

    // Galeri: foto masuk satu per satu
    gsap.from(".photo", {
      opacity: 0, y: 40, rotate: (i) => (i % 2 ? 6 : -6),
      duration: 1.1, ease: "power3.out", stagger: 0.09,
      scrollTrigger: st(".gallery__viewport", "top 85%"),
    });

    // Ornamen bunga & daun di tiap section: muncul + bergoyang
    $$("section [data-sway], section [data-leaf-sway]").forEach((el, i) => {
      gsap.from(el, { opacity: 0, scale: 0.8, duration: 1.4, ease: "power3.out", scrollTrigger: st(el, "top 95%") });
      sway(el, el.hasAttribute("data-leaf-sway") ? 0.6 : 1.3, 7.5 + (i % 4) * 0.8, (i % 5) * 0.5);
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
  else $(".story").classList.add("is-static"); // tanpa animasi: chapter ditampilkan berurutan

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
    const doneText = $("#rsvpDoneText");
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

    function showDone(status, jumlah) {
      doneText.textContent = status === "Hadir"
        ? `Terima kasih! Kami menantikan kehadiran ${jumlah} orang dari ${guestName === CFG.defaultGuest ? "Anda" : guestName}.`
        : "Terima kasih atas kabarnya. Doa terbaikmu sudah lebih dari cukup bagi kami.";
      form.hidden = true;
      done.hidden = false;
      if (hasGsap) gsap.from(done, { opacity: 0, y: 16, duration: 0.8, ease: "power3.out" });
    }

    const saved = (() => { try { return JSON.parse(localStorage.getItem(storeKey)); } catch { return null; } })();
    if (saved) showDone(saved.status, saved.jumlah);

    $("#rsvpChange").addEventListener("click", () => {
      done.hidden = true; form.hidden = false;
      if (hasGsap) gsap.from(form, { opacity: 0, y: 16, duration: 0.6 });
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
