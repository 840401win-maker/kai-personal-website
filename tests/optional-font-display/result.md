# Optional font experiment — closed without merge

PR19: https://github.com/840401win-maker/kai-personal-website/pull/19 . Preview885278c7188538b1546a40fb4c7d709059da205f, deploy6ac53b25954b7600081d1174. One-line Google Fonts display parameter change, no family/weight changes. Slow loads can keep fallback for the current navigation.

Baseline main6e17 mobile54/FCP9.911s/LCP10.061s/TBT0/CLS.092, desktop64/FCP1.891s/LCP2.391s/TBT0/CLS.235: https://pagespeed.web.dev/analysis/https-kai-personal-website-netlify-app/04616fg7hc?form_factor=mobile

Candidate mobile56/FCP10.391s/LCP10.841s/TBT6ms/CLS.001, desktop62/FCP1.930s/LCP2.750s/TBT19ms/CLS.228: https://pagespeed.web.dev/analysis/https-deploy-preview-19--kai-personal-website-netlify-app/12f2j39so4?form_factor=mobile

Both accessibility100; preview best92/SEO69 are not production verdicts. Public visual/read-only tests pass:7cards loaded,30year search returns article, empty search no results, about focus/close, direct30year title/16thumbs/main1000px/no horizontal overflow at1265×720. No new mobile runtime check, settings/data/auth writes or credentials.

Mobile layout stability improved but overall FCP/LCP and desktop stability did not establish sufficient benefit. Closed without merge; production retains swap. Desktop culprit panel attributes.228 to footer. Font rows are clues, not proof of font causality.

Next bounded diagnosis: empty grid before DOMContentLoaded waits for module imports. Earlier static rendering can reserve actual card layout and discover images sooner, without changing Firebase loading or Auth/Firestore logic. PR20 evaluates this independently.
