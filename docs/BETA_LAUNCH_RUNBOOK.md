# K12Gig Controlled Beta Launch Runbook (`k12gig.com`)

**Audience:** Jordan (engineering)  
**Launch mode:** Controlled beta · invoice/PO only · no live card payments  
**Blocked on:** Chris DNS access for `k12gig.com`

This is the **execute-when-ready** checklist. When Chris gives DNS control, work top to bottom — most steps are copy-paste.

---

## Already done (no Chris needed)

- [x] Auth UX — single `/login` role hub; `intent` carried through sign-in/sign-up/onboarding
- [x] Clerk UI branding → K12Gig
- [x] Sidebar role label fix on shared pages (`/browse`)
- [x] Date inputs block past dates on post + checkout
- [x] App defaults to `k12gig.com` in email templates and legal/support addresses
- [x] Beta data tooling — `convex/beta_launch.ts` (cleanup + founding profiles with gigs)
- [x] Launch helper script — `scripts/beta-launch.mjs`
- [x] Env audit — `npm run check:env:beta` (invoice-only beta, no Stripe required)

---

## Phase 1 — DNS (Chris → you)

**Chris provides one of:**

| Option | What Chris does | What you do next |
|--------|-----------------|------------------|
| **A (recommended)** | Point `k12gig.com` nameservers to `ns1.vercel-dns.com` + `ns2.vercel-dns.com` | Manage all DNS in Vercel |
| **B** | Add you as admin on the registrar | Add records manually at registrar |

**Confirm with Chris:** domain is not used for live email/website you must preserve.

---

## Phase 2 — Vercel domain + app URL

```bash
cd edugig

# Add domain to the linked Vercel project
vercel domains add k12gig.com
vercel domains add www.k12gig.com   # optional redirect to apex

# After DNS propagates, verify
vercel domains inspect k12gig.com
```

**Vercel DNS records** (if using Vercel nameservers, add in Vercel → Domains → k12gig.com):

| Type | Name | Value |
|------|------|-------|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

Update production env:

```bash
vercel env rm NEXT_PUBLIC_APP_URL production --yes 2>/dev/null || true
printf '%s' 'https://k12gig.com' | vercel env add NEXT_PUBLIC_APP_URL production
```

---

## Phase 3 — Clerk production instance

