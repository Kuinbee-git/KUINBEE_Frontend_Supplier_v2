# Supplier Dashboard Component Foundation

This component set implements Gate 2 of the authenticated supplier UI refresh.
It is available only to `/dashboard/**` consumers and inherits the existing
Kuinbee semantic palette from `.supplier-dashboard`.

Import from the authenticated barrel:

```tsx
import {
  DashboardButton,
  DashboardPage,
  DashboardPageHeader,
} from "@/components/dashboard";
```

Authentication and onboarding must not import this barrel. Run
`npm run check:dashboard-scope` after every migration.

## Foundation inventory

| Area              | Components                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------- |
| Page structure    | `DashboardPage`, `DashboardPageHeader`, `DashboardSection`                                  |
| Summary metrics   | `DashboardMetricCard` with loading, supporting copy, and semantic status                    |
| Detail and forms  | `DashboardDetailLayout`, `DashboardFormLayout`, `DashboardFormActions`                      |
| Surfaces          | `DashboardCard` and its header, title, description, content, footer                         |
| Actions           | `DashboardButton` with primary, secondary, outline, ghost, destructive, and link variants   |
| Fields            | `DashboardField`, `DashboardChoiceGroupField`, input, textarea, checkbox, radio, and switch |
| Form feedback     | `DashboardFormErrorSummary`, helper text, connected field errors                            |
| Choice controls   | Dashboard-scoped Radix select primitives                                                    |
| Overlays          | Dashboard-scoped select, menu, dialog, sheet, and tooltip primitives                        |
| Lists             | `DashboardToolbar`, `DashboardDataTable`, mobile record card, pagination                    |
| Progress          | `DashboardProgress` with determinate and indeterminate states                               |
| Status and states | Status badge, inline alert, loading, skeleton, empty, error, success                        |

Use one primary button for the dominant action in a page or self-contained
state. Secondary and outline variants preserve the glass hierarchy for nearby
actions; ghost is reserved for low-emphasis controls, and destructive is used
only for irreversible operations. The dark primary intentionally uses a
high-contrast near-ivory surface with navy text instead of the global blue so it
belongs on the Kuinbee glass canvas.

## Page composition

```tsx
<DashboardPage width="wide">
  <DashboardPageHeader
    title="My datasets"
    description="Manage drafts and published marketplace listings."
    actions={<DashboardButton>Create dataset</DashboardButton>}
  />

  <DashboardSection title="Datasets" description="All datasets in this view.">
    {/* Toolbar, state, table, and pagination */}
  </DashboardSection>
</DashboardPage>
```

Widths are `wide` (`1400px`), `standard` (`1120px`), and `narrow` (`760px`).
The page component applies the approved responsive gutters and vertical rhythm.

## Summary metrics

Use `DashboardMetricCard` for overview and analytics summary grids. The value
and surface remain neutral; semantic colour is limited to the optional status
badge. `status` can contain a trend or a short state label.

```tsx
<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
  <DashboardMetricCard
    label="Published datasets"
    value={publishedCount}
    supportingText="Available to marketplace buyers"
    status="Active"
    statusTone="success"
    icon={Database}
    loading={loading}
    loadingLabel="Loading published dataset count"
  />
</div>
```

Provide a specific `loadingLabel` when the visible label alone does not fully
describe the pending metric. Icons are optional and must reinforce the metric,
not decorate the card.

## Accessible fields

`DashboardField` owns the label and stable helper/error ids. The render function
passes the required ARIA properties to the actual control.

```tsx
<DashboardField
  id="dataset-title"
  label="Dataset title"
  description="This title appears in the marketplace."
  error={errors.title}
  required
>
  {(controlProps) => (
    <DashboardInput
      {...controlProps}
      name="title"
      autoComplete="off"
      required
    />
  )}
</DashboardField>
```

Use `DashboardChoiceGroupField` around radio groups so the group has a visible
legend and programmatic name. Use `DashboardFormErrorSummary` for failed
submissions and move focus to it—or the first invalid field—when validation
prevents submission. Pass a changing `focusKey` for each failed submit attempt
and structured errors such as `{ fieldId: "dataset-title", message: "Enter a
title" }` to make summary items link back to their controls. Inline field errors
remain connected through `aria-describedby` and are not separate live alerts.

