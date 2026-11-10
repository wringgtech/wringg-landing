# Privacy and deletion page rollout

## Production follow-up — November 10, 2026

The production account-deletion worker now has its protected job token and matching Vault origin/token settings. A live test first verified that no real deletion requests were queued, then created and deleted one owned temporary account. The request completed, ordinary profile contact details were cleared, and both the old access token and direct database access were denied. The queue was empty afterward.

The deletion notice now states that eligible in-app requests are checked automatically for core cleanup. Retained financial, order, audit and verification records and provider-held copies still require the handling described in the notices. The separate raw-analytics cleanup remains paused.

The updated website production build and static export passed. Website publication requires merging this PR and deploying through the repository workflow; the public website has not been changed. The earlier missing-worker-settings notes below describe the state before this follow-up.


Updated 10 November 2026. These pages correct misleading notices and describe current behavior. Publishing a truthful notice is separate from satisfying every app-store privacy/deletion release requirement.

## Changes

- Distinguish customer bookings from partner Didit verification, photos and payouts. Cover location, tokens, technical/provider processing, support, referrals and consented interactions.
- Use the shared legal template, confirmed support email and prominent deletion-request action. Users without the app can request deletion without reinstalling it.
- Remove the guaranteed seven-business-day completion and order-history erasure promises. Explain blockers, core cleanup, pseudonymous references, retained records and provider limits.
- Report production growth enabled and external analytics export disabled. The raw 90-day cleanup cron is paused. Deletion dispatch is missing required Vault settings, so the notice requests support follow-up while automation is finalized.
- Add accessible privacy/deletion navigation and clickable contact links. Terms/refund/shipping/contact body copy is unchanged.
- Add `store-privacy-disclosures.md` with separate customer Apple/customer Play/partner Play mappings, support handling and exact outstanding evidence. No secrets or personal production records are included.

## Validation

- Read repository AGENTS and the installed Next 16.2.6 metadata/static-export guidance.
- ESLint and production static build passed, including TypeScript and all public routes.
- Local Cloudflare Worker preview served the export. Checked privacy/deletion navigation and desktop/390-pixel phone layouts. Email action targets the existing support address with a deletion subject and minimum fields; no email was sent.
- Production read-only checks: empty deletion queue; active deletion cron but missing dispatch Vault names; growth enabled/export disabled; raw retention cron inactive and zero raw rows older than 90 days.
- Publication requires Cloudflare access and live verification of the 10 November pages. No deployment or store submission is claimed by this source update.

## Remaining app-release requirements

1. Configure and test the deletion processor end-to-end on an owned disposable Auth identity, including Auth closure and old-token denial. Do not erase real customer/partner or store-reviewer accounts.
2. Resolve indefinite retained categories and the locked permanent partner-document policy; implement a defensible retention/review and provider-deletion process.
3. Inspect final native SDKs/manifests/runtime and complete separate questionnaires. Apple migration blocks the signed customer iOS candidate; Android Firebase client/push evidence is separate.
4. Obtain specific approval before enabling the paused irreversible 90-day raw-data cleanup. Automatic review rejected activation; no change was applied.

See `store-privacy-disclosures.md` for current state, sources and operational details.
