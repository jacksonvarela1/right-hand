/* Demo 05: Automation builder, Flint Row Auto Care (made-up, sample data). Right Hand drafts, the owner approves.
   Packet rides are ctx.anim animations built from 64 cached path samples, so they pause with the player. */
(function () {
  "use strict";
  var root = document.getElementById("demo-automation");
  if (!root || !window.RH || !RH.demo) return;
  var stage = root.querySelector(".stage");
  if (!stage) return;
  var esc = RH.util.esc, EASE = "cubic-bezier(.65,0,.35,1)";

  // kind: [tag, title, idle line, what it does]
  var K = {
    trigger: ["Trigger", "New quote request", "Your website form", "Starts when someone fills in the quote form on your site."],
    sort: ["AI", "Read and sort", "Job, vehicle, day", "Reads the request and pulls out the job, the vehicle and the day they want."],
    branch: ["Branch", "Repair or just a question", "Two paths", "Repairs go to the calendar check. Questions skip it. Upset customers go to you."],
    bays: ["Lookup", "Check open bays", "Shop calendar (sample)", "Looks for an open bay on the shop calendar."],
    draft: ["AI", "Draft the reply", "For you to read", "Writes a reply for you to read. It never sends on its own."],
    gate: ["Gate", "You approve", "Nothing goes out without you", "Nothing a customer reads goes out until you approve it."],
    send: ["Action", "Send email to customer", "After your OK", "Sends the reply you approved from the shop address."],
    follow: ["Timer", "Follow up in 2 days", "Then add to customer list", "If there is no answer in 2 days, it nudges once, then adds them to your customer list."],
    text: ["Action", "Text the customer", "After your OK", "Texts the customer the reply you approved."],
    cal: ["Action", "Add to calendar", "Shop calendar (sample)", "Puts the visit on the shop calendar."],
    inv: ["Action", "Create invoice draft", "Draft only", "Starts an invoice draft. You check it and send it."],
    file: ["Action", "Save the attachment to the right folder", "Customer folders", "Files the request in that customer's folder."],
    sheet: ["Action", "Log in a spreadsheet", "Quotes log (sample)", "Adds a row to your quotes log."],
    ping: ["Action", "Notify me on my phone", "Your phone", "Sends you a short alert. Only you see it."]
  };
  var BASE = ["trigger", "sort", "branch", "bays", "draft", "gate", "send", "follow"];
  var ADD = ["text", "cal", "inv", "file", "sheet", "ping"];
  var CF = { send: 1, text: 1 }, LOCK = { trigger: 1, sort: 1, branch: 1, bays: 1, draft: 1 };
  var GUARD = "This would send to customers without your OK. Right Hand keeps a person on anything a customer reads.";

  function sc(who, veh, msg, ph, sort, type, draft) {
    var e = who.split(" ")[0].toLowerCase() + "@example.com", p = [["Name", who]];
    if (veh) p.push(["Vehicle", veh]);
    p.push(["Message", msg], ["Phone", "(479) 555-" + ph], ["Email", e]);
    return { who: who, ph: "(479) 555-" + ph, email: e, pay: p, sort: sort, type: type, draft: draft };
  }
  var B = sc("Chris M.", "2014 pickup", "Grinding noise when I brake. Can you look Saturday?", "0177", "Brakes, 2014 pickup, wants Saturday", "Repair",
    "Hi Chris, thanks for reaching out to Flint Row Auto Care. We can look at the brakes Saturday at 9:00 AM. Does that time work? We will confirm any cost before doing work.");
  var SC = {
    brake: B,
    hours: sc("Dana R.", "", "What are your hours?", "0142", "Question: shop hours", "Just a question",
      "Hi Dana, thanks for asking. Flint Row Auto Care is open Monday to Friday, 7:30 AM to 5:30 PM, and Saturday, 8:00 AM to noon. Anything else we can help with?"),
    angry: sc("Pat L.", "2019 sedan", "My car was supposed to be ready yesterday and it still is not.", "0193", "Unhappy customer: car not ready", "Unhappy customer", "")
  };
  var LBL = { brake: "Brake noise, Saturday", hours: "What are your hours?", angry: "Angry: car not ready" };

  var MARK = '<svg class="gm" viewBox="0 0 24 24" aria-hidden="true"><path class="gb" d="M9 3.5h9.5a2 2 0 0 1 2 2V15"/><rect x="3.5" y="8" width="13" height="12.5" rx="2.5"/><path class="gk" pathLength="1" d="M6.8 14.3l2.2 2.2 4.4-4.6"/></svg>';
  function bt(cls, attr, txt) { return '<button type="button" class="' + cls + '" ' + attr + ">" + txt + "</button>"; }

  stage.innerHTML =
    '<div class="fw"><div class="flow"><svg class="wires" aria-hidden="true" focusable="false"></svg>' +
    '<ol class="nodes" aria-label="Automation steps, in order"></ol>' +
    '<i class="pk" aria-hidden="true"></i><i class="pk e" aria-hidden="true"></i><i class="pk e" aria-hidden="true"></i></div></div>' +
    '<aside class="inspector" aria-labelledby="af-ih"><div class="ihd"><h4 id="af-ih">Inspector</h4><span class="smp">Sample data</span></div>' +
    '<p class="iname"></p><dl class="idl"></dl><div class="iact">' + bt("btn sm ap", "hidden", "Approve") +
    '<span class="edit">' + bt("eb", 'data-mv="-1"', "Move up") + bt("eb", 'data-mv="1"', "Move down") + bt("eb", 'data-rm="1"', "Remove") + "</span></div></aside>" +
    '<div class="tools"><p class="guard" hidden><span>' + GUARD + "</span> " + bt("eb gfix", "", "Put your OK back") + "</p>" +
    '<details class="pd"><summary><span id="af-pl">Add a step after <b></b></span></summary><div class="palette" role="group" aria-labelledby="af-pl">' +
    ADD.map(function (k) { return bt("blk", 'data-add="' + k + '"', K[k][1]); }).join("") + "</div></details>" +
    '<div class="tests" role="group" aria-labelledby="af-tl"><p class="tl" id="af-tl">Run a test with sample input</p>' +
    Object.keys(LBL).map(function (k) { return bt("tb", 'data-run="' + k + '"', LBL[k]); }).join("") + bt("tb rs", "data-reset", "Reset flow") + "</div></div>";

  function q(s) { return stage.querySelector(s); }
  var flowEl = q(".flow"), svg = q(".wires"), ol = q(".nodes"), pks = [].slice.call(stage.querySelectorAll(".pk"));
  var iname = q(".iname"), idl = q(".idl"), ap = q(".ap"), mvU = q('[data-mv="-1"]'), mvD = q('[data-mv="1"]'), rmB = q("[data-rm]");
  var guardP = q(".guard"), palB = q("#af-pl b"), pd = q(".pd");
  if (matchMedia("(min-width:601px)").matches) pd.open = true;

  var C = null, Q = false, built = false, flow = [], nodes = [], wires = [], by = null, lr = null, lq = null;
  var sel = -1, rowsAt = [], runTok = 0, wait = null, pkAt = null, uid = 0;
  function mk(k) { return { k: k, id: ++uid }; }
  function A(el, kf, o) { if (Q || !C || !el) return null; if (RH.motionOff()) o.delay = 0; return C.anim(el, kf, o); }
  function then(a, f) { if (a) a.addEventListener("finish", f); else f(); }

  /* ---------- flow and wires ---------- */
  function render(v) {
    ol.style.setProperty("--cols", Math.max(4, Math.ceil(flow.length / 2)));
    ol.innerHTML = flow.map(function (o, i) {
      var d = K[o.k];
      return '<li class="n k-' + o.k + (d[0] === "AI" ? " ai" : "") + '"><button type="button" class="node"><span class="nk">' + (o.k === "gate" ? MARK : "") +
        (i < 9 ? "0" : "") + (i + 1) + " " + d[0] + '</span> <span class="nt">' + d[1] + '</span> <span class="no">' + d[2] + "</span></button></li>";
    }).join("");
    nodes = [].slice.call(ol.children); rowsAt = [];
    var h = "", bi = -1, i;
    flow.forEach(function (o, j) {
      if (j) h += '<path class="w" pathLength="1"/>';
      if (bi < 0 && o.k === "branch" && flow[j + 1] && flow[j + 1].k === "bays" && flow[j + 2]) bi = j;
    });
    if (bi >= 0) h += '<path class="w by" pathLength="1"/><text class="wl lr">Repair</text><text class="wl lq">Just a question</text>';
    svg.innerHTML = h;
    var ps = svg.querySelectorAll("path");
    wires = [];
    for (i = 0; i < flow.length - 1; i++) wires.push({ el: ps[i], a: i, b: i + 1 });
    by = bi >= 0 ? { el: ps[i], a: bi, b: bi + 2 } : null;
    lr = svg.querySelector(".lr"); lq = svg.querySelector(".lq");
    pkAt = null; geo();
    if (v) vis();
  }
  function vis() {
    nodes.forEach(function (li) { li.classList.add("on"); });
    [].forEach.call(svg.children, function (e) { e.classList.add("on"); });
  }
  function bx(i) { var b = nodes[i].firstChild; return { x: b.offsetLeft, y: b.offsetTop, w: b.offsetWidth, h: b.offsetHeight }; }
  function orth(x1, y1, x2, y2, ly) {
    var sx = x2 < x1 ? -1 : 1, s1 = ly > y1 ? 1 : -1, s2 = y2 > ly ? 1 : -1;
    var r = Math.min(10, Math.abs(x2 - x1) / 2, Math.abs(ly - y1), Math.abs(y2 - ly));
    return "M" + x1 + " " + y1 + "V" + (ly - s1 * r) + "Q" + x1 + " " + ly + " " + (x1 + sx * r) + " " + ly + "H" + (x2 - sx * r) + "Q" + x2 + " " + ly + " " + x2 + " " + (ly + s2 * r) + "V" + y2;
  }
  function path(w, isBy) {
    var a = bx(w.a), b = bx(w.b), ya = a.y + a.h / 2, yb = b.y + b.h / 2, d, x, y1, y2;
    if (Math.abs(a.x - b.x) < 2) { // phones: one column, top to bottom
      x = a.x + a.w;
      d = isBy ? "M" + x + " " + ya + "C" + (x + 30) + " " + ya + " " + (x + 30) + " " + yb + " " + x + " " + yb : "M" + (a.x - 14) + " " + ya + "V" + yb;
    } else if (Math.abs(a.y - b.y) < 2) { // same row, left to right
      y1 = a.y + a.h;
      d = isBy ? orth(a.x + a.w / 2, y1, b.x + b.w / 2, y1, y1 + 18) : "M" + (a.x + a.w) + " " + ya + "H" + b.x;
    } else { // wrap to the next row, two lanes so the paths never overlap
      y1 = a.y + a.h; y2 = b.y;
      d = orth(a.x + a.w / 2, y1, b.x + b.w * (isBy ? .35 : by && by.b === w.b ? .65 : .5), y2, y1 + (y2 - y1) * (isBy ? .34 : .66));
    }
    w.el.setAttribute("d", d);
    try {
      var L = w.el.getTotalLength(), p = [];
      for (var j = 0; j < 64; j++) { var pt = w.el.getPointAtLength(L * j / 63); p.push([pt.x, pt.y]); }
      w.pts = p;
    } catch (e) { w.pts = null; }
  }
  function label(t, w) { var p = w && w.pts && w.pts[32]; if (t && p) { t.setAttribute("x", p[0]); t.setAttribute("y", p[1] - 6); } }
  function geo() {
    if (!nodes.length) return;
    wires.forEach(function (w) { path(w); });
    if (by) { path(by, 1); label(lr, wires[by.a]); label(lq, by); }
    if (pkAt && pkAt[0].pts) pks[0].style.transform = tf(pkAt[0].pts[pkAt[1]]);
  }

  /* ---------- packet ---------- */
  function tf(p) { return "translate(" + (p[0] - 4) + "px," + (p[1] - 4) + "px)"; }
  function pkStart() { var w = wires[0]; if (!w || !w.pts) return; pkAt = [w, 0]; pks[0].style.transform = tf(w.pts[0]); pks[0].style.opacity = "1"; }
  function pkOff() {
    var p = pks[0];
    if (p.style.opacity === "1") A(p, [{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: "backwards" });
    p.style.opacity = "0"; pkAt = null;
  }
  function ride(w, delay) {
    if (!w || !w.pts) return null;
    w.el.classList.add("lit");
    var pts = w.pts, a0 = null;
    pks.forEach(function (el, e) {
      var kf = pts.map(function (p, j) { return { transform: tf(p), opacity: e ? (j > 61 ? 0 : .55 - e * .2) : 1 }; });
      if (!e) { el.style.transform = tf(pts[63]); el.style.opacity = "1"; }
      var a = A(el, kf, { duration: 600, easing: EASE, delay: (delay || 0) + e * 70, fill: "backwards" });
      if (!e) a0 = a;
    });
    pkAt = [w, 63];
    return a0;
  }

  /* ---------- node states and inspector ---------- */
  function res(k, s, g) {
    var b = s === B;
    if (k === "trigger") return [s.who + " sent a request", s.pay];
    if (k === "sort") return [s.sort, [["Sorted as", s.type], ["Summary", s.sort]]];
    if (k === "branch") return s === SC.angry ? ["Unhappy customer. You reply.", [["Path", "Unhappy customer"], ["Next", "Goes to you. Nothing is drafted or sent."]], "wait"] :
      [s.type, [["Path", s.type], ["Not taken", b ? "Just a question" : "Repair"]]];
    if (k === "bays") return b ? ["Sat 9:00 AM open", [["Day", "Sat Nov 7"], ["Open", "9:00 AM, bay 2"], ["Source", "Shop calendar (sample)"]]] : ["Skipped", [["Path", "Questions skip the calendar"]], "dim"];
    if (k === "draft") return ["Draft ready for you", [["To", s.email], ["Draft", s.draft, 1]]];
    if (k === "gate") return g ? ["Approved by you", [["Status", "Approved by you"], ["Next", "OK to send"]], "ok"] : ["Waiting for you", [["Status", "Waiting for you"], ["Holds", "Anything a customer will read"]], "wait"];
    if (CF[k]) return g ? ["Sent (sample)", [["To", k === "send" ? s.email : s.ph], ["Status", "Sent (sample)"]], "ok"] : ["Stopped: needs your OK", [["Status", "Stopped before sending"], ["Why", "No approval before this step"]], "wait"];
    if (k === "follow") return ["Sat Nov 7, 9:00 AM", [["Follow-up", "Sat Nov 7, 9:00 AM, if no answer"], ["Then", "Add " + s.who + " to the customer list"]], "ok"];
    if (k === "cal") return b ? ["Hold: Sat 9:00 AM, bay 2", [["Calendar", "Hold for Sat Nov 7, 9:00 AM (sample)"]]] : ["Nothing to book", [["Calendar", "No visit asked for"]]];
    if (k === "inv") return b ? ["Draft saved. Not sent.", [["Invoice", "Brake inspection, draft"], ["Status", "Draft only. You check it and send it."]]] : ["Nothing to bill", [["Invoice", "No work asked for"]]];
    if (k === "file") return ["Saved to Customers / " + s.who, [["File", "quote-request.pdf"], ["Folder", "Customers / " + s.who]]];
    if (k === "sheet") return ["Row added to Quotes log", [["Sheet", "Quotes log (sample)"], ["Row", s.who + ", " + s.sort]]];
    return ["Alert sent to your phone", [["To", "Your phone only"], ["Says", "New request from " + s.who]]];
  }
  function out(i, t, c) {
    var li = nodes[i]; if (!li) return;
    li.classList.remove("got", "wait", "ok", "dim"); li.classList.add(c || "got");
    li.querySelector(".no").textContent = t;
  }
  function ins(i, rows) {
    iname.textContent = i < 0 ? "Nothing running yet" : "Step " + (i + 1) + " of " + flow.length + ": " + K[flow[i].k][1];
    idl.innerHTML = rows.map(function (r) {
      return "<dt" + (r[2] ? ' class="wd"' : "") + ">" + esc(r[0]) + "</dt><dd" + (r[2] ? ' class="wd paper"' : "") + ">" + esc(r[1]) + "</dd>";
    }).join("");
    A(idl, [{ opacity: 0 }, { opacity: 1 }], { duration: 180, fill: "backwards" });
  }
  function info(i) { if (flow[i]) ins(i, rowsAt[i] || [["Does", K[flow[i].k][3]]]); }
  function dis(b, x) { b.setAttribute("aria-disabled", String(!!x)); }
  function editState() {
    var o = flow[sel], t = o ? K[o.k][1] : "";
    palB.textContent = t || "the last step";
    dis(mvU, !o || sel < 2); dis(mvD, !o || sel < 1 || sel >= flow.length - 1);
    rmB.hidden = !o || !!LOCK[o.k];
    mvU.setAttribute("aria-label", "Move " + t + " up"); mvD.setAttribute("aria-label", "Move " + t + " down"); rmB.setAttribute("aria-label", "Remove " + t);
  }
  function act(i) {
    sel = i;
    nodes.forEach(function (li, j) {
      li.classList.toggle("act", j === i);
      if (j === i) li.firstChild.setAttribute("aria-current", "step"); else li.firstChild.removeAttribute("aria-current");
    });
    if (nodes[i]) A(nodes[i].firstChild, [{ transform: "scale(.97)" }, { transform: "none" }], { duration: 200, fill: "backwards" });
    editState();
  }
  function show(i, s, g) { var r = res(flow[i].k, s, g); rowsAt[i] = r[1]; act(i); out(i, r[0], r[2]); ins(i, r[1]); return r; }
  function dimPath(i, s) {
    if (!by || by.a !== i) return;
    if (s === B) { by.el.classList.add("dim"); lq.classList.add("dim"); }
    else { wires[i].el.classList.add("dim"); wires[i + 1].el.classList.add("dim"); lr.classList.add("dim"); out(i + 1, "Skipped", "dim"); }
  }
  function stopRest(i) {
    nodes.forEach(function (li, j) { if (j > i) li.classList.add("dim"); });
    wires.concat(by || []).forEach(function (w) { if (w.a >= i) w.el.classList.add("dim"); });
  }
  function clearRun() {
    runTok++; wait = null; ap.hidden = true; rowsAt = []; pkOff();
    nodes.forEach(function (li, i) { li.classList.remove("act", "got", "wait", "ok", "dim"); li.querySelector(".no").textContent = K[flow[i].k][2]; });
    [].forEach.call(svg.querySelectorAll(".lit,.dim"), function (e) { e.classList.remove("lit", "dim"); });
  }
  function unsafe() {
    for (var i = 0, g = 0; i < flow.length; i++) { if (flow[i].k === "gate") g = 1; else if (CF[flow[i].k] && !g) return i; }
    return -1;
  }
  function guardCheck() { var u = unsafe() >= 0; guardP.hidden = !u; return u; }

  /* ---------- visitor test runs (chained on animation finish, no timers) ---------- */
  function hop(i, s, tok, g) {
    var skip = by && by.a === i && s !== B, w = skip ? by : wires[i], j = skip ? i + 2 : i + 1;
    then(ride(w, 260), function () { at(j, s, tok, g); });
  }
  function at(i, s, tok, g) {
    if (tok !== runTok || !flow[i]) return;
    var k = flow[i].k, m = "Step " + (i + 1) + " of " + flow.length + ": ", r;
    if (k === "bays" && s !== B) { out(i, "Skipped", "dim"); return hop(i, s, tok, g); }
    r = show(i, s, g);
    if (CF[k] && !g) { stopRest(i); guardP.hidden = false; return C.say(m + "stopped. " + GUARD); }
    if (k === "gate" && !g) { ap.hidden = false; wait = { i: i, s: s, tok: tok }; return C.say(m + "waiting for your approval."); }
    if (k === "branch") {
      if (s === SC.angry) { stopRest(i); return C.say(m + "unhappy customer. You reply."); }
      dimPath(i, s);
    }
    if (i >= flow.length - 1) return C.say(m + "done. " + r[0] + ".");
    hop(i, s, tok, g);
  }
  function run(s) { clearRun(); var tok = runTok; show(0, s); pkStart(); hop(0, s, tok, false); }
  function approve() {
    if (!wait) return;
    var w = wait; wait = null;
    if (nodes[w.i]) nodes[w.i].firstChild.focus();
    ap.hidden = true; show(w.i, w.s, true); C.say("Approved by you.");
    hop(w.i, w.s, w.tok, true);
  }

  /* ---------- editing ---------- */
  function rebuild(s, msg) {
    render(true); clearRun();
    var u = guardCheck();
    act(s); info(s);
    if (nodes[s]) A(nodes[s].firstChild, [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 200, fill: "backwards" });
    C.say(msg + (u ? " " + GUARD : ""));
  }
  function move(d) {
    var i = sel, j = i + d, o = flow[i];
    if (!o || i < 1 || j < 1 || j >= flow.length) return;
    flow[i] = flow[j]; flow[j] = o;
    rebuild(j, "Moved " + K[o.k][1] + " to step " + (j + 1) + " of " + flow.length + ".");
  }
  function remove() {
    var o = flow[sel];
    if (!o || LOCK[o.k]) return;
    flow.splice(sel, 1); rebuild(sel - 1, "Removed " + K[o.k][1] + ".");
    if (rmB.hidden && nodes[sel]) nodes[sel].firstChild.focus();
  }
  function add(k) {
    if (flow.length > 11) return C.say("This demo holds 12 steps. Remove one first.");
    var i = (sel < 0 ? flow.length - 1 : sel) + 1;
    flow.splice(i, 0, mk(k));
    rebuild(i, "Added " + K[k][1] + " as step " + (i + 1) + " of " + flow.length + ".");
  }
  function fixGate() {
    var gi = -1, g, u;
    flow.forEach(function (o, i) { if (o.k === "gate") gi = i; });
    if (gi < 0 && flow.length > 11) return C.say("Remove a step first. This demo holds 12 steps.");
    g = gi < 0 ? mk("gate") : flow.splice(gi, 1)[0];
    u = unsafe(); flow.splice(u < 0 ? flow.length : u, 0, g); u = flow.indexOf(g);
    rebuild(u, "You approve is back at step " + (u + 1) + ". Nothing reaches a customer without your OK.");
    nodes[u].firstChild.focus();
  }

  stage.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("button") : null;
    if (!t || !stage.contains(t) || !C) return;
    if (t.classList.contains("node")) { var i = nodes.indexOf(t.parentNode); act(i); info(i); return; }
    if (t.getAttribute("aria-disabled") === "true") return;
    var d = t.dataset;
    if (d.mv) move(+d.mv);
    else if (d.rm) remove();
    else if (d.add) add(d.add);
    else if (d.run) run(SC[d.run]);
    else if (t.hasAttribute("data-reset")) { flow = BASE.map(mk); rebuild(7, "Back to the 8 starting steps."); }
    else if (t === ap) approve();
    else if (t.classList.contains("gfix")) fixGate();
  });

  /* ---------- autoplay ---------- */
  function arr(i, g) {
    var r = show(i, B, g);
    C.say("Step " + (i + 1) + " of 8: " + (r[2] === "wait" ? "waiting for your approval." : K[flow[i].k][1] + ". " + r[0] + "."));
  }
  function assemble() {
    nodes.forEach(function (li, i) {
      li.classList.add("on");
      A(li.firstChild, [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 200, delay: i * 120, fill: "backwards" });
    });
    wires.concat(by || []).forEach(function (w, i) {
      w.el.classList.add("on");
      A(w.el, [{ strokeDashoffset: "1" }, { strokeDashoffset: "0" }], { duration: 400, delay: 200 + (w === by ? 2.5 : i) * 160, easing: "linear", fill: "backwards" });
    });
    [].forEach.call(svg.querySelectorAll(".wl"), function (t) { t.classList.add("on"); A(t, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: 900, fill: "backwards" }); });
    built = true;
  }
  var steps = [{ d: 100, run: assemble }, { d: 1600, run: function () { arr(0); pkStart(); } }];
  for (var n = 1; n < 8; n++) (function (i) {
    steps.push({ d: i === 1 ? 300 : i === 5 ? 600 : 400, run: function (c) { if (i === 6) c.hideCursors(); ride(wires[i - 1]); } });
    steps.push({ d: 600, run: function () {
      arr(i, i > 5);
      if (i === 2) dimPath(2, B);
      if (i === 5) { ap.hidden = false; wait = { i: 5, s: B, tok: runTok }; }
    } });
    if (i === 5) steps.push(
      { d: 500, run: function (c) { c.cursor("you", ap); } },
      { d: 800, run: function (c) { c.press("you"); } },
      { d: 100, run: function () { wait = null; ap.hidden = true; arr(5, 1); } }
    );
  })(n);
  steps.push({ d: 800, run: pkOff });

  function reset(ctx) {
    C = ctx; Q = true; built = false;
    flow = BASE.map(mk); render(false); clearRun(); guardCheck(); act(-1);
    ins(-1, [["Shop", "Flint Row Auto Care (sample)"], ["Town", "Siloam Springs"], ["Watching", "Website quote form"]]);
    Q = false;
  }
  function finalState(ctx) {
    C = ctx; Q = true; clearRun(); vis(); guardCheck();
    for (var i = 0; i < flow.length && i < 8; i++) show(i, B, i > 4);
    wires.forEach(function (w) { w.el.classList.add("lit"); });
    dimPath(2, B); act(flow.length - 1);
    built = true; Q = false;
  }
  function onHandoff(ctx) {
    C = ctx;
    if (!built) finalState(ctx);
    if (sel < 0) act(flow.length - 1); else editState();
  }

  RH.demo({ root: root, title: "Automation builder", loops: 2, steps: steps, reset: reset, finalState: finalState, onHandoff: onHandoff });

  // wire geometry follows layout changes only (debounced), never scroll
  if (window.ResizeObserver) { var rt = 0; new ResizeObserver(function () { clearTimeout(rt); rt = setTimeout(geo, 100); }).observe(flowEl); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(geo);
})();
