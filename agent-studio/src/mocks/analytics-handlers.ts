import { http, HttpResponse } from "msw";

// Block both the direct PostHog ingestion endpoint and the BezotCorp reverse
// proxy (z.bezotcorp.dev) used by the library telemetry service so mock-mode
// builds never send analytics events to PostHog.
export const ANALYTICS_HANDLERS = [
  http.post("https://us.i.posthog.com/e", async () =>
    HttpResponse.json(null, { status: 200 }),
  ),
  http.post("https://z.bezotcorp.dev/*", async () =>
    HttpResponse.json(null, { status: 200 }),
  ),
];
