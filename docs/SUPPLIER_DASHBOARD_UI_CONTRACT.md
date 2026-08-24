# Supplier Dashboard UI Contract

## Purpose

Refresh the authenticated supplier experience with the clarity and consistency
of shadcn's application UI while retaining Kuinbee's existing colours, branded
gradient-grid background, restrained glass treatment, content, and business
workflows.

This contract applies to every route under `/dashboard` and to components when
they are rendered inside the authenticated dashboard shell.

## Hard scope boundary

The following surfaces are excluded from this refresh:

- `/auth/**`
- `/onboarding/**`
- `src/components/auth/**`
- `src/components/onboarding/**`
- Pre-login redirects and public authentication states

Dashboard styling is loaded from `src/app/dashboard/dashboard.css` and all of
its selectors must be rooted at `.supplier-dashboard`. Shared primitives must
receive a dashboard-specific variant or inherit dashboard-scoped variables;
their unauthenticated default appearance must not change.

Radix menus, selects, popovers, tooltips, and dialogs render through portals and
therefore sit outside the dashboard wrapper. Authenticated variants must put the
`.supplier-dashboard-portal` class on portalled content. Unscoped portal styles
are not permitted.

The global Kuinbee palette in `src/app/globals.css` is read-only for this
project. Dashboard work may consume its semantic variables but must not replace
their values or add page-specific colour systems.

The protected implementation surface also includes shared files consumed by
excluded screens: `src/components/ui/**`, `src/components/shared/**`,
`useAuthTokens`, `useSupplierTokens`, the theme store, and the shared
`StyledSelect`. New authenticated wrappers belong under
`src/components/dashboard/ui/**`; new page patterns belong under
`src/components/dashboard/patterns/**`.

Run `npm run check:dashboard-scope` at every gate. It fails if a protected file
changes, authenticated selectors appear in excluded surfaces, or the recorded
23-route inventory drifts without an intentional contract update.

## Visual direction

The shadcn reference describes structure and discipline, not a flat rebrand:

- The established Kuinbee light/dark gradient and 32px grid remain the shared
  authenticated canvas
- Restrained glass surfaces remain part of the design language for the shell,
  grouped content, and portalled overlays
- One consistent content container and responsive gutter system
- Neutral borders and restrained elevation keep glass surfaces readable
- Compact, aligned controls with visible labels
- Clear page titles, descriptions, primary actions, and secondary actions
- Predictable list, detail, form, and settings patterns
- Functional icons only; decoration must not compete with content
- Semantic colours only for status, warning, success, and destructive feedback

The background and glass treatment come from one dashboard-scoped token system.
Pages must not introduce unrelated backgrounds, one-off gradients, excessive
glass nesting, or inline colour recipes.

## Layout rules

| Element       | Contract                                                        |
| ------------- | --------------------------------------------------------------- |
| Sidebar       | `256px` expanded, `80px` collapsed, drawer on small screens     |
| Top bar       | `64px`, aligned with the page content gutter                    |
| Content width | Fluid up to `1400px`; centred when space remains                |
| Page gutter   | `16px` mobile, `24px` tablet, `32px` desktop                    |
| Page sections | `24px` vertical rhythm                                          |
| Grids         | `16px` mobile and `24px` from tablet upward                     |
| Controls      | `40px` default height; larger text areas grow vertically        |
| Corners       | Existing Kuinbee `--radius` token; one larger panel radius only |

Pages use the one retained Kuinbee application background. Glass cards are
reserved for grouped content, not used to wrap every heading or individual
field.

Spacing uses a `4px` scale: `4`, `8`, `12`, `16`, `20`, `24`, `32`, `40`, and
`48px`. Cards use `16px` padding on mobile and `24px` from tablet upward. Form
fields are separated by `16px`; form sections are separated by `24px`.

## Typography hierarchy

- Page title: one `h1`, compact and left aligned
- Page description: one short muted line when it adds context
- Section title: `h2`, visually subordinate to the page title
- Card title: `h3` or labelled group, never styled as another page title
- Body and controls: consistent base size with muted text remaining readable
- Metadata and helper text: smaller than body copy but never used for key actions

Every page owns its title. The dashboard shell supplies navigation and account
controls but does not repeat a generic page heading above route content.

