# Cloudinary preset read-only review

2026-10-03. Console environment p6esflub matches index.html CLOUDINARY_CLOUD_NAME. blog_upload matches CLOUDINARY_UPLOAD_PRESET.

Observed: Unsigned; overwrite false; random generated public ID; allowed_formats input empty. Advanced eval/on_success blank; return delete token off. No configuration values were changed and Save was not clicked.

Allowed formats restriction not configured. File size restrictions not established from the inspected UI; no assertion of account-level defaults or exploit testing. Unsigned uploads are separate from Firebase Auth and require separate abuse controls. Security gate remains BLOCKED pending limits review and raw Firestore HTML trust boundary.

Minimum proposed change, not applied: configure allowed formats to agreed image types and enforce server-side upload size limits through supported controls. Do not change cloud name/preset name or convert to Signed without separately scoping the necessary upload architecture changes.
