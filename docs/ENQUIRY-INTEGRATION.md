# Enquiry interface — implemented PHP, not yet live

The confirmed target is PHP 8.3/cURL, not Workers. See [PHP deployment instructions](PHP-DEPLOYMENT.md) for exact upload/configuration paths, limits, tests and activation gates. The GitHub Pages demo stays disabled and makes no readiness/submission requests.

## API

Production opts into same-origin `./api/enquiry.php`. HTTPS GET returns `200` with `{ok:true,code:"ready",enabled:true,token:"…"}` only when the private configuration is enabled/valid and the state directory is usable. It sends no mail. Disabled/missing config returns safe 503. Tokens are signed, IP-bound, age 3–3600 seconds, no cookie/session.

HTTPS POST requires exact Origin and multipart FormData. Six required trimmed fields: `fullName` (120 characters), `email` (254), `phone` (120, 7–15 digits), `location` (120), `category` (allowlist), `description` (5000, multiline). Include the readiness `token`, empty `website` honeypot and repeated `photos[]` files. File arrays are normalised by PHP to `$_FILES['photos']`. No customer input controls recipient/sender.

Categories, in UI order: `full-house`, `partial-house`, `bereavement`, `garage`, `furniture`, `trade`, `commercial`, `bin-store`, `tenancy`, `garden`, `other`. JS/PHP labels are matched by tests/fixtures and must remain in sync. The frontend prepares optional photos as JPEG Files; use FormData, never JSON.stringify(File).

Budgets: at most five JPEG/PNG/WebP images, actual file content/type validation, 5 MB each and 5 MB aggregate, 6 MB HTTP body, 8 MB encoded email JSON. The browser additionally compresses each prepared attachment to <=1 MB. No server re-encoding or public file storage is assumed; confirmed PHP extensions do not include GD. See deployment notes for content-check scope, dimension limits and Base64 overhead.

## Responses and frontend behaviour

All responses are JSON, no-store, nosniff and noindex, without personal information/provider bodies. `200 accepted` requires a successful Resend response containing an ID (or a previously accepted idempotent replay). `422 validation_error` maps `errors` keys to the existing field messages; `photos` maps to `photos-error`. Other codes include `403 forbidden`, `405 method_not_allowed`, `413 payload_too_large`, `415 unsupported_type`, `422 verification_failed`, `429 rate_limited`, `409 pending/changed_request`, `503 unavailable/delivery_unconfirmed`. No `ok:true` is returned for a delivery failure.

The frontend remains disabled without production opt-in AND readiness. It disables controls during sending, preserves input/files, blocks duplicate submits, maps field errors, and displays success only for accepted responses. Pending/failed delivery uses safe call/email alternatives. An uncertain request must be retried unchanged with the same token/idempotency key or checked with John, not silently resent as a new enquiry. Native form action remains method=dialog; JavaScript alone handles the real POST and no-JS cannot leak enquiry fields through a GET URL.

## Email and secret boundary

Private PHP renderer `_php/private/renderer.php` ports the approved `_email/render-enquiry.js` table-based HTML/plain-text design. Customer text/filenames are escaped and description line breaks preserved. Accepted photo bytes are base64 attachments with generated safe filenames; the template displays original names where valid. The backend uses fixed From `JohnsJobs Enquiries <enquiries@johnsjobs.uk>` and To `john@johnsjobs.uk`; Reply-To is the validated customer's email. The secret key lives only in `/home/johnsjobs/resend-config.php`. No key, transport URL or recipient is accepted from the browser.

No live delivery has been performed. Production credentials, verified sender, private-file deployment, final privacy/provider confirmations and an authorised actual-host end-to-end delivery test remain outstanding.
