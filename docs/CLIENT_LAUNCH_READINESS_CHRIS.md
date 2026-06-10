# K12Gig Launch Readiness — Action Request for Chris Brown

**Prepared by:** Asala Launch Team  
**Date:** June 7, 2026  
**Target:** June 15, 2026 controlled beta

---

## Summary

We completed a production readiness review of the K12Gig platform. The recommended launch path is an **invite-only controlled beta** with selected users, production auth/domain/data, and **invoice / PO booking only**.

**Our recommendation:** Launch June 15 as a **controlled beta**. Share the production link with invited users, validate onboarding and dashboards, and defer live card payments and Checkr background checks until those production configurations are explicitly approved.

---

## One decision needed today

Please confirm:

| Option | Our recommendation | What it means |
|--------|-------------------|---------------|
| **Controlled beta / client review** | Recommended | Share with selected users. Invoice / PO booking only. Checkr deferred. |
| **Paid production marketplace** | Not yet | Requires live Stripe, Checkr, compliance, and operational readiness before public paid use. |

---

## What we need from you

Please reply by **EOD June 10** using the response tracker link in your email, or reply to the email directly with the eight items in the "Quick reply" section at the bottom.

| # | Item | What we need | Due |
|---|------|--------------|-----|
| 1 | **Launch mode** | Confirm invite-only controlled beta for June 15 | June 10 |
| 2 | **Production URL** | Confirm `https://k12gig.com` as the canonical live app domain | June 10 |
| 3 | **Clerk (production auth)** | Confirm production Clerk project, live keys, and issuer domain `https://clerk.k12gig.com` | June 10 |
| 4 | **Convex production** | Confirm production Convex deployment and deploy key ownership | June 10 |
| 5 | **Legal & payment posture** | Approval status for Terms, Privacy, DPA request process, invoice/refund language (you + counsel) | June 10 |
| 6 | **Support & email** | Monitored support inbox; sender identity for transactional email | June 10 |
| 7 | **Checkr** | Confirm background checks are deferred for beta unless Checkr production env is ready | June 10 |
| 8 | **Production data** | Approve districts, educators, and initial gigs shown in production | June 10 |

### Also helpful by June 12 (P1)

| # | Item | What we need |
|---|------|--------------|
| 9 | **Monitoring** | Who owns launch-day errors; Sentry setup owner |
| 10 | **Rate limiting** | Upstash Redis credentials owner (recommended before wider invite wave) |
| 11 | **Finance operations** | Owner for payouts, refunds, disputes, and invoices (manual process applies at beta) |
| 12 | **Stripe card payments** | Owner and webhook approval if card payments are re-approved for a later lane |

---

## What Asala is handling (no action needed from you)

- Dependency security patches  
- Invoice / PO checkout posture and order lifecycle review  
- Educator browse → booking path  
- Production smoke tests after your credentials are installed  
- Go / no-go summary back to you after deploy  

---

## Controlled beta checklist

Before we share the production link:

- [ ] You confirm controlled beta scope and invited users  
- [ ] Invoice / PO booking is the active beta payment path  
- [ ] Card checkout stays hidden unless production Stripe is fully verified  
- [ ] Checkr is disabled or clearly deferred unless fully configured  
- [ ] Production data is approved for what invitees will see  
- [ ] Support inbox and escalation owner are confirmed  

---

## Quick reply (copy into email or tracker)

1. Launch mode: Invite-only invoice / PO beta approved? Yes / No  
2. Production domain: _______________  
3. Production Convex owner/deploy key: _______________  
4. Clerk production issuer confirmed: Yes / No / Pending  
5. Support inbox + sender: _______________  
6. Checkr: Defer / Launch now with production env  
7. Legal/payment approval status: _______________  
8. Production seed data: Approved / Needs review  

---

*Questions? Reply to the Asala launch email or your project contact.*
