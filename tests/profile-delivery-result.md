# Deferred profile delivery — 2026-10-03

PR10 merged: main b20bc5f0926a18f13d43b29bde53b1e413671c7c. Four About modal images deferred until open, preview delivery480px, homepage avatar256px, logo96px. Full-size lightbox URLs unchanged. Only index.html changed; no stored article, Firebase/Auth/Firestore changes and no new CSS classes.

Preview PASS: initially four About images have no src and have data-src; after About open all four load with naturalWidth480. Profile lightbox uses original full-size URL; close works. Screenshot profile-preview.png. Subsequent production HTML fetch contains all four data-src attributes, confirming rollout. Official mobile performance rerun started.

Existing 300萬 missing original, phone/non-admin checks and unsigned upload risk remain unresolved. Performance requires rerun; no score improvement presumed.
