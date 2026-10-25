# LED request filters and source access

Based on published v15 (`c48acd9fcb2c8d8e9d40ecb306b215e85ec0cc58`).

Adds derived filters and card labels for purchase/installation, rental, repair/parts, and advertising placement. Explicit screen context is required; generic LEDs, lights and televisions do not qualify. Ambiguous intent receives no category. These are matching hints, not a claim of current availability or supplier eligibility. Existing source status, deadlines, HOLD and freshness checks are retained.

No new automatic source has been enabled. The existing Bidzaar public HTML adapter remains limited to current private use and partial coverage. Its Connector API requires credentials and acceptance and is not connected. Commercial republication permission is not established. B2B-Center, ETP GPB, EIS, RTS and the official Sochi Belarus tender page are manual routes, explicitly excluded from collection claims. GPB RSS is unverified. No historical sample was imported as a current request; no records were added by this release. Contact access is unknown, never implicitly free or paid.

Telegram AI collection requires special consent and is not connected. Supl.biz programmatic collection requires a separate paid aggregator arrangement and is not connected. No accounts, keys, paid contracts, access policy, DNS or schedule changes. No full foreign texts added or mirrored by this release.

The five existing collectors, D1/R2 bindings, protected writer and hourly update contract in UPDATE.md remain unchanged: at most 20 requests per source, at least 600 ms spacing, 25-second budget, source stops for robots/401/403/CAPTCHA/TLS and Retry-After for 429.

Source access labels are read-only projections of the runtime registry. A configured adapter with missing or stale evidence says that verification is needed; blocked sources are unavailable. Manual routes do not populate the records feed. No READY state is derived from a source link or LED label.

Validation: 79 Node tests passed (62 retained and 17 LED/source-access cases), TypeScript `--noEmit` passed, browser script syntax and Git whitespace checks passed. Sites production build passed. Live browser QA remains unverified because the prior OpenAI login request was declined; no new login request or bypass was attempted. No collection writer was changed or invoked in this release.
