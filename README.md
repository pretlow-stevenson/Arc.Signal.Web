# Arc Signal

The company website for **Arc Signal LLC**, presenting security products and
practical utilities through a company homepage and dedicated product pages:

- `index.html`: company introduction, product discovery, and privacy approach.
- `spectra.html`: Spectra, preparing for release; **iPhone 16 or later · iOS 27 or later**.
- `seamless.html`: Seamless screenshot stitching, coming soon for **Apple iPhone · iOS 18 or later**.
- `guide.html`: the complete Spectra Guide and support contact, generated from native app content.
- `spectra-privacy.html`: the public Spectra privacy policy, also linked in the app before setup and from Guide.
- `404.html`: recovery links that work even when the requested URL is nested.

Shared navigation connects every page. Each marketing page has its own title,
description, canonical URL, and sitemap entry. Add future product pages to
`scripts/site-files.mjs`, the navigation, sitemap, and validation together.

## Development

The site is static HTML and CSS with no client JavaScript, runtime dependencies,
forms, analytics, or third-party resource requests. Inter and Bodoni Moda are
self-hosted; their SIL Open Font Licenses are included with the fonts.

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

The app's `GuideArticle.swift` and `GuideReleaseArticles.swift` are canonical.
The neighboring Spectra checkout's `scripts/ExportGuide.swift` exports them to
`assets/data/spectra-guide.json`; `npm run guide` then produces `guide.html`.
Both generated files are committed so GitHub Pages needs no Swift or JavaScript
runtime. `npm test` checks exact HTML parity, twelve stable topic routes, the
release lock (1.0.0 / 1A1000, numeric bundle build 1000), support address,
compatibility, and the public policy link.

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
Email support opens the user's mail client with no scan data or attachments.

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
The footer credits Apple, the Apple logo, iPhone, and App Store, and includes the
IOS credit from [Apple’s trademark list](https://www.apple.com/legal/intellectual-property/trademark/appletmlist.html).

Keep compatibility, customer-support details, and privacy disclosures aligned
with the app. The complete policy is https://arcsignal.app/spectra-privacy.html.
The owner should review its support-retention and provider statements before
submission. App Store Connect privacy labels remain a separate declaration.
iOS 27 is enforced in the app; iPhone 16+ is the supported hardware range, not a
nonexistent exact-model App Store capability filter. Older compatible phones
are not blocked by a fabricated hardware requirement.

## Seamless release status

The Seamless page reflects the neighboring app repository’s verified workflow:
2–20 ordered, overlapping screenshots, local processing, inspection of uncertain
joins, and PNG export at the original pixel width. Its app target requires iOS 18
or later; it does not inherit Spectra’s compatibility requirements.

The source repository has not configured App Store distribution, so Seamless is
presented as coming soon, without a download badge or invented release date.
Update the homepage status, product copy, metadata, and release-status check when
availability and a listing URL are confirmed. Privacy copy distinguishes local
stitching from iCloud retrieval and destination services chosen by the user.

## App screenshots

The September 12 refresh uses the same verified native captures as Spectra’s
App Store set: Home, Smart Glasses results, magnetic Area Sweep, and the current
Monitor change dashboard. The approved app interface is not retouched. Fictional
Acme names and isolated simulator readings are disclosed in the gallery caption.
Light/dark appearance follows each original capture. App Store marketing frames
and traveler artwork remain in the app repository; website images are UI-only.

`assets/data/spectra-screenshots.json` records the exact app source commit,
capture SHA-256 hashes, output hashes, dimensions, and decoded-pixel hashes.
After the app capture suite, manifest verification, and OCR audit pass, run:

```sh
node scripts/import-spectra-captures.mjs /path/to/Spectra/repository
```

Refresh tooling requires `cwebp` and ImageMagick. Lossless WebP preserves native
1320 × 2868 dimensions and every decoded pixel while reducing transfer size.
Normal site tests/builds need only Node and verify the committed asset hashes.
The retired PNGs are removed; their earlier versions remain recoverable in Git.

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
The combined public bundle stays under 3 MB, with full app screens loaded lazily.

The waveform icon comes from Spectra’s original app asset catalog. The header
reuses that waveform through an SVG luminance mask, displaying only the black
signal with transparent surroundings. Inter and Bodoni Moda Latin WOFF2 assets
were obtained from Google Fonts; no Google Fonts service is contacted by
visitors. Preserve the accompanying license files when redistributing these
assets.
