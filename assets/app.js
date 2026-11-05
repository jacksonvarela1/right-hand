/* Right Hand: page behavior. Plain JS, no libraries. */
(function () {
  "use strict";

  /* ---------- config and helpers ---------- */
  var CONTACT = { email: "jvarela@uark.edu", form: "" };
  var RM = matchMedia("(prefers-reduced-motion: reduce)");
  if (!RM.matches) document.documentElement.classList.add("js-motion");
  var SRC = (new URLSearchParams(location.search).get("src") || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 16);
  var LAST = { secs: 0, where: "" };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var round = function (n) { return Math.round(n * 100) / 100; };
  var money = function (n) { return round(n).toLocaleString("en-US", { style: "currency", currency: "USD" }); };
  var bare = function (n) { return money(n).slice(1); };
  var signed = function (n) { return (n > 0 ? "+" : "−") + money(Math.abs(n)); };
  var shortDate = function (d) { return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }); };
  var TODAY = "Nov 5"; /* the demo clock is frozen so every date on the sheet agrees */
  var fmtTime = function (s) { return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  var spokenTime = function (s) { var m = Math.floor(s / 60), r = s % 60; return (m ? m + (m > 1 ? " minutes " : " minute ") : "") + r + (r === 1 ? " second" : " seconds"); };
  var SEPT = 7902.10;

  var TKI = {
    t: '<svg viewBox="0 0 12 12"><path d="M3 1.5h6v9l-1-.75-1 .75-1-.75-1 .75-1-.75-1 .75z"/><path d="M4.6 4.3h2.8M4.6 6.3h2.8"/></svg>',
    f: '<svg viewBox="0 0 12 12"><path d="M2.5 4.5h7M2.5 7.5h7"/></svg>',
    p: '<svg viewBox="0 0 12 12"><path d="M3.5 1.5h5v9L6 8.6 3.5 10.5z"/></svg>',
    ok: '<svg viewBox="0 0 12 12"><path d="M2.5 6.3l2.3 2.3 4.7-5"/></svg>'
  };
  var TKL = { t: "traced to its source", f: "added up and checked", q: "needs your answer", p: "your saved preference", ok: "answered" };
  function tk(k) { return '<span class="tk ' + (k === "ok" ? "" : k) + '" aria-hidden="true">' + (k === "q" ? "?" : TKI[k]) + '</span><span class="sr-only">(' + TKL[k] + ')</span>'; }
  var KEY = '<p class="key"><span>' + tk("t") + 'Traced to its source</span><span>' + tk("f") + 'Added up and checked</span><span>' + tk("q") + 'Needs your answer</span><span>' + tk("p") + 'Your saved preference</span></p>';
  var BOOKMARK = '<svg class="ic" viewBox="0 0 256 256" aria-hidden="true"><path d="M184,32H72A16,16,0,0,0,56,48V224a8,8,0,0,0,12.24,6.78L128,193.43l59.77,37.35A8,8,0,0,0,200,224V48A16,16,0,0,0,184,32Zm0,177.57-51.77-32.35a8,8,0,0,0-8.48,0L72,209.57V48H184Z"/></svg>';
  function say(live, m) { if (!live) return; live.textContent = ""; setTimeout(function () { live.textContent = m; }, 30); }
  function ease3(p) { return 1 - Math.pow(1 - p, 3); }
  function tween(ms, fn, done) {
    if (RM.matches) { fn(1); if (done) done(); return; }
    var t0 = performance.now();
    requestAnimationFrame(function f(t) { var p = Math.min(1, (t - t0) / ms); fn(ease3(p)); if (p < 1) requestAnimationFrame(f); else if (done) done(); });
  }

  /* ---------- the review sheet ---------- */
  var FLAGS = [
    { k: "amazon", q: "Amazon, Oct 12", amt: 214.60, meta: "No receipt found. Was this for the business?", opts: [["biz", "Business supplies"], ["personal", "Personal"]] },
    { k: "venmo", q: "Venmo to J. Ruiz, Oct 20", amt: 150, meta: "No memo on the payment. What was it for?", opts: [["contract", "Contract help"], ["personal", "Personal"]] },
    { k: "square", q: "Square fee, Oct 28", amt: 89, meta: "Same amount as a Square fee on Oct 27. Possible duplicate.", opts: [["keep", "Keep both"], ["dup", "Remove duplicate"]] }
  ];
  var ANSWERED = {
    amazon: { biz: "moved to Grooming supplies", personal: "left out as personal" },
    venmo: { contract: "moved to Payroll and contractors", personal: "left out as personal" },
    square: { keep: "kept in Software and fees", dup: "removed as a duplicate" }
  };
  var OPTLABEL = { biz: "Business supplies", personal: "Personal", contract: "Contract help", keep: "Keep both", dup: "Remove duplicate" };
  var TABS = [["sum", "Summary"], ["work", "Sources and math"], ["q", "Questions"]];

  function makeReview(root, live, opts) {
    opts = opts || {};
    var id = opts.id, st, prev = {}, first = true, lockUntil = 0, t0 = 0, maxH = 0;
    var quiet = opts.quiet || function () { return false; };
    function fresh() { st = { tab: "sum", f: {}, rem: {}, approved: false, sent: false, changing: false, note: "", err: false, changed: {}, fresh: false, just: null }; t0 = 0; }
    fresh();
    function speak(m) { if (!quiet()) say(live, m); }
    function openCount() { return FLAGS.filter(function (x) { return !st.f[x.k]; }).length; }
    function locked() { return st.approved || st.sent; }
    function cats(f) {
      var c = [
        { k: "payroll", name: "Payroll", v: 3650 }, { k: "rent", name: "Rent", v: 2400 },
        { k: "supplies", name: "Grooming supplies", v: 1126.45 }, { k: "util", name: "Utilities", v: 412.18 },
        { k: "soft", name: "Software and fees", v: 200.14 }, { k: "mkt", name: "Marketing", v: 175 }
      ];
      var open = 453.60;
      if (f.amazon) { open -= 214.60; if (f.amazon === "biz") c[2].v += 214.60; }
      if (f.venmo) { open -= 150; if (f.venmo === "contract") { c[0].v += 150; c[0].name = "Payroll and contractors"; } }
      if (f.square) { open -= 89; if (f.square === "keep") c[4].v += 89; }
      c.forEach(function (x) { x.v = round(x.v); });
      var sorted = round(c.reduce(function (s, x) { return s + x.v; }, 0));
      open = round(open);
      return { c: c, sorted: sorted, open: open, total: round(sorted + open) };
    }
    function sumPanel(d, n) {
      var diff = d.total - SEPT;
      var stamp = st.approved ? '<div class="stamp' + (st.fresh ? " fresh" : "") + '" aria-hidden="true">Approved<small>' + TODAY + ', by you</small></div>' : "";
      var rows = d.c.map(function (x, i) {
        var dl = st.changed[x.k];
        return '<li class="' + (dl ? "chg" : "") + '" style="--n:' + i + '"><span class="name">' + x.name + '</span><span class="lead" aria-hidden="true"></span>' + (dl ? '<span class="delta">' + signed(dl) + '</span>' : "") + '<span class="amt">' + money(x.v) + '</span>' + tk("t") + '</li>';
      }).join("");
      if (d.open > 0) rows += '<li class="open" style="--n:6"><span class="name">Waiting on your answers</span><span class="lead" aria-hidden="true"></span><span class="amt">' + money(d.open) + '</span>' + tk("q") + '</li>';
      var legend = d.open > 0
        ? '<span class="a">' + money(d.sorted) + ' in categories</span><button type="button" class="linkbtn legend-q" data-act="q" data-f="legend-q">' + n + (n > 1 ? " questions" : " question") + ' about ' + money(d.open) + '</button>'
        : '<span class="a">All ' + money(d.sorted) + ' in categories</span>';
      return '<div class="total' + (st.approved ? " final" : "") + '"><strong data-total>' + money(prev.total != null ? prev.total : d.total) + '</strong>' + tk("f") + '<span class="vs">' + (diff >= 0 ? "Up " : "Down ") + money(Math.abs(diff)) + ' from September (' + money(SEPT) + ')</span></div>' +
        '<div class="split"><div class="split-bar' + (d.open > 0 ? "" : " clear") + '" aria-hidden="true"><span class="ok"></span><span class="eyes"></span></div><p class="split-legend">' + legend + '</p>' + stamp + '</div>' +
        '<ul class="ledger">' + rows + '</ul>';
    }
    function workPanel(d) {
      var f = st.f;
      var tx = [
        ["Oct 12", "Amazon", "214.60", f.amazon ? ANSWERED.amazon[f.amazon] : "no receipt", !!f.amazon],
        ["Oct 20", "Venmo, J. Ruiz", "150.00", f.venmo ? ANSWERED.venmo[f.venmo] : "no memo", !!f.venmo],
        ["Oct 27", "Square fee", "89.00", "", false],
        ["Oct 28", "Square fee", "89.00", f.square ? ANSWERED.square[f.square] : "same as Oct 27", !!f.square]
      ].map(function (r) { return '<tr class="' + (r[4] ? "done" : "") + '"><td>' + r[0] + '</td><td>' + r[1] + '</td><td class="n">' + r[2] + '</td><td class="note">' + r[3] + '</td></tr>'; }).join("");
      var math = '<li><span>All 58 transactions</span><span>9,617.37</span></li><li><span>Transfers between your own accounts</span><span>−1,200.00</span></li>';
      var personal = (f.amazon === "personal" ? 214.60 : 0) + (f.venmo === "personal" ? 150 : 0);
      if (personal) math += '<li><span>Personal, per your answers</span><span>−' + bare(personal) + '</span></li>';
      if (f.square === "dup") math += '<li><span>Duplicate Square fee</span><span>−89.00</span></li>';
      math += '<li class="sum"><span>October expenses</span><span>' + bare(d.total) + tk("f") + '</span></li>';
      var none = !FLAGS.some(function (x) { return st.f[x.k]; });
      return '<p class="ws-h">Pulled from</p><ul class="ws-src">' +
        '<li>' + tk("t") + '<span>58 transactions from the business checking account ending <span class="mono">4821</span> and the business card ending <span class="mono">0937</span></span></li>' +
        '<li>' + tk("t") + '<span>31 receipts from your Receipts folder, matched by date and amount</span></li>' +
        '<li>' + tk("p") + '<span>Payroll from your payroll export, per your saved preference</span></li></ul>' +
        '<p class="ws-h">Lines that needed a closer look</p><table class="tx"><caption class="sr-only">Flagged transactions</caption><thead><tr><th scope="col">Date</th><th scope="col">Payee</th><th scope="col" class="n">Amount</th><th scope="col">Status</th></tr></thead><tbody>' + tx + '</tbody></table>' +
        '<p class="ws-h">The math</p><ul class="math">' + math + '</ul>' +
        (none ? '<p class="ws-h">Your answers</p><p class="hint">None yet. <button type="button" class="linkbtn" data-act="q" data-f="work-q">Answer the questions</button></p>' : "");
    }
    function qPanel(n) {
      var lock = locked();
      return '<ul class="flags">' + FLAGS.map(function (x) {
        var v = st.f[x.k];
        return '<li class="' + (v ? "ok" : "") + (st.just === x.k ? " just" : "") + '"><div class="flag-top"><span class="flag-q" id="' + id + '-q-' + x.k + '">' + x.q + ': <span class="mono">' + money(x.amt) + '</span></span><span class="st">' + (v ? "Answered" : "Open") + '</span></div>' +
          '<p class="flag-meta">' + x.meta + '</p><div class="opts" role="group" aria-labelledby="' + id + '-q-' + x.k + '">' +
          x.opts.map(function (o) { return '<button type="button" class="opt" data-act="flag" data-k="' + x.k + '" data-v="' + o[0] + '" data-f="flag-' + x.k + '-' + o[0] + '" aria-pressed="' + (v === o[0]) + '"' + (lock ? " disabled" : "") + '>' + o[1] + '</button>'; }).join("") + '</div>' +
          (v ? '<label class="rem"><input type="checkbox" data-rem="' + x.k + '"' + (st.rem[x.k] ? " checked" : "") + (lock ? " disabled" : "") + '> Remember this for next month<span class="sr-only"> (' + x.q + ')</span></label>' : "") + '</li>';
      }).join("") + '</ul>' +
        (lock ? '<p class="hint allclear">' + (st.approved ? "Answers are locked once this is approved." : "Answers are locked once you request changes.") + (opts.hero ? " Use Start over to try again." : "") + '</p>'
          : (n ? "" : '<p class="allclear"><button type="button" class="linkbtn" data-act="tab" data-tab="sum" data-f="see-sum">See the updated summary</button></p>'));
    }
    function foot(n) {
      var after = opts.hero ? '<button type="button" class="btn ghost sm" data-act="restart" data-f="restart">Start over</button>' : '<button type="button" class="btn sm" data-act="close" data-f="close">Close</button>';
      var sign = '<p class="signoff"><span>Prepared by Right Hand, Nov 3</span><span>Approved by <span class="line' + (st.approved ? " signed" : "") + '">' + (st.approved ? "you, " + TODAY : "&nbsp;") + '</span></span></p>';
      var row;
      if (st.approved) {
        var saved = Object.keys(st.rem).filter(function (k) { return st.rem[k]; }).length;
        var msg = opts.hero ? "Approved. On the full board below, approved work moves to Completed." : "Approved and saved to Completed.";
        if (saved) msg += " " + saved + (saved > 1 ? " answers" : " answer") + " saved for next month.";
        row = '<div class="foot-row"><p class="hint" tabindex="-1" data-f="done-msg">' + msg + '</p><div class="acts">' + after + '</div></div>';
      } else if (st.sent) {
        row = '<div class="foot-row"><p class="hint" tabindex="-1" data-f="done-msg">Changes requested: “' + esc(st.note) + '”. The task goes back to In progress.</p><div class="acts">' + after + '</div></div>';
      } else if (st.changing) {
        row = '<div class="note-field"><label for="' + id + '-note">What should change?</label><textarea id="' + id + '-note" data-f="note"' + (st.err ? ' aria-invalid="true" aria-describedby="' + id + '-note-err"' : "") + '>' + esc(st.note) + '</textarea>' +
          (st.err ? '<p class="err" id="' + id + '-note-err">Write a short note about what should change.</p>' : "") + '</div>' +
          '<div class="acts"><button type="button" class="btn ghost sm" data-act="cancel" data-f="cancel">Cancel</button><button type="button" class="btn sm" data-act="send" data-f="send">Send note</button></div>';
      } else if (n) {
        row = '<div class="foot-row"><p class="hint">Approve unlocks once ' + (n > 1 ? "the " + n + " questions are" : "the last question is") + ' answered.</p><div class="acts"><button type="button" class="btn ghost sm" data-act="change" data-f="change">Request changes</button><button type="button" class="btn sm" data-act="q" data-f="answer">Answer ' + n + (n > 1 ? " questions" : " question") + '</button></div></div>';
      } else {
        row = '<div class="foot-row"><p class="hint">Ready for your approval.</p><div class="acts"><button type="button" class="btn ghost sm" data-act="change" data-f="change">Request changes</button><button type="button" class="btn sm" data-act="approve" data-f="approve">Approve</button></div></div>';
      }
      return '<div class="rv-foot">' + row + KEY + sign + '</div>';
    }
    function render() {
      var a = document.activeElement;
      var fk = a && root.contains(a) ? a.getAttribute("data-f") : null;
      var d = cats(st.f), n = openCount();
      var chip = st.sent ? '<span class="chip">Changes requested</span>' : "";
      var panel = st.tab === "sum" ? sumPanel(d, n) : st.tab === "work" ? workPanel(d) : qPanel(n);
      root.innerHTML =
        '<div class="rv-head"><div><h2' + (opts.titleId ? ' id="' + opts.titleId + '"' : "") + '>October expense summary</h2><p class="rv-sub">Ozark Paws Grooming (made-up demo shop). 58 transactions in October.</p></div>' + chip + '</div>' +
        '<div class="tabs" role="tablist" aria-label="Review sections">' + TABS.map(function (t) {
          var sel = st.tab === t[0];
          return '<button type="button" class="tab" role="tab" id="' + id + '-tab-' + t[0] + '" aria-controls="' + id + '-panel" aria-selected="' + sel + '" tabindex="' + (sel ? 0 : -1) + '" data-act="tab" data-tab="' + t[0] + '" data-f="tab-' + t[0] + '">' + t[1] + (t[0] === "q" ? '<span class="count' + (n ? "" : " zero") + '" aria-hidden="true">' + n + '</span><span class="sr-only">, ' + n + ' open</span>' : "") + '</button>';
        }).join("") + '<span class="tab-ink" aria-hidden="true"></span></div>' +
        '<div class="panel" role="tabpanel" tabindex="0" id="' + id + '-panel" aria-labelledby="' + id + '-tab-' + st.tab + '">' + panel + '</div>' + foot(n);
      // split bar: the amber drains as answers come in
      var bar = root.querySelector(".split-bar");
      if (bar) {
        var ok = bar.children[0], eyes = bar.children[1];
        if (first && !opts.noIntro) { bar.classList.add("intro"); ok.style.flexGrow = d.sorted; eyes.style.flexGrow = d.open; }
        else {
          var po = prev.ok != null ? prev.ok : d.sorted, pe = prev.eyes != null ? prev.eyes : d.open;
          var dur = 280 + 420 * Math.min(1, Math.abs(pe - d.open) / 453.6);
          ok.style.flexGrow = po; eyes.style.flexGrow = pe; void bar.offsetWidth;
          if (!RM.matches) { ok.style.transition = eyes.style.transition = "flex-grow " + dur + "ms cubic-bezier(.77,0,.175,1)"; }
          ok.style.flexGrow = d.sorted; eyes.style.flexGrow = d.open;
        }
        prev.ok = d.sorted; prev.eyes = d.open; st.changed = {};
      }
      // the total rolls to its new value
      var tot = root.querySelector("[data-total]");
      if (tot) {
        var from = prev.total != null ? prev.total : d.total, to = d.total;
        if (from !== to) tween(650, function (p) { tot.textContent = money(from + (to - from) * p); }, function () { tot.textContent = money(to); });
        prev.total = to;
      }
      placeInk(true);
      if (opts.lockHeight) { var pn = root.querySelector(".panel"); if (pn && pn.offsetHeight > maxH) { maxH = pn.offsetHeight; } if (pn && maxH) pn.style.minHeight = maxH + "px"; }
      first = false; st.fresh = false; st.just = null;
      if (fk && !quiet()) { var el = root.querySelector('[data-f="' + fk + '"]'); if (el && !el.disabled) el.focus({ preventScroll: true }); }
    }
    // the tab ink slides to the selected tab; measured again whenever the sheet resizes or becomes visible
    function placeInk(animate) {
      var ink = root.querySelector(".tab-ink"), sel = root.querySelector('.tab[aria-selected="true"]');
      if (!ink || !sel) return;
      var x = sel.offsetLeft, w = sel.offsetWidth;
      if (!w) return;
      if (animate && prev.ink && !RM.matches) {
        ink.style.transition = "none"; ink.style.transform = "translateX(" + prev.ink.x + "px) scaleX(" + prev.ink.w / 100 + ")"; void ink.offsetWidth;
        ink.style.transition = "transform .24s cubic-bezier(.23,1,.32,1)";
      } else ink.style.transition = "none";
      ink.style.transform = "translateX(" + x + "px) scaleX(" + w / 100 + ")";
      prev.ink = { x: x, w: w };
      ink.parentNode.classList.add("inked");
    }
    if (window.ResizeObserver) new ResizeObserver(function () { placeInk(false); }).observe(root);
    function focusSel(s) { if (quiet()) return; var el = root.querySelector(s); if (el) el.focus({ preventScroll: true }); }
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b || !root.contains(b) || b.disabled) return;
      var act = b.getAttribute("data-act");
      if (!t0 && act && act !== "restart" && act !== "close" && !quiet()) t0 = performance.now();
      if (act === "tab") { st.tab = b.getAttribute("data-tab"); render(); if (b.classList.contains("linkbtn")) focusSel('[data-f="tab-' + st.tab + '"]'); return; }
      if (act === "q") { st.tab = "q"; render(); focusSel(".flags li:not(.ok) .opt"); return; }
      if (act === "flag") {
        if (locked()) return;
        var k = b.getAttribute("data-k"), v = b.getAttribute("data-v");
        if (st.f[k] === v) return;
        var before = cats(st.f); st.f[k] = v; var after = cats(st.f);
        after.c.forEach(function (x, i) { var dv = round(x.v - before.c[i].v); if (dv) st.changed[x.k] = round((st.changed[x.k] || 0) + dv); });
        st.just = k; render();
        var left = openCount();
        speak(FLAGS.filter(function (x) { return x.k === k; })[0].q.split(",")[0] + " marked " + OPTLABEL[v] + ". Total is now " + money(after.total) + "." + (left ? " " + left + (left > 1 ? " questions" : " question") + " left." : " All answered. You can approve."));
        return;
      }
      if (act === "approve") {
        if (openCount() || locked()) return;
        var secs = t0 ? Math.round((performance.now() - t0) / 1000) : 0;
        st.approved = true; st.fresh = true; st.tab = "sum"; lockUntil = Date.now() + 900; render();
        speak(secs >= 5 && secs <= 600 ? "Approved in " + spokenTime(secs) + "." : "Approved.");
        focusSel('[data-f="done-msg"]');
        if (opts.onApprove) opts.onApprove(secs); return;
      }
      if (act === "change") { st.changing = true; st.err = false; render(); focusSel("textarea"); return; }
      if (act === "cancel") { st.changing = false; st.err = false; render(); focusSel('[data-f="change"]'); return; }
      if (act === "send") {
        if (!st.note.trim()) { st.err = true; render(); focusSel("textarea"); return; }
        st.note = st.note.trim(); st.sent = true; st.changing = false; st.err = false; lockUntil = Date.now() + 900; render();
        speak("Changes requested."); focusSel('[data-f="done-msg"]');
        if (opts.onSendBack) opts.onSendBack(st.note); return;
      }
      if (act === "restart") {
        if (e.detail > 1 || Date.now() < lockUntil) return;
        fresh(); render(); focusSel('[data-f="tab-sum"]'); speak("Started over.");
        if (opts.onRestart) opts.onRestart(); return;
      }
      if (act === "close") { if (Date.now() < lockUntil && e.detail > 1) return; if (opts.onClose) opts.onClose(); }
    });
    root.addEventListener("keydown", function (e) {
      if (!e.target.classList || !e.target.classList.contains("tab")) return;
      var i = TABS.map(function (x) { return x[0]; }).indexOf(st.tab), j;
      if (e.key === "ArrowRight") j = (i + 1) % TABS.length;
      else if (e.key === "ArrowLeft") j = (i + TABS.length - 1) % TABS.length;
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = TABS.length - 1;
      else return;
      e.preventDefault(); if (!t0) t0 = performance.now(); st.tab = TABS[j][0]; render(); focusSel('[data-f="tab-' + st.tab + '"]');
    });
    root.addEventListener("input", function (e) { if (e.target.matches("textarea")) st.note = e.target.value; });
    root.addEventListener("change", function (e) { if (e.target.matches("[data-rem]") && !locked()) st.rem[e.target.getAttribute("data-rem")] = e.target.checked; });
    render();
    return {
      root: root,
      clean: function () { return !st.approved && !st.sent && !st.changing && !Object.keys(st.f).length && st.tab === "sum"; },
      restart: function () { fresh(); render(); },
      prep: function () { prev.total = 0; prev.ok = 0; prev.eyes = 0; root.classList.add("prep"); render(); setTimeout(function () { root.classList.remove("prep"); }, 1300); },
      openQuestions: function () { if (!t0 && !quiet()) t0 = performance.now(); st.tab = "q"; render(); focusSel(".flags li:not(.ok) .opt"); }
    };
  }

  /* ---------- hero: the sheet runs itself until a person takes over ---------- */
  var reviewedBy = $("#reviewed-by"), signHint = $("#sign-hint"), heroAsk = $("#hero-ask");
  var HA = { playing: false };
  var hero = makeReview($("#hero-rv"), $("#hero-live"), {
    hero: true, id: "hero", lockHeight: true,
    quiet: function () { return HA.playing; },
    onApprove: function (secs) {
      if (HA.playing) return;
      LAST.secs = secs >= 5 && secs <= 600 ? secs : 0;
      reviewedBy.textContent = "you, " + TODAY; reviewedBy.classList.add("signed"); if (signHint) signHint.hidden = true;
      heroAsk.innerHTML = (LAST.secs ? '<p class="na-time">You approved this made-up month in ' + spokenTime(LAST.secs) + '.</p>' : "") +
        '<h3>Would checking your real month go that fast?</h3><p>That is what we are testing. Real books are messier. Give us 15 minutes and tell us what you would still check.</p>' +
        '<a class="btn" href="#ask" data-ask="approved">Get a 15-minute walkthrough</a><p class="fine" style="color:var(--n-mute)">Your time goes into the email draft. Edit anything before you send.</p>';
      heroAsk.hidden = false; updateComposer();
    },
    onRestart: function () {
      if (HA.playing) return;
      heroAsk.hidden = true; LAST.secs = 0; updateComposer();
      reviewedBy.innerHTML = "&nbsp;"; reviewedBy.classList.remove("signed"); if (signHint) signHint.hidden = false;
    }
  });

  (function autoplay() {
    var frame = $("#hero-frame"), rv = $("#hero-rv"), cur = $("#hero-cursor"), stateEl = $("#hero-state"), btn = $("#hero-demo-btn");
    var S = [[900, "prep"], [1700, "to", "tab-q"], [850, "tap", "tab-q"], [800, "to", "flag-amazon-biz"], [700, "tap", "flag-amazon-biz"],
      [800, "to", "flag-venmo-contract"], [700, "tap", "flag-venmo-contract"], [800, "to", "flag-square-dup"], [700, "tap", "flag-square-dup"],
      [800, "to", "see-sum"], [700, "tap", "see-sum"], [1300, "to", "approve"], [700, "tap", "approve"], [600, "hide"], [2600, "swap"]];
    var i = 0, loops = 0, timer = 0, due = 0, left = 0, running = false, vis = false, auto = !RM.matches, started = false, swapT = 0, endT = 0;
    function claim() { auto = false; started = true; }
    function q(f) { return rv.querySelector('[data-f="' + f + '"]'); }
    function setState(kind) {
      stateEl.className = "state " + kind;
      stateEl.lastChild.textContent = kind === "playing" ? "Demo playing" : "Your turn";
      btn.textContent = kind === "playing" ? "Stop demo" : "Watch the demo";
    }
    function moveTo(el) {
      var r = el.getBoundingClientRect(), f = frame.getBoundingClientRect();
      cur.style.opacity = 1;
      cur.style.transform = "translate(" + Math.round(r.left - f.left + r.width * .55) + "px," + Math.round(r.top - f.top + r.height * .55) + "px)";
    }
    function step() {
      if (!HA.playing) return;
      var s = S[i++], el = s[2] && q(s[2]);
      if (s[1] === "prep") { stateEl.lastChild.textContent = "Preparing"; hero.prep(); }
      else if (stateEl.lastChild.textContent === "Preparing") stateEl.lastChild.textContent = "Demo playing";
      if (s[1] === "prep") { /* done above */ }
      else if (s[1] === "to" && el) moveTo(el);
      else if (s[1] === "tap" && el) { cur.classList.add("down"); setTimeout(function () { cur.classList.remove("down"); }, 120); el.click(); }
      else if (s[1] === "hide") cur.style.opacity = 0;
      else if (s[1] === "swap") {
        rv.classList.add("swap");
        swapT = setTimeout(function () { rv.classList.remove("swap"); if (HA.playing) hero.restart(); }, 220);
        i = 0; loops++;
        if (loops >= 3) { endT = setTimeout(function () { if (HA.playing) end(false); }, 260); return; }
      }
      sched(S[i][0]);
    }
    function sched(ms) { due = Date.now() + ms; timer = setTimeout(step, ms); }
    function pause() { if (running) { clearTimeout(timer); left = Math.max(0, due - Date.now()); running = false; } }
    function resume() { if (HA.playing && !running && vis && !document.hidden) { running = true; sched(left || S[i][0]); left = 0; } }
    function start() {
      clearTimeout(swapT); clearTimeout(endT);
      if (!hero.clean()) hero.restart();
      heroAsk.hidden = true; i = 0; loops = 0; left = 0; HA.playing = true; started = true; setState("playing"); resume();
    }
    function end(reset) {
      clearTimeout(swapT); clearTimeout(endT); rv.classList.remove("swap");
      if (!HA.playing) { setState("turn"); return; }
      pause(); HA.playing = false; cur.style.opacity = 0; setState("turn");
      if (reset && !hero.clean()) { hero.restart(); }
      if (LAST.secs) heroAsk.hidden = false;
    }
    btn.addEventListener("click", function () {
      if (HA.playing) { claim(); end(true); return; }
      var r = frame.getBoundingClientRect();
      if (r.top < 64 || r.top > innerHeight * .5) frame.scrollIntoView({ block: "start", behavior: RM.matches ? "auto" : "smooth" });
      vis = true; start();
    });
    // a real click or keyboard focus inside the sheet hands it over
    frame.addEventListener("click", function (e) {
      if (!e.isTrusted || e.target.closest(".rv-bar")) return;
      if (!HA.playing) { claim(); return; }
      claim();
      var dirty = !hero.clean();
      end(true);
      if (dirty) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    frame.addEventListener("focusin", function (e) { if (e.target.closest(".rv-bar")) return; claim(); if (HA.playing) end(true); });
    frame.addEventListener("keydown", function (e) { if (e.target.closest(".rv-bar")) return; claim(); if (HA.playing) end(true); }, true);
    new IntersectionObserver(function (es) {
      var en = es[0], rb = en.rootBounds;
      vis = en.isIntersecting && (en.intersectionRatio >= .5 || (rb && en.intersectionRect.height >= rb.height * .55));
      if (vis && auto && !started) { start(); return; }
      if (vis) resume(); else pause();
    }, { threshold: [0, .1, .2, .3, .4, .5, .6] }).observe(rv);
    document.addEventListener("visibilitychange", function () { if (document.hidden) pause(); else resume(); });
    if (!auto) setState("turn");
    HA.takeOver = function () { claim(); end(true); };
  })();

  $("#try-first").addEventListener("click", function () {
    if (HA.takeOver) HA.takeOver();
    var frame = $("#hero-frame"), r = frame.getBoundingClientRect();
    if (r.top < 64 || r.bottom > innerHeight) frame.scrollIntoView({ block: "center", behavior: RM.matches ? "auto" : "smooth" });
    hero.openQuestions();
  });

  /* ---------- how a task moves: the system diagram ---------- */
  function flowSVG(L) {
    var o = [];
    o.push('<svg class="' + L.cls + '" viewBox="' + L.vb + '" aria-hidden="true" focusable="false">');
    L.wires.src.forEach(function (d) { o.push('<path class="wire" d="' + d + '"/>'); });
    ["cs", "so"].forEach(function (k) { o.push('<path class="wire" d="' + L.wires[k] + '"/>'); });
    var SN = [["Business checking", "ending 4821"], ["Business card", "ending 0937"], ["Receipts folder", "31 files"], ["Payroll export", "October"]];
    L.src.forEach(function (s, i) {
      o.push('<g class="src"><rect class="node" x="' + s[0] + '" y="' + s[1] + '" width="' + s[2] + '" height="' + s[3] + '" rx="6"/>' +
        '<text x="' + (s[0] + 18) + '" y="' + (s[1] + s[3] / 2 - 3) + '">' + SN[i][0] + '</text><text class="m" x="' + (s[0] + 18) + '" y="' + (s[1] + s[3] / 2 + 15) + '">' + SN[i][1] + '</text></g>');
    });
    var c = L.core;
    o.push('<g transform="translate(' + c[0] + ' ' + c[1] + ')"><rect class="node core-r" width="260" height="248" rx="8"/>' +
      '<text class="t-b" x="22" y="34">Right Hand</text><text class="m" x="22" y="54">58 transactions, 31 receipts</text>' +
      '<rect class="box s1" x="22" y="84" width="16" height="16" rx="3"/><text x="48" y="97">Match each line to its source</text>' +
      '<rect class="box s2" x="22" y="134" width="16" height="16" rx="3"/><text x="48" y="147">Add it up and check</text>' +
      '<rect class="box s3" x="22" y="184" width="16" height="16" rx="3"/><text x="48" y="197">Mark what needs you</text></g>');
    var h = L.sheet;
    o.push('<g class="sheet" transform="translate(' + h[0] + ' ' + h[1] + ')"><rect class="sheet-r" width="230" height="268" rx="4"/>' +
      '<rect width="230" height="4" rx="2" fill="#1B2A41"/>' +
      '<text class="t-b" x="18" y="34">October expenses</text><text class="m" x="18" y="54">Ozark Paws, demo data</text>' +
      '<g class="row r1"><text x="18" y="90">Payroll</text><text class="m" x="212" y="90" text-anchor="end">3,650.00</text></g>' +
      '<g class="row r2"><text x="18" y="118">Rent</text><text class="m" x="212" y="118" text-anchor="end">2,400.00</text></g>' +
      '<g class="row r3"><text x="18" y="146">Supplies</text><text class="m" x="212" y="146" text-anchor="end">1,126.45</text></g>' +
      '<g class="row rq"><rect class="qb" x="18" y="160" width="16" height="16" rx="3"/><text class="m rq-open" x="26" y="172.5" text-anchor="middle">?</text><text class="rq-open" x="42" y="173">Waiting on you</text><text class="rq-done" x="42" y="173">Answered by you</text><text class="m" x="212" y="173" text-anchor="end">453.60</text></g>' +
      '<rect class="bar-ok" x="18" y="194" width="176" height="8" rx="1"/><rect class="bar-q" x="196" y="194" width="16" height="8" rx="1"/>' +
      '<g class="fstamp"><rect x="96" y="220" width="116" height="32" rx="2"/><text x="154" y="241" text-anchor="middle">APPROVED</text></g></g>');
    var w = L.owner;
    o.push('<g transform="translate(' + w[0] + ' ' + w[1] + ')"><rect class="ring" x="-6" y="-6" width="132" height="120" rx="11"/><rect class="node" width="120" height="108" rx="8"/>' +
      '<text class="t-b" x="20" y="42">You</text><text class="m owner-a" x="20" y="64">answer and</text><text class="m owner-a" x="20" y="82">approve</text></g>');
    L.wires.src.forEach(function (d, i) {
      o.push('<path class="pk" pathLength="100" d="' + d + '" style="--d:' + (0.4 + i * 0.12).toFixed(2) + 's"/><path class="pk" pathLength="100" d="' + d + '" style="--d:' + (1.0 + i * 0.12).toFixed(2) + 's"/>');
    });
    o.push('<path class="pk ok short" pathLength="100" d="' + L.wires.cs + '" style="--d:4.2s"/><path class="pk q short" pathLength="100" d="' + L.wires.cs + '" style="--d:4.5s"/>');
    o.push('<path class="pk q short" pathLength="100" d="' + L.wires.so + '" style="--d:6.4s"/><path class="pk ok short" pathLength="100" d="' + L.wires.os + '" style="--d:7.3s"/>');
    o.push('</svg>');
    return o.join("");
  }
  var srcH = [0, 1, 2, 3].map(function (i) { return [0, 40 + i * 90, 232, 64]; });
  var LH = {
    cls: "flow-h", vb: "0 0 1200 440",
    src: srcH, core: [400, 96], sheet: [800, 86], owner: [1080, 166],
    wires: {
      src: srcH.map(function (s, i) { var ay = s[1] + 32, by = 160 + i * 40; return "M232 " + ay + " C316 " + ay + " 316 " + by + " 400 " + by; }),
      cs: "M660 220H800", so: "M1030 220H1080", os: "M1080 230H1030"
    }
  };
  var srcV = [0, 1, 2, 3].map(function (i) { return [0, 30 + i * 60, 220, 50]; });
  var LV = {
    cls: "flow-v", vb: "0 0 360 1036",
    src: srcV, core: [50, 322], sheet: [65, 620], owner: [120, 918],
    wires: {
      src: srcV.map(function (s) { var ay = s[1] + 25; return "M220 " + ay + " C312 " + ay + " 310 300 285 322"; }),
      cs: "M180 570V620", so: "M180 888V918", os: "M190 918V888"
    }
  };
  $("#flow-h").innerHTML = flowSVG(LH);
  $("#flow-v").innerHTML = flowSVG(LV);
  (function () {
    var fl = $("#flow"), tg = $("#flow-toggle"), inView = false, paused = false;
    if (RM.matches) { tg.hidden = true; return; }
    fl.classList.add("on");
    function sync() { fl.classList.toggle("off", paused || !inView || document.hidden); tg.textContent = paused ? "Play animation" : "Pause animation"; tg.setAttribute("aria-pressed", String(paused)); }
    new IntersectionObserver(function (es) { inView = es[0].isIntersecting; sync(); }, { threshold: .15 }).observe(fl);
    document.addEventListener("visibilitychange", sync);
    tg.addEventListener("click", function () { paused = !paused; sync(); });
  })();

  /* ---------- the problem: what we know ---------- */
  var EV = [
    ["Our starting assumption: owners are overwhelmed balancing admin with running the company, and it can cost them profit and push back meetings.", "Team problem statement, Oct 15. An assumption we are testing.", "q"],
    ["Owners we interviewed described having to double-check work or answer follow-up questions.", "2 of 2 interviews: a small business owner and a CEO", "t"],
    ["Showing the work makes checking faster than doing it yourself.", "Not tested yet. This is what we need owners for.", "q"]
  ];
  $("#ev-ledger").innerHTML = EV.map(function (r, i) {
    return '<li class="' + (r[2] === "q" ? "open" : "") + '"><span class="claim">' + r[0] + '<span class="src">' + r[1] + (i === EV.length - 1 ? ' <a href="#ask" data-ask="heard">Help us test it</a>' : "") + '</span></span>' + tk(r[2]) + '</li>';
  }).join("");
  $("#ev-key").innerHTML = '<span>' + tk("t") + 'Traced to a source</span><span>' + tk("q") + 'Not tested yet</span>';

  /* ---------- services ---------- */
  var FEAT = [
    ["Money and books", "Expense summary", "bank and card exports and your receipts folder", [["f", "Totals by category, checked against last month"], ["t", "Each line traced to its transaction and receipt"]], "Amazon, Oct 12, $214.60, no receipt. Business or personal?", "Your CPA decides tax treatment.", ["#hero-title", "Try it at the top of this page"]],
    ["Getting paid", "Overdue invoice reminders", "your invoice list and payment history", [["p", "One draft per client, in your tone"], ["t", "Amount and days late traced to the invoice"]], "Should the reminder to Hillside Vet include the late fee?", "No demand letters. Collections stay with an attorney or an agency.", ["#receipts", "See the example below"]],
    ["Money and books", "Bank and card reconciliation", "statements, plus read-only access to your books", [["t", "Every charge matched to your books"], ["f", "Ending balance tied out to the statement"]], "Check 2117 for $600 cleared but isn’t in your books. Who was it to?", "No edits to closed months. Your CPA signs off at year end.", null],
    ["Payroll and people", "Payroll prep", "timesheets and the schedule", [["t", "Hours per person, traced to timesheets"], ["f", "Overtime and changes since the last run, marked"]], "Were Kayla’s 6 overtime hours on Oct 18 approved?", "Your payroll provider runs payroll and files payroll taxes.", null],
    ["Customers and inbox", "Inbox triage and draft replies", "your business inbox", [["t", "Mail sorted into Needs you, Draft ready and FYI"], ["p", "Each draft cites the thread and your policy"]], "A customer wants a refund on a $90 groom. Your policy says store credit. Which?", "Replies go out only after you approve them.", null],
    ["Scheduling and operations", "Bills due and cash needed", "your bills inbox", [["t", "Bills by due date, checked against the last price paid"], ["f", "Cash needed this week, added up"]], "The shampoo supplier’s bill is 12% higher than the last order. Accept?", "You release every payment from your own bank.", null]
  ];
  $("#svc-grid").innerHTML = FEAT.map(function (s, i) {
    return '<li class="svc" data-reveal style="--i:' + i + '"><span class="cat">' + s[0] + '</span><h3>' + s[1] + '</h3><p class="give">You hand off ' + s[2] + '.</p>' +
      '<ul>' + s[3].map(function (r) { return '<li>' + tk(r[0]) + '<span>' + r[1] + '</span></li>'; }).join("") + '</ul>' +
      '<p class="flagq">' + tk("q") + '<span>“' + s[4] + '”</span></p><p class="bound">' + s[5] + '</p>' +
      (s[6] ? '<a class="here" href="' + s[6][0] + '">' + s[6][1] + '</a>' : '<span class="here" aria-hidden="true">&nbsp;</span>') + '</li>';
  }).join("");
  var CAT = [
    ["Money and books", ["*Expense summary", "*Bank and card reconciliation", "Receipt chase", "Subscription audit", "Month-end packet", "Tax-time organizer for your CPA"]],
    ["Getting paid", ["Invoices from finished jobs", "*Overdue invoice reminders", "Who owes you", "Deposit matching", "Quotes and estimates"]],
    ["Payroll and people", ["*Payroll prep", "Time off and coverage", "New hire checklist", "Hiring admin"]],
    ["Customers and inbox", ["*Inbox triage and draft replies", "Review replies", "Rebooking reminders", "Customer list cleanup"]],
    ["Scheduling and operations", ["*Bills due and cash needed", "Calendar management", "Reorder list", "Vendor quote comparison", "Meeting notes and follow-ups"]],
    ["Marketing admin", ["Post calendar", "Email newsletter", "Listing upkeep", "Promo tally"]],
    ["Documents and compliance", ["License and permit tracker", "Contract and lease summary", "Form prep", "Sales tax worksheet", "Document filing"]]
  ];
  $("#catalog").innerHTML = CAT.map(function (c) {
    return '<div><h3>' + c[0] + '</h3><ul>' + c[1].filter(function (n) { return n.charAt(0) !== "*"; }).map(function (n) { return '<li>' + n + '</li>'; }).join("") + '</ul></div>';
  }).join("");

  /* ---------- second example: the letter ---------- */
  (function () {
    var root = $("#wp"), live = $("#wp-live"), fee = null, approved = false, fresh = false, lockUntil = 0;
    function render() {
      var a = document.activeElement, fk = a && root.contains(a) ? a.getAttribute("data-f") : null;
      var bal = fee === "yes" ? 243.60 : 240;
      var body = '<p>Hi Dana,</p><p>A friendly reminder that invoice <span class="fig" data-ref="src">1043</span> from September 12 still has a balance of <span class="fig" data-ref="math" tabindex="0">' + money(bal) + '</span>' + tk("f") + ' after your October 2 payment of <span class="fig" data-ref="src" tabindex="0">$160.00</span>' + tk("t") + '.' +
        (fee === "yes" ? ' That includes a 1.5% late fee of <span class="fig" data-ref="fee" tabindex="0">$3.60</span>, per our payment terms.' : "") + '</p><p>You can pay by card using the link on the invoice. Thank you, and let me know if you have any questions.</p><p>Lena, Ozark Paws Grooming</p>';
      var mathNote = fee === "yes" ? '<span class="fig">$400.00</span> − <span class="fig">$160.00</span> + <span class="fig">$3.60</span> late fee = <span class="fig">$243.60</span>.' : '<span class="fig">$400.00</span> − <span class="fig">$160.00</span> = <span class="fig">$240.00</span>.';
      var foot;
      if (approved) foot = '<div class="foot-row"><p class="hint" tabindex="-1" data-f="wp-done">Approved. This is where the email would send. In this demo, nothing was sent.</p><div class="acts"><button type="button" class="btn ghost sm" data-act="restart" data-f="wp-restart">Start over</button></div></div>';
      else if (!fee) foot = '<div class="foot-row"><p class="hint">Approve unlocks once the late fee question is answered.</p><div class="acts"><button type="button" class="btn sm" data-act="q" data-f="wp-answer">Answer 1 question</button></div></div>';
      else foot = '<div class="foot-row"><p class="hint">Ready for your approval.</p><div class="acts"><button type="button" class="btn sm" data-act="approve" data-f="wp-approve">Approve this reminder</button></div></div>';
      root.innerHTML =
        '<div class="letter paper"><div class="letter-in">' + (approved ? '<div class="stamp' + (fresh ? " fresh" : "") + '" aria-hidden="true">Approved<small>' + TODAY + ', by you</small></div>' : "") +
        '<p class="lh">Ozark Paws Grooming <span>(made-up business) &nbsp; Draft 1 of 4, prepared Nov 3</span></p>' +
        '<dl class="mail-meta"><div><dt>To</dt><dd>Dana Whitfield, Hillside Vet billing (made up)</dd></div><div><dt>Subject</dt><dd>Invoice <span class="fig">1043</span>: <span class="fig" data-ref="math">' + money(bal) + '</span> balance</dd></div></dl>' +
        '<div class="mail-body">' + body + '</div></div>' +
        '<div class="rv-foot">' + foot + KEY + '<p class="signoff"><span>Prepared by Right Hand, Nov 3</span><span>Approved by <span class="line' + (approved ? " signed" : "") + '">' + (approved ? "you, " + TODAY : "&nbsp;") + '</span></span></p></div></div>' +
        '<ul class="wp-notes" aria-label="Notes on this draft">' +
        '<li data-ref="src">' + tk("t") + '<div>Built from invoice <span class="fig">1043</span> (<span class="fig">$400.00</span>, sent Sep 12) and the <span class="fig">$160.00</span> payment in your bank feed on Oct 2.</div></li>' +
        '<li data-ref="math">' + tk("f") + '<div>' + mathNote + ' The invoice was 52 days old on Nov 3.</div></li>' +
        '<li data-ref="fee" class="q' + (fee ? " ok" : "") + '">' + (fee ? tk("ok") : tk("q")) + '<div><span id="wp-q">Your payment terms add a 1.5% late fee after 30 days. That’s <span class="fig">$3.60</span> here. Include it?</span>' +
        '<div class="opts" role="group" aria-labelledby="wp-q"><button type="button" class="opt" data-act="fee" data-v="yes" data-f="fee-yes" aria-pressed="' + (fee === "yes") + '"' + (approved ? " disabled" : "") + '>Include $3.60</button><button type="button" class="opt" data-act="fee" data-v="no" data-f="fee-no" aria-pressed="' + (fee === "no") + '"' + (approved ? " disabled" : "") + '>Leave it off</button></div></div></li>' +
        '<li data-ref="pref">' + tk("p") + '<div>Your saved preference: friendly tone for clients who usually pay within 60 days.</div></li></ul>';
      fresh = false;
      if (fk) { var el = root.querySelector('[data-f="' + fk + '"]'); if (el && !el.disabled) el.focus({ preventScroll: true }); }
    }
    function hl(ref, on) { $$('[data-ref="' + ref + '"]', root).forEach(function (n) { n.classList.toggle("hl", on); }); }
    ["mouseover", "focusin"].forEach(function (ev) { root.addEventListener(ev, function (e) { var t = e.target.closest("[data-ref]"); if (t) hl(t.getAttribute("data-ref"), true); }); });
    ["mouseout", "focusout"].forEach(function (ev) { root.addEventListener(ev, function (e) { var t = e.target.closest("[data-ref]"); if (t) hl(t.getAttribute("data-ref"), false); }); });
    root.addEventListener("click", function (e) {
      var rf = e.target.closest("[data-ref]");
      if (rf && !e.target.closest("button")) { var ref = rf.getAttribute("data-ref"); $$(".hl", root).forEach(function (n) { n.classList.remove("hl"); }); hl(ref, true); }
      var b = e.target.closest("button"); if (!b || b.disabled) return;
      var act = b.getAttribute("data-act");
      if (act === "fee") { if (approved) return; fee = b.getAttribute("data-v"); render(); say(live, fee === "yes" ? "Late fee included. Balance is now $243.60." : "Late fee left off. Balance stays $240.00."); }
      else if (act === "q") { var o = root.querySelector('[data-f="fee-yes"]'); if (o) o.focus(); }
      else if (act === "approve") { approved = true; fresh = true; lockUntil = Date.now() + 900; render(); say(live, "Approved."); var d = root.querySelector('[data-f="wp-done"]'); if (d) d.focus({ preventScroll: true }); }
      else if (act === "restart") { if (e.detail > 1 || Date.now() < lockUntil) return; fee = null; approved = false; render(); var y = root.querySelector('[data-f="fee-yes"]'); if (y) y.focus(); say(live, "Started over."); }
    });
    render();
  })();

  /* ---------- the board ---------- */
  var COLS = [
    ["progress", "In progress", "Being prepared. You see the sources and math either way."],
    ["input", "Needs your input", "A question comes to you only when something is missing."],
    ["review", "Ready to review", "Finished work with its sources and math."],
    ["done", "Completed", "Approved work and saved files."]
  ];
  var EMPTY = { progress: "Nothing in progress. Add a task to start.", input: "No questions waiting on you.", review: "Nothing waiting. Finished work lands here.", done: "Approved work shows up here." };
  var TASKS0 = [
    { id: 1, s: "progress", t: "Match November card charges to receipts", due: "Dec 3", p: 41, note: "Matched 9 of 22 card charges so far" },
    { id: 3, s: "input", t: "October payroll prep", due: "Nov 6", ask: "Were Kayla’s 6 overtime hours on Oct 18 approved?", a: ["Yes", "No"] },
    { id: 4, s: "input", t: "Reminder emails for 4 overdue invoices", due: "Nov 6", ask: "Should the reminder to Hillside Vet include the late fee?", a: ["Yes", "No"] },
    { id: 5, s: "review", t: "October expense summary", due: "Nov 5" },
    { id: 6, s: "done", t: "September expense summary", m: "Approved Oct 3" },
    { id: 7, s: "done", t: "August expense summary", m: "Approved Sep 4" }
  ];
  var PREFS0 = ["Payroll comes from the payroll export, not the bank line.", "Use the same expense categories as last year’s taxes."];
  var tasks, prefs, nextId, reviews = {};
  var board = $("#board"), status = $("#board-status"), prefsEl = $("#prefs");
  function seed() { tasks = JSON.parse(JSON.stringify(TASKS0)); prefs = PREFS0.slice(); nextId = 100; reviews = {}; }
  function sayB(m) { status.textContent = m; }
  function find(id) { return tasks.filter(function (t) { return t.id === id; })[0]; }
  function card(t) {
    var meta = [];
    if (t.due) meta.push('<span class="due">Due ' + esc(t.due) + '</span>');
    if (t.m) meta.push(esc(t.m));
    var head = '<div class="t">' + esc(t.t) + '</div>' + (meta.length ? '<div class="m">' + meta.join(". ") + '</div>' : "");
    var open = '<div class="card' + (t.fresh ? " new" : "") + '" data-card="' + t.id + '" tabindex="-1">';
    if (t.s === "progress") return open + head + (t.note ? '<div class="m">' + esc(t.note) + '</div>' : "") + '<div class="prog" role="progressbar" aria-label="' + esc(t.t) + ', progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + t.p + '"><i style="width:' + t.p + '%"></i></div></div>';
    if (t.s === "input") return open + head + '<div class="ask" id="ask-' + t.id + '">' + esc(t.ask) + '</div><div class="row" role="group" aria-labelledby="ask-' + t.id + '">' +
      t.a.map(function (a) { return '<button type="button" class="opt" data-act="answer" data-id="' + t.id + '" data-a="' + esc(a) + '">' + esc(a) + '</button>'; }).join("") + '</div></div>';
    if (t.s === "review") return open + head + '<div class="m">Comes with its sources, the math and 3 questions.</div><div class="row"><button type="button" class="btn sm" data-act="review" data-id="' + t.id + '" aria-label="Review ' + esc(t.t) + '">Review</button></div></div>';
    return open + head + '</div>';
  }
  function renderBoard() {
    board.innerHTML = COLS.map(function (col, i) {
      var list = tasks.filter(function (t) { return t.s === col[0]; });
      return '<section class="col" data-k="' + col[0] + '" style="--i:' + i + '" aria-labelledby="col-' + col[0] + '"><div class="col-h"><h3 id="col-' + col[0] + '">' + col[1] + '</h3><span class="n' + (list.length ? "" : " zero") + '"><span aria-hidden="true">' + list.length + '</span><span class="sr-only">' + list.length + (list.length === 1 ? " task" : " tasks") + '</span></span></div><p class="col-cap">' + col[2] + '</p>' +
        (list.map(card).join("") || '<p class="empty">' + EMPTY[col[0]] + '</p>') + '</section>';
    }).join("");
    prefsEl.innerHTML = '<strong>' + BOOKMARK + 'Saved preferences</strong><ul>' + prefs.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join("") + '</ul>';
    tasks.forEach(function (t) { delete t.fresh; });
  }
  function focusCard(id) { var el = board.querySelector('[data-card="' + id + '"]'); if (el) { el.focus({ preventScroll: true }); el.scrollIntoView({ block: "nearest", behavior: RM.matches ? "auto" : "smooth" }); } }
  function openDialog(d) { if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", ""); }
  function closeDialog(d) { if (typeof d.close === "function") d.close(); else d.removeAttribute("open"); }
  var returnTo = null;
  $$("dialog").forEach(function (d) {
    var downOutside = false;
    function outside(e) { var r = d.getBoundingClientRect(); return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom; }
    d.addEventListener("pointerdown", function (e) { downOutside = e.target === d && outside(e); });
    d.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) { closeDialog(d); return; }
      if (e.target === d && downOutside && outside(e)) closeDialog(d);
      downOutside = false;
    });
    d.addEventListener("close", function () {
      var target = typeof returnTo === "number" ? board.querySelector('[data-card="' + returnTo + '"]') : returnTo;
      if (target && document.body.contains(target)) target.focus();
      returnTo = null;
    });
  });
  var dlgReview = $("#dlg-review"), dlgNew = $("#dlg-new");
  board.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    var act = b.getAttribute("data-act"), t = find(Number(b.getAttribute("data-id")));
    if (!t) return;
    if (act === "answer") {
      var a = b.getAttribute("data-a");
      t.s = "progress"; t.p = 25; t.m = "You answered: " + a; t.note = "Back to preparing with your answer"; t.fresh = true; delete t.ask;
      renderBoard(); focusCard(t.id); sayB("Answer saved. “" + t.t + "” is back in progress.");
    } else if (act === "review") {
      returnTo = b;
      var body = $("#dlg-review-body");
      if (!reviews[t.id]) {
        var el = document.createElement("div"); el.className = "rv paper"; reviews[t.id] = el; body.replaceChildren(el);
        makeReview(el, $("#dlg-live"), {
          id: "dlg", titleId: "dlg-title", noIntro: true,
          onApprove: function () { t.s = "done"; t.m = "Approved " + TODAY; t.fresh = true; delete t.due; renderBoard(); returnTo = t.id; sayB("“" + t.t + "” approved and saved to Completed."); },
          onSendBack: function () { t.s = "progress"; t.p = 80; t.m = "Changes requested"; t.note = "Being revised with your note"; t.fresh = true; renderBoard(); returnTo = t.id; sayB("“" + t.t + "” is back in progress with your note."); },
          onClose: function () { closeDialog(dlgReview); }
        });
      } else body.replaceChildren(reviews[t.id]);
      openDialog(dlgReview);
      var ft = body.querySelector('.tab[aria-selected="true"]'); if (ft) ft.focus();
    }
  });
  var HINTS = {
    "Expense summary": "Which month? Which accounts and cards? Anything personal to leave out?",
    "Overdue invoice reminders": "Which clients or invoices? How firm should the tone be? Include late fees?",
    "Payroll prep": "Which pay period? Where do the hours come from? Who approves overtime?",
    "Something else": "What result do you want, and how will you know it was done right?"
  };
  var fType = $("#f-type"), fIns = $("#f-ins"), fHint = $("#f-hint"), fErr = $("#f-err"), fDue = $("#f-due"), fSave = $("#f-save"), fFiles = $("#f-files");
  function iso(d) { var m = d.getMonth() + 1, day = d.getDate(); return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day; }
  function setHint() { fHint.textContent = "Good to include: " + HINTS[fType.value]; }
  function clearErr() { fErr.hidden = true; fIns.removeAttribute("aria-invalid"); fIns.setAttribute("aria-describedby", "f-hint"); }
  function clip(s, n) { if (s.length <= n) return s; var cut = s.lastIndexOf(" ", n); return s.slice(0, cut > n / 2 ? cut : n) + "…"; }
  fType.addEventListener("change", setHint);
  fIns.addEventListener("input", function () { if (fIns.value.trim()) clearErr(); });
  $("#new-task").addEventListener("click", function () {
    returnTo = this; $("#f-new").reset(); clearErr();
    var d = new Date(); d.setDate(d.getDate() + 3); fDue.value = iso(d); fDue.min = iso(new Date());
    setHint(); openDialog(dlgNew); fType.focus();
  });
  $("#f-new").addEventListener("submit", function (e) {
    e.preventDefault();
    var ins = fIns.value.trim();
    if (!ins) { fErr.hidden = false; fIns.setAttribute("aria-invalid", "true"); fIns.setAttribute("aria-describedby", "f-hint f-err"); fIns.focus(); return; }
    var type = fType.value, title = type === "Something else" ? clip(ins, 48) : type, due = "";
    if (fDue.value) { var p = fDue.value.split("-"); due = shortDate(new Date(+p[0], +p[1] - 1, +p[2])); }
    var files = fFiles.files ? fFiles.files.length : 0;
    var t = { id: nextId++, s: "progress", t: title, due: due, p: 5, m: "Just added" + (files ? ", " + files + " file" + (files > 1 ? "s" : "") + " attached" : ""), note: "Waiting to start", fresh: true };
    tasks.push(t);
    if (fSave.checked) prefs.push(type + ": " + clip(ins, 60));
    renderBoard(); returnTo = t.id; closeDialog(dlgNew);
    sayB("“" + title + "” added to In progress." + (fSave.checked ? " Instructions saved as a preference." : ""));
  });
  $("#reset").addEventListener("click", function () {
    if (dlgReview.open) closeDialog(dlgReview);
    seed(); renderBoard(); sayB("Board reset. Answer a question under Needs your input, or open the expense summary under Ready to review.");
  });
  seed(); renderBoard();

  /* ---------- the ask: an email draft the visitor approves ---------- */
  var aBiz = $("#a-biz"), aWhen = $("#a-when"), aTask = $("#a-task"), aPrev = $("#a-preview"), aSend = $("#a-send"), aCopy = $("#a-copy"), cStat = $("#copy-status");
  var WHERE = { header: "top bar", hero: "top of the page", approved: "after trying the sample", heard: "problem section", final: "bottom of the page" };
  function draft() {
    var before = ($('input[name="a-before"]:checked') || {}).value || "";
    var how = ($('input[name="a-how"]:checked') || {}).value || "";
    var lines = ["Hi Right Hand team,", "", "I’d like a 15-minute walkthrough.", "",
      "My business: " + (aBiz.value.trim() || ""),
      "Days and times that work for me: " + (aWhen.value.trim() || "")];
    if (how) lines.push("Best way to meet: " + how);
    if (aTask.value) lines.push("The admin task I’d hand off first: " + aTask.value);
    if (before) lines.push("Handed admin work off before: " + before);
    if (LAST.secs) lines.push("", "I tried the sample on your page and approved it in " + spokenTime(LAST.secs) + ".");
    lines.push("", "(Sent from the Right Hand page" + (SRC ? ", via " + SRC : "") + (WHERE[LAST.where] ? ", from the " + WHERE[LAST.where] : "") + ")");
    var subject = "Right Hand walkthrough" + (aBiz.value.trim() ? ": " + aBiz.value.trim().slice(0, 60) : "");
    return { subject: subject, body: lines.join("\n") };
  }
  function updateComposer() {
    var d = draft();
    aPrev.textContent = "To: " + CONTACT.email + "\nSubject: " + d.subject + "\n\n" + d.body;
    aSend.href = CONTACT.form ? CONTACT.form + "?src=" + encodeURIComponent(LAST.where || SRC || "page")
      : "mailto:" + CONTACT.email + "?subject=" + encodeURIComponent(d.subject) + "&body=" + encodeURIComponent(d.body.replace(/\n/g, "\r\n"));
  }
  ["input", "change"].forEach(function (ev) { $("#ask-form").addEventListener(ev, updateComposer); });
  $("#ask-form").addEventListener("submit", function (e) { e.preventDefault(); aSend.click(); });
  aSend.addEventListener("click", function () { setTimeout(function () { if (document.visibilityState === "visible") cStat.textContent = "If no email opened, tap Copy the email and paste it into an email to " + CONTACT.email + "."; }, 1500); });
  aCopy.addEventListener("click", function () {
    var d = draft(), text = "To: " + CONTACT.email + "\nSubject: " + d.subject + "\n\n" + d.body;
    function ok() { cStat.textContent = "Copied. Paste it into any email to " + CONTACT.email + "."; }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, function () { selectPrev(); });
    else selectPrev();
    function selectPrev() { var r = document.createRange(); r.selectNodeContents(aPrev); var s = getSelection(); s.removeAllRanges(); s.addRange(r); cStat.textContent = "Selected. Press Ctrl+C or Cmd+C to copy."; }
  });
  updateComposer();
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[data-ask]"); if (!a) return;
    LAST.where = a.getAttribute("data-ask"); updateComposer();
    setTimeout(function () { var h = $("#ask-title"); if (h) h.focus({ preventScroll: true }); }, RM.matches ? 0 : 450);
  });

  /* ---------- header turns dark over dark bands ---------- */
  (function () {
    var top = $("#top"), on = new Set(), io = null, bands = $$('[data-theme="dark"]');
    function cb(es) { es.forEach(function (e) { if (e.isIntersecting) on.add(e.target); else on.delete(e.target); }); top.classList.toggle("on-dark", on.size > 0); }
    function build() { if (io) io.disconnect(); on.clear(); io = new IntersectionObserver(cb, { rootMargin: "-63px 0px " + (66 - innerHeight) + "px 0px" }); bands.forEach(function (s) { io.observe(s); }); }
    build(); var rt = 0; addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(build, 150); });
  })();

  /* ---------- reveals, counters and the board rules ---------- */
  (function () {
    var targets = $$("[data-reveal]");
    if (!document.documentElement.classList.contains("js-motion")) { board.classList.add("drawn"); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in"); io.unobserve(e.target);
      });
    }, { threshold: .15 });
    targets.forEach(function (t) { io.observe(t); });
    var bo = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { board.classList.add("drawn"); bo.disconnect(); } }, { threshold: .2 });
    bo.observe(board);
  })();

  /* ---------- present mode: a one-minute walkthrough for class ---------- */
  (function () {
    var stage = null, idx = 0, presSecs = 0, lastFocus = null;
    var QR = $(".qr svg") ? $(".qr svg").outerHTML : "";
    function stops() {
      return [
        '<p class="big">Right Hand</p><p class="sub">Admin help that shows its work.</p><p class="srcline">One-minute walkthrough. Press the right arrow, the space bar or your clicker.</p>',
        '<p class="big">Small business owners are overwhelmed balancing admin with running the company.</p><p class="sub">Main issue: trust with AI and virtual assistants.</p><p class="srcline">Team problem statement, Oct 15, 2026</p>',
        '<p class="big">2 interviews: a small business owner and a CEO.</p><p class="sub">Both described having to double-check work or answer follow-up questions.</p><p class="srcline">Our first customer discovery interviews</p>',
        '<p class="sub" style="margin:0 auto 18px;text-align:center">Check a made-up month. Answer the questions, then approve.</p><div class="stage-sheet"><div class="rv paper" id="pres-rv"></div><p class="sr-only" aria-live="polite" id="pres-live"></p></div>',
        '<p class="big">Owners will hand off routine admin if checking the finished work takes less time than doing it themselves.</p><p class="sub" id="pres-time"></p><p class="srcline">Our hypothesis</p>',
        '<p class="big">Next: 15-minute walkthroughs with owners.</p><div class="stage-qr">' + QR + '<p class="sub" style="margin:0">Scan to try it on your phone.<br><span class="mono">jacksonvarela1.github.io/right-hand</span></p></div>'
      ];
    }
    function show(n) {
      var list = $$(".stop", stage); idx = Math.max(0, Math.min(list.length - 1, n));
      list.forEach(function (s, i) { s.classList.toggle("on", i === idx); });
      $("#stage-count", stage).textContent = (idx + 1) + " / " + list.length;
      if (idx === 4) $("#pres-time", stage).textContent = presSecs ? "We just checked a made-up month in " + spokenTime(presSecs) + "." : "";
    }
    function open() {
      if (stage) return;
      lastFocus = document.activeElement; if (HA.takeOver) HA.takeOver();
      document.documentElement.classList.add("presenting");
      stage = document.createElement("div"); stage.id = "stage"; stage.className = "dark"; stage.setAttribute("role", "region"); stage.setAttribute("aria-label", "Right Hand, one-minute walkthrough"); stage.tabIndex = -1;
      stage.innerHTML = stops().map(function (h) { return '<div class="stop">' + h + '</div>'; }).join("") +
        '<div class="stage-nav"><button type="button" class="bar-btn" data-s="prev">Back</button><button type="button" class="bar-btn" data-s="next">Next</button><span id="stage-count"></span><span class="grow"></span><button type="button" class="bar-btn" data-s="exit">Exit (Esc)</button></div>';
      document.body.appendChild(stage);
      Array.prototype.forEach.call(document.body.children, function (n) { if (n !== stage && n.tagName !== "SCRIPT") { n.setAttribute("data-was-inert", n.inert ? "1" : "0"); n.inert = true; } });
      makeReview($("#pres-rv", stage), $("#pres-live", stage), { id: "pres", hero: true, noIntro: true, onApprove: function (s) { presSecs = s >= 3 && s <= 600 ? s : 0; } });
      stage.addEventListener("click", function (e) { var b = e.target.closest("[data-s]"); if (!b) return; var s = b.getAttribute("data-s"); if (s === "prev") show(idx - 1); else if (s === "next") show(idx + 1); else close(); });
      show(0); stage.focus();
    }
    function close() {
      if (!stage) return;
      stage.remove(); stage = null; document.documentElement.classList.remove("presenting");
      Array.prototype.forEach.call(document.body.children, function (n) { if (n.hasAttribute("data-was-inert")) { n.inert = n.getAttribute("data-was-inert") === "1"; n.removeAttribute("data-was-inert"); } });
      if (location.hash === "#present") history.replaceState(null, "", location.pathname + location.search);
      if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus();
    }
    document.addEventListener("keydown", function (e) {
      if (!stage) return;
      var t = e.target, guard = t.getAttribute && (t.getAttribute("role") === "tab" || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "PageDown" || (!guard && (e.key === "ArrowRight" || (e.key === " " && t === stage)))) { e.preventDefault(); show(idx + 1); }
      else if (e.key === "PageUp" || (!guard && e.key === "ArrowLeft")) { e.preventDefault(); show(idx - 1); }
    });
    function check() { if (location.hash === "#present" || /(^|[?&])present\b/.test(location.search)) open(); }
    addEventListener("hashchange", check);
    $("#present-link").addEventListener("click", function (e) { e.preventDefault(); open(); });
    check();
  })();
})();
