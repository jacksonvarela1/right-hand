/* Right Hand NWA: motion system (styles in assets/motion.css).
   One IntersectionObserver drives every [data-fx] entrance. Each is over in under half a second and reads as assembling:
     head      section head: hairline draws, mono label decodes, heading steps up word by word, swoosh draws, lead fades up
     cascade   children land one after another; with data-edge each card flashes a blue edge
     scan      the block steps in under a thin blue beam and its bracket locks onto the corner (data-fx-delay="ms" to stagger)
     scramble  mono text decodes into place
   On phones and tablets nothing is hidden first: a block that scrolls in makes one short move into place.
   Also here: the section HUD, the scroll progress fallback, the cursor spotlight on dark cards and magnetic primary
   CTAs (fine pointers only), press ripples, chip ticks, ghost-button traces and the Admin Map folder.
   Reduced motion, the Pause motion button (html[data-motion=off]) and no-JS all get the finished, static page.
   There is no intro and no cover: nothing in this file can hold back the first paint. Everything waits for DOMContentLoaded. */
(function () {
  "use strict";
  var d = document, html = d.documentElement, W = window;
  var RM = matchMedia("(prefers-reduced-motion: reduce)");
  function off() { return RM.matches || html.getAttribute("data-motion") === "off"; }
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  var HAS_IO = "IntersectionObserver" in W;
  var GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#/+<>";
  var EASE = "cubic-bezier(.23,1,.32,1)", EASE_IO = "cubic-bezier(.65,0,.35,1)";
  var LAND = W.CSS && CSS.supports && CSS.supports("animation-timing-function", "linear(0, 1)") ? "linear(0,.13 6%,.45 13%,.78 20%,.97 27%,1.04 34%,1.05 40%,1.03 48%,1.005 60%,.998 75%,1)" : EASE;
  var timers = [], finishers = [], fxio = null;
  // Phones and tablets get the calm tier: each block makes one short rise instead of word-by-word, card-by-card choreography.
  // Every extra animated piece is another layer to build while the page is moving, which is what makes a scroll stutter.
  var LITE = W.matchMedia("(pointer: coarse), (max-width: 900px)").matches;
  if (LITE) html.classList.add("fx-lite");
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }

  // deferred scripts run before DOMContentLoaded, so this waits for site.js to build its markup (the prototypes arrive later, through assets/lab.js)
  if (d.readyState === "complete") init(); else d.addEventListener("DOMContentLoaded", init);

  function init() {
    pageFallback();
    decorate();
    hud();
    progress();
    if (matchMedia("(hover: hover) and (pointer: fine)").matches) { spotlight(); magnet(); }
    ripple();
    folder();
    d.addEventListener("touchstart", function () {}, { passive: true }); // iOS only paints :active with a touch listener present
    reveals();
    d.addEventListener("rh:motion", function (e) { if (e.detail && e.detail.off) stopAll(); });
  }

  /* ---------- 2. pages without site.js (services, about): the motion button, swooshes, method chips, check lists ---------- */
  function pageFallback() {
    if (W.RH && W.RH.site) return;
    var mb = $("#motion-btn");
    if (mb) {
      var paint = function () { var o = html.getAttribute("data-motion") === "off"; mb.setAttribute("aria-pressed", String(o)); mb.textContent = o ? "Play motion" : "Pause motion"; };
      paint();
      mb.addEventListener("click", function () {
        var o = html.getAttribute("data-motion") !== "off";
        if (o) { html.setAttribute("data-motion", "off"); html.classList.remove("js-motion"); }
        else { html.removeAttribute("data-motion"); if (!RM.matches) html.classList.add("js-motion"); }
        try { localStorage.setItem("rh-motion", o ? "off" : "on"); } catch (e) {}
        paint();
        d.dispatchEvent(new CustomEvent("rh:motion", { detail: { off: o } }));
      });
    }
    // the checks in these lists draw themselves as each list scrolls in. html.seq is what holds them un-drawn until then
    // (site.css), and it is set here, by the script that draws them.
    var groups = $$(".loop3, .steps, .inc, .prom");
    function light(g, now) {
      if (g.classList.contains("loop3")) {
        var c = $$("li:not(.arrw)", g);
        var end = function () { c.forEach(function (x, i) { x.classList.add("lit"); x.classList.toggle("on", i === c.length - 1); }); };
        if (now) { end(); return; }
        c.forEach(function (x, i) { later(function () { c.forEach(function (y) { y.classList.remove("on"); }); x.classList.add("on", "lit"); if (i === c.length - 1) end(); }, i * 140); });
        return;
      }
      $$(".ck", g).forEach(function (x, i) { if (now) x.classList.add("on"); else later(function () { x.classList.add("on"); }, 60 + i * 90); });
    }
    finishers.push(function () { groups.forEach(function (g) { light(g, true); }); });
    if (off() || !HAS_IO) { finishers[finishers.length - 1](); return; }
    html.classList.add("seq");
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (!e.isIntersecting) return; io.unobserve(e.target); light(e.target, off()); });
    }, { threshold: .3 });
    groups.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 3. static decoration: chip ticks and ghost-button traces (demo stages keep their own controls) ---------- */
  var TICK = '<svg class="fx-tick" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect class="bx" x="4" y="4" width="16" height="16" rx="4"/><path class="c" pathLength="1" d="M6 12.5l4 4 8-9"/></svg>';
  var TRACE = '<svg class="fx-trace" aria-hidden="true" focusable="false"><rect width="100%" height="100%" rx="10" pathLength="1"/></svg>';
  function decorate() {
    $$(".chip").forEach(function (c) {
      if (c.closest(".stage") || $(".fx-tick", c)) return;
      var inp = $("input", c);
      if (inp) inp.insertAdjacentHTML("afterend", TICK); else c.insertAdjacentHTML("afterbegin", TICK);
    });
    $$(".btn.ghost").forEach(function (b) { if (!b.closest(".stage") && !$(".fx-trace", b)) b.insertAdjacentHTML("beforeend", TRACE); });
  }

  /* ---------- 4. entrances ---------- */
  // An entrance plays only for something arriving at the bottom of the screen. Whatever comes in from above (scrolling back
  // up), or is already well up the screen when it is first seen (a fast flick), is shown settled. The observer's own numbers
  // say which, so nothing has to read the scroll position while the page is moving.
  // A flick (the trigger line overshot by more than FLICK px in one frame) settles everything for a moment, too.
  var FLICK = LITE ? 40 : 110, flickAt = -1e9;
  function late(e) {
    var rb = e.rootBounds; if (!rb) return e.boundingClientRect.top < 0;
    var over = rb.bottom - e.boundingClientRect.top;
    if (over > FLICK) flickAt = e.time;
    return over > rb.bottom * .4 || e.time - flickAt < 450;
  }
  function reveals() {
    var els = $$("[data-fx]");
    if (off() || !HAS_IO) { els.forEach(settle); return; }
    // anything already on screen is settled as it is, so nothing blinks out
    var vh = innerHeight, rs = els.map(function (el) { return el.getBoundingClientRect(); });
    var todo = els.filter(function (el, i) { var r = rs[i], seen = r.top < vh && r.bottom > 0; if (seen || LITE) settle(el); return !seen; });
    // calm tier: everything is already in its finished state and stays visible; a block still below the screen is only
    // marked, so it makes its one short move when it scrolls in
    if (LITE) todo.forEach(function (el) { el._fxw = true; }); else todo.forEach(prep);
    html.classList.add("fx");
    fxio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (!e.isIntersecting) return; fxio.unobserve(e.target); if (late(e)) settle(e.target); else fire(e.target, e.boundingClientRect.height); });
    }, { threshold: 0, rootMargin: LITE ? "100% 0px 0px 0px" : "100% 0px -12% 0px" });
    todo.forEach(function (el) { fxio.observe(el); });
  }
  function prep(el) {
    var t = el.getAttribute("data-fx");
    if (t === "cascade") Array.prototype.forEach.call(el.children, function (c, i) { c.style.setProperty("--k", Math.min(i, 6)); });
    else if (t === "head") { var eb = $(":scope > .eyebrow", el), h = $("h2", el); if (eb) scrPrep(eb); if (h) words(h); }
    else if (t === "scramble") scrPrep(el);
  }
  function fire(el, hgt) {
    if (LITE) {
      if (!el._fxw) return;
      el._fxw = false;
      // never from invisible: if the phone is busy and this starts a few frames late, the words were readable all along
      if (!off() && el.animate) el.animate([{ opacity: .35, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 380, easing: EASE });
      return;
    }
    if (el.classList.contains("fx-in")) return;
    if (off()) { settle(el); return; }
    var t = el.getAttribute("data-fx");
    el.classList.add("fx-in");
    if (t === "head") {
      var v = $(":scope > .eyebrow .fx-scr", el); if (v) scramble(v, 300);
      $$(".sw", el).forEach(function (s) { s.classList.add("in"); });
      later(function () { el.classList.add("fx-done"); }, 620);
    } else if (t === "cascade") later(function () { el.classList.add("fx-done"); }, Math.min(el.children.length, 7) * 30 + 520);
    else if (t === "scan") scan(el, hgt);
    else if (t === "scramble") { var s = $(".fx-scr", el); if (s) scramble(s, 320); later(function () { el.classList.add("fx-done"); }, 400); }
    else el.classList.add("fx-done");
  }
  function settle(el) {
    el._fxw = false;
    el.classList.add("fx-in", "fx-done");
    $$(".sw", el).forEach(function (s) { s.classList.add("in"); });
    $$(".fx-scr", el).forEach(function (v) { v._stop = true; var t = v.getAttribute("data-t"); if (t) v.textContent = t; });
    var sc = $(":scope > .fx-scan", el); if (sc) sc.parentNode.removeChild(sc);
  }
  // heading words: the visible copy is split into rising words; the heading keeps its full text as its accessible name
  function words(h) {
    if ($(".fx-w", h)) return;
    var label = h.textContent.replace(/\s+/g, " ").trim(), wrap = d.createElement("span"), cur = null, n = 0;
    wrap.setAttribute("aria-hidden", "true");
    function word() { cur = d.createElement("span"); cur.className = "fx-w"; cur.style.setProperty("--w", n++); wrap.appendChild(cur); }
    Array.prototype.slice.call(h.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        node.nodeValue.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { wrap.appendChild(d.createTextNode(" ")); cur = null; }
          else { if (!cur) word(); cur.appendChild(d.createTextNode(part)); }
        });
      } else { if (!cur) word(); cur.appendChild(node); }   // punctuation right after a swoosh stays glued to it
    });
    h.textContent = ""; h.appendChild(wrap);
    h.setAttribute("aria-label", label); h.style.setProperty("--n", n);
  }
  // scramble text: screen readers get the real words, the eye gets a mono decode (every glyph is one cell wide, so nothing moves)
  function scrPrep(el) {
    if ($(".fx-scr", el)) return;
    var txt = el.textContent, sr = d.createElement("span"), vis = d.createElement("span");
    sr.className = "sr-only"; sr.textContent = txt;
    vis.className = "fx-scr"; vis.setAttribute("aria-hidden", "true"); vis.textContent = txt; vis.setAttribute("data-t", txt);
    el.textContent = ""; el.appendChild(sr); el.appendChild(vis);
  }
  function scramble(vis, dur, text) {
    if (text != null) vis.setAttribute("data-t", text);
    var fin = vis.getAttribute("data-t") || vis.textContent, n = fin.length, t0 = performance.now(), last = -99;
    vis.setAttribute("data-t", fin); vis._stop = false;
    if (off()) { vis.textContent = fin; return; }
    (function f(t) {
      if (vis._stop) { vis.textContent = fin; return; }
      var p = Math.min(1, (t - t0) / dur);
      if (t - last > 38 || p === 1) {
        last = t;
        var s = "";
        for (var i = 0; i < n; i++) { var c = fin.charAt(i); s += p === 1 || /[\s.,:;\/&'·()+-]/.test(c) || i / n < p * 1.2 - .2 ? c : GLYPHS.charAt((Math.random() * GLYPHS.length) | 0); }
        vis.textContent = s;
      }
      if (p < 1) requestAnimationFrame(f);
    })(t0);
  }
  // scan: the block steps in (motion.css) while a thin blue beam passes over it. Nothing covers the block.
  function scan(el, hgt) {
    // the observer has already measured the block; asking again here would force a layout in the middle of a scroll
    var h = (hgt || el.offsetHeight) + 60, w = d.createElement("span"), wait = +(el.getAttribute("data-fx-delay") || 0);
    w.className = "fx-scan"; w.setAttribute("aria-hidden", "true"); w.innerHTML = "<i></i>";
    if (wait) el.style.animationDelay = wait + "ms";
    el.appendChild(w);
    w.firstChild.animate([{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(" + h + "px)", opacity: 1, offset: .85 }, { transform: "translateY(" + h + "px)", opacity: 0 }],
      { duration: Math.min(460, 300 + h * .15), delay: wait, easing: EASE_IO, fill: "both" }).onfinish = function () {
      if (w.parentNode) w.parentNode.removeChild(w);
      el.style.animationDelay = "";
      el.classList.add("fx-done");
    };
  }
  function stopAll() {
    timers.forEach(clearTimeout); timers = [];
    $$("[data-fx]").forEach(settle);
    finishers.forEach(function (f) { f(); });
    // whatever is still in flight (a swoosh mid-draw, a card mid-rise) lands now; loops and paused demo steps are left alone
    if (d.getAnimations) d.getAnimations().forEach(function (a) {
      try { var t = a.effect && a.effect.getComputedTiming(); if (a.playState === "running" && t && t.iterations !== Infinity) a.finish(); } catch (e) {}
    });
    $$(".fx-mag").forEach(function (b) { b.style.translate = ""; b.style.scale = ""; });
    $$(".fx-lit").forEach(function (c) { c.classList.remove("fx-lit"); });
  }

  /* ---------- 5. section HUD: "04 / 10 HOW IT WORKS", plus the nav link for the section you are in.
     The hero counts as 00 (the HUD is hidden there), so the numbers are the ones printed in the section labels. ---------- */
  function hud() {
    var tops = $$("main > section");
    if (tops.length < 3 || !HAS_IO) return;
    var all = $$("main section").filter(function (s) { return s.parentNode.tagName === "MAIN" || s.hasAttribute("data-hud"); });
    var el = d.createElement("div");
    el.className = "fx-hud is-top"; el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<span class="hud-n">00</span><span class="hud-ticks">' + tops.slice(1).map(function () { return "<i></i>"; }).join("") + '</span><span class="hud-of">/ ' + pad(tops.length - 1) + '</span><span class="hud-l"></span>';
    d.body.appendChild(el);
    var num = $(".hud-n", el), lab = $(".hud-l", el), ticks = $$(".hud-ticks i", el), nav = $$('.top nav a[href^="#"]'), on = all.map(function () { return false; }), now = -1;
    // the HUD is hidden on phones (motion.css), so nothing is painted into it there
    var shown = W.matchMedia("(min-width: 1101px)");
    if (shown.addEventListener) shown.addEventListener("change", function () { if (shown.matches && now >= 0) paint(now); });
    function label(s) {
      var t = s.getAttribute("data-hud"); if (t) return t;
      var e = $(".eyebrow", s), h = $("h1, h2", s);
      return ((e && e.textContent) || (h && h.textContent) || "").split(" · ")[0].trim();
    }
    function paint(i) {
      var s = all[i], top = s.parentNode.tagName === "MAIN" ? s : s.closest("main > section"), ti = tops.indexOf(top);
      num.textContent = pad(ti);
      ticks.forEach(function (t, j) { t.classList.toggle("on", j === ti - 1); });
      el.classList.toggle("is-top", ti === 0);
      el.classList.toggle("on-light", !top.classList.contains("dark"));
      scramble(lab, 280, label(s));
      nav.forEach(function (a) { a.classList.toggle("fx-cur", !!top.id && a.getAttribute("href") === "#" + top.id); });
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { on[all.indexOf(e.target)] = e.isIntersecting; });
      var i = on.lastIndexOf(true);
      if (i >= 0 && i !== now) { now = i; if (shown.matches) paint(i); }
    }, { rootMargin: "-45% 0px -54% 0px" });
    all.forEach(function (s) { io.observe(s); });
  }

  /* ---------- 7. scroll progress line for browsers without scroll-driven animations ---------- */
  function progress() {
    var rail = $(".progress-rail");
    if (!rail || (W.CSS && CSS.supports && CSS.supports("animation-timeline: scroll()"))) return;
    // a phone gets no fallback line: keeping it in step would mean measuring the page on every scroll frame
    if (W.matchMedia("(pointer: coarse)").matches) return;
    var raf = 0, h = 0;
    function measure() { h = html.scrollHeight - innerHeight; }
    measure(); addEventListener("resize", measure); addEventListener("load", measure);
    if (W.ResizeObserver) new ResizeObserver(measure).observe(d.body);
    function paint() {
      raf = 0;
      if (off()) { rail.style.transform = ""; return; }
      rail.style.transform = "scaleX(" + (h > 0 ? Math.min(1, Math.max(0, scrollY / h)) : 0).toFixed(4) + ")";
    }
    addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
    d.addEventListener("rh:motion", paint);
    paint();
  }

  /* ---------- 8. fine pointers: a soft spotlight follows the cursor on dark cards; primary CTAs lean toward it ---------- */
  function spotlight() {
    $$(".win, .terms, .lab, .line-links a, .page-cta .wrap").forEach(function (card) {
      if (card.closest(".stage")) return;
      var clip = d.createElement("span");
      clip.className = "fx-spot-clip"; clip.setAttribute("aria-hidden", "true"); clip.innerHTML = '<span class="fx-spot"></span>';
      card.insertBefore(clip, card.firstChild); card.classList.add("fx-spotted");
      var s = clip.firstChild, raf = 0, x = 0, y = 0;
      function move(e) {
        x = e.clientX; y = e.clientY;
        if (!raf) raf = requestAnimationFrame(function () { raf = 0; var r = card.getBoundingClientRect(); s.style.transform = "translate(" + Math.round(x - r.left) + "px," + Math.round(y - r.top) + "px)"; });
      }
      card.addEventListener("pointerenter", function (e) { if (off()) return; move(e); card.classList.add("fx-lit"); });
      card.addEventListener("pointermove", function (e) { if (!off()) move(e); });
      card.addEventListener("pointerleave", function () { card.classList.remove("fx-lit"); });
    });
  }
  function magnet() {
    /* The primary button is pulled toward the pointer on a spring, stretches a little along the pull, and snaps back past center. */
    var STIFF = 180, DAMP = 14, PULLX = 12, PULLY = 8;
    $$(".ctas .btn:not(.ghost), .svc-cta .btn, .c-acts .btn[type=submit]").forEach(function (b) {
      if (b.closest(".stage, dialog")) return;
      var r = null, raf = 0, last = 0, x = 0, y = 0, vx = 0, vy = 0, tx = 0, ty = 0;
      b.classList.add("fx-mag");
      function clear() { x = y = vx = vy = tx = ty = 0; b.style.translate = ""; b.style.scale = ""; }
      function tick(now) {
        raf = 0;
        if (off()) { r = null; clear(); return; }
        var dt = Math.min(.032, (now - last) / 1000); last = now;
        vx += ((tx - x) * STIFF - vx * DAMP) * dt; vy += ((ty - y) * STIFF - vy * DAMP) * dt;
        x += vx * dt; y += vy * dt;
        if (Math.abs(tx - x) + Math.abs(ty - y) < .04 && Math.abs(vx) + Math.abs(vy) < .4) {
          x = tx; y = ty; vx = vy = 0;
          if (!tx && !ty) { clear(); return; }
        } else raf = requestAnimationFrame(tick);
        var sx = Math.min(.06, Math.abs(x) / PULLX * .03 + Math.abs(vx) / 400 * .03), sy = Math.min(.06, Math.abs(y) / PULLY * .03 + Math.abs(vy) / 400 * .03);
        b.style.translate = x.toFixed(2) + "px " + y.toFixed(2) + "px";
        b.style.scale = (1 + sx - sy * .5).toFixed(4) + " " + (1 + sy - sx * .5).toFixed(4);
      }
      function run() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
      b.addEventListener("pointerenter", function () { r = b.getBoundingClientRect(); });
      b.addEventListener("pointermove", function (e) {
        if (off() || !r) return;
        var dx = (e.clientX - r.left - r.width / 2) / (r.width / 2), dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        tx = Math.max(-1, Math.min(1, dx)) * PULLX; ty = Math.max(-1, Math.min(1, dy)) * PULLY; run();
      });
      b.addEventListener("pointerleave", function () { r = null; tx = ty = 0; run(); });
    });
  }

  /* ---------- the Admin Map folder: the sheet comes out as the offer scrolls in; a visitor can tuck it back ---------- */
  function folder() {
    var f = $("#af"), sheet = f && $("#amap", f), tog = f && $(".af-tog", f);
    if (!f || !sheet || !tog) return;
    function set(shut, byHand) {
      f.classList.toggle("af-shut", shut);
      tog.textContent = shut ? "Open" : "Tuck away";
      tog.setAttribute("aria-expanded", String(!shut));
      if (shut && byHand) sheet.setAttribute("aria-hidden", "true"); else sheet.removeAttribute("aria-hidden");
    }
    tog.addEventListener("click", function () { set(!f.classList.contains("af-shut"), true); });
    finishers.push(function () { set(false); });
    if (off() || !("IntersectionObserver" in window) || f.getBoundingClientRect().top < innerHeight * .8) return;
    set(true);
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      later(function () { set(false); }, 60);
    }, { threshold: .25 });
    io.observe(f);
  }

  /* ---------- 9. press ripple on primary buttons (animates the button's ::before) ---------- */
  function ripple() {
    if (!W.KeyframeEffect || !("pseudoElement" in KeyframeEffect.prototype)) return;
    d.addEventListener("pointerdown", function (e) {
      if (off() || e.button > 0) return;
      var b = e.target.closest && e.target.closest(".btn");
      if (!b || b.classList.contains("ghost") || b.disabled || b.closest(".stage")) return;
      var r = b.getBoundingClientRect(), size = Math.max(r.width, r.height) * 2.2;
      b.style.setProperty("--rx", Math.round(e.clientX - r.left) + "px");
      b.style.setProperty("--ry", Math.round(e.clientY - r.top) + "px");
      b.style.setProperty("--rs", Math.round(size) + "px");
      b.animate([{ transform: "scale(0)", opacity: .55 }, { transform: "scale(1)", opacity: 0 }], { duration: 620, easing: EASE, pseudoElement: "::before" });
    }, { passive: true });
  }
})();
