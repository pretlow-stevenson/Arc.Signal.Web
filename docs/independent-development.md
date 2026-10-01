# Optional development support

The company and Spectra pages include a quiet, matching section after their
product/download call to action. Existing Bodoni/Inter typography, neutral
surfaces and responsive two-column layout are reused. No new artwork, payment
SDK, tracking, cookie, form, or runtime dependency is introduced.

On October 1, 2026, the owner confirmed activation of this Payment Link:
`https://buy.stripe.com/6oU3cufOq6KeftE5tR9MY00`.
Both sections use that exact URL in the “Support our work” link, with
`data-payment-status="active"`. The visible caption reads “Optional one-time
contribution · Checkout hosted by Stripe.” The link suppresses the referring
page and works without JavaScript. Browsing our pages does not contact Stripe;
only following the link opens its hosted checkout.

A read-only checkout review showed Arc Signal LLC, “Support independent
development,” and $5.00. No amount-selection control was observed, so the site
does not promise a customer-chosen amount. No payment was submitted. The website
privacy policy explains payment processing and contribution records separately
from local scan history; see [Stripe’s privacy policy](https://stripe.com/privacy).

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

## Checkout maintenance

1. Keep the destination restricted to the owner-approved Payment Link. Check
   the merchant identity, contribution description, amount, and one-time payment
   configuration when changing checkout settings; do not promise unverified options.
2. Verify the actual Stripe-hosted destination and test the payment flow using
   Stripe's test environment; never invent a live URL or perform a real charge
   as an automated UI test.
3. Keep both contribution sections identical, including `rel="noreferrer"`,
   `referrerpolicy="no-referrer"`, and a visible external-checkout caption.
4. Keep website privacy details aligned with the external payment processor.
   Do not add Stripe scripts or an embedded checkout to these pages.
5. Maintain the exact destination allowlist and active-link assertions in the
   website tests. Recheck keyboard focus, mobile wrapping, enlarged text,
   visible disclosure, cancellation/return behavior and genuine checkout brand.

Run `npm test` and `npm run build`. Keep production screenshots labeled with
their actual app build; this website-only section does not change those assets.

## Activation verification (October 1, 2026)

`npm test`, `npm run guide:check`, `npm run build`, and `git diff --check` pass.
The production build validates 35 public files. A separate hardening review
confirmed identical sections, exact destination allowlisting, referrer suppression,
and no embedded payment resources. The local browser render showed the enabled
link and its caption without horizontal overflow. Checkout was reviewed read-only;
payment completion and assistive-technology acceptance remain manual checks.

## Historical preview verification

September 30: all 59 site tests and the 35-file production build passed. A
separate diff review confirmed isolated CSS selectors, identical section copy,
unchanged payment/privacy behavior and preservation of unrelated Zendesk edits.
Inspected real browser renders on desktop and at 390- and 320-pixel widths;
mobile content had no horizontal overflow. The native button was confirmed
disabled and browser logs showed no warnings or errors. Full screen-reader and
browser text-zoom acceptance remain manual checks; no payment transaction was
attempted. This section previews the contribution option, not an activated checkout.
