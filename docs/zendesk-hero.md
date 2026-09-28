# Zendesk help-center hero

Upload `docs/support-assets/arcsignal-zendesk-hero.jpg` in Zendesk Knowledge admin → Customize design → Customize → Images → Hero home image. The owner uploaded and published this asset on September 27, 2026; its live desktop placement was verified. Preview desktop and mobile before future replacements. Both image files are maintained in the website repository but excluded from the corporate website's public bundle: Zendesk hosts its own uploaded copy.

## Deliverables

- Upload: `docs/support-assets/arcsignal-zendesk-hero.jpg`, 1600 × 300, sRGB JPEG, approximately 105 KiB. Metadata stripped; high-quality 4:4:4 color sampling.
- Source: `docs/support-assets/arcsignal-zendesk-hero-source.png`, original generated artwork, 2048 × 768. Preserved for future crops, excluded from the public website build.
- Delivery crop: resize source to 1600 pixels wide, center-crop to 300 pixels tall. No stretching or retouching.

## Design and verification

Deep navy with restrained blue signal waves supports the existing Arc Signal identity without inventing a new logo. The dark center leaves room for Zendesk's real search control. There is no embedded copy, fake interface, product claim, or generated brand mark. Keep this decorative background out of the accessibility reading order; retain accessible labels on the real search control.

The final exported crop was visually inspected for clarity, detail, and clear central space. Dimensions, format, and file size were verified. Actual Zendesk responsive preview remains a publishing check; narrow centered crops intentionally show a quieter portion of the background.

Zendesk recommends 1600 × 300 for the Copenhagen home hero:
https://support.zendesk.com/hc/en-us/articles/4408824139546-Branding-your-help-center

## Provenance

Created September 27, 2026 using the built-in image-generation tool, not the API/CLI fallback. No reference image or owner-supplied logo was modified. Deterministic crop, resize, JPEG encoding, and metadata removal used ImageMagick.

Generation prompt:

> Use case: ads-marketing. Asset: final production hero background for Arc Signal LLC's Zendesk customer support site, a professional privacy and nearby-signal investigation company. Create ONE finished raster image, ultra-wide horizontal 3200 by 600 pixels (16:3 banner), not a mockup. Sophisticated quiet signal-field artwork: deep ink navy almost black (#081423), beautifully controlled cobalt and blue light (#075bb5), a few precisely curved luminous filaments and soft layered waves suggest radio signals resolving into clarity. Artistic premium optical light sculpture, subtle dimensional depth, smooth refined gradients, crisp understated detail, restrained bloom. Asymmetrical balanced composition: softly sculpted blue wave contours entering from far left and far right, subdued across the middle. Keep the central 50 percent horizontally and central 65 percent vertically dark, clean and low-contrast for an actual HTML search box that will be placed later. Artwork should still feel intentional when cropped to its center on mobile. Minimal and confident, trustworthy high-end security-tool aesthetic, inviting rather than ominous. Edge-to-edge background. NO text, letters, words, numbers, logo, icon, shield, lock, checkmark, device mockup, people, circuitry, matrix code, radar target, rainbow, purple, floating particles, starfield, lens flare, watermarks or UI. This is supporting brand artwork, not a new logo. Render a release-quality exceptionally polished single banner.

The generator returned 2048 × 768 rather than the requested aspect ratio; the upload file was therefore explicitly center-cropped to the correct Zendesk dimensions.
