# Portfolio analytics

Account: Ramon JM — Portfolio (`408921960`), independent of Arcera.
Property: Ramon JM — Portfolio (`555216073`), Toronto timezone, CAD.
Web stream: Ramon JM — Portfolio web (`15819220256`), https://www.ramonjm.com.
Measurement ID: `G-JYQY36HHTG`, configured as `NEXT_PUBLIC_GA_MEASUREMENT_ID`
in Vercel Production. Enhanced measurement is disabled with user approval.
Dashboard: https://analytics.google.com/analytics/web/#/a408921960p555216073/reports/intelligenthome

Redeploy from this workspace with private-media included, per
shakepay-private-study.md, whenever changing tracking code or configuration.

In Google Analytics Admin → Data streams → the portfolio web stream, turn OFF
Enhanced measurement. The app sends page views itself, including client-side
navigation. Automatic history measurement would duplicate those views; automatic
form measurement must stay off on the private study access form.

The Google tag loads only after a visitor allows analytics, and only on
ramonjm.com, www.ramonjm.com, or ramonjm.vercel.app. No ID means no tag or banner.
Preview deployments and localhost do not collect data.

Events:
- `page_view`: portfolio and case-study visits. Query strings, fragments, and
  referrers are excluded. Pathnames remain available in Pages and screens.
- `private_case_study_view`: Shakepay content rendered after server-side access
  validation, including a return visit with an existing valid access cookie.
  Parameters: `study_name=shakepay`, `access_state=authorized`.
  The access form, incorrect code, and a mere visit to /shakepay do NOT emit this.
  This is a content-view signal, not a count of new code submissions.

No access code, session token, visitor identity, or private study content is sent.
Advertising storage, signals, and personalization are disabled. A preferences
button permits withdrawing consent. Declining or ad blockers means visits will
not be counted; these are not exhaustive server access logs.

Verify after activation in GA Realtime: accept analytics, visit Tracer, then
open Shakepay with a valid code. Confirm page_view and private_case_study_view.
Mark private_case_study_view as a key event in GA Admin if desired. GA cannot
identify the individual person who viewed the study. Avoid using a shared
code as an identity signal.

References:
https://developers.google.com/analytics/devguides/collection/ga4/views
https://developers.google.com/tag-platform/security/concepts/consent-mode

Activation verified 2026-09-21: production deployment
`dpl_GsYkmqWaTQmvMVsktYF3iQcTawoA`. Live authenticated Shakepay navigation
sent page_view and private_case_study_view (study_name=shakepay,
access_state=authorized) to G-JYQY36HHTG; Google's collection endpoint returned
HTTP 204. The new GA dashboard may take time to populate.
