#!/usr/bin/env bash

set -euo pipefail

project_root="$(git rev-parse --show-toplevel)"
cd "$project_root"

protected_paths=(
  "src/app/auth"
  "src/app/onboarding"
  "src/app/page.tsx"
  "src/app/layout.tsx"
  "src/app/globals.css"
  "src/components/auth"
  "src/components/onboarding"
  "src/components/shared"
  "src/components/ui"
  "src/hooks/useAuthTokens.ts"
  "src/hooks/useSupplierTokens.ts"
  "src/store/theme.store.ts"
  "src/components/datasets/shared/StyledSelect.tsx"
  "src/components/datasets/shared/index.ts"
  "src/assets/logo-dark.png"
  "src/assets/logo-light.png"
  "public/logo-dark.png"
  "public/logo-light.png"
)

protected_worktree_changes="$(git status --short -- "${protected_paths[@]}")"

if [[ -n "$protected_worktree_changes" ]]; then
  echo "Dashboard UI scope check failed: protected auth/onboarding/shared files changed."
  echo "$protected_worktree_changes"
  exit 1
fi

base_ref="${DASHBOARD_SCOPE_BASE_REF:-}"

if [[ -z "$base_ref" && -n "${GITHUB_BASE_REF:-}" ]]; then
  base_ref="origin/${GITHUB_BASE_REF}"
fi

if [[ -z "$base_ref" ]] && git show-ref --verify --quiet refs/remotes/origin/main; then
  base_ref="origin/main"
fi

if [[ -n "$base_ref" ]] && ! git rev-parse --verify --quiet "$base_ref" >/dev/null; then
  echo "Dashboard UI scope check failed: base ref '$base_ref' is unavailable."
  echo "Fetch the base ref or set DASHBOARD_SCOPE_BASE_REF to a valid commit."
  exit 1
fi

if [[ -n "$base_ref" ]]; then
  merge_base="$(git merge-base HEAD "$base_ref")"
  protected_committed_changes="$(
    git diff --name-only "$merge_base"...HEAD -- "${protected_paths[@]}"
  )"

  if [[ -n "$protected_committed_changes" ]]; then
    echo "Dashboard UI scope check failed: committed changes touch protected auth/onboarding/shared files."
    echo "Compared HEAD with merge base $merge_base ($base_ref)."
    echo "$protected_committed_changes"
    exit 1
  fi
fi

scope_leaks="$(
  rg -n "supplier-dashboard|dashboard\\.css" \
    src/app/auth \
    src/app/onboarding \
    src/components/auth \
    src/components/onboarding \
    || true
)"

if [[ -n "$scope_leaks" ]]; then
  echo "Dashboard UI scope check failed: authenticated styles leaked into an excluded surface."
  echo "$scope_leaks"
  exit 1
fi

excluded_dashboard_imports="$(
  rg -n "@/(components|app)/dashboard" \
    src/app/auth \
    src/app/onboarding \
    src/components/auth \
    src/components/onboarding \
    || true
)"

if [[ -n "$excluded_dashboard_imports" ]]; then
  echo "Dashboard UI scope check failed: an excluded surface imports authenticated dashboard code."
  echo "$excluded_dashboard_imports"
  exit 1
fi

dashboard_literal_colors="$(
  rg -n -i "#[0-9a-f]{3,8}|rgba?\\(|hsla?\\(|oklch\\(" \
    src/components/dashboard/ui \
    src/components/dashboard/patterns \
    src/components/layout/DashboardShell.tsx \
    src/app/dashboard/layout.tsx \
    src/app/dashboard/dashboard.css \
    src/app/dashboard/page.tsx \
    || true
)"

if [[ -n "$dashboard_literal_colors" ]]; then
  echo "Dashboard UI scope check failed: the authenticated foundation introduces literal colours."
  echo "$dashboard_literal_colors"
  exit 1
fi

dashboard_palette_utilities="$(
  rg -n -i \
    "(bg|text|border|ring|from|via|to)-(black|white|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(-|/|[[:space:]\"'])" \
    src/components/dashboard/ui \
    src/components/dashboard/patterns \
    src/components/layout/DashboardShell.tsx \
    src/app/dashboard/layout.tsx \
    src/app/dashboard/page.tsx \
    || true
)"

