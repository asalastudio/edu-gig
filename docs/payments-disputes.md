# Educator-side dispute path

When a district disputes a charge with Stripe (`charge.dispute.created`), K12Gig marks the related order as `disputed` and notifies admins for manual review.

## Educator expectations

- Educators are **not auto-refunded** by the platform when a dispute is opened.
- Educators should provide supporting documentation (session logs, artifacts, attendance evidence) to K12Gig operations.
- K12Gig admins handle Stripe evidence submission and final outcome communication.

## Operational notes

- Disputes are treated as a manual workflow until Stripe resolves the case.
- Refunds, if any, are issued by district/admin action and Stripe webhook confirmation.
