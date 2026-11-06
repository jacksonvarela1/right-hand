// Right Hand NWA: writes services/index.html and about/index.html as static, crawlable HTML.
// The catalog comes from assets/services-data.js and the row labels from the services-render block in
// assets/site.js. The shared wording (logo, CSP, promises, data rules, check-up, steps, FAQ) is read from
// index.html, so neither page can drift from the home page. Edit those sources (or the page copy below),
// then run:  node tools/build-pages.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (f) => join(ROOT, f);
const SITE = "https://righthandnwa.com/";
const ORG = SITE + "#organization";
const must = (v, what) => { if (!v || (Array.isArray(v) && !v.length)) throw new Error("build-pages: could not find " + what); return v; };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const ldjson = (o) => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, "\\u003c") + "</script>";

/* ---------- 1. the catalog ---------- */
const win = {};
vm.runInNewContext(readFileSync(p("assets/services-data.js"), "utf8"), { window: win });
const S = must(win.RH_SERVICES, "window.RH_SERVICES in assets/services-data.js");
const ALL = S.lines.flatMap((l) => l.items.map((s) => ({ ...s, line: l })));

/* row and kind labels: the same ones the home page cards use */
let KIND = { ai: ["ai", "AI drafts, we check, you approve"], we: ["", "We do it"], pro: ["", "Stays with a licensed pro"] };
let ROWS = [["handoff", "You hand off"], ["back", "You get back"], ["ai", "Where AI helps"], ["person", "Where a person checks"], ["never", "What we never do"], ["example", "Example"]];
{
  const js = readFileSync(p("assets/site.js"), "utf8");
  const a = js.indexOf("/* services-render:start"), b = js.indexOf("/* services-render:end */");
  if (a >= 0 && b > a) { const R = vm.runInNewContext(js.slice(a, b) + "\nRENDER;", {}); KIND = must(R.KIND, "RENDER.KIND"); ROWS = must(R.ROWS, "RENDER.ROWS"); }
  else console.warn("build-pages: services-render block not found in assets/site.js, using built-in labels");
}
const ICON = { receipt: "i-receipt", chat: "i-chat", calendar: "i-cal", folder: "i-folder", chip: "i-chip", pin: "i-pin" };
const lineId = (l) => slug(l.name);

