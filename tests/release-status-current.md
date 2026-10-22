# Kai Personal Website V1.1 — Current release status
Updated 2026-10-17 after PR21 user-confirmed persistence, merge and production source verification. This report supersedes earlier gate summaries in review/.
GitHub main: fe8ba2828a00009833573db5c4b0f6d15ef758b0
Production: https://kai-personal-website.netlify.app/
Overall: BLOCKED for final-production-ready. The public site is already deployed.

User scope update: missing original image and physical-phone testing are deferred at the user's request. They are not marked PASS and no longer block this working scope. Active remaining gates: real non-admin authentication evidence and performance diagnosis. Signed-upload cutover is complete. Four dedicated test assets await deletion confirmation.

## Completed in this revision
- Authorized UX scope2026-10-17: PR23 consolidates mobile gestures/layout/image exit, saved text size, scroll progress/back-to-top, saved-article filtering/count/empty state, search clearing and native sharing with truthful clipboard-failure feedback. Head 12113a10cb7b2d340b627f16a8ced92060b4673d;56 local mock checks plus inline syntax passed. This commit is NetlifyReady (6ad3174ec5203a77cf644a7d), homepage/CSS HTTP200 with candidate program/CSS match. Browser tool remains unavailable; visual/native API/runtime validation pending. User requested direct implementation first and consolidated final testing; see final-validation-checklist.md. Only index.html/css/style.css changed, main confirmed fe8ba28 and production unchanged. Latest evidence browse-share/result.md. PR22 stays independent: earlierReady/code-delivery match, timing comparison pending. These candidate tests do not replace the original V1.1 gates.
- PR21 preference-storage safety fix merged fe8ba28 after user confirmed bookmark/like/theme reload persistence on2026-10-17;14 local behavior checks passed. Production index and utils bothHTTP200 and source comparison passed (only observed Netlify hosting-comment/HUD injections excluded). This is production source delivery evidence, not a new agent-run browser test. Temporary preview-state restoration not separately confirmed. No Firebase/Auth/Rules/config/article changes. See preferences-storage/result.md. No new performance measurement; scores remain dated2026-10-07.
- Current main remeasured 02:15 Taipei: mobile54/FCP9.911s/LCP10.061s/TBT0/CLS.092, accessibility100/best96/SEO100. Report https://pagespeed.web.dev/analysis/https-kai-personal-website-netlify-app/04616fg7hc?form_factor=mobile . Favicon fix has not resolved simulated mobile delay.
- PR18 CSS-only closed-dialog rendering merged eb531e2 after admin add/edit focus, Tab/Escape/Cancel, populated13-image edit fields and Add reset passed. No data saved or deleted. Final diff8 CSS lines only. Netlify production6ac5c40fcddc8d00092fbdd1 Published; CSS rule served, admin session active, add modal focus and16 loaded direct-article thumbnails verified. Details: closed-modal-rendering/result.md.
- PR19 optional font experiment closed without merge: mobile CLS.001 improved but desktop.228 and FCP/LCP did not improve (mobile LCP10.841s). Retain original production fonts. Details: optional-font-display/result.md.
- PR20 merged52994ac: CSS-only32rem initial grid reservation. Production desktop76/FCP1.887s/LCP2.367s/TBT0/CLS.004 versus baseline64/CLS.235. Production mobile54/FCP9.910s/LCP10.060s/TBT0/CLS.092 remains unresolved. Both accessibility100/best96/SEO100. https://pagespeed.web.dev/analysis/https-kai-personal-website-netlify-app/ueepq12ztz?form_factor=desktop . Empty search compact layout verified. Production CSS served, admin session active, post30years correct title/loaded main/16thumbs. Early JS experiment fully reverted. Details: early-public-render/result.md.
- PR18 combined261d868 PSI q1sqbj50m9: mobile54/FCP8.414s/LCP8.564s/TBT144ms/CLS.089; desktop76/FCP1.739s/LCP2.379s/TBT95ms/CLS.003. Mobile lab LCP decreased versus52994ac but score unchanged and TBT higher; not an overall performance PASS. Conflict resolved by merging main into branch as dae3db17 with exact same tree, success preview status verified, then expected-head squash merged.
- PR #16 merged and served in production: favicon limited to 64px PNG, HTTP200 image/png, 51×64, 3,629 body bytes. Same portrait source; only favicon href changed. Production post-30years still has correct title, loaded main image and16 thumbnails. Evidence: favicon-delivery/result.md.
- PR #17 image-priority experiment concluded and closed without merge. Initial geometry implementation added61ms forced layout; revised one-shot observer removed that attribution but paired preview runs did not establish sufficient benefit. Final candidate desktop62 vs baseline63, mobile54. No experimental helper added to main. Evidence: image-priority/result.md.
- PR #14: variable font ranges preserve the same families/weights and reduce repeated font CSS from 630,195 to 126,487 uncompressed bytes (~80%). Unique font URLs remain 112; this is CSS savings, not equivalent font binary savings. Preview/public deployment verified. Details: font-delivery/result.md.
- Signed upload PR #15 merged and deployed to production (219b3cf; Netlify deploy 6ac3a8affc824200088358d4). 20 local security/client tests pass. Preview function rejects GET 405, anonymous 401, forged token 401 and cross-origin 403. Real admin single/multiple upload, loaded watermark previews and cover selection pass in preview; real admin upload also passes in production. No article published. Old blog_upload converted from Unsigned to Signed with overwrite=false; direct unsigned upload now returns HTTP 400, “Upload preset must be whitelisted for unsigned uploads.” API secrets entered by user, never revealed/copied. Details: signed-upload/result.md.
- Final production article check: post-30years direct URL opens with correct article tab title, canonical URL, OG title and first image; carousel has 16 thumbnails and loaded main image. robots.txt and sitemap.xml return HTTP 200 and point to the current free Netlify production origin. Public curl approval timed out initially; one retry completed successfully. Browser web-fetch fallback failure is not evidence of a production outage.
- PR #12: invalid/empty image URLs now select a category image immediately instead of requesting Instagram as an image. Valid Cloudinary URLs, relative HTTP(S) URLs, navigation links and one-shot image error recovery retain their behavior. No production article data modified.
- Local regression checks passed for unsafe/empty input, category fallback, valid URLs, navigation behavior and inline script syntax.
- Preview: all 16 article thumbnails loaded, image 16 displayed, About portrait lightbox worked; no sampled console errors; 375px client/scroll widths matched.
- PR #13: browser tab titles now follow article open/close and history Back/Forward. Preview passed direct post-30years, close, Back, Forward, then post-9years from home.
- Production served the PR #12 helper and PR #13 title changes. Browser verification passed: direct post-30years displayed all 16 loaded thumbnails and main image; closing restored both / and the homepage title. Screenshot: revision-production.png.

