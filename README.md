# Right Hand NWA

Admin and AI help for Northwest Arkansas small businesses, from four University of Arkansas students: Jackson Varela, Annie Wagner, Abigail Estes and Bella Gambaro.

AI drafts, a person on our team checks, and the owner approves. Nothing goes out in an owner's name until they say yes. Tax, payroll, legal work and moving money stay with the owner and their licensed pros. The first step is a free 30-minute check-up.

Live site: https://righthandnwa.com
Contact: righthandnwa@gmail.com · Instagram: @righthandnwa

## About the site

Static files only: no libraries, no CDNs, no inline scripts (the Content-Security-Policy allows scripts from this site only and connections to docs.google.com only). Three pages: the home page (`index.html`), `services/` and `about/`.

The home page answers an owner's questions in the order they ask them: hero, who we are, find your first handoff (the quiz), a week with us (the scroll story), how it works and what it costs, the prototypes, the services teaser, promises, six questions, the check-up request, the email sign-up, footer.

### Build step

Two tools, no dependencies (Node 18 or newer). Run both after editing `assets/services-data.js`, `assets/nwa-map.js`, `tools/lib.mjs`, a prototype stylesheet (`assets/demos/<name>.css`) or the home page's own wording, and commit what they write:

    node tools/build-services.mjs && node tools/build-pages.mjs

Running them twice in a row changes nothing.

- `tools/build-services.mjs` writes the generated regions of `index.html` (between `<!-- name:start -->` and `<!-- name:end -->` markers: `jsonld`, `nwa`, `team`, `services-teaser`, `stays-line`, `services-all`), plus `llms.txt`, `llms-full.txt` and `assets/demos.css` (the stylesheets of all prototypes as one late file, in the order of the panels in `index.html`). Never edit those regions or `assets/demos.css` by hand. It stops if a prototype panel has no script or stylesheet, or if a service links to a prototype that is not on the page.
- `tools/build-pages.mjs` writes all of `services/index.html` and `about/index.html`, plus `sitemap.xml`. The header, menu sheet, phone bar and footer of both pages are copied from `index.html` (the `chrome:*` marker regions), so the three pages cannot drift apart.
- `tools/lib.mjs` holds what both tools share: site constants, the sitemap date (`LASTMOD`, bumped by hand), and the wording that is on the sub-pages but not on the home page (the team list, the six market statistics, five extra questions, what the check-up includes).
- Team photos: drop `assets/team/<first-name>.jpg` (square) and run the tools. Without a file the initials show; nothing ever points at a missing image.

### Portable to a second address

Every internal link and asset path on every page is relative (`services/`, `../#checkup`, `./`), so the same files work at a domain root and under any sub-path (a mirror). `tools/build-pages.mjs` refuses to write a page that contains a root-absolute link. Canonical, Open Graph and JSON-LD addresses always point at https://righthandnwa.com/. `404.html` is hand-written and self-contained (inline styles, no script); see the comment at its top.

### Files

- `index.html`, `assets/site.css`, `assets/site.js`: the home page, the brand system and the home page's behavior (the check-up form, counters, step sequences).
- `assets/boot.js`: runs before first paint on every page; marks JavaScript and motion state. There is no intro and no cover.
- `assets/nav.js`: on every page; the menu sheet, the phone bar (shown below 900 px once the hero is out of view, hidden over the check-up form and while a text field has focus) and the Pause motion control inside the menu.
- `assets/motion.js`, `assets/motion.css`: the motion system on all three pages (`data-fx` section entrances, section HUD, parallax, cursor spotlight, magnetic buttons, the Admin Map folder). Reduced motion and the Pause motion button get the finished, static page.
- `assets/field.js`, `assets/field-shapes.js`, `assets/field.css`: the particle field (hero, the pinned scroll story, the sign-up envelope, the closing words). Needs hardware WebGL; without it every section keeps its still fallback.
- `assets/nwa-map.js`: the schematic corridor map of Northwest Arkansas (not to scale) feeding a sample task queue, beside the team.
- The prototype lab (`#demos` on the home page): eight prototypes (missed call, inbox, receipts, invoices, automation, weekly report, quotes, review replies), one open at a time.
  - `assets/lab.js` and `assets/lab.css` load with the page: the ticket rail as tabs (arrow keys, Home, End), the dock with previous and next, the one call to action, and every link to `#demo-<name>` or `#demos`. Without JavaScript the eight panels are stacked and the tickets are jump links.
  - `assets/demo-player.js`, `assets/demos/<name>.js` and `assets/rail.js` load late, with one stylesheet, `assets/demos.css`: when a visitor comes within about 1.5 screens of the lab, presses a link that leads to it, or a few seconds after the page has loaded. `assets/demos.css` is generated by `tools/build-services.mjs` from `assets/demos/<name>.css`; edit those and run the build.
  - To add a prototype: add its ticket and its `<section class="demo" id="demo-<name>" data-ask="...">` panel to `index.html`, add `assets/demos/<name>.js` and `.css`, and run the build. The rail, the tabs, the counts and the late stylesheet follow the panels in the page.
  - On phones a prototype with several parts shows one part at a time (the player's `views`), so a stage stays near one screen and nothing inside it scrolls on its own.
- `assets/services-data.js`: the services catalog (38 services in six lines), read by the quiz, the check-up message and both build tools.
- `assets/close.js`, `assets/close.css`: the three-tap "Find your first handoff" quiz that builds a sample Admin Map and pre-fills the check-up form, the floating check-up pill (900 px and wider) and the form's success moment. They use `RH.composer.prefill` and the `rh:draft` event from `site.js`.
- `assets/interest.js`: the email sign-up, inline and as a dialog that opens only when a visitor taps a link for it. It posts to a Google Form owned by righthandnwa@gmail.com, with an email link as the fallback.
- `assets/pages.css`: styles for `services/` and `about/` only.
- Also at the root: `robots.txt` (all crawlers allowed, AI crawlers named), `sitemap.xml`, `404.html`, `llms.txt`, `llms-full.txt`.

### Honesty rules

Every demo business, name and number is made up and labeled as sample. No reviews, clients, testimonials, prices, hours-saved claims or statistics are invented, and every statistic links to its source. Nothing typed into a prototype leaves the browser. The check-up form and the email sign-up send what the visitor enters, the address of the page and the address of the page that linked there to a Google Form owned by righthandnwa@gmail.com (settings in `assets/config.js`; with an empty endpoint the check-up form sends nothing and opens an email draft instead). A request counts as sent only when the post reaches Google; if it does not, the form says so and offers Instagram, an email draft and a copy of the message. If a form's behavior changes, every sentence that describes it (the footer, this file, `tools/build-services.mjs`, the forms' own fine print) changes in the same commit.

Fonts: Plus Jakarta Sans and Geist Mono, self-hosted under the SIL Open Font License (license files in `assets/fonts`). Icons drawn for Right Hand.
