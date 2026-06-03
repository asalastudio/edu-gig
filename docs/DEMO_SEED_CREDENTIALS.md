# K12Gig demo seed — test accounts & walkthrough

Use this for **development / controlled beta only**. Never enable `ALLOW_DEMO_SEED` on production Convex.

---

## What gets seeded

| Convex row | Email (Clerk must match exactly) | Role | Notes |
|------------|----------------------------------|------|--------|
| District admin | `demo-district+clerk_test@example.com` | `district_hr` | Austin ISD (Demo), region Central Texas |
| Educator 1 | `demo-educator1+clerk_test@example.com` | `educator` | Sarah Jenkins — **2 bookable gigs** |
| Educator 2 | `demo-educator2+clerk_test@example.com` | `educator` | Miguel Rodriguez |
| Educator 3 | `demo-educator3+clerk_test@example.com` | `educator` | Dr. Alana Williams |

**Verification code (all accounts):** `424242`

The `+clerk_test` suffix tells Clerk dev to skip real email delivery. Enter the code above on the sign-in screen — no password needed.

---

## One-time setup

### 1. Enable seed on your **dev** Convex deployment

```bash
cd edugig
npx convex env set ALLOW_DEMO_SEED true
npx convex env set DEMO_SEED_SECRET k12gig-controlled-beta-2026
```

### 2. Run the seed

```bash
# If you previously ran an older seed (@example.com without +clerk_test), clear first:
npx convex run seed:clearDemo '{"seedSecret":"k12gig-controlled-beta-2026"}'

npx convex run seed:populate '{"seedSecret":"k12gig-controlled-beta-2026"}'
```

Expected response: `status: "populated"` with the account emails listed.

Re-running is safe — you'll get `already_populated` if the district marker exists.

### 3. Create Clerk users (automated)

```bash
node scripts/create-demo-clerk-users.mjs
```

This creates all four `+clerk_test@example.com` users (no password). Or create them manually in [Clerk Dashboard](https://dashboard.clerk.com) → Users.

No onboarding form is required — seed data is already `onboarded: true`.

### 4. Link Clerk → Convex (automatic)

Sign in once as each demo user. The app calls `users.claimSeededDemoAccount`, which rebinds the pre-seeded row from `seed:<email>` to your real Clerk user id.

---

## Demo script (district hiring path)

1. **Sign in** as `demo-district+clerk_test@example.com`
2. Enter verification code **`424242`**
3. Go to **Browse Educators** — you should see 3 profiles
4. Open **Sarah Jenkins** → **Services** tab → **Book this service** (Curriculum Mapping Workshop)
5. Complete checkout

Educator gig titles seeded for Sarah:

- Curriculum Mapping Workshop — **$450 fixed**
- Literacy Coaching Block — **$75/hr**

---

## Environment reference

| Variable | Where | Value (dev) |
|----------|--------|-------------|
| `ALLOW_DEMO_SEED` | Convex env | `true` |
| `DEMO_SEED_SECRET` | Convex env | `k12gig-controlled-beta-2026` |
| `NEXT_PUBLIC_USE_CONVEX_BROWSE` | `.env.local` | `true` |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Demo seed is disabled` | Run `npx convex env set ALLOW_DEMO_SEED true` on dev deployment |
| `Forbidden` on populate | `seedSecret` must match `DEMO_SEED_SECRET` in Convex |
| `Incorrect code` | Email must include `+clerk_test`; code is always `424242` in dev |
| Browse empty after district sign-in | Sign out/in once to trigger `claimSeededDemoAccount`; confirm Clerk email matches table exactly |
| Old seed rows from a prior email format | Run `clearDemo` then `populate` again |

---

## Security

- Rotate `DEMO_SEED_SECRET` if it is ever exposed outside the team.
- Keep `ALLOW_DEMO_SEED=false` (or unset) in production.
- Demo emails are for internal dev only — do not share in client-facing materials.
