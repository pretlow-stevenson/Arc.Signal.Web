# Arc Signal help center

Live: https://arcsignal.zendesk.com/hc/en-us

All ten published articles reviewed September 29, 2026 against `assets/data/spectra-guide.json` (Spectra 1.0.0 / 1A1026). Zendesk is an independently published service: a Git commit does not deploy its configuration or articles. Product behavior remains defined by the apps and canonical Guide, not these shorter help articles.

## Design configuration

- September 28: the owner approved a small custom Copenhagen theme for a real hero heading and copyright footer. See `../zendesk/README.md` for source, deployment status, upstream updates, and rollback. Custom themes do not receive automatic Copenhagen feature updates.
- Keep the owner-uploaded signal logo and hero. See `zendesk-hero-v2.md` for the current upload file and source artwork; the original is preserved.
- Brand and link color: `#075bb5` (6.62:1 against white). Hover link color: `#06478d`. Preserve distinct visited-link styling.
- Hide home-page Recent activity.
- Hide article author/avatar, comments, follow controls, and social sharing. Retain in-section navigation, related/recently viewed help, and helpfulness voting.
- Keep the unused community disabled. Archived starter drafts remain recoverable; do not republish them because they describe an unrelated company.
- Keep the custom patch narrow: a semantic hero heading, copyright beside the existing footer name, and scoped layout rules. Native search, navigation, language selection, and generated runtime bundles remain unchanged. Keep Contact Arc Signal support promoted for website, Guide, privacy, and contact links.
- The messaging widget is a separate Zendesk product; its styling and routing were not changed in this pass. No support request or email was sent during validation.

## Section order and descriptions

1. **Getting started** — Set up Spectra, choose a check, and understand what each measurement can tell you.
2. **Product Guide** — Understand findings, explore magnetic changes, and make sense of radio activity.
3. **Troubleshooting** — Resolve missing devices, measurement access, and unexpected readings.
4. **Privacy & sessions** — Save, recheck, export, and erase your observations. Stay in control of what you share.
5. **Experimental Apple Watch** — Prepare a 30-second Bluetooth sweep, transfer captures, and troubleshoot the experimental companion.
6. **Company overview** — Meet Arc Signal, contact support, and find our website and privacy policy.

## Article inventory

| Article | Zendesk article ID | Section | Homepage promotion |
| --- | --- | --- | --- |
| Get started with Spectra | 56434299423899 | Getting started | Yes |
| Use Spectra while traveling and in shared spaces | 56435630260123 | Getting started | No |
| Understand findings, names, and signal strength | 56434331296923 | Product Guide | No |
| Practice with the magnetic meter | 56435559529627 | Product Guide | No |
| Understand Monitor and its baseline | 56435605386651 | Product Guide | No |
| Troubleshoot missing devices and unexpected readings | 56434354083227 | Troubleshooting | Yes |
| Manage sessions, export results, and erase your data | 56434367436187 | Privacy & sessions | No |
| Take a sweep with the Experimental Apple Watch companion | 56434359907227 | Experimental Apple Watch | Yes |
| About us | 56413781880091 | Company overview | No |
| Contact Arc Signal support | 56435622772379 | Company overview | Yes |

All ten articles are published and configured for everyone. Article URLs use `https://arcsignal.zendesk.com/hc/en-us/articles/` followed by the article ID. `zendesk-articles.json` contains four articles added during the original polish pass (title, section, canonical Guide source IDs, and submitted HTML); it is an editorial source, not an automatic uploader. `zendesk-watch-article.html` mirrors the September 29 Watch article update, including phone-free collection, five local captures, active-display requirements, and later paired-iPhone review. The five remaining articles are maintained in Zendesk and indexed here.

## Content guardrails

