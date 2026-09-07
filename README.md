# Arc Signal

The company website for **Arc Signal LLC**, introducing **Spectra** for iPhone.
The site presents the product’s capabilities and limitations, its on-device
privacy approach, and its prelaunch App Store availability.

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
inactive download state. These checks do not replace visual or assistive-technology
testing in browsers.

## Publishing

The existing GitHub Pages configuration publishes the root of `main` at
**https://arcsignal.app/**. Keep `CNAME` in sync with the configured custom domain.
`_config.yml` excludes development-only files from the Pages build. Changes to
`main` can publish the website; review content and test before pushing.

The site uses a restrictive meta Content Security Policy and loads only its own
fonts, styles, and images. The hosting platform controls response headers and
routine request logging; this site does not claim to eliminate those logs.

## App Store launch

The availability control is deliberately disabled, not a fake download link.
At launch, replace the button beside the `RELEASE` comment in `index.html` with
an anchor to the verified Spectra listing. Update the adjacent availability copy
and prelaunch test, and use Apple-approved badge artwork only when appropriate.
No release date, price, rating, testimonial, or App Store approval is implied.

Review final app compatibility, customer-support contact, and the app’s complete
privacy policy before launch. The homepage’s privacy overview is not a substitute
for that policy or for App Store disclosures.

## App screenshots

The home and magnetic-meter images are actual simulator captures from the
Spectra application on September 7, 2026, using its UI regression tests.
They contain synthetic preview data, not personal observations or measured
device-detection results. The page labels that distinction visibly and retains
the simulator notice where shown. Screenshot controls open the unaltered image;
below-the-fold captures load lazily.

The waveform icon comes from Spectra’s original app asset catalog. Inter and
Bodoni Moda Latin WOFF2 assets were obtained from Google Fonts; no Google Fonts
service is contacted by visitors. Preserve the accompanying license files when
redistributing these assets.
