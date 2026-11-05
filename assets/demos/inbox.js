/* Demo 02: Inbox sorted by 8 AM. Linden & Loom, Bentonville (made-up boutique, sample data). Right Hand sorts and drafts;
   only the You cursor (or the visitor) approves. Uses RH.demo from demo-player.js. No timers: steps, and onfinish for Try one. */
(function () {
  "use strict";
  var root = document.getElementById("demo-inbox");
  if (!root || !window.RH || !RH.demo) return;
  var stage = root.querySelector(".stage");
  if (!stage) return;

  var esc = RH.util.esc, CK = RH.util.CHECK, LOOPS = 2, EO = "cubic-bezier(.23,1,.32,1)";
  var LAND = window.CSS && CSS.supports("transition-timing-function", "linear(0,1)") ? "linear(0,.13 6%,.45 13%,.78 20%,.97 27%,1.04 34%,1.05 40%,1.03 48%,1.005 60%,.998 75%,1)" : EO;
  var LN = ["Needs you", "Draft ready", "FYI"];
  var SUM = "Sorted 8 sample emails: 2 need you, 3 drafts ready, 3 FYI.";
  // f from, a address (@example.com), s subject ([..] = key phrase), l lane, c chip, w why, t draft, k kind
  var MAIL = [
    { f: "Dana K.", a: "dana.k", s: "[Linen wrap dress] in [medium]?", l: 1, c: "Product question", w: "Product question. Checked your inventory sheet (sample): 2 left.", t: "Hi Dana, yes, we have 2 in medium. Want us to hold one at the counter until Saturday at 5? Linden & Loom" },
    { f: "Wholesale supplier", a: "billing", s: "[Invoice 2207] due Nov 15, [$1,240.00]", l: 0, c: "Money out", w: "Money out. Right Hand never pays bills.", k: "bill" },
    { f: "Shipping notice", a: "tracking", s: "Your 40 tote bags [shipped]", l: 2, c: "Tracking only", w: "Tracking only. Arrival Nov 8 added to your week." },
    { f: "Morgan P.", a: "morgan.p", s: "[Return] a sweater? Bought it [10 days ago], [tags on].", l: 1, c: "Return policy", w: "Matches your return policy (sample): 14 days with tags.", t: "Hi Morgan, yes. Bring it in with the tags by Nov 13 and we will refund your card." },
    { f: "Priya S.", a: "priya.s", s: "[Private shopping night] [for 12]? Any Friday in December after close?", l: 0, c: "New request", w: "A new kind of request. Your call on dates and price.", k: "opts", t: "" },
    { f: "Trade newsletter", a: "news", s: "[Issue 48]: holiday window ideas", l: 2, c: "Newsletter", w: "Newsletter. Filed, not deleted." },
    { f: "Web form", a: "forms", s: "[Pitch] from a candle maker: hand-poured, small batch", l: 2, c: "Vendor pitch", w: "Vendor pitch. Saved to Vendors to review." },
    { f: "Alex R.", a: "alex.r", s: "Open on [Thanksgiving]?", l: 1, c: "Holiday hours", w: "Answered from your saved holiday hours (sample): closed Thursday, open 8 AM Friday.", t: "Hi Alex, we are closed on Thanksgiving Day and open at 8 AM on Friday. Linden & Loom" }
  ];
  var OPTS = [
    ["Yes, pick a Friday", "Hi Priya, we would love to host your group. Which Friday in December works best? I will send pricing once we pick a date. Linden & Loom"],
    ["Ask for details", "Hi Priya, thanks for thinking of us. How long would you like the store, and is it for a special occasion? Linden & Loom"],
    ["Not this year", "Hi Priya, our December Fridays are full this year. Could we plan one for January instead? Linden & Loom"]
  ];
  var TRY = [
    ["Gift card question", "Sam T.", "sam.t", "Do you sell gift cards? Need one by Friday.", "Hi Sam, yes. We sell gift cards in any amount at the counter. Linden & Loom"],
    ["Package arrived damaged", "Jordan L.", "jordan.l", "My package arrived damaged. What can you do?"],
    ["Vendor wants a meeting", "Sales rep", "sales", "Can we book a meeting to show you our spring line?"],
    ["You won a prize", "Prize desk", "prizes", "You won a prize! Click here to claim it."]
  ];
  // demo rules, not a live AI: first match wins
  var RULES = [
    [/gift cards?/i, 1, "Gift card", "Gift card question. Draft uses your saved answer (sample)."],
    [/arrived damaged|broken/i, 0, "Unhappy customer", "Unhappy customer. You answer these first."],
    [/won a prize|click here/i, 2, "Likely spam", "Likely spam. Links not opened."],
    [/meeting/i, 2, "Vendor", "Vendor wants a meeting. Saved to Vendors to review."]
  ];

  var X, wrap, stream, beam, dr, tryBox, U, N, C, L, cur = -1, gen = 0, busy = 0, loopN = 0;

  function q(s) { return wrap.querySelector(s); }
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function mk(s, wash) { return esc(s).replace(/\[(.+?)\]/g, wash ? "<mark><i></i>$1</mark>" : "<mark>$1</mark>"); }
  function A(el, kf, o) { if (RH.motionOff()) o.delay = 0; return X.anim(el, kf, o); }
  function rect(e) { return e.getBoundingClientRect(); }

  function liFor(i) {
    var e = C[i], t = document.createElement("ul");
    t.innerHTML = '<li data-i="' + i + '" data-l="' + e.l + '"><button type="button" class="card paper" aria-expanded="false" aria-controls="ib-dr"><span class="fr">' + esc(e.f) + '</span><span class="why">' + esc(e.c) + '</span><span class="sj">' + mk(e.s, 1) + "</span></button></li>";
    return t.firstChild;
  }

  function render() {
    gen++; cur = -1; busy = 0;
    wrap.innerHTML = '<p class="tg">Sample data. Made-up boutique. The sorting is scripted for this demo.</p>' +
      '<div class="inc"><h4>Incoming <span>8 overnight</span></h4><ol class="stream" aria-label="Incoming email, sample"></ol>' +
      '<div class="try"' + (X.handedOff() ? "" : " hidden") + "><p>Try one (demo rules, not a live AI):</p><div>" +
      TRY.map(function (t, k) { return '<button type="button" class="chip" data-t="' + k + '">' + t[0] + "</button>"; }).join("") +
      '</div></div><div class="beam" aria-hidden="true"><i></i></div></div><div class="lanes">' +
      LN.map(function (n, l) { return '<section class="lane" data-l="' + l + '"><h4><span>' + n + "</span><b>0</b></h4><ul></ul></section>"; }).join("") +
      '</div><div class="dr paper" id="ib-dr" role="region" aria-label="Email details" hidden></div>';
    stream = q(".stream"); beam = q(".beam"); dr = q(".dr"); tryBox = q(".try");
    U = wrap.querySelectorAll(".lane ul"); N = wrap.querySelectorAll(".lane b");
    C = MAIL.map(function (e) { return Object.assign({}, e); });
    L = C.map(function (e, i) { return liFor(i); });
  }

  // FLIP: read every rect, change the DOM once, read again, then animate the difference
  function fl(els, fn, ms, ease) {
    var a = els.map(rect), b;
    fn();
    b = els.map(rect);
    els.forEach(function (e, k) {
      var x = a[k].left - b[k].left, y = a[k].top - b[k].top;
      if (x || y) A(e, [{ transform: "translate(" + x + "px," + y + "px)" }, { transform: "none" }], { duration: ms, easing: ease });
    });
  }
  function cnt() {
    each(N, function (b, l) { var n = U[l].children.length, o = +b.textContent; if (n !== o) RH.util.tick(b, o, n, 300); });
  }
  function place(i) { L[i].classList.add("hit"); U[C[i].l].appendChild(L[i]); }

  // card arrives on top of the stream, beam reads it, phrases wash, chip shows. Returns the chip animation.
  function enter(li) {
    fl(Array.prototype.slice.call(stream.children), function () { stream.insertBefore(li, stream.firstChild); li.appendChild(beam); }, 240, EO);
    A(li, [{ opacity: 0, transform: "translateY(-12px)" }, { opacity: 1, transform: "none" }], { duration: 240, easing: EO });
    if (!RH.motionOff()) A(beam.firstChild, [{ transform: "translateY(-100%)", opacity: 1 }, { transform: "none", opacity: 1, offset: .9 }, { transform: "none", opacity: 0 }], { duration: 520, delay: 240, easing: "linear" });
    each(li.querySelectorAll("mark i"), function (m) { A(m, [{ transform: "scaleX(0)" }, { transform: "none" }], { duration: 200, delay: 760, easing: EO }); });
    return A(li.querySelector(".why"), [{ opacity: 0, transform: "translateY(3px)" }, { opacity: 1, transform: "none" }], { duration: 240, delay: 960, easing: EO });
  }
  function land(li) {
    var e = C[li.dataset.i];
    li.classList.add("hit");
    fl([li], function () { U[e.l].appendChild(li); }, 420, LAND);
    cnt();
  }

  function drawerHTML(e) {
    var ph = (e.s.match(/\[(.+?)\]/g) || []).map(function (x) { return '"' + x.slice(1, -1) + '"'; }).join(", ");
    var h = '<div class="dh"><p>From ' + esc(e.f) + " &lt;" + e.a + '@example.com&gt;</p><button type="button" class="btn sm ghost x">Close</button></div>' +
      '<h4 tabindex="-1">' + mk(e.s) + "</h4><dl><dt>Why</dt><dd>" + esc(e.w) + "</dd><dt>Phrases</dt><dd>" + esc(ph) + "</dd></dl>";
    if (e.k === "bill") h += '<div class="act"><button type="button" class="btn sm bill' + (e.b ? ' on" aria-disabled="true">' + CK + "Added to bills due" : '">Add to bills due') + '</button></div><p class="nt">You pay it. Right Hand never moves money.</p>';
    if (e.k === "opts") h += '<p class="nt">Pick a reply to start from. None is sent.</p><div class="opts">' +
      OPTS.map(function (o, k) { return '<button type="button" class="chip" data-o="' + k + '" aria-pressed="' + (e.o === k) + '"' + (e.sent ? ' aria-disabled="true"' : "") + ">" + o[0] + "</button>"; }).join("") + "</div>";
    if (e.t != null) h += '<label for="ib-t">Draft reply</label><textarea id="ib-t" rows="3" placeholder="Pick a reply above"' + (e.sent ? " readonly" : "") + ">" + esc(e.t) + "</textarea>" +
      '<div class="act"><button type="button" class="btn sm go"' + (e.sent || !e.t ? ' aria-disabled="true"' : "") + ">" + (e.sent ? "Approved" : "Approve and send") + "</button>" +
      '<button type="button" class="btn sm ghost send' + (e.sent ? ' on" disabled>' + CK + "Sent" : '" disabled>Waiting for your OK') + "</button></div>";
    return h + '<div class="mv"><span>Move to</span>' + LN.map(function (n, l) { return l === e.l ? "" : '<button type="button" class="chip" data-mv="' + l + '">' + n + "</button>"; }).join("") + "</div>";
  }
  function ex(i, on) { L[i].classList.toggle("open", on); L[i].firstChild.setAttribute("aria-expanded", String(on)); }
  function open(i, an, fo) {
    if (cur >= 0) ex(cur, false);
    cur = i; ex(i, true);
    dr.className = "dr paper" + (C[i].l ? "" : " R");
    dr.innerHTML = drawerHTML(C[i]);
    dr.hidden = false; dr.scrollTop = 0;
    if (an) A(dr, [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 240, easing: EO });
    if (fo) dr.querySelector("h4").focus();
  }
  function close(fo) {
    if (cur < 0) return;
    var i = cur; ex(i, false); cur = -1; dr.hidden = true;
    if (fo) L[i].firstChild.focus();
  }
  function tag(i, txt, done) { L[i].querySelector(".why").textContent = txt; if (done) L[i].classList.add("done"); }
  function draw(b, html) { b.innerHTML = html; void b.offsetWidth; b.classList.add("on"); }

  function approve(i) {
    var e = C[i], g = dr.querySelector(".go");
    if (!g || e.sent) return;
    if (!e.t.trim()) { X.say("Pick or write a reply first."); return; }
    e.sent = 1;
    g.setAttribute("aria-disabled", "true"); g.textContent = "Approved";
    draw(dr.querySelector(".send"), CK + "Sent");
    dr.querySelector("textarea").readOnly = true;
    each(dr.querySelectorAll("[data-o]"), function (x) { x.setAttribute("aria-disabled", "true"); });
    tag(i, "Sent", 1);
    X.say("You approved it. Reply to " + e.f + " sent. Demo only, nothing leaves this page.");
  }
  function bill(i, b) {
    var e = C[i];
    if (e.b) return;
    e.b = 1; b.setAttribute("aria-disabled", "true");
    draw(b, CK + "Added to bills due");
    tag(i, "In bills due", 1);
    X.say("Added to bills due. You decide when to pay it. Right Hand never moves money.");
  }
  function pick(i, k, b) {
    var e = C[i];
    if (e.sent) return;
    e.o = k; e.t = OPTS[k][1];
    each(dr.querySelectorAll("[data-o]"), function (x) { x.setAttribute("aria-pressed", String(x === b)); });
    dr.querySelector("textarea").value = e.t;
    dr.querySelector(".go").removeAttribute("aria-disabled");
    X.say("Reply started. Edit it if you like. Nothing is sent until you approve.");
  }
  function move(i, l) {
    var li = L[i], els = [li], n = li.nextElementSibling;
    while (n) { els.push(n); n = n.nextElementSibling; }
    close();
    fl(els, function () { U[l].appendChild(li); }, 420, LAND);
    C[i].l = l; li.dataset.l = l;
    if (!li.classList.contains("done")) tag(i, "Moved by you");
    cnt(); li.firstChild.focus();
    X.say("Moved to " + LN[l] + ".");
  }
  function tryOne(k, b) {
    if (busy || b.getAttribute("aria-disabled")) return;
    var t = TRY[k], r = RULES.filter(function (x) { return x[0].test(t[3]); })[0], g = gen, e, li, a;
    e = { f: t[1], a: t[2], s: t[3].replace(r[0], "[$&]"), l: r[1], c: r[2], w: r[3] };
    if (t[4]) e.t = t[4];
    busy = 1; b.setAttribute("aria-disabled", "true");
    C.push(e); L.push(li = liFor(C.length - 1));
    close();
    a = enter(li);
    function done() { if (g !== gen) return; land(li); busy = 0; X.say("Demo rules put it in " + LN[e.l] + ". " + e.w); }
    if (a) a.onfinish = done; else done();
  }

  function reset(ctx) {
    X = ctx;
    loopN = ctx.playing() ? loopN + 1 : 0;
    render();
    ctx.hideCursors();
    if (ctx.playing()) A(wrap, [{ opacity: 0 }, { opacity: 1 }], { duration: 110, easing: "linear", fill: "none" });
  }
  function finalState(ctx) {
    X = ctx;
    render();
    C.forEach(function (e, i) { place(i); });
    each(N, function (b, l) { b.textContent = U[l].children.length; });
    C[0].sent = 1; tag(0, "Sent", 1);
    open(0);
  }
  function onHandoff(ctx) {
    X = ctx;
    var a = document.activeElement;
    C.forEach(function (e, i) { var p = L[i].parentNode; if (!p || p === stream) place(i); });
    cnt();
    tryBox.hidden = false;
    // moving a focused card into its lane blurs it (focusin on a card in the stream hands off): put focus back
    if (a && a !== document.activeElement && wrap.contains(a)) a.focus();
  }

  var steps = [], last = 0;
  function at(ms, run) { steps.push({ t: ms, run: run }); }
  MAIL.forEach(function (e, i) {
    at(400 + 900 * i, function () { enter(L[i]); });
    at(1580 + 900 * i, function () { land(L[i]); });
  });
  at(8600, function () { open(0, true); X.cursor("you", L[0], { fx: .8, fy: .8 }); });
  at(9400, function () { var g = dr.querySelector(".go"); if (g) X.cursor("you", g); });
  at(10400, function () { if (cur !== 0) open(0); X.press("you"); approve(0); });
  at(11200, function () {
    X.hideCursors(); X.say(SUM, { force: true });
    // hold to 12.4s, then dip out; reset() fades the next loop in (220ms crossfade in total)
    if (X.playing() && loopN < LOOPS - 1) A(wrap, [{ opacity: 1 }, { opacity: 1, offset: .91 }, { opacity: 0 }], { duration: 1200, easing: "linear", fill: "none" });
  });
  steps.sort(function (a, b) { return a.t - b.t; });
  steps.forEach(function (s) { s.d = s.t - last; last = s.t; });

  stage.innerHTML = '<div class="ib dark"></div>';
  wrap = stage.firstChild;
  RH.demo({ root: root, title: "Inbox sorted by 8 AM", loops: LOOPS, steps: steps, reset: reset, finalState: finalState, onHandoff: onHandoff });

  stage.addEventListener("click", function (ev) {
    if (!X.handedOff()) return;
    var b = ev.target.closest ? ev.target.closest("button") : null;
    if (!b || !wrap.contains(b)) return;
    var c = b.classList, d = b.dataset, i;
    if (c.contains("card")) { i = +b.parentNode.dataset.i; if (cur === i) close(true); else open(i, false, true); }
    else if (c.contains("x")) close(true);
    else if (c.contains("go")) approve(cur);
    else if (c.contains("bill")) bill(cur, b);
    else if (d.mv) move(cur, +d.mv);
    else if (d.o) pick(cur, +d.o, b);
    else if (d.t) tryOne(+d.t, b);
  });
  stage.addEventListener("input", function (ev) {
    if (ev.target.id !== "ib-t" || cur < 0) return;
    var e = C[cur], g = dr.querySelector(".go");
    e.t = ev.target.value;
    if (g && !e.sent) { if (e.t.trim()) g.removeAttribute("aria-disabled"); else g.setAttribute("aria-disabled", "true"); }
  });
  // focus leaving the drawer for a card or chip it may cover closes it, so focus is never hidden under it
  stage.addEventListener("focusin", function (ev) {
    if (cur < 0 || !X.handedOff() || dr.contains(ev.target) || !wrap.contains(ev.target) || ev.target === L[cur].firstChild) return;
    close();
  });
  stage.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && cur >= 0 && X.handedOff()) close(true); });
})();