/* ---------- 2. shared wording from index.html ---------- */
const html = readFileSync(p("index.html"), "utf8");
const grab = (re, what) => must(html.match(re), what + " in index.html")[1];
const local = (s) => s.replace(/href="#(?!i-)/g, 'href="/#').replace(/\sdata-reveal(="[^"]*")?/g, "").replace(/\sstyle="--i:\d+"/g, "").replace(/\sdata-go="[^"]*"/g, "");
const text = (s) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

const CSP = grab(/(<meta http-equiv="Content-Security-Policy"[^>]*>)/, "CSP meta");
const REFERRER = grab(/(<meta name="referrer"[^>]*>)/, "referrer meta");
const OG_ALT = grab(/<meta property="og:image:alt" content="([^"]*)"/, "og:image:alt");
const MARK = grab(/<a class="lockup"[^>]*>\s*(<svg class="mark"[\s\S]*?<\/svg>)/, "logo mark");
const SYMBOLS = Object.fromEntries([...html.matchAll(/<symbol id="([^"]+)"[\s\S]*?<\/symbol>/g)].map((m) => [m[1], m[0]]));
const LOOP3 = local(grab(/(<ol class="loop3"[\s\S]*?<\/ol>)/, "#loop3"));
const STEPS = local(grab(/<ol class="steps"[^>]*>([\s\S]*?)<\/ol>/, "#steps")).replace(/<svg class="ck"[\s\S]*?<\/svg>/g, "").replace(/<(\/?)h3>/g, "<$1h4>");
const INC = local(grab(/<ul class="inc"[^>]*>([\s\S]*?)<\/ul>/, "#inc"));
const TERMS = local(grab(/(<p class="terms">[\s\S]*?<\/p>)/, "check-up terms"));
const OFFER_H = grab(/<h2 id="offer-h">([\s\S]*?)<\/h2>/, "offer heading");
const PROM = local(grab(/<ol class="prom"[^>]*>([\s\S]*?)<\/ol>/, "#prom"));
const PROM_H = grab(/<h2 id="promises-h">([\s\S]*?)<\/h2>/, "promises heading");
const DATA_CARD = local(grab(/(<div class="dataCard"[^>]*>[\s\S]*?<\/ul>\s*<p class="notwe">[\s\S]*?<\/p>\s*<\/div>)/, "data card"));
const NOT_WE = grab(/<p class="notwe">([\s\S]*?)<\/p>/, "what we are not").replace(/^What we are not:\s*we/i, "We");
const FAQ = local(grab(/<div class="faq"[^>]*>([\s\S]*?)<\/div>\s*<div class="svc-cta">/, "FAQ"));
const FAQ_H = grab(/<h2 id="questions-h">([\s\S]*?)<\/h2>/, "questions heading");
const TRUST = grab(/<p class="trust-line"[^>]*>([\s\S]*?)<\/p>/, "trust line");
const MICRO = grab(/<p class="micro">([\s\S]*?)<\/p>/, "hero micro line");
const NOT_SURE = grab(/<div class="svc-cta"><span>([\s\S]*?)<\/span>/, "services check-up line");
const TEAM = must([...grab(/<ul class="team"[^>]*>([\s\S]*?)<\/ul>/, "team list").matchAll(/<span class="ini"[^>]*>([\s\S]*?)<\/span><b>([\s\S]*?)<\/b><span>([\s\S]*?)<\/span>/g)].map((m) => ({ ini: m[1], name: m[2], role: m[3] })), "team members");
const FAQ_ITEMS = [...FAQ.matchAll(/<summary>([\s\S]*?)<svg/g)].length;
const TOWNS = ["Bentonville", "Rogers", "Springdale", "Fayetteville", "Bella Vista", "Siloam Springs", "Lowell", "Cave Springs", "Centerton", "Farmington", "Prairie Grove", "Pea Ridge"];
const names = TEAM.map((t) => t.name);
const andList = (a) => a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
const nameList = andList(names);

/* ---------- 3. shared page frame ---------- */
const sprite = (body) => {
  const ids = [...new Set([...body.matchAll(/href="#(i-[\w-]+)"/g)].map((m) => m[1]))];
  return '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">\n  <defs>\n' + ids.map((id) => "    " + must(SYMBOLS[id], "icon " + id)).join("\n") + "\n  </defs>\n</svg>";
};
const head = (o) => `<!doctype html>
<!-- Generated by tools/build-pages.mjs from assets/services-data.js and index.html. Edit those, then run: node tools/build-pages.mjs -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${CSP}
${REFERRER}
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">
<link rel="canonical" href="${o.url}">
<meta name="theme-color" content="#0B1F3B">
<meta name="geo.region" content="US-AR">
<meta name="geo.placename" content="Northwest Arkansas">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Right Hand NWA">
<meta property="og:locale" content="en_US">
<meta property="og:url" content="${o.url}">
<meta property="og:title" content="${esc(o.ogTitle)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:image" content="${SITE}assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${OG_ALT}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(o.ogTitle)}">
<meta name="twitter:description" content="${esc(o.description)}">
<meta name="twitter:image" content="${SITE}assets/og.png">
<meta name="twitter:image:alt" content="${OG_ALT}">
<link rel="alternate" type="text/plain" href="${SITE}llms.txt" title="Right Hand NWA for language models">
<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="../assets/apple-touch-icon.png">
<link rel="preload" href="../assets/fonts/plus-jakarta-sans-latin-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="../assets/fonts/geist-mono-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="../assets/site.css">
<link rel="stylesheet" href="../assets/pages.css">
<link rel="stylesheet" href="../assets/motion.css">
<script src="../assets/boot.js"></script>
<script src="../assets/motion.js" defer></script>
${ldjson(o.jsonld)}
</head>`;
const cur = (page, me) => (page === me ? ' aria-current="page"' : "");
const header = (page) => `<a class="skip" href="#main">Skip to content</a>

<header class="top dark" id="top">
  <div class="wrap-wide">
    <a class="lockup" href="/" aria-label="Right Hand NWA, home">
      ${MARK}
      <b>Right Hand <span>NWA</span></b>
    </a>
    <nav aria-label="Site"><ul>
      <li><a href="/#how">How it works</a></li>
      <li><a href="/#demos">Live demos</a></li>
      <li><a href="/services/"${cur(page, "services")}>Services</a></li>
      <li><a href="/about/"${cur(page, "about")}>About</a></li>
      <li><a href="/#questions">Questions</a></li>
    </ul></nav>
    <button type="button" class="motion-btn" id="motion-btn" aria-pressed="false">Pause motion</button>
    <a class="btn sm" href="/#checkup">Free check-up</a>
    <span class="progress-rail" aria-hidden="true"></span>
  </div>
</header>`;
const footer = (fine) => `<footer>
  <div class="wrap">
    <a class="lockup" href="#top" aria-label="Right Hand NWA, back to top">${MARK}<b>Right Hand <span>NWA</span></b></a>
    <p>Admin and AI help for small business · Northwest Arkansas · <a href="mailto:righthandnwa@gmail.com">righthandnwa@gmail.com</a></p>
    <nav aria-label="Footer"><ul class="row foot-nav">
      <li><a href="/">Home</a></li>
      <li><a href="/services/">Services</a></li>
      <li><a href="/about/">About</a></li>
      <li><a href="/#questions">Questions</a></li>
      <li><a href="/#checkup">Free admin check-up</a></li>
    </ul></nav>
    <p class="row"><a href="https://www.instagram.com/righthandnwa/" target="_blank" rel="noopener noreferrer"><svg class="i" aria-hidden="true" style="width:18px;height:18px;vertical-align:-4px"><use href="#i-ig"/></svg> Instagram</a><a href="https://github.com/jacksonvarela1/right-hand" target="_blank" rel="noopener noreferrer">Source on GitHub</a></p>
    <p class="fine">${fine}</p>
    <p class="fine">Fonts: Plus Jakarta Sans and Geist Mono (SIL OFL). Icons drawn for Right Hand.</p>
  </div>
</footer>`;
const hero = (o) => `<section class="page-hero dark grid-48" data-hud="${esc(o.crumb)}" aria-labelledby="hero-h">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><span aria-current="page">${esc(o.crumb)}</span></li></ol></nav>
    <p class="eyebrow">${o.eyebrow}</p>
    <h1 id="hero-h">${o.h1}</h1>
    <p class="lead">${o.lead}</p>
    <ul class="trio" aria-label="How every task works">
      <li><b>AI</b> drafts.</li>
      <li><b>We</b> check.</li>
      <li><b>You</b> approve.</li>
    </ul>
    <div class="ctas">
      <a class="btn" href="/#checkup">Get my free admin check-up</a>
      ${o.second}
    </div>
    <p class="micro">${MICRO}</p>
  </div>
</section>`;
const cta = (h, lead) => `<section class="band dark page-cta" data-hud="Free check-up" aria-labelledby="cta-h">
  <div class="wrap" data-fx="head">
    <p class="eyebrow">Start here</p>
    <h2 id="cta-h">${h}</h2>
    <p class="lead">${lead}</p>
    <div class="ctas"><a class="btn" href="/#checkup">Get my free admin check-up</a><a class="btn ghost" href="/#demos">Try a live demo first</a></div>
  </div>
</section>`;
const page = (o) => {
  const body = header(o.page) + "\n\n<main id=\"main\">\n\n" + o.main + "\n\n</main>\n\n" + footer(o.fine);
  return head(o) + "\n<body class=\"pg\">\n" + sprite(body) + "\n" + body + "\n</body>\n</html>\n";
};
const crumbs = (url, name) => ({ "@type": "BreadcrumbList", "@id": url + "#breadcrumb", itemListElement: [
  { "@type": "ListItem", position: 1, name: "Home", item: SITE },
  { "@type": "ListItem", position: 2, name, item: url }
] });
const orgRef = { "@type": "Organization", "@id": ORG, name: "Right Hand NWA", url: SITE };

/* ---------- 4. /services/ ---------- */
const N = ALL.length, nAi = ALL.filter((s) => s.tag === "ai").length, nWe = N - nAi;
const numWord = (n) => ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][n] || String(n);
const SVC_URL = SITE + "services/";
const svcTitle = "Admin and AI services for Northwest Arkansas small businesses | Right Hand NWA";
const svcDesc = N + " admin and AI services for Northwest Arkansas small businesses, from receipts and invoices to scheduling and AI setup. AI drafts, we check, you approve.";
const kindTag = (s) => { const k = KIND[s.tag] || KIND.we; return '<p class="kind' + (k[0] ? " " + k[0] : "") + '">' + esc(k[1]) + "</p>"; };
const svcDoc = (s) => `<article class="svc-doc${s.tag === "ai" ? " is-ai" : ""}" id="${esc(s.id)}" aria-labelledby="${esc(s.id)}-h">
  ${kindTag(s)}
  <h3 id="${esc(s.id)}-h">${esc(s.name)}</h3>
  <p class="sum">${esc(s.sum)}</p>
  <dl>
${ROWS.filter((r) => s.rows && s.rows[r[0]]).map((r) => `    <div><dt>${esc(r[1])}</dt><dd${r[0] === "never" ? ' class="never"' : r[0] === "example" ? ' class="ex"' : ""}>${esc(s.rows[r[0]].replace(/^Example:\s*/, ""))}</dd></div>`).join("\n")}
  </dl>${s.demo ? `\n  <p class="demo-link"><a href="/${esc(s.demo)}">See it in the demo</a></p>` : ""}
</article>`;
const lineSec = (l, i) => `<section class="line-sec" data-hud="${esc(l.name)}" id="${lineId(l)}" aria-labelledby="${lineId(l)}-h">
  <div class="line-head" data-fx="head">
    <span class="tile" aria-hidden="true"><svg class="i"><use href="#${ICON[l.icon] || "i-folder"}"/></svg></span>
    <p class="eyebrow">Service line ${i + 1} of ${S.lines.length} · ${l.items.length} services</p>
    <h2 id="${lineId(l)}-h">${esc(l.name)}</h2>
    ${l.note ? `<p class="line-note">${esc(l.note)}</p>` : ""}
  </div>
  <div class="svc-docs" data-fx="cascade" data-edge>
${l.items.map(svcDoc).join("\n")}
  </div>
</section>`;
const toc = `<nav class="toc" aria-labelledby="toc-h">
  <p class="toc-h" id="toc-h">On this page</p>
  <ol>
${S.lines.map((l) => `    <li><a href="#${lineId(l)}">${esc(l.name)}<span class="n">${l.items.length}</span></a><ul>${l.items.map((s) => `<li><a href="#${esc(s.id)}">${esc(s.name)}</a></li>`).join("")}</ul></li>`).join("\n")}
    <li><a href="#stays-with-you">${esc(S.stays.name)}</a></li>
    <li><a href="#how-you-can-buy">How you can buy it</a></li>
  </ol>
</nav>`;
const buyHtml = `<ul class="buy-grid" data-fx="cascade" data-edge>
${S.buy.map((b) => `  <li><h3>${esc(b.name)}</h3><p>${esc(b.text)}</p>${b.tiers ? "<ul>" + b.tiers.map((t) => "<li>" + esc(t) + "</li>").join("") + "</ul>" : ""}</li>`).join("\n")}
</ul>${S.priceLine ? `\n<p class="price-note">${esc(S.priceLine)}</p>` : ""}`;

