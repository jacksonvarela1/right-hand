# Right Hand NWA

Admin and AI help for Northwest Arkansas small businesses, from four University of Arkansas students: Jackson Varela, Annie Wagner, Abigail Estes and Bella Gambaro.

AI drafts, a person on our team checks, and the owner approves. Nothing goes out in an owner's name until they say yes. Tax, payroll, legal work and moving money stay with the owner and their licensed pros.

Live site: https://righthandnwa.com
Contact: righthandnwa@gmail.com · Instagram: @righthandnwa

## About the site

Static files only, no libraries. One optional build step: after editing `assets/services-data.js`, the FAQ, the check-up list or the promises, run `node tools/build-services.mjs`. It writes the services catalog into `index.html` as static HTML (so search and AI crawlers that skip JavaScript see every service), refreshes the JSON-LD in the head, and regenerates `llms.txt` and `llms-full.txt`. `site.js` enhances the static catalog in place, and still renders from the data file if the markers are empty.

Also at the root: `robots.txt` (all crawlers allowed, AI crawlers named), `sitemap.xml`, `404.html`.

Files:

- `index.html`, `assets/site.css`, `assets/site.js`: the page, brand system and page behavior.
- `assets/nwa-map.js`: the hero map of Northwest Arkansas (schematic, not to scale) feeding a sample task queue.
- `assets/demo-player.js`: the shared player for the six live demos (autoplay, pause offscreen, one demo at a time, hand-off to the visitor, reduced-motion stepping).
- `assets/demos/*.js|css`: the six demos (missed call, inbox, receipts, invoices, automation, weekly report).
- `assets/services-data.js`: the services catalog.
- `assets/interest.js`: the email updates pop-up (FormSubmit to righthandnwa@gmail.com, with an email fallback).
- `assets/motion.js`, `assets/motion.css`: the motion system on all three pages (first-visit intro on the home page, `data-fx` section entrances, section HUD, towns ticker, parallax, cursor spotlight, magnetic CTAs, button and link icons). Reduced motion and the Pause motion button get the finished, static page.
- `assets/close.js`, `assets/close.css`: the closing devices on the home page (the three-tap "Find your first handoff" quiz that builds a sample Admin Map and pre-fills the check-up form, the desktop check-up pill, the proof lines under the main buttons and the form's success moment). They use `RH.composer.prefill` and the `rh:draft` event from `site.js`.

Every demo business, name and number is made up and labeled as sample. Nothing typed into a demo leaves the browser. The check-up form only writes an email draft in the visitor's own email app. Every statistic on the page links to its source.

Fonts: Plus Jakarta Sans and Geist Mono, self-hosted under the SIL Open Font License (license files in `assets/fonts`). Icons drawn for Right Hand.