1. [Clerk Dashboard](https://dashboard.clerk.com) → your K12Gig app → **Deploy to Production**
2. Production domain → **`k12gig.com`**
3. Add DNS records Clerk shows (typical set):

| Type | Name | Purpose |
|------|------|---------|
| CNAME | `clerk` | Frontend API |
| CNAME | `accounts` | Account portal |
| CNAME | `clkmail` | Transactional email |
| CNAME | `clk._domainkey` | Email signing |
| CNAME | `clk2._domainkey` | Email signing |

4. Wait for Clerk to verify domain + issue TLS
5. Copy production keys: `pk_live_…` and `sk_live_…`
6. Issuer URL will be: **`https://clerk.k12gig.com`** (confirm in Clerk → JWT templates → Convex)

**Clerk paths** (unchanged, but verify in Clerk dashboard):

- Sign-in URL: `/sign-in`
- Sign-up URL: `/sign-up`
- After sign-in: `/onboarding`
- After sign-up: `/onboarding`

---

## Phase 4 — Production env (Vercel + Convex)

Pull current prod env locally (secrets redacted for some keys):

```bash
vercel env pull /tmp/k12gig-prod.env --environment=production --yes
```

### Vercel production — set/update

```bash
# Clerk (replace with live keys from dashboard)
printf '%s' 'pk_live_XXXXX' | vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
printf '%s' 'sk_live_XXXXX' | vercel env add CLERK_SECRET_KEY production
printf '%s' 'https://clerk.k12gig.com' | vercel env add CLERK_JWT_ISSUER_DOMAIN production

# App + Convex (Convex URL should stay descriptive-bass-5 unless you migrate)
printf '%s' 'https://k12gig.com' | vercel env add NEXT_PUBLIC_APP_URL production
# NEXT_PUBLIC_CONVEX_URL — keep existing prod deployment URL
# CONVEX_DEPLOY_KEY — already set
# CONVEX_WEBHOOK_SHARED_SECRET — already set
```

**Invoice-only beta — Stripe NOT required.** Leave `STRIPE_*` unset; checkout uses PO/invoice path.

**Optional before invite wave:**

```bash
# Resend (booking confirmation emails)
printf '%s' 're_XXXXX' | vercel env add RESEND_API_KEY production
printf '%s' 'K12Gig <support@k12gig.com>' | vercel env add RESEND_FROM_EMAIL production
```

### Convex production (`descriptive-bass-5`)

```bash
export CONVEX_DEPLOY_KEY="$(grep CONVEX_DEPLOY_KEY /tmp/k12gig-prod.env | cut -d= -f2- | tr -d '\"')"

# Point Convex auth at production Clerk issuer
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://clerk.k12gig.com

# Temporary — only during launch window (pick a strong random secret)
npx convex env set BETA_LAUNCH_ENABLED true
npx convex env set BETA_LAUNCH_SECRET "$(openssl rand -hex 32)"

# NEVER on production:
# npx convex env set ALLOW_DEMO_SEED true   ← do not run
```

Verify:

```bash
npx convex env list
npm run check:env:beta
```

---

## Phase 5 — Deploy

Deploy **from a reviewed branch** (not ad-hoc uncommitted local state):

```bash
git status   # confirm what ships
vercel --prod
```

Production build runs `convex deploy` automatically via `scripts/vercel-build.mjs` when `CONVEX_DEPLOY_KEY` is set.

**Post-deploy checks:**

- [ ] `https://k12gig.com` loads (no SSL error)
- [ ] No Clerk "Development mode" banner
- [ ] `424242` test OTP does **not** work
- [ ] Sign up as district → onboarding → dashboard
- [ ] Sign up as educator → onboarding → dashboard

---

## Phase 6 — Beta data (after Clerk is live)

```bash
export CONVEX_DEPLOY_KEY="prod:…"
export BETA_LAUNCH_SECRET="…"   # same value set on Convex

node scripts/beta-launch.mjs cleanup   # remove legacy test rows
node scripts/beta-launch.mjs seed      # 3 founding educators + 4 bookable gigs
```

**Founding profiles created:**

| Educator | Gigs |
|----------|------|
| Sarah Jenkins | Curriculum Mapping Workshop, Literacy Coaching Block |
| Miguel Rodriguez | Algebra Readiness Intensive |
| Dr. Alana Williams | STEM Pathway Design Sprint |

**Then lock down:**

```bash
npx convex env remove BETA_LAUNCH_ENABLED
npx convex env remove BETA_LAUNCH_SECRET
rm -f /tmp/k12gig-prod.env
```

---

## Phase 7 — Smoke test (15 min)

Sign in as **district** (real prod account):

1. Home → Get started → I hire educators
2. Browse directory — see 3 founding educators
3. Open Sarah → Services — see 2 gigs
4. Book with PO/invoice → order created
5. Post a Need → submits

Sign in as **educator** (invite a real beta educator):

1. Onboarding completes → educator dashboard
2. Browse is restricted (expected)
3. My Gigs / Settings load

---

## Phase 8 — Invite beta users

Send each invitee:

- URL: `https://k12gig.com/login`
- Role path: district **or** educator card
- No demo passwords — real email verification in production Clerk

Chris / ops can use `docs/CHRIS_DEMO_WALKTHROUGH.md` as a **flow guide** (ignore demo `@example.com` accounts for prod).

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Clerk dev banner on k12gig.com | Redeploy with `pk_live_` keys; confirm domain in Clerk prod instance |
| Sign-in works but Convex says Unauthorized | `CLERK_JWT_ISSUER_DOMAIN` mismatch — Vercel + Convex must both point at `https://clerk.k12gig.com` |
| Empty browse directory | Run `beta-launch.mjs seed`; sign in as **district** (browse is district-gated) |
| No bookable services | Gigs table empty — run seed step |
| `Demo seed is disabled` | Wrong mutation — use `beta_launch`, not `seed:populate` |
| Next deploy breaks auth | Ensure Clerk keys exist in Vercel production before redeploy |

---

## Related docs

| File | Purpose |
|------|---------|
| `PRODUCTION_ENV_AUDIT.md` | Env inventory |
| `LAUNCH_EXECUTION_RUNBOOK.md` | Client ops / HubSpot / ClickUp |
| `DEMO_SEED_CREDENTIALS.md` | Dev/demo only — **not for production** |
| `CHRIS_DEMO_WALKTHROUGH.md` | Demo script (update URLs to k12gig.com when live) |