const servicesMain = hero({
  crumb: "Services", eyebrow: "Services · Right Hand NWA",
  h1: "Admin and AI services for Northwest Arkansas small businesses",
  lead: `Everything Right Hand NWA can take off your plate: ${N} services in ${numWord(S.lines.length)} lines, from receipts and invoices to scheduling, documents, AI setup and reviews. Each one shows what you hand off, what comes back, where AI helps, where a person checks, what we never do, and an example.`,
  second: '<a class="btn ghost" href="#contents">See all services</a>'
}) + `

<section class="band light" data-hud="All services" aria-label="All services">
  <div class="wrap svc-layout">
    ${toc}
    <div class="svc-main">
      <div class="prose" id="contents">
        <h2 class="sub-h">How every service works</h2>
        <p>AI drafts, a person on our team checks, and you approve. Nothing goes out in your name until you have approved it. ${esc(TRUST)}</p>
        <ul class="legend" aria-label="What the labels mean">
          <li><span class="kind ai">${esc(KIND.ai[1])}</span><span>AI makes a first draft, a person on our team checks it, and you approve it. ${nAi} services.</span></li>
          <li><span class="kind">${esc(KIND.we[1])}</span><span>A person on our team does the work. Most of these need no AI at all. ${nWe} services.</span></li>
        </ul>
        <p class="note-made-up" data-fx="scan">Every example below describes a made-up Northwest Arkansas business, written to show how the service works. They are not clients, and they are not results.</p>
      </div>
${S.lines.map(lineSec).join("\n")}
      <section class="line-sec stays-sec" id="stays-with-you" aria-labelledby="stays-with-you-h">
        <div class="line-head" data-fx="head">
          <span class="tile plain" aria-hidden="true"><svg class="i"><use href="#i-hand"/></svg></span>
          <p class="eyebrow">Never handed to us</p>
          <h2 id="stays-with-you-h">${esc(S.stays.name)}</h2>
          <p class="line-note">We will point you to a licensed pro when something needs one.</p>
        </div>
        <ul data-fx="cascade" class="chips-list">${S.stays.items.map((x) => "<li>" + esc(x) + "</li>").join("")}</ul>
        <p class="trust-line">${TRUST}</p>
      </section>
      <section class="line-sec buy-sec" id="how-you-can-buy" aria-labelledby="how-you-can-buy-h">
        <div class="line-head" data-fx="head">
          <span class="tile" aria-hidden="true"><svg class="i"><use href="#i-cal"/></svg></span>
          <p class="eyebrow">Ways to work with us</p>
          <h2 id="how-you-can-buy-h">How you can buy it</h2>
          <p>Start with the free check-up. Everything after it is optional, and you pick the tasks.</p>
        </div>
        ${buyHtml}
      </section>
    </div>
  </div>
</section>

${cta(esc(NOT_SURE.replace(/\s*That is what the check-up is for\.?$/, "")), "That is what the check-up is for. " + MICRO)}`;

