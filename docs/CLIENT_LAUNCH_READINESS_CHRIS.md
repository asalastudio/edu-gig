# K12Gig Launch Readiness — Action Request for Chris Brown

**Prepared by:** Asala Launch Team  
**Date:** May 28, 2026  
**Target:** May 29, 2026 controlled beta / client review

---

## Summary

We completed a production readiness review of the K12Gig platform. The app is **ready for a controlled beta** with selected users once the items below are confirmed. We **do not recommend** opening real payments or public marketplace access until the P0 items are complete.

**Our recommendation:** Launch May 29 as a **controlled beta** — share the production link with invited users, validate onboarding and dashboards, and keep checkout limited until payment and compliance items are cleared.

---

## One decision needed today

Please confirm:

| Option | Our recommendation | What it means |
|--------|-------------------|---------------|
| **Controlled beta / client review** | ✓ Recommended | Share with selected users. Payments and background checks limited or manual. |
| **Paid production marketplace** | Not yet | Requires all P0 items below before public paid use. |

---

## What we need from you

Please reply by **EOD May 28** using the response tracker link in your email, or reply to the email directly with the eight items in the “Quick reply” section at the bottom.

| # | Item | What we need | Due |
|---|------|--------------|-----|
| 1 | **Launch mode** | Controlled beta **or** paid production marketplace | May 28 |
| 2 | **Stripe (production)** | Owner for production Stripe account; approve webhook endpoint `/api/stripe/webhook`. We will coordinate secure credential handoff — **do not email API keys.** | May 28 |
| 3 | **Clerk (production auth)** | Confirm production Clerk project / issuer domain (production auth is not fully wired yet) | May 28 |
| 4 | **Production URL** | Confirm canonical domain for the live app (auth redirects, emails, sharing) | May 28 |
| 5 | **Legal & payment posture** | Approval status for Terms, Privacy, DPA request process, invoice/refund language (you + counsel) | May 28 |
| 6 | **Support & email** | Monitored support inbox; sender identity for transactional email | May 28 |
| 7 | **Checkr** | **Launch now** or **defer** background checks at launch | May 28 |
| 8 | **Production data** | Approve districts, educators, and initial gigs shown in production | May 28 |

### Also helpful by May 29 (P1)

| # | Item | What we need |
|---|------|--------------|
| 9 | **Monitoring** | Who owns launch-day errors; Sentry setup owner |
| 10 | **Rate limiting** | Upstash Redis credentials owner (if checkout is enabled) |
| 11 | **Finance operations** | Owner for payouts, refunds, disputes, and invoices (manual process may apply at beta) |

---

## What Asala is handling (no action needed from you)

- Dependency security patches  
- Checkout eligibility and order lifecycle engineering  
- Educator browse → booking path  
- Production smoke tests after your credentials are installed  
- Go / no-go summary back to you after deploy  

---

## Controlled beta checklist

Before we share the production link:

- [ ] You confirm controlled beta scope and invited users  
- [ ] Checkout is disabled, hidden, or manually controlled unless Stripe is fully verified  
- [ ] Checkr is disabled or clearly deferred unless fully configured  
- [ ] Production data is approved for what invitees will see  
- [ ] Support inbox and escalation owner are confirmed  

---

## Quick reply (copy into email or tracker)

1. Launch mode: _______________  
2. Production domain: _______________  
3. Stripe owner + webhook approval: _______________  
4. Clerk production issuer confirmed: Yes / No / Pending  
5. Support inbox + sender: _______________  
6. Checkr: Launch now / Defer  
7. Legal/payment approval status: _______________  
8. Production seed data: Approved / Needs review  

---

*Questions? Reply to the Asala launch email or your project contact.*
