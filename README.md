# Arc Signal

The company website for **Arc Signal LLC**, focused on Spectra and security awareness:

- `index.html`: Arc Signal introduction, the Spectra product card, our approach, and privacy.
- `spectra.html`: Spectra, preparing for release; **iPhone · iOS 27 or later**.
- `seamless.html`: unlisted Seamless screenshot stitching page, coming soon for **Apple iPhone · iOS 18 or later**.
- `guide.html`: the complete Spectra Guide and support contact, generated from native app content.
- `spectra-privacy.html`: the public Spectra privacy policy, also linked in the app before setup and from Settings → About Spectra → Privacy policy.
- `404.html`: recovery links that work even when the requested URL is nested.

Public navigation and promotional copy focus on Spectra. `seamless.html` and its
assets remain published for direct links, with no incoming site links or sitemap
entry. Its `noindex, follow` metadata asks search engines not to list the page;
this is not access control. Keep it crawlable so search engines can read that directive.

## Development

Build 1A1060 support alignment (October 7): **Use the magnetic meter** now has
a complete local source in `docs/zendesk-magnetic-article.html`. It separates the
unsaved practice exercise from magnetic **Area Sweep**, uses the exact native
Guide and sweep controls, explains both reading modes, and preserves the existing
article ID and heading anchors. Getting started and Troubleshooting link to it.
Homepage promotion now prioritizes this core iPhone measurement instead of
the Experimental Watch article; the Watch article remains published and browseable.
The three revised support bodies were separately published and independently
compared in full through unauthenticated public API readbacks. All existing
anchors, sections and audiences remain; Watch's raw body is unchanged.
See `docs/zendesk-help-center.md` for exact publication and promotion receipts.
The article reuses the gallery's genuine magnetic-meter screenshot with an explicit
example-data caption. Its actual 1060 producer and final local asset hashes are
verified. All 35 live website files match the committed bytes; the published
image loads and fits in the reviewed desktop support layout. Mobile-device,
signed-out interactive and accessibility acceptance remain separate checks.
Sessions' leading blue dot means **Recheck available**, not
unread, confidence or a new measurement. Opening a session does not clear it.

Build 1A1058 content alignment (October 7): support context
is reviewed in **Settings → Support information → Copy support information**.
**Support site** and **Email support** remain direct links in Settings. Installed
identity, company links, the public policy and acknowledgments are under
**Settings → About Spectra**. **Privacy & storage guide** opens the offline Guide,
separate from **Session storage**. The Watch app's **Settings → About** route is
unchanged. The canonical Guide is regenerated from 1058 sources. The two affected
Zendesk articles were separately published and read back; see the scoped receipt
in `docs/zendesk-help-center.md`. No gallery image depicts these destinations;
existing iPhone-1051 and Watch-1028 captures retain their actual provenance.
All 78 website tests, Guide parity and the 35-file public build pass. GitHub Pages
deployment, native acceptance and TestFlight availability remain separate gates;
these checks do not establish signed-out support access or email delivery.

### Zendesk support content

