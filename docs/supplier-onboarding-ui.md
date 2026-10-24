# Supplier onboarding UI

## Current public landing

The current landing uses a full professional composition: a concise display
headline, a short introduction, two entry actions and a static data-network
illustration. The earlier minimal entry panel and no-heading direction were
superseded by the user's 24 October feedback.

The page keeps the supplier panel's original semantic navy palette, canvas/grid,
Geist, glass cards, borders, blur, corner treatment and standard 44px buttons.
The illustration reuses the original logo assets, existing icons and native SVG.
It contains no fabricated metrics, customer logos or interactive controls.
Desktop uses a balanced two-column layout; tablets stack the sections; phones
focus on the copy/actions. No continuous animation or new runtime dependency
was added. Public display type is intentionally larger than dashboard page titles.

“Become a supplier” opens `/apply` with the original query string, including
repeated referral parameters. “Supplier login” opens `/auth/login`. The header
keeps branding and the shared persisted theme toggle. There is no duplicate login
or third content CTA.

## Connected onboarding and account screens

Application, invitation, verification/private documents and own-profile screens
share the panel's scoped foundation. Labels, 40px form controls, dropdown portals,
feedback, typography and responsive attached form/action regions are consistent.
Login and password recovery use the same shell and primitives. The scope contract
and guard explicitly list approved consumers; global colours, shared base UI,
theme-store behaviour, authentication and business/API contracts are unchanged.

## Validation and release boundary

- TypeScript, lint, dashboard scope guard and diff checks pass.
- Sixteen local landing cases pass at 320/390/768/1024/1100/1440/1920/2560px
  in both themes: typeface, headline hierarchy, primary contrast, two CTAs,
  centering, bounded layout and no horizontal overflow.
- Twelve illustration checks pass for bounds, no overlapping cards, readable
  labels and repeated referral preservation.
- Required staging CI found GHSA-mrhx-c7xc-m3w5 in Zod 4.3.5. The direct runtime
  dependency is now pinned to patched 4.6.6; the runtime audit reports zero
  vulnerabilities. The exact lockfile update changes only Zod.
- Contracts pass on Node 24.21.0, including pinned vendor/runtime checks and the
  unchanged canonical onboarding contract. The optimized build and compiled
  login-error, glass/theme and original-logo DPR checks also pass.

The exact final staging source, CI, Vercel identity and hosted screenshots are
recorded in the root supplier-onboarding plan/qualification directory. This
visual revision is for staging review; production promotion requires a separate
instruction. No backend/database edits or notifications are part of this work.
The full provider-connected onboarding journey was qualified separately; these
UI fixture checks do not create real applications or send real email.

Run `ONBOARDING_UI_CASES=landing npm run test:onboarding:ui` with a local Next
server at `127.0.0.1:3241` for focused presentation checks. Omit the case filter
for the complete onboarding/auth matrix. Set `ONBOARDING_UI_WIDTHS` and
`ONBOARDING_UI_EVIDENCE` to choose viewport widths and artifact output.
