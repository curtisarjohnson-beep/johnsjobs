# Enquiry integration contract — backend not implemented

Prepared 4 November 2026. The site is static on GitHub Pages. PHP availability is not confirmed; PHP and Cloudflare Workers remain alternatives. This contract is a proposed interface for either implementation. No email delivery, endpoint or Resend API key is present, and public submission must remain disabled until end-to-end testing succeeds.

## Transport and payload

Use HTTPS `POST` to an agreed same-origin endpoint, proposed `/api/enquiries`. A PHP deployment may select `/api/enquiries.php`; configure one endpoint when the actual host is chosen. Cross-origin Workers hosting requires an explicit allowed-origin/CORS design, not a wildcard. GitHub Pages itself cannot execute a backend.

Use `multipart/form-data` with the browser generating the boundary. `collectEnquiryData()` in `app.js` returns trimmed strings plus an array of prepared JPEG `File` objects. Append those files to FormData under repeated `photos[]` keys. PHP can read `$_FILES['photos']`; Workers can read `formData.getAll('photos[]')`. Do not JSON-stringify File objects, include original browser paths or send mail directly from frontend JavaScript.

| Field | Required | Server validation to implement |
| --- | --- | --- |
| `fullName` | Yes | Trimmed, nonempty, <=120 characters. Plain text; no header/control-character injection. |
| `email` | Yes | Trimmed, <=254 characters, valid email format; reject CR/LF. Used only after validation for Reply-To. |
| `phone` | Yes | Trimmed, <=120 characters; plausible optional leading `+`, digits/spaces/parentheses/dots/hyphens, 7–15 digits. Do not require only UK numbers. |
| `location` | Yes | Trimmed, nonempty, <=120 characters; allow location text as well as postcodes. |
| `category` | Yes | Exact allowlisted machine value below. Never accept an arbitrary mail header/recipient. |
| `description` | Yes | Trimmed, nonempty, <=5000 characters; treat as plain text and escape when rendering HTML email. |
| `photos[]` | No | 0–5 images. See limits below. Reject non-file/unknown fields as appropriate to the endpoint design. |

Category allowlist (in UI order): `full-house`, `partial-house`, `bereavement`, `garage`, `furniture`, `trade`, `commercial`, `bin-store`, `tenancy`, `garden`, `other`. Display labels live in `index.html` and must be kept in sync with the backend. `furniture` is “Furniture and bulky item removal”.

## Photo and body limits

- The picker accepts original JPEG, PNG and WebP images, maximum **5,000,000 bytes each**, at most five.
- It redraws them to JPEG, max 1600px longest edge, max **1,000,000 bytes each** and **5,000,000 bytes total**. This removes original metadata while leaving any personal information visible in the image itself.
- The backend must not trust that the browser ran this code. Independently enforce count <=5, uploaded file <=5,000,000 bytes, aggregate uploaded photos <=5,000,000 bytes, and valid decoded image content. Allow JPEG/PNG/WebP only; MIME headers/extensions are not proof. Apply dimension/decode resource limits and re-encode to prepared JPEG <=1,000,000 bytes each / 5,000,000 total; reject files that cannot meet limits. Do not forward unvalidated originals to Resend.
- A proposed bounded request limit is 6,000,000 bytes including multipart overhead and text. Check the actual PHP/Worker/proxy host limits before adopting it; the lowest deployed limit wins. Configure PHP upload/post limits or Worker request handling accordingly; avoid reading an unbounded body into memory.
- Base64/MIME adds roughly one third plus overhead to raw files. Check the current Resend message/attachment limits and hosting limits at implementation time; the 5 MB raw attachment budget is conservative, not a guarantee for an unchosen host.
- Generate safe unique filenames server-side, e.g. `clearance-photo-1.jpg`. Never trust client filenames or write uploads to a public executable path. Minimise temporary retention and remove temporary files reliably on success and failure. Do not log content, base64 photos or personal enquiry fields.

## Resend configuration (future backend only)

Store the API key in private server configuration/secret bindings, never frontend JS, public variables, HTML, repository files or logs. Verify the sending domain in Resend and configure/test its required DNS records before enabling delivery.

- To: `john@johnsjobs.uk` (fixed server configuration).
- From: `JohnsJobs Enquiries <enquiries@johnsjobs.uk>` (fixed, verified sender).
- Reply-To: validated customer `email`.
- Subject: server-generated from an allowlisted category; no untrusted header interpolation.
- Body: validated enquiry details, safely escaped in any HTML version, with plain-text alternative.
- Attachments: validated, prepared photo bytes as supported by the Resend server API. No publicly accessible image URLs required.

Apply server-side spam protection, rate limits and bounded processing time before calling Resend. If using origin checks/CSRF protection, use the real deployment topology and do not mistake CORS for spam prevention. Document any device-accessing anti-spam mechanism and re-audit consent implications. Use idempotency/duplicate prevention appropriate to the chosen endpoint and Resend; handle timeouts without silently sending duplicates.

## Response contract

Return JSON with a correct HTTP status and `Cache-Control: no-store`. Never expose credentials or raw provider errors.

- `200`: `{ "ok": true, "message": "Your enquiry has been sent. John will be in touch." }` only after the provider confirms acceptance. Provider acceptance is not proof of inbox delivery; monitor delivery/bounce outcomes during end-to-end testing.
- `422`: `{ "ok": false, "code": "validation_error", "message": "Please check the highlighted fields.", "errors": { "email": "Enter a valid email address.", "photos": "Choose no more than five photos." } }`.
- `413`: `{ "ok": false, "code": "payload_too_large", "message": "Please reduce the number or size of your photos." }`.
- `415`: unsupported content type/file type with a safe explanation.
- `429`: rate limited, with a suitable `Retry-After` and a clear retry/contact alternative.
- `502`/`503`: generic temporary delivery/service failure; preserve user-entered fields/photos and provide call/email alternatives.
- `405`: reject other HTTP methods. Set appropriate content type and origin/security controls in the backend.

## Frontend activation checklist

Replace the disabled no-network guard in `handleEnquirySubmission()` only when the endpoint is implemented. Validate, block while `photosProcessing`, construct FormData and send to the agreed endpoint. Show an accessible pending state, prevent duplicates, map backend field errors to existing error elements (use `photos` -> `photos-error`), and focus the first error. Display success only for a valid successful backend response; retain data on network/parse/provider failures. Decide and disclose any clearing after confirmed success. Never fake success on a timer or use a mailto form action.

Change `method="dialog"` deliberately when activation is tested; the current value prevents native network submission without JavaScript. Keep the form safe if JavaScript is disabled or fails. Remove the disabled attribute only when ready, update the coming-soon copy/privacy notice, test real receipt including five photos, failures and retries, and check production logs for accidental personal data. Call and email links must remain permanently available.

## Decisions still needed

Controller identity/address and lawful bases; retention/deletion schedule; final privacy approval by the business; host/PHP versus Workers; request limits; endpoint/origin; sender-domain verification; Resend/mailbox contracts, processing locations and safeguards; credential management; spam/rate strategy; delivery/bounce monitoring and duplicate policy. See `COOKIE-AUDIT.md` and the public draft privacy page. Do not enable delivery merely because frontend tests pass.

## Presentation module available

Use `_email/render-enquiry.js` after validation to generate the subject, HTML and plain-text bodies; see `EMAIL-TEMPLATE.md`. It accepts the form's text values plus metadata derived from the accepted attachments, and returns configurable envelope fields with customer Reply-To. File bytes are never embedded in the HTML and must be attached independently. This module is presentation only, not an API endpoint or live Resend integration.
