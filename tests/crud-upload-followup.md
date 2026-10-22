# CRUD / upload follow-up 2026-10-03

User authorized deletion of old test and reupload. Old document igNa6VneXxYivgVLrjYQ deleted through article UI; both tabs postsGrid no longer contain old title. An already-open modal in second tab retained stale old content (observed).
Uploaded review/images/01.png (existing public original) via website file chooser. Returned https://res.cloudinary.com/p6esflub/image/upload/v1790996243/pqbli7cdzmxpkiwkv5ru.png. Published [TEST] V1.1 UPLOAD 20261003. Second tab synced; carousel image loaded (naturalWidth > 0). New test post and uploaded asset remain intentionally pending cleanup confirmation.
Logout and refresh hide addPostBtn. This verifies UI withdrawal, not server-side non-admin write rejection.

Newly observed existing bug: old single image became 6 carousel items after edit. index.html line 1409 joins image URLs with comma; line 1519 splits on every comma. Cloudinary transformation URLs contain commas, so edit breaks image list and can repeat watermarks. Impact: custom post edit corrupts image URLs. Minimum scope: image-list input serialization/parsing and watermark idempotency, retaining existing data compatibility. Not modified. Firestore config/rules/auth unchanged.

Functional observations PASS for create/edit text/delete/sync/upload/logout. Edit image integrity FAIL. Overall gate remains BLOCKED.
