# Arc Signal

The company website for **Arc Signal LLC**, featuring **Spectra** for Apple iPhone.
The site presents the product’s capabilities and limitations, its on-device
privacy approach, and its App Store availability. Compatibility is listed as
**Apple iPhone 16/17 · iOS 27**.

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

The existing GitHub Pages configuration publishes the root of `main` at
**https://arcsignal.app/**. Keep `CNAME` in sync with the configured custom domain.
`_config.yml` excludes development-only files from the Pages build. Changes to
`main` can publish the website; review content and test before pushing.

The site uses a restrictive meta Content Security Policy and loads only its own
fonts, styles, and images. The hosting platform controls response headers and
routine request logging; this site does not claim to eliminate those logs.

## App Store download

The site presents Spectra as available on the App Store. The badge anchor
`app-store-download` in `index.html` currently uses the requested literal
`http://` placeholder. It is not a working App Store destination. Replace that
value with the verified Spectra listing URL and update the download-link
validation in `tests/site.test.mjs` when the final URL is supplied.

The official black [Download on the App Store badge](https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg)
is stored locally and used without altering the artwork. Preserve its proportions
and surrounding clear space, following [Apple’s marketing guidelines](https://developer.apple.com/app-store/marketing/guidelines/).
The footer credits Apple, the Apple logo, iPhone, and App Store, and includes the
IOS credit from [Apple’s trademark list](https://www.apple.com/legal/intellectual-property/trademark/appletmlist.html).

Keep compatibility, customer-support details, and privacy disclosures aligned
with the app. The homepage’s privacy overview is not a substitute for the app’s
complete privacy policy or App Store disclosures.

## App screenshots

The home and magnetic-meter images are actual simulator captures from the
Spectra application on September 7, 2026, using its UI regression tests.
They contain synthetic preview data, not personal observations or measured
device-detection results. The page labels that distinction visibly and retains
the simulator notice where shown. Screenshot controls open the unaltered image;
below-the-fold captures load lazily.

The waveform icon comes from Spectra’s original app asset catalog. The header
reuses that waveform through an SVG luminance mask, displaying only the black
signal with transparent surroundings. Inter and Bodoni Moda Latin WOFF2 assets
were obtained from Google Fonts; no Google Fonts service is contacted by
visitors. Preserve the accompanying license files when redistributing these
assets.
