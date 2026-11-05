/* Demo 03: receipt to expense review. Ozark Paws Grooming (made-up shop, Springdale).
   Act 1 reads a receipt and matches it to the card charge. Act 2 is the October review sheet: the owner answers
   the open questions and approves. Right Hand only prepares; the You cursor makes every decision. */
(function () {
  "use strict";
  var root = document.getElementById("demo-receipts");
  if (!root || !window.RH || !RH.demo) return;
  var stage = root.querySelector(".stage"), U = RH.util, money = U.money, esc = U.esc;
  var SEPT = 7902.10;
  var RECEIPTS = {
    supply: {
      merchant: "Sample Supply Co.", note: "made-up merchant", order: "Order 4471", date: "Oct 12, 2026", card: "0937",
      items: [["Dog shampoo concentrate, 1 gal", "2 x 44.99", 89.98], ["Nail grinder", "2 x 32.50", 65.00], ["Grooming wipes, 100 ct", "3 x 13.99", 41.97]],
      sub: 196.95, tax: 17.65, total: 214.60, match: 0,
      guess: "Looks like grooming supplies (shampoo, grinders, wipes). Your call.", opts: [["biz", "Business supplies"], ["personal", "Personal"]]
    },
    fuel: {
      merchant: "Corner Fuel Stop", note: "made-up merchant", order: "Pump 4", date: "Oct 12, 2026", card: "0937",
      items: [["Unleaded, 12.7 gal", "12.7 x 3.00", 38.10]], sub: 38.10, tax: 0, total: 38.10, match: 1,
      guess: "Looks like fuel for the grooming van. It would go to Vehicle. Your call.", opts: [["vehicle", "Vehicle"], ["personal", "Personal"]]
    },
    mixed: {
      merchant: "Hilltop Market", note: "made-up merchant", order: "Lane 2", date: "Oct 14, 2026", card: "0937",
      items: [["Paper towels, 6 pk", "2 x 8.49", 16.98], ["Disinfectant spray", "1 x 6.49", 6.49], ["Bananas", "1 x 2.18", 2.18], ["Coffee, 12 oz", "1 x 11.99", 11.99], ["Cereal", "1 x 4.79", 4.79], ["Milk, 1 gal", "1 x 3.89", 3.89], ["Chicken thighs", "1 x 12.46", 12.46]],
      sub: 58.78, tax: 5.49, total: 64.27, match: -1,
      guess: "Looks mixed: 2 lines business, 5 personal. Split it?", opts: [["split", "Split it"], ["personal", "All personal"]]
    }
  };
  var BANK = [["Oct 12", "Online order", 214.60], ["Oct 12", "Fuel", 38.10], ["Oct 13", "Online order", 21.46], ["Oct 14", "Utilities", 96.20]];
  var QS = [
    { k: "online", q: "Online order, Oct 12", amt: 214.60, meta: "Receipt found: Sample Supply Co., order 4471.", opts: [["biz", "Business supplies"], ["personal", "Personal"]] },
    { k: "payapp", q: "Payment app to J. Ruiz, Oct 20", amt: 150, meta: "No memo on the payment. What was it for?", opts: [["contract", "Contract help"], ["personal", "Personal"]] },
    { k: "fee", q: "Card processor fee, Oct 28", amt: 89, meta: "Same amount as the Oct 27 fee. Possible duplicate.", opts: [["keep", "Keep both"], ["dup", "Remove duplicate"]] }
  ];
  var st;
  function fresh() { st = { rec: "supply", ans: {}, approved: false, shown: 0, prevTotal: null }; }

  function cats() {
    var c = [["Payroll", 3650], ["Rent", 2400], ["Grooming supplies", 1126.45], ["Utilities", 412.18], ["Software and fees", 200.14], ["Marketing", 175]];
    var a = st.ans, open = 453.60;
    if (a.online) { open -= 214.60; if (a.online === "biz") c[2][1] += 214.60; }
    if (a.payapp) { open -= 150; if (a.payapp === "contract") { c[0][1] += 150; c[0][0] = "Payroll and contractors"; } }
    if (a.fee) { open -= 89; if (a.fee === "keep") c[4][1] += 89; }
    var sorted = c.reduce(function (s, x) { return s + x[1]; }, 0);
    open = Math.round(open * 100) / 100; sorted = Math.round(sorted * 100) / 100;
    return { c: c, open: open, sorted: sorted, total: Math.round((sorted + open) * 100) / 100 };
  }
  function bare(n) { return money(n).replace("$", ""); }

  function receiptHTML(r) {
    return '<div class="rc-paper" aria-hidden="true"><span class="rc-beam"></span>' +
      '<p class="rc-m bx" style="--i:0">' + esc(r.merchant) + '<small>' + esc(r.note) + '</small></p>' +
      '<p class="rc-meta"><span>' + esc(r.order) + '</span><span class="bx" style="--i:1">' + esc(r.date) + '</span></p>' +
      '<ul class="rc-items bx" style="--i:2">' + r.items.map(function (it) { return '<li><span>' + esc(it[0]) + '<small>' + esc(it[1]) + '</small></span><span>' + bare(it[2]) + '</span></li>'; }).join("") + '</ul>' +
      '<p class="rc-sum"><span>Subtotal</span><span>' + bare(r.sub) + '</span></p>' + (r.tax ? '<p class="rc-sum"><span>Tax (sample)</span><span>' + bare(r.tax) + '</span></p>' : "") +
      '<p class="rc-tot bx" style="--i:3"><span>Total</span><span>' + bare(r.total) + '</span></p>' +
      '<p class="rc-card bx" style="--i:4">Card ending ' + r.card + '</p></div>' +
      '<ol class="sr-only"><li>' + esc(r.merchant) + ' (' + esc(r.note) + '), ' + esc(r.order) + ', ' + esc(r.date) + '</li>' + r.items.map(function (it) { return "<li>" + esc(it[0]) + ", " + esc(it[1]) + " = " + bare(it[2]) + "</li>"; }).join("") + '<li>Subtotal ' + bare(r.sub) + (r.tax ? ", tax " + bare(r.tax) : "") + ', total ' + bare(r.total) + ', card ending ' + r.card + '</li></ol>';
  }
  function build() {
    var r = RECEIPTS[st.rec];
    stage.querySelectorAll(".rc").forEach(function (n) { n.remove(); });
    var w = document.createElement("div"); w.className = "rc";
    w.innerHTML =
      '<figure class="rc-receipt" aria-label="Receipt photo (sample)">' + receiptHTML(r) + '</figure>' +
      '<div class="rc-mid">' +
        '<div class="rc-extract" role="group" aria-label="Read from the receipt"><p class="rc-h">Read from the receipt</p><dl>' +
          '<div><dt>Merchant</dt><dd data-x="m"></dd></div><div><dt>Date</dt><dd data-x="d"></dd></div><div><dt>Items</dt><dd data-x="i"></dd></div><div><dt>Total</dt><dd data-x="t"></dd></div><div><dt>Card</dt><dd data-x="c"></dd></div>' +
          '<div class="rc-math"><dt>Math</dt><dd data-x="math"></dd></div></dl></div>' +
        '<div class="rc-bank"><p class="rc-h">Card charges (sample)</p><ul>' + BANK.map(function (b, i) { return '<li data-b="' + i + '"><span class="mono">' + b[0] + '</span><span>' + b[1] + '</span><span class="mono">' + bare(b[2]) + '</span><em>' + note(i) + '</em></li>'; }).join("") + '</ul></div>' +
        '<div class="rc-guess"><p data-guess></p><div class="rc-opts" role="group" aria-label="Business or personal"></div></div>' +
        '<div class="rc-try"><p class="rc-h">Try another receipt</p><div><button type="button" class="chip" data-rec="supply">Supplies</button><button type="button" class="chip" data-rec="fuel">Fuel</button><button type="button" class="chip" data-rec="mixed">Mixed groceries</button></div></div>' +
      '</div>' +
      '<section class="rc-sheet paper" aria-label="October expense review (sample)">' +
        '<div class="rs-head"><div><p class="rs-t">October expense review</p><p class="rs-s">Ozark Paws Grooming (made-up shop) · 58 transactions</p></div><span class="rs-open"><b data-open>3</b> open</span></div>' +
        '<p class="rs-total"><b data-total></b><span data-vs></span></p>' +
        '<ul class="rs-cats" data-cats></ul>' +
        '<ol class="rs-qs">' + QS.map(function (q) {
          return '<li data-q="' + q.k + '"><p class="rs-q"><span id="rq-' + q.k + '">' + q.q + '</span><span class="mono">' + money(q.amt) + '</span></p><p class="rs-meta">' + q.meta + '</p><div class="rs-opts" role="group" aria-labelledby="rq-' + q.k + '">' +
            q.opts.map(function (o) { return '<button type="button" class="chip" data-k="' + q.k + '" data-v="' + o[0] + '" aria-pressed="false">' + o[1] + '</button>'; }).join("") + '</div></li>';
        }).join("") + '</ol>' +
        '<div class="rs-foot"><p class="rs-by">Prepared by Right Hand, Nov 3</p><button type="button" class="btn sm rs-approve" disabled>Approve</button><p class="rs-stamp" aria-hidden="true">Approved<small>Nov 5, by you</small></p></div>' +
      '</section>';
    stage.appendChild(w);
    paintGuess(); paintSheet(true);
    if (player && player.ctx.handedOff()) show(".rc-try");   // reduced-motion stepping rebuilds after hand-off
  }
  // match notes are in the DOM from the start (hidden until match()), so the card list never changes height
  function note(i) { var r = RECEIPTS[st.rec]; return i === r.match ? "Match: same date, amount and card" : st.rec === "supply" && i === 2 ? "Not a match: different amount" : ""; }
  function q(s) { return stage.querySelector(s); }
  function qa(s) { return Array.prototype.slice.call(stage.querySelectorAll(s)); }
  function paintGuess() {
    var r = RECEIPTS[st.rec];
    q("[data-guess]").textContent = r.guess;
    var pv = st.rec === "supply" ? st.ans.online : null;
    q(".rc-opts").innerHTML = r.opts.map(function (o) { return '<button type="button" class="chip" data-g="' + o[0] + '" aria-pressed="' + (o[0] === pv) + '">' + o[1] + '</button>'; }).join("");
    qa(".rc-try .chip").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-rec") === st.rec)); });
  }
  function fill(animate, ctx) {
    var r = RECEIPTS[st.rec];
    var sum = r.items.reduce(function (s, it) { return s + it[2]; }, 0);
    var vals = { m: r.merchant, d: r.date, i: r.items.length + (r.items.length > 1 ? " lines" : " line"), t: money(r.total), c: "ending " + r.card,
      math: "Lines add to " + bare(sum) + (r.tax ? ", plus " + bare(r.tax) + " tax = " + bare(r.total) : " = total") + "." };
    Object.keys(vals).forEach(function (k, i) {
      var el = q('[data-x="' + k + '"]'); el.textContent = vals[k];
      if (animate && ctx) ctx.anim(el, [{ opacity: 0, transform: "translateX(-28px)" }, { opacity: 1, transform: "none" }], { duration: 420, delay: i * 90, easing: "linear(0,.13 6%,.45 13%,.78 20%,.97 27%,1.04 34%,1.05 40%,1.03 48%,1.005 60%,.998 75%,1)", fill: "backwards" });
    });
    q(".rc-extract").classList.add("on");
  }
  function match() {
    var r = RECEIPTS[st.rec];
    q(".rc-bank").classList.add("on");
    qa(".rc-bank li").forEach(function (li, i) { li.classList.toggle("hit", i === r.match); li.classList.toggle("miss", st.rec === "supply" && i === 2); });
    var t = q('[data-x="t"]');
    if (r.match < 0) t.textContent = money(r.total) + ". No card charge matches $" + bare(r.total) + " yet. We will check again when the statement posts.";
  }
  function paintSheet(instant) {
    var d = cats(), n = QS.filter(function (x) { return !st.ans[x.k]; }).length;
    var tot = q("[data-total]"), from = st.prevTotal == null ? d.total : st.prevTotal;
    if (instant || from === d.total) tot.textContent = money(d.total); else U.tick(tot, from, d.total, 650, money);
    st.prevTotal = d.total;
    var diff = d.total - SEPT;
    q("[data-vs]").textContent = (diff >= 0 ? "Up " : "Down ") + money(Math.abs(diff)) + " from September (" + money(SEPT) + ")";
    q("[data-cats]").innerHTML = d.c.map(function (x) { return '<li><span>' + x[0] + '</span><span class="mono">' + money(x[1]) + '</span></li>'; }).join("") +
      '<li class="open' + (d.open > 0 ? "" : " done") + '"><span>Waiting on your answers</span><span class="mono">' + money(d.open) + '</span></li>';
    q("[data-open]").textContent = n;
    q(".rs-open").classList.toggle("zero", !n);
    qa(".rs-qs li").forEach(function (li) {
      var k = li.getAttribute("data-q"), v = st.ans[k];
      li.classList.toggle("ok", !!v);
      li.querySelectorAll(".chip").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-v") === v)); b.disabled = st.approved; });
    });
    // approved stays focusable (aria-disabled), so a keyboard Approve does not drop focus to the page
    var ap = q(".rs-approve"); ap.disabled = !!n && !st.approved;
    if (st.approved) ap.setAttribute("aria-disabled", "true"); else ap.removeAttribute("aria-disabled");
    // once October is approved the supply guess can no longer change it
    qa(".rc-opts .chip").forEach(function (b) { b.disabled = st.rec === "supply" && st.approved; });
    ap.textContent = st.approved ? "Approved" : n ? "Answer " + n + (n > 1 ? " questions" : " question") + " to approve" : "Approve";
    q(".rc-sheet").classList.toggle("approved", st.approved);
  }
  function answer(k, v) {
    if (st.approved) return;
    st.ans[k] = v; paintSheet(false);
    if (k === "online") qa(".rc-opts .chip").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-g") === v)); });
  }
  function boxes(on) { qa(".rc-paper .bx").forEach(function (b) { b.classList.toggle("on", on); }); }
  function show(sel) { var el = q(sel); if (el) el.classList.add("on"); }

  fresh(); build();
  var player = RH.demo({
    root: root, title: "Receipt capture and monthly review · Ozark Paws Grooming", loops: 1,
    reset: function () { fresh(); build(); },
    finalState: function () {
      fresh(); build(); boxes(true); fill(false); match(); show(".rc-guess"); show(".rc-receipt");
      st.ans = { online: "biz", payapp: "contract", fee: "dup" }; st.approved = true; st.prevTotal = null;
      qa(".rc-opts .chip").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-g") === "biz")); });
      paintSheet(true);
    },
    // a mid-play hand-off finishes Right Hand's read (act 1); the owner's answers and approval stay as they are
    onHandoff: function () { show(".rc-receipt"); boxes(true); fill(false); match(); show(".rc-guess"); show(".rc-try"); stage.classList.add("live-mode"); },
    steps: [
      { d: 300, run: function (c) { var p = q(".rc-receipt"); p.classList.add("on"); c.anim(p.querySelector(".rc-paper"), [{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0 0)" }], { duration: 1200, easing: "steps(14, end)" }); } },
      { d: 1350, run: function (c) { var b = q(".rc-beam"), h = q(".rc-paper").offsetHeight - 4; c.anim(b, [{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(" + h + "px)", opacity: 1, offset: .95 }, { transform: "translateY(" + h + "px)", opacity: 0 }], { duration: 1000, easing: "linear", fill: "none" }); } },
      { d: 800, run: function () { boxes(true); } },
      { d: 900, run: function (c) { fill(true, c); } },
      { d: 1100, run: function () { match(); } },
      { d: 900, run: function () { show(".rc-guess"); } },
      { d: 900, run: function (c) { c.cursor("you", q('.rc-opts [data-g="biz"]')); } },
      { d: 750, run: function (c) { c.press("you"); answer("online", "biz"); } },
      { d: 1200, run: function (c) { c.cursor("you", q('[data-k="payapp"][data-v="contract"]')); } },
      { d: 750, run: function (c) { c.press("you"); answer("payapp", "contract"); } },
      { d: 1000, run: function (c) { c.cursor("you", q('[data-k="fee"][data-v="dup"]')); } },
      { d: 750, run: function (c) { c.press("you"); answer("fee", "dup"); } },
      { d: 1000, run: function (c) { c.cursor("you", q(".rs-approve")); } },
      { d: 750, run: function (c) { c.press("you"); st.approved = true; paintSheet(true); c.say("Approved. October expenses are " + money(cats().total) + ".", { force: true }); } },
      { d: 1500, run: function (c) { c.hideCursors(); } }
    ]
  });

  // interactions (they only matter after hand-off; a trusted click hands off first)
  stage.addEventListener("click", function (e) {
    var ctx = player.ctx, b = e.target.closest("button"); if (!b || b.disabled) return;
    if (b.hasAttribute("data-k")) { answer(b.getAttribute("data-k"), b.getAttribute("data-v")); var left = QS.filter(function (x) { return !st.ans[x.k]; }).length; ctx.say(left ? left + (left > 1 ? " questions" : " question") + " left." : "All answered. Ready for your approval."); return; }
    if (b.hasAttribute("data-g")) {
      var g = b.getAttribute("data-g");
      qa(".rc-opts .chip").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      if (st.rec === "supply") { answer("online", g); ctx.say(g === "biz" ? "Moved to Grooming supplies." : "Left out as personal."); }
      else if (st.rec === "fuel") ctx.say(g === "vehicle" ? "Filed under Vehicle." : "Left out as personal.");
      else ctx.say(g === "split" ? "Split: 23.47 to Shop supplies, the rest left out as personal." : "Left out as personal.");
      return;
    }
    if (b.hasAttribute("data-rec")) {
      var keep = { ans: st.ans, approved: st.approved, prevTotal: st.prevTotal };
      st.rec = b.getAttribute("data-rec"); build(); st.ans = keep.ans; st.approved = keep.approved; st.prevTotal = keep.prevTotal; paintSheet(true);
      show(".rc-receipt"); show(".rc-try"); boxes(true); fill(false); match(); show(".rc-guess");
      var r = RECEIPTS[st.rec]; ctx.say("Read " + r.merchant + ", total " + money(r.total) + ". " + r.guess);
      var nb = q('[data-rec="' + st.rec + '"]'); if (nb) nb.focus();
      return;
    }
    if (b.classList.contains("rs-approve")) { if (st.approved) return; st.approved = true; paintSheet(true); ctx.say("Approved. October expenses are " + money(cats().total) + "."); var a = q(".rs-approve"); if (a) a.focus(); }
  });
})();
