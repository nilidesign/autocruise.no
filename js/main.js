(function () {
  "use strict";

  document.documentElement.classList.add("js");
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* Bildestier – listene i bilder/bilder.js lages av bilder/oppdater.sh.
     Header: bilder/web/header/   Galleri: bilder/web/ (+ små versjoner i web/liten/) */
  const enc = encodeURIComponent;
  const headerSrc = (fil) => "bilder/web/header/" + enc(fil);
  const galSrc = (fil) => "bilder/web/" + enc(fil);
  const altOf = (fil) => (window.BILDETEKSTER || {})[fil] || "Bil fra AutoCruise i Lørenskog";
  function setThumb(img, fil) {
    img.onerror = () => { img.onerror = null; img.src = galSrc(fil); };
    img.src = "bilder/web/liten/" + enc(fil);
  }

  /* ---------- MENY ---------- */
  const nav = $("#nav");
  const burger = $("#burger");
  let lastY = scrollY;

  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Lukk meny" : "Åpne meny");
    document.body.style.overflow = open ? "hidden" : "";
  }
  burger.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  $$("#menu a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

  const links = $$('#menu a[href^="#"]');
  if (links.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    links.forEach((a) => { const s = $(a.getAttribute("href")); if (s) spy.observe(s); });
  }

  /* ---------- SLIDESHOW ---------- */
  const hero = $(".hero");
  const slides = (window.HEADER_BILDER || []).filter(Boolean);
  let lightbox = $("#lightbox");

  if (hero && slides.length) {
    const holder = $("#heroSlides");
    const prog = $("#heroProg");
    const nextImg = $("#heroNextImg");
    const pad = (n) => String(n).padStart(2, "0");
    const DURATION = 6500;
    let index = -1, start = 0, elapsed = 0, paused = false;

    const slideEls = slides.map((s, i) => {
      const el = document.createElement("div");
      el.className = "hero__slide";
      const img = document.createElement("img");
      img.alt = altOf(s);
      if (i > 0) img.loading = "lazy";
      img.src = headerSrc(s);
      el.appendChild(img);
      holder.appendChild(el);
      return el;
    });
    $("#heroTotal").textContent = pad(slides.length);

    function go(i) {
      const prev = index;
      index = (i + slides.length) % slides.length;
      slideEls.forEach((el, n) => {
        el.classList.toggle("is-leaving", n === prev && n !== index);
        el.classList.toggle("is-active", n === index);
      });
      const nxt = slideEls[(index + 1) % slides.length].querySelector("img");
      nxt.loading = "eager";
      nextImg.src = headerSrc(slides[(index + 1) % slides.length]);
      $("#heroNum").textContent = pad(index + 1);
      elapsed = 0;
      start = performance.now();
    }

    function tick(now) {
      if (!paused) {
        const p = clamp((elapsed + now - start) / DURATION);
        prog.style.transform = "scaleX(" + p + ")";
        if (p >= 1) go(index + 1);
      }
      requestAnimationFrame(tick);
    }
    const pause = () => { if (!paused) { paused = true; elapsed += performance.now() - start; } };
    const resume = () => { if (paused) { paused = false; start = performance.now(); } };

    go(0);
    if (slides.length > 1 && !reduceMotion) requestAnimationFrame(tick);
    if (slides.length < 2) $(".hero__bottom").style.visibility = "hidden";
    $("#heroNext").addEventListener("click", () => go(index + 1));

    document.addEventListener("visibilitychange", () => (document.hidden ? pause() : resume()));
    new IntersectionObserver(([e]) => (e.isIntersecting ? resume() : pause())).observe(hero);

    addEventListener("keydown", (e) => {
      if ((lightbox && !lightbox.hidden) || hero.getBoundingClientRect().bottom < 0) return;
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    });

    let sx = null, sy = null;
    hero.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    hero.addEventListener("touchend", (e) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1));
      sx = null;
    });

    if (!reduceMotion && finePointer) {
      hero.addEventListener("mousemove", (e) => {
        const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
        holder.style.transform = "translate3d(" + x * -18 + "px," + y * -12 + "px,0)";
      });
      hero.addEventListener("mouseleave", () => { holder.style.transform = ""; });
    }
  }

  const loaded = () => requestAnimationFrame(() => document.body.classList.add("is-loaded"));
  if (document.readyState === "complete") loaded(); else addEventListener("load", loaded);
  setTimeout(loaded, 1200);

  /* ---------- UTSAGN: ordene tennes mens du scroller ---------- */
  const statement = $("#statement");
  let words = [];
  if (statement) {
    statement.innerHTML = statement.textContent.trim().split(/\s+/)
      .map((w) => '<span class="w">' + w + "</span>").join(" ");
    words = $$(".w", statement);
  }

  /* ---------- GALLERI-SIDEN: mosaikk ---------- */
  const gallery = (window.GALLERI_BILDER || []).filter(Boolean);
  const galGrid = $("#galGrid");

  if (galGrid) {
    const n = gallery.length;
    $("#galCount").textContent = n;
    const items = gallery.map((fil, i) => {
      const b = document.createElement("button");
      b.className = "gal__item reveal";
      b.setAttribute("aria-label", "Åpne bilde: " + altOf(fil));
      const img = document.createElement("img");
      img.alt = altOf(fil);
      img.loading = i < 8 ? "eager" : "lazy";
      img.className = "is-loading";
      img.addEventListener("load", () => img.classList.remove("is-loading"));
      if ([0, 3, 4, 7].includes(i % 8)) img.src = galSrc(fil); else setThumb(img, fil);
      const num = document.createElement("span");
      num.textContent = String(i + 1).padStart(2, "0");
      b.append(img, num);
      b.addEventListener("click", () => openLb(i));
      galGrid.appendChild(b);
      return b;
    });

    // Fast mønster på 8 bilder over 4 kolonner × 4 rader, speilvendt annenhver gang.
    // [kolonne, rad, bredde, høyde]
    const BLOCK = [[1,1,2,2],[3,1,1,1],[4,1,1,1],[3,2,2,1],[1,3,2,1],[3,3,1,2],[4,3,1,2],[1,4,2,1]];
    const place = (b, c, r, w, h) => { b.style.gridColumn = c + " / span " + w; b.style.gridRow = r + " / span " + h; };

    const layout = () => {
      const cols = getComputedStyle(galGrid).gridTemplateColumns.split(" ").length;
      if (cols >= 4) {
        const full = Math.floor(n / 8) * 8;
        items.forEach((b, i) => {
          if (i < full) {
            const blk = Math.floor(i / 8);
            let [c, r, w, h] = BLOCK[i % 8];
            if (blk % 2) c = 6 - c - w;
            place(b, c, r + blk * 4, w, h);
          } else {
            const j = i - full, row = Math.floor(j / 4), inRow = Math.min(4, n - full - row * 4), k = j % 4;
            const widths = [[4], [2, 2], [2, 1, 1], [1, 1, 1, 1]][inRow - 1];
            const c = 1 + widths.slice(0, k).reduce((a, x) => a + x, 0);
            place(b, c, (full / 8) * 4 + row + 1, widths[k], 1);
          }
        });
      } else {
        // 2 kolonner: et stort bilde, så fire små, osv. Siste ensomme bilde blir bredt.
        let row = 1, col = 1;
        items.forEach((b, i) => {
          if (i % 5 === 0) { place(b, 1, row, 2, 2); row += 2; col = 1; return; }
          const last = i === n - 1 && col === 1;
          place(b, col, row, last ? 2 : 1, 1);
          if (col === 2 || last) { col = 1; row++; } else col = 2;
        });
      }
    };
    layout();
    addEventListener("resize", layout);
  }

  /* ---------- SCROLLEFFEKTER (én samlet løkke) ---------- */
  const heroMedia = $("#heroMedia");
  const expand = $("#expand");
  const expandFrame = $("#expandFrame");
  const expandImg = $("#expandImg");
  const expandText = $("#expandText");
  const parallax = $$(".parallax");
  let ticking = false;

  function progressOf(el, startAt, endAt) {
    const r = el.getBoundingClientRect();
    return clamp((startAt - r.top) / (r.height + startAt - endAt));
  }

  function update() {
    ticking = false;
    const y = scrollY, vh = innerHeight;

    nav.classList.toggle("is-scrolled", y > 40);
    if (!nav.classList.contains("is-open")) nav.classList.toggle("is-hidden", y > lastY && y > vh * 0.8);
    lastY = y;

    if (reduceMotion) return;

    if (heroMedia && y < vh * 1.2) {
      heroMedia.style.transform = "translate3d(0," + y * 0.35 + "px,0)";
    }

    if (words.length) {
      const p = progressOf(statement, vh * 0.85, vh * 0.35);
      const lit = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle("is-lit", i < lit));
    }

    if (expand) {
      const r = expand.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - vh));
      const e = 1 - Math.pow(1 - clamp(p / 0.75), 3);
      const iy = 22 * (1 - e), ix = 26 * (1 - e);
      expandFrame.style.clipPath = "inset(" + iy + "% " + ix + "% " + iy + "% " + ix + "%)";
      expandImg.style.transform = "scale(" + (1.35 - 0.3 * e) + ")";
      expandFrame.style.setProperty("--shade", (0.35 * clamp((p - 0.55) / 0.3)).toFixed(3));
      expandText.classList.toggle("is-in", p > 0.62);
    }

    parallax.forEach((img) => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const p = (r.top + r.height / 2 - vh / 2) / (vh + r.height);
      img.style.transform = "translate3d(0," + (p * -14 - 8) + "%,0)";
    });
  }
  const requestUpdate = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener("scroll", requestUpdate, { passive: true });
  addEventListener("resize", requestUpdate);
  update();

  /* ---------- TALL SOM TELLER OPP ---------- */
  const counter = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target, to = +el.dataset.count, t0 = performance.now();
      const run = (now) => {
        const p = clamp((now - t0) / 1600);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(run);
      };
      requestAnimationFrame(run);
      counter.unobserve(el);
    });
  }, { threshold: 0.6 });
  if (!reduceMotion) $$("[data-count]").forEach((el) => { el.textContent = "0"; counter.observe(el); });

  /* ---------- INNFADING ---------- */
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      revealer.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -50px 0px" });
  $$(".reveal").forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    el.style.setProperty("--d", Math.min(sibs.indexOf(el), 5) * 0.07 + "s");
    revealer.observe(el);
  });

  /* ---------- STORBILDE ---------- */
  let lbIndex = 0, lastFocus = null;
  function showLb(i) {
    lbIndex = (i + gallery.length) % gallery.length;
    const g = gallery[lbIndex];
    const img = $("#lbImg");
    img.style.animation = "none"; void img.offsetWidth; img.style.animation = "";
    img.src = galSrc(g);
    img.alt = altOf(g);
    $("#lbCap").textContent = ((window.BILDETEKSTER || {})[g] ? altOf(g) + " — " : "") + (lbIndex + 1) + " / " + gallery.length;
  }
  function openLb(i) {
    lastFocus = document.activeElement;
    showLb(i);
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    $("#lbClose").focus();
  }
  function closeLb() {
    lightbox.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  if (lightbox) {
    $("#lbClose").addEventListener("click", closeLb);
    $("#lbPrev").addEventListener("click", () => showLb(lbIndex - 1));
    $("#lbNext").addEventListener("click", () => showLb(lbIndex + 1));
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLb(); });
    let lx = null;
    lightbox.addEventListener("touchstart", (e) => { lx = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener("touchend", (e) => {
      if (lx === null) return;
      const dx = e.changedTouches[0].clientX - lx;
      if (Math.abs(dx) > 50) showLb(lbIndex + (dx < 0 ? 1 : -1));
      lx = null;
    });
  }
  addEventListener("keydown", (e) => {
    if (!lightbox || lightbox.hidden) { if (e.key === "Escape" && nav.classList.contains("is-open")) setMenu(false); return; }
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowRight") showLb(lbIndex + 1);
    if (e.key === "ArrowLeft") showLb(lbIndex - 1);
  });

  /* ---------- INNBYTTESKJEMA (åpner e-post) ---------- */
  const form = $("#tradeForm");
  if (form) {
    const regnr = $("#regnr");
    regnr.addEventListener("input", () => {
      const v = regnr.value.toUpperCase().replace(/[^A-ZÆØÅ0-9]/g, "");
      const m = v.match(/^([A-ZÆØÅ]{1,2})(\d*)$/);
      regnr.value = m && m[2] ? m[1] + " " + m[2] : v;
    });
    const tlf = $("#tlf");
    tlf.addEventListener("input", () => { tlf.value = tlf.value.replace(/\D/g, ""); });
    const km = $("#km");
    km.addEventListener("input", () => {
      const d = km.value.replace(/\D/g, "");
      km.value = d ? Number(d).toLocaleString("nb-NO") : "";
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let ok = true;
      $$("[required]", form).forEach((inp) => {
        const bad = !inp.value.trim();
        inp.closest(".field").classList.toggle("is-invalid", bad);
        if (bad && ok) { inp.focus(); ok = false; }
      });
      const note = $("#formNote");
      if (!ok) { note.textContent = "Fyll ut feltene som er markert."; note.classList.remove("is-ok"); return; }

      const f = new FormData(form);
      const body = [
        "Hei AutoCruise,", "", "Jeg ønsker et innbyttetilbud på min bil:", "",
        "Registreringsnummer: " + f.get("regnr"),
        "Kilometerstand: " + f.get("km") + " km",
        "Girkasse: " + f.get("gir"), "",
        f.get("melding") ? "Melding: " + f.get("melding") + "\n" : "",
        "Navn: " + f.get("navn"),
        "Telefon: " + f.get("tlf")
      ].join("\n");
      location.href = "mailto:post@autocruise.no?subject=" +
        encodeURIComponent("Innbytte: " + f.get("regnr") + " (via www.autocruise.no)") +
        "&body=" + encodeURIComponent(body);
      note.textContent = "E-postprogrammet ditt åpnes – trykk «Send» der.";
      note.classList.add("is-ok");
    });
    $$("input, textarea", form).forEach((i) => i.addEventListener("input", () => i.closest(".field").classList.remove("is-invalid")));
  }

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
})();