The independently hosted [Arc Signal Help Center](https://arcsignal.zendesk.com/hc/en-us)
uses our small [Copenhagen-based custom theme](zendesk/README.md), maintained as a
Git subtree with documented update and rollback procedures. See [its configuration and article inventory](docs/zendesk-help-center.md)
for the published support topics, content boundaries, and verification limits.
[Hero assets and provenance](docs/zendesk-hero.md) and the four supplemental
article sources in `docs/zendesk-articles.json` are kept in this repository.
The full [magnetic-meter article](docs/zendesk-magnetic-article.html) is canonical
for the supplemental magnetic entry; keep their HTML synchronized.
Zendesk-only artwork stays under `docs/support-assets`, outside the corporate
website's public bundle. A Git push does not publish Zendesk changes.

### Website development

The optional Experimental Watch companion requires watchOS 27 or later and a
paired iPhone running iOS 27 or later. The iPhone app works without a Watch;
Apple Intelligence is required only for optional on-device analysis.

`scripts/site-files.mjs` defines the reviewed public asset manifest. Adding a new
asset requires adding its exact path after reviewing its contents; the build
rejects unknown files or directories under `assets`, including ordinary JSON or
image files that could otherwise expose private captures. Do not add private
evidence, credentials, or temporary capture files to this tree. Approved files
must also exist and cannot be symlinks. This prevents accidental publication,
not malicious replacement of approved content; content and provenance tests
remain separate release gates.

The site is static HTML and CSS with one small, deferred local script for optional
image and section reveals. There are no runtime dependencies, forms, analytics,
or third-party resource requests on page load. Optional external links navigate
only when followed; they are not prefetched or embedded. Content remains visible with JavaScript blocked
or IntersectionObserver unavailable. Reduced motion disables reveals and hover
movement; image reveals wait for loading, and each target animates only once. Inter and Bodoni Moda are
self-hosted; their SIL Open Font Licenses are included with the fonts.

Typography uses Bodoni Moda for opening headlines and marketing section headings,
with Inter for body copy, navigation, and guide/policy topic headings. Marketing
section headings scale from 32–44px; body text stays at 16px, with supporting labels
at least 13px. Guide categories use 17px semibold sentence-case headings above
16px topic links. Type sizes use rem, with bounded fluid scaling for larger headings.

The homepage opens with a company-led hero: a large headline and brief introduction
on the left, balanced by the standalone Arc Signal waveform on the right, without
an app-icon tile, product caption, or duplicate Spectra action.
The product card and primary navigation own product discovery; product-specific
privacy principles sit with that card. Preserve Spectra's approved artwork on its
product page and card. This hierarchy follows [NN/g's company-information research](https://www.nngroup.com/articles/about-us-information-on-websites/)
and [Apple's layout guidance](https://developer.apple.com/design/human-interface-guidelines/layout):
make the organization clear first, then group related product information. The
opening follows the owner's [K Means reference](https://kmeans.ai/), with the
introduction directly below the headline instead of in a competing text column.
The decorative hero mark reuses the navigation's exact raster mask and crop,
with a distinct mask ID; no artwork is reconstructed or substituted. It is hidden
on narrow screens, where the navigation already supplies the company mark. The
headline stays visible without an entrance animation, and type wraps naturally.

With Node.js 22 or later:

```sh
npm test
npm run build
```

The build validates the source and creates a fresh public-only directory in the
system temporary directory. It prints that directory for preview or portability.
There is no dependency installation step. Tests check local assets and anchors,
metadata, accessibility structure, contrast pairs, privacy boundaries, and the
download link and compatibility copy. These checks do not replace visual or
assistive-technology testing in browsers.

## Publishing

### Shared Guide content

October 8 collection workflow: **Export All Sessions** is on **Session Storage**,
below its history statistics. **Import Sessions** on the main card accepts one
Technical JSON or a Spectra ZIP collection without unzipping. A collection adds
all new accepted reports together or none; duplicates stay unchanged, and
conflicts, invalid members or insufficient capacity block the import. No saved
session is deleted automatically. Location tags start excluded, and collections
are not full app backups. Keep product/privacy copy, canonical Guide, Sessions
and Troubleshooting help mirrors, App Store copy and the depicted Sessions
control consistent. Separate publication and image-provenance receipts are
required; prepared source changes do not prove deployment or new captures.

The app's `GuideArticle.swift` and `GuideReleaseArticles.swift` are canonical.
The neighboring Spectra checkout's `scripts/ExportGuide.swift` exports them to
`assets/data/spectra-guide.json`; `npm run guide` then produces `guide.html`.
Both generated files are committed so GitHub Pages needs no Swift or JavaScript
runtime. Compile the exporter with both native Guide sources, then pass the
output JSON path and the app's `Configurations/BuildNumber.xcconfig` path. The
export reads the approved release identity from that configuration; it does not
allocate a build or change the lock. Regenerate after an approved release change.
`npm test` checks exact HTML parity, thirteen stable topic routes, the
release identity shape and matching numeric/public build suffix, support address,
compatibility, and the public policy link.

Build 1A1050 makes **New Baseline** visible in the main Monitor panel. It starts a
fresh 30-second observation window, shows baseline capture and elapsed comparison
time, and preserves earlier comparisons for final review. **Mark changes reviewed**
acknowledges activity without clearing counters or changing the baseline. The
three counters describe distinct identities within the current comparison’s latest
40 retained events; they are not lifetime totals or physical-device counts. Keep
the generated Guide and published Monitor support article consistent with these boundaries.

Build 1A1034 adds **Arc Signal website** in the app's Settings → About, separate
from hosted support. The canonical troubleshooting Guide names that route.
No marketing image depicts this section; the explicit content review retains
actual iPhone-1033 and Watch-1028 capture provenance for their unchanged screens.

Build 1A1035 matches Sessions' multi-select circles to Area Sweep's established
size and weight. No marketing image shows selection mode; normal session rows
and all pictured workflows remain unchanged. The explicit image review is
renewed against the current Guide identity without relabeling earlier captures.

Phone-free collection is explained on the product page, in its FAQ, in the
canonical Guide, and in the published Zendesk Watch article. Up to five captures
fit on Watch in total; unsent captures are protected and full storage can block
another sweep. The paired iPhone is needed later for identification and review,
not nearby during collection. Do not imply unattended capture or unlimited space.

Experimental Watch appears in the product FAQ, shared Guide, and privacy policy,
not as a mature public-release feature promise. Keep its active-screen,
30-second Bluetooth-only scope, 70-second wake setup, partial-on-interruption
behavior, automatic queued transfer, active-iPhone recognition, and separate
copy/erase boundaries clear. The Sessions antenna icon and persistent
Apple Watch · Bluetooth-only sweep label identify collection origin through
renaming and rechecks; Experimental and partial-capture status stay visible.
The Watch's ability to observe nearby watches is unrelated to this companion;
do not confuse the existing Watches & Wearables iPhone specialist with it.

Saved-session rechecks are described in the company overview, Spectra feature
copy/FAQ, shared Sessions Guide, and privacy policy. Keep claims conditional on
newer compatible bundled recognition and usable retained radio evidence. Rechecks
create independent numbered copies, preserve originals, take no new measurements,
and need no Apple Intelligence. They do not guarantee improved identification or
show what is at a past location now. The policy explains storage, independent
deletion, and retained naming lineage; catalog updates still ship with app releases.

Sessions uses independently expandable day groups, newest first. The latest day
starts open; other days are one tap away. The shared Guide explains in-memory
expansion choices, day counts, blue-dot availability, and selected deletion across
closed days. Keep the product-page summary and generated help consistent with
that behavior; do not imply opening a day or session clears recheck availability.

Final-release guidance also covers the iPhone Area Sweep's extendable 30-minute
deadline, quiet 25-minute notice, and normal saving preference at completion.
Optional per-check Tag location records one scan-start position, accuracy, and fix
time—not a route or detected-device location. It starts off every time, accepts
eligible approximate fixes, never blocks scanning, and is not added to Watch
imports. All JSON formats omit it unless Include scan location is explicitly
enabled; finding analysis and AI copies always omit the tag. Rechecks retain the
original tag, while Remove location affects only the selected copy. Keep these
sharing and removal boundaries consistent in the product FAQ, Guide, and policy.
Enable map previews is a separate, remembered choice: after enabling, tagged
results automatically request saved areas from Apple Maps, never a fresh collector
position. Not now is remembered without repeated prompts. Settings → Session maps
can change the preference, and Reset Spectra clears it. The static image is temporary,
excluded from sessions and exports, and unavailable states do not block findings.
Open in Maps remains separate. Do not imply that clearing Spectra's preview or
resetting the app erases Apple's service records or system map caches.

After editing native help, compile its exporter with the two Guide sources,
run the executable with this repository's JSON path, then run:

```sh
npm run guide
npm run guide:check
npm test
npm run build
```

Do not edit generated HTML or JSON by hand. Native search is available offline;
the website uses a topic index, in-page anchors, and browser Find without adding
tracking, forms, or client scripts. Technical detail uses native disclosure.

Magnetic help explains that sensor position varies by model and a quiet reading
is inconclusive. The iPhone 17 Pro Max example follows Apple's dimensional drawing,
sheet 4 / PDF page 5; never generalize that lower-back location to other models.
The optional in-app practice view uses live magnetic readings and motion context,
not radio scanning or session storage. It clears readings on Stop, Done, or
backgrounding and requires an explicit restart. The shared Guide and product FAQ
explain a safe familiar-speaker comparison, separate from calibration or a
pass/fail test. Publish this feature copy with the app release that includes it.
Email support opens the user's mail client at `support@arcsignal.zendesk.com`
with no scan data or attachments. The separate Support site opens
`https://arcsignal.zendesk.com`; the offline/native Guide remains available and
its web edition stays at `https://arcsignal.app/guide.html`. No Zendesk widget,
SDK, automatic diagnostic upload, or new tracking script is embedded. Product-site
privacy claims are scoped separately from Zendesk's hosted support service.
Verify the public help center and inbound email before App Store submission;
link configuration does not prove service availability or mail delivery.

### Existing hosting

The existing GitHub Pages configuration publishes the root of `main` at
**https://arcsignal.app/**. Keep `CNAME` in sync with the configured custom domain.
HTTPS enforcement is enabled in the existing Pages configuration. Confirm its
redirect and certificate when changing hosting or domain settings.
`_config.yml` excludes development-only files from the Pages build. Changes to
`main` can publish the website; review content and test before pushing.

The site uses a restrictive meta Content Security Policy and loads only its own
fonts, styles, and images. The hosting platform controls response headers and
routine request logging; this site does not claim to eliminate those logs.

## App Store download

The site presents Spectra as coming to the App Store. `app-store-download` is a
noninteractive status, not a broken `http://` link or a simulated download button.
At release, replace it with the official badge and verified Spectra listing URL;
update the homepage status, metadata, and download validation together.

The official black [Download on the App Store badge](https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg)
is stored locally for use at release. Preserve its proportions
and surrounding clear space, following [Apple’s marketing guidelines](https://developer.apple.com/app-store/marketing/guidelines/).
The footer credits Apple, Apple Intelligence, the Apple logo, iPhone, and App Store, and includes the
IOS credit from [Apple’s trademark list](https://www.apple.com/legal/intellectual-property/trademark/appletmlist.html).

Keep compatibility, customer-support details, and privacy disclosures aligned
with the app. The complete policy is https://arcsignal.app/spectra-privacy.html.
The owner should review its support-retention and provider statements before
submission. App Store Connect privacy labels remain a separate declaration.
The app requires an iPhone running iOS 27 or later. Scanning, Bluetooth Proximity,
history, and JSON export have no in-app purchase or Apple Intelligence gate.
Only optional on-device analysis requires Apple Intelligence-capable hardware
and an enabled, ready model in a supported language and region. Analysis uses
one selected finding summary locally; generated explanations are temporary,
not saved or exported. Copy for AI is a separate user-initiated clipboard action,
not an automatic upload; external recipients control data pasted into them.
The approved U.S. launch price is **$3.99, one-time upfront**, without a discount,
subscription, or in-app purchase. The site says planned price until release.
App Store Connect pricing must be configured and checked separately; repository
copy is not confirmation of the live price. Regional prices may vary. Do not
promise a free download or advertise the retired scan-unlock product.
App-owned text remains standard-sized under Larger Text by owner decision;
do not advertise Larger Text support for the app. Website text resizing remains.

## NordVPN affiliate recommendations

The owner approved activation on September 17, 2026 and supplied the program-issued
NordVPN link. The approved public URL is:

`https://go.nordvpn.net/aff_c?offer_id=15&aff_id=156788&url_id=902`

Use HTML-escaped ampersands in anchors. Do not change the three parameters, add
visitor identifiers, attach scan data, or copy private correspondence into the
repository. NordPass and other products from the email are not included.

The homepage introduces NordVPN in its everyday-awareness section. The Spectra
page explains the complementary network-protection use case alongside independent
FTC, EFF, and CISA guidance. Each page has one intentional NordVPN action, with the
plain commission disclosure immediately before it and connected using
`aria-describedby`. The link uses `rel="sponsored noreferrer"` and
`referrerpolicy="no-referrer"`. It navigates in the same tab so Back works normally.
Spectra remains the primary product; there are no interrupting banners, popups,
remotely loaded third-party assets, affiliate scripts, pixels, link prefetching, or click handlers.
The app's offline Guide remains provider-neutral, with no sales route.

The locally hosted `assets/images/nordvpn-logo.svg` is the original blue-and-black
142 × 32 wordmark from the [official trademark page](https://nordsecurity.com/trademark-policy/),
using its [published SVG](https://sb.nordcdn.com/asset/04e1f4fc-d74e-4d91-92b8-a8f0c834a224/nordvpn-default-svg.svg).
Its SHA-256 is `6a70962b6559849de9f38899abd70512cee8fc817eaf1396f368ba46d3502108`.
Preserve the artwork, colors, registered-trademark symbol, viewBox, and internal
spacing. Display at 10rem wide with automatic height; the surrounding partner
label wraps instead of squeezing or distorting the logo. Explicit image dimensions
reserve space before loading. Both pages include trademark attribution and keep
the paid relationship and commission disclosure visible. Do not recolor, crop,
redraw, animate, or combine it with Arc Signal's mark. The owner's affiliate
agreement and [Nord Security's logo-use guidance](https://sb.nordcdn.com/asset/30a7ca5e-f016-4967-8b4d-fbcd62daff33/Nord_Security-Trademark_Guidelines_.pdf)
govern use; this is not a grant of trademark rights. No provider request is needed
to render the logo.

NordVPN is a separate paid service, not included with or required by Spectra. The
copy discusses routed traffic on shared Wi-Fi, not detection or prevention of
nearby recording. HTTPS context, VPN-provider trust, and required workplace
protections remain explicit. Prices, discount percentages, renewal rates, audit
counts, and platform-specific extras are deliberately not advertised: readers
check current plans and terms at the provider. No performance or safety guarantee
or exclusive offer is implied.

The privacy policy explains that referral navigation can disclose connection
information and lead to attribution cookies/reporting at the destination. A
suppressed referrer does not hide the visitor's IP address or disable that
provider's tracking. Our site does not contact the referral service on page load.
Using the app never requires following the link. The site's affiliate disclosure
does not change the app's local-data practices.

Research and maintenance references (reviewed September 17, 2026):

- [FTC endorsement guidance](https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking): explain commission eligibility clearly beside the recommendation, not only in a footer or the words “affiliate link.”
- [NN/g advertising usability research](https://www.nngroup.com/articles/user-requirements-online-ads/): contextual relevance and non-disruptive placement informed the existing in-flow layout, without hiding its commercial nature.
- [NordVPN features](https://nordvpn.com/features/) and [current plans](https://nordvpn.com/special/): keep feature claims modest and defer changing offers to the provider.
- [Nord's privacy policy](https://my.nordaccount.com/legal/privacy-policy/): external processing and cookie choices belong to the provider. The policy interface requires JavaScript; this update does not attest to its full legal terms.

A bounded link check followed the supplied URL to NordVPN's `/special/` landing
page with `utm_source=aff156788` and `utm_campaign=off15`. The destination returned
403 to the automated client. This verifies the referral route, not checkout,
attribution credit, or current renewal pricing. Confirm those in an ordinary
browser/affiliate dashboard before running a paid campaign; do not repeatedly
follow referral links in automated tests. Tests instead enforce the exact URL,
adjacent disclosure, separate-product wording, local-only resources, and privacy
consistency. Any future link, tracking, or promotional claim needs fresh approval
and a policy/test review. Keep legal and program compliance under owner review.

## Seamless release status

The Seamless page reflects the neighboring app repository’s verified workflow:
2–20 ordered, overlapping screenshots, local processing, inspection of uncertain
joins, and PNG export at the original pixel width. Its app target requires iOS 18
or later; it does not inherit Spectra’s compatibility requirements.

The source repository has not configured App Store distribution, so Seamless is
presented as coming soon, without a download badge or invented release date.
Keep its direct-link page current. Restore public navigation, promotional copy,
and indexing only when Seamless is ready to feature again. Privacy copy distinguishes local
stitching from iCloud retrieval and destination services chosen by the user.

## Spectra product wordmark

The approved Circular logo appears once in the Spectra product hero and once in
the company homepage's Spectra card. Arc Signal remains the navigation/footer
brand. Inter/Bodoni typography, the original black waveform app icon, and the
NordVPN partner treatment are unchanged. Never substitute a font or redraw the
supplied lettering. The homepage retains a semantic product heading; each logo
has one accessible image name, "Spectra by Arc Signal".

`assets/data/spectra-brand.json` records the approved source PNG hash, lossless
WebP hash, decoded-pixel hash, dimensions, and view crop. Every decoded pixel is
preserved. Inline SVG crops only whitespace; an external SVG wrapper loaded as
an img may block its external raster dependency and must not be substituted.
Multiply blending integrates the white matte into the light-only site. The
branded hero stays static so an opacity animation cannot isolate that blend and
flash a white rectangle. No JavaScript is needed to render the logo.
Both branded pages version their stylesheet and optional motion-script URLs with
the current content hashes. A visitor with the older resources cached therefore
receives the sizing/blending rules needed by the new wordmark. Tests reject stale
revision strings; update these two URLs when changing the corresponding resources.

The hero width is 14–18rem; the product-card logo is 14rem, constrained by available
space. This balances brand visibility and byline legibility without competing
with the headline or download action. These limited placements follow
[Apple branding](https://developer.apple.com/design/human-interface-guidelines/branding)
and [NN/g consistency](https://www.nngroup.com/articles/consistency-and-standards/),
not a claim of measured engagement improvement.

Reproduce using `cwebp` and ImageMagick:

```sh
node scripts/import-spectra-wordmark.mjs /path/to/Spectra/repository
```

The importer checks the approved source and decoded-pixel equality, validates
both HTML placements, then updates content-hashed URLs. Normal site tests check
committed hashes and placement without image tooling. The 3.1 MB content budget
has separate allowances of 415,000 bytes for this
lossless logo (currently 411,678 bytes) and 50,000 bytes for the owner-supplied
`assets/images/spectra-icon-inverted.png` (48,187 bytes, retained unchanged).
Images/fonts remain self-hosted.

## App screenshots

October 8, build 1A1062 scoped website review: Export All Sessions and Spectra
ZIP collection import affect Sessions, Session Storage and their sharing/import
sheets. None appears in this website's four iPhone gallery images or its two
Watch images. Direct visual and source review confirms those six pictured
workflows remain representative. Keep actual iPhone 1060 and Watch 1028 capture
provenance and native pixels; `docs/screenshot-content-review.json` records the
review against Guide 1062 without claiming a recapture. Updated product, privacy
and Guide text explains the new explicit sharing and atomic-import contract.
The App Store Sessions panel is affected by the Import Sessions label and needs
a genuine refresh in the app repository; its capture and review evidence is
separate from this narrow website applicability decision. Runtime, physical
hardware, hands-on accessibility and signed delivery remain separate gates.

Historical October 7, build 1A1057: the upper Sessions Storage area opens the existing
Session Storage details without changing tabs; Import Session is a separate
lower action. The canonical Guide and matching support article explain both
the Sessions and Settings routes. Gallery workflows do not depict Sessions,
so genuine 1051 iPhone and 1028 Watch image provenance is preserved. The affected
App Store Sessions frame is refreshed in the app repository using actual native
captures. Storage limits, formats, collection, recognition and Watch UI do not
change. Physical hardware and hands-on accessibility remain owner acceptance.

Historical October 7, build 1A1056: expanded Scan breakdown adds full Session ID and
recheck-only Original capture ID. Copy ID deliberately copies only a saved
reference on this iPhone for ten minutes; it does not authenticate evidence or
send data. Guide/support explain those controls. Existing gallery and App Store
frames do not depict this expanded area, so their actual 1051 iPhone / 1028 Watch
and 1054 App Store producers stay unchanged. No Watch UI, storage, detection or
format change. Hardware and hands-on VoiceOver remain separate acceptance gates.

October 6, build 1A1055: saved-session details group original date/time, duration,
recorded collector and measurements with filter-independent retained radio
identity/type-undetermined counts. Empty notes use Add notes; authored notes and
coverage warnings remain. The canonical Sessions Guide and support mirror add
the original-capture explanation. Website metadata advances to 1055; no gallery
frame depicts this saved overview, so actual 1051 iPhone and 1028 Watch producer
identities and pixels remain unchanged. Existing App Store panels likewise retain
their actual 1054 capture set; genuine new detail QA is separate. No acquisition,
engine, catalog, storage, Watch or format changes. Hardware and hands-on VoiceOver
remain separate acceptance gates; this is not a public App Store submission.

Historical October 6, build 1A1054: collector and measurement scope precede the smaller
estimated-size caption in Sessions, with one consistent readable adaptive gray
for supporting text. The canonical Sessions Guide and published Zendesk article
describe Estimated size without position-specific wording. Guide metadata
advances to 1054; the other twelve article bodies are unchanged. Website images
do not depict Sessions and retain actual 1051 iPhone and 1028 Watch producers.
The scoped image/content review is pinned to Guide 1054, not a relabeled capture
identity. Affected App Store Sessions and QA frames receive genuine refresh;
all eight capture journeys, integrity/OCR checks and direct root/design review
pass as recorded in the app's 1054 release record. Limits, formats, Watch
behavior, Experimental labeling and OS requirements are unchanged.

Historical October 6, build 1A1053: the Sessions utility card uses the concise Storage
heading, the existing subtle Scan-card outline and a native divider above
Import Session. Website Guide metadata advances to 1053; all thirteen article
bodies and the published Sessions support prose remain accurate and unchanged.
Settings' Session storage destination is not renamed. Website gallery states
do not depict Sessions and retain their actual 1051 producer; pictured Watch
states retain actual 1028 provenance. The scoped review is pinned to Guide 1053,
without relabeling image identities. Affected App Store captures and QA require
separate genuine refresh and verification in the app's 1053 release record.

Historical October 6, build 1A1052: the canonical Guide and published Sessions support
article explain the refined Session storage card and smaller Estimated size
line below each row's capture time. Binary sizes compare saved captures, not
exact deletion savings; unknown estimates are omitted. Shared history,
recovery/inbox/export copies remain separate. The four discovery/measurement
gallery states are unaffected and retain their genuine 1051 pixels and producer;
unchanged Watch idle/completion frames retain 1028 provenance. The scoped review
is pinned to Guide 1052 without relabeling capture identities. Fresh App Store
Sessions and QA imagery is verified separately in the app's 1052 release record.

The October 7 refresh uses the same verified native captures as Spectra’s
App Store set: Home, Smart Glasses results, magnetic Area Sweep, and the current
Monitor change dashboard. The approved app interface is not retouched. Fictional
Acme names and isolated simulator readings are disclosed in the gallery caption.
Light/dark appearance follows each original capture. App Store marketing frames
and traveler artwork remain in the app repository; website images are UI-only.
The iPhone capture identity is version 1.0.0 / 1A1060 / 1060, with its exact
source revision recorded in the provenance manifest, captured on iOS 27.0 with
Xcode 27.0 (27A266a). Home uses the owner's exact Circular wordmark,
and the bottom navigation now has Scan, Sessions, Guide, and Settings. Guide
contains searchable help; Settings owns global preferences, app-icon colors,
privacy/storage controls, About, support, and reset. The generated Guide and
privacy policy describe the current routes. Home includes Watches & Wearables, and the
Smart Glasses frame shows a naturally completed check with the full finding,
signal context, and Review details action. The current unified Results layout
and name search are visible; there are no retired device-category filters.
Result and magnetic-meter symbols use the same regular line weight as the
rest of the app, without decorative icon tiles. Status and confidence badges
remain. Reviewed hardware categories now select specific or conservative parent
symbols independently of capabilities, identity confidence and review priority;
the Smart Glasses image shows that possible-category qualifier. This does not
authenticate the advertised identity or prove recording. Names and types lead
compact supporting text with explicit leading alignment and a scoped readable
secondary gray. Supported hardware/capability icons remain blue; unknown types
use neutral symbols for retained observed sources. Confidence and the amber
similarity caution remain independent. The generated Guide and published Findings
support article explain that distinction. Plain signal wording and complete
qualified type labels preserve uncertainty; Observed pattern describes evidence,
not identity confidence, and signal counts are not physical-device totals. The
canonical Guide and published Troubleshooting and Experimental Watch articles
explain state-specific recovery without automatic generation or erasure.
All six iPhone App Store
frames and four separate light/dark large-system-text QA frames are freshly
captured from reviewed source `6fffeb965b6198129415f6130021ed19aaf3fcaf`.
Sessions now shows supported archive import, confirmed saved counts, remaining
slots and measured primary history usage within the independent 500-session
and 256 MiB primary-history limits; both large-system-text QA frames
assert those actual labels above the tabs. The canonical Guide and published
Sessions/Troubleshooting/Watch articles explain full Technical restoration,
checksum limitations and history management without automatic removal. The
Monitor image shows the main-panel **New Baseline** action, capture time,
elapsed comparison time and the latest-40-event counter limit. Fresh 1060
screenshots and light/dark QA pass the native capture pipeline. Root/peer direct
review covers six native frames, four QA images, six composites and the contact
sheet. Source/export hashes and six-frame OCR checks pass. All four website
derivatives preserve native pixels and receive direct visual review. Imported
copies still cannot retain private local Bluetooth references; this release
does not change those privacy boundaries.
The current Guide, privacy policy and published Findings, Troubleshooting and
Sessions articles explain source-reviewed network roles and optional protected
saved-session Bluetooth references. Follow-up always requires fresh readings;
weaker cached-name or payload suggestions require confirmation. These images do
not fabricate a newly identified product or a live reading from saved evidence.
The Guide and published Findings and Troubleshooting articles distinguish
combined readings, observation omissions, result limits and unknown historical
handling totals. Those totals are not missed-device counts or proof of CPU
pressure, and do not mean session storage is full.
The pictured Watch idle and Added-to-Sessions completion states retain separately
captured 1A1028 imagery. Unpictured loading recovery and queued-transfer copy have
changed since those captures; this is not a claim that every Watch screen is unchanged.
Its manifest records the actual Watch binary and native pixels independently.
The companion App Store set also shows the updated Sessions date disclosure,
count and inline check-type icons. Each row identifies its collector and recorded
measurement scope; rechecks distinguish original capture time from evaluation time.
This site's generated Guide explains that interaction;
the existing four-image gallery remains focused on discovery and measurements.

`assets/data/spectra-screenshots.json` records the exact app source commit,
verified built-bundle identity, capture SHA-256 hashes, output hashes, dimensions,
and decoded-pixel hashes. The app repository's `capture-build.json` records the
actual capture executable's Info.plist hash; version claims are not inferred from
the repository's current configuration.
After the app capture suite, manifest verification, and OCR audit pass, run:

```sh
node scripts/import-spectra-captures.mjs /path/to/Spectra/repository
```

Refresh tooling requires `cwebp` and ImageMagick. Lossless WebP preserves native
1320 × 2868 dimensions and every decoded pixel while reducing transfer size.
The importer uses maximum-effort lossless encoding (`-q 100 -m 6`), preserves the
ICC profile, and checks decoded pixels after conversion. Its extra work happens
only during asset preparation, not in a visitor's browser. The 3.1 MB content
budget excludes only the separately bounded brand images described above.
The importer also versions homepage/gallery image URLs and full-size links with
the output content hash, replacing prior versions idempotently. Updated HTML
therefore requests updated screenshots without relying on image cache expiry;
this does not purge HTML already held by a browser or CDN.
Normal site tests/builds need only Node and verify the committed asset hashes.
The retired PNGs are removed; their earlier versions remain recoverable in Git.

Two separate native Watch screens show starting a sweep and a saved completion
beside the Experimental Watch explanation. They describe the current TestFlight
companion, not promised public availability. Captures preserve the full native
screen, with no redrawn UI, crop, fake hardware frame, or overlaid claims. The
section makes active-screen operation, Bluetooth-only scope, paired-iPhone review,
and the optional watchOS 27 / iOS 27 requirements explicit. Example readings are
disclosed beside the images. Small screens stack the images vertically.

`assets/data/spectra-watch-screenshots.json` records separate Watch source and
pixel provenance, including its actual build identity. A Watch-only copy correction
can make the platform commits differ; neither manifest is relabeled to conceal it.
The native originals remain in `docs/release/watch-assets/en-US` in the app repo.
The release-specific content review records each platform's actual source commit
and build independently. Older unchanged Watch imagery is permitted only by an
explicit review that expires with the next Guide build; its identity is never
rewritten to match fresh iPhone captures.
Import using:

```sh
node scripts/import-spectra-watch-captures.mjs /path/to/Spectra/repository
```

This narrow placement follows [Apple's actual-screen marketing guidance](https://developer.apple.com/app-store/marketing/guidelines/)
and [NN/g's relevant-imagery guidance](https://www.nngroup.com/articles/7-tips-memorable-imagery/):
show a small number of useful screens next to the explanation they support, not a
second decorative hero or an implied background-scanning feature. The native
368 × 448 Watch originals also match an [Apple-supported screenshot size](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/).
Preparing them does not submit App Store metadata or declare physical-device acceptance.

Quick Check supports Bluetooth and optional local-network observations. Magnetic
measurement is shown in Area Sweep, which supersedes the old Room Sweep name.
The website also reflects the current Smart Glasses specialist and the removal
of Lens/Sound checks. The screenshot capture verified that Quick Check offers no
magnetic source and that Area Sweep can run a magnetic-only session.

Screenshot links open the complete image; below-the-fold captures load lazily.

The Seamless sequence and finished-image previews are unaltered simulator
captures from the app’s built-in fictional sample flow, exported September 6,
2026. They contain no customer images or private reproduction data. The Seamless
icon is copied from the app’s current asset catalog. Homepage screenshot cards
show cropped previews; full screenshots are available on the product pages.
The public bundle stays within its 3.1 MB content budget plus the bounded brand-image
allowances, with full app screens loaded lazily.
On October 4 the decimal-byte content cap increased from 3,000,000 to 3,100,000
bytes, a bounded 3.33% allowance for current Guide explanations and exact-pixel
captures, not an unbounded asset exemption. The reviewed bundle has 35 public
files and 3,000,174 content bytes before separately bounded brand images; the
manifest, private-file/symlink exclusions and lazy-loading behavior are unchanged.

The waveform icon comes from Spectra’s original app asset catalog. The header
reuses that waveform through an SVG luminance mask, displaying only the black
signal with transparent surroundings. Inter and Bodoni Moda Latin WOFF2 assets
were obtained from Google Fonts; no Google Fonts service is contacted by
visitors. Preserve the accompanying license files when redistributing these
assets.
