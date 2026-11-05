/* Right Hand NWA services catalog. Classic script: sets window.RH_SERVICES for the services grid and picker. No prices anywhere. */
window.RH_SERVICES = {
  who: [
    { id: "home", label: "Home services" },
    { id: "shops", label: "Shops and restaurants" },
    { id: "salons", label: "Salons and studios" },
    { id: "auto", label: "Auto shops" },
    { id: "supplier", label: "Supplier and vendor offices" },
    { id: "pro", label: "Professional offices" }
  ],
  lines: [
    {
      id: "money", name: "Money admin", note: "Prep only. You and your CPA decide.", icon: "receipt",
      items: [
        {
          id: "receipts", name: "Receipt capture and categorizing",
          sum: "Receipts and bills gathered in one place, sorted, with questions flagged weekly.",
          tag: "ai", who: ["home", "shops", "auto", "salons"], demo: "#demo-receipts",
          rows: {
            handoff: "Receipt photos and emailed bills, sent whatever way is easiest for you.",
            back: "Everything in one place, like QuickBooks receipt forwarding or the app you already use, with the queue cleared weekly and a short question list.",
            ai: "AI reads each receipt and suggests the vendor, date, amount and category.",
            person: "A person checks every category. You or your bookkeeper approve.",
            never: "We never file taxes and never hold your bank logins.",
            example: "Example: a Springdale food truck snaps receipts at the commissary all week, and by Friday they are sorted with three questions waiting."
          }
        },
        {
          id: "expenses", name: "Monthly expense review",
          sum: "Totals by category each month, checked against last month and traced to receipts.",
          tag: "ai", who: ["shops", "pro", "supplier", "home"], demo: "#demo-receipts",
          rows: {
            handoff: "An export from your books, or view-only access you set up in QuickBooks or your accounting app.",
            back: "Totals by category, checked against last month, with every line traced to its transaction and receipt and open questions flagged for you.",
            ai: "AI drafts the month's summary and points out lines that look different from last month.",
            person: "A person traces every line to its transaction and receipt before you see it.",
            never: "We never change your books without your OK, file anything or move money.",
            example: "Example: a Cave Springs insurance agency sees software costs jump in March, and the review flags a duplicate charge to ask about."
          }
        },
        {
          id: "invoices", name: "Invoices and overdue follow-ups",
          sum: "Reminders on, past-due follow-ups drafted, and a weekly who-owes-what list.",
          tag: "ai", who: ["home", "auto", "pro", "supplier"], demo: "#demo-invoices",
          rows: {
            handoff: "Your invoicing tool, like QuickBooks or Square, and the customers you want followed up.",
            back: "Automatic reminders turned on in your invoicing tool, personal follow-ups drafted for anything past due, and a weekly who-owes-what list.",
            ai: "AI drafts polite follow-ups in your voice from the invoice details.",
            person: "A person checks each draft against the invoice. You approve the wording before anything sends.",
            never: "We never collect or move money, change terms, add fees or threaten anyone.",
            example: "Example: a Rogers HVAC company after a cold snap has forty open invoices, and Monday's list shows who to nudge first."
          }
        },
        {
          id: "quotes", name: "Quotes and estimates",
          sum: "Quotes drafted from your own price sheet and a job-site voice note.",
          tag: "ai", who: ["home", "auto", "supplier"],
          rows: {
            handoff: "Your price sheet and a quick voice note or photos from the job site.",
            back: "A clean quote ready for your review, plus a follow-up if the customer goes quiet.",
            ai: "AI turns your voice note into line items, using only your own price sheet.",
            person: "A person checks every line against your price sheet. You set every price.",
            never: "We never set, change or discount a price, and never send a quote you have not approved.",
            example: "Example: a Fayetteville landscaping crew records a two-minute walkthrough, and the quote is waiting for review before the truck leaves."
          }
        },
        {
          id: "renewals", name: "Bills-due and renewals calendar",
          sum: "Reminders before licenses, insurance, permits and registrations come due.",
          tag: "we", who: ["home", "auto", "pro", "salons"],
          rows: {
            handoff: "Your license, insurance, permit and registration paperwork, or just a list of what you renew each year.",
            back: "Reminders 60, 30 and 7 days out for licenses, insurance, vendor certificates, domains, permits, vehicle registrations and the state annual report.",
            ai: "Not needed for this one. It is a calendar built from your paperwork.",
            person: "A person checks every date against the paperwork and updates the calendar after each renewal.",
            never: "We never file or pay anything. You or your licensed pro file and pay.",
            example: "Example: a Lowell trucking outfit gets a 60-day heads-up on three truck registrations and its insurance renewal."
          }
        },
        {
          id: "cpa", name: "CPA and bookkeeper prep",
          sum: "Statements, receipts and reports gathered and labeled for the pros who file.",
          tag: "we", who: ["pro", "shops", "salons", "home"],
          rows: {
            handoff: "Statements you download, your receipts, and the request list from your CPA or bookkeeper.",
            back: "One labeled folder that matches your CPA's list, with gaps flagged early instead of in April.",
            ai: "Not needed for this one. It is gathering, labeling and checking a list.",
            person: "A person matches every item to your CPA's request list before anything is shared.",
            never: "We never prepare or file returns, give tax advice or hold your bank logins.",
            example: "Example: a Farmington salon owner hands over a shoebox of paper in January, and the CPA gets a labeled folder by February."
          }
        },
        {
          id: "subscriptions", name: "Software subscription cleanup",
          sum: "Every software subscription listed with seats, renewal dates and overlaps flagged.",
          tag: "we", who: ["pro", "supplier", "shops"],
          rows: {
            handoff: "Statements you download, or a list of the apps your team logs into.",
            back: "One list of every subscription with seats, renewal date and any overlaps flagged.",
            ai: "Not needed for this one. A person reads the statements and builds the list.",
            person: "A person confirms each seat count with you before anything is marked unused.",
            never: "We never cancel anything for you or promise savings. You decide every cancel.",
            example: "Example: a Centerton marketing office finds two video tools doing the same job, and the owner decides which one stays."
          }
        }
      ]
    },
    {
      id: "front", name: "Customers and front desk", note: "Nothing goes out in wording you have not approved.", icon: "chat",
      items: [
        {
          id: "inbox", name: "Inbox triage and reply drafts",
          sum: "Your inbox sorted daily, with replies drafted in your voice for you to send.",
          tag: "ai", who: ["supplier", "pro", "home"], demo: "#demo-inbox",
          rows: {
            handoff: "Access to your Gmail or Outlook inbox, plus a few notes on who matters most.",
            back: "Labels and filters, a daily list of what needs you, and replies drafted in your voice waiting in Drafts.",
            ai: "AI sorts mail into labels and drafts replies from your past emails and approved facts.",
            person: "A person checks the daily list and every draft. You send.",
            never: "We never agree to prices or dates you have not set, and never delete mail permanently.",
            example: "Example: a Bentonville supplier office has its inbox sorted before 8 AM, with five reply drafts ready to review."
          }
        },
        {
          id: "textback", name: "Missed-call text-back and booking",
          sum: "Missed callers get an instant text offering your real open slots.",
          tag: "we", who: ["auto", "home", "salons"], demo: "#demo-calls",
          rows: {
            handoff: "Your business phone number, open hours, and the wording you want missed callers to see.",
            back: "An instant text to every missed caller, in wording you approved, that offers your real open slots and holds one until you confirm.",
            ai: "Not needed for this one. The text is your approved wording, sent by your phone system.",
            person: "A person sets up carrier registration (A2P 10DLC) with you before anything sends, then checks the message log weekly.",
            never: "We never send marketing blasts, text before registration is approved, or ignore a STOP reply.",
            example: "Example: a Springdale auto shop misses a call during an oil change, and the caller picks Thursday at 10, held until the owner confirms."
          }
        },
        {
          id: "phone", name: "AI phone answering, inbound only",
          sum: "An assistant answers inbound calls from approved facts and routes urgent ones to you.",
          tag: "ai", who: ["home", "auto", "pro"],
          rows: {
            handoff: "Your hours, services, service area and the facts you approve, plus which words mean urgent.",
            back: "Calls answered with the caller's name and reason taken, and urgent words like leak or no heat routed to your phone.",
            ai: "AI answers inbound calls from your approved facts and says it is an assistant. After hours, a person replies the next business day.",
            person: "We run test calls with you before launch and review transcripts weekly for the first month.",
            never: "We never make outbound AI calls, and the assistant never quotes prices you have not approved.",
            example: "Example: a Prairie Grove plumber gets a no-water call at 9 PM routed to his cell, while routine calls wait for morning."
          }
        },
        {
          id: "chat", name: "Website chat assistant",
          sum: "A chat assistant that answers from your approved FAQ and hands off the rest.",
          tag: "ai", who: ["shops", "salons", "pro"],
          rows: {
            handoff: "Your FAQ, hours and policies, or the questions customers ask you most.",
            back: "A chat on your site that answers only from your approved FAQ and collects contact details for everything else.",
            ai: "AI answers from your approved FAQ only and introduces itself as an assistant.",
            person: "Anything outside the FAQ goes to a person, and we read the chat logs with you to update the FAQ.",
            never: "We never let it guess, quote prices you have not approved, or pretend to be a person.",
            example: "Example: a Bentonville bike shop gets asked about Sunday hours at midnight, and the chat answers straight from the FAQ."
          }
        },
        {
          id: "intake", name: "Lead intake form that routes itself",
          sum: "One short form that logs each request and alerts the right person.",
          tag: "we", who: ["home", "pro", "auto"],
          rows: {
            handoff: "The questions you need answered before you call someone back, and who handles what.",
            back: "A form on your site and Google profile that logs each request in a sheet or CRM, alerts the right person and sends a we-got-it reply.",
            ai: "Not needed for this one. Simple rules route each request.",
            person: "A person test-submits the form with you and checks that every alert lands.",
            never: "The form never asks for card numbers, SSNs or health details.",
            example: "Example: a Fayetteville roofer in a hail week gets sixty requests, each one logged and routed to the right crew lead."
          }
        },
        {
          id: "crm", name: "CRM setup and cleanup",
          sum: "Contacts cleaned up in one simple pipeline with follow-up tasks.",
          tag: "we", who: ["pro", "supplier", "home"],
          rows: {
            handoff: "Your contact lists, spreadsheets and old email, and how you track jobs today.",
            back: "Contacts imported and de-duplicated, a simple pipeline (New, Quoted, Won, Lost) and follow-up tasks.",
            ai: "Not needed for this one. It is careful importing, matching and setup.",
            person: "A person checks merged duplicates by hand. You approve the stages.",
            never: "We never buy lists or send cold bulk email.",
            example: "Example: a Rogers event venue tracking inquiries in three spreadsheets moves to one pipeline with every open date in view."
          }
        },
        {
          id: "quotefollow", name: "Quote follow-ups",
          sum: "Polite nudges on open quotes, drafted for your OK.",
          tag: "ai", who: ["home", "auto", "supplier"],
          rows: {
            handoff: "Your list of open quotes, or access to the tool where they live.",
            back: "A weekly list of quotes gone quiet, each with a short, polite nudge drafted for your OK.",
            ai: "AI drafts each nudge from the quote details and your past wording.",
            person: "A person checks every draft against the quote. You approve before anything sends.",
            never: "We never discount, change the scope or pressure a customer.",
            example: "Example: a Gentry fence company has twelve quotes over two weeks old, and Friday's nudges are ready to approve in one batch."
          }
        }
      ]
    },
    {
      id: "schedule", name: "Scheduling and follow-ups", note: "Your hours and your rules. We never book outside them.", icon: "calendar",
      items: [
        {
          id: "booking", name: "Booking page",
          sum: "Online booking in the tool you already use, with real hours and reminders.",
          tag: "we", who: ["salons", "auto", "pro"],
          rows: {
            handoff: "Your hours, your services, how long each one takes and the buffer you need between them.",
            back: "A booking page in the tool you already use, with your real hours, buffer times and reminders turned on.",
            ai: "Not needed for this one. Your booking tool does the work once it is set up right.",
            person: "A person books test appointments with you before the page goes live.",
            never: "We never open hours you did not set or change your cancellation policy.",
            example: "Example: a Fayetteville hair studio adds longer buffers on Razorback home-game weekends, when traffic makes clients run late."
          }
        },
        {
          id: "reminders", name: "Appointment reminders and no-show follow-ups",
          sum: "Reminders before every appointment and a kind follow-up after a no-show.",
          tag: "we", who: ["salons", "auto", "pro", "home"],
          rows: {
            handoff: "Your booking tool and the reminder wording you want, approved once.",
            back: "Reminders before each appointment and a follow-up after a no-show, in wording you approved once.",
            ai: "Not needed for this one. Your booking tool sends the approved wording.",
            person: "A person checks the send log weekly and fixes anything that bounced.",
            never: "We never add no-show fees, and texts wait until carrier registration (A2P 10DLC) is approved.",
            example: "Example: a Johnson nail studio sends a reminder the day before and a rebook link after a missed visit."
          }
        },
        {
          id: "calendar", name: "Calendar management",
          sum: "A weekly check of your calendar with conflicts flagged early.",
          tag: "we", who: ["pro", "supplier", "salons"],
          rows: {
            handoff: "Access to your Google or Outlook calendar and the hours you keep.",
            back: "A weekly check with double-bookings, travel gaps and conflicts flagged, plus invites answered by the rules you set.",
            ai: "Not needed for this one. A person reads the week ahead with you.",
            person: "A person does the weekly check and asks you before moving anything.",
            never: "We never book outside the hours you set.",
            example: "Example: a Pea Ridge architect learns on Monday that a site visit overlaps a school pickup on Thursday."
          }
        },
        {
          id: "staff", name: "Staff schedule drafts",
          sum: "Weekly staff schedule drafts built from availability, for your approval.",
          tag: "we", who: ["shops", "salons", "auto"],
          rows: {
            handoff: "Staff availability, time-off requests and how many people each shift needs.",
            back: "A draft schedule each week with gaps and long weeks flagged, ready for your approval.",
            ai: "Not needed for this one. A person builds the draft in your scheduling tool or a shared sheet.",
            person: "A person checks every request against the draft. You approve before staff see it.",
            never: "We never handle payroll or post a schedule you have not approved.",
            example: "Example: a Tontitown restaurant gets Grape Festival week drafted early, with every time-off request already counted."
          }
        },
        {
          id: "vendors", name: "Vendor and delivery coordination",
          sum: "Vendor confirmations and follow-ups kept on one shared list.",
          tag: "we", who: ["shops", "supplier", "auto"],
          rows: {
            handoff: "Your vendor contacts, open orders and expected delivery dates.",
            back: "Delivery confirmations, follow-ups on anything late, and one shared list everyone can check.",
            ai: "Not needed for this one. It is steady follow-up and one clean list.",
            person: "A person checks the list against your orders each week and flags anything late.",
            never: "We never place, change or pay for orders. You approve every order.",
            example: "Example: an Elkins cafe tracks three produce vendors and a coffee roaster on one list, with a late Tuesday delivery flagged by noon."
          }
        },
        {
          id: "notes", name: "Meeting and call notes with AI",
          sum: "A summary and action items after each meeting, skimmed by you first.",
          tag: "ai", who: ["supplier", "pro"],
          rows: {
            handoff: "Your meeting or call recordings, with every recording announced to everyone on the call.",
            back: "A short summary and action items after each meeting, filed where your team can find them.",
            ai: "AI transcribes the recording and drafts the summary and action items.",
            person: "A person checks the summary against the recording, and you skim it before anything goes to clients.",
            never: "We never record a call without announcing it to everyone on it.",
            example: "Example: a Springdale logistics broker's weekly carrier calls become one page of who promised what, and by when."
          }
        }
      ]
    },
    {
      id: "docs", name: "Documents and how-tos", note: "Your files stay in the accounts you already own.", icon: "folder",
      items: [
        {
          id: "folders", name: "One folder system with naming rules",
          sum: "One folder system with naming rules, and your paper scanned and filed.",
          tag: "we", who: ["pro", "home", "supplier"],
          rows: {
            handoff: "Your shared drives, desktop folders and boxes of paper.",
            back: "One folder system with naming rules in Google Drive or OneDrive, whichever you already pay for, with paper scanned and named.",
            ai: "Not needed for this one. A person sorts, scans and names each file.",
            person: "A person spot-checks names and locations, and you approve the folder map before anything moves.",
            never: "IDs and tax forms go in a secure vault, never in shared folders. We never delete your files.",
            example: "Example: a Bella Vista property manager finds any lease in two clicks instead of three drawers."
          }
        },
        {
          id: "templates", name: "Templates for quotes, forms and checklists",
          sum: "Ready-to-use templates for quotes, intake forms, onboarding and invoice notes.",
          tag: "we", who: ["home", "pro", "auto"],
          rows: {
            handoff: "The quotes, forms and checklists you use today, even the messy ones.",
            back: "Clean templates for quotes, intake forms, onboarding checklists and invoice notes in the tools you already use.",
            ai: "Not needed for this one. We build them from the wording you already use.",
            person: "A person checks every field with you before the templates go live.",
            never: "We never add legal terms or contract language. Your attorney handles those.",
            example: "Example: a Greenland electrician sends every new customer the same clean intake form and onboarding checklist."
          }
        },
        {
          id: "sops", name: "Written how-tos (SOPs)",
          sum: "Step-by-step how-tos drafted from a recorded walkthrough, signed off by you.",
          tag: "ai", who: ["shops", "salons", "auto", "home"],
          rows: {
            handoff: "A recorded walkthrough of how you or your best person does the task.",
            back: "A plain written how-to, with steps and screenshots your staff can follow.",
            ai: "AI drafts the how-to from the recorded walkthrough.",
            person: "A person edits each draft for accuracy, and you sign off before staff use it.",
            never: "We never hand your team a how-to you have not signed off on.",
            example: "Example: a Gravette tire shop records its closing routine once, and new hires follow the same steps every night."
          }
        },
        {
          id: "hiring", name: "Hiring admin",
          sum: "Job post, applicant inbox, interview scheduling and tracking. You make every decision.",
          tag: "ai", who: ["shops", "home", "auto", "salons"],
          rows: {
            handoff: "Your notes on the role and the times you can interview.",
            back: "A job post drafted from your notes, a separate applicant inbox, interview scheduling and a tracking sheet.",
            ai: "AI drafts only the job post. Applications are never screened, scored or ranked by AI.",
            person: "You read every application and make every decision. A person checks the job post with you before it goes up.",
            never: "No background checks, I-9s or payroll. We never reject or rank an applicant.",
            example: "Example: a Rogers taqueria hiring two cooks gets applicants in their own inbox, with interviews booked into open afternoons."
          }
        },
        {
          id: "vendoroffice", name: "Supplier and vendor office support",
          sum: "Notes, follow-ups, filing and report prep for teams that sell to big retailers.",
          tag: "ai", who: ["supplier"],
          rows: {
            handoff: "Your meeting notes, retailer emails, sales exports and the files your team keeps hunting for.",
            back: "Meeting notes, follow-ups, document filing and report prep, so your team spends its time on the account.",
            ai: "AI summarizes long emails and drafts notes and report text from your exports.",
            person: "A person checks every number against the source export before you see it.",
            never: "We never claim any relationship with a retailer, and we never log into retailer portals as you.",
            example: "Example: a Bentonville supplier team turns Monday's sales exports into a clean one-page recap before the weekly call."
          }
        }
      ]
    },
    {
      id: "ai", name: "AI in your business", note: "Nothing new is installed without your yes.", icon: "chip",
      items: [
        {
          id: "automations", name: "Workflow automations",
          sum: "Your apps pass work to each other, documented and checked every month.",
          tag: "we", who: ["home", "pro", "supplier", "shops"], demo: "#demo-automation",
          rows: {
            handoff: "The apps you already use and the copy-paste chores you repeat every week.",
            back: "Automations like attachments saved to the right folder, form leads added to the CRM, or a review request queued when a job is marked done.",
            ai: "Usually not needed. Plain rules move the data, and AI is added only where it clearly helps and you agree.",
            person: "Each automation is documented in one line, test-run with you and log-checked monthly.",
            never: "We never automate payments, payroll or anything that sends money.",
            example: "Example: a Cave Springs cleaning company marks a job done, and the photos file themselves and the review request is queued."
          }
        },
        {
          id: "emaildraft", name: "AI email drafting in your inbox",
          sum: "AI drafting turned on in the Google Workspace or Microsoft 365 plan you have.",
          tag: "ai", who: ["pro", "supplier", "home"],
          rows: {
            handoff: "An admin invite to your Google Workspace or Microsoft 365 account, for setup only.",
            back: "The assistant your plan already includes, set up in your inbox, with a short guide and saved prompts for your common replies.",
            ai: "AI drafts replies inside your inbox, using the assistant your plan already includes.",
            person: "We walk through it with you and review the first week of drafts together.",
            never: "Nothing sends on its own, and we never add a new AI tool or plan without your yes.",
            example: "Example: a Fayetteville engineering firm turns on drafting in Outlook, and routine client replies start as drafts to edit."
          }
        },
        {
          id: "report", name: "Weekly owner report",
          sum: "One page every Monday from your own numbers, reviewed by a person first.",
          tag: "ai", who: ["home", "shops", "salons", "auto"], demo: "#demo-report",
          rows: {
            handoff: "Exports from your booking, invoicing, phone and review tools, or access to pull them.",
            back: "One page every Monday: jobs, calls, money owed and reviews, compared with last week.",
            ai: "AI drafts the summary lines from your exports.",
            person: "A person checks every number against the source before it reaches you.",
            never: "We never present a forecast as fact or fill a gap with a guess.",
            example: "Example: a Rogers auto shop owner reads Monday's page over coffee and sees that missed calls doubled on Saturday."
          }
        },
        {
          id: "workshop", name: "AI starter workshop",
          sum: "A half day for you and your staff, plus a follow-up a month later.",
          tag: "ai", who: ["supplier", "pro", "shops"],
          rows: {
            handoff: "A few real tasks your team does every week, with private details removed.",
            back: "A half-day session on drafting, summarizing and checking AI output against the source, plus a follow-up a month later.",
            ai: "The whole session is about using AI tools well on your own everyday tasks.",
            person: "Your team practices checking every AI draft against the source before it gets used.",
            never: "A red list of what never gets pasted in: card numbers, SSNs, health details and other people's private info.",
            example: "Example: a Bentonville supplier team learns to summarize long retailer emails and check each summary against the original."
          }
        },
        {
          id: "policy", name: "One-page AI use policy",
          sum: "A plain-language page on how your team may and may not use AI.",
          tag: "ai", who: ["pro", "supplier"],
          rows: {
            handoff: "How your team uses AI today, and anything your clients or contracts ask of you.",
            back: "One page in plain language: which tools are allowed, what never gets pasted in, and who checks AI work.",
            ai: "AI helps with a first draft, which a person rewrites in your words.",
            person: "A person edits it with you. Your attorney reviews anything formal.",
            never: "We never give legal advice or present the page as a formal HR policy.",
            example: "Example: a Rogers bookkeeping office hands every new hire the same one-page AI rules on day one."
          }
        },
        {
          id: "promptkit", name: "Company prompt kit and SOP assistant",
          sum: "Saved prompts and an assistant built only from your own approved documents.",
          tag: "ai", who: ["pro", "supplier", "shops"],
          rows: {
            handoff: "Your how-tos, FAQs and templates, with customer personal data and financial records left out.",
            back: "A kit of tested prompts and an assistant that answers staff questions from your approved documents.",
            ai: "AI answers staff questions using only the documents you approved.",
            person: "You approve every document that goes in, and we re-test the answers every quarter.",
            never: "We never load customer personal data or financial records into it.",
            example: "Example: a Lowell coffee shop's new counter staff ask the assistant how to log a catering order."
          }
        },
        {
          id: "officehours", name: "Monthly AI office hours",
          sum: "A monthly session to answer questions, screen one new tool and tune automations.",
          tag: "ai", who: ["pro", "supplier", "home"],
          rows: {
            handoff: "Your questions, plus any AI tool someone on your team wants to try.",
            back: "Answers, one new tool screened against your stack, and your existing automations tuned.",
            ai: "We look at AI tools with you and test them on your real tasks.",
            person: "A person checks each new tool against your stack and your data rules before you decide.",
            never: "Nothing new is installed without your yes.",
            example: "Example: a Bella Vista HVAC office asks whether a new scheduling add-on is worth trying and gets a plain yes, no or not yet."
          }
        }
      ]
    },
    {
      id: "local", name: "Local presence and reputation", note: "Honest listings and real reviews only. We never write reviews.", icon: "pin",
      items: [
        {
          id: "listings", name: "Google Business Profile and listings upkeep",
          sum: "Hours, posts and photos kept current on Google, Apple, Bing, Yelp and Facebook.",
          tag: "we", who: ["shops", "salons", "auto", "home"],
          rows: {
            handoff: "Manager access to your listings, plus your own photos.",
            back: "Hours, holiday and event hours, posts and photos kept current, with the same name, address and phone everywhere.",
            ai: "Not needed for this one. A person updates each listing by hand.",
            person: "A person checks every listing monthly. You approve each post.",
            never: "We never keyword-stuff your business name or post photos that are not yours.",
            example: "Example: a downtown Rogers boutique adds its holiday hours once, and they match on every map."
          }
        },
        {
          id: "reviewreq", name: "Honest review requests",
          sum: "A review request to every customer after every job, never with an incentive.",
          tag: "we", who: ["home", "auto", "salons", "shops"],
          rows: {
            handoff: "Your customer list, or the tool where jobs are marked done.",
            back: "A short review request sent to every customer after a job, with a direct link to your Google profile.",
            ai: "Not needed for this one. The request is your approved wording.",
            person: "A person checks the send log so every customer gets the same request, not only the happy ones.",
            never: "We never offer incentives, skip unhappy customers or write reviews.",
            example: "Example: a Farmington pressure-washing crew sends the same request after every driveway, good day or bad."
          }
        },
        {
          id: "reviewreply", name: "Review reply drafts",
          sum: "A reply drafted in your voice for every review, good or bad.",
          tag: "ai", who: ["shops", "salons", "auto"],
          rows: {
            handoff: "Manager access to your review profiles and a few past replies you liked.",
            back: "A drafted reply for every review, good or bad, in your voice and waiting for your OK.",
            ai: "AI drafts each reply from the review and your past wording.",
            person: "A person checks every draft for tone and facts. You approve before it posts.",
            never: "We never argue with reviewers, share customer details or post a reply you have not approved.",
            example: "Example: a Siloam Springs diner gets a calm, specific reply drafted for a one-star review about a long wait."
          }
        },
        {
          id: "social", name: "Social posts and content calendar",
          sum: "A month of captions drafted in your voice, approved in one batch.",
          tag: "ai", who: ["shops", "salons", "home"],
          rows: {
            handoff: "Your own photos and a few notes on what is coming up this month.",
            back: "A month of captions in your voice on a simple calendar, using your photos, approved in one batch.",
            ai: "AI drafts captions from your notes and photos.",
            person: "A person edits every caption and checks every claim. You approve the batch.",
            never: "We never buy followers, invent claims or use photos that are not yours.",
            example: "Example: a Eureka Springs gift shop approves October's posts in one sitting, every photo taken in its own store."
          }
        },
        {
          id: "newsletter", name: "Email newsletter",
          sum: "A newsletter to people who opted in, drafted from your notes.",
          tag: "ai", who: ["shops", "salons", "pro"],
          rows: {
            handoff: "Your opted-in email list and notes on the news, events or offers you want to share.",
            back: "A newsletter drafted from your notes, ready in your email tool for your OK, with the unsubscribe link always on.",
            ai: "AI drafts the newsletter from your notes.",
            person: "A person proofreads it and checks every date and detail. You approve before it sends.",
            never: "We never use purchased lists or email anyone who did not opt in.",
            example: "Example: a Fayetteville yoga studio sends its monthly class schedule to members who signed up at the front desk."
          }
        },
        {
          id: "frontdoor", name: "Digital front door check",
          sum: "How a customer finds and reaches you on a phone, scored with you.",
          tag: "we", who: ["shops", "salons", "home", "auto"],
          rows: {
            handoff: "A short call where we search for you and contact you the way a customer would.",
            back: "A simple scorecard of your listings, site, hours, calls and messages, with the fixes ranked.",
            ai: "Not needed for this one. A person searches and calls the way a customer would.",
            person: "A person runs every step on a real phone and scores it with you.",
            never: "Nothing is changed during the check.",
            example: "Example: a Springdale bakery learns its holiday hours are wrong on two maps."
          }
        }
      ]
    }
  ],
  stays: {
    name: "Always stays with you or a licensed pro",
    items: [
      "Tax prep and filing",
      "Payroll processing and filing",
      "Legal advice, contracts and formal HR policy",
      "Moving money, paying bills or collecting debts",
      "Signing anything",
      "Outbound AI voice calls to your customers",
      "Patient or health records"
    ]
  },
  buy: [
    { name: "Free NWA Admin and AI Check-up", text: "30 minutes with us, then Your Admin Map in 3 business days: what to hand off first and what stays with you." },
    { name: "One-month pilot", text: "One or two tasks for one month, every piece approved by you." },
    {
      name: "Right Hand Desk, monthly",
      text: "Ongoing admin from the same team every month, sized to your volume.",
      tiers: [
        "Desk Basics: books prep and receipts, invoice follow-ups, Monday brief.",
        "Desk Standard: Basics plus inbox triage, scheduling and reminders, and review reply drafts.",
        "Desk Plus: Standard plus listings upkeep, social and newsletter admin, and monthly AI office hours."
      ]
    },
    { name: "AI Builds", text: "Fixed scope: text-back, phone answering, chat assistant, lead intake, CRM, automations, meeting notes and the review system. Each includes setup, a test run you watch, a one-page how-it-works sheet and a 30-day watch of logs before sign-off. Builds can roll into the Desk plan." },
    { name: "AI Starter Workshop", text: "A half day for owner and staff, plus a follow-up a month later. Sold alone or with any build." }
  ],
  priceLine: "Quoted after your check-up, based on volume."
};