const svcLd = { "@context": "https://schema.org", "@graph": [
  { "@type": "CollectionPage", "@id": SVC_URL + "#webpage", url: SVC_URL, name: svcTitle, description: svcDesc, isPartOf: { "@id": SITE + "#website" }, about: { "@id": ORG }, breadcrumb: { "@id": SVC_URL + "#breadcrumb" }, mainEntity: { "@id": SVC_URL + "#services" }, inLanguage: "en-US" },
  crumbs(SVC_URL, "Services"),
  { "@type": "ItemList", "@id": SVC_URL + "#services", name: "Admin and AI services for Northwest Arkansas small businesses", numberOfItems: N, itemListOrder: "https://schema.org/ItemListUnordered",
    itemListElement: ALL.map((s, i) => ({ "@type": "ListItem", position: i + 1, url: SVC_URL + "#" + s.id, name: s.name,
      item: { "@type": "Service", "@id": SVC_URL + "#" + s.id, name: s.name, description: s.sum, serviceType: s.line.name, url: SVC_URL + "#" + s.id, provider: { "@id": ORG },
        areaServed: [{ "@type": "AdministrativeArea", name: "Benton County, Arkansas" }, { "@type": "AdministrativeArea", name: "Washington County, Arkansas" }] } })) },
  orgRef
] };

