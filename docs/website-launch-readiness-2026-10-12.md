# Spectra website launch presentation

The owner requested release-day availability copy and official App Store badges
before the public listing URL is supplied. Homepage/product status, descriptions,
Open Graph metadata and download copy use present-tense availability language.
The owner explicitly includes the optional Experimental Watch companion at
launch; Bluetooth-only foreground collection, five local captures, iPhone review
and OS 27 requirements remain. Seamless is a separate unlisted product and keeps
its truthful coming-soon status. Spectra's apps and build 1075 are unchanged.

The three download controls currently show exactly **Releasing Fall 2026** on
explicit activation. They do not claim a successful download, navigate to a
guessed listing or contact Apple automatically. Launch-day copy is owner-directed
presentation, not verified live App Store availability. With JavaScript disabled,
the controls stay disabled and the same notice is visible.

`content/app-store.json` provides one future `appStoreURL`. After its identity and
live availability are verified, set the actual HTTPS Apple product link and run
`npm run downloads`. Generation converts all marked controls to native anchors
without requiring JavaScript. The renderer rejects foreign origins, credentials,
non-product paths, malformed configuration and missing/duplicate control markers.
No private configuration/source file is included in the public manifest.

The existing official black badge is retained byte-for-byte, SHA-256
`a26fc5b38380272c92e9019a2eb8b45542a66814b3e2b203772db8904b9fb99f`.
It appears once per marketing page, at 180px width with intrinsic proportions
and 16px clear space. It is not recolored, redrawn or animated. Product screenshots,
Circular wordmark, privacy limits and original capture producer identities remain
unchanged. See [Apple's badge guidance](https://developer.apple.com/app-store/marketing/guidelines/)
and [descriptive-link guidance](https://www.nngroup.com/articles/better-link-labels/).
The native action/notice uses clear labels and standard keyboard behavior,
consistent with [Apple's button guidance](https://developer.apple.com/design/human-interface-guidelines/buttons).

## Completed verification

- Full static build: **118/118 tests pass**, with no failures or skipped checks;
  the public-only export contains 47 approved files. Download, Guide and support
  freshness checks pass, and `git diff --check` is clean.
- Isolated Chromium review covers desktop (1440px), mobile (390px), light/dark
  browser preferences, and narrow (320px) doubled-text rendering. Badge artwork
  aligns with the pricing column while keeping 16px clear space on every side.
  The official source badge matches both the prior Git asset and Apple's current
  published badge byte-for-byte. Product and Watch screenshots remain unchanged.
- All three stub controls pass mouse and Enter activation: 30 tested actions show
  the exact notice, without navigation, automatic alerts, third-party requests or
  browser errors. The no-JavaScript notice remains visible and disabled controls
  cannot imply a working download. Isolated synthetic URL fixtures verify that
  all three future links work as native anchors without JavaScript; the fixture
  listing is never contacted or published.
- Distinct hardening re-review corrected a remaining future-tense price note,
  badge leading alignment and stale source instructions. Regression checks reject
  outdated release copy, unsafe configuration, unknown CLI arguments and missing
  or repeated rendering markers. Generated pages and local cache fingerprints are
  current. Private sources, configuration and diagnostics remain unpublished.

Remaining limits: these are Chromium and explicit doubled-font checks, not native
Safari text zoom, physical-device VoiceOver or App Store certification. The actual
listing URL, public availability and regional pricing still require verification
when the owner supplies the link. This website-only update does not change or
release an app binary. Source-control and public readback evidence is recorded
separately; source preparation alone does not prove delivery.
