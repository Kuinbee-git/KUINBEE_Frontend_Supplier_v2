# Supplier dashboard UI coverage

The inventory contains 26 existing authenticated route entrypoints. Route loading
alone does not qualify a populated detail, an editor or a business action.

| Route family          | Entrypoints                                                                                                                                  | Populated states and meaningful UI checks                                                                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overview              | `/dashboard`                                                                                                                                 | Canonical counts, recent proposals, correct destination links, StrictMode cold/reload/account replacement                                                                                            |
| Analytics             | `/dashboard/stats`, `/dashboard/stats/buyers`, `/dashboard/stats/datasets`, `/dashboard/stats/datasets/[id]`                                 | Connected metrics/charts/records, range-preserving navigation, selected Dataset detail header                                                                                                        |
| Drafts and proposals  | `/dashboard/datasets`, `/dashboard/proposals`, `/dashboard/datasets/[id]`                                                                    | One combined draft inventory; legacy pending/submitted/returned/rejected details; all inline forms opened and cancelled                                                                              |
| New Dataset authoring | `/dashboard/datasets/create`, `/dashboard/datasets/prepare`, `/dashboard/datasets/prepare/[draftId]`, `/dashboard/datasets/drafts/[draftId]` | Four-screen editor, save/resume, upload records and review summary; frozen/live references; correction UI. Preparation URLs remain compatibility redirects                                           |
| Dataset management    | `/dashboard/my-datasets`, `/dashboard/my-datasets/[id]`, `/dashboard/my-datasets/[id]/edit`                                                  | Published/verified/delisted/archived details; permitted initial and returned update editors; locked updates remain read-only; visibility/pricing/delist/archive/publish dialogs opened and dismissed |
| Custom collection     | `/dashboard/custom-collection-services`, `/dashboard/custom-collection-services/create`, `/dashboard/custom-collection-services/[id]`        | List filters, creation, populated published and returned details, existing revision editor through review, cancellation and archive dialog dismissal                                                 |
| Promotions            | `/dashboard/discount-campaigns`, `/dashboard/discount-campaigns/[id]`                                                                        | Populated campaign list and Dataset promotion detail, form/control boundaries retained                                                                                                               |
| Requirements          | `/dashboard/data-requirements/submit`                                                                                                        | Connected form and guidance; current validation/actions retained                                                                                                                                     |
| Engagement            | `/dashboard/questions`, `/dashboard/reviews`                                                                                                 | Populated selected records, reply/editor controls and empty/error states                                                                                                                             |
| Settings and help     | `/dashboard/profile`, `/dashboard/account`, `/dashboard/support`                                                                             | Connected main/aside form sections, existing profile/account controls, help content                                                                                                                  |

The previous whole-panel pass is recorded in the workspace plan Section 6.116.
The detail correction is recorded separately in Section 6.117; the inventory and
service-form composition correction is Section 6.118. The permanent
`test:details` fixture uses actual components and typed synthetic responses for
19 populated states (160 cases). The original 15 states use both themes and four
widths; the four added inventory/service states also include 1920px. It includes long
titles, expanded inventories, every available inline editor, permitted/locked
updates and confirmation-dialog dismissal. The theme assertion checks the
hydrated DOM, not just a requested URL parameter. No fixture may submit a write.

Inventories assert one connected frame, aligned desktop search/filter controls,
status filtering, empty-search recovery, singular counts and Delisted URL/heading
continuity. Service creation covers collapsed category options, filtered selection
preservation, the ten-category cap, Escape focus return, accurate save status and
form actions that follow the fields without covering them. This coverage was
added after the user's screenshots exposed composition problems that the earlier
detail and route checks did not detect.

Existing `test:components`, `test:preparations`, `test:uploads`, `test:workflow`
and the compiled `test:release` qualify their respective contracts and controls.
The workspace qualification record distinguishes local fixtures, live staging
page reads, and earlier controlled end-to-end Dataset business journeys. Synthetic
legacy detail coverage does not imply conversion or historical access acceptance.

Visual review preserves the existing palette, light/dark grid and glass tokens.
Sections share one frame; ordinary read-only fields and edit groups use dividers.
Selectable choices, individual records, alerts and confirmation controls retain
boundaries when those boundaries communicate meaning.