const servicesHtml = page({
  page: "services", url: SVC_URL, title: svcTitle, description: svcDesc, ogTitle: "Right Hand NWA services: admin and AI help for Northwest Arkansas small businesses", jsonld: svcLd,
  fine: "We are not a CPA firm, law firm or payroll provider, and nothing on this page is tax, legal or accounting advice. The example businesses on this page are made up to show how each service works. They are not clients.",
  main: servicesMain
});

/* ---------- 5. /about/ ---------- */
const ABOUT_URL = SITE + "about/";
const aboutTitle = "About Right Hand NWA | Admin and AI help in Northwest Arkansas";
const aboutDesc = "Right Hand NWA is four University of Arkansas students helping Northwest Arkansas small businesses with admin and AI. AI drafts, we check, you approve.";
const facts = [
  ["Name", "Right Hand NWA"],
  ["What it is", "An admin and AI help service for small businesses in Northwest Arkansas: receipts, invoices, follow-ups, scheduling, paperwork and practical AI setup."],
  ["How it works", "AI drafts, a person on the team checks every piece, and the owner approves. Nothing goes out in an owner's name until they have approved it."],
  ["Where", "Benton and Washington counties in Northwest Arkansas, including " + andList(TOWNS.slice(0, 6)) + ". In person at the business, or by video or phone."],
  ["Who", "Four University of Arkansas students: " + nameList + "."],
  ["Offer", "A free 30-minute admin and AI check-up. Your Admin Map follows by email within 3 business days. Nothing to buy."],
  ["Services", N + " services in " + numWord(S.lines.length) + " lines: " + S.lines.map((l) => l.name).join(", ") + ". Full list: righthandnwa.com/services/"],
  ["Pricing", "The check-up is free. Ongoing help is a flat monthly price, quoted in writing after the check-up, based on the tasks the owner picks."],
  ["Not", "Not a CPA firm, law firm or payroll provider. Tax, payroll, legal work and moving money stay with the owner and their licensed pros."],
  ["Contact", "righthandnwa@gmail.com · Instagram @righthandnwa · righthandnwa.com"],
  ["Founded", "2026, in Northwest Arkansas"]
];
const linkify = (s) => esc(s)
  .replace("righthandnwa.com/services/", '<a href="/services/">righthandnwa.com/services/</a>')
  .replace("righthandnwa@gmail.com", '<a href="mailto:righthandnwa@gmail.com">righthandnwa@gmail.com</a>')
  .replace("Instagram @righthandnwa", 'Instagram <a href="https://www.instagram.com/righthandnwa/" target="_blank" rel="noopener noreferrer">@righthandnwa</a>')
  .replace(/· righthandnwa\.com$/, '· <a href="/">righthandnwa.com</a>');