The type scale remains Geist and is fixed as follows:

| Role                  | Size and line height                | Weight      |
| --------------------- | ----------------------------------- | ----------- |
| Page title            | `24/32px` mobile, `30/36px` desktop | `600`       |
| Section title         | `20/28px`                           | `600`       |
| Card/subsection title | `16/24px`                           | `600`       |
| Introductory copy     | `16/24px`                           | `400`       |
| Body and labels       | `14/22px` body, `14/20px` labels    | `400`/`500` |
| Caption and metadata  | `12/18px`                           | `400`/`500` |

## Surface and control rules

- Canvas, card, popover, border, text, and action colours come from the existing
  semantic variables exposed through `.supplier-dashboard` aliases.
- Sidebar, top bar, grouped cards, menus, sheets, dialogs, and tooltips use the
  shared dashboard glass treatments. Popovers use the stronger surface for text
  contrast; inputs use a restrained control surface rather than nested blur.
- Browsers without backdrop-filter support and users requesting reduced
  transparency receive an opaque semantic surface.
- Inputs, selects, textareas, date controls, and search fields share the same
  height, background, border, radius, placeholder treatment, and focus ring.
- Focus uses the existing Kuinbee `--ring`/primary colour. Green is reserved for
  success and published/active status, not ordinary input focus.
- Dropdown content matches its trigger and surrounding surface in both themes.
- Standard controls are `40px` high, compact controls are `36px`, large primary
  actions are `44px`, and textareas have a `96px` minimum height.
- Each page or self-contained state has one dominant primary action. Light mode
  uses the established deep navy; dark mode uses the accessible near-ivory/navy
  pairing. Secondary and outline actions use the restrained glass hierarchy.
- Tables use a single header, row, status badge, action-menu, and mobile-card
  treatment.
- Dialogs have a title, description where needed, close control, bounded height,
  mobile gutter, and an explicit action hierarchy.
- Destructive styling appears only on destructive actions and error states.

## Standard page patterns

1. **Overview:** page header, summary metrics, priority content, recent activity.
2. **List:** page header, action, toolbar, results, pagination, and mobile cards.
3. **Detail:** breadcrumb/back action, title and status, main content, side actions.
4. **Create/edit:** page header, grouped form sections, sticky or final action row.
5. **Analytics:** page header, filters, metric summary, charts, supporting table.
6. **Settings/support:** narrow readable column with clearly separated sections.

## State contract

Each route family is complete only when the applicable states are designed:

- Initial loading and incremental loading
- Empty and no-search-results
- Recoverable error with retry
- Field validation and submission error
- Saved/success confirmation
- Disabled and permission-restricted actions
- Draft, submitted, under-review, published, rejected, delisted, and archived
- Destructive confirmation
- Long content, overflow, and unavailable optional values

States must preserve layout stability and must not represent a failed request as
a genuine zero or successful empty result.

## Responsive and interaction contract

- Target widths: `390px`, `768px`, `1024px`, and `1440px`.
- The application has one intentional vertical scroll owner per viewport.
- Desktop tables become usable mobile cards or deliberately scrollable tables.
- Toolbars wrap or stack without clipping controls.
- All interactive elements are keyboard reachable and show visible focus.
- Menus and dialogs expose their state, support Escape, and return focus.
- Form labels are programmatically connected to controls; errors are announced.
- Motion respects reduced-motion preferences.

## Authenticated route inventory

The refresh covers 23 routes:

- Overview: `/dashboard`
- Analytics: `/dashboard/stats`, `/dashboard/stats/buyers`,
  `/dashboard/stats/datasets`, `/dashboard/stats/datasets/[id]`
- Draft datasets: `/dashboard/datasets`, `/dashboard/datasets/create`,
  `/dashboard/datasets/[id]`
- Supplier datasets: `/dashboard/my-datasets`, `/dashboard/my-datasets/[id]`,
  `/dashboard/my-datasets/[id]/edit`
- Proposals: `/dashboard/proposals`
- Discounts: `/dashboard/discount-campaigns`,
  `/dashboard/discount-campaigns/[id]`
- Custom collection: `/dashboard/custom-collection-services`,
  `/dashboard/custom-collection-services/create`,
  `/dashboard/custom-collection-services/[id]`