## Latest performance evidence
2026-10-17 Slow4G/CPU4x trace received and analyzed:147,189events/~25.6s, settled viewport375.2×812. Main FCP/LCP3.811s, text node30. Main DOMContentLoaded begins12.729s after Firebase module evaluation; static article image requests13.826s. Initial document Layout1.561s, fonts1,627,475 encoded bytes/26files,30long tasks. No observed Firestore Listen before16.849s, so it is not the cause of initial paint waiting. Trace does not prove the exact initial-layout cause or equal Lighthouse conditions. Baseline collection complete; do not request duplicate slow baseline. PR22 draft f9ec8c6 moves7public calls earlier but retains routing/sync lifecycle;7local mock lifecycle checks pass, runtime and measured benefit pending. Preview deployment still processing and returned404 when checked. Production unchanged. See performance/slow-mobile-analysis.md.

Current main eb531e2 production measurement at12:03 Taipei: https://pagespeed.web.dev/analysis/https-kai-personal-website-netlify-app/n4yt7foqin?form_factor=desktop . Desktop81/FCP1.648s/LCP2.108s/TBT0/CLS.004/SI1.823s; mobile55/FCP8.413s/LCP8.563s/TBT2ms (display rounds0)/CLS.092/SI8.413s. Both accessibility100/best96/SEO100; no field data. Versus previous52994ac desktop76/mobile54 and mobile LCP10.060s, lab outcomes improved but mobile remains too slow. One production run does not prove universal causal speedup or satisfy Performance gate.