- Distinguish UI labels using semantic strong emphasis; use headings and real numbered/bulleted lists.
- Do not present a quiet check as an all-clear, radio strength as distance, magnetic changes as identities, or advertised names as authentication.
- Keep iOS 27+ / watchOS 27+, Experimental Watch scope, foreground limitations, and optional Apple Intelligence consistent with the Guide.
- Say “capture without your iPhone nearby,” not unrestricted “capture anywhere.” Collection is local and needs no internet or cellular plan; identification and detailed review need the paired iPhone. Five is the total local capacity, not five additional slots. Unsent copies are not automatically discarded, and a full store can block new sweeps.
- Describe Monitor's source-local baseline, bounded history, and observation changes without suggesting physical arrivals or verified absence.
- Magnetic sensor placement is model-specific. Practice is unsaved familiarization, not hardware certification.
- VPN guidance must explain limits and the shift of trust to the VPN provider. This support content contains no affiliate link or hidden commercial recommendation.
- Contact email is `support@arcsignal.zendesk.com`. Do not request private archives by default. Reduced identifying information is not anonymous.
- No response-time promise, app-store availability claim, or security certification is implied.

## Verification and maintenance

September 29, build 1026: updated and read back the public routes for Get started,
Manage sessions, Troubleshooting, Contact support and Experimental Watch. The
first two full submitted bodies are mirrored in `zendesk-getting-started-article.html`
and `zendesk-session-article.html`; Contact and Watch mirrors are also updated.
Troubleshooting now explains planned 30-minute completion and missing location
tags (per-check consent, 12-second acquisition and 5 km maximum reported uncertainty).
All ten live articles were checked for conflicting scope or privacy claims.
Unchanged travel, findings, practice, Monitor and company articles remain accurate;
no unrelated visual, messaging, billing or category settings were changed.

The updated company site passes all 57 tests, canonical Guide parity and the
35-file public build. Fresh native iPhone and Watch screenshots identify build
1026; both website importers verified unchanged decoded pixels. Product and Guide
layouts were inspected locally, and the five updated Zendesk articles were read
back from their public routes after saving.

Key contracts: extensions add 30 minutes to the deadline; automatic completion
respects saving preference. Location is per-check iPhone-only, off by default,
and never blocks scanning. Rechecks retain source context; Watch stays untagged.
Exports exclude tags unless explicitly included; AI copies and support diagnostics
exclude them. Removal affects this copy, not independent rechecks or external
files. The external prompt asks four practical questions without promising an
identity, safety verdict or accurate AI answer.

September 29: published article 56434359907227 with the phone-free collection
section and verified its public-route text, semantic headings, capacity wording,
paired-phone review requirement, and Everyone audience setting. Reviewed the
rendered article; no theme, messaging, billing, or category settings were changed.
For that earlier build 1025 update, the company Guide was regenerated and
unchanged marketing screens received a release-specific content review. Build
1026 supersedes that review with fresh native iPhone and Watch captures. A new
Finder `.DS_Store` under `assets/images` was moved recoverably to
`/private/tmp/arc-signal-images-DS_Store-20260929-phonefree` rather than published.

Verified published desktop homepage order, descriptions, promotions, hero, blue accents, and absence of Recent activity/community; reviewed published article structure and contact links. Search for `magnetic` returns the new practice article. Blue/white contrast was calculated; this is not a full accessibility certification.

Verification used an authenticated administrator viewing the public help-center routes; public audience settings were also checked. Signed-out behavior, mobile hardware rendering, support email delivery, and messaging routing still need owner checks. Trial/billing settings were not changed.

Repository validation passed all 53 tests, canonical Guide freshness checking, and the static build (34 reviewed public files). The Zendesk image source and upload JPEG are deliberately outside that public bundle, preserving the existing site-size budget. A local Finder metadata file under `assets` was moved recoverably to `/private/tmp/arc-signal-assets-DS_Store-20260927`; the strict publication guard was not weakened.

For future releases: compare relevant canonical Guide sections, update the editorial JSON and Zendesk copy together, verify article placement/public visibility/search, then record any changed IDs or configuration here. Use native settings where possible and follow `../zendesk/UPSTREAM.md` for manually reviewed theme updates.

References:

- https://support.zendesk.com/hc/en-us/articles/4408844090522-Hiding-and-showing-elements-in-your-Copenhagen-standard-theme
- https://support.zendesk.com/hc/en-us/articles/4408843983258-Reordering-knowledge-base-content-within-categories-and-sections
- https://support.zendesk.com/hc/en-us/articles/4408821255834-About-the-standard-theme-and-custom-themes-in-your-help-center
