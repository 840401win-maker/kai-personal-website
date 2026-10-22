# Precompiled utilities validation — 2026-10-03

PR9 merged. Main 1c5682f7722f63dd2ccf1cd635c6e1a57a334fc9.

Replace Tailwind 3.4.17 browser compiler with 33,303-character minified CSS generated using the identical original palette, fonts and class-based dark mode. Pinned dev dependency, build config, input CSS and maintenance instructions checked in. Netlify serves committed assets; deployment build settings unchanged. Config scans index and js; whitespace-pre-line safelisted for current custom HTML. Future arbitrary custom article classes require adding to safelist/rebuilding; this is a maintenance constraint.

Preview PASS: no compiler script; light background rgb(250,248,244); dark background rgb(35,32,28); grid display present; viewport375 client/scroll both375; modal359.2; carousel16 selected and loaded; no captured error logs. Theme restored. Production HTML confirms stylesheet and no compiler/config; independent production page error log empty; search30 returned4; reset search. Screenshots compiled-preview.png and compiled-production.png.

Observer error no longer reproduced in these fresh preview/production loads. This is runtime evidence following compiler removal, not a conclusive original stack-trace attribution.

Official mobile PageSpeed rerun: performance54, accessibility100, best practices96, SEO100; FCP10.4s, LCP13.0s, TBT0ms, CLS.093. https://pagespeed.web.dev/analysis/https-kai-personal-website-netlify-app/v2n03zim8l?form_factor=mobile. Do not claim a faster lab result: previous run was60 and LCP6.5s. Render-blocking estimated savings decreased to1,950ms and compiler JS is absent; remaining blocking resources are site CSS and Font Awesome CSS. Image delivery potential savings851KiB. Single-run network variability or other delays require investigation before full performance PASS. Existing 300萬 image404 still requires original or replacement. Physical phone/non-admin test and unsigned upload risk remain unresolved; overall final-production-ready BLOCKED.
