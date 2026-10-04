# Signed upload deployment
This PR changes only the upload path. Existing Firebase project, ADMIN_UID, sign-in providers and Firestore Rules stay unchanged.

## Configure before merge
Create a restricted Signed preset (suggested name: blog_signed_upload) in Cloudinary p6esflub; preserve image types, random/unique filenames, no overwrites and applicable account/preset image limits. Do not convert blog_upload early: main still needs it until cutover.
In Netlify kai-personal-website, set these environment variables for Functions in the preview and production contexts:
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- CLOUDINARY_SIGNED_PRESET (name of the new Signed preset)
Enter credentials directly in Netlify settings. Never commit or paste the secret into the conversation.

## Verify, then cut over
Run npm run test:upload.
Deploy Preview: normal admin login; upload disposable single/multiple images, verify preview/cover/watermark and saved article sync. Anonymous requests return 401; signed-in non-admin requests return 403. These live checks are additional to local synthetic-token tests.
After successful merge/deploy, disable unsigned blog_upload to close the existing bypass. Merely adding this signer while retaining the unsigned preset does not close the original risk.
Validate once more; remove disposable tests with appropriate deletion confirmation.

## Security boundaries
Firebase token signatures and mandatory claims are verified against fixed Google public keys. Only the existing admin can obtain signatures. No Firebase service-account key is required.
The signer never accepts client upload parameters, always assigns a random public ID with overwrite=false, and returns no API secret.
Cloudinary signatures have its documented one-hour validity; they are not one-time authorizations. Same public ID plus overwrite=false limits overwrite/reuse but is not a distributed rate limiter.
File bytes bypass Netlify. The client retains its 10MiB/type check, but server image/size limits depend on Cloudinary's supported preset/account controls. No claim of server size enforcement from client checks.
This cryptographic ID-token verification does not check Firebase token revocation. Existing tokens remain usable until expiry unless a separately scoped server revocation check is added.
Origin checking supplements token verification; it is not the authorization boundary.

## Rollback
Do not enable unsigned fallback in code. If cutover fails, restore the prior deployment only as a deliberate rollback with the corresponding preset state. Restoring unsigned uploads reopens the documented risk.

## References
https://firebase.google.com/docs/auth/admin/verify-id-tokens
https://cloudinary.com/documentation/authentication_signatures
https://docs.netlify.com/build/functions/get-started/
