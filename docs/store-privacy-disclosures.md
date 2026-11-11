# WRINGG store privacy disclosures

Prepared 10 November 2026 from washmate source `4690410b2d244815f9457ef0221de17435259610`, landing source and production checks. Scope: Wringg Customer App (`in.wringg.app`) for Apple/Google Play, and Wringg Partner (`in.wringg.partner`) for Google Play. Partner Apple submission is outside launch scope.

This pack gives evidence-supported answers and clearly identifies final-binary and operational decisions. It is not a submitted questionnaire or a statement that all deletion requirements have passed.

## URLs and support fields

| Field | Value |
| --- | --- |
| Privacy policy, both apps | `https://wringg.in/privacy` |
| Apple Privacy Choices, customer | `https://wringg.in/delete-account` |
| Play account/data deletion, both apps | `https://wringg.in/delete-account` |
| Support/privacy email | `hello@wringg.in` |
| Phone | `+91 72002 32473` |
| Without-app request | Email registered phone and Customer/Partner app name; ownership verification follows. No reinstall required |
| In-app request | Profile → Delete account → confirmation. Customer additionally retrieves/refreshes persisted status |

Verify the public URLs serve the 10 November notices before saving the console fields. The copy removes the unsupported seven-business-day guarantee and order-history erasure claim.

## Apple App Privacy: customer

**Collects data: Yes.** The following account-associated types are **linked to the user**, with **App Functionality** as an evidenced purpose (authentication, fulfilment, support and fraud prevention).

| Apple type | Customer flow |
| --- | --- |
| Contact Info: Name | Full name and display name |
| Contact Info: Phone Number | OTP sign-in, account and pickup contact |
| Contact Info: Email Address | Optional profile email; optional does not automatically mean exempt |
| Contact Info: Physical Address | Pickup/delivery address |
| Location: Precise Location | Address coordinates and permitted device location; foreground baseline |
| Identifiers: User ID | Auth/profile IDs and linked account references |
| Purchases: Purchase History | Orders, amounts, receipts, cash and refund records |
| User Content: Customer Support / Other User Content | In-app support, complaints, ratings and free-form care/order notes; distinguish external email/WhatsApp handoffs |

**Final artifact decisions:**

- Payment Info, Email Address and other Razorpay data/purposes: `react-native-razorpay` 2.3.0 remains bundled. Inspect embedded manifests and runtime behavior even though new launch orders use cash. The iOS fix corrects an invalid email identifier, preserving the SDK's collection, linkage, tracking and purposes.
- Device ID, Diagnostics and Usage Data: inspect notification, update, payment and other SDK flows. Push tokens and account-linked installation identifiers must not be assumed anonymous. Package.json alone cannot establish zero diagnostics.
- Product Interaction / Analytics: production growth is enabled; external export disabled. Client collection also depends on the built `EXPO_PUBLIC_GROWTH_ENABLED` flag and consent. Installation/referral/order attribution is separate from optional interaction events. Include actual active collection and purposes.
- Tracking: no ad-ID integration was identified in reviewed source. First-party referrals alone do not demonstrate cross-company ad tracking. A final “No” still requires all SDK practices, tracking flags/domains and configuration; disabled analytics export alone is insufficient.
- Customer photos/biometrics: no customer identity-verification/photo-upload feature was identified. Partner Didit/photo categories do not automatically apply to the customer binary. Receiving partner-uploaded order photos is distinct from uploading customer camera/library data. Recheck the submitted artifact.

## Google Play Data safety: customer

**Collects data: Yes.** Cover the final artifact and all active versions within the package's form.

| Play type | Collection / requiredness / purposes |
| --- | --- |
| Personal info: name, phone, user IDs | Account identity; required in the account flow. Account management, app functionality, fraud prevention/security |
| Personal info: email | Optional profile field; account management/app functionality |
| Personal info: address | Required to fulfil a pickup booking; app functionality |
| Location: precise | Saved address coordinates and permitted device location. GPS permission is optional; assess manual booking before deciding type-level optionality |
| Financial info: purchase history | Orders, cash, receipt/refund history; functionality and fraud prevention/security |
| App activity: other user-generated content / applicable interactions | Notes, complaints, ratings; consented interactions where enabled. Optional interaction analytics is separate from business attribution |
| Device or other IDs | Notification tokens and installations where registered. Functionality and any evidenced analytics use |
| Payment info, diagnostics, other SDK types | Final provider/artifact review required. Cash-booking success does not prove SDK inactivity in every state |

## Google Play Data safety: partner

**Collects data: Yes.** Prepare a separate form.