const aboutMain = hero({
  crumb: "About", eyebrow: "About us · Northwest Arkansas",
  h1: "About Right Hand NWA",
  lead: "Right Hand NWA is an admin and AI help service for small businesses in Northwest Arkansas, run by four University of Arkansas students. AI drafts, a person on our team checks, and you approve.",
  second: '<a class="btn ghost" href="/services/">See all ' + N + " services</a>"
}) + `

<section class="band light" id="who-we-are" data-hud="Who we are" aria-labelledby="who-h">
  <div class="wrap">
    <div class="sec-h" data-fx="head">
      <p class="eyebrow">Who we are</p>
      <h2 id="who-h">Four students you can <span class="sw">meet</span>.</h2>
    </div>
    <div class="prose">
      <p>We are four University of Arkansas students who work in Northwest Arkansas: ${esc(nameList)}. One named person on our team owns each of your tasks.</p>
      <p>We're new. You won't find reviews or client results here yet, because we won't make them up. You can try the work yourself in the <a href="/#demos">live demos on our home page</a>, and you can meet all four of us.</p>
    </div>
    <ul class="people" data-fx="cascade" data-edge aria-label="The Right Hand NWA team">
${TEAM.map((t) => `      <li><span class="ini" aria-hidden="true">${t.ini}</span><b>${t.name}</b><span class="role">${t.role}</span></li>`).join("\n")}
    </ul>
    <p class="contact-line"><svg class="i" aria-hidden="true"><use href="#i-mail"/></svg>Reach all four of us at <a href="mailto:righthandnwa@gmail.com">righthandnwa@gmail.com</a> · <a href="https://www.instagram.com/righthandnwa/" target="_blank" rel="noopener noreferrer">@righthandnwa on Instagram</a></p>
  </div>
</section>

<section class="band dark" id="what-we-do" data-hud="What we do" aria-labelledby="what-h">
  <div class="wrap">
    <div class="sec-h" data-fx="head">
      <p class="eyebrow">What we do and how</p>
      <h2 id="what-h">The admin comes off your plate. The final say <span class="sw">stays</span>.</h2>
    </div>
    <div class="prose">
      <p>We take receipts, invoices, follow-ups, scheduling and paperwork off your plate, and we set up AI that drafts the busywork. Tax, payroll, legal work and moving money stay with you and your licensed pros.</p>
    </div>
    <ul class="line-links" data-fx="cascade" aria-label="Our ${numWord(S.lines.length)} service lines">
${S.lines.map((l) => `      <li><a href="/services/#${lineId(l)}"><span class="tile" aria-hidden="true"><svg class="i"><use href="#${ICON[l.icon] || "i-folder"}"/></svg></span><b>${esc(l.name)}</b><span class="note">${l.items.length} services. ${esc(l.note || "")}</span></a></li>`).join("\n")}
    </ul>
    <h3 class="sub-h">The method</h3>
    <p>Every task runs the same loop. AI drafts the first version where it helps. A person on our team checks every piece against your records. You approve before anything is sent, filed or final. If you'd rather we skip AI on a task, we do it by hand.</p>
    ${LOOP3}
    <h3 class="sub-h">How working with us goes</h3>
    <p>Four steps, and you can stop after any of them.</p>
    <ol class="steps" data-fx="cascade">${STEPS}</ol>
  </div>
</section>

<section class="band light" id="where-we-work" data-hud="Where we work" aria-labelledby="where-h">
  <div class="wrap">
    <div class="sec-h" data-fx="head">
      <p class="eyebrow">Where we work</p>
      <h2 id="where-h">Anywhere in Benton and Washington <span class="sw">counties</span>.</h2>
    </div>
    <div class="prose">
      <p>We work with small businesses across Northwest Arkansas, in Benton and Washington counties. We come to your shop or meet at a coffee shop, and video and phone work too.</p>
    </div>
    <ul class="meet" data-fx="cascade" data-edge>
      <li><b>In person</b><span>At your business or a coffee shop, anywhere in Benton and Washington counties.</span></li>
      <li><b>Video or phone</b><span>Same check-up, same Admin Map, if that is easier for your week.</span></li>
    </ul>
    <p class="towns-h">Towns we work in</p>
    <ul data-fx="cascade" class="chips-list towns-list">${TOWNS.map((t) => "<li>" + t + "</li>").join("")}<li>And the towns in between</li></ul>
  </div>
</section>

<section class="band dark" id="check-up" data-hud="Free check-up" aria-labelledby="offer-h">
  <div class="wrap offer-one">
    <div class="sec-h" data-fx="head">
      <p class="eyebrow">The free check-up and Your Admin Map</p>
      <h2 id="offer-h">${OFFER_H}</h2>
    </div>
    <ul class="inc" data-fx="cascade">${INC}</ul>
    ${TERMS}
    <div class="ctas"><a class="btn" href="/#checkup">Get my free admin check-up</a></div>
  </div>
</section>

<section class="band light" id="promises" data-hud="Promises" aria-labelledby="promises-h">
  <div class="wrap prom-grid">
    <div>
      <div class="sec-h" data-fx="head">
        <p class="eyebrow">Our promises</p>
        <h2 id="promises-h">${PROM_H}</h2>
      </div>
      <ol class="prom" data-fx="cascade" data-edge>${PROM}</ol>
    </div>
    ${DATA_CARD}
  </div>
</section>

<section class="band dark not-sec" id="what-we-are-not" data-hud="What we are not" aria-labelledby="not-h">
  <div class="wrap">
    <div class="sec-h" data-fx="head">
      <p class="eyebrow">What we are not</p>
      <h2 id="not-h">Not a CPA firm, law firm or payroll <span class="sw">provider</span>.</h2>
    </div>
    <div class="prose">
      <p>${NOT_WE}</p>
      <p>${esc(S.stays.name)}:</p>
    </div>
    <ul data-fx="cascade" class="chips-list not-list">${S.stays.items.map((x) => "<li>" + esc(x) + "</li>").join("")}</ul>
    <p class="fine">Nothing on this site is tax, legal or accounting advice.</p>
  </div>
</section>

<section class="band light" id="facts" data-hud="Facts" aria-labelledby="facts-h">
  <div class="wrap">
    <div class="sec-h" data-fx="head">
      <p class="eyebrow">Facts</p>
      <h2 id="facts-h">Right Hand NWA at a <span class="sw">glance</span>.</h2>
    </div>
    <dl class="facts" data-fx="cascade">
${facts.map(([k, v]) => `      <div><dt>${esc(k)}</dt><dd>${linkify(v)}</dd></div>`).join("\n")}
    </dl>
    <p class="fine facts-note">Short and plain on purpose, so anyone summarizing us, a person or an AI assistant, gets it right.</p>
  </div>
</section>

<section class="band white" id="questions" data-hud="Questions" aria-labelledby="questions-h">
  <div class="wrap">
    <div class="sec-h" data-fx="head">
      <p class="eyebrow">Questions</p>
      <h2 id="questions-h">${FAQ_H}</h2>
    </div>
    <div class="faq" data-fx="cascade" data-edge>${FAQ}</div>
  </div>
</section>

${cta("Start with 30 minutes.", "Free, local, and you keep the plan. " + MICRO)}`;

