/* Right Hand NWA: the email sign-up, inline (#signup) and as a dialog (#interest) that opens only on an explicit tap. */
(function () {
  "use strict";
  // Sign-ups go to a Google Form owned by righthandnwa@gmail.com (responses tab plus email alerts).
  // The address and question ids live in assets/config.js (RH_CONFIG.signup) next to the check-up form's, so one edit
  // moves both. These copies are the fallback for a page that does not load config.js.
  var SG = (window.RH_CONFIG && window.RH_CONFIG.signup) || {};
  var ENDPOINT = SG.endpoint || "https://docs.google.com/forms/d/e/1FAIpQLScthXfEx8WRH-UOFJgcvtD2Zo4NrtUutI3HHeGuptyLz_Jd5w/formResponse";
  var FIELDS = SG.fields || { email: "entry.848100374", business: "entry.1907144585", city: "entry.736194494", interests: "entry.537803960", source: "entry.2127818100" };
  var INSTAGRAM = "https://www.instagram.com/righthandnwa/";
  var KEY = "rhnwa-interest";
  var RM = matchMedia("(prefers-reduced-motion: reduce)");
  // The inline form (#signup) saves to the same list as the pop-up. It tells the page what is happening through
  // "rh:signup" events (type, armed, sent, fail) so assets/field.js can animate the envelope; it works without that file.
  function send(data) {
    var body = new URLSearchParams();
    Object.keys(FIELDS).forEach(function (k) { body.append(FIELDS[k], data[k] || ""); });
    // Google Forms does not send CORS headers, so the reply is opaque: a resolved fetch means it was delivered.
    return fetch(ENDPOINT, { method: "POST", mode: "no-cors", body: body }).then(function () { store("joined"); });
  }
  (function inline() {
    var sec = document.getElementById("signup"), f = sec && sec.querySelector("form");
    if (!f) return;
    var email = f.elements.email, st = sec.querySelector("[data-status]"), dn = sec.querySelector("[data-done]"), btn = f.querySelector("button[type=submit]"), field = sec.querySelector(".sg-field");
    function tell(type) { try { document.dispatchEvent(new CustomEvent("rh:signup", { detail: { type: type } })); } catch (e) {} }
    email.addEventListener("input", function () {
      var ok = email.value.trim() !== "" && email.checkValidity();
      sec.classList.toggle("sg-armed", ok);
      if (field) field.style.setProperty("--fill", ok ? "1" : Math.min(.9, email.value.length / 24).toFixed(3));
      email.removeAttribute("aria-invalid"); st.textContent = "";
      tell(ok ? "armed" : "type");
    });
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!email.value.trim() || !email.checkValidity()) { email.setAttribute("aria-invalid", "true"); st.textContent = "Add a valid email address."; email.focus(); return; }
      if (f.elements._honey && f.elements._honey.value) return;
      btn.disabled = true; st.textContent = "Sending…";
      send({ email: email.value.trim(), business: "", city: "", interests: "(inline form)", source: location.href + " | inline form" + (document.referrer ? " | ref " + document.referrer : "") })
        .then(function () {
          st.textContent = ""; f.hidden = true; dn.hidden = false; sec.classList.add("sg-sent");
          var h = dn.querySelector("h3"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
          tell("sent");
        })
        .catch(function () {
          btn.disabled = false;
          st.innerHTML = 'That didn’t go through. <a href="mailto:righthandnwa@gmail.com?subject=Interested%20in%20Right%20Hand%20NWA">Email us instead</a>.';
          tell("fail");
        });
    });
  })();
  var dlg = document.getElementById("interest");
  if (!dlg) return;
  var form = dlg.querySelector("form"), status = dlg.querySelector("[data-status]"), done = dlg.querySelector("[data-done]");
  function store(v) { try { localStorage.setItem(KEY, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {} }
  // The dialog opens only when a visitor asks for it (any [data-open-interest] link). It never opens by itself:
  // no timer, no scroll trigger, no exit intent.
  function open() {
    if (dlg.open) return;
    var other = document.querySelector("dialog[open]");
    if (other && typeof other.close === "function") other.close();   // the menu sheet hands over
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    var first = dlg.querySelector("input[type=email]"); if (first) setTimeout(function () { first.focus(); }, 60);
  }
  function close(remember) { if (remember) store("dismissed"); if (typeof dlg.close === "function") dlg.close(); else dlg.removeAttribute("open"); }
  dlg.addEventListener("cancel", function () { store("dismissed"); });
  dlg.addEventListener("click", function (e) {
    if (e.target.closest("[data-close]")) { close(true); return; }
    if (e.target === dlg) { var r = dlg.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close(true); }
  });
  document.querySelectorAll("[data-open-interest]").forEach(function (b) { b.addEventListener("click", function (e) { e.preventDefault(); open(); }); });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = form.elements.email;
    if (!email.value.trim() || !email.checkValidity()) { email.setAttribute("aria-invalid", "true"); status.textContent = "Add a valid email address."; email.focus(); return; }
    email.removeAttribute("aria-invalid");
    if (form.elements._honey && form.elements._honey.value) return;
    var interests = Array.prototype.slice.call(form.querySelectorAll('input[name="interest"]:checked')).map(function (i) { return i.value; });
    var data = {
      email: email.value.trim(),
      business: form.elements.business.value,
      city: form.elements.city.value,
      interests: interests.join(", ") || "(none picked)",
      source: location.href + (document.referrer ? " | ref " + document.referrer : "")
    };
    var body = new URLSearchParams();
    Object.keys(FIELDS).forEach(function (k) { body.append(FIELDS[k], data[k] || ""); });
    var btn = form.querySelector("button[type=submit]");
    btn.disabled = true; status.textContent = "Sending…";
    // Google Forms does not send CORS headers, so the reply is opaque: a resolved fetch means it was delivered.
    fetch(ENDPOINT, { method: "POST", mode: "no-cors", body: body })
      .then(function () {
        store("joined"); form.hidden = true; done.hidden = false; status.textContent = "";
        var h = done.querySelector("h2"); if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
      })
      .catch(function () {
        btn.disabled = false;
        var mbody = "Hi Right Hand NWA,%0D%0A%0D%0AI'm interested. Email: " + encodeURIComponent(data.email) + "%0D%0ABusiness: " + encodeURIComponent(data.business) + "%0D%0ACity: " + encodeURIComponent(data.city) + "%0D%0AInterested in: " + encodeURIComponent(data.interests);
        status.innerHTML = 'That didn’t go through. <a href="mailto:righthandnwa@gmail.com?subject=Interested%20in%20Right%20Hand%20NWA&body=' + mbody + '">Email us instead</a>.';
      });
  });
  window.RHInterest = { open: open, instagram: INSTAGRAM };
})();