| Play type | Partner flow / purpose |
| --- | --- |
| Personal info: name, phone, user IDs, address and any supplied email | Account, onboarding, work location and contact; account management, functionality, fraud prevention/security |
| Personal info: other info / applicable government identifiers | Aadhaar/identity documents, Didit verification evidence/results; verification and security, required for relevant onboarding |
| Location: precise | Foreground onboarding/service area and on-duty matching; functionality. Baseline background flags disabled |
| Photos/videos | Identity images, liveness capture and order proof; verification and service evidence |
| Audio / sensitive or other verification data as applicable | Inspect configured Didit flow, microphone/liveness capture and transmitted results. Permission alone does not prove a stored audio recording exists |
| Financial info: payment/bank details and other financial info as applicable | UPI/bank payout details, earnings, cash, settlement/payout records; functionality/security |
| Device or other IDs; app activity/diagnostics as applicable | Notification tokens, work actions and native SDK behavior; final SDK review required |

**Sharing, both Play forms:** fulfilment transfers relevant information to assigned partners/staff. Supabase, maps/Google, Expo/platform services, Razorpay where used, and partner Didit receive data. Google has exceptions for qualifying processing on the developer's instructions and qualifying user-initiated transfers. Verify contracts, roles and independent provider uses before selecting an exception. “Provider” alone does not establish “No data shared.”

**Security:** backend URLs use HTTPS and private records have access controls. Verify every final SDK/transfer before certifying “all data encrypted in transit.” No independent security badge or end-to-end-encryption claim is established.

## Deletion and retention: actual state

The deployed request endpoint persists an authenticated, idempotent request and blocks new business. The processor is designed to clear ordinary profile/address/payout/token data and close Auth after outstanding obligations resolve; it preserves historical references/evidence.

Production checks found an installed 15-minute deletion cron, **both required dispatch Vault settings absent**, and zero queued requests. The CLI has no management login. Full live automatic completion is **not verified**. Public draft wording explicitly requests support follow-up while automation is finalized.

Orders/proof, finance/cash/settlement, fraud/audit/history and partner verification currently have no fixed automatic expiry. The locked product policy says partner documents are stored forever. Provider-held copies/backups are outside this automatic processor. Truthful disclosure does not justify indefinite retention or establish compliance with associated-data deletion requirements.

The 90-day raw referral/event cleanup exists but its production cron is **paused**; zero raw rows older than 90 days were found. Automatic review rejected activation without specific user approval. No change was applied. The draft notice reflects this.

**Remaining release decisions:** category-specific retention and provider deletion handling; permanent partner-document policy; deletion configuration and disposable-account acceptance; request timing/completion communication; exact native candidates and questionnaires.

## Support procedure

1. Record receipt, app, a request reference and minimum account lookup details. Acknowledge with an expected timeframe appropriate to the case.
2. Verify ownership through a secure account process. Never request login/delivery OTPs, passwords or bank credentials by email; do not invent an email-only authentication bypass.
3. Check orders, dues, complaints, refunds and partner settlements. Explain blockers; do not silently cancel business or forgive money.
4. Use the authorized lifecycle after eligibility. Record core cleanup/Auth closure separately from retained-record and provider decisions. Logout is not erasure.
5. Review retained categories and provider copies with an accountable operator; record necessity, scope, restrictions and expiry/review decisions. Do not erase immutable money/audit evidence ad hoc.
6. Confirm actual completion scope and remaining justified records. Never report provider deletion without confirmation.

## Evidence before console submission

- Exact IPA/AAB identifiers/hashes, enabled flags, native dependency inventory and every privacy manifest, including corrected Razorpay identifier.
- Device/OS results for clean install, permissions, profile/address, booking/cash, support, notifications, analytics choice/withdrawal and deletion. Use owned synthetic identities/private reviewer orders.
- Customer Android Firebase client/project/sender match and actual push delivery; a registered server key alone is insufficient.
- Provider guidance for resolved SDK versions, collection/purpose/linkage/tracking and transfer/retention roles.
- Live page deployment proof. Prior release work passed 52 isolated production customer-reviewer checks; credentials belong only in protected review fields. Partner review is separate.

## Sources

- [Apple App Privacy](https://developer.apple.com/app-store/app-privacy-details/) and [account deletion](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion).
- [Google Data safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en) and [account deletion](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en).
- [Expo notifications](https://docs.expo.dev/push-notifications/overview/), [Razorpay React Native](https://razorpay.com/docs/payments/payment-gateway/react-native-integration/standard/), [Razorpay privacy](https://razorpay.com/privacy-policy/).
- washmate customer/partner app configs, dependencies, profile/deletion screens, analytics and API code; `docs/engineering/account-deletion.md`, `docs/release/razorpay-ios-privacy-fix.md`, `docs/product/defaults-locking.md`, deletion/growth migrations and actual production state.

No fixed statutory period is asserted. Indian DPDP commencement is phased: [official notification](https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf). Do not infer present duties from unverified future dates or treat phased commencement as permission for unlimited retention.
