# Supplier Dataset proposal draft foundation

This is the draft-testing slice of the connected supplier Dataset redesign. The
four screens are Basics, Files & contents, Dataset details and Review draft.
Suppliers can save a valid incomplete draft with only a title, choose Sample only,
Full dataset only or Full dataset + sample, and resume it step by step.

The editor uses the private backend API at
`/api/v2/supplier/dataset-drafts`. Saves require an acknowledged generation;
uncertain responses retain the same request ID for retry. Conflicting saves retain
local input and offer an explicit reconciliation with the latest saved draft.

The redesign uses the existing **Create proposal** action at
`/dashboard/datasets/create` and the existing **My Drafts** workspace at
`/dashboard/datasets`. There is one draft inventory, search, count summary and
pagination. Its server-owned contract at
`GET /api/v2/supplier/dataset-drafts/workspace` combines owned draft records and
uses one filtered set for rows and counts. Title and ID search is literal and case
insensitive. The client does not combine separate page responses or infer a
material choice from the earlier sample flag.

Saved drafts resume at `/dashboard/datasets/drafts/:draftId`; existing proposal
records keep `/dashboard/datasets/:id` and their explicit Submit workflow. The
response kind selects that route internally. It does not create separate product
sections or a second preparation workflow. Old staging `/prepare` bookmarks
redirect to these proposal routes.

Main data types are separate from category, encoding and upload choice. Applicable
questions cover tables, audio, images, video, text and sensors, with optional
healthcare and egocentric context. Collection, planned full material and planned
sample quantities are separate supplier declarations. The license field records
the supplier's stated license; agreements and negotiation remain outside Kuinbee.

File intake, required file checks, pricing integration and admin submission for
new editor drafts are not available in this slice. Selecting a modality does not
enable a format or claim bytes were received. A current file pointer on an existing
proposal does not establish new inspection evidence. DICOM remains unqualified.
The connected implementation must provide real capacity, accepted capabilities,
exact content references and the preserved review/publication/access workflow
before final activation.

The editor, workspace API and draft routes are enabled only in local/staging.
Production continues to render the existing CreateDataset form. Its proposal
workflow is not activated by this draft-testing release. The editor retains the
existing dashboard palette, glass and background, with attached status, steps
and save actions. Related fields share a few responsive sections; controls and
quantity rows are ordinary form elements. The draft workspace uses one glass
surface, an unboxed summary/search and a table with row separators. Decorative
workspace shadows are removed while keyboard focus remains visible.

## Contract provenance

The vendored `@kuinbee/dataset-preparation-contracts` 0.2.0 tarball is generated
from backend commit `0f4b61606385fca4d1a42fcc18357028a972f9a9`. Its manifest identifies
the canonical source and hashes for the source, runtime, declarations and tarball.
`npm run test:contracts` verifies these against the installed package and lockfile.
The browser does not import backend files or database/runtime dependencies.

## Verification

The component browser suite renders the actual dashboard shell, brand assets,
navigation and theme control with loopback API fixtures. It covers all 21 ordinary
data-family/upload-choice declaration paths, partial saves/readback, three quantity
scopes, conditional questions, current category/source labels across pages,
stale/uncertain saves, transport retransmissions, nested reconciliation,
keyboard/mobile behavior and production guards. The combined inventory cases
cover mixed identities, more than 20 interleaved records, global filtered counts
and paging, literal title/ID search, late-response protection and forbidden or
malformed responses without an older API fallback. Responsive checks exercise
placement and control fit at 1280, 1024 and 390 pixels, mixed modality/context state
retention, visible keyboard focus and absence of decorative workspace shadows.

These fixtures do not qualify uploads, scanning, archive parsing, purchase access
or hosted deployment. Normal lint, type, runtime dependency audit and compiled
release checks remain required before staging promotion. Actual staging browser
acceptance and deployed refs are recorded separately in the workspace release
ledger.
