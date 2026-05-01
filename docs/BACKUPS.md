# Backups

K12Gig's primary datastore is Convex. Third-party services (Stripe, Clerk) handle durability of their own records. This doc covers what we back up, how often, and how to restore.

## Convex (primary)

Convex is durable by default. The platform runs continuous replication and point-in-time snapshots, so the baseline risk of data loss is low. We still take periodic manual exports for:

- Disaster recovery from accidental mass deletes or schema migrations we wrote ourselves.
- Regulatory/audit snapshots.
- Portability if we ever need to leave the platform.

### Manual export

Run from the repo root with the Convex deploy key in scope:

```bash
npx convex export --path ./backups/$(date +%Y-%m-%d).zip
```

The archive contains every table in ZIP form. Store it in a private S3 bucket or similar (never commit it).

### Restore

Import one table at a time from an archive extract:

```bash
npx convex import --table users ./backups/2026-04-19/users.jsonl
```

For a full restore, run `import` per table in an order that respects foreign keys (users, educators, districts, then gigs, needs, orders, messages, etc.).

### Cadence

- **Weekly** manual export, retained for 12 weeks in a private bucket.
- Before any schema migration, take an additional on-demand export and keep it for 90 days.
- Quarterly restore rehearsal into a scratch Convex deployment to confirm the process still works.

## Stripe

Not our responsibility. Stripe is the authoritative record for customers, charges, payouts, disputes, and payment methods. Their platform handles backup, redundancy, and compliance. We keep `stripePaymentIntentId` on orders in Convex so reconciliation is straightforward if we ever need to replay.

## Clerk

Clerk handles user-record durability (identities, sessions, MFA enrollments). We mirror the minimum needed — the Clerk user id — into `users.clerkId` in Convex. If Clerk data is lost catastrophically, identities can be re-linked by email on next sign-in.

## Checkr / Resend

Out of scope for v1 (see PRD). When enabled, Checkr retains background-check records; Resend retains send logs. No local backup required.

## What we do NOT back up

- Vercel build artifacts (reproducible from git).
- CDN cache (reproducible).
- `.env.local` on developer machines (managed per developer).
