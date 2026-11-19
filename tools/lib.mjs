// Right Hand NWA: what both build tools share (tools/build-services.mjs and tools/build-pages.mjs).
// 1. Site constants (addresses, towns, the sitemap date).
// 2. Small helpers (escape, strip tags, marker regions, links that work under any path).
// 3. The catalog loader and its labels (assets/services-data.js is the source of truth for services).
// 4. Wording that lives on the sub-pages and in llms*.txt but NOT on the home page: the team list, the market
//    statistics, the five extra questions, what the check-up includes, and three boundary sentences.
//    Edit it here, then run:  node tools/build-services.mjs && node tools/build-pages.mjs
// Everything the home page says itself (the six questions, promises, data rules, steps, the cost block, the hero
// lines, header, menu, bar and footer) is still read from index.html, so no page can drift from it.
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

/* ---------- 1. constants ---------- */
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const p = (f) => join(ROOT, f);
export const read = (f) => readFileSync(p(f), "utf8");
// Canonical, Open Graph and JSON-LD addresses always point at the main domain, even when the files are served from a mirror.
export const SITE = "https://righthandnwa.com/";
export const EMAIL = "righthandnwa@gmail.com";
export const INSTAGRAM = "https://www.instagram.com/righthandnwa/";
export const GITHUB = "https://github.com/jacksonvarela1/right-hand";
// The date in sitemap.xml. Bump it by hand when the pages change in a way search engines should re-read.
// (Stamping today's date on every run would make two runs on different days produce different files.)
export const LASTMOD = "2026-11-19";
export const TOWNS = ["Bentonville", "Rogers", "Springdale", "Fayetteville", "Bella Vista", "Siloam Springs", "Lowell", "Cave Springs", "Centerton", "Farmington", "Prairie Grove", "Pea Ridge"];