const aboutLd = { "@context": "https://schema.org", "@graph": [
  { "@type": "AboutPage", "@id": ABOUT_URL + "#webpage", url: ABOUT_URL, name: aboutTitle, description: aboutDesc, isPartOf: { "@id": SITE + "#website" }, about: { "@id": ORG }, mainEntity: { "@id": ORG }, breadcrumb: { "@id": ABOUT_URL + "#breadcrumb" }, inLanguage: "en-US" },
  crumbs(ABOUT_URL, "About"),
  { ...orgRef, email: "righthandnwa@gmail.com", foundingDate: "2026", sameAs: ["https://www.instagram.com/righthandnwa/"],
    areaServed: [{ "@type": "AdministrativeArea", name: "Benton County, Arkansas" }, { "@type": "AdministrativeArea", name: "Washington County, Arkansas" }],
    founder: names.map((n) => ({ "@type": "Person", name: n })) }
] };

const aboutHtml = page({
  page: "about", url: ABOUT_URL, title: aboutTitle, description: aboutDesc, ogTitle: "About Right Hand NWA: admin and AI help from four University of Arkansas students", jsonld: aboutLd,
  fine: "We are not a CPA firm, law firm or payroll provider, and nothing on this page is tax, legal or accounting advice.",
  main: aboutMain
});

/* ---------- 6. write ---------- */
for (const [dir, out] of [["services", servicesHtml], ["about", aboutHtml]]) {
  mkdirSync(p(dir), { recursive: true });
  writeFileSync(p(dir + "/index.html"), out);
}
console.log("build-pages: services/index.html " + Buffer.byteLength(servicesHtml) + " bytes (" + N + " services in " + S.lines.length + " lines); about/index.html " + Buffer.byteLength(aboutHtml) + " bytes (" + FAQ_ITEMS + " FAQs, " + TEAM.length + " team members)");
