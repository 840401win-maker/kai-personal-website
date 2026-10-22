# Closed dialog rendering preview

## Current outcome — 2026-10-07

Fresh production PSI at12:03 Taipei, main eb531e2: https://pagespeed.web.dev/analysis/https-kai-personal-website-netlify-app/n4yt7foqin?form_factor=desktop . Desktop81/FCP1.648s/LCP2.108s/TBT0/CLS.004/SI1.823s; mobile55/FCP8.413s/LCP8.563s/TBT2ms (UI rounds0)/CLS.092/SI8.413s. Both accessibility100/best96/SEO100, no field data. Desktop score and mobile LCP improved versus previous production lab result; mobile remains slow, overall Performance still BLOCKED. Screenshot: production-performance.png.

PR18 merged as eb531e2803cf707ace1be2854af9dd032e3d742c. Production6ac5c40fcddc8d00092fbdd1 Published at12:01 Taipei. Final CSS blob0dcd73ca served,7cards loaded, persisted admin session active. Add opens with close focus and visible contents, Escape closes. Direct post-30years has correct title/canonical, loaded1000px main and all16 loaded thumbnails. No article writes. Screenshot: production-article.png. The paragraphs below are historical preview evidence.

Admin regression PASS at261d868 after the user signed in normally. Add opens with close button focused; Tab reaches title and Shift+Tab returns to close. Escape restores addPostBtn. Edit opens the existing Aug9 article with its correct title, category, summary and13 image URLs. Cancel restores the originating Edit button; reopening Add clears title/images and changes submit text back to Publish. Open content-visibility is visible and closed is hidden. Actual viewport614×668; card512×573.8 at51.2,47.1 fits. No save, publish, upload or delete. Screenshot: admin-edit.png. This is browser viewport evidence, not physical-phone PASS.

Combined PSI report https://pagespeed.web.dev/analysis/https-deploy-preview-18--kai-personal-website-netlify-app/q1sqbj50m9?form_factor=mobile measured261d868 /6ac5bf737af17e00087ee58c at11:57 Taipei: mobile54, FCP8.414s, LCP8.564s, TBT144ms, CLS.089, SI8.414s; desktop76, FCP1.739s, LCP2.379s, TBT95ms, CLS.003, SI2.166s. Both accessibility100; preview best92/SEO69 is not a production SEO verdict. Relative to production52994ac, mobile lab LCP decreased from10.060s while score remained54 and TBT increased from0. Overall Performance remains BLOCKED; no guaranteed causal speedup claimed.

Conflict resolved by a non-forced fast-forward to merge commit dae3db17f32f54b76b9a4b4ee8387fb5037db6c7, parents261d868 and52994ac. Both repository trees inspected recursively: all files except css/style.css identical, no missing entries; selected exact tested tree2e10ca06eb64cf9d0cca2838607b027b3f7d5fb5. Ready Netlify preview6ac5c3ce0570e40008d4beca and success status confirmed. Final PR diff8 CSS additions only. No Firebase/Auth/Firestore changes. Squash merge expected-head lease matched dae3db17.

Main baseline: 6e17f3669d76db6f4858b5b47e53d935185cf51a. PR18 draft, final preview head31506b4fba6910cf79e2c3e87c3005ea8c675bee, deploy6ac539f5cf56d700083fda59. CSS only,8 added lines.

Initial discrete content-visibility transition prevented immediate focus when opening dialogs. Removed that transition before release; final version restores immediate focus. Closed contents hide immediately; existing backdrop opacity fade remains. Unsupported browsers retain previous behavior.

Browser public tests PASS: about open/close and focus return, portrait lightbox loaded2000px and close focus, calculator2small+1big nights =1800, Escape restores trigger, login opens with Email focused, article direct30years with16 thumbnails, next/16th images loaded1000px, close route restores homepage. Final closed modals compute content-visibility:hidden; open compute visible. No credentials entered, no article or Firestore write.

Admin add/edit form regression pending normal preview login. Do not merge before this test. Preview tab52 retained for handoff. Requested375×812 viewport remained actual1265×720; reset override. No new mobile runtime PASS claimed; physical-phone test remains user-deferred.

After PR20 merged, synchronized preview CSS with current main52994ac. New head261d8689681cef7f1b4b81cffc6b342b5b1383a2 contains deployed grid reservation plus8dialog lines. Served combined CSS confirmed,7cards loaded, about close button and login Email immediate focus pass. Left at login for user; no admin session. Earlier PSI below measures isolated31506b4, not this combined head. Final combined measurement must follow admin add/edit regression before merge.

PSI final preview: https://pagespeed.web.dev/analysis/https-deploy-preview-18--kai-personal-website-netlify-app/5c0h5jphiq?form_factor=mobile . Mobile55/FCP8.412s/LCP8.562s/TBT26ms/CLS.089/SI8.412s. Desktop64/FCP1.731s/LCP2.751s/TBT21ms/CLS.234/SI2.030s. Both accessibility100; preview best-practices92 and SEO69, not production SEO verdict. Google Fonts1335KiB, FontAwesome299KiB, total3984KiB in mobile report. Does not establish substantial font-byte savings or performance gate PASS.

Earlier PR18 candidate50eef mobile55/FCP8.407s/LCP8.557s/TBT63ms/CLS.089, https://pagespeed.web.dev/analysis/https-deploy-preview-18--kai-personal-website-netlify-app/ohfh1bhikd?form_factor=mobile . This candidate failed focus regression and must not be deployed.

Official rationale: https://web.dev/articles/content-visibility . CSS hiding can skip layout/paint while preserving DOM state. Benefit must still be measured, not inferred from feature support.
