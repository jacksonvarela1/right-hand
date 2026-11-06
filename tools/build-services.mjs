// Right Hand NWA build step. Run after editing assets/services-data.js, the FAQ, the check-up list or the promises:
//   node tools/build-services.mjs
// It writes, from one source of truth:
//   1. the static services catalog into index.html (between the services, services-stays and services-buy markers),
//      using the exact render block from assets/site.js, so crawlers and AI fetchers that skip JavaScript see all of it;
//   2. the JSON-LD @graph (business, website, page, offer catalog, free check-up offer, FAQ) between the jsonld markers;
//   3. llms.txt and llms-full.txt at the site root;
//   4. the hero map markup from assets/nwa-map.js into index.html (between the nwa markers), so the hero never grows on load.
// No dependencies. Node 18 or newer.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (f) => join(ROOT, f);
const SITE = "https://righthandnwa.com/";
const must = (x, what) => { if (!x || (Array.isArray(x) && !x.length)) throw new Error("build-services: could not find " + what); return x; };

/* ---------- 1. data and the shared renderer ---------- */
const win = {};
vm.runInNewContext(readFileSync(p("assets/services-data.js"), "utf8"), { window: win });
const S = must(win.RH_SERVICES && win.RH_SERVICES.lines && win.RH_SERVICES, "window.RH_SERVICES in assets/services-data.js");

const js = readFileSync(p("assets/site.js"), "utf8");
const a = js.indexOf("/* services-render:start"), b = js.indexOf("/* services-render:end */");
if (a < 0 || b < a) throw new Error("build-services: services-render markers missing in assets/site.js");
const RENDER = vm.runInNewContext(js.slice(a, b) + "\nRENDER;", {});

/* ---------- 2. static catalog into index.html ---------- */
let html = readFileSync(p("index.html"), "utf8");
const before = Buffer.byteLength(html);
function put(name, body) {
  const re = new RegExp("(<!-- " + name + ":start -->)[\\s\\S]*?(<!-- " + name + ":end -->)");
  if (!re.test(html)) throw new Error("build-services: marker " + name + " missing in index.html");
  html = html.replace(re, (m, s, e) => s + body + e);
}
put("services", "\n" + RENDER.lines(S, "\n") + "\n");
put("services-stays", RENDER.stays(S));
put("services-buy", RENDER.buy(S));
// the hero map, so the hero window has its full size at first paint (assets/nwa-map.js keeps markup it finds)
put("nwa", heroMap());
function heroMap() {
  let out = "";
  const el = () => ({ classList: { add() {}, remove() {}, contains: () => false }, addEventListener() {}, querySelector: () => null, querySelectorAll: () => [], getAttribute: () => null });
  const host = el();
  Object.defineProperty(host, "innerHTML", { set(v) { out = v; throw new Error("captured"); }, get: () => out });
  try { vm.runInNewContext(readFileSync(p("assets/nwa-map.js"), "utf8"), { document: { getElementById: () => host, documentElement: el(), addEventListener() {} }, matchMedia: () => ({ matches: true }) }); }
  catch (e) { if (e.message !== "captured") throw e; }
  return must(out, "hero map markup in assets/nwa-map.js");
}

