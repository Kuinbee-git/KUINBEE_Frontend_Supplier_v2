# Frontend release checks and environment separation

`main` is the Vercel Production branch. `staging` is the stable Preview branch.
GitHub Actions checks each pushed branch revision, including PR branches, without
application, AWS, payment, SMTP or Vercel deployment credentials. Vercel's
`npm run build` first validates configuration, then requires a successful push run
of `.github/workflows/frontend-ci.yml` for the **same commit, branch and repository**.
Missing, running, failed, cancelled, skipped or unverifiable checks cannot release.
The hosted gate waits up to 15 minutes; GitHub/API errors fail closed. Local and
GitHub fixture builds make no release-status request, so there is no CI dependency
cycle. `vercel.json` pins the build entry point.

These frontend repositories are public, so status is read anonymously from GitHub
without introducing a deployment token. If repository visibility changes, the gate
will stop releases until authenticated status verification is configured. API rate
limits also hold a release; they never waive a required check.

Vercel additionally has the native production check **Frontend quality (supplier)**.
Its exact job name must remain aligned with project settings. Qualification proved
that a failed check blocks production alias assignment, but the native check did
not hold a Preview deployment. The explicit prebuild gate covers both targets.
Push is the authoritative workflow trigger, preventing duplicate PR/push results;
merged main/staging revisions run again. Fork pull requests are not deployment
sources. Public promotion remains separately held during migration.

## Build configuration

| Variable | Production | Preview |
| --- | --- | --- |
| NEXT_PUBLIC_APP_ENV | production | staging |
| NEXT_PUBLIC_API_BASE_URL | https://marketplace.backend.production.kuinbee.com | https://marketplace.backend.staging.kuinbee.com |
| NEXT_PUBLIC_USER_APP_URL | https://www.kuinbee.com | https://staging.kuinbee.com |

The build and Next configuration reject conflicting API/site targets and incorrect
API suffixes. Local builds may use a loopback or staging API. Preview responses
are marked `noindex, nofollow` and display a staging indicator. Preview protection
is configured separately in Vercel; robots headers are not access control.

Public variables are compiled into the browser bundle. Rebuild after changing
them. Production automatic domain assignment is temporarily held during migration.
It is restored only after the final data handoff and coordinated frontend switch;
subsequent releases use the required GitHub check automatically.

## Verification

Use Node 24.21.0 (`.nvmrc`) and `npm ci`.

- `npm run lint`: errors and warnings both fail; no legacy baseline or new rule suppressions.
- `npm run audit:runtime`: installed production dependencies must have no HIGH/CRITICAL advisories; registry/audit failures also fail CI.
- `npm run test:contracts`: release-gate failure/identity cases, environment rejection/acceptance and application contracts.
- `npm run test:release`: production build, TypeScript check, real browser login/API-target checks against a local fixture API. The buyer also asserts actual server-rendered fixture data; admin runs its existing authentication and Claru browser scenarios.
- `npm run test:components`: actual components in Chromium with API/framework fixtures, including the behavior changed by lint cleanup.

Install the matching browser with `npx --no-install playwright install chromium`.
Release tests bind the frontend to loopback port 3020 and use an ephemeral fixture
API port so old fetch caches cannot satisfy a fresh build. Run repositories'
release suites sequentially when sharing one machine. No live data or real provider
operation is required. These tests do not replace final-domain OAuth, cookie/CORS,
upload and role-based acceptance at the migration window.

## Dependency qualification

Next.js and its ESLint configuration are pinned to 16.4.0. Production dependency
advisories were remediated before release qualification. A separate **development
only** advisory remains in `braces@3.0.3`, reached through the Next ESLint plugin's
`fast-glob`/`micromatch` dependencies (five affected dependency nodes, one root
advisory). The advisory currently has no patched braces version. It concerns
stack exhaustion from deeply nested patterns. It is not present in the production
`npm audit --omit=dev` result. Keep linting isolated in CI without application
credentials; do not downgrade Next's lint configuration or disable rules to conceal
this finding. Recheck the advisory when an upstream fix is released.

[braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm),
[Next.js 16.4.0 release](https://github.com/vercel/next.js/releases/tag/v16.4.0).

## Local qualification — 2026-10-13

Strict lint (zero errors/warnings), TypeScript, environment/application contracts,
production build, and compiled login/API-routing checks passed using Node 24.21.0.
Runtime dependency audits report zero findings for all three applications.
Buyer/supplier component regressions cover edited forms, browser storage recovery,
OTP retries, pagination, request lifecycle, and payment outcomes as applicable.
Admin additionally passed 8 authentication, 17 single-transfer, 19 bulk-transfer,
and 2 CSP browser checks, plus its transfer/queue unit contracts.

These are local results against fixture APIs. GitHub Actions, Vercel check
integration, staged-domain acceptance and the final live data/traffic handoff
are separate release checkpoints; public promotion remains held.