## Selects and overlays

Selects, dropdowns, and dialogs are implemented directly with Radix. Their
portalled content automatically receives `.supplier-dashboard-portal`, so light
and dark surfaces match the authenticated application without affecting auth or
onboarding.

```tsx
<DashboardSelect value={status} onValueChange={setStatus}>
  <DashboardSelectTrigger id="status-filter" aria-label="Filter by status">
    <DashboardSelectValue placeholder="All statuses" />
  </DashboardSelectTrigger>
  <DashboardSelectContent>
    <DashboardSelectItem value="all">All statuses</DashboardSelectItem>
    <DashboardSelectItem value="active">Active</DashboardSelectItem>
  </DashboardSelectContent>
</DashboardSelect>
```

Dialog and sheet content require both `title` and `description`; the components
create the correct accessible name, focus trap, Escape behaviour, close control,
and bounded scroll region. Pass actions through `footer` so they remain visible
while long content scrolls.

```tsx
<DashboardDialog open={open} onOpenChange={setOpen}>
  <DashboardDialogContent
    title="Archive dataset"
    description="The listing will no longer be visible to buyers."
    footer={
      <>
        <DashboardDialogClose asChild>
          <DashboardButton variant="outline">Cancel</DashboardButton>
        </DashboardDialogClose>
        <DashboardButton variant="destructive">Archive</DashboardButton>
      </>
    }
  >
    Review the listing details before continuing.
  </DashboardDialogContent>
</DashboardDialog>
```

Wrap the authenticated shell once in `DashboardTooltipProvider`. Icon-only
buttons require an `aria-label`, and collapsed navigation controls pair a named
button with `DashboardTooltipContent`. `DashboardSheet` is the standard
focus-trapped mobile-navigation panel.

Selects and menus opened from a dialog or sheet automatically use the modal
popover layer, so their portalled content stays above the overlay.

## List composition

```tsx
<DashboardToolbar ariaLabel="Search and filter datasets">
  <DashboardSearchField
    label="Search datasets"
    value={query}
    onValueChange={setQuery}
    placeholder="Search by title or reference"
  />
  <DashboardToolbarFilters ariaLabel="Dataset filters">
    {/* Select triggers */}
  </DashboardToolbarFilters>
  <DashboardToolbarActions ariaLabel="Dataset actions">
    {/* Apply or clear actions when the workflow requires them */}
  </DashboardToolbarActions>
</DashboardToolbar>
```

`DashboardDataTable` is controlled and never makes an entire row clickable.
Primary navigation belongs in a real link inside a cell. Supply
`renderMobileItem` to switch from the table to cards below `768px`; otherwise,
the table receives an explicitly labelled horizontal scroll region.

`DashboardPagination` is always one-based, derives its page count from
`pageSize` and `totalItems`, disables boundary controls, and normalises invalid
numeric input. Sortable table columns require a textual `sortLabel`; mark one
column with `rowHeader: true` when it identifies each record.

## Request states

Render exactly one request state at a time:

```tsx
if (loading) return <DashboardLoadingState label="Loading datasets" />;
if (error) {
  return <DashboardErrorState message={error.message} onRetry={reload} />;
}
if (items.length === 0) {
  return (
    <DashboardEmptyState
      title="No datasets yet"
      description="Create a dataset to begin."
    />
  );
}
```

Filtered-empty and true-empty states must remain distinct. API failures must not
be converted into legitimate-looking zero metrics or empty results.

## Tone rules

- `neutral`: ordinary metadata and inactive state
- `info`: Kuinbee primary/brand information
- `success`: active, published, and successful completion
- `warning`: review-needed or caution states
- `danger`: errors, rejection, and destructive actions

Green is therefore used only through `success`; it is never a field focus,
dropdown highlight, navigation, or default action colour.

## Migration rules

- Preserve API calls, state machines, validation schemas, and route behaviour.
- Replace legacy page backgrounds and glass wrappers at the route consumer.
- Do not modify frozen base components to make a migrated page fit.
- Do not introduce literal colours or feature-specific control variants.
- Use persistent feedback for submissions and failures; toast messages are only
  supplementary.
- Validate keyboard use, visible focus, light/dark mode, and `390`, `768`,
  `1024`, and `1440px` widths before completing a page family.
