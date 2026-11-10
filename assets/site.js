/* Right Hand NWA: page behavior (motion toggle, reveals, counters, method strip, steps, services and picker, Admin Map, composer, mobile bar). */
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
  // change a button's words without dropping the icon motion.js put in front of them
  function relabel(el, t) { var n = el.lastChild; if (n && n.nodeType === 3) n.nodeValue = t; else el.textContent = t; }

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

  /* ---------- reveals and swooshes ---------- */
  // whatever comes into view from above (scrolling back up) is shown as it is (see .rv-now in field.css)
  if ("IntersectionObserver" in window) {
    var rio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { if (e.boundingClientRect.top < 0) e.target.classList.add("rv-now"); e.target.classList.add("in"); rio.unobserve(e.target); } }); }, { threshold: .15, rootMargin: "100% 0px -6% 0px" });
    $$("[data-reveal], .sw").forEach(function (el) { rio.observe(el); });
  } else $$("[data-reveal], .sw").forEach(function (el) { el.classList.add("in"); });

  /* ---------- counters (tick once at 60% visible) ---------- */
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
      var t0 = performance.now(), ms = 1100, shown = "";
      requestAnimationFrame(function f(t) {
        var k = Math.max(0, Math.min(1, (t - t0) / ms)), e = 1 - Math.pow(1 - k, 3), s = Math.round(to * e).toLocaleString("en-US");   // the first frame can be stamped before t0: never show "-0"
        if (s !== shown) { shown = s; el.textContent = s; }
        if (k < 1) requestAnimationFrame(f); else if (fence) { box.style.contain = ""; box.style.height = ""; }
      });
    });
  });

  /* ---------- method strip, steps, offer checks, promises, Admin Map ---------- */
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
    once(loop, .6, function () { seq(chips, 550, function (c) { chips.forEach(function (x) { x.classList.remove("on"); }); c.classList.add("on", "lit"); }, endLoop); });
  }
  var steps = $$("#steps .step");
  if (steps.length) {
    var endSteps = function () { steps.forEach(function (s) { s.classList.remove("active"); s.classList.add("done"); }); };
    finishers.push(endSteps);
    once($("#steps"), .5, function () {
      seq(steps, 900, function (s, i) { if (i) steps[i - 1].classList.replace("active", "done"); s.classList.add("active"); }, endSteps);
    });
  }
  [["#inc", 260], ["#prom", 200]].forEach(function (p) {
    var list = $(p[0]); if (!list) return;
    var cks = $$(".ck", list);
    var end = function () { cks.forEach(function (c) { c.classList.add("on"); }); };
    finishers.push(end);
    once(list, .3, function () { seq(cks, p[1], function (c) { c.classList.add("on"); }); });
  });
  var amap = $("#amap");
  if (amap) {
    var sts = $$(".st", amap);
    var approve = function (s) { s.classList.add("ok"); s.textContent = "Approved by you"; };
    finishers.push(function () { sts.forEach(approve); });
    once(amap, .5, function () { if (off()) { sts.forEach(approve); return; } later(function () { seq(sts, 700, approve); }, 900); });
  }

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

  /* ---------- services, filters and the picker ---------- */
  /* services-render:start
     tools/build-services.mjs runs this exact block in Node to write the static catalog into index.html,
     so the static markup and the runtime markup cannot drift. Keep it free of DOM calls. */
  var RENDER = (function () {
    function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
    var ICON = { receipt: "i-receipt", chat: "i-chat", calendar: "i-cal", folder: "i-folder", chip: "i-chip", pin: "i-pin" };
    var KIND = { ai: ["ai", "AI drafts, we check, you approve"], we: ["", "We do it"], pro: ["", "Stays with a licensed pro"] };
    var ROWS = [["handoff", "You hand off"], ["back", "You get back"], ["ai", "Where AI helps"], ["person", "Where a person checks"], ["never", "What we never do"], ["example", "Example"]];
    function card(s) {
      var k = KIND[s.tag] || KIND.we, id = "svc-" + s.id;
      return '<li class="svc' + (s.tag === "ai" ? " is-ai" : "") + '" data-who="' + esc((s.who || []).join(" ")) + '" data-id="' + esc(s.id) + '"><button type="button" aria-expanded="false" aria-controls="' + id + '-more"><span class="nm">' + esc(s.name) + '</span><svg class="plus" aria-hidden="true"><use href="#i-plus"/></svg><span class="sum">' + esc(s.sum) + '</span><span class="kind ' + k[0] + '">' + k[1] + '</span></button>' +
        '<div class="more" id="' + id + '-more"><div><dl>' + ROWS.map(function (r) { return s.rows && s.rows[r[0]] ? '<div><dt>' + r[1] + '</dt><dd>' + esc(s.rows[r[0]].replace(/^Example:\s*/, "")) + '</dd></div>' : ""; }).join("") + '</dl>' +
        '<div class="pick"><button type="button" class="chip" aria-pressed="false" data-pick="' + esc(s.id) + '" data-name="' + esc(s.name) + '">Add to my Right Hand</button>' + (s.demo ? ' <a class="linkbtn" href="' + esc(s.demo) + '">See it in the demo</a>' : "") + '</div></div></div></li>';
    }
    // nl is "" in the browser and "\n" in the build; it only sits between cards and lines, where the grids ignore whitespace
    function lines(S, nl) {
      nl = nl || "";
      return S.lines.map(function (l) {
        return '<div class="svc-line" data-reveal><h3><span class="tile" aria-hidden="true"><svg class="i"><use href="#' + (ICON[l.icon] || "i-folder") + '"/></svg></span>' + esc(l.name) + (l.note ? '<span class="line-note">' + esc(l.note) + '</span>' : "") + '</h3><ul class="svc-grid">' + nl +
          l.items.map(card).join(nl) + nl + '</ul></div>';
      }).join(nl);
    }
    function stays(S) { return '<div class="svc pro stays-card" data-reveal><h3><span class="tile" aria-hidden="true"><svg class="i"><use href="#i-hand"/></svg></span>' + esc(S.stays.name) + '</h3><ul>' + S.stays.items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + '</ul><p class="fine">We will point you to a licensed pro when something needs one.</p></div>'; }
    function buy(S) { return '<h3 class="buy-h">How you can buy it</h3>' + S.buy.map(function (b) { return '<div><h4>' + esc(b.name) + '</h4><p>' + esc(b.text) + '</p>' + (b.tiers ? '<ul>' + b.tiers.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + '</ul>' : "") + '</div>'; }).join("") + (S.priceLine ? '<p class="price-line">' + esc(S.priceLine) + '</p>' : ""); }
    return { lines: lines, stays: stays, buy: buy, KIND: KIND, ROWS: ROWS };
  })();
  /* services-render:end */
  var picks = [];
  (function services() {
    var S = window.RH_SERVICES, host = $("#svc-lines");
    if (!host) return;
    // index.html ships the catalog as static HTML (for crawlers and AI fetchers that skip JavaScript), so enhance it in place.
    // A page whose markers are empty still renders from assets/services-data.js.
    var stat = !!$(".svc[data-id]", host);
    if (!stat && !S) return;
    if (!stat) {
      host.innerHTML = RENDER.lines(S);
      var stays = $("#stays");
      if (stays && S.stays && !$(".stays-card", stays)) stays.innerHTML = RENDER.stays(S);
      var buy = $("#buy");
      if (buy && S.buy && !$(".buy-h", buy)) buy.innerHTML = RENDER.buy(S);
      // newly added nodes get the reveal treatment
      if ("IntersectionObserver" in window && rio) $$("#services [data-reveal]:not(.in)").forEach(function (el) { rio.observe(el); }); else $$("#services [data-reveal]").forEach(function (el) { el.classList.add("in"); });
    }

    // filters
    var who = $("#who"), live = $("#who-live"), cur = "";
    if (who && S && S.who) {
      who.innerHTML = '<button type="button" class="chip" aria-pressed="true" data-who="">All</button>' + S.who.map(function (w) { return '<button type="button" class="chip" aria-pressed="false" data-who="' + esc(w.id) + '">' + esc(w.label) + '</button>'; }).join("");
      who.addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return;
        cur = b.getAttribute("data-who");
        $$("button", who).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        var n = 0;
        $$(".svc[data-who]", host).forEach(function (c) {
          var hit = !cur || (" " + c.getAttribute("data-who") + " ").indexOf(" " + cur + " ") >= 0;
          c.classList.toggle("dim", !!cur && !hit); c.classList.toggle("hit", !!cur && hit); if (hit) n++;
        });
        if (live) live.textContent = cur ? n + " services highlighted for " + b.textContent + "." : "Showing every service.";
      });
    }
    // expand and pick
    host.addEventListener("click", function (e) {
      var pk = e.target.closest("[data-pick]");
      if (pk) { setPick(pk.getAttribute("data-pick"), pk.getAttribute("aria-pressed") !== "true"); return; }
      var b = e.target.closest(".svc > button"); if (!b) return;
      var card = b.parentNode, open = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", String(open)); if (open) card.setAttribute("data-open", ""); else card.removeAttribute("data-open");
    });
  })();
  // tick or untick one service card; the card, the picker bar and the composer all follow
  function setPick(id, on) {
    var pk = $$("#svc-lines [data-pick]").filter(function (x) { return x.getAttribute("data-pick") === id; })[0];
    if (!pk) return;
    pk.setAttribute("aria-pressed", String(on)); relabel(pk, on ? "Added to my Right Hand" : "Add to my Right Hand");
    pk.closest(".svc").classList.toggle("picked", on);
    picks = picks.filter(function (p) { return p.id !== id; }); if (on) picks.push({ id: id, name: pk.getAttribute("data-name") });
    paintPicker(); composer.update();
  }
  function paintPicker() {
    var p = $("#picker"); if (!p) return;
    p.hidden = !picks.length;
    var l = $("[data-pick-list]", p); if (l) l.textContent = picks.length ? picks.map(function (x) { return x.name; }).join(", ") : "nothing picked yet";
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
      var subject = "Free admin check-up: " + biz + ", " + town;
      var lines = ["Hi Right Hand NWA,", "", "I'd like a free admin check-up.", "", "Name: " + (val("name") || "{name}"), "Business: " + biz + " in " + town];
      var e = sel(eats); if (e.length) lines.push("What eats the most time: " + e.join(", "));
      if (picks.length) lines.push("Services I'm curious about: " + picks.map(function (p) { return p.name; }).join(", "));
      var m = sel(mode), t = val("times"); if (m.length || t) lines.push("How and when to meet: " + [m.join(" or "), t].filter(Boolean).join(", "));
      if (from) lines.push("Found you via: " + from);
      var body = lines.join("\n"); if (body.length > 1800) body = body.slice(0, 1790) + "...";
      return { subject: subject, body: body };
    }
    function update() {
      var m = msg(); pre.textContent = "To: " + EMAIL + "\nSubject: " + m.subject + "\n\n" + m.body;
      if (pl) { pl.hidden = !picks.length; pl.textContent = picks.length ? "From your Right Hand picks: " + picks.map(function (p) { return p.name; }).join(", ") + "." : ""; }
    }
    form.addEventListener("input", function (e) { if (e.target.getAttribute("aria-invalid") === "true" && e.target.value.trim()) clearErr(e.target); update(); });
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

  /* ---------- mobile bottom bar ---------- */
  var bar = $("#mobile-bar"), hero = $(".hero"), checkup = $("#checkup");
  if (bar && hero && checkup && "IntersectionObserver" in window) {
    var heroOut = false, compIn = false;
    var paint = function () { bar.classList.toggle("on", heroOut && !compIn); };
    new IntersectionObserver(function (es) { heroOut = !es[0].isIntersecting; paint(); }).observe(hero);
    new IntersectionObserver(function (es) { compIn = es[0].isIntersecting; paint(); }).observe(checkup);
  }
})();