/* ---------- 3. text pulled from the page itself, so every copy matches ---------- */
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " " };
const text = (s) => s.replace(/<[^>]+>/g, "").replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m, e) => ENT[e]).replace(/\s+/g, " ").trim();
const lis = (block) => [...block.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((m) => text(m[1]));
const grab = (re, what) => must(html.match(re), what)[1];

const faq = must([...html.matchAll(/<details><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/g)].map((m) => ({ q: text(m[1]), a: text(m[2]) })), "FAQ details in #questions");
const checkupList = lis(grab(/id="inc">([\s\S]*?)<\/ul>/, "#inc list"));
const checkupTerms = text(grab(/<p class="terms">([\s\S]*?)<\/p>/, "check-up terms"));
const promises = lis(grab(/id="prom">([\s\S]*?)<\/ol>/, "#prom list"));
const dataRules = lis(grab(/class="dataCard"[\s\S]*?<ul>([\s\S]*?)<\/ul>/, "data card list"));
const notWe = text(grab(/<p class="notwe">([\s\S]*?)<\/p>/, "what we are not"));
const steps = [...grab(/id="steps">([\s\S]*?)<\/ol>/, "#steps").matchAll(/<h3>([\s\S]*?)<\/h3>([\s\S]*?)<\/li>/g)].map((m) => text(m[1]) + ": " + [...m[2].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((x) => text(x[1])).join(" "));
const team = must([...grab(/<ul class="team"[^>]*>([\s\S]*?)<\/ul>/, "team list").matchAll(/<b>([\s\S]*?)<\/b>/g)].map((m) => text(m[1])), "team names");
const title = text(grab(/<title>([\s\S]*?)<\/title>/, "title"));
const description = grab(/<meta name="description" content="([^"]*)"/, "meta description");

/* ---------- 4. JSON-LD ---------- */
const ID = { org: SITE + "#organization", site: SITE + "#website", page: SITE + "#webpage", logo: SITE + "#logo", image: SITE + "#image", ar: SITE + "#arkansas", uark: SITE + "#uark", checkup: SITE + "#checkup-offer", faq: SITE + "#faq" };
const TOWNS = ["Bentonville", "Rogers", "Springdale", "Fayetteville", "Bella Vista", "Siloam Springs", "Lowell", "Cave Springs", "Centerton", "Farmington", "Prairie Grove", "Pea Ridge"];
const inAR = { "@id": ID.ar };
const areaServed = [{ "@type": "Place", name: "Northwest Arkansas", containedInPlace: inAR }]
  .concat(["Benton County", "Washington County"].map((n) => ({ "@type": "AdministrativeArea", name: n + ", Arkansas", containedInPlace: inAR })))
  .concat(TOWNS.map((n) => ({ "@type": "City", name: n, containedInPlace: inAR })));
const buyName = (S.buy && S.buy[0] && S.buy[0].name) || "Free NWA Admin and AI Check-up";

const graph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "ProfessionalService"],
      "@id": ID.org,
      name: "Right Hand NWA",
      alternateName: "Right Hand Northwest Arkansas",
      url: SITE,
      description: "A Northwest Arkansas team that takes receipts, invoices, follow-ups, scheduling and paperwork off small business owners' plates, and sets up AI that drafts the busywork. AI drafts, a person on the team checks, and the owner approves. Tax, payroll, legal work and moving money stay with the owner and their licensed pros.",
      slogan: "Hand off the admin. Keep the final say.",
      logo: { "@type": "ImageObject", "@id": ID.logo, url: SITE + "assets/logo.png", contentUrl: SITE + "assets/logo.png", width: 512, height: 512, caption: "Right Hand NWA" },
      image: { "@type": "ImageObject", "@id": ID.image, url: SITE + "assets/og.png", contentUrl: SITE + "assets/og.png", width: 1200, height: 630 },
      email: "righthandnwa@gmail.com",
      contactPoint: { "@type": "ContactPoint", contactType: "customer service", email: "righthandnwa@gmail.com", areaServed: "US-AR", availableLanguage: "English" },
      sameAs: ["https://www.instagram.com/righthandnwa/"],
      founder: team.map((n) => ({ "@type": "Person", name: n, description: "University of Arkansas student", memberOf: { "@id": ID.uark } })),
      areaServed,
      knowsAbout: ["Small business admin", "Receipt capture and expense review", "Invoice follow-ups", "CPA and bookkeeper prep", "Inbox triage and reply drafts", "Missed-call text-back", "Appointment scheduling and reminders", "Written how-tos (SOPs)", "Workflow automations", "Practical AI for small business", "AI use policies for small business", "Google Business Profile and local listings", "Honest review requests"],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Right Hand NWA services",
        url: SITE + "#services",
        itemListElement: S.lines.map((l) => ({
          "@type": "OfferCatalog",
          name: l.name,
          itemListElement: l.items.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s.name } }))
        }))
      },
      makesOffer: {
        "@type": "Offer",
        "@id": ID.checkup,
        name: buyName,
        price: "0",
        priceCurrency: "USD",
        url: SITE + "#checkup",
        description: "A free 30-minute admin and AI check-up at your business anywhere in Benton or Washington County, or by video or phone. Within 3 business days, Your Admin Map arrives by email: your top 3 tasks to hand off, and for each one what we would do, what AI would draft, what stays with you, and what stays with your CPA or attorney. Nothing to buy, now or later.",
        itemOffered: { "@type": "Service", name: "NWA Admin and AI Check-up", provider: { "@id": ID.org }, areaServed: { "@id": ID.ar } }
      }
    },
    { "@type": "CollegeOrUniversity", "@id": ID.uark, name: "University of Arkansas", url: "https://www.uark.edu/" },
    { "@type": "State", "@id": ID.ar, name: "Arkansas", containedInPlace: { "@type": "Country", name: "United States" } },
    { "@type": "WebSite", "@id": ID.site, url: SITE, name: "Right Hand NWA", alternateName: "Right Hand Northwest Arkansas", publisher: { "@id": ID.org }, inLanguage: "en-US" },
    { "@type": "WebPage", "@id": ID.page, url: SITE, name: title, description, isPartOf: { "@id": ID.site }, about: { "@id": ID.org }, primaryImageOfPage: { "@id": ID.image }, inLanguage: "en-US" },
    { "@type": "FAQPage", "@id": ID.faq, url: SITE + "#questions", isPartOf: { "@id": ID.page }, mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }
  ]
};
put("jsonld", '\n<script type="application/ld+json">' + JSON.stringify(graph).replace(/</g, "\\u003c") + "</script>\n");
writeFileSync(p("index.html"), html);

