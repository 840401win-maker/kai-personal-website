# Production multi-image validation — 2026-10-03

Baseline main: 8fcad9ec98c8878bfe37e7486974344a2f21ab98.

PASS: edited dedicated test article xNKacTbnE4urwJI6feHZ, appended two images to its existing image, selected the second new upload as cover, saved, and reopened edit. Three newline-separated URLs persisted in the expected cover-first order. Each stored URL contains exactly one watermark transformation. Card and carousel cover loaded with f_auto,q_auto. Switching to image 3 loaded the expected asset successfully.

Cloudinary asset public IDs used in this test:
- pqbli7cdzmxpkiwkv5ru (existing initial test upload)
- akrusgltllnwmrn0mdqr (new upload)
- uncswezyefpaybm14voj (new upload and selected cover)

Evidence: multi-image-production.png. Test article and assets remain for review; permanent deletion requires specific confirmation immediately before deletion. No real articles were edited in this validation.

This closes the multi-image workflow item in final-gate-security-update.md. Other remaining items there are unresolved. Overall final-production-ready remains BLOCKED.
