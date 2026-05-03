# K12Gig Legal and Procurement Readiness

Date: 2026-05-02

This tracks Launch Lane 2 (`K12-138`). It is an engineering/procurement readiness checklist, not legal advice. Final Privacy Policy, Terms, DPA, MSA, sales-tax, and pricing language still need approval by the client, counsel, and tax advisor where applicable.

## Public App Surface

- Privacy Policy: public placeholder copy removed; page now includes adult-user scope, student-data minimization, FERPA/COPPA posture, subprocessors, retention, security, incident contact, DPA request path, and exact last-updated date.
- Terms of Service: public placeholder copy removed; page now includes account authority, marketplace role boundaries, district agreement precedence, payment/invoice terms, cancellations/refunds/disputes, credential/background-check scope, acceptable use, liability language, and exact version.
- District DPA page: public page now includes a procurement packet request form instead of exposing internal launch uncertainty.
- Help/Pricing: support and invoice/procurement paths now point to a consistent support address.
- Signup/onboarding: signup shows legal links, and onboarding requires a versioned Terms/Privacy acceptance before setup can complete.

## Lane 2 Tracks

- Track A (`K12-143`): in-code DPA/procurement intake workflow.
- Track B (`K12-144`): counsel, CPA, client, and vendor approval packet.

## Procurement Intake Workflow

Implemented:

- `procurementRequests` Convex table.
- Public `procurement.createRequest` mutation for `/dpa` intake.
- Signed-in district request history in `/dashboard/district/settings#procurement`.
- Superadmin/support queue at `/dashboard/admin/procurement`.
- Status lifecycle: `new`, `in_review`, `packet_sent`, `waiting_on_district`, `approved`, `closed`.
- Request notifications for signed-in submitters.

Open follow-up:

- Email notification to support when a request is submitted.
- File upload/e-signature flow once the counsel-approved DPA template exists.
- Signed DPA storage against district records.

## Data Captured

The `users` table now supports:

- `termsAcceptedAt`
- `termsVersion`
- `privacyAcceptedAt`
- `privacyVersion`

These fields are written by `users.completeOnboarding` when a new user finishes district or educator setup.

The `procurementRequests` table captures:

- requester name, email, and title
- district name and state
- optional linked district/user ids
- requested materials
- deadline, procurement contact, and notes
- status and internal notes

## Open Approval Items

- `K12-9`: counsel-approved Privacy Policy.
- `K12-10`: counsel-approved Terms of Service.
- `K12-12`: DPA template and signing/storage workflow.
- `K12-71`: signed MSA/maintenance agreement between Asala and the client.
- `K12-72`: CPA/counsel sales-tax and nexus decision.
- `K12-73`: final pricing model signoff.
- `K12-62`: confirm the production support inbox exists and routes to an accountable owner.

## Reference Inputs

- U.S. Department of Education Student Privacy Policy Office / FERPA overview: https://www.ed.gov/about/ed-offices/opepd/student-privacy-policy-office
- U.S. Department of Education student privacy resources: https://studentprivacy.ed.gov/
- FTC COPPA FAQ for schools and education technology: https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions
- ED contractor responsibilities under FERPA resource: https://studentprivacy.ed.gov/resources/contractor-responsibilities-under-ferpa-tri-fold