- Requirements: `/dashboard/data-requirements/submit`
- Communication: `/dashboard/questions`, `/dashboard/reviews`
- Supplier settings: `/dashboard/profile`, `/dashboard/account`,
  `/dashboard/support`

Query-string views such as delisted datasets are states of these routes and are
included even though they are not additional page entrypoints.

## Definition of done for every migration gate

- Uses the shared authenticated shell and page pattern
- Retains existing Kuinbee semantic colours in light and dark mode
- Covers applicable workflow and request states
- Works at all target widths without unintended nested scrolling
- Supports keyboard and visible focus behaviour
- Preserves API contracts and business logic
- Introduces no changes under the excluded auth/onboarding scope
- Passes `npm run check:dashboard-scope`
- Passes TypeScript and adds no new lint errors

## Gate 2 implementation

The authenticated component foundation lives under
`src/components/dashboard/ui/**` and `src/components/dashboard/patterns/**`.
Its supported APIs and composition recipes are documented in
`docs/SUPPLIER_DASHBOARD_COMPONENTS.md`. Subsequent page gates must compose this
foundation instead of creating new route-specific control or surface systems.

## Gate 3 implementation

The authenticated shell and `/dashboard` overview are the first consumers of
the foundation. The shell owns the retained light/dark gradient-grid canvas,
one glass 64px top bar, a glass 256px/80px desktop sidebar, a focus-trapped
mobile navigation sheet, collapsed-navigation tooltips, theme control, and the
account menu. Route pages remain responsible for their own `h1` and
introductory copy.

The overview uses the standard page header, metric cards, persistent warning
and error feedback, recent-activity list, and quick actions. Failed API requests
must render the recoverable error state and must never be converted into zero
metrics or a legitimate empty result.

The scope guard checks these two migrated files for literal palette values,
inline visual recipes, and retired glass-card, token-hook, and shared-button
imports. The retained visual treatment lives in `dashboard.css` and the
authenticated primitives; subsequent gates must not reintroduce legacy or
page-specific implementations.

## Gate 4 implementation

The dataset workflow family now uses the same authenticated page frame as the
overview. Drafts, proposals, and supplier datasets share the dashboard metric,
toolbar, select, table, mobile-record, pagination, status, loading, empty, and
error patterns. Incremental list requests keep the existing rows stable while
announcing the busy state.

Create, proposal detail, supplier dataset detail, and delisted edit no longer
render a second page background. Their forms, buttons, cards, selects, upload
flow, disclosures, dialogs, and lifecycle confirmations use the authenticated
dashboard system. Detail sidebars follow the primary content on small screens,
and the creation progress split begins at the `xl` breakpoint so the form stays
usable beside the application sidebar at 1024px.

Dataset workflows use the dashboard-scoped `DatasetSelect` adapter. The shared
`StyledSelect` remains frozen because onboarding consumes it and must retain its
pre-refresh styling and portal behaviour.

The Gate 4 scope guard rejects the retired page background, shared glass card,
base button/card/input/textarea/checkbox/select/dialog controls, and native
selects inside the dataset workflow family. Existing API calls, state machines,
upload ordering, validation rules, and lifecycle permissions remain unchanged.

## Gate 5 implementation

The analytics overview, buyer insights, dataset comparison, and dataset detail
routes now share the authenticated page frame, segmented navigation, time-range
control, metric cards, chart sections, status badges, tables, mobile records,
pagination, and loading, empty, and recoverable error states.

Analytics failures no longer render zero-value summaries that can be mistaken
for valid business data. Dataset comparison uses the dashboard select and table
patterns, and dataset detail no longer creates a second page background inside
the authenticated shell. Chart series consume the existing semantic chart
tokens while tooltip, grid, text, and surface styling inherit the dashboard
theme in light and dark modes.

The Gate 5 scope guard rejects retired page surfaces, shared glass helpers, base
controls, native selects, the protected supplier token hook, ad hoc animation
recipes, and literal colours throughout the analytics route family. Analytics
API calls, range query parameters, sorting, pagination, currency handling, and
calculation logic remain unchanged.

## Gate 6 implementation

The Supplier tools family now covers custom collection services and dataset
promotions across their list, create, detail, edit, revision, history, and
lifecycle states. Both workflows use the authenticated page frame, semantic
metric and status treatments, responsive records, dashboard pagination,
recoverable request errors, shared form controls, and focus-managed dialogs.

