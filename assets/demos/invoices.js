/* Right Hand NWA: demo 04, invoice follow-ups.
   Pinyon Hollow Landscapes is a made-up crew in Bella Vista. One sample invoice, followed from Day 0 to Day 46.
   Right Hand drafts each step and watches the bank feed. The owner approves anything that goes out.
   Built on the shared player (assets/demo-player.js, RH.demo). Classic script, no build step. */
(function () {
  "use strict";
  var root = document.getElementById("demo-invoices");
  if (!root || !window.RH || !RH.demo) return;
  var stage = root.querySelector(".stage");
  if (!stage) return;

  var money = RH.util.money;
  var MAX = 46, PER = 160, EASE = "cubic-bezier(.23,1,.32,1)";
  // --ease-land as a WAAPI easing, with a fallback for engines that lack linear()
  var LAND = (function () {
    var s = "linear(0,.13 6%,.45 13%,.78 20%,.97 27%,1.04 34%,1.05 40%,1.03 48%,1.005 60%,.998 75%,1)";
    try { document.createElement("i").animate([{ opacity: 1 }, { opacity: 1 }], { duration: 1, easing: s }).cancel(); return s; }
    catch (e) { return "cubic-bezier(.34,1.45,.64,1)"; }
  })();

  /* ---------- calendar: Oct 1, 2026 is a Thursday ---------- */
  var WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  function md(d) { return d <= 30 ? "Oct " + (d + 1) : "Nov " + (d - 30); }
  function wmd(d) { return WD[(4 + d) % 7] + " " + md(d); }
  function pct(d) { return Math.round(d / MAX * 1e5) / 1e3; }

  /* ---------- decorative icons ---------- */
  var IC = {
    sent: '<path d="M3.5 11.5L20 4l-6.5 16.5-2.5-6.5z"/>',
    due: '<path d="M6 21V4h11l-2.5 4L17 12H6"/>',
    mail: '<path d="M3.5 6.5h17v11h-17zM4 7.5l8 6 8-6"/>',
    doc: '<path d="M6.5 3.5h8l3 3v14h-11zM9.5 11h5M9.5 14.5h5M9.5 18h3"/>',
    reply: '<path d="M4.5 5.5h15v10h-9l-4.5 4v-4h-1.5z"/>',
    cash: '<path d="M12 3.5v17M16 7.5h-5.5a2.5 2.5 0 000 5h3a2.5 2.5 0 010 5H8"/>',
    paid: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    ask: '<path d="M9 9.5a3 3 0 116 0c0 2-3 2.5-3 5M12 18.5v.5"/>',
    clip: '<path d="M15.5 7.5l-6 6a2 2 0 002.8 2.8l6.4-6.4a4 4 0 00-5.7-5.7L6.6 10.6a6 6 0 008.5 8.5l5.4-5.4"/>'
  };
  function ico(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + IC[k] + "</svg>"; }

  /* ---------- the sample sequence ---------- */
  // gate = the owner approves it, rem = a reminder (opens the letter), auto = the You cursor approves it in autoplay
  var E = {
    e0: { d: 0, ic: "sent", t: "Invoice sent" },
    e15: { d: 15, ic: "due", t: "Due, no payment" },
    e18: { d: 18, ic: "mail", t: "Friendly reminder", gate: 1, rem: 1, tone: 1, auto: 1 },
    e25: { d: 25, ic: "mail", t: "Second reminder", gate: 1, rem: 1, tone: 2, auto: 1 },
    e29: { d: 29, ic: "doc", t: "Call script and statement" },
    e33: { d: 33, ic: "reply", t: "Client replied" },
    e36: { d: 36, ic: "cash", t: "$1,000.00 received", gate: 1 },
    e43: { d: 43, ic: "mail", t: "Gentle reminder for $850.00", gate: 1, rem: 1, tone: 1, auto: 1 },
    e46: { d: 46, ic: "paid", t: "Paid in full" },
    e39: { d: 39, ic: "mail", t: "Third reminder", gate: 1, rem: 1, tone: 3 },
    e46n: { d: 46, ic: "ask", t: "You decide the next step" }
  };
  var LIST = { r: ["e0", "e15", "e18", "e25", "e29", "e33", "e36", "e43", "e46"], n: ["e0", "e15", "e18", "e25", "e29", "e39", "e46n"] };
  var SAY = { e0: "invoice sent", e15: "due, no payment yet", e29: "call script and statement ready for you", e33: "client replied, reminders paused", e46: "paid in full, sequence closed", e46n: "you decide the next step" };
  var GT = {
    e0: ["n", "Sent Thu Oct 1. Watching for payment."], e15: ["n", "No payment yet. First reminder Mon Oct 19."],
    e29: ["n", "Ready for you. Nothing sent."], e33: ["b", "Client replied. Reminders paused."], e46: ["g", "Paid in full. Sequence closed."]
  };
  var TONES = ["Friendly", "Clear", "Firm"];
  var AGE = { c: "Current", w: "1 to 30 days late", x: "31 to 60 days late", g: "Paid" };
  var PICK = {
    call: ["a call", "The 3-line script from Oct 30 is ready with the latest numbers. You make the call.", "A call"],
    plan: ["a payment plan", "Right Hand drafts a two-payment plan for you to review. Nothing goes out until you OK it.", "A payment plan"],
    claims: ["small claims", "Right Hand gathers the invoice, the three reminders and the dates in one file. Whether to file is your call.", "Small claims"]
  };
  // drafts: {key|text} marks a figure that links to its note in the letter view
  var DR = {
    e18: {
      t: "Friendly reminder", sub: "Invoice 1048, fall leaf cleanup",
      body: "Hi, a quick note that invoice {inv|1048} for the fall leaf cleanup ({amt|$1,850.00}) was due {due|Oct 16}. If it is already on its way, thank you and please ignore this.",
      notes: [["inv", "From invoice 1048, sent Thu Oct 1 on net 15 terms."], ["amt", "The full invoice. No payment has come in."], ["due", "Due Fri Oct 16. Mon Oct 19 is 3 days past due."], ["", "Tone: Friendly. Your pick for a first reminder."], ["", "No late fee line. That stays your call."]]
    },
    e25: {
      t: "Second reminder, invoice attached", sub: "Invoice 1048: $1,850.00 past due, copy attached",
      body: "Hi, following up on invoice {inv|1048} for the fall leaf cleanup. The {amt|$1,850.00} balance was due {due|Oct 16}, and a copy is {att|attached}. Could you let me know when to expect payment?",
      notes: [["inv", "From invoice 1048, sent Thu Oct 1 on net 15 terms."], ["amt", "Nothing paid yet, so the full amount is open."], ["due", "Due Fri Oct 16. Mon Oct 26 is 10 days past due."], ["att", "invoice-1048.pdf, the same file sent Oct 1."], ["", "Tone: Clear. One step more direct than the first note."]]
    },
    e39: {
      t: "Third reminder, firm and polite", sub: "Invoice 1048: $1,850.00, 24 days past due",
      body: "Hi, invoice {inv|1048} for the fall leaf cleanup ({amt|$1,850.00}) is now {due|24 days} past due, and I have not heard back. Please reply with a payment date by Fri Nov 13. If something on the invoice looks wrong, tell me and I will fix it.",
      notes: [["inv", "From invoice 1048, sent Thu Oct 1 on net 15 terms."], ["amt", "Still the full amount. Nothing paid."], ["due", "Due Fri Oct 16. Mon Nov 9 is 24 days later."], ["", "Tone: Firm, still polite. No threats and no fees. Those stay with you."]]
    },
    e43: {
      t: "Gentle reminder for $850.00", sub: "Invoice 1048: $850.00 balance due Nov 16",
      body: "Hi, thanks again for the {pay|$1,000.00} on Nov 6. A gentle reminder that the {math|$850.00} balance on invoice {inv|1048} is due {due|Mon Nov 16}.",
      notes: [["pay", "Matched in the bank feed on Fri Nov 6."], ["math", "$1,850.00 minus $1,000.00 = $850.00."], ["inv", "Invoice 1048, $1,850.00, sent Thu Oct 1."], ["due", "The date the client gave in their Nov 3 reply."], ["", "Tone: Friendly. They answered and paid part, so it stays light."]]
    }
  };
  function plain(s) { return s.replace(/\{\w+\|([^}]+)\}/g, "$1"); }
  function figs(s) {
    return s.replace(/\{(\w+)\|([^}]+)\}/g, function (m, k, t) { return '<span class="iv-fig" data-src="' + k + '" tabindex="0" aria-describedby="dinv-n-' + k + '">' + t + "</span>"; });
  }

  /* ---------- state ---------- */
  var S = { day: 0, go: false, reply: true, ok: {}, letter: null, pick: null, bal: 1850, key: "", built: "", chart: null, gen: 0 };
  var C = null, api = null, sayT = 0;
  function br() { return S.reply ? "r" : "n"; }
  function cur() {
    if (!S.go) return null;
    var l = LIST[br()], c = null;
    for (var i = 0; i < l.length; i++) if (E[l[i]].d <= S.day) c = l[i];
    return c;
  }
  function balAt(d) { return !S.reply ? 1850 : d >= 46 ? 0 : d >= 36 ? 850 : 1850; }
  function ageKey(d) { if (balAt(d) === 0) return "g"; var late = d - 15; return late <= 0 ? "c" : late <= 30 ? "w" : "x"; }
  function phrase(id) {
    var ok = !!S.ok[id];
    if (id === "e36") return "$1,000.00 received, thank-you " + (ok ? "sent" : "drafted");
    if (E[id].rem) return E[id].t.toLowerCase() + (ok ? " sent" : " waiting for your OK");
    return SAY[id];
  }
  function summary(d) {
    var id = cur(), e = id && E[id];
    if (e && e.d === d) return "Day " + d + ", " + md(d) + ": " + phrase(id) + ".";
    return "Day " + d + ", " + md(d) + ": " + money(balAt(d)) + " open, " + AGE[ageKey(d)].toLowerCase() + ".";
  }

  /* ---------- stage markup (built once; the player adds its cursors after this) ---------- */
  var ticks = "";
  for (var i = 0; i <= MAX; i++) ticks += "M" + i * 10 + " 10v" + ((4 + i) % 7 === 1 ? 6 : 3);
  stage.innerHTML =
    '<div class="iv">' +
      '<div class="iv-tl paper">' +
        '<div class="iv-top">' +
          '<div class="iv-id"><h4 id="dinv-h">Invoice 1048 <span class="iv-tag">Sample</span></h4><p>Fall leaf cleanup. $1,850.00, net 15.</p></div>' +
          '<dl class="iv-read"><div><dt>Date</dt><dd class="iv-day"></dd></div><div><dt>Balance</dt><dd class="iv-bal"></dd></div><div class="sr-only"><dt>Aging</dt><dd class="iv-agetx"></dd></div></dl>' +
        "</div>" +
        '<div class="iv-plot"><div class="iv-x">' +
          '<ol class="events" aria-label="Follow-ups on invoice 1048, Day 0 to Day 46"></ol>' +
          '<svg class="iv-trk" viewBox="0 0 460 20" preserveAspectRatio="none" aria-hidden="true"><path class="b" d="M0 10H460"/><path class="t" d="' + ticks + '"/></svg>' +
          '<ul class="iv-dates" aria-hidden="true"><li style="left:0%">Oct 1</li><li style="left:' + pct(15) + '%">Oct 16</li><li style="left:' + pct(31) + '%">Nov 1</li><li style="left:100%">Nov 16</li></ul>' +
          '<div class="iv-ylab" aria-hidden="true"><span class="y0">$1,850</span><span class="y1">$850</span><span class="y2">$0</span></div>' +
          '<div class="iv-chart"><svg viewBox="0 0 460 100" preserveAspectRatio="none" role="img">' +
            '<path class="a r" d="M0 6H360V56.8H460V100H0Z"/><path class="l r" d="M0 6H360V56.8H460V100"/>' +
            '<path class="a n" d="M0 6H460V100H0Z"/><path class="l n" d="M0 6H460"/></svg></div>' +
          '<div class="iv-ph" aria-hidden="true"><i class="iv-cov"></i><i class="iv-ln"></i><i class="iv-hd"></i><span class="iv-age"></span></div>' +
        "</div>" +
        '<table class="sr-only"><caption>Balance by date, sample invoice 1048</caption><thead><tr><th scope="col">Dates</th><th scope="col">Balance</th></tr></thead><tbody></tbody></table></div>' +
        '<div class="iv-ctl">' +
          '<div class="iv-rng"><label for="dinv-r">Day</label><input type="range" id="dinv-r" min="0" max="46" step="1" value="0" aria-describedby="dinv-hint"></div>' +
          '<div class="iv-row"><button type="button" class="iv-sw" role="switch" aria-checked="true"><span class="iv-sw-t" aria-hidden="true"><i></i></span>Client replies on Day 33</button>' +
          '<p class="iv-hint" id="dinv-hint">PageUp and PageDown jump 7 days.</p></div>' +
        "</div>" +
      "</div>" +
      '<div class="iv-pane paper"><div class="iv-card"></div>' +
        '<div class="iv-gate n"><p class="iv-gs" tabindex="-1"><i aria-hidden="true"></i><span></span></p>' +
        '<button type="button" class="btn sm iv-ok off" data-act="ok">Approve<span class="sr-only"></span></button></div>' +
      "</div>" +
    "</div>";

  function $(s) { return stage.querySelector(s); }
  var tl = $(".iv-tl"), olEl = $(".events"), ph = $(".iv-ph"), age = $(".iv-age"), dayEl = $(".iv-day"), balEl = $(".iv-bal"), agetx = $(".iv-agetx"),
    chartSvg = $(".iv-chart svg"), tb = $("tbody"), rng = $("#dinv-r"), sw = $(".iv-sw"), cardEl = $(".iv-card"), gateEl = $(".iv-gate"),
    gs = $(".iv-gs"), gsText = $(".iv-gs span"), okBtn = $(".iv-ok"), okSr = $(".iv-ok .sr-only");

  /* ---------- painting ---------- */
  function buildNodes() {
    var b = br();
    if (S.built === b) return;
    S.built = b;
    olEl.innerHTML = LIST[b].map(function (k, n) {
      var e = E[k];
      return '<li class="ev r' + (n % 2) + '" data-id="' + k + '" style="left:' + pct(e.d) + '%"><button type="button" class="ev-b">' + ico(e.ic) +
        '<span class="ev-n" aria-hidden="true">' + e.d + '</span><span class="sr-only">Day ' + e.d + ", " + wmd(e.d) + ": " + e.t + '.<span class="ev-s"></span></span></button>' +
        '<i class="dot" aria-hidden="true"></i>' + (e.gate ? '<i class="post" aria-hidden="true"></i>' : "") + "</li>";
    }).join("");
  }
  function setChart() {
    if (S.chart === S.reply) return;
    S.chart = S.reply;
    tl.classList.toggle("nr", !S.reply);
    chartSvg.setAttribute("aria-label", S.reply ? "Balance chart. $1,850.00 from Oct 1, $850.00 from Nov 6, $0.00 on Nov 16." : "Balance chart. $1,850.00 from Oct 1 through Nov 16. Nothing paid.");
    tb.innerHTML = (S.reply ? [["Oct 1 to Nov 5", 1850], ["Nov 6 to Nov 15", 850], ["Nov 16", 0]] : [["Oct 1 to Nov 16", 1850]])
      .map(function (r) { return "<tr><td>" + r[0] + "</td><td>" + money(r[1]) + "</td></tr>"; }).join("");
  }
  function setAge(d, fd) {
    var k = ageKey(d);
    age.textContent = AGE[k]; agetx.textContent = AGE[k];
    age.className = "iv-age " + k + (fd > 23 ? " flip" : "");
  }
  function tick(from, to) {
    var g = ++S.gen;
    if (RH.motionOff() || !window.requestAnimationFrame) { balEl.textContent = money(to); return; }
    var t0 = performance.now();
    requestAnimationFrame(function f(t) {
      if (g !== S.gen) return;
      var k = Math.min(1, Math.max(0, (t - t0) / 900)), e = 1 - Math.pow(1 - k, 3);
      balEl.textContent = money(Math.round(from + (to - from) * e));
      if (k < 1) requestAnimationFrame(f);
    });
  }
  function gate(id) {
    if (!id) return ["n", "Each reminder waits for your OK.", 0];
    var e = E[id], h = C && C.handedOff();
    if (e.gate) {
      if (S.ok[id]) return ["y", id === "e36" ? "Thank-you approved. Sent " + wmd(36) + "." : "Approved by you. Sent " + wmd(e.d) + ".", 0];
      return ["w", id === "e36" ? "Thank-you drafted. Needs your OK." : "Needs your OK. Not sent yet.", h || e.auto ? 1 : 0];
    }
    if (id === "e46n") return S.pick ? ["y", "Your pick: " + PICK[S.pick][0] + ".", 0] : ["w", "Your call. Pick a next step.", 0];
    return [GT[id][0], GT[id][1], 0];
  }
  function paintGate(id) {
    var g = gate(id);
    gateEl.className = "iv-gate " + g[0];
    gsText.textContent = g[1];
    okBtn.classList.toggle("off", !g[2]);
    okSr.textContent = id && E[id].gate ? " the " + (id === "e36" ? "thank-you" : E[id].t.toLowerCase()) : "";
  }

  function head(d, t) { return '<p class="iv-when">Day ' + d + " · " + wmd(d) + '</p><h4 class="iv-t">' + t + "</h4>"; }
  function stm(rows) { return '<dl class="iv-stm">' + rows.map(function (r) { return "<div><dt>" + r[0] + "</dt><dd>" + r[1] + "</dd></div>"; }).join("") + "</dl>"; }
  function quote(s) { return '<blockquote class="iv-q"><p>' + s + '</p><p class="iv-sig">Pinyon Hollow Landscapes</p></blockquote>'; }
  function tone(n) {
    return '<div class="iv-tone"><span class="sr-only">Tone: ' + TONES[n - 1] + '.</span><span class="iv-tone-l" aria-hidden="true">Tone</span><ol aria-hidden="true">' +
      TONES.map(function (t, k) { return '<li class="' + (k < n ? "f" : "") + (k === n - 1 ? " on" : "") + '">' + t + "</li>"; }).join("") + "</ol></div>";
  }
  var MATH = '<p class="iv-math">$1,850.00 minus $1,000.00 = <b>$850.00</b> left</p>';
  function cardHTML(id) {
    if (!id) return '<p class="iv-when">Sample invoice</p><h4 class="iv-t">Invoice 1048, from sent to paid</h4><p>46 days of follow-ups on one invoice. Right Hand drafts each step and watches for the payment. You approve anything that goes out.</p>';
    var e = E[id], d = e.d;
    if (id === "e0") return head(d, "Invoice 1048 sent") + '<dl class="iv-dl"><div><dt>To</dt><dd>Property manager (sample client)</dd></div><div><dt>Work</dt><dd>Fall leaf cleanup</dd></div><div><dt>Amount</dt><dd class="m">$1,850.00</dd></div><div><dt>Terms</dt><dd>Net 15, due Fri Oct 16</dd></div></dl>';
    if (id === "e15") return head(d, "Due today. No payment yet.") + "<p>Nothing in the bank feed matches invoice 1048.</p><p>A friendly reminder comes to you Mon Oct 19. Nothing goes out without your OK.</p>";
    if (id === "e29") return head(d, "Call script and statement, for you") + '<p class="iv-lbl">Call script, 3 lines</p><ol class="iv-script"><li>Hi, this is Pinyon Hollow about invoice 1048.</li><li>The $1,850.00 was due Oct 16. Did it reach you?</li><li>What payment date works for you?</li></ol>' +
      '<p class="iv-lbl">Statement draft</p>' + stm([["Billed Oct 1", "$1,850.00"], ["Paid", "$0.00"], ["Balance", "$1,850.00"]]);
    if (id === "e33") return head(d, "Client replied") + '<figure class="iv-reply"><blockquote><p>Sorry, paying $1,000 Friday, rest by the 16th.</p></blockquote><figcaption>Property manager (sample), Tue Nov 3</figcaption></figure>' +
      "<p>Reminders paused on their own. They pick back up only if the Friday payment does not show.</p>";
    if (id === "e36") return head(d, "$1,000.00 received") + "<p>Matched to invoice 1048 in the bank feed.</p>" + MATH + '<p class="iv-lbl">Thank-you draft</p>' +
      quote("Thanks for the $1,000.00 today. The $850.00 balance is due Mon Nov 16, like you said.");
    if (id === "e46") return head(d, "Paid in full") + "<p>$850.00 arrived Mon Nov 16. Invoice 1048 is closed, and its reminders stop.</p>" +
      stm([["Billed", "$1,850.00"], ["Paid", "$1,850.00"], ["Balance", "$0.00"]]) + '<p class="iv-fee"><b>Late fee:</b> your call. Not added.</p>';
    if (id === "e46n") return head(d, "You decide the next step") + "<p>Three reminders, no reply, no payment. $1,850.00 is 31 days past due.</p>" +
      '<p class="iv-lbl" id="dinv-pk">Pick one</p><div class="iv-picks" role="group" aria-labelledby="dinv-pk">' +
      ["call", "plan", "claims"].map(function (v) { return '<button type="button" class="chip" data-act="pick" data-v="' + v + '" data-f="pk-' + v + '" aria-pressed="' + (S.pick === v) + '">' + PICK[v][2] + "</button>"; }).join("") +
      "</div>" + (S.pick ? '<p class="iv-pr">' + PICK[S.pick][1] + "</p>" : "") + '<p class="iv-fee">We never threaten or add fees on our own.</p>';
    var r = DR[id];
    return head(d, r.t) + tone(e.tone) + quote(plain(r.body)) +
      (id === "e25" ? '<p class="iv-att">' + ico("clip") + "invoice-1048.pdf attached</p>" : "") + (id === "e43" ? MATH : "") +
      '<button type="button" class="btn ghost sm iv-open" data-act="open" data-id="' + id + '" data-f="open">Open the draft with notes</button>';
  }
  function letterHTML(id) {
    var r = DR[id];
    return '<div class="iv-letter"><h4 class="iv-lt" tabindex="-1">Pinyon Hollow Landscapes <span>Made-up business · Draft for ' + wmd(E[id].d) + "</span></h4>" +
      '<dl class="iv-meta"><div><dt>To</dt><dd>billing@example.com (sample client)</dd></div><div><dt>Subject</dt><dd>' + r.sub + "</dd></div></dl>" +
      '<div class="iv-body"><p>' + figs(r.body) + '</p><p class="iv-sig">Pinyon Hollow Landscapes</p></div>' +
      '<p class="iv-lbl" id="dinv-nl">Notes on this draft</p><ul class="iv-notes" aria-labelledby="dinv-nl">' +
      r.notes.map(function (n) { return n[0] ? '<li data-src="' + n[0] + '" id="dinv-n-' + n[0] + '">' + n[1] + "</li>" : "<li>" + n[1] + "</li>"; }).join("") +
      '</ul><button type="button" class="btn ghost sm iv-back" data-act="back" data-f="back">Back to the timeline</button></div>';
  }
  function card(id, slide) {
    var lt = !!(id && S.letter === id);
    var key = (id || "intro") + (lt ? ":L" : ":") + (id === "e46n" ? S.pick : "");
    if (key === S.key) return;
    var moved = S.key.split(":")[0] !== (id || "intro") || (S.key.indexOf(":L") > 0) !== lt;
    var a = document.activeElement, fk = a && cardEl.contains(a) ? a.getAttribute("data-f") : null;
    S.key = key;
    cardEl.innerHTML = lt ? letterHTML(id) : cardHTML(id);
    cardEl.scrollTop = 0;
    if (fk) { var f = cardEl.querySelector('[data-f="' + fk + '"]'); if (f) f.focus({ preventScroll: true }); }
    if (slide && moved && C) C.anim(cardEl, [{ transform: "translateX(12px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 280, easing: EASE, fill: "none" });
  }

  // paint the whole frame for S.day (no motion except the optional card slide and balance tick)
  function paint(o) {
    o = o || {};
    buildNodes(); setChart();
    var d = S.day, id = cur(), bal = balAt(d);
    if (S.letter && S.letter !== id) S.letter = null;
    ph.style.transform = "translateX(" + pct(d) + "%)";
    Array.prototype.forEach.call(olEl.children, function (li) {
      var k = li.getAttribute("data-id"), e = E[k], on = S.go && e.d <= d, g = on && !!e.gate, b = li.firstChild;
      li.classList.toggle("on", on);
      li.classList.toggle("ok", g && !!S.ok[k]);
      li.classList.toggle("wait", g && !S.ok[k]);
      if (k === id) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
      li.querySelector(".ev-s").textContent = g ? (S.ok[k] ? " Approved by you." : " Needs your OK.") : "";
    });
    dayEl.textContent = "Day " + d + ", " + wmd(d);
    if (o.tick && bal !== S.bal) tick(S.bal, bal);
    else if (o.force || bal !== S.bal) { S.gen++; balEl.textContent = money(bal); }
    S.bal = bal;
    setAge(d, d);
    rng.value = String(d);
    rng.setAttribute("aria-valuetext", summary(d));
    sw.setAttribute("aria-checked", String(S.reply));
    card(id, o.slide);
    paintGate(id);
  }

  function nodeLi(id) { return olEl.querySelector('[data-id="' + id + '"]'); }
  function pop(ctx, id) {
    var li = nodeLi(id);
    if (!li || !ctx) return;
    ctx.anim(li.querySelector(".dot"), [{ transform: "scale(.2)" }, { transform: "scale(1)" }], { duration: 240, easing: LAND, fill: "none" });
    ctx.anim(li.firstChild, [{ transform: "translateX(-50%) scale(.84)" }, { transform: "translateX(-50%) scale(1)" }], { duration: 240, easing: LAND, fill: "none" });
  }
  function approve(id, ctx) {
    S.ok[id] = true;
    paint({});
    var li = nodeLi(id);
    if (li && ctx) ctx.anim(li.querySelector(".post"), [{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], { duration: 240, easing: LAND, fill: "none" });
  }

  /* ---------- autoplay beats: the playhead travels 160ms per day and stops at each event ---------- */
  function travel(a, b, fx) {
    return function (ctx) {
      var shown = RH.motionOff() ? b : a, to = "translateX(" + pct(b) + "%)";
      S.day = b;
      dayEl.textContent = "Day " + shown + ", " + wmd(shown);
      setAge(shown, b);
      rng.value = String(shown);
      rng.setAttribute("aria-valuetext", "Day " + shown + ", " + md(shown) + ".");
      ph.style.transform = to;
      ctx.anim(ph, [{ transform: "translateX(" + pct(a) + "%)" }, { transform: to }], { duration: (b - a) * PER, easing: "linear", fill: "none" });
      if (fx) fx(ctx);
    };
  }
  function arrive(id, fx) {
    return function (ctx) {
      S.go = true; S.day = E[id].d;
      paint({ slide: true, tick: true });
      pop(ctx, id);
      if (fx) fx(ctx);
    };
  }
  function press(id) { return function (ctx) { ctx.press("you"); approve(id, ctx); }; }
  function toOk(ctx) { ctx.cursor("you", okBtn, { fx: .5, fy: .62 }); }
  function rest(ctx) { ctx.cursor("you", cardEl, { fx: .2, fy: .78 }); }

  var steps = [
    { d: 500, run: arrive("e0") },
    { d: 700, run: travel(0, 15) },
    { d: 15 * PER, run: arrive("e15") },
    { d: 700, run: travel(15, 16, toOk) },
    { d: PER, run: travel(16, 18) },
    { d: 2 * PER, run: arrive("e18") },
    { d: 450, run: press("e18") },
    { d: 350, run: travel(18, 21, rest) },
    { d: 3 * PER, run: travel(21, 25, toOk) },
    { d: 4 * PER, run: arrive("e25") },
    { d: 450, run: press("e25") },
    { d: 350, run: travel(25, 29, rest) },
    { d: 4 * PER, run: arrive("e29", function (ctx) { ctx.cursor("rh", ctx.q(".iv-script"), { fx: .8, fy: .2 }); }) },
    { d: 700, run: travel(29, 33) },
    { d: 4 * PER, run: arrive("e33", function (ctx) { ctx.cursor("rh", gs, { fx: .6, fy: .5 }); }) },
    { d: 700, run: travel(33, 36) },
    { d: 3 * PER, run: arrive("e36", function (ctx) { ctx.cursor("rh", balEl, { fx: .7, fy: .9 }); }) },
    { d: 700, run: travel(36, 39) },
    { d: 3 * PER, run: travel(39, 43, toOk) },
    { d: 4 * PER, run: arrive("e43") },
    { d: 450, run: press("e43") },
    { d: 350, run: travel(43, 46, rest) },
    { d: 3 * PER, run: arrive("e46") }
  ];

  function reset(ctx) {
    C = ctx;
    clearTimeout(sayT);
    ctx.hideCursors();
    S.day = 0; S.go = false; S.reply = true; S.ok = {}; S.letter = null; S.pick = null; S.key = "";
    paint({ force: true });
  }
  function finalState(ctx) {
    C = ctx;
    S.day = MAX; S.go = true; S.reply = true; S.ok = { e18: true, e25: true, e43: true }; S.letter = null; S.pick = null;
    paint({ force: true });
  }
  function onHandoff(ctx) {
    C = ctx;
    S.go = true;
    paint({ force: true });
  }

  /* ---------- after hand-off: scrub, jump, approve, open drafts, flip the reply ---------- */
  function ensure() { if (api && C && !C.handedOff()) api.handoff(); }
  function sayLater() { clearTimeout(sayT); sayT = setTimeout(function () { if (C) C.say(summary(S.day)); }, 400); }
  function isEv(d) { return LIST[br()].some(function (k) { return E[k].d === d; }); }
  function scrub(nd) {
    nd = Math.max(0, Math.min(MAX, Math.round(nd)));
    var pd = S.day, pid = cur();
    if (nd === pd && S.go) { rng.value = String(nd); return; }
    S.go = true; S.day = nd;
    paint({ slide: true });
    if (cur() !== pid || isEv(nd)) sayLater();
  }
  function jump(id) {
    var e = E[id];
    if (!e) return;
    ensure();
    S.go = true; S.day = e.d; S.letter = e.rem ? id : null;
    paint({ slide: true });
    pop(C, id);
    C.say(summary(e.d) + (e.rem ? " The draft is open with its notes." : ""));
  }
  function okClick() {
    ensure();
    var id = cur(), e = id && E[id];
    if (!e || !e.gate || S.ok[id]) return;
    approve(id, C);
    gs.focus({ preventScroll: true });
    C.say((id === "e36" ? "Thank-you approved." : "Approved.") + " In this demo, nothing was sent.");
  }
  function openLetter(id) {
    var e = E[id];
    if (!e || !e.rem) return;
    ensure();
    S.go = true; S.day = e.d; S.letter = id;
    paint({ slide: true });
    var h = cardEl.querySelector(".iv-lt");
    if (h) h.focus({ preventScroll: true });
    C.say("Draft open with its notes. Focus a figure to see where it came from.");
  }
  function closeLetter() {
    S.letter = null;
    paint({ slide: true });
    var b = cardEl.querySelector(".iv-open");
    if (b) b.focus({ preventScroll: true });
  }
  function pick(v) {
    if (!PICK[v]) return;
    ensure();
    S.pick = v;
    paint({});
    C.say(PICK[v][1]);
  }
  function toggle() {
    ensure();
    S.reply = !S.reply;
    paint({ slide: true });
    C.say(S.reply ? "Client replies on Day 33 is on. They pay $1,000.00 on Nov 6 and the rest on Nov 16." : "Client replies on Day 33 is off. A firm third reminder comes to you on Day 39, and on Day 46 you decide the next step.");
  }

  stage.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("button") : null;
    if (!b) return;
    if (b.classList.contains("ev-b")) { jump(b.parentNode.getAttribute("data-id")); return; }
    if (b === sw) { toggle(); return; }
    var act = b.getAttribute("data-act");
    if (act === "ok") okClick();
    else if (act === "open") openLetter(b.getAttribute("data-id"));
    else if (act === "back") closeLetter();
    else if (act === "pick") pick(b.getAttribute("data-v"));
  });
  rng.addEventListener("input", function () { var v = +rng.value; ensure(); scrub(v); });
  rng.addEventListener("keydown", function (e) {
    if (e.key !== "PageUp" && e.key !== "PageDown") return;
    e.preventDefault();
    ensure();
    scrub(S.day + (e.key === "PageUp" ? 7 : -7));
  });
  // trace: a figure in the letter lights up its note, and the note lights up its figure
  function trace(e, on) {
    var t = e.target.closest ? e.target.closest("[data-src]") : null;
    if (!t || !cardEl.contains(t)) return;
    var k = t.getAttribute("data-src");
    Array.prototype.forEach.call(cardEl.querySelectorAll('[data-src="' + k + '"]'), function (n) { n.classList.toggle("hl", on); });
  }
  cardEl.addEventListener("mouseover", function (e) { trace(e, true); });
  cardEl.addEventListener("mouseout", function (e) { trace(e, false); });
  cardEl.addEventListener("focusin", function (e) { trace(e, true); });
  cardEl.addEventListener("focusout", function (e) { trace(e, false); });

  api = RH.demo({ root: root, title: "Invoice follow-ups", loops: 1, steps: steps, reset: reset, finalState: finalState, onHandoff: onHandoff });
  if (!C) C = api.ctx;
})();
