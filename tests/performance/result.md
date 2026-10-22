# First delivery correction — 2026-10-03

Subsequent PR8 contrast correction merged after preview: main d85fc4f2d70cb42c76db694ec3541edabd613818. Existing slate-600 is used for light secondary text; dark slate-400 retained. Selected amber tag background is amber-700. Browser computed light text rgb(107,97,83), dark rgb(179,168,148), selected background rgb(113,76,32). Dark toggle restored. Screenshot contrast-preview.png. Full Lighthouse rerun after PR8 still pending; do not claim 100 accessibility.

PR #7 merged; main 5bc39e9f91198430b47dbc0de6cb3aa2827a0ddb. Production HTML verified.

Nonblocking Google Fonts CSS, card width limit 800, thumbnail width limit 160, sort accessible name, article dialog fallback name. Only index.html changed; Firebase/Auth/Firestore and stored image URLs untouched.

Tests PASS: inline JS syntax; URL transformation preserves existing watermark and leaves non-Cloudinary unchanged; labels. Preview all 16 thumbnails loaded with natural width 160, selected full image 16 loaded without width limit; font stylesheet media switched to all. Screenshot delivery-preview.png.

Missing image attributed to custom document O85M4CevGqYiILs7RGu6, title 我的第一個 300 萬. Original /upload/v1786221349/10_fu35wr.png and transformed URL both HTTP404. Cloudinary exact public-ID search finds no assets. Correct source image required; user asked for replacement URL or reupload. No real article mutated.

Production PageSpeed rerun completed: performance 60, accessibility 97, best practices 96, SEO100; FCP4.2s, LCP6.5s, TBT240ms, CLS.083. Single slow4G lab run; improved but performance not passed. Report https://pagespeed.web.dev/analysis/https-kai-personal-website-netlify-app/5e8v7ellkv?form_factor=mobile. Contrast findings isolated to secondary labels/dates/likes/footer and selected amber tags; PR8 prepared for preview. Runtime error attribution, physical phone and authenticated non-admin tests remain pending. Unsigned upload risk still unresolved. Overall final gate BLOCKED.
