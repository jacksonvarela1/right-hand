# Right Hand NWA

Admin and AI help for Northwest Arkansas small businesses, from four University of Arkansas students: Jackson Varela, Annie Wagner, Abigail Estes and Bella Gambaro.

AI drafts, a person on our team checks, and the owner approves. Nothing goes out in an owner's name until they say yes. Tax, payroll, legal work and moving money stay with the owner and their licensed pros. The first step is a free 30-minute check-up.

Live site: https://righthandnwa.com
Contact: righthandnwa@gmail.com · Instagram: @righthandnwa

## About the site

Static files only: no libraries and no CDNs. The Content-Security-Policy allows scripts from this site only, plus one small inline script named by its sha256 hash (`assets/boot.js`, put in each page's head by the build), and connections to docs.google.com only. Three pages: the home page (`index.html`), `services/` and `about/`.

The home page answers an owner's questions in the order they ask them: hero, who we are, find your first handoff (the quiz), a week with us (the scroll story), how it works and what it costs, the prototypes, the services teaser, promises, six questions, the check-up request, the email sign-up, footer.

### Build step

Three tools, no dependencies (Node 18 or newer). The first two call the third themselves, so the build is still one line. Run it after editing **any stylesheet**, `assets/boot.js`, any script, `assets/services-data.js`, `assets/nwa-map.js`, `tools/lib.mjs` or the home page's own wording, and commit what it writes:

    node tools/build-services.mjs && node tools/build-pages.mjs

Running it twice in a row changes nothing.

**A stylesheet edit does not show in a browser until the build has run**: the pages load a generated bundle, not `assets/site.css` and its siblings directly. After editing only stylesheets or scripts, this is enough (and fast):

    node tools/build-head.mjs

- `tools/build-services.mjs` writes the generated regions of `index.html` (between `<!-- name:start -->` and `<!-- name:end -->` markers: `head`, `nwa`, `team`, `services-teaser`, `stays-line`, `services-all`, `jsonld`), plus `llms.txt`, `llms-full.txt` and `assets/demos.css` (the stylesheets of all prototypes as one late file, in the order of the panels in `index.html`). Never edit those regions or `assets/demos.css` by hand. It stops if a prototype panel has no script or stylesheet, or if a service links to a prototype that is not on the page.
- `tools/build-pages.mjs` writes all of `services/index.html` and `about/index.html`, plus `sitemap.xml`. The header, menu sheet, phone bar and footer of both pages are copied from `index.html` (the `chrome:*` marker regions), so the three pages cannot drift apart.
- `tools/build-head.mjs` makes each page's first paint need only its HTML. For all three pages it:
  - writes the page's stylesheets as one file: `assets/bundle-home.css` (site, motion, close, field, lab) and `assets/bundle-sub.css` (site, pages, motion). Never edit a bundle by hand;
  - puts the critical CSS inline in the head: every rule that can apply to the header and the first screen, picked from the bundle by reading the page's own markup (no browser involved). The first screen is the page's first two sections; the list is `PAGES` at the top of the tool;
  - places the bundle's stylesheet link in the body, right after the first screen, and preloads it from the head. A browser paints everything above that link without waiting for the file, and runs the deferred scripts once the file is in, so no script measures a half-styled page. It works the same with JavaScript off;
  - puts `assets/boot.js` inline in the head and writes its sha256 into `script-src` of the Content-Security-Policy meta. **After editing `assets/boot.js`, run the build**: a page with the old hash would have its inline script refused (the same file also loads as the first deferred script and then does the job late, so the page still works);
  - stamps every `assets/...` address with `?v=<first 8 hex digits of the file's sha256>`, so a deploy never pairs new HTML with an old stylesheet or script. `assets/lab.js` hands its stamp on to the files it loads late, so its stamp covers them too.
- `tools/lib.mjs` holds what the tools share: site constants, the sitemap date (`LASTMOD`, bumped by hand), and the wording that is on the sub-pages but not on the home page (the team list, the six market statistics, five extra questions, what the check-up includes).
- The JSON-LD of each page sits at the end of `<body>`, so nothing a visitor cannot see stands between them and the headline.
- Team photos: drop `assets/team/<first-name>.jpg` (square) and run the tools. Without a file the initials show; nothing ever points at a missing image.

### Portable to a second address

Every internal link and asset path on every page is relative (`services/`, `../#checkup`, `./`), so the same files work at a domain root and under any sub-path (a mirror). `tools/build-pages.mjs` refuses to write a page that contains a root-absolute link. Canonical, Open Graph and JSON-LD addresses always point at https://righthandnwa.com/. `404.html` is hand-written and self-contained (inline styles, no script); see the comment at its top.

### Files

- `index.html`, `assets/site.css`, `assets/site.js`: the home page, the brand system and the home page's behavior (the check-up form, counters, step sequences).
- `assets/boot.js`: runs before first paint on every page (inline in the head, see the build step); marks JavaScript and motion state. There is no intro and no cover. It also watches over parts that only work with their own script: a section that carries `data-needs="<class>"` (the quiz) goes back to its plain form when the script that sets that class on `<html>` never arrived.
- `assets/bundle-home.css`, `assets/bundle-sub.css`: generated, the one stylesheet each page loads (see the build step).
- Nothing is hidden while it waits for a script: a block's "before" state needs a class that the script which reveals it has set, phones and tablets never hide a block that is still below the screen, and the two entrances that clear their stage first (the corridor map's queue, the Admin Map folder) do so only when the block is within one screen of the viewport and play at the latest 0.6 s after its first pixel shows.
- `assets/nav.js`: on every page; the menu sheet, the phone bar (shown below 900 px once the hero is out of view, hidden over the check-up form and while a text field has focus) and the Pause motion control inside the menu.
- `assets/motion.js`, `assets/motion.css`: the motion system on all three pages (`data-fx` section entrances, section HUD, parallax, cursor spotlight, magnetic buttons, the Admin Map folder). Reduced motion and the Pause motion button get the finished, static page.
- `assets/field.js`, `assets/field-shapes.js`, `assets/field.css`: the particle field (hero, the pinned scroll story, the sign-up envelope, the closing words). Without WebGL every section keeps its still fallback. A watchdog gives a machine that cannot keep up one still frame instead of a loop (and the story as a plain list): when the graphics are drawn in software (no GPU: SwiftShader, llvmpipe, WARP, the Basic Render Driver), or when the middle gap of the first 20 or so frames is over 28 ms. A phone that caps animation at 30 frames a second (an iPhone in Low Power Mode) falls under that rule too; the threshold is `SLOW` in `assets/field.js`. **To see or record the moving field on a machine without a GPU** (a test lab, a remote desktop), add `?field=live` to the address.
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

Fonts: Plus Jakarta Sans and Geist Mono, self-hosted under the SIL Open Font License (license files in `assets/fonts`). The first paint does not wait for them: until Plus Jakarta Sans arrives the text is set in a font the device already has, scaled to the same width (`RH Sans Fallback` in `assets/site.css`), so lines break in the same places and nothing moves when the real font swaps in. Icons drawn for Right Hand.
