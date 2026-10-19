# Apple Watch preview artwork

The Spectra page uses Apple's front-facing Apple Watch Series 11, 46mm,
Aluminum Jet Black with Black Sport Band bezel. Both previews share one local
asset. The genuine app screenshots remain separate, unchanged files with their
original SE 3 capture identity in `assets/data/spectra-watch-screenshots.json`.

- Source: [Apple Design Resources](https://developer.apple.com/design/resources/#product-bezels)
- Package: [Apple Watch Series 11 (2025)](https://devimages-cdn.apple.com/design/resources/download/Bezel-Apple-Watch-Series-11-2025.dmg)
- Source file: `PNG/Sport Band/Apple Watch S11 - 46mm - Aluminum Jet Black + Sport Band Black.png`
- Source SHA-256: `e8f067259335f9150fed1633e65929957bfb94e1ac9404392aceade3dcc6244c`
- Website asset: `assets/images/spectra-watch-frame.webp`
- Asset SHA-256: `fb69ffa1c892e7932854778ace66831fa23df95366d9fa262da1f0caa61e637a`
- Dimensions: 560 × 880 pixels; 119,308 bytes.

Converted with `cwebp -lossless -exact -m 6`; no resizing, recoloring, cropping,
or added effects. Decoded RGBA pixels were compared with the supplied PNG.
The screen opening is 416 × 496 pixels, positioned at (72, 192). CSS uses the
corresponding percentages and `object-fit: contain` to preserve the original
368 × 448 screenshot proportions, with black filling the narrow side margins.
The bezel sits above the screenshot so its own rounded opening defines the
screen edge. The original image is available from a separate text link.

The artwork is subject to the Apple Design Resources License supplied in the
download and Apple's [Marketing Resources and Identity Guidelines](https://developer.apple.com/app-store/marketing/guidelines/).
It is not Arc Signal artwork. Keep it static and unobstructed, with no added
shadows or reflections, and retain the existing Apple trademark attribution.
