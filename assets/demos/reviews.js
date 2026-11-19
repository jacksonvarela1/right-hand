/* Prototype 08: every review gets a reply in your voice. Juniper Street Tacos, Lowell (made-up shop, made-up reviews, sample data).
   Three reviews came in overnight. Right Hand drafts a reply to the five-star and the three-star from the owner's voice card,
   a person on the team checks each draft, and only the You cursor (or the visitor) approves. The one-star mentions a double
   charge, so it is never drafted to completion: it goes to the owner as Needs you, with two honest options.
   Right Hand never writes reviews. It drafts replies to real ones, and nothing posts until the owner says so.
   Uses the shared player (assets/demo-player.js). Nothing here measures the page to lay itself out: every pane and every tone
   variant shares a grid cell in reviews.css, so the stage keeps its height and the demo is right even when its panel starts
   out hidden. The one layout read is on a visitor's own press: is the top of what just opened on screen? (On a phone the
   workbench sits under the list, so the page follows the press.)
   Nothing the visitor types is stored or sent. The "voice check" is a plain word list, not a live AI.
   On phones the stage shows one part at a time (views "list", "reply", "voice"): opening a review puts its reply where
   the list was, so nothing has to be scrolled to. */
(function () {
  "use strict";
  var root = document.getElementById("demo-reviews");
  if (!root || !window.RH || !RH.demo) return;
  var stage = root.querySelector(".stage");
  if (!stage) return;

  var esc = RH.util.esc, CK = RH.util.CHECK, EO = "cubic-bezier(.23,1,.32,1)";
  var LAND = window.CSS && CSS.supports && CSS.supports("animation-timing-function", "linear(0, 1)") ? "linear(0,.13 6%,.45 13%,.78 20%,.97 27%,1.04 34%,1.05 40%,1.03 48%,1.005 60%,.998 75%,1)" : EO;
  var SIGN = "Marisol, Juniper Street Tacos";
  // the voice card the owner approved (sample). The chips light up when the draft on screen uses them.
  var SAYS = ["thank you for telling me", "come see us", "y'all"];
  var NEVER = ["valued customer", "any inconvenience", "unfortunately"];
  // an offer is the owner's to make. If the visitor types one, the stage says so; Right Hand's drafts never contain one.
  var OFFER = /\b(refund\w*|money back|freebie\w*|on the house|comped|discount\w*|half off|coupon\w*|voucher\w*|gift cards?|free (?:tacos?|meals?|orders?|lunch|dinner|drinks?))\b/gi;
  var NOPE = new RegExp("\\b(" + NEVER.join("|") + ")\\b", "gi");
  var CHIP = { "new": "New", ready: "Draft ready", needs: "Needs you", posted: "Posted (sample)", held: "Your call first" };
  var TRACE = ["Never argues.", "Never offers a refund or a freebie for you.", "Never writes or asks for a fake review.", "Anything about safety or money goes to you first."];
  var STAR = "M10 1.9l2.47 5.02 5.53.8-4 3.9.94 5.5L10 14.5l-4.94 2.62.94-5.5-4-3.9 5.53-.8z";
  var IC = {
    call: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 3h3l1.5 4-2 1.2a9 9 0 0 0 5.3 5.3l1.2-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5C9 17 3 11 2.5 4.6A1.5 1.5 0 0 1 4 3z"/></svg>',
    reply: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 4.5h13v8.5H9l-4 3.5V13H3.5z"/></svg>',
    go: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M1.6 6h8.2M6.3 2.3 10 6l-3.7 3.7"/></svg>'
  };
  // q = the review; [k|phrase] marks a phrase the draft answers. v = the prepared drafts by tone: "" as drafted, s shorter,
  // w warmer, sw both. The same [k|phrase] marks in a draft show where it answers. ck = what the person on the team checked.
  var REV = [
    {
      n: "Tasha R.", st: 5, t: "Fri 9:52 PM", d: "Fri Nov 13, 9:52 PM", dt: "2026-11-13T21:52",
      q: "Came by after the game and the line moved fast. The [a|birria was still hot], and the man at the window [b|remembered I don't do onions]. Best [c|green salsa] in Lowell.",
      ck: "Tone and facts. Beto worked Friday (sample).",
      v: {
        "": "Tasha, thank you. That was Beto at the window, and [b|he remembers everybody's order]. [a|The birria stays on the heat] right up to close, and [c|the green salsa gets made fresh every morning]. Come see us after the next game.\n" + SIGN,
        s: "Thank you, Tasha. [b|Beto remembers everybody], and [c|the green salsa is fresh every morning]. Come see us after the next game.\n" + SIGN,
        w: "Tasha, you made our Saturday. I told Beto, and [b|he's proud he got the onions right]. [a|The birria stays on the heat] until close for y'all coming in after the game, and [c|the green salsa is my mother's recipe]. Come see us next home game.\n" + SIGN,
        sw: "Tasha, you made our Saturday. [b|Beto's proud he got the onions right], and [c|the green salsa is my mother's recipe]. Come see us next home game, y'all.\n" + SIGN
      }
    },
    {
      n: "Owen M.", st: 3, t: "Fri 11:20 PM", d: "Fri Nov 13, 11:20 PM", dt: "2026-11-13T23:20",
      q: "Tacos are great, the [a|al pastor] especially. But lunch was a [b|25 minute wait] and there's [c|nowhere to sit] while you stand there. Three stars until that's fixed.",
      ck: "Tone and facts. New cook starts Monday (sample).",
      v: {
        "": "Owen, thank you for telling me. Glad [a|the al pastor] landed. [b|Twenty-five minutes at lunch is too long], and you're right about it. A second cook starts on the lunch shift Monday, and [c|I'm working on a place to sit]. Come see us and tell me if it's better.\n" + SIGN,
        s: "Owen, thank you for telling me. [b|Twenty-five minutes is too long]. A second cook starts at lunch Monday, and [c|seating is next]. Come see us and tell me if it's better.\n" + SIGN,
        w: "Owen, thank you for telling me, and for the kind word on [a|the al pastor]. [b|Twenty-five minutes on a lunch break is too long], and standing makes it worse. A second cook starts Monday, and [c|I'm working on a place for y'all to sit]. Come see us and tell me if it's better.\n" + SIGN,
        sw: "Owen, thank you for telling me. You're right, [b|twenty-five minutes on a lunch break is too long]. A second cook starts Monday, and [c|I'm finding y'all a place to sit]. Come see us and tell me if it's better.\n" + SIGN
      }
    },
    {
      n: "Brett L.", st: 1, t: "Sat 6:14 AM", d: "Sat Nov 14, 6:14 AM", dt: "2026-11-14T06:14",
      q: "Waited [a|35 minutes] for two tacos, got the [b|wrong order], and my card was [c|charged twice]. Nobody at the window seemed to care. Won't be back.",
      ck: "Tone and facts. No offer made. That stays yours.",
      v: {
        "": "Brett, thank you for telling me, and I'm sorry. [a|Thirty-five minutes for two tacos is too long], and [b|the wrong order] on top of it is our mistake. [c|I'm looking into the charge myself today]. I'd like the chance to do it right, so ask for me at the window next time.\n" + SIGN,
        s: "Brett, I'm sorry. [a|Thirty-five minutes] and [b|the wrong order] is not how we do it, and [c|I'm looking into the charge myself today]. Ask for me at the window next time.\n" + SIGN,
        w: "Brett, thank you for telling me, and I'm sorry we let you down. [a|Thirty-five minutes for two tacos is too long], and [b|the wrong order] after that wait is ours to fix. [c|I'm looking into the charge myself today]. Ask for me at the window next time and I'll take your order myself.\n" + SIGN,
        sw: "Brett, I'm sorry we let you down. [a|Thirty-five minutes] and [b|the wrong order] were our mistake, and [c|I'm looking into the charge myself today]. Ask for me at the window next time.\n" + SIGN
      }
    }
  ];
  // the private note for the call: what the shop's own records show about the visit (sample)
  var NOTE = [
    ["Visit", "Fri Nov 13, 12:41 PM, ticket 0417"],
    ["Ordered", "2 carnitas tacos. Rung up as 2 chicken."],
    ["Wait", "34 minutes, 12:41 PM to 1:15 PM"],
    ["Charge", "$9.50 at 12:41 PM and again at 12:42 PM"],
    ["Phone", "(479) 555-0164, from the order"]
  ];
  var TONES = ["", "s", "w", "sw"], TONE_SAY = { "": "as first drafted", s: "shorter", w: "warmer", sw: "shorter and warmer" };

  var X, wrap, st, E, tok = 0, quiet = 0;

  /* ---------- text helpers ---------- */
  function plain(s) { return s.replace(/\[\w\|([^\]]+)\]/g, "$1"); }
  function keys(s) { var o = {}; s.replace(/\[(\w)\|([^\]]+)\]/g, function (m, k, t) { o[k] = t; return m; }); return o; }
  // phones type a curly apostrophe; it is one character either way, so positions still line up
  function straight(s) { return s.replace(/[\u2018\u2019]/g, "'"); }
  function norm(s) { return straight(s).toLowerCase(); }
  function draft(i) { return REV[i].v[st.r[i].tone]; }
  // every place a pattern turns up in the text (both patterns are global, so each search starts again from the top)
  function finds(re, text) { var out = [], m; re.lastIndex = 0; while ((m = re.exec(text))) out.push(m); return out; }
  function flags(text) {
    var n = finds(NOPE, straight(text));
    return { never: n.length ? n[0][0].toLowerCase() : "", offer: finds(OFFER, text).length > 0 };
  }
  // where to highlight in the reply: phrases that answer the review (k), and anything the voice card or the rules flag (no)
  function ranges(i, text) {
    var out = [], ks = keys(draft(i));
    function add(a, b, k, c) { for (var j = 0; j < out.length; j++) if (a < out[j].b && b > out[j].a) return; out.push({ a: a, b: b, k: k, c: c }); }
    finds(NOPE, straight(text)).concat(finds(OFFER, text)).forEach(function (m) { add(m.index, m.index + m[0].length, "", "no"); });
    Object.keys(ks).forEach(function (k) { var a = text.indexOf(ks[k]); if (a >= 0) add(a, a + ks[k].length, k, ""); });
    return out.sort(function (x, y) { return x.a - y.a; });
  }
  function A(el, kf, o) {
    if (quiet || !X || !el) return null;
    if (RH.motionOff()) o.delay = 0;
    return X.anim(el, kf, o);
  }

  /* ---------- markup (built on every reset; state lives in st, the DOM follows it in paint) ---------- */
  function stars(n) {
    var h = '<span class="rv-stars" role="img" aria-label="' + n + ' out of 5 stars"><svg viewBox="0 0 104 20" aria-hidden="true">';
    for (var k = 0; k < 5; k++) h += '<path' + (k < n ? "" : ' class="o"') + ' transform="translate(' + k * 21 + ')" d="' + STAR + '"/>';
    return h + "</svg></span>";
  }
  function quote(i) {
    var n = 0;
    return esc(REV[i].q).replace(/\[(\w)\|([^\]]+)\]/g, function (m, k, t) {
      return '<button type="button" class="rv-m" data-k="' + k + '" style="--i:' + n++ + '" aria-pressed="false" aria-describedby="drv-d' + k + i + '"><i></i>' + t + "</button>";
    });
  }
  function editor(i) {
    return '<div class="rv-ed">' +
      '<div class="rv-eh"><label for="drv-t' + i + '">Draft reply</label><span class="rv-by">AI draft<span>, from the voice card</span></span>' +
      '<div class="rv-tone" role="group" aria-label="Tone of the draft"><button type="button" class="chip" data-tone="s" aria-pressed="false">Shorter</button><button type="button" class="chip" data-tone="w" aria-pressed="false">Warmer</button></div>' +
      '<p class="rv-stamp" aria-hidden="true">Posted<small>sample, approved by you</small></p></div>' +
      // one grid cell: the highlights, a hidden copy of each tone (they size the box), and the text area on top
      '<div class="rv-box"><div class="rv-bd" aria-hidden="true"></div>' +
      TONES.map(function (k) { return '<div class="rv-sz" aria-hidden="true">' + esc(plain(REV[i].v[k])) + " </div>"; }).join("") +
      '<textarea id="drv-t' + i + '" data-i="' + i + '" rows="1" spellcheck="false" autocomplete="off" aria-describedby="drv-nt' + i + '"></textarea></div>' +
      '<p class="rv-note" id="drv-nt' + i + '"></p></div>';
  }
  function pane(i) {
    var r = REV[i];
    return '<article class="rv-pane" data-p="' + i + '" data-path="" aria-labelledby="drv-n' + i + '">' +
      '<div class="rv-rh"><h4 id="drv-n' + i + '" tabindex="-1">' + r.n + "</h4>" + stars(r.st) + '<span class="rv-chip"></span>' +
      '<p class="rv-when"><time datetime="' + r.dt + '">' + r.d + "</time> · Review site (sample)</p></div>" +
      '<blockquote class="rv-q">' + quote(i) + '</blockquote><p class="rv-cap"></p>' +
      (i < 2 ? editor(i) :
        // the three states of the one-star share one cell: the two options with the rule beside them, the private note, the careful draft
        '<div class="rv-alt"><div class="rv-need" role="group" aria-labelledby="drv-need"><p class="rv-nh" id="drv-need"><b>Needs you</b><span>Right Hand did not draft a reply to this one.</span></p>' +
        '<p class="rv-why"><b>The rule</b><span>Anything about safety or money goes to you first. This one says <q>charged twice</q>.</span></p>' +
        '<div class="rv-opts"><button type="button" class="rv-opt" data-path="call">' + IC.call + "<b>Call the customer first</b><span>A private note with the visit details. The public reply is held.</span><em>See the note" + IC.go + "</em></button>" +
        '<button type="button" class="rv-opt" data-path="reply">' + IC.reply + "<b>Reply and invite them back</b><span>A careful draft opens. You edit it and approve it.</span><em>Open the draft" + IC.go + "</em></button></div>" +
        '<p class="rv-nf">Either way, nothing posts until you say so.</p></div>' +
        '<div class="rv-pn"><p class="rv-ph" tabindex="-1"><b>Private note for your call</b><span>Only you see this.</span></p><dl>' +
        NOTE.map(function (x) { return "<div><dt>" + x[0] + "</dt><dd>" + x[1] + "</dd></div>"; }).join("") +
        '</dl><p class="rv-pf">From your order screen and card reader (sample). A refund is yours to offer. Right Hand never offers one for you.</p>' +
        '<p class="rv-stamp hold" aria-hidden="true">Held<small>until you call</small></p></div>' +
        editor(i) + "</div>") +
      '<div class="rv-ft"><p class="rv-ck"><span class="rv-ckb">' + CK + "</span><b></b><small></small></p>" +
      '<div class="rv-act"><button type="button" class="btn sm rv-go"></button><button type="button" class="btn sm ghost rv-sw" hidden></button><button type="button" class="btn sm ghost rv-next" hidden></button></div></div>' +
      '<div class="sr-only"><span id="drv-da' + i + '"></span><span id="drv-db' + i + '"></span><span id="drv-dc' + i + '"></span></div></article>';
  }
  function fresh() {
    st = { sel: -1, pin: "", hit: [0, 0, 0, 0], r: REV.map(function () { return { on: 0, s: "", seen: 0, typed: 0, typing: 0, ck: 0, tone: "", text: "", path: "" }; }) };
  }
  function build() {
    wrap.innerHTML = '<p class="rv-tg">Made-up taco shop · made-up reviews</p>' +
      '<div class="rv-g">' +
      '<section class="rv-in" aria-labelledby="drv-in"><h4 id="drv-in">New reviews <span>3 overnight</span></h4><ol class="rv-list">' +
      REV.map(function (r, i) {
        return '<li data-i="' + i + '"><button type="button" class="rv-card paper" aria-controls="drv-bench" aria-current="false">' + stars(r.st) + '<span class="rv-chip"></span>' +
          '<span class="rv-who">' + r.n + "<small>" + r.t + '</small></span><span class="rv-ex">' + esc(plain(r.q)) + '</span><span class="rv-beam" aria-hidden="true"><i></i></span></button></li>';
      }).join("") + "</ol></section>" +
      '<section class="rv-bench paper" id="drv-bench" aria-label="Reply workbench"><div class="rv-panes">' +
      '<div class="rv-idle"><p class="rv-it"><time datetime="2026-11-14T07:05">Sat Nov 14, 7:05 AM</time></p><p class="rv-ih">Three new reviews overnight.</p><p>Right Hand reads each one before the shop opens. It only replies. It never writes a review.</p></div>' +
      pane(0) + pane(1) + pane(2) + "</div>" +
      '<aside class="rv-voice" aria-labelledby="drv-vh"><h4 id="drv-vh">Voice card <span class="tag">Sample</span></h4>' +
      '<p class="rv-vs">How Marisol, the owner, writes. She approved it. Every draft starts here.</p><dl>' +
      '<div><dt>Signs off</dt><dd><span class="rv-v" data-v="' + esc(SIGN) + '">' + esc(SIGN) + "</span></dd></div>" +
      "<div><dt>Says</dt><dd>" + SAYS.map(function (w) { return '<span class="rv-v" data-v="' + esc(w) + '">' + esc(w) + "</span>"; }).join("") + "</dd></div>" +
      "<div><dt>Never says</dt><dd>" + NEVER.map(function (w) { return '<span class="rv-v no" data-v="' + esc(w) + '">' + esc(w) + "</span>"; }).join("") + "</dd></div>" +
      '</dl><p class="rv-vk"><span><i></i>in this draft</span><span class="no"><i></i>flagged if typed</span></p></aside>' +
      '<p class="rv-sum"><span class="rv-boxes" aria-hidden="true"><i></i><i></i><i></i></span><b></b> <span class="rv-sd"></span></p></section>' +
      '<div class="rv-trace"><h4>How it decided</h4><ul>' + TRACE.map(function (t) { return "<li><i></i>" + t + "</li>"; }).join("") + "</ul></div></div>";
    E = { li: all(".rv-list li"), bench: one(".rv-bench"), idle: one(".rv-idle"), voice: all(".rv-voice .rv-v"), sum: one(".rv-sum"), boxes: all(".rv-boxes i"), tr: all(".rv-trace li") };
    E.p = all(".rv-pane").map(function (p) {
      function g(s) { return p.querySelector(s); }
      return { pane: p, h: g("h4"), chip: g(".rv-chip"), q: g(".rv-q"), cap: g(".rv-cap"), marks: [].slice.call(p.querySelectorAll(".rv-m")), ed: g(".rv-ed"), alt: g(".rv-alt"), ph: g(".rv-ph"), box: g(".rv-box"), bd: g(".rv-bd"), ta: g("textarea"),
        note: g(".rv-note"), tone: [].slice.call(p.querySelectorAll("[data-tone]")), ck: g(".rv-ck"), go: g(".rv-go"), sw: g(".rv-sw"), next: g(".rv-next"), rs: [] };
    });
    paint();
  }
  function one(s) { return wrap.querySelector(s); }
  function all(s) { return [].slice.call(wrap.querySelectorAll(s)); }

  /* ---------- the DOM follows the state ---------- */
  function tally() {
    var p = 0, h = 0;
    st.r.forEach(function (r) { if (r.s === "posted") p++; if (r.s === "held") h++; });
    return { n: p + h, head: (p + h) + " of 3 answered.", rest: (p ? p + " posted (sample)." : "") + (p && h ? " " : "") + (h ? "1 waiting on your call." : ""), text: (p + h) + " of 3 answered." + (p ? " " + p + " posted (sample)." : "") + (h ? " 1 waiting on your call." : "") };
  }
  function nextOpen(i) {
    for (var k = 1; k < 3; k++) { var j = (i + k) % 3, s = st.r[j].s; if (s !== "posted" && s !== "held") return j; }
    return -1;
  }
  // the highlights under the text area. upto = how much has been typed so far (autoplay), so a phrase lights when it is finished
  function back(i, text, upto) {
    var p = E.p[i], rs = ranges(i, text), h = "", at = 0;
    rs.forEach(function (x) {
      h += esc(text.slice(at, x.a)) + "<mark" + (x.k ? ' data-k="' + x.k + '"' : "") + ' data-b="' + x.b + '" class="' + x.c + (upto == null || x.b <= upto ? " on" : "") + '">' + esc(text.slice(x.a, x.b)) + "</mark>";
      at = x.b;
    });
    p.bd.innerHTML = h + esc(text.slice(at)) + " ";
    p.rs = rs;
  }
  function setText(i, text) {
    var r = st.r[i];
    r.text = text; r.typing = 0;
    E.p[i].ta.value = text;
    back(i, text);
  }
  function light(i, k) {
    var p = E.p[i];
    p.marks.forEach(function (b) {
      var bk = b.getAttribute("data-k");
      b.classList.toggle("lit", !!k && bk === k);
      b.setAttribute("aria-pressed", String(st.sel === i && !!st.pin && bk === st.pin));
    });
    [].forEach.call(p.bd.querySelectorAll("mark"), function (m) { m.classList.toggle("lit", !!k && m.getAttribute("data-k") === k); });
  }
  // a pinned phrase belongs to the review on screen: opening another one lets go of it, on both sides of every pair
  function unpin() { st.pin = ""; E.p.forEach(function (p, j) { light(j, ""); }); }
  function paint() {
    var t = tally(), sel = st.sel, cur = sel >= 0 ? st.r[sel] : null;
    st.r.forEach(function (r, i) {
      var li = E.li[i], p = E.p[i], s = r.s || "new", posted = r.s === "posted", has = r.typed && (i < 2 || r.path === "reply");
      var f = flags(r.text), edited = has && r.text !== plain(draft(i)), found = {}, ks = keys(draft(i)), nx = nextOpen(i), b, sm, lab, go = p.go;
      li.className = r.on ? "in" : ""; li.setAttribute("data-s", s);
      li.querySelector(".rv-chip").textContent = CHIP[s];
      li.firstChild.setAttribute("aria-current", String(sel === i));
      p.pane.className = "rv-pane" + (sel === i ? " on" : "") + (r.seen ? " seen" : "") + (posted ? " posted" : "") + (r.s === "held" ? " held" : "") + (has ? " has" : "");
      p.pane.setAttribute("data-s", s); p.pane.setAttribute("data-path", r.path);
      p.chip.textContent = CHIP[s];
      // the review side of each pair: lit when the draft still answers it, dashed when an edit dropped the answer
      p.rs.forEach(function (x) { if (x.k) found[x.k] = 1; });
      p.marks.forEach(function (m) {
        var k = m.getAttribute("data-k"), d = document.getElementById("drv-d" + k + i);
        m.disabled = !has;
        m.classList.toggle("off", !!has && !r.typing && !found[k]);
        if (d) d.textContent = !has ? "" : found[k] ? "The draft answers this with: " + ks[k] + "." : "The draft no longer answers this.";
      });
      p.cap.textContent = i === 2 && !has ? "Highlighted: why Right Hand stopped." : "Pick a highlight to see its answer.";
      p.tone.forEach(function (c) { c.setAttribute("aria-pressed", String(r.tone.indexOf(c.getAttribute("data-tone")) >= 0)); c.disabled = posted; });
      p.ta.readOnly = posted;
      p.note.className = "rv-note" + (posted ? " ok" : f.never || f.offer ? " warn" : "");
      p.note.textContent = posted ? "Posted (sample). Prototype only, nothing left this page." :
        f.never ? "\u201c" + f.never + "\u201d is on her never-says list." :
        f.offer ? "An offer is yours to make. Right Hand never adds one." :
        edited ? (r.text.replace(/\s+/g, "") ? "Your words now. A tone button swaps in a checked draft." : "Nothing to post. A tone button brings a draft back.") :
        "Edit anything. Nothing posts until you approve.";
      // both flags at once: the second one rides along where there is room for it (the narrowest phones keep to the first)
      if (!posted && f.never && f.offer) p.note.appendChild(document.createElement("span")).textContent = " An offer is yours to make.";
      // checked by a person on the team, unless the visitor has rewritten it since
      b = p.ck.querySelector("b"); sm = p.ck.querySelector("small");
      p.ck.className = "rv-ck" + (edited ? " mine" : r.ck ? " on" : "");
      b.textContent = edited ? "Your edit" : "Checked by Right Hand";
      sm.textContent = edited ? (posted ? "Not re-checked. Posted as you wrote it." : "Not re-checked. It posts as you wrote it.") :
        i < 2 || r.path === "reply" ? REV[i].ck : r.path === "call" ? "Visit matched to ticket 0417 (sample)." : "A person confirmed this one is yours.";
      // approved stays focusable (aria-disabled), so a keyboard Approve does not drop focus to the page
      // two buttons at most, always in the same two places: the owner's move, then the way on
      lab = posted ? "Approved" : i === 2 && !r.path ? "Pick an option above" : "Approve and post";
      if (p.lab !== lab) { p.lab = lab; go.innerHTML = (posted ? CK : "") + lab; }
      go.hidden = i === 2 && r.path === "call";
      go.disabled = !posted && (!has || (i === 2 && r.path !== "reply"));
      if (posted || (has && !r.text.replace(/\s+/g, ""))) go.setAttribute("aria-disabled", "true"); else go.removeAttribute("aria-disabled");
      // the one-star can change course until a reply is posted
      p.sw.hidden = i < 2 || !r.path || posted;
      p.sw.textContent = r.path === "call" ? "Reply instead" : "Call first instead";
      p.next.hidden = (i === 2 && r.path === "reply" && !posted) || (nx < 0 && t.n < 3);
      p.next.textContent = nx >= 0 ? "Next: " + REV[nx].n : "Start over";
      E.boxes[i].className = r.s === "posted" ? "ok" : r.s === "held" ? "held" : r.s === "needs" ? "warn" : "";
    });
    E.idle.className = "rv-idle" + (sel < 0 ? " on" : "");
    E.bench.setAttribute("data-s", cur ? cur.s || "new" : "");
    E.sum.className = "rv-sum" + (t.n === 3 ? " done" : "");
    E.sum.children[1].textContent = t.head; E.sum.lastChild.textContent = t.rest || "Nothing posts until you approve.";
    E.tr.forEach(function (li, k) { li.className = st.hit[k] ? "hit" : ""; });
    voice(cur && (sel < 2 || cur.path === "reply") ? (cur.typing ? E.p[sel].ta.value : cur.text) : "");
  }
  // the voice card lights what the draft on screen uses. Never-says words follow the same whole-word check as the flags
  function voice(text) {
    var low = norm(text), no = {};
    finds(NOPE, low).forEach(function (m) { no[m[0]] = 1; });   // low is lower case already, so the keys are too
    E.voice.forEach(function (v) {
      var w = norm(v.getAttribute("data-v"));
      v.classList.toggle("on", !!text && (v.classList.contains("no") ? !!no[w] : low.indexOf(w) >= 0));
    });
  }

  /* ---------- what Right Hand does ---------- */
  function arrive(i) {
    var r = st.r[i];
    if (r.on) return;
    r.on = 1; paint();
    A(E.li[i].firstChild, [{ opacity: 0, transform: "translateY(-10px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: EO, fill: "none" });
  }
  // read a review: the drafts can go ahead, the one about money stops for the owner
  function read(i) {
    var r = st.r[i], li = E.li[i];
    arrive(i);
    if (r.s) return;
    r.s = i === 2 ? "needs" : "ready";
    if (i === 2) st.hit[3] = 1;
    paint();
    A(li.querySelector(".rv-beam i"), [{ transform: "translateY(-100%)", opacity: 1 }, { transform: "none", opacity: 1, offset: .85 }, { transform: "none", opacity: 0 }], { duration: 520, easing: "linear", fill: "none" });
    A(li.querySelector(".rv-chip"), [{ opacity: 0, transform: "translateY(3px)" }, { opacity: 1, transform: "none" }], { duration: 240, delay: 380, easing: EO, fill: "backwards" });
  }
  function open(i) {
    var r = st.r[i];
    read(i);
    st.sel = i; unpin(); r.seen = 1;
    if (i === 2) r.ck = 1;
    paint();
    A(E.p[i].pane, [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: EO, fill: "none" });
  }
  // the draft types itself in on the player's clock, so pause and hand-off stay exact (same idea as the owner card in calls.js)
  function type(c, i) {
    var r = st.r[i], p = E.p[i], full = plain(draft(i)), T = Math.min(1500, full.length * 6), my = ++tok, a;
    if (r.typed) return;
    r.typed = 1; r.text = full;
    back(i, full, 0);
    a = RH.motionOff() ? null : c.anim(p.ta, [{ opacity: 1 }, { opacity: 1 }], { duration: T, easing: "linear" });
    if (!a) { setText(i, full); paint(); return; }
    r.typing = my; paint();
    (function f() {
      if (r.typing !== my || !p.ta.isConnected) return;
      var k = a.playState === "finished" ? 1 : Math.min(1, (a.currentTime || 0) / T), n = Math.ceil(full.length * k);
      p.ta.value = full.slice(0, n);
      [].forEach.call(p.bd.querySelectorAll("mark"), function (m) { if (+m.getAttribute("data-b") <= n) m.classList.add("on"); });
      voice(p.ta.value);
      // while the player holds the demo (off screen, page scrolling) there is nothing to draw: look again a few times a second
      if (k >= 1) { r.typing = 0; paint(); } else if (a.playState === "paused") setTimeout(f, 200); else requestAnimationFrame(f);
    })();
  }
  function check(i) { var r = st.r[i]; r.ck = 1; st.hit[i ? 0 : 2] = 1; paint(); }
  // finish whatever autoplay had started for this review, so the visitor always lands on a complete draft
  function ensure(i) {
    var r = st.r[i];
    read(i); r.seen = 1; r.ck = 1;
    if (i < 2) { if (!r.typed || r.typing) { r.typed = 1; setText(i, plain(draft(i))); } st.hit[i ? 0 : 2] = 1; }
  }

  /* ---------- what the owner does (the You cursor in autoplay, the visitor after hand-off) ---------- */
  function select(i) { ensure(i); st.sel = i; unpin(); paint(); }
  function tone(i, t, on) {
    var r = st.r[i], s = r.tone.indexOf("s") >= 0, w = r.tone.indexOf("w") >= 0;
    if (r.s === "posted" || !r.typed) return;
    if (t === "s") s = on == null ? !s : on; else w = on == null ? !w : on;
    r.tone = (s ? "s" : "") + (w ? "w" : "");
    setText(i, plain(draft(i))); paint();
    A(E.p[i].box, [{ opacity: .3 }, { opacity: 1 }], { duration: 280, easing: EO, fill: "none" });
  }
  function pop(i) {
    var all = tally().n === 3;
    [E.li[i].querySelector(".rv-chip"), E.p[i].chip].forEach(function (el) { A(el, [{ transform: "scale(.7)" }, { transform: "none" }], { duration: 360, easing: LAND, fill: "none" }); });
    // the box for this review lands, and when it is the last of the three, all three land one after the other
    E.boxes.forEach(function (el, k) { if (all || k === i) A(el, [{ transform: "scale(.5)" }, { transform: "none" }], { duration: 420, delay: all ? k * 110 : 0, easing: LAND, fill: "backwards" }); });
  }
  function approve(i) {
    var r = st.r[i];
    if (r.s === "posted" || !r.typed || (i === 2 && r.path !== "reply") || !r.text.replace(/\s+/g, "")) return false;
    r.s = "posted"; st.pin = ""; light(i, ""); paint(); pop(i);
    A(E.p[i].go.querySelector(".ck path"), [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 320, delay: 120, easing: EO, fill: "backwards" });
    return true;
  }
  // back to the visitor's first frame: three reviews read, the first draft open, nothing answered
  function over() {
    quiet = 1;
    fresh(); build();
    st.r.forEach(function (r, i) { read(i); });
    select(0);
    quiet = 0;
  }
  function choose(path) {
    var r = st.r[2];
    if (r.s === "posted") return;
    r.path = path; st.hit[1] = 1;
    if (path === "call") r.s = "held";
    else { r.s = "needs"; st.hit[0] = 1; if (!r.typed) { r.typed = 1; setText(2, plain(draft(2))); } }
    paint(); pop(2);
    A(E.p[2].pane.querySelector(path === "call" ? ".rv-pn" : ".rv-ed"), [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: EO, fill: "none" });
  }

  /* ---------- the script ---------- */
  var steps = [
    { d: 400, run: function () { arrive(0); } },
    { d: 360, run: function () { arrive(1); } },
    { d: 360, run: function () { arrive(2); } },
    { d: 700, run: function (c) { read(0); c.cursor("rh", E.li[0], { fx: .58, fy: .3 }); } },
    { d: 700, run: function (c) { read(1); c.cursor("rh", E.li[1], { fx: .58, fy: .3 }); } },
    { d: 700, run: function (c) { read(2); c.cursor("rh", E.li[2], { fx: .58, fy: .3 }); } },
    { d: 1000, run: function (c) { c.view("reply"); open(0); c.cursor("rh", E.p[0].box, { fx: .03, fy: 0, dy: 16 }); } },
    { d: 1100, run: function (c) { type(c, 0); c.cursor("rh", E.p[0].box, { fx: .03, fy: 1, dy: -34 }); } },
    { d: 1900, run: function (c) { check(0); c.cursor("rh", E.p[0].ck, { fx: 0, fy: 0, dx: 2, dy: -25 }); } },
    { d: 1100, run: function (c) { c.hideCursors(); c.cursor("you", E.p[0].tone[1]); } },
    { d: 750, run: function (c) { c.press("you"); tone(0, "w", true); } },
    { d: 1500, run: function (c) { c.cursor("you", E.p[0].go); } },
    { d: 750, run: function (c) { c.press("you"); ensure(0); approve(0); } },
    { d: 1500, run: function (c) { c.view("list"); c.cursor("you", E.li[2], { fx: .5, fy: .6 }); } },
    { d: 900, run: function (c) { c.press("you"); c.view("reply"); open(2); } },
    { d: 1500, run: function (c) { c.hideCursors(); c.say(tally().text + " The one-star is waiting for the owner. Your turn.", { force: true }); } }
  ];

  stage.innerHTML = '<div class="rv dark"></div>';
  wrap = stage.firstChild;
  // some phones pad the inside of a text area by 3px a side; the highlight layer gets the same so the two stay lined up
  if (/iP(hone|ad|od)/.test(navigator.userAgent) || (/Mac/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)) wrap.className += " rv-ios";

  RH.demo({
    root: root, title: "Review replies in your voice · Juniper Street Tacos", loops: 1, steps: steps,
    views: [{ k: "list", label: "Reviews" }, { k: "reply", label: "Reply" }, { k: "voice", label: "Voice card" }],
    reset: function (c) { X = c; fresh(); build(); c.hideCursors(); },
    finalState: function (c) {
      X = c; quiet = 1;
      fresh(); build();
      ensure(0); read(1); read(2);
      tone(0, "w", true); approve(0); open(2);
      quiet = 0;
    },
    // a mid-play hand-off finishes Right Hand's part (reading, the draft on screen); the owner's choices stay as they are
    onHandoff: function (c) {
      X = c; quiet = 1;
      st.r.forEach(function (r, i) { read(i); });
      ensure(st.sel < 0 ? (st.sel = 0) : st.sel);
      quiet = 0;
      paint();
    }
  });

  // the Pause motion switch stops the player where it stands. Whatever was mid-flight on this stage (a fade, the typing
  // clock) lands at once, so nothing is left half drawn; "Next step" then carries on from the same place
  document.addEventListener("rh:motion", function (e) {
    if (!e.detail || !e.detail.off || !stage.getAnimations) return;
    stage.getAnimations({ subtree: true }).forEach(function (a) { try { a.finish(); } catch (err) {} });
  });

  /* ---------- interactions (they only matter after hand-off; a trusted click hands off first) ---------- */
  function say(m) { X.say(m); }
  // is the top of the open review out of sight? On a phone the workbench sits under the list, and the page's own bar
  // covers the bottom edge of the screen, so "in sight" means in the upper part of it
  function away(el) { var r = el.getBoundingClientRect(); return r.top < 90 || r.top > innerHeight * .6; }
  // the keyboard goes to the top of what just opened (el), and the page follows if that is off screen
  function land(el, box) {
    el.focus({ preventScroll: true });
    if (away(el)) (box || el).scrollIntoView({ block: "start", behavior: RH.motionOff() ? "auto" : "smooth" });
  }
  function focusPane(i) { land(E.p[i].h, E.p[i].pane); }
  stage.addEventListener("click", function (e) {
    if (!X || !X.handedOff()) return;
    var b = e.target.closest ? e.target.closest("button") : null, i = st.sel, r, t, k;
    if (!b || !wrap.contains(b) || b.disabled) return;
    if (b.classList.contains("rv-card")) {
      i = +b.parentNode.getAttribute("data-i"); select(i); r = st.r[i];
      X.view("reply");   // phones: the reply takes the list's place
      // beside the list (wide screens) the review is already in view and the keyboard stays on the card
      if (away(E.p[i].h)) focusPane(i);
      say(REV[i].n + ", " + REV[i].st + " out of 5 stars. " + CHIP[r.s] + ". " + (r.s === "ready" ? "Edit the draft, change the tone, or approve." : r.s === "needs" && !r.path ? "Right Hand did not draft a reply. Pick how to handle it." : ""));
      return;
    }
    if (i < 0) return;
    r = st.r[i];
    if (b.classList.contains("rv-m")) {
      k = b.getAttribute("data-k"); st.pin = st.pin === k ? "" : k; light(i, st.pin);
      return;
    }
    if (b.hasAttribute("data-tone")) {
      k = r.text !== plain(draft(i));
      tone(i, b.getAttribute("data-tone"));
      say("Draft swapped: " + TONE_SAY[r.tone] + "." + (k ? " It replaced your edit with a checked draft." : "") + " Nothing posts until you approve.");
      return;
    }
    if (b.hasAttribute("data-path") || b === E.p[i].sw) {
      k = b === E.p[i].sw ? (r.path === "call" ? "reply" : "call") : b.getAttribute("data-path"); choose(k); t = tally();
      // the pressed button is gone or relabelled: put the keyboard at the start of what replaced it (the first tone button
      // of the draft, or the heading of the private note). On a phone that can be above the button that was pressed
      land(k === "reply" ? E.p[i].tone[0] : E.p[i].ph, E.p[i].alt);
      say(k === "call" ? "Private note drafted for your call. The public reply is held. " + t.text : "Careful draft opened. It makes no offer. Edit it, then approve.");
      return;
    }
    if (b === E.p[i].go) {
      if (b.getAttribute("aria-disabled")) { if (r.s !== "posted") say("Write a reply first."); return; }
      if (approve(i)) { t = tally(); say("Approved. Reply to " + REV[i].n + " posted (sample). Prototype only, nothing leaves this page. " + t.text); E.p[i].go.focus({ preventScroll: true }); }
      return;
    }
    if (b === E.p[i].next) {
      k = nextOpen(i);
      if (k < 0) { over(); focusPane(0); say("Started over. Three reviews, none answered yet."); }
      else { select(k); focusPane(k); say(REV[k].n + ", " + REV[k].st + " out of 5 stars. " + CHIP[st.r[k].s] + "."); }
    }
  });
  stage.addEventListener("input", function (e) {
    var t = e.target, i, r;
    if (!t || t.tagName !== "TEXTAREA" || !wrap.contains(t)) return;
    i = +t.getAttribute("data-i"); r = st.r[i];
    if (r.s === "posted") return;
    r.text = t.value; r.typing = 0;
    back(i, r.text);
    if (flags(r.text).offer) st.hit[1] = 1;
    paint(); caret(t);
  });
  // a phrase in the review lights its answer in the draft, and the caret or the pointer in the draft lights the phrase it answers
  function caret(t) {
    var i = +t.getAttribute("data-i"), n = t.selectionStart, k = "";
    E.p[i].rs.forEach(function (x) { if (x.k && n >= x.a && n <= x.b) k = x.k; });
    light(i, k || st.pin);
  }
  function hover(e, on) {
    var b = e.target.closest ? e.target.closest(".rv-m") : null;
    if (!b || b.disabled || st.sel < 0 || !X || !X.handedOff()) return;
    light(st.sel, on ? b.getAttribute("data-k") : st.pin);
  }
  stage.addEventListener("mouseover", function (e) { hover(e, true); });
  stage.addEventListener("mouseout", function (e) { hover(e, false); });
  stage.addEventListener("focusin", function (e) { hover(e, true); });
  stage.addEventListener("focusout", function (e) { hover(e, false); if (e.target.tagName === "TEXTAREA" && st.sel >= 0) light(st.sel, st.pin); });
  ["keyup", "click", "select"].forEach(function (ev) {
    stage.addEventListener(ev, function (e) { if (e.target.tagName === "TEXTAREA" && wrap.contains(e.target) && X && X.handedOff()) caret(e.target); });
  });
  stage.addEventListener("mousemove", function (e) {
    var t = e.target, i, els, k = "", j;
    if (t.tagName !== "TEXTAREA" || !wrap.contains(t) || !X || !X.handedOff() || document.activeElement === t || !document.elementsFromPoint) return;
    i = +t.getAttribute("data-i"); els = document.elementsFromPoint(e.clientX, e.clientY);
    for (j = 0; j < els.length; j++) if (els[j].tagName === "MARK" && E.p[i].bd.contains(els[j])) k = els[j].getAttribute("data-k") || "";
    light(i, k || st.pin);
  });
  stage.addEventListener("mouseleave", function () { if (st && st.sel >= 0 && E && document.activeElement && document.activeElement.tagName !== "TEXTAREA") light(st.sel, st.pin); });
})();