Cold-cache trace received and analyzed 2026-10-07: 44,657 events / 17.79s window, same main-frame FCP 830.84ms, final LCP candidate 2,147.72ms. Main resources are uncached; Auth iframe script remains cached. Last LCP precisely maps via PaintImage nodeId 263 to post-9years featured image, loading=lazy. Full-size favicon request transferred 252,146 bytes; Noto font resources total 1,357,534 bytes in this run. Concrete candidates: separately restrict favicon size, then evaluate first-screen featured image priority. No Firebase timing/Rules/Auth change justified. Responsive conditions differ; no causal before/after comparison or slow-mobile PASS. See performance/cold-cache-analysis.md. Baseline collection is now complete enough to define a scoped preview; do not request repeated same-condition recordings.

2026-10-07 user-supplied trace parsed successfully: 44,435 events, 6.56s recording window, same main-frame navigation FCP 879.68ms and final LCP candidate 1,713.07ms. Firestore Listen starts 1,985.55ms, after that paint. Multiple fonts/SDKs/images are cached; Responsive mode and Netlify HUD present. Network/CPU throttling and exact viewport not independently recorded. This establishes a useful cached baseline, not cold-load or slow-mobile PASS. Next evidence: fixed-viewport, signed-out, Disable cache + explicit No throttling comparison. Details: performance/no-throttling-analysis.md. No code modified on this evidence alone.

Pre-PR16 production measurement on 2026-10-07 (report shows 00:19 Asia/Taipei): https://pagespeed.web.dev/analysis/https-kai-personal-website-netlify-app/rqlqzwijhe?form_factor=mobile . Measured main 219b3cf, before current favicon-only 6e17f36. Performance 54, accessibility 100, best practices 96, SEO 100; FCP 9.9s, LCP 10.1s, TBT 0ms, CLS 0.092. Lighthouse 13.5.0 / Headless Chromium 153.0.8010.36; simulated Moto G Power, slow 4G. No field data. Do not claim these are a fresh production measurement of6e17f36 or that resource savings establish score improvement.

Current LCP breakdown: TTFB 190ms plus element render delay 1,420ms; simulated LCP is 10.1s. The critical dependency chain reaches 22,065ms and includes Firebase SDKs, Auth iframe and Firestore Listen retries. Console errors include two Listen timeouts and the known deferred original-image 404. These observations do not prove Firebase blocks first paint or that CRUD/Rules are defective. Unused CSS estimate 52KiB, render-blocking estimate 150ms, font display 30ms, image estimate 12KiB.

