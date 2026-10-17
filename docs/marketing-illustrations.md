# Marketing illustrations

The October 17 artwork extends the approved independent-development workbench
style: near-black outlines, restrained blue accents, off-white object interiors,
and transparent backgrounds. The travel illustration sits below “New surroundings.
Thoughtful next steps.” on the homepage. The privacy illustration sits below the
privacy heading on both the homepage and Spectra page. These are decorative
editorial illustrations, not screenshots, safety verdicts, or promises of security.

| Asset | Dimensions | Encoded bytes | Placement |
| --- | --- | --- | --- |
| `assets/images/spectra-travel-illustration.webp` | 800 × 534 | 30,128 | Homepage everyday awareness |
| `assets/images/spectra-privacy-illustration.webp` | 800 × 534 | 34,122 | Homepage and Spectra privacy |

Both images are local, lazy-loaded, asynchronously decoded, and supplied with
intrinsic dimensions to reserve their space. Empty alternative text and
`aria-hidden="true"` identify decorative content. The shared illustration
styles constrain width to the available column; the existing motion controller
reveals each image once after loading and respects reduced motion. Without
JavaScript or IntersectionObserver, images remain visible. Product screenshots,
company and product marks, and payment/affiliate destinations retain their
existing behavior.

The built-in ImageGen tool produced the artwork using the approved workbench as
a style reference. Travel also used the supplied Spectra icon as a waveform
reference. The final PNGs were optimized with `cwebp -resize 800 0 -q 85 -m 6
-alpha_q 100`; alpha is retained. The two new assets total 64,250 bytes, within
the 0.1 MB addition to the site's previous content budget. Source PNGs and
browser-check screenshots remain outside the public bundle.

Verification: all 122 site tests and the 50-file public build passed. Local
Chrome renders were reviewed at desktop and mobile widths; checks at 1440, 820,
390, and 320px found no horizontal overflow or failed resources. Enlarged text,
reduced motion, and JavaScript-disabled rendering passed. A separate final diff
review verified the asset allowlist, bounded size, cache revisions, decorative
semantics, and unchanged navigation/payment destinations. Live deployment is a
separate verification step.

## Travel generation prompt

```text
Use case: ads-marketing.
Asset type: editorial illustration for the Arc Signal / Spectra website, accompanying the section “New surroundings. Thoughtful next steps.”
Primary request: Create one compact travel illustration consisting of a small carry-on suitcase with extended telescoping handle, one simple hotel keycard lying in the foreground, and a smartphone beside the suitcase showing the Spectra waveform.
Input images: Image 1 is a STYLE reference only: match its clean flat editorial perspective, consistent fine dark outlines, warm off-white object interiors, and selectively applied blue details. Do not copy its laptop/notebook objects or any glow/background. Image 2 is the exact Spectra waveform reference: reproduce that single waveform silhouette in near-black on the phone's warm off-white screen, without the black square background.
Composition/framing: Landscape 3:2, balanced compact grouping, three-quarter perspective consistent with image 1, objects fully visible and separated enough to read at a display width of 350 pixels. Generous negative space around the entire group. Suitcase slightly behind the phone and hotel keycard. The keycard can have a small plain blue strip to identify it as a keycard, with no words.
Style/medium: Sophisticated sparse editorial line illustration, crisp vector-like edges, simple planar shapes, no photographic rendering.
Color palette: Near-black #161a21 outlines, warm off-white #f7f7f5 object interiors, restrained #075bb5 blue accent only on small suitcase/keycard details. Smartphone waveform near-black.
Background: Actual alpha transparency everywhere outside the objects, including the space between them. Objects retain their opaque warm off-white interiors. No background plane, vignette, glow, cast shadow, gradient, or ambient blur.
Constraints: No words, labels, hotel brands, airplanes, location pins, padlocks, shields, safety checkmarks, people, extra objects, decorative confetti, or app-interface screenshot. No implied guarantee of safety. Exactly the three requested objects.
```

Final travel edit prompt:

```text
Use case: background-extraction.
Edit target: the provided travel editorial illustration.
Keep the artwork itself unchanged: the suitcase with telescoping handle, the phone with Spectra waveform, and the keycard, their positions, shapes, precise linework, colors, perspective and warm off-white opaque interiors must all remain the same.
Change only the surrounding background: completely remove the visible soft gray-white-blue halo / glow around and between these three objects. The background must be truly empty alpha 0 transparency right up to every object edge, not a black/white background or fading glow. Remove all cast shadows and haze below and behind the objects. Preserve smooth antialiased edges only at the actual object contours. Keep the blue handle, zipper, wheels and stripe opaque and crisp. Also make the open gap between the suitcase telescoping handle bars transparent. No new objects, no text, no additional decoration.
```

## Privacy generation prompt

```text
Use case: illustration-story.
Asset type: polished editorial website spot illustration for Arc Signal's privacy section.
Input image: the attached workbench image is a STYLE REFERENCE ONLY. Match its clean dark outlined devices and warm off-white object fills, but remove all glow, atmosphere, shadows, and background effects. Do not copy its workbench objects.
Primary request: draw ONE smartphone in a gentle three-quarter view, with three simple small observation cards clearly CONTAINED WITHIN its screen. A thin softly rounded blue outline INSIDE the screen surrounds all three cards. Cards carry short abstract line strokes and one tiny waveform; no readable text. The visual communicates observations staying on your device under your control.
Style: quiet refined editorial pen drawing, crisp near-black #161a21 outlines, warm off-white flat object fills, restrained blue #075bb5 accent only for the interior boundary and small detail. Consistent clear linework readable at 320 to 360 pixels wide, subtle friendly hand-drawn character, no textured effects.
Composition: horizontal 3:2 canvas; phone is primary and only object, slightly tilted perspective, enough transparent breathing room around the entire phone. Make the phone large enough to make interior cards legible, with generous calm margins.
Background: genuinely transparent alpha background, no colored backdrop, no panel, no vignette, no ground plane.
Avoid: data floating outside or leaving the phone, clouds, arrows, sparkles, padlocks, shields, checkmarks, people, hands, words, letters, numbers, real app UI, photorealism, 3D rendering, shadows, glow, gradient haze, ground lines, extra devices, desk accessories or any extraneous objects. Do not suggest a guarantee of security.
```
