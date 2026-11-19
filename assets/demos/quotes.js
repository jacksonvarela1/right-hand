/* Prototype 07: a job-site voice note becomes a priced quote. Ridgeline Fence & Deck, Centerton (made-up crew, sample data).
   Left: the owner's phone with three sample voice notes. Middle: the owner's own price sheet. Right: the quote draft.
   Right Hand only copies unit prices off the sheet and turns anything unclear into one question. The You cursor (or
   the visitor) answers it, nudges quantities and approves. Every figure is whole cents from calc(), so the math foots
   on every path. Nothing measures layout when this file runs (the panel may be hidden then): only the cursors
   measure, and they do it at the moment they move. No timers: steps, and tracked animations for the beats in between.
   With motion off (reduced motion or the Pause motion switch) nothing animates: every beat paints its end state.
   On phones the stage shows one part at a time (views "note", "quote", "sheet"): the note while it is heard, then the
   quote. Picking another note plays it and then turns to its quote. */
(function () {
  "use strict";
  var root = document.getElementById("demo-quotes");
  if (!root || !window.RH || !RH.demo) return;
  var stage = root.querySelector(".stage");
  if (!stage) return;

  var U = RH.util, esc = U.esc, CK = U.CHECK, TAX = 9, T_PLAY = 5200, T_AGAIN = 2400, BARS = 43;
  var LAND = window.CSS && CSS.supports && CSS.supports("animation-timing-function", "linear(0, 1)") ? "linear(0,.13 6%,.45 13%,.78 20%,.97 27%,1.04 34%,1.05 40%,1.03 48%,1.005 60%,.998 75%,1)" : "cubic-bezier(.23,1,.32,1)";
  var IDLE = "Your prices. Right Hand never sets or changes one.";
  var DRAFT = "Draft. Nothing is sent until you approve.";

  // the owner's price sheet (sample): key, name, unit price in cents, unit on the sheet, unit in a quantity (one, many)
  var SHEET = [
    ["privacy", "Cedar privacy fence, 6 ft", 3150, "/ft", "ft", "ft"],
    ["picket", "Cedar picket fence, 4 ft", 2400, "/ft", "ft", "ft"],
    ["post", "Replace post, in concrete", 8500, "each", "post", "posts"],
    ["walk", "Walk gate, 4 ft", 28500, "each", "gate", "gates"],
    ["drive", "Double drive gate, 10 ft", 64000, "each", "gate", "gates"],
    ["remove", "Remove old fence", 400, "/ft", "ft", "ft"],
    ["haul", "Haul-off", 17500, "/load", "load", "loads"],
    ["deck", "Deck, pressure-treated", 2400, "/sq ft", "sq ft", "sq ft"],
    ["steps", "Deck steps", 9500, "/step", "step", "steps"],
    ["rail", "Deck railing", 3800, "/ft", "ft", "ft"]
  ];
  var P = {};
  SHEET.forEach(function (r) { P[r[0]] = { name: r[1], c: r[2], one: r[4], many: r[5] }; });

  // say: the transcript, one phrase per entry. {key|words} marks the words that became a line (q = the unclear part).
  // lines: [sheet key, quantity heard, nudge step, lowest, highest]. q.opts: p = sheet key and n = quantity, when priced.
  var ORDER = ["fence", "deck", "repair"];
  var NOTES = {
    fence: {
      name: "Hartley backyard", at: "4:40 PM", len: 20, cust: "M. Hartley", job: "Backyard fence", no: "0412",
      say: ["Okay, just walked the Hartley place.", "Backyard: {privacy|120 feet of 6-foot cedar privacy}.", "{remove|Tear out the old chain link} first, same 120.", "{haul|One load to haul off}.", "And they want {q|a gate} on the driveway side."],
      lines: [["privacy", 120, 8, 96, 144], ["remove", 120, 8, 96, 144], ["haul", 1, 1, 1, 3]],
      q: { t: "Which gate?", why: "The note says \"a gate\" but not which kind. Your sheet has two.", sheet: "Two rows match \"a gate\". Asking you.", cand: ["walk", "drive"],
        opts: [{ k: "walk", l: "Walk gate", p: "walk", n: 1 }, { k: "drive", l: "Drive gate", p: "drive", n: 1 }] }
    },
    deck: {
      name: "Okafor deck", at: "1:15 PM", len: 24, cust: "T. Okafor", job: "Back deck", no: "0411",
      say: ["Deck at the Okafor house.", "{deck|12 by 16, 192 square feet, pressure-treated}, on the back of the house.", "{steps|4 steps} down to the yard.", "{rail|40 feet of railing} on the three open sides.", "She also asked about {q|staining it}."],
      lines: [["deck", 192, 16, 160, 224], ["steps", 4, 1, 2, 6], ["rail", 40, 4, 32, 48]],
      q: { t: "Add staining?", why: "Staining is not on your price sheet, so there is no price to use.", sheet: "Staining is not on your sheet. Asking you.", cand: [],
        opts: [{ k: "off", l: "Leave it off", done: "Staining", amt: "Left off" }, { k: "sep", l: "Quote it separately", done: "Stain and seal", amt: "Separate quote" }] }
    },
    repair: {
      name: "Castillo repair", at: "10:05 AM", len: 19, cust: "R. Castillo", job: "Storm repair", no: "0410",
      say: ["Storm repair at the Castillo house.", "{privacy|32 feet of the 6-foot cedar privacy} is down.", "Replace it and {remove|tear out the old run}.", "{haul|One load to haul off}.", "Posts: {q|4 snapped, maybe 5}. I need to look again."],
      lines: [["privacy", 32, 8, 16, 48], ["remove", 32, 8, 16, 48], ["haul", 1, 1, 1, 3]],
      q: { t: "4 posts or 5?", why: "The note says \"4 snapped, maybe 5\". Right Hand does not guess.", sheet: "One row matches, but is it 4 or 5? Asking you.", cand: ["post"],
        opts: [{ k: "p4", l: "4 posts", p: "post", n: 4 }, { k: "p5", l: "5 posts", p: "post", n: 5 }] }
    }
  };
  function plain(s) { return s.replace(/\{\w+\|([^}]+)\}/g, "$1"); }
  // per note: when each phrase ends (0 to 1), which phrase each line came from, and a waveform that goes quiet between phrases
  ORDER.forEach(function (key, seed) {
    var n = NOTES[key], tot = 0, ends = [], d = "", i, k = 0, a, u, h;
    n.say.forEach(function (s) { tot += plain(s).length; ends.push(tot); });
    n.end = ends.map(function (e) { return e / tot; });
    n.from = n.lines.map(function (l) { for (var j = 0; j < n.say.length; j++) if (n.say[j].indexOf("{" + l[0] + "|") >= 0) return j; return 0; });
    for (i = 0; i < BARS; i++) {
      u = (i + .5) / BARS * tot;
      while (u > ends[k]) k++;
      a = k ? ends[k - 1] : 0;
      u = (u - a) / (ends[k] - a);
      h = Math.max(2, Math.round(4 + 30 * Math.pow(Math.sin(Math.PI * u), .55) * (.45 + .55 * Math.abs(Math.sin(i * 1.9 + seed * 2.1) * Math.cos(i * .7 + seed)))));
      d += "M" + (3 + i * 4) + " " + (20 - h / 2) + "v" + h;
    }
    n.wave = d;
  });

  var st, E = { w: null }, R = {}, CX = null, player = null, gen = 0, swapAt = -1e4;

  /* ---------- the model: whole cents in, whole cents out ---------- */
  function fresh(note) {
    st = { note: note, heard: 0, shown: 0, asked: false, footed: false, checked: false, ans: null, approved: false, qty: {} };
    NOTES[note].lines.forEach(function (l) { st.qty[l[0]] = l[1]; });
  }
  function opt() { var o = NOTES[st.note].q.opts; for (var i = 0; i < o.length; i++) if (o[i].k === st.ans) return o[i]; return null; }
  function calc() {
    var n = NOTES[st.note], rows = [], sub = 0, o = opt(), q = o && o.p ? o.n * P[o.p].c : 0;
    n.lines.forEach(function (l, i) { var c = i < st.shown ? st.qty[l[0]] * P[l[0]].c : 0; rows.push(c); sub += c; });
    sub += q;
    var tax = Math.round(sub * TAX / 100);
    return { rows: rows, q: q, sub: sub, tax: tax, total: sub + tax };
  }
  function usd(c) { return U.money(c / 100); }
  function bare(c) { return usd(c).replace("$", ""); }
  function units(k, n) { return n + " " + (n === 1 ? P[k].one : P[k].many); }
  function done() { st.heard = NOTES[st.note].say.length; st.shown = NOTES[st.note].lines.length; st.asked = true; st.footed = true; st.checked = true; }

  /* ---------- markup: built once per voice note, then paint() keeps it in step with st ---------- */
  function noteHTML(k) {
    var n = NOTES[k], on = k === st.note, s, clock = "";
    var h = '<li data-n="' + k + '"' + (on ? ' class="on"' : "") + '><button type="button" class="qn" data-note="' + k + '"' + (on ? ' aria-current="true"' : "") + ">" +
      '<span class="qn-i" aria-hidden="true"><svg viewBox="0 0 16 16"><path class="a" d="M5.6 3.7v8.6L12.4 8z"/><path class="b" d="M5.5 4.2v7.6M10.5 4.2v7.6"/></svg></span>' +
      '<span class="qn-t">' + esc(n.name) + '</span><span class="qn-m">Today, ' + n.at + '</span><span class="qn-d"><span class="sr-only">Voice note, </span>0:' + n.len + '<span class="sr-only">. Play it and draft the quote.</span></span></button>';
    if (!on) return h + "</li>";
    for (s = 0; s <= n.len; s++) clock += "<b>0:" + (s < 10 ? "0" : "") + s + "</b>";
    return h + '<div class="qn-body"><div class="qw-row" aria-hidden="true"><span class="qw"><svg class="qw-a" viewBox="0 0 174 40"><path d="' + n.wave + '"/></svg>' +
      '<span class="qw-clip"><svg class="qw-b" viewBox="0 0 174 40"><path d="' + n.wave + '"/></svg></span><i class="qw-head"></i></span><span class="qw-t"><span>' + clock + "</span></span></div>" +
      '<p class="qn-l">Transcript</p><p class="qn-tx">' +
      n.say.map(function (p) { return '<span class="ph">' + esc(p).replace(/\{(\w+)\|([^}]+)\}/g, '<mark data-l="$1">$2</mark>') + "</span>"; }).join(" ") + "</p>" +
      '<p class="qn-key"><span><i></i>became a line</span><span><i class="q"></i>needs your answer</span></p></div></li>';
  }
  function stepper(i, l) {
    var p = P[l[0]], nm = esc(p.name);
    return '<span class="ql-q"><button type="button" class="ql-b" data-i="' + i + '" data-d="-1" aria-label="Less: ' + nm + '"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6h7"/></svg></button>' +
      '<span class="ql-v"></span><button type="button" class="ql-b" data-i="' + i + '" data-d="1" aria-label="More: ' + nm + '"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6h7M6 2.5v7"/></svg></button>' +
      '<span class="ql-x">x ' + usd(p.c) + "</span></span>";
  }
  function build() {
    var n = NOTES[st.note], q = n.q;
    gen++; R = {};
    E.w.innerHTML =
      '<div class="qp"><div class="qp-screen paper"><div class="qp-sb"><time datetime="2026-11-05T16:42">Thu Nov 5, 4:42 PM</time><span>Voice notes</span></div>' +
        '<ol class="qn-list" aria-label="Voice notes (sample)">' + ORDER.map(noteHTML).join("") + '</ol><p class="qp-tip"><b>Your turn</b><span>Pick a note to quote.</span></p></div></div>' +
      '<section class="qs" aria-labelledby="dq-ps"><h4 class="q-h" id="dq-ps">Your price sheet (sample)</h4><ul>' +
        SHEET.map(function (r) { return '<li data-p="' + r[0] + '"><i aria-hidden="true"></i><span class="qs-n">' + esc(r[1]) + '</span><span class="qs-c">' + usd(r[2]) + '</span><span class="qs-u">' + r[3] + '</span><em class="sr-only"></em></li>'; }).join("") +
        '</ul><p class="qs-f"></p></section>' +
      '<section class="qq paper" aria-label="Quote draft (sample)">' +
        '<div class="qq-head"><div><p class="qq-t">Ridgeline Fence &amp; Deck</p><p class="qq-s">Made-up business · Centerton</p></div><span class="qq-open"></span></div>' +
        '<p class="qq-for"><span><b>Quote ' + n.no + "</b> for <b>" + esc(n.cust) + "</b> <i>(sample customer)</i></span><span>" + esc(n.job) + " · Thu Nov 5, 2026</span></p>" +
        '<ol class="qq-lines">' + n.lines.map(function (l, i) {
          return '<li class="ql" data-l="' + l[0] + '"><span class="ql-n">' + esc(P[l[0]].name) + '</span><span class="ql-a"></span>' + stepper(i, l) + "</li>";
        }).join("") + "</ol>" +
        '<div class="qa" data-l="q"><p class="qa-k"><span></span><b></b></p><p class="qa-q"><span id="dq-q"></span><span class="qa-a"></span></p><p class="qa-m">' + esc(q.why) + '</p><div class="qa-o" role="group" aria-labelledby="dq-q">' +
          q.opts.map(function (o) { return '<button type="button" class="chip" data-o="' + o.k + '" aria-pressed="false"><span>' + esc(o.l) + "</span>" + (o.p ? '<span class="qa-p">' + usd(o.n * P[o.p].c) + "</span>" : "") + "</button>"; }).join("") + "</div></div>" +
        '<dl class="qq-sum"><div><dt>Subtotal</dt><dd data-s="sub"></dd></div><div><dt>Tax (sample, ' + TAX + '%)</dt><dd data-s="tax"></dd></div>' +
          '<div class="qq-tot"><dt></dt><dd data-s="total"></dd></div><div class="qq-math"><dt>Math</dt><dd></dd></div></dl>' +
        '<p class="qq-chk"><span class="qq-box">' + CK + "</span><b></b><span>Every line re-added.</span></p>" +
        '<div class="qq-foot"><p class="qq-by"></p><button type="button" class="btn sm qq-ok" disabled>Approve</button>' +
          '<button type="button" class="btn sm ghost qq-edit" hidden><b><span>Make a </span>change</b></button><p class="qq-stamp" aria-hidden="true">Approved<small>Nov 5, by you</small></p></div>' +
      "</section>" +
      '<div class="q-trace"><h4>How it decided</h4><ul><li><i></i>Never invents a price.</li><li><i></i>Only uses your price sheet.</li><li><i></i>Anything unclear or not on the sheet becomes a question for you.</li></ul></div>' +
      '<i class="q-tm" aria-hidden="true"></i>';
    function $(s) { return E.w.querySelector(s); }
    function $$(s) { return Array.prototype.slice.call(E.w.querySelectorAll(s)); }
    E.note = $(".qn-list li.on"); E.tx = $(".qn-tx"); E.ph = $$(".ph"); E.marks = $$("mark"); E.clip = $(".qw-clip"); E.head = $(".qw-head"); E.clock = $(".qw-t span");
    E.row = {}; $$(".qs li").forEach(function (li) { E.row[li.getAttribute("data-p")] = li; });
    E.ps = $(".qs"); E.psf = $(".qs-f"); E.quote = $(".qq"); E.open = $(".qq-open"); E.lines = $$(".ql");
    E.ask = $(".qa"); E.askK = $(".qa-k span"); E.askN = $(".qa-k b"); E.askT = $("#dq-q"); E.askA = $(".qa-a"); E.chips = $$(".qa-o .chip");
    E.sum = {}; $$("[data-s]").forEach(function (d) { E.sum[d.getAttribute("data-s")] = d; });
    E.totL = $(".qq-tot dt"); E.math = $(".qq-math dd"); E.chk = $(".qq-chk"); E.box = $(".qq-box .ck"); E.chkT = $(".qq-chk b");
    E.by = $(".qq-by"); E.ok = $(".qq-ok"); E.edit = $(".qq-edit"); E.tr = $$(".q-trace li"); E.tm = $(".q-tm");
  }

  // an amount that can roll to its new value. The last frame always writes the exact figure.
  function amount(key, el, c, tick) {
    var r = R[key] || (R[key] = { c: null, g: 0 }), from = r.c, g = ++r.g;
    r.c = c;
    if (c == null) { el.textContent = ""; return; }
    if (!tick || from === c || RH.motionOff() || !window.requestAnimationFrame) { el.textContent = usd(c); return; }
    var t0 = performance.now(); from = from || 0;
    requestAnimationFrame(function f(t) {
      if (r.g !== g || !el.isConnected) return;
      var k = RH.motionOff() ? 1 : Math.min(1, Math.max(0, (t - t0) / 480)), e = 1 - Math.pow(1 - k, 3);
      el.textContent = usd(Math.round(from + (c - from) * e));
      if (k < 1) requestAnimationFrame(f);
    });
  }
  function paint(o) {
    o = o || {};
    var n = NOTES[st.note], q = n.q, c = calc(), pk = opt(), open = st.asked && !pk, lock = st.approved, used = [];
    // phone
    E.note.classList.toggle("played", st.heard > 0);
    E.tx.classList.toggle("go", st.heard > 0);
    E.ph.forEach(function (p, i) { p.classList.toggle("on", i < st.heard); });
    n.lines.forEach(function (l, i) { if (i < st.shown) used.push(l[0]); });
    if (pk && pk.p) used.push(pk.p);
    E.marks.forEach(function (m) {
      var k = m.getAttribute("data-l");
      m.classList.toggle("ask", k === "q" && open);
      m.classList.toggle("hit", k === "q" ? st.asked && !open : used.indexOf(k) >= 0);
    });
    // price sheet: a used row is checked, a row that might match waits in amber
    SHEET.forEach(function (r) {
      var li = E.row[r[0]], hit = used.indexOf(r[0]) >= 0, ask = open && q.cand.indexOf(r[0]) >= 0;
      li.classList.toggle("hit", hit); li.classList.toggle("ask", ask);
      li.lastChild.textContent = hit ? " Used in this quote." : ask ? " Possible match. Needs your answer." : "";
    });
    E.ps.classList.toggle("asking", open);
    E.psf.textContent = open ? q.sheet : IDLE;
    // quote lines
    n.lines.forEach(function (l, i) {
      var li = E.lines[i], k = l[0], v = st.qty[k], on = i < st.shown, b = li.querySelectorAll(".ql-b");
      li.classList.toggle("on", on);
      li.querySelector(".ql-v").textContent = units(k, v);
      amount("l" + i, li.querySelector(".ql-a"), on ? c.rows[i] : null, o.tick);
      // at a limit the button stays focusable (aria-disabled), so a keyboard nudge does not drop focus to the page
      [v <= l[3], v >= l[4]].forEach(function (end, j) {
        b[j].disabled = lock;
        if (end && !lock) b[j].setAttribute("aria-disabled", "true"); else b[j].removeAttribute("aria-disabled");
      });
    });
    // the one question
    E.ask.classList.toggle("on", st.asked); E.ask.classList.toggle("ok", !!pk);
    E.askK.textContent = pk ? "Your answer" : "Needs your answer";
    E.askN.textContent = pk ? (pk.p ? pk.n + " x " + usd(P[pk.p].c) : "no price") : "";
    E.askN.className = pk && !pk.p ? "w" : "";
    E.askT.textContent = pk ? (pk.p ? P[pk.p].name : pk.done) : q.t;
    E.askA.textContent = pk ? (pk.p ? usd(c.q) : pk.amt) : "Not in yet";
    E.chips.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-o") === st.ans)); b.disabled = lock; });
    E.open.textContent = st.asked ? (open ? "1 open" : "0 open") : "Draft";
    E.open.className = "qq-open" + (st.asked ? (open ? " one" : " zero") : "");
    // totals, the footing check and the mark of the person who re-added it
    ["sub", "tax", "total"].forEach(function (k) { amount(k, E.sum[k], st.footed ? c[k] : null, o.tick); });
    E.totL.textContent = open && st.footed ? "Total so far" : "Total";
    E.math.textContent = st.footed ? "Lines add to " + bare(c.sub) + ", plus " + bare(c.tax) + " tax = " + bare(c.total) + "." : "";
    E.chk.classList.toggle("on", st.checked);
    E.box.classList.toggle("on", st.checked);
    E.chkT.textContent = st.checked ? "Checked by Right Hand" : "Not checked yet";
    // approval: locked until the math is checked and the question is answered
    var ready = st.checked && !!pk;
    E.ok.disabled = !ready; E.ok.hidden = lock;
    E.ok.innerHTML = st.asked && !pk ? "<b>Answer 1 question<span> to approve</span></b>" : "Approve";
    E.edit.hidden = !lock;
    E.by.textContent = lock ? "Quote ready to send (sample)" : DRAFT;
    E.quote.classList.toggle("approved", lock);
    [st.footed, st.shown > 0, st.asked].forEach(function (on, i) { E.tr[i].classList.toggle("hit", on); });
  }

  /* ---------- motion helpers ---------- */
  // a beat between two steps: a silent animation the player tracks, so it stops and resumes with the demo
  function after(c, ms, fn) {
    var g = gen, a = RH.motionOff() ? null : c.anim(E.tm, [{ opacity: 0 }, { opacity: 0 }], { duration: ms, easing: "linear", fill: "none" });
    if (!a) { fn(); return; }
    a.onfinish = function () { if (g === gen) fn(); };
  }
  // with motion off there is nothing to animate (and an animation made while the player is paused would hold its first frame)
  function land(c, el) { if (!RH.motionOff()) c.anim(el, [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 380, easing: LAND, fill: "none" }); }
  function recheck(c) {
    if (!st.checked || RH.motionOff()) return;
    E.box.classList.remove("on"); void E.box.getBoundingClientRect(); E.box.classList.add("on");   // empty the box, then draw the check again
    c.anim(E.math, [{ opacity: .3 }, { opacity: 1 }], { duration: 420, easing: "ease-out", fill: "none" });
  }

  /* ---------- Right Hand's beats ---------- */
  // the note plays: the bars fill, the clock runs and each phrase appears as it is spoken (no audio)
  function hear(c, T) {
    var n = NOTES[st.note], li = E.note;
    st.heard = n.say.length; paint();
    if (RH.motionOff()) return;
    li.classList.add("play");
    c.anim(E.clip, [{ transform: "translateX(-100%)" }, { transform: "none" }], { duration: T, easing: "linear", fill: "none" });
    c.anim(E.clip.firstChild, [{ transform: "translateX(100%)" }, { transform: "none" }], { duration: T, easing: "linear", fill: "none" });
    c.anim(E.head, [{ transform: "translateX(0)", opacity: 1 }, { transform: "translateX(100%)", opacity: 1, offset: .97 }, { transform: "translateX(100%)", opacity: 0 }], { duration: T, easing: "linear", fill: "none" });
    c.anim(E.clock, [{ transform: "translateY(0)" }, { transform: "translateY(-" + (n.len / (n.len + 1) * 100) + "%)" }], { duration: T, easing: "steps(" + n.len + ", end)", fill: "none" });
    E.ph.forEach(function (p, i) { c.anim(p, [{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: i ? T * n.end[i - 1] : 0, easing: "ease-out", fill: "backwards" }); });
    after(c, T, function () { li.classList.remove("play"); });
  }
  function match(c, i) { if (st.shown > i) return; st.shown = i + 1; paint({ tick: true }); land(c, E.lines[i]); }
  function ask(c) { if (st.asked) return; st.asked = true; paint({ tick: true }); land(c, E.ask); }
  // the figures roll to their totals and the footing line follows them; then the checker's mark
  function foot(c) {
    if (st.footed) return;
    st.footed = true; paint({ tick: true });
    if (!RH.motionOff()) c.anim(E.math, [{ opacity: 0 }, { opacity: 1 }], { duration: 280, delay: 380, easing: "ease-out", fill: "backwards" });
  }
  function check() { if (st.checked || !st.footed) return; st.checked = true; paint(); }

  /* ---------- the owner's moves (the You cursor in the demo, the visitor after hand-off) ---------- */
  function answer(c, k) {
    if (st.approved || !st.asked) return;
    var first = !opt();
    st.ans = k; paint({ tick: true }); recheck(c);
    // the first answer unlocks Approve: it lands, so the eye goes to it
    if (first && st.checked && !RH.motionOff()) c.anim(E.ok, [{ transform: "scale(.94)" }, { transform: "none" }], { duration: 340, easing: LAND, fill: "none" });
  }
  function approve() { if (!st.checked || !opt()) return false; st.approved = true; paint(); return true; }
  function total() { return (opt() || !st.asked ? "Total " : "Total so far ") + usd(calc().total) + "."; }

  function settle() { gen++; done(); paint(); if (E.note) E.note.classList.remove("play"); }
  function ensure() { if (player && !CX.handedOff()) player.handoff(); }
  function pick(c, k) {
    var n = NOTES[k];
    fresh(k); build();
    c.view("note");
    if (RH.motionOff()) { done(); paint(); c.view("quote"); }
    else {
      // the short replay: each line lands as its phrase is heard, then the question and the math
      hear(c, T_AGAIN);
      n.lines.forEach(function (l, i) { after(c, T_AGAIN * n.end[n.from[i]], function () { match(c, i); }); });
      after(c, T_AGAIN + 160, function () { ask(c); });
      after(c, T_AGAIN + 520, function () { foot(c); });
      after(c, T_AGAIN + 1140, check);
      after(c, T_AGAIN + 700, function () { c.view("quote"); });
    }
    var b = E.note.firstChild; if (b) b.focus({ preventScroll: true });
    c.say("Drafted from the " + n.name + " note: " + n.lines.length + " lines priced from your sheet and 1 question for you. " + n.q.t);
  }
  function nudge(c, b) {
    if (st.approved) return;
    var i = +b.getAttribute("data-i"), d = +b.getAttribute("data-d"), l = NOTES[st.note].lines[i], k = l[0], v = st.qty[k] + d * l[2];
    if (v < l[3] || v > l[4]) { c.say(units(k, st.qty[k]) + " is the " + (d < 0 ? "lowest" : "highest") + " this prototype goes."); return; }
    st.qty[k] = v; paint({ tick: true }); recheck(c);
    if (!RH.motionOff()) c.anim(E.lines[i].querySelector(".ql-v"), [{ transform: "scale(1.16)" }, { transform: "none" }], { duration: 260, easing: LAND, fill: "none" });
    c.say(P[k].name + ": " + units(k, v) + ", " + usd(v * P[k].c) + ". " + total());
  }

  /* ---------- the script. Line beats are timed to the phrase each one came from. ---------- */
  var FIRST = NOTES.fence, steps = [{ d: 500, run: function (c) { hear(c, T_PLAY); } }], last = 0;
  FIRST.lines.forEach(function (l, i) {
    var t = T_PLAY * FIRST.end[FIRST.from[i]] + 150;
    steps.push({ d: Math.round(t - last), run: function (c) { match(c, i); c.cursor("rh", E.row[l[0]], { fx: .6 }); } });
    last = t;
  });
  steps.push(
    { d: Math.round(T_PLAY + 300 - last), run: function (c) { c.view("quote"); ask(c); c.cursor("rh", E.ask, { fx: .55, fy: .3 }); } },
    { d: 1000, run: function (c) {
      foot(c); c.cursor("rh", E.box, { fx: -.1, fy: .95 });
      after(c, 640, check);
      after(c, 1150, function () { c.hideCursors(); c.cursor("you", E.chips[0], { fy: .85 }); });
    } },
    { d: 2100, run: function (c) {
      c.press("you"); answer(c, NOTES[st.note].q.opts[0].k);
      after(c, 750, function () { c.cursor("you", E.ok, { fx: .6, fy: .85 }); });
    } },
    { d: 1750, run: function (c) {
      c.press("you"); approve();
      c.say("Approved. Quote ready to send (sample). " + total(), { force: true });
      after(c, 1000, function () { c.hideCursors(); });
    } }
  );

  stage.innerHTML = '<div class="qt dark"></div>';
  E.w = stage.firstChild;
  player = RH.demo({
    root: root, title: "Voice note to quote · Ridgeline Fence & Deck", loops: 1, steps: steps,
    views: [{ k: "note", label: "Voice note" }, { k: "quote", label: "Quote" }, { k: "sheet", label: "Price sheet" }],
    reset: function (c) { CX = c; fresh("fence"); build(); paint(); c.hideCursors(); },
    finalState: function (c) {
      CX = c;
      if (st.note !== "fence") { fresh("fence"); build(); }
      gen++; done(); st.ans = "walk"; st.approved = true; paint();
      E.note.classList.remove("play");
    },
    // a mid-play hand-off finishes Right Hand's draft; the owner's answer and approval stay as they are
    onHandoff: function (c) { CX = c; settle(); }
  });
  CX = player.ctx;

  stage.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("button") : null, c = CX;
    if (!b || !E.w.contains(b) || b.disabled) return;
    ensure();
    if (b.hasAttribute("data-note")) pick(c, b.getAttribute("data-note"));
    else if (b.hasAttribute("data-d")) nudge(c, b);
    else if (b.hasAttribute("data-o")) {
      if (st.approved) return;
      var o, k = b.getAttribute("data-o");
      answer(c, k); o = opt();
      c.say((o.p ? P[o.p].name + " added, " + usd(calc().q) + ". " : o.done + ": " + o.amt.toLowerCase() + ". No price added. ") + total() + " Ready for your approval.");
    }
    // Approve and Make a change take each other's place, so the second click of a double-click must not undo the first
    else if (b === E.ok) {
      if (e.timeStamp - swapAt < 500 || !approve()) return;
      swapAt = e.timeStamp;
      E.edit.focus({ preventScroll: true });
      c.say("Approved. Quote ready to send (sample). " + total() + " Prototype only, nothing leaves this page.");
    }
    else if (b === E.edit) {
      if (e.timeStamp - swapAt < 500) return;
      swapAt = e.timeStamp;
      st.approved = false; paint();
      E.ok.focus({ preventScroll: true });
      c.say("Reopened. Nothing is sent until you approve again.");
    }
  });
  // a held Enter key would otherwise approve and reopen in turn
  stage.addEventListener("keydown", function (e) { if (e.repeat && (e.key === "Enter" || e.key === " ") && (e.target === E.ok || e.target === E.edit)) e.preventDefault(); });
  // the Pause motion switch: whatever is mid-flight (a note playing, a line landing) goes straight to its end state
  document.addEventListener("rh:motion", function (e) {
    if (!e.detail || !e.detail.off || !E.w.getAnimations) return;
    E.w.getAnimations({ subtree: true }).forEach(function (a) { try { a.finish(); } catch (x) {} });
  });
  // trace: pointing at a line (or tabbing into it) lights the words it came from and the row its price came from, and
  // the other way round. Each move clears the last one first, so nothing stays lit after the quote changes under it.
  function trace(t) {
    Array.prototype.forEach.call(E.w.querySelectorAll(".hl"), function (n) { n.classList.remove("hl"); });
    var a = document.activeElement;
    // nothing under the pointer: fall back to the control a keyboard user is on (not one a mouse click left focused)
    try { if (!t && a && E.w.contains(a) && a.matches(":focus-visible")) t = a; } catch (e) {}
    t = t && t.closest ? t.closest("[data-l],[data-p]") : null;
    if (!t || !E.w.contains(t)) return;
    var k = t.getAttribute("data-l") || t.getAttribute("data-p"), o = opt(), q = NOTES[st.note].q;
    // the question's rows on the sheet: both candidates while it is open, then only the one the owner picked
    var qk = o ? (o.p ? [o.p] : []) : q.cand;
    if (qk.indexOf(k) >= 0) k = "q";
    Array.prototype.forEach.call(E.w.querySelectorAll('[data-l="' + k + '"]' + (k === "q" ? qk : [k]).map(function (x) { return ',[data-p="' + x + '"]'; }).join("")), function (n) { n.classList.add("hl"); });
  }
  stage.addEventListener("mouseover", function (e) { trace(e.target); });
  stage.addEventListener("mouseout", function () { trace(null); });
  stage.addEventListener("focusin", function (e) { trace(e.target); });
  stage.addEventListener("focusout", function () { trace(null); });
})();