Custom collection keeps its multi-step validation, category loading, cover
upload, private draft, review, visibility, archive, and revision behaviour.
Dataset promotions retain eligible-dataset discovery, paid and sample pricing
surfaces, preview calculations, admin-review submission, cancellation, and
paginated history. Promotion date fields use the dashboard input surface and
inherit the browser's light or dark colour scheme. Development-only dataset and
proposal records are not injected into the supplier workflow.

The Gate 6 scope guard rejects protected theme hooks, dataset theme helpers,
shared onboarding-era selects, retired glass classes, base controls, native
selects, inline visual recipes, and literal colours throughout both Supplier
tools workflow families.

## Gate 7 implementation

The authenticated Data Sourcing route now uses the shared dashboard page,
form, field, section, sidebar, status, error-summary, and success patterns. The
supplier can submit a requirement but does not receive requirement-management
controls; the API continues to record the origin as the Supplier panel and the
admin team owns the remaining lifecycle.

The two-hour session draft, supplier-profile prefilling, request idempotency,
and submission API remain intact. Validation now reports every invalid field,
links the summary to programmatically labelled controls, and moves focus to new
errors. Storage failures do not block submission, repeated submissions surface
the original reference, and request failures remain distinguishable from field
validation and legitimate success.

The Gate 7 scope guard rejects legacy base controls, protected theme hooks,
retired glass classes, inline visual recipes, native selects, and literal
colours from the authenticated requirement-submission route.

## Gate 8 implementation

The authenticated Communication family now covers Questions and Reviews. Both
routes use the shared page header, summary metrics, glass cards, semantic
statuses, loading, empty, recoverable error, responsive table/card, search, and
pagination patterns without creating a second background or scroll owner.

Questions retain dataset-wide loading and the existing answer API. Dataset
threads use labelled reply forms with persistent field and request feedback,
and successful replies update the conversation without replacing the page with
a full loading state. Partial dataset failures are disclosed and retryable;
complete request failures are never represented as a legitimate empty inbox.

Reviews retain dataset discovery and marketplace review APIs. The overview has
explicit dataset navigation rather than clickable table rows, while the detail
state uses a non-blocking loading view, semantic rating distribution, responsive
review records, and retryable request errors. A failed review request is no
longer converted into an empty review history.

The Gate 8 scope guard rejects protected token hooks, shared glass helpers,
legacy dataset tables, base controls, blocking page overlays, inline visual
recipes, ad hoc transitions, and literal colours throughout both Communication
routes.

## Gate 9 implementation

The Supplier settings family now covers Profile, Account, and Support with the
shared dashboard page, settings, form, card, status, progress, pagination,
feedback, and confirmation patterns. This completes the component migration for
all 23 authenticated routes; final visual and regression QA remains a separate
acceptance pass.

Profile retains the existing supplier-profile, onboarding-status, and logo
upload APIs, including file type, size, dimension, and square-image checks.
Company and individual fields remain conditional, supported business domains
are validated together, save failures remain distinct from field errors, and a
finalized profile is clearly read-only while logo replacement keeps its prior
permission. A failed onboarding-status request is disclosed instead of being
silently treated as an editable or locked profile.

Account now renders only status returned by the onboarding API, with the
persisted supplier email used solely as a fallback. Invented verification and
last-login values were removed. Because the supplier API does not expose a
direct password-change operation, the screen no longer reports a simulated
success; it links to the existing account-recovery flow and labels that
limitation. PAN attempt history uses explicit loading, empty, error, semantic
status, and pagination states. Sign-out uses a focus-managed destructive
confirmation before preserving the existing local session cleanup and redirect.

Support exposes the verified Kuinbee email and UK/India phone channels as
functional mail and telephone links. The non-functional live-chat control,
placeholder telephone number, and inert article buttons were removed. Internal
workspace guides now lead to real authenticated routes, and the page explains
which safe diagnostic details to provide without implying a support-ticket API.

The Gate 9 scope guard rejects protected token hooks, legacy profile helpers,
shared glass helpers, base controls, blocking overlays, inline visual recipes,
ad hoc transitions, and literal colours throughout Supplier settings.
