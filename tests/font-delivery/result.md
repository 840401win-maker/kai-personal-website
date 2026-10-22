# Font delivery revision — 2026-10-04

PR #14 merged and production font URL verified. Main e862164628db568360ff55d1da9e01f1d030a636.
Only index.html font query changed: Noto Sans TC 300..700 and Plus Jakarta Sans 400..800. Font families, available weights, display=swap and nonblocking stylesheet load retained. Firebase, Auth, Rules, config and article data untouched.

Modern Chrome UA response comparison:
- Before: 630,195 uncompressed bytes, 177,096 local gzip bytes, 560 font-face declarations, 112 unique font URLs.
- After: 126,487 uncompressed bytes, 35,695 local gzip bytes, 112 font-face declarations, 112 unique font URLs.
- About 80% smaller CSS. This removes repeated CSS declarations; it does not claim 80% smaller font binaries. Actual negotiated network compression can differ from local gzip.

Preview checks: CSS changes to media=all; computed font family/weights retained; Chinese content and dark mode render; mobile document/scroll widths match; article modal contains 16 thumbnails; sampled console errors empty. Production browser confirmed the new URL and font family. Screenshot: production.png.

Official range API: https://developers.google.com/fonts/docs/css2
New mobile PageSpeed report: https://pagespeed.web.dev/analysis/https-kai-personal-website-netlify-app/xuyt43nskc?form_factor=mobile
Measurement completed: mobile performance 54, accessibility 100, best practices 96, SEO 100. FCP 9.9s, LCP 10.1s, TBT 0ms, CLS 0.092. Prior complete baseline FCP 10.4s/LCP 10.6s; score remains 54. Unused CSS estimated savings fell from 187KiB to 52KiB; render blocking estimated savings 150ms. Single lab comparison does not establish causal improvement or real-user results. Performance gate remains BLOCKED.
