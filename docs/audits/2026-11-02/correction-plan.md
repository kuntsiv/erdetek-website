# Correction plan

## Corrections

1. Correct the navigation test oracle to match the renderer: six anchors, five visible NAV links, the duplicate contact pill hidden, and a separate visible contact call to action. Do not expect seven visible NAV links. Re-run the seven affected checks against the corrected oracle.
2. Keep the recorded 48 of 55 raw result visible and marked FAIL until the corrected oracle run is recorded. Do not relabel the result as 55 of 55.

## Next workstreams

Four workstreams follow this packet:

1. UX — verify the 44px mobile controls, the solid/opaque candidate header, the 18px mobile article intro, and the `ES` data label across the seven locales.
2. SEO — verify `robots.txt` includes the sitemap directive, that `sitemap.xml` contains only `https://erdetek.eu/`, and that hash article routes are not presented as HTTP paths or hreflang entries.
3. Content — verify the 35 published article bodies and identifiers are preserved, and that the unsourced market array remains removed.
4. Legal — review claims and asset references for accuracy. This packet makes no legal conclusions and makes no claims about the company's actual assets.

## Source references

- [../../../src/app.js](../../../src/app.js)
- [../../../src/open.css](../../../src/open.css)
- [../../../content/site.json](../../../content/site.json)
- [../../../robots.txt](../../../robots.txt)
- [../../../sitemap.xml](../../../sitemap.xml)
- [../../../assets/index-fCPbR_uZ.css](../../../assets/index-fCPbR_uZ.css)

## Related documents

- [validation.md](validation.md)
- [README.md](README.md)