Diagnostic hypothesis only: an open Lighthouse report describes non-blocking module scripts retained in its simulated FCP graph (https://github.com/GoogleChrome/lighthouse/issues/17163). Its reproduction is not this site's trace and cannot establish this site's cause. Obtain a controlled observed trace before changing Firebase timing or script priority. Performance remains BLOCKED.

Earlier measurements retained below for comparison:
PR #14 mobile measurement completed after delayed report loading: https://pagespeed.web.dev/analysis/https-kai-personal-website-netlify-app/xuyt43nskc?form_factor=mobile . Performance 54, accessibility 100, best practices 96, SEO 100; FCP 9.9s, LCP 10.1s, TBT 0ms, CLS 0.092. Unused CSS estimate fell to 52KiB; render-blocking estimate 150ms. Single-run timing changes do not prove causality. Performance remains BLOCKED. The following is the prior complete baseline for comparison.

After PR #11, before PR #12/#13:
https://pagespeed.web.dev/analysis/https-kai-personal-website-netlify-app/edamgvvzsl?form_factor=mobile

Mobile Lighthouse: performance 54, accessibility 100, best practices 96, SEO 100.
FCP 10.4 s, LCP 10.6 s, TBT 0 ms, CLS 0.092.
Render-blocking estimated savings improved from 1,950 ms to 300 ms. Score did not improve.
Image savings estimate is 83 KiB after earlier 851 KiB baseline.
These are single lab runs, not real-user field metrics. No field data is available.
The LCP breakdown reports 190 ms TTFB + 1,540 ms rendering delay, while simulated metrics show 10.6 s. The dependency tree includes Firestore Listen retries up to about 30 s. This is a diagnostic lead, not proof that Firebase caused the simulated delay or that its rules are defective.
Official Lighthouse documentation distinguishes observed traces from simulated throttling:
https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md
Next performance step: obtain a controlled non-simulated throttling trace to identify the actual rendering dependency before changing Firebase timing or architecture. The current browser tool does not expose trace capture or network throttling controls; viewport tests are not a substitute.

## Phase 5 ten-item gate
| Check | Status | Evidence and scope |
| --- | --- | --- |
| File Structure | PASS | Main has compiled CSS, existing JS modules, vendored sanitizer |
| Code Integrity | PASS | Scoped changes and targeted checks; no config/Auth/Rules edits |
| Existing Functionality | PASS within tested scope | Public routing, search/filter, calculator/theme, image gallery; current image/title regression passed |
| Firebase | PASS within tested scope | Production initialization/read previously validated; lab retries require performance diagnosis |
| Firestore | PASS within tested scope | Admin CRUD/realtime and anonymous write denial previously validated; disposable test data cleaned |
| Authentication | BLOCKED for full sign-off | Admin flow passed; 2026-10-07 Firebase Users UI lists exactly one existing account, the admin. Real signed-in non-admin identity unavailable; no account created |
| UI | PASS within tested scope; physical phone SKIPPED | Desktop/mobile viewport checks passed; physical-phone test deferred by user; automated accessibility score 100 |
| Regression | PASS within tested scope; original image DEFERRED | Code regressions pass; missing original deferred by user; previous observer error no longer reproduced in sampled flows |
| Performance | BLOCKED | Latest PSI measured2026-10-07 at eb531e2: desktop81/LCP2.108s/CLS.004; mobile55/LCP8.563s/CLS.092. New slow trace analyzed2026-10-17; PR22 runtime/timing comparison pending, baseline collection complete |
| Security | PASS within tested scope | Signed signer deployed, real admin preview/production upload passed, old unsigned bypass denied; real non-admin account evidence is separately pending under Authentication; documented signature/revocation/size boundaries apply |

## Why this cannot all be closed by more code in one pass
1. Deferred by user: missing original 10_fu35wr.png. No longer a blocker for this working scope; a category placeholder does not recover the original.
2. Deferred by user: physical-phone evidence. No longer a blocker for this working scope; browser viewport emulation does not prove actual device behavior.
3. Identity evidence: a signed-in non-admin check needs an existing suitable account. Do not create/change Authentication just to claim a pass.
4. External configuration is now complete: signed endpoint merged, real admin upload validated, old unsigned bypass closed. Four dedicated test image assets need cleanup; no article or Firestore data was created for this test.
5. Performance diagnosis: deploy/measure cycles are necessary, but repeating the same simulation or making unrelated micro-edits cannot prove the remaining cause.
6. Process: previous one-fix-per-turn stops and stale gate documents prolonged closure. Continue independent authorized tasks in batches and maintain this single current status.

## AI arrangement
No additional AI subscription is required to finish the known code work.
Keep one implementation owner and one current main-based checklist.
Optional Gemini or Claude review can be useful for a bounded independent diff/performance review with the exact commit and evidence supplied. A reviewer without browser/account access can only provide static review, not runtime PASS.
Do not wait for Claude free usage to reset. More models cannot provide missing original files, physical phone evidence, account access, or a security acceptance decision.

## User-owned inputs still needed
- Configuration and live admin upload are complete. Missing original and phone testing are deferred.
- Availability of an existing non-admin test account; credentials must be entered through the normal login flow, never pasted into this report.
- All three supplied traces, including controlled Slow4G/CPU4x on2026-10-17, are analyzed; no repeated baseline recording requested. PR22 candidate preview/runtime and after-change timing are next once deployment is ready. Browser tools still fail during local execution setup. Firebase module, Auth and sync startup point are unchanged.
- PR18 management-form login and regression are complete. The separate question allowing a user-created non-admin test account remains unanswered; admin preview login does not authorize creating credentials. Controlled slow-network instructions: performance/slow-mobile-next-step.md.
- Confirmation for permanent cleanup of the four dedicated test assets (requested at the deletion dialog); no further general authorization requested.

No Firebase configuration, ADMIN_UID, Authentication settings or Firestore Rules changed.