/* ---------- 5. llms.txt and llms-full.txt ---------- */
const WHO = Object.fromEntries((S.who || []).map((w) => [w.id, w.label]));
const kind = (s) => (RENDER.KIND[s.tag] || RENDER.KIND.we)[1];
const towns = TOWNS.slice(0, -1).join(", ") + " and " + TOWNS[TOWNS.length - 1];
const SUMMARY = "Right Hand NWA is a Northwest Arkansas team that takes receipts, invoices, follow-ups, scheduling and paperwork off small business owners' plates, and sets up AI that drafts the busywork. AI drafts, a person on the team checks every piece, and the owner approves: nothing goes out in an owner's name until they have approved it. It is run by four University of Arkansas students. The one offer is a free 30-minute admin and AI check-up, and Your Admin Map follows within 3 business days.";
const ABOUT = [
  "- Who: four University of Arkansas students who work in Northwest Arkansas: " + team.slice(0, -1).join(", ") + " and " + team[team.length - 1] + ". One named person owns each client task.",
  "- New business: there are no reviews or client results on the site yet, because the team will not make them up.",
  "- Method: AI drafts, we check, you approve. A person on the team checks every piece. Automatic messages, like a missed-call text, only ever use wording the owner approved.",
  "- Area: anywhere in Benton and Washington counties, Arkansas, including " + towns + ". In person at the business or a coffee shop, or by video or phone.",
  "- Contact: righthandnwa@gmail.com (reply within one business day). Instagram: @righthandnwa (https://www.instagram.com/righthandnwa/).",
  "- Pricing: the check-up is free. After that, a flat monthly price is quoted in writing before any work starts, based on the tasks the owner picks. No prices are published.",
  "- " + notWe
];
const NEVER = [
  "- Nothing is sent, filed or final until the owner approves it.",
  "- We never ask for passwords by email, text or on the website, and the check-up needs no logins at all.",
  "- We never touch your bank or move money.",
  "- We never write reviews. Honest listings and real reviews only.",
  "- We never sell or share your data, and we use settings that keep it out of AI model training.",
  "- We are not a CPA firm, law firm or payroll provider. If something needs one, we say so.",
  "- " + S.stays.name + ": " + S.stays.items.join("; ") + "."
];
const LINKS = [
  "- [Home page](" + SITE + "): the method, six live demos on made-up businesses, every service, promises, team and FAQ",
  "- [Services](" + SITE + "services/): the full services catalog",
  "- [About](" + SITE + "about/): the four people behind Right Hand NWA",
  "- [Free check-up](" + SITE + "#checkup): writes a check-up request email in your own email app",
  "- [Full catalog and answers as text](" + SITE + "llms-full.txt): every service with all six details, promises and FAQ answers",
  "- [Instagram @righthandnwa](https://www.instagram.com/righthandnwa/)",
  "- [Email righthandnwa@gmail.com](mailto:righthandnwa@gmail.com)"
];

