# TSC visual preparation — local only

Branch `visual/tsc-roman-brand`, based directly on live v5 `31ad1a3`.
No auth/public-architecture branch is merged. Publication is not authorized by
this preparation; get a separate immediate release confirmation before publishing.

The header uses the exact Roman TSC globe paths from Library package
`libfile_a7194648d64081918d09c4cdc081b1f9`, with Tender Search Company displayed
alongside it. Ink and paper SVGs switch with the existing theme. Company-name and
favicon metadata are updated; the favicon uses the supplied Roman T only.
SVG files and supplied favicon bytes are preserved, without external font loading.

Existing country tabs, search, filters, themes and raised buttons remain intact.
Local canonical files outside this Git checkout are `web/index.html`, `web/app.css`,
`web/brand/*`, `web/favicon.*`, `web/apple-touch-icon.png`, `scripts/prepare-cloud.mjs`,
`src/server.js`, `src/export.js`, and the brand text assertion in `test/core.test.js`.
The local server whitelists the brand assets with correct MIME; standalone exports
embed the logo and icons so they work offline. No collection logic was changed.

Verification:
- 77 existing tests passed; only the old brand assertion was updated.
- Production build and TypeScript passed.
- 39 local Edge checks passed, no JS errors. Actual retained 204 records were used
  for behavior checks; screenshots contain only explicitly fictional examples.
- Desktop light/dark, mobile light/dark and Thailand screenshots are under
  `previews/tsc-brand/`; mobile viewport is 390px with no horizontal overflow.
- `exports/tsc-brand-asset-verification.json` confirms SVG contour byte identity,
  favicon/brand asset serving and self-contained offline export.
- Secret scan: `exports/tsc-brand-secret-scan.json`, no findings.

No source token was minted; no source push, publication, audience change,
schedule change, live collection or database migration was performed.
