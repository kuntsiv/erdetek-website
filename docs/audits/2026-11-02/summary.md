# Summary

## Candidate scope

The candidate preserves 35 published article bodies and their identifiers across seven locales, with no rollout claimed. It adds a mobile MENU control, a contact control, and a language control at 44px minimum touch size. The candidate header is solid/opaque, and the mobile article intro is 18px. The Spanish data label is corrected from `SP` to `ES`. An unsourced market array is removed.

The candidate adds a real `robots.txt` that includes a sitemap directive, and a `sitemap.xml` that contains only the homepage `https://erdetek.eu/`. Article routes remain hash URLs. No 35 HTTP article paths and no hreflang entries are claimed or invented. The root `index.html` remains the same as the tested published baseline. The existing base asset `assets/index-fCPbR_uZ.css` is retained with its exact observed bytes because styled checkout depends on it.

## Review boundaries

An independent Mistral review approved a scoped candidate preview only. That approval is not a release approval, not a product approval, and not a full regression. The original real UI run recorded 48 of 55 checks passing with an empty fatal list, and that raw result remains FAIL. Seven of the 55 checks were incorrect because the test oracle expected at least six visible NAV links, not seven, while it observed five visible NAV links. The renderer has six anchors, with the duplicate contact pill hidden and a separate contact call to action visible. The result is therefore not relabeled as 55 of 55.

The remaining 48 real checks cover seven locales, mobile controls at 44px, the language control at 7 by 44px, the `ES` label, Escape and overflow behavior, desktop 1366px navigation and toggle behavior, and article intro text at 18px. Node syntax, XML, and source 35-body checks were previously recorded. New packaging checks run independently after this packet is returned, so no current packaging-check result is claimed here.

## Navigation

See [validation.md](validation.md) for recorded results, [correction-plan.md](correction-plan.md) for next steps, and [README.md](README.md) for the full index.
