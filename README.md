# TSC v0.5.0

Tender Search Company collects and presents public procurement opportunities. It keeps source verification, publication dates, collection status, service matching and commercial estimates separate. It uses React, TypeScript, Vinext/Vite and a Cloudflare Worker with D1.

## Source provenance

This is a local source-only candidate for independent review. It has not been uploaded to GitHub and is not an approval to deploy.

- Logical product version: `v0.5.0`.
- Published Sites snapshot: `v19`.
- Source commit: `3834aefd75aa5d0139e1d54a977710e0e35b5387`.
- Original source tree: `e8179ec5afb274f855c2d616f0c66e05216f4503`.
- Project: `appgprj_6ad234b932fc8191938f733a8991436f`.
- Deployment: `appgdep_6add580b5ae88191866795903f356909`.

The candidate changes only this README and publication exclusions in `.gitignore`. Application code, tests and assets match the source snapshot. The inherited package version is starter metadata, not the product release number.

## Local validation

Node.js 22.13.0 or later is required. Checked with Node 24.15.0 and npm 11.12.1 on Windows:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run build
node node_modules/typescript/bin/tsc --noEmit
node --test test/*.mjs test/*.js
```

The clean install disables dependency lifecycle scripts. Build and typecheck pass; all 129 tests pass. Tests use synthetic data, local in-memory SQLite and mocked requests, without production data or credentials.

The build creates `dist/`. Maintained Vite plugins and Worker sources in `build/` must remain in the repository. Dependencies, generated output, runtime state, databases, backups, uploads and credential files are excluded from publication.

## Configuration and production boundary

No production secret or environment file is required for validation. Sites supplies runtime bindings. `.openai/hosting.json` contains project identity and binding names, not credentials. A secret-valued environment example is unnecessary for this workflow.

Do not apply production migrations, change access policies, collect live data or deploy this review candidate as part of source publication. A GitHub push is not a website deployment. Automatic synchronization is not configured.

## Structure

- `app/`, `components/`, `hooks/`: application and interface.
- `lib/tenders/`, `shared/tenders/`, `public/`: collection and presentation.
- `db/`, `drizzle/`: schema and migrations, without a production database export.
- `build/`, `scripts/`, `vendor/`: build support and retained notices.
- `test/`: deterministic regression tests.

## Rights and audit limits

Notices in `build/sites-vite-plugin.LICENSE` and `vendor/shadcn-tailwind-4.13.0.LICENSE.md` are retained. No new general open-source license is assigned.

TSC SVG branding, PNG/ICO icons and three starter SVG icons still require a source and redistribution-rights review before public upload. Filenames alone do not prove ownership. Dependencies are represented by the lockfile, not bundled node_modules.

The audit covers this candidate and generated local build output. It does not certify undisclosed server history, external LFS payloads, dependency vulnerabilities, runtime access controls or every secret format. The proposed public repository starts from one new source commit, without legacy history, production data or deployment logs.
