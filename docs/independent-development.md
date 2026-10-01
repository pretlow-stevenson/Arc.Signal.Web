# Optional development support

The company and Spectra pages include a quiet, matching section after their
product/download call to action. Existing Bodoni/Inter typography, neutral
surfaces and responsive two-column layout are reused. No new artwork, payment
SDK, tracking, cookie, form, or runtime dependency is introduced.

The native disabled button previews “Support our work” with the visible note
“Optional one-time contributions via Stripe. Available once business verification
is complete.” It performs no action, even without JavaScript, and does not claim
payments are active.

On October 1, 2026, the owner supplied this Payment Link and stated it is inactive
while the business is being verified:
`https://buy.stripe.com/6oU3cufOq6KeftE5tR9MY00`.
Both sections retain that exact public URL in `data-payment-url`, with
`data-payment-status="pending-verification"`. This attribute is configuration,
not a navigable link, and does not contact Stripe. No script automatically enables
it. Activation remains a separate change after verification.

Contributions express appreciation for Spectra already provided. They do not buy extra
features, recognition coverage, or preferential customer support. Updates remain
included. No charitable or tax-deductibility claim is made. Keep this invitation
off the Zendesk help center: someone seeking help should not be asked to pay
again. Native apps, App Store copy, and scan screenshots are unchanged.

Public copy uses “contribution,” not “tip.” This is a tone choice, not a change
to the underlying payment purpose or an exemption from Stripe's tip requirements.

## Research and choices (September 30, 2026)

- [Stripe tip requirements](https://support.stripe.com/questions/requirements-for-accepting-tips-or-donations):
  tips must relate to goods or services already provided, rather than an
  unspecified fundraising promise. Confirm account eligibility before launch.
- [Apple button guidance](https://developer.apple.com/design/human-interface-guidelines/buttons):
  clear action labels and distinction between enabled and unavailable controls.
- [NN/g link labels](https://www.nngroup.com/articles/better-link-labels/):
  set sincere expectations. The visible coming-soon note explains the inactive
  preview; it is not a deceptive working checkout link.

The placement and restrained outline are design choices, not claims of measured
conversion improvement. No popups, urgency, fundraising targets, or tier upsells.

## Activate only when the actual business checkout is ready

1. Confirm Stripe has completed verification of Arc Signal's business and that
   the approved Payment Link is active with the intended one-time,
   customer-chosen-amount configuration for appreciation of Spectra.
2. Verify the actual Stripe-hosted destination and test the payment flow using
   Stripe's test environment; never invent a live URL or perform a real charge
   as an automated UI test.
3. Replace both disabled buttons with descriptive links to the approved URL
   retained in `data-payment-url`. Add `rel="noreferrer"` and
   `referrerpolicy="no-referrer"`, change the payment status to active, and
   replace the pending-verification caption.
4. Update website privacy details for the external payment processor before
   activation. Do not add Stripe scripts or an embedded checkout to these pages.
5. Update the exact destination allowlist and placeholder assertions in the
   website tests. Recheck keyboard focus, mobile wrapping, enlarged text,
   visible disclosure, cancellation/return behavior and genuine checkout brand.

Run `npm test` and `npm run build`. Keep production screenshots labeled with
their actual app build; this website-only section does not change those assets.

## Preview verification

September 30: all 59 site tests and the 35-file production build passed. A
separate diff review confirmed isolated CSS selectors, identical section copy,
unchanged payment/privacy behavior and preservation of unrelated Zendesk edits.
Inspected real browser renders on desktop and at 390- and 320-pixel widths;
mobile content had no horizontal overflow. The native button was confirmed
disabled and browser logs showed no warnings or errors. Full screen-reader and
browser text-zoom acceptance remain manual checks; no payment transaction was
attempted. This section previews the contribution option, not an activated checkout.
