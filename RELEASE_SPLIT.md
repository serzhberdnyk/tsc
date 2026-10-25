# Local release split

`release/ui-browse-budget` is prepared directly from published version 8 (`bf2670fd45c6201559dca252db7a28db889ddea2`). It contains the browse UI, reviewed compact detail view and the already tested source time-budget fix. It excludes the numbering backend, numbering SQL and metadata enable flag. The earlier `42da5ce` draft omitted runtime detail integration; the final release includes it to match the screenshots the user approved.

Runtime scope: remove the strip below search, show all service-direction candidates, keep newest sorting and the deadline option, preserve source statuses/warnings, provide 20-item client snapshot pagination and show the source as Bidzaar. Source collection uses two fixed plus two rotating searches and reserves time for details; existing access stops and retry rules remain enforced. The branch does not change source coverage claims, access policy, authentication, schedules or existing database schema.

Deployment of this branch runs no migration and uploads no evidence object. Subsequent ordinary authorized collection runs continue to create observations and evidence as before. The missing complete R2 inventory does not block this standalone release. Publishing still awaits the requested approval and fresh temporary Git credential; none was created for this preparation.

The detail view opens from a result title and returns to the same filtered list. Its read-only `/api/detail?id=…` reads a bound record and existing evidence, verifies its hash/identity and builds source-backed sections. It makes no source-network requests or database/storage writes. The prominent deadline updates every 30 seconds, omits an unconfirmed countdown and moves under the heading on mobile.

`feature/public-tender-numbers` retains the staged permanent-numbering implementation. Numbering activation remains a separate reviewed database action.

The staged numbering migration only adds D1 tables/indexes/triggers and one explicit metadata flag. Backfill reads existing record IDs and leaves source JSON unchanged. It does not write, delete or rename R2 objects. Its rollback/preflight concerns D1 consistency, transaction failure recovery, preserved old records, stable assignments and the ledger sequence. Complete R2 inventory is a separate storage-backup capability gap.

Backup evidence in the workspace:

- `exports/current-backup-restore.json`: fresh read-only application export and exact supported-data restore.
- `exports/referenced-evidence-backup.json`: 365 referenced objects downloaded/restored, 160 available source SHA-256 checks, no mismatches. This is not the entire bucket inventory.
- `exports/d1-readonly-backup-audit.json`: bounded native D1 read audit, including truncation and non-atomic snapshot limitations when present.

Corrected visuals are already in Library (version 0): desktop list `libfile_1f83171264cc8191b68325ff9a2a6823`, mobile list `libfile_186a1639721881919dad89065529f058`, Alean desktop `libfile_00d0b3fd968c819194474b02b6238d25`, Alean mobile `libfile_3622f79ba3a48191b88df18e50de8b16`.
