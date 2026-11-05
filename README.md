# Right Hand NWA

Admin and AI help for Northwest Arkansas small businesses, from four University of Arkansas students: Jackson Varela, Annie Wagner, Abigail Estes and Bella Gambaro.

AI drafts, a person on our team checks, and the owner approves. Nothing goes out in an owner's name until they say yes. Tax, payroll, legal work and moving money stay with the owner and their licensed pros.

Live site: https://righthandnwa.com
Contact: righthandnwa@gmail.com · Instagram: @righthandnwa

## About the site

Static files only, no build step and no libraries:

- `index.html`, `assets/site.css`, `assets/site.js`: the page, brand system and page behavior.
- `assets/nwa-map.js`: the hero map of Northwest Arkansas (schematic, not to scale) feeding a sample task queue.
- `assets/demo-player.js`: the shared player for the six live demos (autoplay, pause offscreen, one demo at a time, hand-off to the visitor, reduced-motion stepping).
- `assets/demos/*.js|css`: the six demos (missed call, inbox, receipts, invoices, automation, weekly report).
- `assets/services-data.js`: the services catalog.
- `assets/interest.js`: the email updates pop-up (FormSubmit to righthandnwa@gmail.com, with an email fallback).

Every demo business, name and number is made up and labeled as sample. Nothing typed into a demo leaves the browser. The check-up form only writes an email draft in the visitor's own email app. Every statistic on the page links to its source.

Fonts: Plus Jakarta Sans and Geist Mono, self-hosted under the SIL Open Font License (license files in `assets/fonts`). Icons drawn for Right Hand.
