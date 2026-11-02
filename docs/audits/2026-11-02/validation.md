# Validation

## Recorded UI result

The original real UI run recorded 48 of 55 checks passing and an empty fatal list. This is the recorded raw result, it remains FAIL, and it is not restated as 55 of 55.

Seven checks were incorrect. The test oracle expected at least six visible NAV links, not seven, while it observed five visible NAV links. The renderer has six anchors, with the duplicate contact pill hidden and a separate contact call to action visible. This is a known test-oracle defect, not a product defect.

The other 48 real checks cover seven locales, mobile controls at 44px, the language control at 7 by 44px, the `ES` data label, Escape and overflow behavior, desktop 1366px navigation and toggle behavior, and article intro text at 18px.

## Previously recorded checks

Node syntax, XML, and source 35-body checks were previously recorded. New packaging checks run independently after this packet is returned. No current packaging-check result is claimed in this document.

## Raw evidence

Raw records are held in the following evidence files, added by the deterministic integrator:

- [evidence/native-result.json](evidence/native-result.json) — original UI check records and navigation wrapper
- [evidence/preview-review.json](evidence/preview-review.json) — scoped reviewer extraction
- [manifest.json](manifest.json) — hashes of changed files, excluding manifest itself

## Review boundary

The independent Mistral review approved a scoped candidate preview only. It is not a release, product, or full regression approval. See [summary.md](summary.md) and [README.md](README.md).