if [[ -n "$dashboard_palette_utilities" ]]; then
  echo "Dashboard UI scope check failed: use existing semantic tokens instead of Tailwind palette utilities."
  echo "$dashboard_palette_utilities"
  exit 1
fi

dashboard_forbidden_imports="$(
  rg -n "@/(components/(auth|onboarding|shared)|hooks/(useAuthTokens|useSupplierTokens)|store/theme\\.store)" \
    src/components/dashboard/ui \
    src/components/dashboard/patterns \
    src/app/dashboard/layout.tsx \
    || true
)"

if [[ -n "$dashboard_forbidden_imports" ]]; then
  echo "Dashboard UI scope check failed: the authenticated foundation imports protected UI code."
  echo "$dashboard_forbidden_imports"
  exit 1
fi

gate_three_ad_hoc_ui="$(
  rg -n "useSupplierTokens|GlassCard|StatCard|@/components/ui/button|linear-gradient|backgroundImage|backdropFilter" \
    src/components/layout/DashboardShell.tsx \
    src/app/dashboard/layout.tsx \
    src/app/dashboard/page.tsx \
    || true
)"

if [[ -n "$gate_three_ad_hoc_ui" ]]; then
  echo "Dashboard UI scope check failed: Gate 3 shell or overview bypasses the scoped visual system."
  echo "$gate_three_ad_hoc_ui"
  exit 1
fi

gate_four_retired_ui="$(
  rg -n "PageBackground|GlassCard|supplier-glass|useSupplierTokens|@/components/ui/(button|card|input|textarea|checkbox|select|dialog)|<select([[:space:]>])|backdropFilter|WebkitBackdropFilter|transition-all|linear-gradient|backgroundImage" \
    --glob '!StyledSelect.tsx' \
    src/components/datasets \
    src/app/dashboard/datasets \
    src/app/dashboard/my-datasets \
    src/app/dashboard/proposals \
    || true
)"

if [[ -n "$gate_four_retired_ui" ]]; then
  echo "Dashboard UI scope check failed: Gate 4 dataset workflows reintroduced retired controls or page surfaces."
  echo "$gate_four_retired_ui"
  exit 1
fi

gate_four_literal_colors="$(
  rg -n -i "#[0-9a-f]{3,8}|rgba?\\(|hsla?\\(|oklch\\(" \
    --glob '!StyledSelect.tsx' \
    src/components/datasets \
    src/app/dashboard/datasets \
    src/app/dashboard/my-datasets \
    src/app/dashboard/proposals \
    src/constants/dataset.constants.ts \
    || true
)"

if [[ -n "$gate_four_literal_colors" ]]; then
  echo "Dashboard UI scope check failed: Gate 4 dataset workflows introduce literal colours instead of dashboard tokens."
  echo "$gate_four_literal_colors"
  exit 1
fi

gate_four_palette_utilities="$(
  rg -n -i \
    "(bg|text|border|ring|from|via|to)-(black|white|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(-|/|[[:space:]\"'])" \
    --glob '!StyledSelect.tsx' \
    src/components/datasets \
    src/app/dashboard/datasets \
    src/app/dashboard/my-datasets \
    src/app/dashboard/proposals \
    src/constants/dataset.constants.ts \
    || true
)"

if [[ -n "$gate_four_palette_utilities" ]]; then
  echo "Dashboard UI scope check failed: Gate 4 dataset workflows use Tailwind palette utilities instead of semantic tokens."
  echo "$gate_four_palette_utilities"
  exit 1
fi

gate_four_shared_select_usage="$(
  rg -n "import .*StyledSelect|<StyledSelect" \
    --glob '!StyledSelect.tsx' \
    --glob '!index.ts' \
    src/components/datasets \
    src/components/catalog \
    || true
)"

if [[ -n "$gate_four_shared_select_usage" ]]; then
  echo "Dashboard UI scope check failed: Gate 4 imports the shared select used by excluded screens."
  echo "$gate_four_shared_select_usage"
  exit 1
fi

