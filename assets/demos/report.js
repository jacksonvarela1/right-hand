/* Demo 06: Monday owner report. Cobalt & Comb Salon (made-up salon, Fayetteville). Sample data.
   One data object per week drives every ticker, bar, dot, table, sentence and answer, so the text can only say what
   the charts draw. Each sentence lights the mark it cites (blue, 2px outline, numbered label, leader line).
   Right Hand writes and points; its cursor only hovers. The owner reads, asks and decides. */
(function () {
  "use strict";
  var root = document.getElementById("demo-report");
  if (!root || !window.RH || !RH.demo) return;
  var stage = root.querySelector(".stage"), esc = RH.util.esc;
  var DAY = ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], SH = ["Tue", "Wed", "Thu", "Fri", "Sat"];
  var SRC = ["Online", "Phone", "Text", "Walk-in"], BMAX = 30, SMAX = 60, EASE = "cubic-bezier(.23,1,.32,1)", IO = "cubic-bezier(.65,0,.35,1)";
  var W = {
    a: { k: "a", name: "Week A", sub: "Oct 27 to 31", range: "Tue Oct 27 to Sat Oct 31, 2026", dt: [27, 28, 29, 30, 31], nx: ["Nov 3", "Nov 4", "Nov 5", "Nov 6", "Nov 7"],
      book: [14, 17, 19, 23, 26], ns: [1, 0, 1, 3, 1], src: [52, 29, 11, 7], open: [8, 5, 4, 3, 1], unpaid: 0, reorder: 2 },
    b: { k: "b", name: "Week B", sub: "Oct 20 to 24", range: "Tue Oct 20 to Sat Oct 24, 2026", dt: [20, 21, 22, 23, 24], nx: ["Oct 27", "Oct 28", "Oct 29", "Oct 30", "Oct 31"],
      book: [12, 15, 18, 20, 25], ns: [0, 1, 0, 2, 1], src: [47, 27, 9, 7], open: [7, 6, 4, 2, 1], unpaid: 0, reorder: 1 }
  };
  var QS = ["Which day should I run a promo?", "Top booking source?", "Compare to the other week"];
  var SVC = ["Cut and color", "Women's cut", "Men's cut", "Blowout", "Gloss", "Trim", "Balayage"], TM = ["9:00 AM", "10:30 AM", "11:45 AM", "1:15 PM", "2:30 PM"], SRCI = [0, 1, 0, 2, 0, 1, 0, 3];
  var S = { w: "a", lit: -1, nw: "" }, gen = 0, player;

  function sum(a) { for (var s = 0, i = 0; i < a.length; i++) s += a[i]; return s; }
  function top(a) { for (var b = 0, i = 1; i < a.length; i++) if (a[i] > a[b]) b = i; return b; }
  function pl(n, w) { return n + " " + w + (n === 1 ? "" : "s"); }
  function day(w, i) { return SH[i] + " Oct " + w.dt[i]; }
  function pct(n, d) { return Math.round(n / d * 100) + "%"; }
  function kv(w) { return [sum(w.book), sum(w.ns), sum(w.open), w.unpaid]; }
  function each(a, f) { return a.map(f).join(""); }
  function notes(w) {
    var b = sum(w.book), bi = top(w.book), ni = top(w.ns), oi = top(w.open);
    return [
      { t: DAY[bi] + " was your busiest day: " + w.book[bi] + " of " + b + " bookings.", c: ["d" + bi] },
      { t: pl(sum(w.ns), "no-show") + ", " + w.ns[ni] + " of them on " + DAY[ni] + ". Want a reminder text the day before?", c: ["n" + ni], draft: 1 },
      { t: w.src[1] + " bookings came by phone and " + w.src[2] + " by text.", c: ["s1", "s2"] },
      { t: "Next week has " + sum(w.open) + " open slots, " + w.open[oi] + " of them " + DAY[oi] + ".", c: ["o" + oi] }
    ];
  }
  function citedIn(N, keys) {
    for (var i = 0; i < N.length; i++) for (var j = 0; j < keys.length; j++) if (N[i].c.indexOf(keys[j]) >= 0) return i;
    return -1;
  }
  function answer(w, i) {
    var b = sum(w.book);
    if (i === 0) { var oi = top(w.open); return { t: DAY[oi] + " has the most open slots next week (" + w.open[oi] + ").", c: ["o" + oi] }; }
    if (i === 1) {
      var r = [0, 1, 2, 3].sort(function (x, y) { return w.src[y] - w.src[x]; });
      return { t: SRC[r[0]] + " brings the most: " + w.src[r[0]] + " of " + b + " bookings (" + pct(w.src[r[0]], b) + "). " + SRC[r[1]] + " is next with " + w.src[r[1]] + ".", c: ["s" + r[0]] };
    }
    var o = W[w.k === "a" ? "b" : "a"], ob = sum(o.book), n = sum(w.ns), on = sum(o.ns);
    return { t: "Bookings: " + b + ", " + Math.abs(b - ob) + (b >= ob ? " more" : " fewer") + " than " + (w.k === "a" ? "the week before" : "the week after") + " (" + ob + "). No-shows: " + n + ", " + (n > on ? "up from " : n < on ? "down from " : "same as ") + on + ".", c: [] };
  }
  function sample(w, d) {
    for (var r = [], j = 0; j < Math.min(4, w.book[d]); j++)
      r.push(day(w, d) + ", " + TM[j + d % 2] + ", " + SVC[(j * 3 + d * 2 + 6 + (w.k === "b" ? 1 : 0)) % 7] + ", " + SRC[SRCI[(d + j * 3) % 8]] + (j === 1 && w.ns[d] ? " (no-show)" : ""));
    return r;
  }
  function tb(cap, h, rows) {
    return '<table><caption class="sr-only">' + cap + "</caption><thead><tr>" + each(h, function (x) { return '<th scope="col">' + x + "</th>"; }) + "</tr></thead><tbody>" +
      each(rows, function (r) { return "<tr>" + each(r, function (v, j) { return j ? "<td>" + v + "</td>" : '<th scope="row">' + v + "</th>"; }) + "</tr>"; }) + "</tbody></table>";
  }
  var CITE = '<b class="cite" aria-hidden="true"></b>';
  function card(h, extra, body) { return '<div class="rp-card"><div class="rp-ch"><h5>' + h + "</h5>" + extra + "</div>" + body + '<details class="rp-tb"><summary>Show as table</summary><div></div></details></div>'; }
  stage.innerHTML = '<div class="rp paper z1 z2">' +
    '<div class="rp-top"><div><h4 class="rp-h">Cobalt &amp; Comb Salon</h4><p class="rp-wk"></p></div><div class="rp-seg" role="group" aria-label="Report week">' +
    each(["a", "b"], function (k) { return '<button type="button" data-w="' + k + '" aria-pressed="false">' + W[k].name + "<span>" + W[k].sub + "</span></button>"; }) + "</div></div>" +
    '<dl class="rp-kpi">' + each(["Bookings", "No-shows", "Open slots next week", "Unpaid invoices"], function (l) { return "<div><dt>" + l + "</dt><dd>0</dd></div>"; }) + "</dl>" +
    '<div class="rp-body"><div class="rp-charts">' +
    card("Bookings by day", '<span class="rp-key"><i></i>1 no-show</span>', '<ul class="rp-days" role="list">' + each(SH, function (s, i) {
      return '<li><button type="button" class="rp-day" data-k="d' + i + " n" + i + '"><span class="rp-band"><span class="rp-dots" data-c="n' + i + '"><i></i><i></i><i></i>' + CITE +
        '</span></span><span class="rp-plot"><span class="rp-bar" data-c="d' + i + '"></span>' + CITE + '</span><span class="rp-dl">' + s + "<em></em></span></button></li>";
    }) + "</ul>") +
    card("Booking sources", "", '<ul class="rp-src" role="list">' + each(SRC, function (s, i) {
      return '<li><button type="button" class="rp-s" data-k="s' + i + '" data-c="s' + i + '"><span class="rp-sn">' + s + '</span><span class="rp-tr"><span class="rp-fill"></span></span><span class="rp-sv"></span>' + CITE + "</button></li>";
    }) + "</ul>") +
    card("Open slots next week", "", '<ol class="rp-next" role="list">' + each(SH, function (s, i) {
      return '<li><button type="button" class="rp-o" data-k="o' + i + '" data-c="o' + i + '"><span>' + s + "</span><span></span><strong></strong>" + CITE + "</button></li>";
    }) + "</ol>") +
    '</div><div class="rp-side"><h5>What stood out</h5><ol class="rp-notes" role="list">' + each([1, 2, 3, 4], function (n) {
      return '<li><button type="button" class="rp-num" aria-label="Show what note ' + n + ' points to"><span>' + n + "</span></button><p></p></li>";
    }) + "</ol>" +
    '<p class="rp-also"></p><p class="rp-rev">A person on our team reviews this before it reaches you.</p>' +
    '<div class="rp-askw"><h5>Ask about this week</h5><div class="rp-ask">' + each(QS, function (s, i) { return '<button type="button" class="chip" data-q="' + i + '" aria-pressed="false">' + s + "</button>"; }) +
    '</div><div class="rp-out"></div></div></div><div class="rp-lead" aria-hidden="true"><i></i><i></i><i></i><i></i></div></div></div>';

  function q(s) { return stage.querySelector(s); }
  function qa(s) { return Array.prototype.slice.call(stage.querySelectorAll(s)); }
  var rp = q(".rp"), body = q(".rp-body"), charts = q(".rp-charts"), side = q(".rp-side"), out = q(".rp-out"), segs = qa(".rp-lead i"), kd = qa(".rp-kpi dd"),
    dbtn = qa(".rp-day"), plots = qa(".rp-plot"), rows = qa(".rp-s"), cells = qa(".rp-o"), lis = qa(".rp-notes li"), tbs = qa(".rp-tb > div");

  function paint(w) {
    var N = notes(w), b = sum(w.book);
    function cite(keys) { var n = citedIn(N, keys); return n < 0 ? "" : " Cited in note " + (n + 1) + "."; }
    q(".rp-wk").textContent = "Monday report for " + w.range + " (sample)";
    qa("[data-w]").forEach(function (x) { x.setAttribute("aria-pressed", String(x.getAttribute("data-w") === w.k)); });
    kset(kv(w));
    dbtn.forEach(function (x, i) {
      plots[i].style.setProperty("--v", (w.book[i] / BMAX).toFixed(3));
      x.querySelectorAll(".rp-dots i").forEach(function (d, j) { d.hidden = j >= w.ns[i]; });
      x.querySelector("em").textContent = w.book[i];
      x.setAttribute("aria-label", day(w, i) + ": " + pl(w.book[i], "booking") + ", " + pl(w.ns[i], "no-show") + "." + cite(["d" + i, "n" + i]) + " Show sample rows.");
    });
    rows.forEach(function (x, i) {
      x.style.setProperty("--f", (w.src[i] / SMAX).toFixed(3));
      x.querySelector(".rp-sv").textContent = w.src[i];
      x.setAttribute("aria-label", SRC[i] + ": " + w.src[i] + " of " + b + " bookings." + cite(["s" + i]));
    });
    cells.forEach(function (x, i) {
      x.children[1].textContent = w.nx[i]; x.children[2].textContent = w.open[i];
      x.setAttribute("aria-label", SH[i] + " " + w.nx[i] + ": " + pl(w.open[i], "open slot") + "." + cite(["o" + i]));
    });
    q(".rp-also").textContent = "Also: " + pl(w.reorder, "product") + " to reorder.";
    if (S.nw !== w.k) {
      S.nw = w.k;
      lis.forEach(function (li, i) { li.lastChild.innerHTML = esc(N[i].t) + (N[i].draft ? ' <button type="button" class="rp-draft">We can draft it</button>.' : ""); });
      var t = ", " + w.name + " (sample)";
      tbs[0].innerHTML = tb("Bookings by day" + t, ["Day", "Bookings", "No-shows"], w.book.map(function (v, i) { return [day(w, i), v, w.ns[i]]; }).concat([["Total", b, sum(w.ns)]]));
      tbs[1].innerHTML = tb("Booking sources" + t, ["Source", "Bookings", "Share"], SRC.map(function (s, i) { return [s, w.src[i], pct(w.src[i], b)]; }));
      tbs[2].innerHTML = tb("Open slots next week" + t, ["Day", "Open slots"], w.nx.map(function (d, i) { return [SH[i] + " " + d, w.open[i]]; }).concat([["Total", sum(w.open)]]));
    }
    lis.forEach(function (li) { li.classList.add("on"); });
    rp.classList.remove("z1", "z2");
  }
  function zero() {
    plots.forEach(function (p) { p.style.setProperty("--v", 0); });
    rows.forEach(function (r) { r.style.setProperty("--f", 0); });
    kset([0, 0, 0, 0]);
    lis.forEach(function (li) { li.classList.remove("on"); });
    rp.classList.add("z1", "z2");
  }
  function show(html) { out.innerHTML = html; out.classList.add("on"); }
  function clearOut() {
    out.innerHTML = "<p>Pick a day in the chart to see sample rows, or ask a question.</p>"; out.classList.remove("on");
    qa("[data-q]").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
  }
  function unhov() { var h = q(".hov"); if (h) h.classList.remove("hov"); }
  function A(c, el, kf, ms, delay, ease) { return c.anim(el, kf, { duration: ms, delay: RH.motionOff() ? 0 : delay || 0, easing: ease || EASE, fill: "backwards" }); }
  function kset(v) { gen++; kd.forEach(function (el, i) { el.textContent = v[i]; }); }
  function tick(a, b, ms) {
    var g = ++gen, t0 = performance.now();
    if (RH.motionOff()) { kset(b); return; }
    requestAnimationFrame(function f(t) {
      if (g !== gen) return;
      var k = Math.max(0, Math.min(1, (t - t0) / ms)), e = 1 - Math.pow(1 - k, 3);
      kd.forEach(function (el, i) { el.textContent = Math.round(a[i] + (b[i] - a[i]) * e); });
      if (k < 1) requestAnimationFrame(f);
    });
  }
  function growBars(c) {
    var w = W[S.w]; rp.classList.remove("z1");
    plots.forEach(function (p, i) { var v = (w.book[i] / BMAX).toFixed(3); p.style.setProperty("--v", v); A(c, p.firstChild, [{ transform: "scaleY(0)" }, { transform: "scaleY(" + v + ")" }], 700, i * 60); });
  }
  function growSrc(c) {
    var w = W[S.w]; rp.classList.remove("z2");
    rows.forEach(function (r, i) { var f = (w.src[i] / SMAX).toFixed(3); r.style.setProperty("--f", f); A(c, r.querySelector(".rp-fill"), [{ transform: "scaleX(0)" }, { transform: "scaleX(" + f + ")" }], 600, i * 40); });
  }
  function mark(keys, label) {
    keys.forEach(function (k) {
      var el = q('[data-c="' + k + '"]'); if (!el) return;
      el.classList.add("lit");
      var b = el.querySelector(".cite") || el.parentNode.querySelector(".cite"); if (b) b.textContent = label;
    });
  }
  function unlight() { S.lit = -1; qa(".lit").forEach(function (e) { e.classList.remove("lit"); }); segs.forEach(function (s) { s.className = ""; }); }
  function lightNote(i, c) {
    var N = notes(W[S.w]);
    unlight(); S.lit = i;
    mark(N[i].c, String(i + 1));
    lis[i].classList.add("lit");
    lead(lis[i], N[i].c, c);
  }
  function lead(li, keys, c) {
    if (!segs[0].parentNode.offsetWidth) return;
    var B = body.getBoundingClientRect(), n = li.firstChild.getBoundingClientRect(), els = [], T = null, p, i;
    keys.forEach(function (k) { var e = q('[data-c="' + k + '"]'); if (e) els.push(e); });
    if (!els.length) return;
    els.forEach(function (e) { var r = e.getBoundingClientRect(); T = T ? { l: Math.min(T.l, r.left), r: Math.max(T.r, r.right), t: Math.min(T.t, r.top), b: Math.max(T.b, r.bottom) } : { l: r.left, r: r.right, t: r.top, b: r.bottom }; });
    function X(v) { return Math.round(v - B.left); }
    function Y(v) { return Math.round(v - B.top); }
    var sx = X(n.left) - 4, sy = Y(n.top + n.height / 2), mx = X((charts.getBoundingClientRect().right + side.getBoundingClientRect().left) / 2);
    if (/^[no]/.test(keys[0])) {
      var ay = Y(els[0].closest("ul,ol").getBoundingClientRect().top) - 6, tx = X((T.l + T.r) / 2);
      p = [[sx, sy], [mx, sy], [mx, ay], [tx, ay], [tx, Y(T.t) - 3]];
    } else { var ty = Y((T.t + T.b) / 2); p = [[sx, sy], [mx, sy], [mx, ty], [X(T.r) + 3, ty]]; }
    var len = [], tot = 0, t = 0;
    for (i = 0; i < p.length - 1; i++) { len[i] = Math.abs(p[i + 1][0] - p[i][0]) + Math.abs(p[i + 1][1] - p[i][1]); tot += len[i]; }
    for (i = 0; i < p.length - 1; i++) {
      if (len[i] < 1) continue;
      var a = p[i], z = p[i + 1], h = a[1] === z[1], s = segs[i], d = 300 * len[i] / tot;
      s.style.cssText = "left:" + Math.min(a[0], z[0]) + "px;top:" + Math.min(a[1], z[1]) + "px;width:" + (h ? len[i] : 1) + "px;height:" + (h ? 1 : len[i]) + "px;transform-origin:" +
        (h ? (z[0] > a[0] ? "0 0" : "100% 0") : (z[1] > a[1] ? "0 0" : "0 100%"));
      s.className = "on";
      A(c, s, [{ transform: h ? "scaleX(0)" : "scaleY(0)" }, { transform: "none" }], d, t, "linear");
      t += d;
    }
  }
  function reveal(i, c) {
    lis[i].classList.add("on");
    lightNote(i, c);
    A(c, lis[i], [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], 280);
  }
  function setWeek(k, c) {
    var f = W[S.w], w = W[k];
    if (f === w) return;
    S.w = k; unlight(); paint(w); clearOut();
    plots.forEach(function (p, i) { A(c, p.firstChild, [{ transform: "scaleY(" + f.book[i] / BMAX + ")" }, { transform: "scaleY(" + w.book[i] / BMAX + ")" }], 500, 0, IO); });
    rows.forEach(function (r, i) { A(c, r.querySelector(".rp-fill"), [{ transform: "scaleX(" + f.src[i] / SMAX + ")" }, { transform: "scaleX(" + w.src[i] / SMAX + ")" }], 500, 0, IO); });
    qa(".rp-notes p,.rp-o,.rp-dots,.rp-dl em,.rp-sv").forEach(function (e) { A(c, e, [{ opacity: 0 }, { opacity: 1 }], 240, 120); });
    tick(kv(f), kv(w), 600);
  }

  player = RH.demo({
    root: root,
    title: "Monday owner report",
    loops: 1,
    reset: function () { S.w = "a"; S.nw = ""; unlight(); paint(W.a); zero(); clearOut(); qa("details").forEach(function (d) { d.open = false; }); },
    finalState: function () { S.w = "a"; unlight(); paint(W.a); clearOut(); unhov(); },
    onHandoff: function () { paint(W[S.w]); unhov(); },
    steps: [
      { d: 500, run: function () { tick([0, 0, 0, 0], kv(W[S.w]), 900); } },
      { d: 300, run: growBars },
      { d: 1000, run: growSrc },
      { d: 700, run: function (c) { reveal(0, c); } },
      { d: 1100, run: function (c) { reveal(1, c); } },
      { d: 600, run: function (c) { var d = q(".rp-draft"); d.classList.add("hov"); c.cursor("rh", d); } },
      { d: 500, run: function (c) { reveal(2, c); } },
      { d: 1100, run: function (c) { reveal(3, c); } },
      { d: 3000, run: function (c) { unlight(); unhov(); c.hideCursors(); c.cursor("you", q('[data-w="b"]')); } },
      { d: 800, run: function (c) { c.press("you"); setWeek("b", c); } },
      { d: 2600, run: function (c) { c.cursor("you", q('[data-w="a"]')); } },
      { d: 800, run: function (c) { c.press("you"); setWeek("a", c); } },
      { d: 1400, run: function (c) { c.hideCursors(); } }
    ]
  });
  function link(t, force) {
    var c = player.ctx, li, el, n, k;
    if (!c.handedOff() || !t.closest) return;
    if ((li = t.closest(".rp-notes li"))) n = lis.indexOf(li);
    else if ((el = t.closest("[data-k]"))) { k = el.getAttribute("data-k").split(" "); n = citedIn(notes(W[S.w]), k); }
    else return;
    if (n >= 0) { if (n !== S.lit) lightNote(n, c); }
    else if (force) { unlight(); mark(k.slice(0, 1), ""); }
  }
  stage.addEventListener("mouseover", function (e) { link(e.target); });
  stage.addEventListener("focusin", function (e) { link(e.target); });
  addEventListener("resize", function () { segs.forEach(function (s) { s.className = ""; }); });

  stage.addEventListener("click", function (e) {
    var c = player.ctx, b = e.target.closest && e.target.closest("button"), w = W[S.w], i, r, t;
    if (!b || !c.handedOff()) return;
    if (b.hasAttribute("data-w")) {
      w = W[b.getAttribute("data-w")]; setWeek(w.k, c);
      c.say("Showing " + w.name + ", " + w.range + ": " + pl(sum(w.book), "booking") + ", " + pl(sum(w.ns), "no-show") + ".");
    } else if (b.classList.contains("rp-num")) {
      i = lis.indexOf(b.parentNode); if (i !== S.lit) lightNote(i, c);
      c.say("Note " + (i + 1) + " is highlighted in the charts.");
    } else if (b.classList.contains("rp-draft")) {
      show('<p class="rp-oh">Draft reminder text (sample)</p><p class="rp-sms">Hi Jordan, this is Cobalt &amp; Comb Salon. Reminder: your visit is tomorrow at 10:30 AM. Reply C to confirm, or call 479-555-0148 to move it.</p><p class="rp-fine">Draft only. Nothing sends until you approve it.</p>');
      c.say("Reminder text drafted. Nothing sends until you approve it.");
    } else if (b.hasAttribute("data-q")) {
      i = +b.getAttribute("data-q"); r = answer(w, i);
      unlight(); mark(r.c, "A");
      show('<p class="rp-oh">' + esc(QS[i]) + "</p><p>" + esc(r.t) + "</p>");
      qa("[data-q]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      c.say(r.t);
    } else if ((i = dbtn.indexOf(b)) >= 0) {
      r = sample(w, i); link(b, 1);
      show('<p class="rp-oh">Sample export rows, ' + day(w, i) + " (" + r.length + " of " + w.book[i] + ')</p><ul class="rp-rows" role="list">' + each(r, function (x) { return "<li>" + esc(x) + "</li>"; }) + "</ul>");
      c.say(day(w, i) + ": " + pl(w.book[i], "booking") + ". Showing " + r.length + " sample rows.");
    } else if ((i = rows.indexOf(b)) >= 0) {
      t = SRC[i] + ": " + w.src[i] + " of " + sum(w.book) + " bookings (" + pct(w.src[i], sum(w.book)) + ")."; link(b, 1); show("<p>" + t + "</p>"); c.say(t);
    } else if ((i = cells.indexOf(b)) >= 0) {
      t = SH[i] + " " + w.nx[i] + ": " + pl(w.open[i], "open slot") + " next week."; link(b, 1); show("<p>" + t + "</p>"); c.say(t);
    }
  });
})();
