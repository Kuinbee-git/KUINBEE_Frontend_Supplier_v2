# Supplier onboarding UI

## Current public landing

The landing centers one short information line above exactly two entry actions.
It has no display headline, illustration, card, extra link or footer. It uses the
supplier panel's existing Geist type, semantic colors, canvas/grid, header and
44px DashboardButton variants in both themes. The content remains centered and
the actions stack on narrow phones.

“Become a supplier” opens `/apply` with the original query string, including
repeated referral parameters. “Supplier login” opens `/auth/login`. The header
keeps branding and the shared persisted theme toggle without a duplicate login.

## Connected onboarding and account screens

Application, invitation, verification/private documents and own-profile screens
share the panel's scoped foundation. Labels, 40px form controls, dropdown portals,
feedback, typography and responsive attached form/action regions are consistent.
Login and password recovery use the same shell and primitives. The scope contract
and guard explicitly list approved consumers; global colours, shared base UI,
theme-store behaviour, authentication and business/API contracts are unchanged.

## Validation and release boundary

- TypeScript, lint, dashboard scope guard and diff checks are required.
- The focused local landing matrix covers 320/390/768/1024/1100/1440/1920/2560px
  in both themes: typography, contrast, two CTAs, centering and no overflow.
- The current design removes the earlier decorative illustration and display type.
- The required staging CI checks contracts, security and the compiled release;
  Zod remains pinned to the patched 4.6.6 version.

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
