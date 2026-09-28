# Arc Signal theme customizations

Approved September 28, 2026: real hero text and a footer copyright, accepting
manual maintenance of the customized theme. Keep the standard Copenhagen copy
available in Zendesk for rollback and upstream comparison.

## Intentionally small patch

- `theme/templates/home_page.hbs`: visible semantic H1, **How can we help?**,
  replaces the hidden Help Center name heading. Search retains its real native
  helper, accessible label and instant-search setting. A positioned wrapper
  keeps its icon aligned with the field rather than with the new title.
- `theme/templates/footer.hbs`: retains the home link and language selector;
  adds **© 2026 Arc Signal LLC. All rights reserved.** as ordinary text.
- `theme/templates/document_head.hbs`: one scoped CSS block. Fluid heading,
  expandable hero, wrapping legal text and forced-colors heading treatment.
  Native module imports and scripts remain unchanged. No JavaScript, font,
  external request, tracker, animation or dependency is added by this patch.
- `theme/manifest.json`: native branding/visibility defaults captured from the
  saved custom draft, plus custom name/attribution. Native system fonts retained.
- `theme/settings`: approved signal artwork for logo/favicon and revision-2
  hero. No replacement logo or recreated wordmark.

Keep generated `style.css`, `script.js` and module bundles unchanged for this
patch; inline CSS belongs to the editable document-head template and survives
the upstream import-map generator. Do not append custom rules to generated CSS.

## Design rationale

A brief heading groups the search interaction and gives the hero a clear purpose.
Live text is accessible and reflows; text baked into a background cannot reliably
survive mobile cropping or larger text. The hero keeps a 300px minimum, not a
fixed height, so enlarged text can grow it. Only the new legal text stacks below
the brand on small screens. Existing colors, navigation and support flows stay.

References reviewed:

- https://developer.apple.com/design/human-interface-guidelines/typography
- https://www.nngroup.com/articles/visual-hierarchy-ux-definition/
- https://support.zendesk.com/hc/en-us/articles/4408839332250-Customizing-your-help-center-theme

## Content and maintenance boundaries

- New copy is English for the current en-us Help Center. Add proper localized
  content before enabling additional languages; do not invent `{{t}}` keys.
- Copyright is static and works without JavaScript. Review its year annually.
- The theme is light; OS dark mode does not create a separate dark layout.
- Community availability, articles, audience, messaging, privacy and billing
  are Zendesk account/content settings, not controlled by this theme package.
- The preview may show synthetic Community content even when it is disabled
  on the public Help Center. Verify the actual public route after publishing.
