# Supplier onboarding UI alignment

The onboarding flow shares the supplier panel's scoped visual foundation. The
public landing is deliberately minimal: a single heading, short introduction,
apply/login actions and an application-status link.

The new shell consumes `dashboard.css` without authenticated navigation. Shared
buttons, input/textarea fields, labels and Radix select/portal components supply
the font, theme colors, contrast, 40px controls and focus treatment. The form
uses one connected frame with responsive section navigation and an attached
action row. The logo crop matches the panel. Form, document and review content
uses compact heading levels and consistent field/section spacing. The theme
store and global palette are unchanged.

The existing UI contract and scope guard now explicitly allow the six new
onboarding components and their CSS module to consume that foundation. The active login and password recovery screens are also explicitly included;
other legacy auth/onboarding components and shared primitives remain protected.

## Validation

- `npm run type-check`, `npm run lint`, `npm run check:dashboard-scope` and
  `git diff --check` pass.
- `npm run test:contracts` passes with the repository's Node 24.21.0 runtime,
  including the unchanged canonical onboarding contract fingerprint.
- `npm run test:release` passes: optimized Next build, TypeScript, real compiled
  routing/login-error behavior, light/dark glass and reduced-transparency
  treatment, and optimized brand assets at DPR 1 and 2.
- `npm run test:onboarding:ui` against local Next passes 98 checks and 106
  captures at 390, 768, 1024 and 1440px in both themes. This covers the minimal
  landing, email entry/success, invitation/new-account and existing-account
  states, the supplier-type dropdown (keyboard open/Escape/selection and
  bounded overlay), saved field edits, capabilities, review, both five-slot
  document checklists, error, correction, submitted and approved profile states.
- An additional `ONBOARDING_UI_WIDTHS=320 npm run test:onboarding:ui` run passes
  32 checks and 34 captures, including long action-label wrapping. Primary
  action contrast in the main run is at least 11.23:1. There are no browser
  runtime errors, unexpected external requests or horizontal overflow.

Run the UI checks with a local Next server at `127.0.0.1:3241`, or set
`ONBOARDING_UI_URL` to another loopback origin. `ONBOARDING_UI_EVIDENCE` selects
the screenshots/JSON output directory. API responses are isolated browser
fixtures; these checks create no real applications, documents or notifications.
They qualify presentation and interactions, not another real-provider workflow
run. The complete backend-connected workflow was qualified in the onboarding
release's separate staging evidence.

This visual revision is prepared on `feat/supplier-onboarding-ui-20261023` for
preview review before any production promotion.

## Account-access follow-up

Login and password recovery now use the same compact shell and 40px controls.
The decorative split panel, duplicate heading, separate theme palette and
button gradients have been removed. Recovery uses the existing persisted theme.
Login hydration protection, API contracts, validation, token handling and
invitation-return routing are preserved.

The extended local matrix passes **154 checks / 162 screenshots** at 320, 390,
768 and 1440px in both themes. It additionally covers password visibility,
keyboard login and server error display, apply navigation, reset-email validation,
sent/resend feedback, mismatched passwords, successful reset feedback and
invalid-link recovery. All email/password endpoints are intercepted fixtures.
There are no browser runtime errors, unexpected external requests or horizontal
overflow. The original 1024px onboarding check remains available in the first
revision's evidence. Hosted staging acceptance is recorded in the root plan.
