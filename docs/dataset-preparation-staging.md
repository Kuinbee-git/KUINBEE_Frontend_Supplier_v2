# Supplier Dataset preparation foundation

This is the first staging slice of the connected supplier Dataset redesign. The
four screens are Basics, Files & contents, Dataset details and Review draft.
Suppliers can save a valid incomplete draft with only a title, choose Sample only,
Full dataset only or Full dataset + sample, and resume it step by step.

The editor uses the real private backend API at
`/api/v2/supplier/dataset-drafts`. Saves require an acknowledged generation;
uncertain responses retain the same request ID for retry. Conflicting saves retain
local input and offer an explicit reconciliation with the latest saved draft.
Existing proposals and their explicit Submit workflow remain reachable.

Main data types are separate from category, encoding and upload choice. Applicable
questions cover tables, audio, images, video, text and sensors, with optional
healthcare and egocentric context. Collection, planned full material and planned
sample quantities are separate supplier declarations. The license field records
the supplier's stated license; agreements and negotiation remain outside Kuinbee.

File intake, required file checks, pricing integration and admin submission are
not available in this slice. Selecting a modality does not enable a format or
claim bytes were received. DICOM remains unqualified. The connected implementation
must provide real capacity, accepted capabilities, exact content references and
the preserved review/publication/access workflow before final activation.

The creator entry, routes and API client are enabled only in local/staging.
Deployment targets the supplier staging branch; main remains production.

## Contract provenance

The vendored `@kuinbee/dataset-preparation-contracts` tarball is generated from
backend commit `1f95dadf5b09e45d0543def0c849509b40ccf3e6`. Its manifest identifies
the canonical source and hashes for the source, runtime, declarations and tarball.
`npm run test:contracts` verifies these against the installed package and lockfile.
The browser does not import backend files or database/runtime dependencies.

## Verification

The component browser suite exercises all 21 ordinary data-family/upload-choice
declaration paths, partial saves/readback, three quantity scopes, conditional
questions, current category/source labels across pages, stale/uncertain saves,
native transport retransmissions, nested reconciliation, keyboard/mobile behavior
and production guards. These loopback fixtures test UI behavior; they do not
qualify uploads, scanning, archive parsing, purchase access or hosted deployment.

The normal lint, type, runtime dependency audit and compiled release checks are
required before staging promotion. Actual protected staging browser acceptance is
recorded separately in the workspace release ledger.
