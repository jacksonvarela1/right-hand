/* Right Hand NWA: home page behavior (motion toggle, counters, the checks that draw themselves in the method strip, the steps
   and the promises, the services a visitor asked about, composer). Section entrances and swooshes are in assets/motion.js;
   the menu sheet and the phone bar are in assets/nav.js, which all three pages load. */
(function () {
  "use strict";
  var d = document, html = d.documentElement;
  var RM = matchMedia("(prefers-reduced-motion: reduce)");
  function off() { return RM.matches || html.getAttribute("data-motion") === "off"; }
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function once(el, ratio, fn) {
    if (!el) return;
    if (!("IntersectionObserver" in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); fn(); } }, { threshold: ratio });
    io.observe(el);
  }
  var timers = [];
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  // assets/motion.js only takes over the motion button and the swooshes on pages without this script
  (window.RH = window.RH || {}).site = true;

  /* ---------- motion toggle ---------- */
  var mb = $("#motion-btn");
  function paintMotion() { var o = html.getAttribute("data-motion") === "off"; if (mb) { mb.setAttribute("aria-pressed", String(o)); mb.textContent = o ? "Play motion" : "Pause motion"; } }
  paintMotion();
  if (mb) mb.addEventListener("click", function () {
    var o = html.getAttribute("data-motion") !== "off";
    if (o) { html.setAttribute("data-motion", "off"); html.classList.remove("js-motion"); }
    else { html.removeAttribute("data-motion"); if (!RM.matches) html.classList.add("js-motion"); }
    try { localStorage.setItem("rh-motion", o ? "off" : "on"); } catch (e) {}
    paintMotion();
    if (window.RH && RH.conductor) { if (o) RH.conductor.players.forEach(function (p) { p._sleep(); }); else RH.conductor.conduct(); }
    if (o) { timers.forEach(clearTimeout); timers = []; finishAll(); }
    d.dispatchEvent(new CustomEvent("rh:motion", { detail: { off: o } }));
  });

  /* ---------- counters (the number settles once, at 60% visible) ---------- */
  $$("[data-count]").forEach(function (el) {
    var to = +el.getAttribute("data-count");
    once(el, .6, function () {
      if (off()) return;
      // a number with a "+", "th" or "%" after it keeps its finished width while it counts (close.css makes it inline-block)
      if (el.tagName === "SPAN") el.style.minWidth = el.getBoundingClientRect().width + "px";
      // While it counts, the block that holds the number keeps a fixed height and is fenced off (contain), so a new figure
      // every frame is laid out inside that block only. Without the fence each figure re-laid-out the whole page mid-scroll.
      var box = el.tagName === "SPAN" ? el.parentNode : el, bh = box.getBoundingClientRect().height;
      var fence = bh > 0 && window.CSS && CSS.supports && CSS.supports("contain", "size layout") && getComputedStyle(box).display === "block";
      if (fence) { box.style.height = bh + "px"; box.style.contain = "size layout"; }
      var t0 = performance.now(), ms = 480, shown = "";
      requestAnimationFrame(function f(t) {
        var k = Math.max(0, Math.min(1, (t - t0) / ms)), e = 1 - Math.pow(1 - k, 3), s = Math.round(to * e).toLocaleString("en-US");   // the first frame can be stamped before t0: never show "-0"
        if (s !== shown) { shown = s; el.textContent = s; }
        if (k < 1) requestAnimationFrame(f); else if (fence) { box.style.contain = ""; box.style.height = ""; }
      });
    });
  });

  /* ---------- method strip, steps, promises: boxes that tick themselves as each list scrolls in ---------- */
  // html.seq is what holds a check un-drawn until its turn (site.css). It is set here, by the script that draws them,
  // so if this file never runs every box simply shows ticked.
  if (!off() && "IntersectionObserver" in window) html.classList.add("seq");
  var finishers = [];
  function finishAll() { finishers.forEach(function (f) { f(); }); }
  function seq(items, gap, each, done) {
    if (off()) { items.forEach(function (x, i) { each(x, i, true); }); if (done) done(); return; }
    items.forEach(function (x, i) { later(function () { each(x, i, false); if (i === items.length - 1 && done) later(done, gap); }, i * gap); });
  }
  var loop = $("#loop3");
  if (loop) {
    var chips = $$("li:not(.arrw)", loop);
    var endLoop = function () { chips.forEach(function (c, i) { c.classList.toggle("on", i === chips.length - 1); c.classList.add("lit"); }); };
    finishers.push(endLoop);
    once(loop, .6, function () { seq(chips, 140, function (c) { chips.forEach(function (x) { x.classList.remove("on"); }); c.classList.add("on", "lit"); }, endLoop); });
  }
  var steps = $$("#steps .step");
  if (steps.length) {
    var endSteps = function () { steps.forEach(function (s) { s.classList.remove("active"); s.classList.add("done"); }); };
    finishers.push(endSteps);
    once($("#steps"), .5, function () {
      seq(steps, 120, function (s, i) { if (i) steps[i - 1].classList.replace("active", "done"); s.classList.add("active"); }, endSteps);
    });
  }
  // #prom-more sits inside a closed disclosure: its checks draw when a visitor opens it
  [["#prom", 90], ["#prom-more", 90]].forEach(function (p) {
    var list = $(p[0]); if (!list) return;
    var cks = $$(".ck", list);
    var end = function () { cks.forEach(function (c) { c.classList.add("on"); }); };
    finishers.push(end);
    once(list, .3, function () { seq(cks, p[1], function (c) { c.classList.add("on"); }); });
  });

  /* ---------- go to the check-up ---------- */
  function goCheckup(ask) {
    var c = $("#checkup"); if (!c) return;
    if (ask) composer.ask(ask);
    c.scrollIntoView({ behavior: off() ? "auto" : "smooth", block: "start" });
    later(function () { var f = $("#c-name"); if (f) f.focus({ preventScroll: true }); }, off() ? 0 : 650);
  }
  d.addEventListener("click", function (e) {
    var a = e.target.closest("[data-go=checkup]"); if (!a) return;
    // let the browser do the jump itself (works even when the hash is already #checkup), then focus the first field
    var ask = a.getAttribute("data-ask"); if (ask) composer.ask(ask);
    if (location.hash === "#checkup") { e.preventDefault(); goCheckup(); }
    else later(function () { var f = $("#c-name"); if (f) f.focus({ preventScroll: true }); }, off() ? 0 : 700);
  });

  /* ---------- services a visitor asked about ---------- */
  // Set by the first-handoff quiz (assets/close.js, through RH.composer.prefill) and by "Ask about this in my check-up"
  // links on the services page (?pick=<id>). Names come from assets/services-data.js, so no service card has to be on this page.
  var picks = [];
  var NAMES = (function () {
    var m = {}, S = window.RH_SERVICES;
    if (S && S.lines) S.lines.forEach(function (l) { (l.items || []).forEach(function (x) { m[x.id] = x.name; }); });
    return m;
  })();
  function setPick(id, on) {
    if (!NAMES[id]) return;
    picks = picks.filter(function (p) { return p.id !== id; });
    if (on) picks.push({ id: id, name: NAMES[id] });
    composer.update();
  }

  /* ---------- composer (mailto draft only) ---------- */
  var EMAIL = "righthandnwa@gmail.com";
  var EATS = ["Missed calls and texts", "Email", "Receipts and expenses", "Invoices and follow-ups", "Scheduling", "Paperwork and files", "Setting up AI and automations", "Weekly numbers", "Reviews and Google profile", "Not sure"];
  var MODES = ["At my business", "Video", "Phone"];
  var ASK = { calls: "Missed calls and texts", email: "Email", receipts: "Receipts and expenses", invoices: "Invoices and follow-ups", ai: "Setting up AI and automations", weekly: "Weekly numbers" };
  var from = (function () { try { var f = new URLSearchParams(location.search).get("from"); return f && /^[a-z0-9-]{1,20}$/i.test(f) ? f.toLowerCase() : ""; } catch (e) { return ""; } })();
  var composer = (function () {
    var form = $("#composer"), api = { ask: function () {}, update: function () {} };
    if (!form) return api;
    var eats = $("#c-eats"), mode = $("#c-mode"), pre = $("#c-preview"), status = $("#c-status"), conf = $("#c-confirm"), pl = $("#c-picks");
    function chipset(host, list) { host.innerHTML = list.map(function (x) { return '<button type="button" class="chip" aria-pressed="false" data-v="' + esc(x) + '">' + esc(x) + '</button>'; }).join(""); }
    chipset(eats, EATS); chipset(mode, MODES);
    function sel(host) { return $$('[aria-pressed="true"]', host).map(function (b) { return b.getAttribute("data-v"); }); }
    [eats, mode].forEach(function (h) { h.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")); update(); }); });
    function val(n) { return form.elements[n].value.trim(); }
    function msg() {
      var biz = val("business") || "{business}", town = val("town") || "{town}";
      var subject = "Free 30-minute check-up: " + biz + ", " + town;
      var lines = ["Hi Right Hand NWA,", "", "I'd like a free 30-minute check-up.", "", "Name: " + (val("name") || "{name}"), "Business: " + biz + " in " + town];
      var e = sel(eats); if (e.length) lines.push("What eats the most time: " + e.join(", "));
      if (picks.length) lines.push("Services I'm curious about: " + picks.map(function (p) { return p.name; }).join(", "));
      var m = sel(mode), t = val("times"); if (m.length || t) lines.push("How and when to meet: " + [m.join(" or "), t].filter(Boolean).join(", "));
      if (from) lines.push("Found you via: " + from);
      var body = lines.join("\n"); if (body.length > 1800) body = body.slice(0, 1790) + "...";
      return { subject: subject, body: body };
    }
    function update() {
      var m = msg(); pre.textContent = "To: " + EMAIL + "\nSubject: " + m.subject + "\n\n" + m.body;
      if (pl) { pl.hidden = !picks.length; pl.textContent = picks.length ? "Services you asked about: " + picks.map(function (p) { return p.name; }).join(", ") + "." : ""; }
    }
    form.addEventListener("input", function (e) {
      if (e.target.getAttribute("aria-invalid") === "true" && e.target.value.trim()) clearErr(e.target);
      // the "a few things are missing" line goes as soon as nothing is marked any more
      if (status.classList.contains("bad") && !$('[aria-invalid="true"]', form)) { status.textContent = ""; status.classList.remove("bad"); }
      update();
    });
    function setErr(el) { el.setAttribute("aria-invalid", "true"); var er = $("#" + el.id + "-err"); if (er) er.hidden = false; }
    function clearErr(el) { el.removeAttribute("aria-invalid"); var er = $("#" + el.id + "-err"); if (er) er.hidden = true; }
    function valid() {
      var bad = null;
      ["name", "business", "town"].forEach(function (n) { var el = form.elements[n]; if (!el.value.trim()) { setErr(el); if (!bad) bad = el; } else clearErr(el); });
      if (bad) { status.textContent = "A few things are missing. They are marked above."; status.classList.add("bad"); bad.focus(); return false; }
      status.textContent = ""; status.classList.remove("bad"); return true;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault(); if (!valid()) return;
      var m = msg();
      location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(m.subject) + "&body=" + encodeURIComponent(m.body);
      conf.hidden = false; setTimeout(function () { conf.focus(); }, 50);
      d.dispatchEvent(new CustomEvent("rh:draft"));   // assets/close.js plays the success moment
    });
    $("#c-copy").addEventListener("click", function () {
      var m = msg(), text = "To: " + EMAIL + "\nSubject: " + m.subject + "\n\n" + m.body;
      function ok() { status.classList.remove("bad"); status.textContent = "Copied. Paste it into an email to " + EMAIL + "."; }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fallback); else fallback();
      function fallback() { var r = d.createRange(); r.selectNodeContents(pre); var s = getSelection(); s.removeAllRanges(); s.addRange(r); status.textContent = "Selected. Press Ctrl+C or Cmd+C to copy."; }
    });
    api.ask = function (k) { var v = ASK[k]; if (!v) return; var b = $('[data-v="' + v + '"]', eats); if (b) { b.setAttribute("aria-pressed", "true"); update(); } };
    // pre-fill from elsewhere on the page (assets/close.js): town, chips by their words, service picks by id.
    // o.clear lists what the caller set last time, so a second run replaces its own picks instead of piling up.
    api.prefill = function (o) {
      o = o || {}; var c = o.clear || {};
      function set(host, vals, on) { (vals || []).forEach(function (v) { $$("button", host).forEach(function (b) { if (b.getAttribute("data-v") === v) b.setAttribute("aria-pressed", String(on)); }); }); }
      set(eats, c.eats, false); set(mode, c.modes, false);
      set(eats, o.eats, true); set(mode, o.modes, true);
      (c.picks || []).forEach(function (id) { setPick(id, false); });
      (o.picks || []).forEach(function (id) { setPick(id, true); });
      var t = form.elements.town;
      if (o.town && [].some.call(t.options, function (x) { return x.value === o.town; })) { t.value = o.town; clearErr(t); }
      update();
    };
    api.update = update;
    update();
    return api;
  })();
  RH.composer = composer;

  // a service carried over from the services page: index.html?pick=receipts#checkup (ids are checked against the catalog)
  (function () {
    try {
      var q = new URLSearchParams(location.search).get("pick");
      if (q && /^[a-z0-9,]{1,200}$/.test(q)) q.split(",").forEach(function (id) { setPick(id, true); });
    } catch (e) {}
  })();
})();
