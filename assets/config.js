/* Right Hand NWA: the few settings a non-programmer may need to change. Loaded before site.js on the home page.

   checkup.endpoint is where a check-up request is sent. Today it is the same Google Form as the email sign-up
   (owned by righthandnwa@gmail.com), so requests arrive in that form's Responses tab as rows whose "Interested in"
   answer starts with CHECK-UP REQUEST. To move requests to their own form: make a Google Form with five short-answer
   questions, nothing required and no validation, then paste its formResponse address and the five entry ids here.
   Leave endpoint empty ("") and the form sends nothing: it opens an email draft in the visitor's own email app instead.

   If you change what the form sends, change the sentences that describe it in the same commit: the footer of
   index.html, README.md and tools/build-services.mjs. */
window.RH_CONFIG = {
  email: "righthandnwa@gmail.com",
  instagram: "righthandnwa",
  checkup: {
    endpoint: "https://docs.google.com/forms/d/e/1FAIpQLScthXfEx8WRH-UOFJgcvtD2Zo4NrtUutI3HHeGuptyLz_Jd5w/formResponse",
    fields: {
      contact: "entry.848100374",   // the form's "Email" question: holds the cell number or email the visitor gave
      who: "entry.1907144585",      // "Business": name and business
      town: "entry.736194494",      // "Town"
      details: "entry.537803960",   // "Interested in": CHECK-UP REQUEST, then what they picked
      source: "entry.2127818100"    // "Source page": where the visitor came from
    },
    timeoutMs: 8000
  }
};
