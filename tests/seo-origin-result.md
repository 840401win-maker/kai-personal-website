# SEO origin correction — 2026-10-03

User confirmed custom domain has not been purchased. Free Netlify production URL is the active origin.

PR #6 merged after exact origin-only validation and successful Netlify preview status. Main 29f035f94cadd4adad62821dcfaacec9abc1f567.

Only index.html, article-metadata.js, robots.txt and sitemap.xml changed (11 origin substitutions). Firebase/Auth/Firestore and article data unchanged.

Production robots references Netlify sitemap; all six sitemap URLs use Netlify origin. Production post-30years canonical/OG URL use its Netlify direct article URL. Preview BlogPosting and Person URLs also use Netlify origin. SEO-origin correction PASS. Custom domain purchase/binding is optional future work, not a blocker when free origin is chosen.

Overall release gate remains pending other outstanding validations: authenticated non-admin, physical mobile, performance and unresolved console error attribution; unsigned upload risk remains documented.
