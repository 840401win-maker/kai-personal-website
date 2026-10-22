# Slow4G trace analysis — 2026-10-17

Source supplied by user: Trace-20261017T082326.json.gz. Analyzed locally; raw trace not uploaded or committed. Sanitized network summary removes URL queries/fragments. Current GitHub main is fe8ba2828a00009833573db5c4b0f6d15ef758b0; a commit ID is not embedded in the trace, so do not claim a cryptographic trace-to-deploy match.

## Conditions and measured outcome

- DevTools trace, recorded2026-10-17 08:23:26 Taipei,147,189 events, approximately25.6s after main navigation.
- Metadata confirms Responsive, CPU throttling4, Slow4G. Network metadata: download180000, upload84375, latency562.5 (raw units as stored); no conversion to a Lighthouse-equivalent profile claimed.
- Viewport paint event settles at375.2×812 CSS pixels, DPR approximately2; hostDPR1.25 is a separate host value. Initial pre-meta viewport980×2121.6 is transient and is not the settled viewport.
- Main-frame FCP and sole LCP candidate both3811.08ms after the main navigation. LCP is introductory paragraph node30, not an article image. This is an observed throttled DevTools recording, not a new PageSpeed score and not an apples-to-apples improvement over prior simulated8.563s.
- Main resource response events report fromCache:false. Disable-cache UI state is not separately stored in the selected metadata; report observed cache behavior rather than infer the checkbox state.

## Concrete findings

| Main-navigation time | Observation |
|---|---|
|2.110–3.670s|Initial main-document Layout lasts1560.756ms (164 objects). Root is document; exact cause not isolated.|
|3.811s|First content and introductory-text LCP painted.|
|3.826–3.839s|Main inline script evaluates and registers DOMContentLoaded callback.|
|4.353–12.205s|Firebase SDK dependencies download; Firestore SDK is the last of these to finish.|
|12.583–12.714s|Module evaluation on main thread.|
|12.729–12.906s|Main-document DOMContentLoaded dispatch and existing homepage initializer callback.|
|13.826s|Static article image requests begin. This is discovery timing, not proof of visible card completion.|
|16.849s|First Firestore Listen request starts, after initial paint and the public bootstrap.|

The HTML places public rendering inside DOMContentLoaded; the deferred Firebase module and its dependency graph delay that event. This establishes an unnecessary dependency for static article availability. It does not establish that Firestore Listen causes first paint delay. See [DOMContentLoaded semantics](https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event).

Fonts transfer1,627,475 encoded bytes in this recording and trigger subsequent layouts; a low-bandwidth cost worth separate evaluation. Neither this total nor coincident layout timing proves fonts explain the entire first Layout or provides an exact savings estimate. The known missing10_fu35wr original still returns404 and remains user-deferred. Netlify public HUD and about:srcdoc are present; iframe markers must not be counted as main-document DOMContentLoaded.

## Bounded revision

PR22: https://github.com/840401win-maker/kai-personal-website/pull/22 . Draft head f9ec8c6d07e6f69409b9da71586d0113e550f823. Only index.html changes: move7 public initializers to the tail of the existing inline script after DOM and handlers exist. Keep initRouting and window.fb/fb-ready sync gate at DOMContentLoaded. This preserves the custom-route timeout start; moving it earlier could time out before slow SDK/custom data arrives. Firebase module/config, ADMIN_UID, Auth, Rules, Firestore code, article data and CSS unchanged.

Seven local lifecycle checks and inline syntax pass: public setup without SDK, no early route/sync, SDK late/early/already-ready ordering, once-only sync, existing auth listener and DOM availability. These use mocked public initializer functions; no real DOM rendering or speed benefit is inferred from them.

Prior PR20's4-call early-render experiment failed to improve PSI and was reverted. New justification is the observed13s delay in static-card resource discovery; the new candidate moves7 calls but deliberately leaves route timing unchanged. Target is earlier card availability, not an assumed improvement to text LCP. Keep draft until preview runtime and observed before/after timing support release. Existing CSS grid reservation must remain present.

Production remains fe8ba28. Overall Performance gate remains BLOCKED, with baseline collection now complete; do not request a duplicate baseline. A later preview recording under the same conditions would be an after-change comparison, not redoing this supplied trace. Non-admin Authentication gate remains separate.

Deployment follow-up: Netlify preview6ad2c171f48eddc8eba8363d was still processing when checked; the preview URL returned404 while unavailable. This does not establish a production outage or a candidate bug. Browser tool still fails during local sandbox startup. No preview rendering, code-delivery or post-change timing PASS claimed yet. Recheck ready status before requesting a user preview test.

Later2026-10-17 follow-up: GitHub Netlify comment reports preview6ad2c171f48eddc8eba8363d ready at f9ec8c6. Public GET now200 and embedded program equals the tested candidate. Code delivery verified. Browser runtime and timing comparison remain pending; production unchanged.