gate_five_retired_ui="$(
  rg -n "PageBackground|GlassCard|supplier-glass|DatasetWorkspace|DatasetSection|useSupplierTokens|@/components/ui/(button|card|input|textarea|checkbox|select|dialog)|<select([[:space:]>])|transition-all|fadeIn" \
    src/components/dashboard/stats \
    src/app/dashboard/stats \
    || true
)"

if [[ -n "$gate_five_retired_ui" ]]; then
  echo "Dashboard UI scope check failed: Gate 5 analytics reintroduced retired controls, surfaces, or token hooks."
  echo "$gate_five_retired_ui"
  exit 1
fi

gate_five_literal_colors="$(
  rg -n -i "#[0-9a-f]{3,8}|rgba?\\(|hsla?\\(|oklch\\(" \
    src/components/dashboard/stats \
    src/app/dashboard/stats \
    || true
)"

if [[ -n "$gate_five_literal_colors" ]]; then
  echo "Dashboard UI scope check failed: Gate 5 analytics introduces literal colours instead of dashboard tokens."
  echo "$gate_five_literal_colors"
  exit 1
fi

gate_six_retired_ui="$(
  rg -n "PageBackground|GlassCard|supplier-glass|StyledSelect|PaginationControls|useThemeStore|getDatasetThemeTokens|useSupplierTokens|@/components/ui/(button|card|input|textarea|checkbox|select|dialog)|<select([[:space:]>])|backdropFilter|transition-all" \
    src/components/custom-collection \
    src/components/discounts \
    src/app/dashboard/custom-collection-services \
    src/app/dashboard/discount-campaigns \
    || true
)"

if [[ -n "$gate_six_retired_ui" ]]; then
  echo "Dashboard UI scope check failed: Gate 6 Supplier tools reintroduced retired controls, surfaces, or token hooks."
  echo "$gate_six_retired_ui"
  exit 1
fi

gate_six_literal_colors="$(
  rg -n -i "#[0-9a-f]{3,8}|rgba?\\(|hsla?\\(|oklch\\(" \
    src/components/custom-collection \
    src/components/discounts \
    src/app/dashboard/custom-collection-services \
    src/app/dashboard/discount-campaigns \
    || true
)"

if [[ -n "$gate_six_literal_colors" ]]; then
  echo "Dashboard UI scope check failed: Gate 6 Supplier tools introduce literal colours instead of dashboard tokens."
  echo "$gate_six_literal_colors"
  exit 1
fi

gate_seven_retired_ui="$(
  rg -n "PageBackground|GlassCard|supplier-glass|StyledSelect|useThemeStore|getDatasetThemeTokens|useSupplierTokens|@/components/ui/(button|card|input|label|textarea|checkbox|select|dialog)|<select([[:space:]>])|backdropFilter|transition-all" \
    src/components/data-requirements \
    src/app/dashboard/data-requirements \
    || true
)"

if [[ -n "$gate_seven_retired_ui" ]]; then
  echo "Dashboard UI scope check failed: Gate 7 Data Sourcing reintroduced retired controls, surfaces, or token hooks."
  echo "$gate_seven_retired_ui"
  exit 1
fi

gate_seven_literal_colors="$(
  rg -n -i "#[0-9a-f]{3,8}|rgba?\\(|hsla?\\(|oklch\\(" \
    src/components/data-requirements \
    src/app/dashboard/data-requirements \
    || true
)"

if [[ -n "$gate_seven_literal_colors" ]]; then
  echo "Dashboard UI scope check failed: Gate 7 Data Sourcing introduces literal colours instead of dashboard tokens."
  echo "$gate_seven_literal_colors"
  exit 1
fi

gate_eight_retired_ui="$(
  rg -n "PageBackground|GlassCard|supplier-glass|DatasetsTable|useThemeStore|getDatasetThemeTokens|useSupplierTokens|@/components/ui/(button|card|input|label|textarea|checkbox|select|dialog)|<select([[:space:]>])|backdropFilter|transition-all|fixed inset-0|style=\\{\\{" \
    src/app/dashboard/questions \
    src/app/dashboard/reviews \
    || true
)"

