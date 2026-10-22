# PR #2 runtime validation

2026-10-03. PR head b39650083e9e2b691849b0bacf4cc673ea4aff4f.

HTTP/1.1 comparison using curl:

| Route | Production | PR #2 preview |
| --- | --- | --- |
| /post/% | 400 | 400 |
| /post/%FF | 500 | 200 |
| /post/%E0%A4%A | 400 | 400 |
| /post/post-30years | 200 | 200 |

Browser preview /post/%FF renders homepage with 7 posts. Search for 30 produces matching cards. Captured error logs empty. Normal post-30years direct navigation opens article. Close changes URL to /; Back restores article URL and open modal classes; Forward restores / and opacity-0 pointer-events-none modal classes.

Conclusion: PR #2 targeted runtime validation PASS for invalid UTF-8 percent encoding %FF. Incomplete percent encodings still return 400 on both sites; the earlier browser protocol error does not establish an Edge failure for these requests. Exact infrastructure rejection layer was not instrumented.

Gemini static review PASS supplied by user. PR remains draft and unmerged pending user authorization. Full V1.1 readiness still blocked on remaining authentication/CRUD, mobile device checks and unresolved prior gate items.