/* ---------- 2. helpers ---------- */
export const must = (v, what) => { if (!v || (Array.isArray(v) && !v.length)) throw new Error("build: could not find " + what); return v; };
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " " };
export const text = (s) => s.replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, "").replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m, e) => ENT[e]).replace(/\s+/g, " ").trim();
export const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const andList = (a) => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]);
export const numWord = (n) => ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][n] || String(n);
export const ldjson = (o) => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, "\\u003c") + "</script>";
export const lis = (block) => [...block.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((m) => text(m[1]));

// A generated region of index.html sits between <!-- name:start --> and <!-- name:end -->. Never edit one by hand.
export function region(html, name, body) {
  const re = new RegExp("(<!-- " + name + ":start -->)[\\s\\S]*?(<!-- " + name + ":end -->)");
  if (!re.test(html)) throw new Error("build: marker " + name + " missing in index.html");
  return html.replace(re, (m, s, e) => s + body + e);
}
export function between(html, name) {
  const m = html.match(new RegExp("<!-- " + name + ":start -->([\\s\\S]*?)<!-- " + name + ":end -->"));
  return must(m, "marker " + name + " in index.html")[1];
}

/* ---------- 3. the catalog ---------- */
export function loadServices() {
  const win = {};
  vm.runInNewContext(read("assets/services-data.js"), { window: win });
  return must(win.RH_SERVICES && win.RH_SERVICES.lines && win.RH_SERVICES, "window.RH_SERVICES in assets/services-data.js");
}
export const ICON = { receipt: "i-receipt", chat: "i-chat", calendar: "i-cal", folder: "i-folder", chip: "i-chip", pin: "i-pin" };
export const KIND = { ai: ["ai", "AI drafts, we check, you approve"], we: ["", "We do it"], pro: ["", "Stays with a licensed pro"] };
export const ROWS = [["handoff", "You hand off"], ["back", "You get back"], ["ai", "Where AI helps"], ["person", "Where a person checks"], ["never", "What we never do"], ["example", "Example"]];
export const lineId = (l) => slug(l.name);   // the anchor of a service line on /services/
export const lineIcon = (l) => ICON[l.icon] || "i-folder";

/* ---------- 4. wording that is not on the home page ---------- */
// The team. A photo is used only when assets/team/<first-name>.jpg exists; otherwise the initials show.
export const TEAM = [
  { name: "Jackson Varela", ini: "JV" },
  { name: "Annie Wagner", ini: "AW" },
  { name: "Abigail Estes", ini: "AE" },
  { name: "Bella Gambaro", ini: "BG" }
].map((t) => ({ ...t, role: "University of Arkansas student", first: t.name.split(" ")[0], photo: "assets/team/" + slug(t.name.split(" ")[0]) + ".jpg" }));
export const hasPhoto = (t) => existsSync(p(t.photo));

// Why Northwest Arkansas: six market statistics, each with its source. They sit on the about page.
// (The home page keeps one sentence, the 2.7% unemployment figure, with the same source link.)
const TB_2026 = "https://talkbusiness.net/2026/04/northwest-arkansas-ranks-9th-fastest-growing-u-s-metro-first-time-in-top-10-since-at-least-2020/";
export const STATS = [
  { big: "622,177", text: "people in the Northwest Arkansas metro.", url: TB_2026, src: "U.S. Census Bureau estimate, July 2025, via Talk Business & Politics" },
  { big: "9th", text: "fastest-growing metro in the U.S.", url: TB_2026, src: "Census Bureau, via Talk Business & Politics" },
  { big: "38", text: "new residents a day.", url: "https://talkbusiness.net/2025/04/northwest-arkansas-council-focused-on-health-and-housing-marks-35-years/", src: "Talk Business & Politics, April 2025" },
  { big: "2.7%", text: "regional unemployment.", url: "https://nwacouncil.org/2025/10/27/planning-for-growth-insights-from-the-2025-state-of-the-region/", src: "2025 State of the Northwest Arkansas Region, Northwest Arkansas Council" },
  { big: "1,300+", text: "Walmart suppliers based in Northwest Arkansas.", url: "https://fortune.com/2024/06/07/walmart-bentonville-arkansas-headquarters-new-campus-company-town/", src: "Fortune, June 2024" },
  { big: "17 to 20%", text: "of U.S. businesses use AI at all (national data).", url: "https://census.gov/library/stories/2026/05/ai-use-businesses.html", src: "U.S. Census Bureau, May 2026" }
];
// The team's own interpretation of those numbers, always labeled as such.
export const STATS_READ = "with unemployment this low, hiring a full-time admin is hard. Flexible local help fills the gap. Only about 1 in 5 businesses use AI. Most small shops haven't had time to try AI. We set it up with you, in person.";

// The home page shows six questions. These five more appear on the about page and in llms-full.txt.
export const FAQ_MORE = [
  { q: "What happens over school breaks or when you graduate?", a: "We tell you our schedule up front, breaks included. Every task we take on gets a written how-to, so nothing lives in one person's head, and it is yours to keep." },
  { q: "What happens to my data?", a: "Wherever possible it stays in your own accounts. We tell you in writing which tools touch it, AI tools included, and we use settings that keep your data out of AI model training. We never sell or share it, and we delete working copies when a task is done." },
  { q: "Which tools do you use?", a: "The ones you already pay for, where possible: Google Workspace or Microsoft 365, your accounting and booking tools, your phone system. If something new would help, we tell you what it costs and you decide." },
  { q: "Will this replace my bookkeeper or CPA?", a: "No. We get the paperwork ready so they get clean records. Tax, payroll, legal decisions and moving money stay with them and with you." },
  { q: "Do you really come in person?", a: "Yes, anywhere in Benton and Washington counties, at your shop or a coffee shop. Video and phone work too." }
];

// What the free check-up includes (about page, llms.txt). The home page tells the same story as four steps and a cost block.
export const CHECKUP_NAME = "Free 30-minute check-up";
export const CHECKUP_INCLUDES = [
  "A 30-minute conversation at your business anywhere in Benton or Washington County, or by video or phone.",
  "We walk through your week together and list every recurring admin task and roughly how long it takes you.",
  "Within 3 business days, Your Admin Map arrives by email: your top 3 tasks to hand off, and for each one what we would do, what AI would draft, what stays with you, and what stays with your CPA or attorney.",
  "One quick win you can do yourself this week with tools you already pay for.",
  "If you want help, a flat written quote, good for 30 days. No pressure."
];
export const CHECKUP_TERMS = { lead: "Free.", rest: "No card, no obligation to hire us. No books, bank statements or passwords needed. You keep the Admin Map whether you hire us or not. About 35 minutes of your time: 30 to talk, 5 to read your map." };

// Boundary sentences used on the sub-pages and in the llms files.
export const NOT_WE = "We are not a CPA firm, law firm or payroll provider. If something needs one, we say so.";
export const TRUST = "Taxes, payroll, legal work and moving money stay with you and your licensed pros. We prep, draft and remind. You approve.";
export const NOT_SURE = "Not sure which of these you need?";

/* ---------- 5. reading the home page ---------- */
// Every question on the home page: [{ q, a, html }]. The open one carries <details open>.
export function homeFaq(html) {
  const box = must(html.match(/<div class="faq"[^>]*>([\s\S]*?)<\/div>/), "the .faq block in index.html")[1];
  return must([...box.matchAll(/<details[^>]*>\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>\s*<\/details>/g)].map((m) => ({ q: text(m[1]), a: text(m[2]), aHtml: m[2].trim() })), "questions inside .faq in index.html");
}
// Home questions first, then the extra ones (a question that is on the home page is never listed twice).
export function allFaq(html) {
  const home = homeFaq(html), seen = new Set(home.map((f) => f.q));
  return home.concat(FAQ_MORE.filter((f) => !seen.has(f.q)).map((f) => ({ ...f, aHtml: esc(f.a) })));
}
// Every promise: the visible list (#prom) and, when present, the rest inside the disclosure (#prom-more).
export function promiseItems(html) {
  const grab = (id) => { const m = html.match(new RegExp('id="' + id + '"[^>]*>([\\s\\S]*?)<\\/ol>')); return m ? [...m[1].matchAll(/<li\b[^>]*>[\s\S]*?<span>([\s\S]*?)<\/span>\s*<\/li>/g)].map((x) => x[1].trim()) : []; };
  return must(grab("prom").concat(grab("prom-more")), "promises (#prom) in index.html");
}
// The "How we handle your logins and data" rules.
export function dataRules(html) {
  return must([...must(html.match(/class="dataCard"[\s\S]*?<ul>([\s\S]*?)<\/ul>/), "the data card list in index.html")[1].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1].trim()), "data rules in index.html");
}
// The four steps: [{ h, ps: [..] }].
export function stepItems(html) {
  const block = must(html.match(/<ol class="steps"[^>]*>([\s\S]*?)<\/ol>/), "the steps (#steps) in index.html")[1];
  return must([...block.matchAll(/<h[34]>([\s\S]*?)<\/h[34]>([\s\S]*?)<\/li>/g)].map((m) => ({ h: text(m[1]), ps: [...m[2].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((x) => x[1].trim()) })), "steps in index.html");
}
// The line under the primary button, as the hero says it.
export function microLine(html) {
  return must(html.match(/<section class="hero[\s\S]*?<p class="micro">([\s\S]*?)<\/p>/), "the hero micro line in index.html")[1].trim();
}