const llms = [
  "# Right Hand NWA", "", "> " + SUMMARY, "",
  "## About", "", ...ABOUT, "",
  "## Services", "", "Prices: " + S.priceLine, "",
  ...S.lines.flatMap((l) => ["### " + l.name, "", ...(l.note ? [l.note, ""] : []), ...l.items.map((s) => "- " + s.name + ": " + s.sum), ""]),
  "## The free check-up", "", "**" + buyName + "**", "", ...checkupList.map((x) => "- " + x), "", checkupTerms, "",
  "To book: email righthandnwa@gmail.com, or use the form at " + SITE + "#checkup, which writes the email in your own email app for you to send.", "",
  "## What we never do", "", ...NEVER, "",
  "## Links", "", ...LINKS, ""
].join("\n");

const full = [
  "# Right Hand NWA: full services catalog and answers", "", "> " + SUMMARY, "",
  "Source: " + SITE + ". Short version: " + SITE + "llms.txt", "",
  "## About", "", ...ABOUT, "",
  "## How it works", "", ...steps.map((x, i) => (i + 1) + ". " + x), "",
  "## Services", "", "Every service lists what you hand off, what you get back, where AI helps, where a person checks, what we never do, and an example. Prices: " + S.priceLine, "",
  ...S.lines.flatMap((l) => [
    "### " + l.name, "", ...(l.note ? [l.note, ""] : []),
    ...l.items.flatMap((s) => [
      "#### " + s.name, "", s.sum, "",
      "- How it works: " + kind(s),
      ...(s.who && s.who.length ? ["- Suits: " + s.who.map((w) => WHO[w] || w).join(", ")] : []),
      ...RENDER.ROWS.filter((r) => s.rows && s.rows[r[0]]).map((r) => "- " + r[1] + ": " + s.rows[r[0]].replace(/^Example:\s*/, "")),
      ...(s.demo ? ["- Live demo: " + SITE + s.demo] : []),
      ""
    ])
  ]),
  "### " + S.stays.name, "", ...S.stays.items.map((x) => "- " + x), "", "We will point you to a licensed pro when something needs one.", "",
  "## How you can buy it", "", ...S.buy.flatMap((x) => ["### " + x.name, "", x.text, ...(x.tiers ? ["", ...x.tiers.map((t) => "- " + t)] : []), ""]), S.priceLine, "",
  "## The free check-up", "", "**" + buyName + "**", "", ...checkupList.map((x) => "- " + x), "", checkupTerms, "",
  "## Promises", "", ...promises.map((x) => "- " + x), "",
  "## How we handle your logins and data", "", ...dataRules.map((x) => "- " + x), "", notWe, "",
  "## What we never do", "", ...NEVER, "",
  "## Questions and answers", "", ...faq.flatMap((f) => ["### " + f.q, "", f.a, ""]),
  "## Links", "", ...LINKS, ""
].join("\n");

writeFileSync(p("llms.txt"), llms);
writeFileSync(p("llms-full.txt"), full);

const after = Buffer.byteLength(html);
const n = S.lines.reduce((t, l) => t + l.items.length, 0);
console.log("build-services: " + n + " services in " + S.lines.length + " lines, " + faq.length + " FAQs; index.html " + before + " -> " + after + " bytes; llms.txt " + Buffer.byteLength(llms) + " bytes; llms-full.txt " + Buffer.byteLength(full) + " bytes");
