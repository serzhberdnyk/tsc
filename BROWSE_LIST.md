# Browse all matching publications — local revision

The strip below the search is removed: no active-only checkbox, duplicate sort label, directions count or collection summary. Results follow the search directly. Default sorting remains newest first; deadline sorting remains available in the search control.

Every matching service direction is browsable regardless of source status or verification. Existing source status, actual deadline and verification warnings remain on each card. The regional candidate rule remains: explicit outside geography is excluded, unknown geography is not promoted to confirmed. The current 208-record export contains seven candidate matches across the 16 directions. The other 201 records are not forced into the result list.

The browser uses a snapshot cursor with the filter/country/sort fingerprint and last visible record ID, in pages of 20. “Показать ещё” keeps the filters and sort and adds the next page. Filter edits reset to the first page. IDs are deduplicated before pagination. At seven matches all seven are visible and the button is hidden. This is client pagination of the existing `/api/data` snapshot; it does not claim incremental backend/network pagination.

Verification: `test/storefront.test.js` checks the real 208/7 archive and a test-only 57-row pagination fixture (20 → 40 → 57, no duplicate IDs, unchanged filters/sort). No synthetic record appears in an export or preview. `scripts/prepare-ra-reference.mjs` builds the corrected reference from the actual saved export. `scripts/verify-browse-reference-browser.mjs` checks desktop/mobile, removed elements, 7 real matches, 16 directions, OR/AND filters, spacing and no JS errors.

Titles open the compact description-first detail view inside TSC; its source link remains available below the sections. Evidence is read from existing storage only. The user approved publication and one fresh temporary Git credential; no numbering migration is included.

## Backup limitation found before numbering migration

A fresh read-only production export was fetched on 2026-10-16 at 22:51:56 UTC. The isolated restore preserves 208 source records, 44 runs, 9 errors, 373 change payloads and supported metadata exactly. Numbering and its high-water mark also restore correctly on that isolated copy.

However, `/api/export` alone is not a complete D1 + R2 backup. It omits raw metadata inventory, original event row IDs and evidence object bytes. The legacy import regenerates authority and ignores collection/scheduler state. See workspace `exports/current-backup-restore.json` and `scripts/verify-current-backup-restore.mjs`.

A subsequent read-only evidence backup recovered all 365 objects transitively referenced by this export, restored their bytes identically and verified all 160 available source hashes. It is not a complete R2 bucket inventory. The additive numbering migration does not modify R2; its remaining preflight concerns consistent D1 state and the numbering ledger/sequence. This does not block a separate UI/budget release, which includes no database migration. No production database write was performed by either backup check.