if [[ -n "$gate_eight_retired_ui" ]]; then
  echo "Dashboard UI scope check failed: Gate 8 Communication reintroduced retired controls, surfaces, overlays, or token hooks."
  echo "$gate_eight_retired_ui"
  exit 1
fi

gate_eight_literal_colors="$(
  rg -n -i "#[0-9a-f]{3,8}|rgba?\\(|hsla?\\(|oklch\\(" \
    src/app/dashboard/questions \
    src/app/dashboard/reviews \
    || true
)"

if [[ -n "$gate_eight_literal_colors" ]]; then
  echo "Dashboard UI scope check failed: Gate 8 Communication introduces literal colours instead of dashboard tokens."
  echo "$gate_eight_literal_colors"
  exit 1
fi

gate_nine_retired_ui="$(
  rg -n "PageBackground|GlassCard|supplier-glass|ProfileSection|StatusMessage|InfoCard|useThemeStore|getDatasetThemeTokens|useSupplierTokens|@/components/ui/(button|card|input|label|textarea|checkbox|select|dialog)|<select([[:space:]>])|backdropFilter|transition-all|fixed inset-0|style=\{\{" \
    src/components/profile \
    src/app/dashboard/profile \
    src/app/dashboard/account \
    src/app/dashboard/support \
    || true
)"

if [[ -n "$gate_nine_retired_ui" ]]; then
  echo "Dashboard UI scope check failed: Gate 9 Supplier settings reintroduced retired controls, surfaces, overlays, or token hooks."
  echo "$gate_nine_retired_ui"
  exit 1
fi

gate_nine_literal_colors="$(
  rg -n -i "#[0-9a-f]{3,8}|rgba?\(|hsla?\(|oklch\(" \
    src/components/profile \
    src/app/dashboard/profile \
    src/app/dashboard/account \
    src/app/dashboard/support \
    || true
)"

if [[ -n "$gate_nine_literal_colors" ]]; then
  echo "Dashboard UI scope check failed: Gate 9 Supplier settings introduce literal colours instead of dashboard tokens."
  echo "$gate_nine_literal_colors"
  exit 1
fi

expected_dashboard_routes="$(cat <<'EOF'
src/app/dashboard/account/page.tsx
src/app/dashboard/custom-collection-services/[id]/page.tsx
src/app/dashboard/custom-collection-services/create/page.tsx
src/app/dashboard/custom-collection-services/page.tsx
src/app/dashboard/data-requirements/submit/page.tsx
src/app/dashboard/datasets/[id]/page.tsx
src/app/dashboard/datasets/create/page.tsx
src/app/dashboard/datasets/page.tsx
src/app/dashboard/discount-campaigns/[id]/page.tsx
src/app/dashboard/discount-campaigns/page.tsx
src/app/dashboard/my-datasets/[id]/edit/page.tsx
src/app/dashboard/my-datasets/[id]/page.tsx
src/app/dashboard/my-datasets/page.tsx
src/app/dashboard/page.tsx
src/app/dashboard/profile/page.tsx
src/app/dashboard/proposals/page.tsx
src/app/dashboard/questions/page.tsx
src/app/dashboard/reviews/page.tsx
src/app/dashboard/stats/buyers/page.tsx
src/app/dashboard/stats/datasets/[id]/page.tsx
src/app/dashboard/stats/datasets/page.tsx
src/app/dashboard/stats/page.tsx
src/app/dashboard/support/page.tsx
EOF
)"

actual_dashboard_routes="$(rg --files src/app/dashboard -g 'page.tsx' | sort)"

if [[ "$actual_dashboard_routes" != "$expected_dashboard_routes" ]]; then
  echo "Dashboard UI scope check failed: authenticated route inventory drifted."
  diff -u \
    <(printf '%s\n' "$expected_dashboard_routes") \
    <(printf '%s\n' "$actual_dashboard_routes") \
    || true
  echo "Update the UI contract and this guard intentionally when the route inventory changes."
  exit 1
fi

echo "Dashboard UI scope check passed: 23 authenticated routes; Gates 5 through 9 use the scoped dashboard system; excluded surfaces unchanged."
