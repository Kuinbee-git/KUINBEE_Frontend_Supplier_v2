# Supplier onboarding UI alignment

The onboarding flow shares the supplier panel's scoped visual foundation. The
public landing is centered horizontally and vertically: one short line,
"Partner with Kuinbee.", and exactly two actions, "Become a supplier"
and "Supplier login". It has no heading, extra status link or duplicate login.
The landing uses the existing DashboardCard glass frame, standard grid canvas,
brand/theme header and 44px large DashboardButton actions. It omits the support footer.

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

The final landing correction passed eight focused browser checks at
320/390/768/1440px in light and dark mode. These assert centering, zero headings,
exactly two content links, a single login link, 40px buttons, panel typography,
contrast and no horizontal overflow. `ONBOARDING_UI_CASES=landing` runs this
focused set; omitting it runs the complete matrix.


## Supplier panel landing correction

The user rejected the flattened treatment. The current landing uses the actual
DashboardCard and DashboardButton components with the unmodified dashboard
canvas, grid, glass surface, border, blur, header and theme colors. The copy is
"Partner with Kuinbee." in the standard 16px/24px foreground text. A single
centered glass frame groups exactly two 44px actions, with responsive columns.
No title, extra link, custom background, grid mask, spotlight or entrance/lift
animation remains. Earlier premium-preview evidence describes a rejected revision.

Twelve focused browser checks passed at 320/390/768/1440/1920/2560px in both
themes. Centering, headings/actions, typography, primary contrast and no horizontal
overflow pass. TypeScript, lint, scope guard and diff checks pass. Staging CI and
hosted acceptance are recorded in the root plan for the exact current source.


## Professional landing composition, 24 October

The user superseded the minimal/no-heading direction and rejected the small
entry panel. The current landing is a full composition: a concise display
headline and introduction, two standard entry actions, entity-type guidance,
and a static data-network illustration using the existing glass cards, icons
and original logos. It retains the supplier canvas/grid, semantic palette and
Geist. The illustration is decorative and non-interactive, with no fabricated
metrics or customer claims. On phones the copy/actions take focus; the illustration
is omitted. Tablet and desktop layouts keep the graphic bounded and separated.

Sixteen focused UI checks pass across 320/390/768/1024/1100/1440/1920/2560px and
both themes. Twelve additional checks verify illustration bounds, no overlapping
cards, readable labels and repeated referral preservation. TypeScript, lint,
scope guard and diff checks pass. The browser UI contract intentionally changes
from zero headings to one display headline; other onboarding page title limits
and the authenticated type scale remain unchanged. This design is staged for
review; earlier screenshots represent rejected directions.
