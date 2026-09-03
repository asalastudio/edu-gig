# Contract and payment disputes

K12Gig does not process payments at launch. After a proposal is accepted, the district and consultant arrange signature and payment off-platform. Contract Hub stores working documents only; it is not an e-sign or payment product.

## If a payment dispute happens off-platform

- The parties resolve it through their own contract, PO, or district procurement process.
- K12Gig support can help locate the engagement, proposal terms, and uploaded files for the authorized parties.
- Do not promise platform refunds, ACH reversals, or 1099 corrections — those are not issued by K12Gig.

## Legacy Stripe records

Historical `orders` created before checkout was retired remain readable for audit. Stripe webhook handlers stay secret-gated for those legacy events. New checkout creation is disabled unless both `NEXT_PUBLIC_ENABLE_LEGACY_CHECKOUT` and card checkout are explicitly enabled.
