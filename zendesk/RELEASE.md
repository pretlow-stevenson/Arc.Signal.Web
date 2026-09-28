# Theme release record

## September 28, 2026 — initial custom theme

- Published theme: **Arc Signal Support**
- Theme ID: `0787d00e-7215-4478-a888-f4ef938969e7`
- Copenhagen baseline: **4.51.1**, upstream commit recorded in `UPSTREAM.md`.
- Custom revision: the Git commit introducing this release record (use
  `git log -- zendesk/RELEASE.md`); manifest version identifies upstream only.
- Rollback: **Copenhagen**, ID `6f5fad5d-01a8-4f45-9a4a-001e9921e28a`,
  preserved in the native theme library, not edited.

Zendesk's Themes page confirmed **Arc Signal Support — Live**. After leaving
preview mode, the public homepage rendered the new heading, native search, and
copyright. Community links remained absent. Searching for `magnetic` returned
six articles, led by the magnetic practice article. Desktop rendering showed no
horizontal overflow. Opening that result loaded the practice article correctly,
and the contact article retained its email, company, Guide, and privacy links.
The messaging launcher remained available. No messages or
support tickets were submitted, and routing/billing were not changed.

Deployment used a native copy of the existing theme, preserving its hosted
branding/settings, with three template edits. A full native ZIP export was
blocked by the browser's download policy. Local packaging uses approved artwork
and inspected settings; it is not a byte-for-byte backup of Zendesk's export.
The original native theme is the immediate rollback, not an untested ZIP import.

Regression checks cover the native search helper, heading semantics, footer
navigation, responsive CSS safeguards, unchanged generated JS/CSS, resolved
module assets, package allowlisting, and corporate publication exclusions.
The package contains 86 runtime/license files. The complete upstream source and
license remain in Git, but build tools and Git metadata stay out of the ZIP.

Final validation passed **7 theme tests and 53 website tests**, Guide freshness,
and the static build of **34 public files**, using a clean archive of the reviewed
Git revision. An unrelated untracked `assets/images/spectra-icon-inverted.png`
was left untouched and excluded from the commit. The working-copy publication
guard correctly rejects that unreviewed file; it was not weakened. Two Finder
metadata files were moved recoverably to `/private/tmp/arcsignal-assets-metadata-20260928`
and `/private/tmp/arcsignal-images-metadata-20260928`.

Before the final push, concurrent remote commit `a7c1c82` published that inverted
icon and explicitly added it to the public allowlist. Its image blob matched the
local file exactly. Both histories were merged without replacing either change;
the local duplicate was backed up before merging. Post-merge validation again
passed all **60 tests**, Guide freshness, and the now **35-file** public build.

Desktop checks used the signed-in administrator on public Help Center routes.
Narrow/mobile hardware, enlarged text, screen-reader behavior, and signed-out
visitor checks remain owner validation items; CSS/static checks are not a full
accessibility certification. Native request-form submission and mail delivery
are outside this presentation change. Recheck branding/settings before any
future local ZIP import. The custom theme now requires reviewed upstream merges,
not automatic Copenhagen feature updates.
