# Correction prepared after version 9

Version 9 was published from `e93eccd918905627aa023f9b32d0605d37f7ae14`. Its backend detail endpoint and source-budget fix are present, but the main list still renders the legacy paragraph. The hosted React page loads only `/tenders.js`; that release omitted the detail/deadline definitions from this script. The local standalone preview had loaded the separate scripts, so it did not detect the hosted integration gap. This is recorded as an incomplete UI result, not a successful global correction.

`fix/global-structured-cards` corrects both issues:

- The actual hosted script contains deadline → detail → app in deterministic order.
- Every list card uses the same structured renderer, with prominent deadline, source-paragraph description first, compact actual positions and labelled terms below.
- The presenter preserves source paragraph boundaries and uses safe paragraph boundaries for the normalized fallback. It does not infer positions or quantities from prose.
- Detail data is lazily read from the existing authenticated read-only endpoint. No new source crawl or database/storage migration is involved.

Real verified fixtures: SUNLIGHT `bidzaar:386-520` has 1 actual position × 2 units and eight description paragraphs; GAZ `bidzaar:385-201` has 9 actual positions and four description paragraphs; Alean `bidzaar:384-073` has 6 actual positions and eight description paragraphs. Long GAZ names already truncated upstream are not reconstructed from guesses.

Critical checks only: targeted parser/API/deadline/search/pagination tests, TypeScript/build, actual-bundle ordering, and 30 desktop/mobile checks on the three real fixtures. Source records remain unchanged. No repeated full audit or large file scan was run for this visual correction.

Version 9 server verification succeeded independently: all 208 IDs preserved, eight service-direction matches, four active in scope; Bidzaar checked two details and NVM six without a time-budget error. Procedure 375-894 is now detail-verified and in scope. Source coverage remains partial.

This correction is local and unpublished. The sole Git credential used for version 9 was cleared after publishing and is unavailable; its expiration was 2026-10-16T23:21:41.823Z. No replacement credential was created. Audience, authentication, hourly automation and database numbering remain unchanged.
