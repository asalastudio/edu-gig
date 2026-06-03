# HubSpot Email — NOT YET CREATED IN HUBSPOT

**Action required:** Copy the body below into HubSpot as a **draft** to Chris Brown (cjb2145@gmail.com).  
Replace both `[INSERT_…]` links after you create the Google Doc and Google Sheet in Drive.

**Subject:** K12Gig launch readiness — 8 decisions needed by May 28

---

Hi Chris,

We finished the production readiness review for K12Gig ahead of the May 29 target.

**Recommendation:** proceed as a **controlled beta / client review** unless we clear the payment, auth, and compliance items below today. The app can be shared with selected users once production auth and launch data are verified. We do not recommend treating it as a fully paid public marketplace until those items are done.

**Everything you need is in two links** (no new apps to log into):

1. **Launch readiness summary (read-only):** [INSERT_READINESS_DOC_URL]
2. **Your response tracker (fill in the “Client response” column):** [INSERT_RESPONSE_TRACKER_SHEET_URL]

### The 8 items we need from you by EOD May 28

1. **Launch mode** — controlled beta or paid production marketplace
2. **Stripe** — production account owner + approval to configure webhook `/api/stripe/webhook` (we’ll handle secure credential setup; please don’t email API keys)
3. **Clerk** — confirm production auth issuer/domain
4. **Production URL** — canonical domain for the live app
5. **Legal / payment** — approval status for Terms, Privacy, DPA process, refund language
6. **Support & email** — monitored support inbox and sender identity
7. **Checkr** — launch background checks now, or defer
8. **Production data** — approve districts, educators, and initial gigs before we share the link

If helpful, you can reply directly to this email instead of using the sheet.

**If the goal is a working production link tomorrow,** controlled beta is the fastest path: we deploy with verified credentials and approved data, and keep payments and background checks limited until the remaining blockers are complete.

If we don’t hear back by end of day May 28, we’ll send a short follow-up and offer a **30-minute launch decision call** to knock these out together.

Once we have your answers, we’ll update production, run final smoke tests, and send a concise go/no-go summary.

Best,
Jordan / Asala Launch Team
