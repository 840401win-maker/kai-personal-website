# Signed upload: concrete minimum scope
Prepared 2026-10-04 from main. This is a reviewed implementation proposal, not deployed code.

Problem: the public unsigned Cloudinary preset can be used without Firebase admin login. Hiding the upload button only protects the UI. Restricting formats reduces misuse but does not authenticate the uploader.

Recommended flow:
1. Existing admin session obtains a Firebase ID token through the existing client SDK.
2. POST the token in an Authorization header to a same-origin Netlify upload-signature function. Never put it in query strings or logs.
3. Server cryptographically verifies the Firebase token signature, issuer, audience, expiry and subject; compares UID with the existing admin UID. Missing/expired token returns 401; valid non-admin token returns 403. Decoding a JWT without verifying its signature is insufficient.
4. Server builds a fixed allowlist of Cloudinary upload parameters and signs them with a server-only Cloudinary API secret. It must not sign arbitrary client-supplied transformations, folders or public IDs. Return short-lived timestamp, signature, API key and fixed preset; Cache-Control: no-store.
5. Browser uploads directly to Cloudinary with that signature, retaining current preview, watermark and article-save behavior. No file contents need to pass through Netlify.
6. After preview/admin/non-admin checks succeed, disable the old unsigned entry point. Leaving blog_upload unsigned would preserve the original bypass even after a signed flow is added.

Minimum code scope: index.html handleImageFileUpload; one new netlify/functions/upload-signature endpoint; server dependency/packaging files and deployment documentation. Existing js/firebase.js, js/auth.js, Firestore Rules and configured ADMIN_UID remain unchanged. Any server UID must match the existing value; never replace it with a client-supplied UID.

Required deployment inputs: Cloudinary API key and API secret in Netlify server environment settings; a restricted signed preset. Secrets must not be committed, exposed in HTML, copied into reports or entered into this chat. Configure them directly in the service UI.

Limits: a signature authorizes upload parameters, not the contents of a specific browser file. Client-side size checks are not server enforcement. Verify preset-supported size/type limits and rate limiting before claiming complete abuse protection. Do not claim that a timestamp alone creates a one-use token.

Validation before cutover: anonymous/forged/expired token rejected; non-admin token rejected; admin signature works; disallowed parameters rejected; secret absent from client response; image limits honored by Cloudinary; multi-image upload and one-time watermark retained; article create/edit and static galleries regressions pass. Disposable upload cleanup still needs exact deletion confirmation when irreversible.

Remaining external dependency: server environment credentials and preset cutover. Another AI cannot supply account credentials or prove live authorization without a suitable test identity.

Primary references:
- https://firebase.google.com/docs/auth/admin/verify-id-tokens
- https://cloudinary.com/documentation/client_side_uploading
- https://cloudinary.com/documentation/authentication_signatures
