# Initial article grid stability

PR20 final scope CSS-only: reserve32rem while #postsGrid is empty AND its adjacent #emptyState remains hidden. Search with no results shows the existing empty state and grid min-height0px/height0px, so no blank reservation persists. Unsupported :has browsers retain prior behavior.

Initial experiment fae856d moved4 public initializer calls earlier. Syntax and public search/sort/theme reload/static direct30years/browser back passed;7cards loaded after Firestore update, valid custom JEdxU4Mrihz9qg3cpYnr direct route opened13thumbs. Legacy xNKacTbnE4urwJI6feHZ is no longer a current article, not a regression. Its absence was confirmed by current7card DOM and the valid current ID.

Initial measurement mobile54/FCP9.912s/LCP10.062s/TBT19ms/CLS.089; desktop63/FCP1.891s/LCP2.711s/TBT2ms/CLS.234. https://pagespeed.web.dev/analysis/https-deploy-preview-20--kai-personal-website-netlify-app/fe56oqrd7x?form_factor=mobile . No meaningful benefit established. Reverted all index edits; local index.html is archived experimental source, not final candidate.

Final head38febc4b7f6b6ddc240a21ad9df768c5a693153a, deploy6ac53e7b3b4a4b000833ebe1. Net diff only css/style.css,6added lines. Original module downloads, DOMContentLoaded behavior, Auth, Firestore and routing unchanged. CSS delivered and no-result compact layout verified in browser.

Final preview: desktop73/FCP1.891s/LCP2.731s/TBT0/CLS.003/SI2.308s versus baseline64/CLS.235. Mobile54/FCP9.910s/LCP10.060s/TBT30ms/CLS.089/SI9.910s versus baseline54/CLS.092. https://pagespeed.web.dev/analysis/https-deploy-preview-20--kai-personal-website-netlify-app/szygskou9p?form_factor=desktop . Clear desktop layout stability benefit, no LCP benefit claimed. Accessibility100. Preview SEO69 not production verdict.

Merged PR20 as52994ac27806f9d56d716fedf1594710f13f3463. Production served the exact grid reservation CSS; existing admin session persisted, direct30year article title/16thumbs/main1000px passed.

Postdeploy production PSI at02:35Taipei: desktop76/FCP1.887s/LCP2.367s/TBT0/CLS.004/SI2.209s; mobile54/FCP9.910s/LCP10.060s/TBT0/CLS.092/SI9.910s. Both accessibility100/best96/SEO100. No field data available. https://pagespeed.web.dev/analysis/https-kai-personal-website-netlify-app/ueepq12ztz?form_factor=desktop . Final performance gate remains BLOCKED for slow mobile simulated FCP/LCP.

Evidence screenshots: production-performance.png, production-article.png; preview-performance.png is separately labeled preview.
