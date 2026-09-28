# Arc Signal Zendesk theme

Maintained separately from the corporate website's deployable files. Both the
site's explicit build allowlist and GitHub Pages `_config.yml` exclude `zendesk/`
and support documentation. Publishing this repository does not publish Zendesk.

`theme/` is a Git subtree of Copenhagen 4.51.1 with a small Arc Signal patch.
See `UPSTREAM.md` for merge instructions, `CUSTOMIZATIONS.md` for intent and
`RELEASE.md` for the actual deployment status.

## Validate and package

From the website repository root:

```sh
node --test zendesk/tests/*.test.mjs
node zendesk/scripts/package.mjs
```

Packaging creates a new ZIP in an isolated temporary directory and prints the
path. It includes only Zendesk runtime templates, manifest, translations,
settings, assets, stylesheet, script, thumbnail and upstream license; not build
tools, Git data, credentials or internal documentation.
No upstream npm installation is needed for this template-only patch.

Import the ZIP through Knowledge admin → Customize design → Add theme → Import
theme. Inspect it as a non-live theme before using **Set as live theme**. Importing
does not prove publication. Do not overwrite the original Copenhagen theme.

## Deployment and rollback

For the initial deployment, a native copy of the live theme preserves its exact
uploaded branding and preferences; only three templates are edited. Repository
defaults use the approved local artwork and UI-verified color/visibility values.
Zendesk's full ZIP export was blocked by the browser, so this is not represented
as a byte-for-byte export of the hosted theme. Compare images/settings before a
future package import, or reconcile them from an owner-downloaded native export.

Check desktop and narrow screens, enlarged text/zoom, keyboard focus, search
results, article links, request-form rendering, footer wrapping and chat launcher.
Do not create test support tickets unless separately authorized. Theme preview
does not establish email delivery, routing or real device accessibility.

Rollback: set the preserved **Copenhagen** theme live again in the Themes list.
This restores presentation without deleting articles, tickets or the custom
theme. Future updates should retain the prior custom release in the library.
