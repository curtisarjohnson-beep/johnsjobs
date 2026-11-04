# JohnsJobs
Responsive website for a Luton waste clearance business. Plain HTML, CSS and JavaScript with a small Node static server; no installation or build step required.

Pages Link - https://curtisarjohnson-beep.github.io/johnsjobs/

## Development
Use Node 24 or a current supported Node LTS. From this directory run `npm run dev`. The server listens on port 3000 (override with `PORT`). Run `npm run check` for JavaScript syntax checks.

## Content
Phone and email links use `tel:07772591409` and `mailto:john@johnsjobs.uk`. WhatsApp is intentionally awaiting confirmation that the mobile number accepts business WhatsApp messages. The header uses the supplied original logo, and About us uses the supplied team photograph. The hero van remains an animated illustration. Google Fonts is optional; system fonts provide a fallback. No form backend, analytics or cookies are included.

## Before publication
Confirm all copy and contact details with the business owner, replace placeholder artwork, check mobile and tablet layouts, and arrange production hosting with HTTPS and the domain. Nothing is automatically deployed by running this project.

CSS and JavaScript links in index.html include content-version query strings to avoid stale browser caches. Update the corresponding version whenever editing these assets.

## Online enquiries (not yet enabled)
The contact section includes a frontend form with six required fields: `fullName`, `phone`, `email`, `location`, `category` and `description`. Category values/options live in `index.html`. Quote links target `#enquiry-form`; service links use `data-job-category` to preselect a category. Telephone and email links remain direct links.

Validation in `app.js` runs on blur/change, corrects visible errors during typing, and validates all fields on an attempted submission. Errors use associated descriptions and `aria-invalid`; invalid attempts focus the first invalid field and preserve all values. Description height grows while typing.

`handleEnquirySubmission()` is the future integration boundary; `collectEnquiryData()` returns the trimmed six-field payload. No API call, storage, third-party provider or simulated success is implemented. The submit button is disabled. The form uses `method="dialog"` as an extra network safeguard even if JavaScript is unavailable: outside a dialog this cannot submit natively. Replace that only when introducing a real integration.

Before enabling public submission: implement a backend endpoint with server-side validation, spam protection and securely configured email delivery; confirm the privacy policy; implement real pending, success and failure responses plus accessible confirmation/error messages; preserve data after failures and prevent duplicates; test delivery end to end on production hosting. Only then enable the button. Keep direct-call and email routes permanently available. Never put credentials in frontend files. Do not use a `mailto:` form action as a substitute backend.


## Photo attachments
Photos are optional and prepared locally; nothing is uploaded by this static website. Users may select up to five JPEG/PNG/WebP images (5 MB maximum per original). The browser redraws them onto a maximum 1600px-long-edge canvas and exports JPEGs at decreasing quality as needed, enforcing a 1,000,000-byte maximum per result and 5,000,000 bytes overall. Canvas re-encoding omits original EXIF metadata. HEIC, GIF, SVG and unreadable files are rejected with an explanation. A rejected batch leaves previously selected photos intact. Previews can be removed; their object URLs are revoked. Files remain only in page memory until the page closes or reloads.

`collectEnquiryData()` now includes `photos`, an array of prepared JPEG `File` objects. Use multipart `FormData` for a future backend; do not JSON-stringify Files or send directly to Resend from the browser. On the backend validate decoded image content and enforce the source, prepared and aggregate file/request limits in `docs/ENQUIRY-INTEGRATION.md` before calling Resend. Generate safe unique attachment filenames there. Base64 adds roughly one third to attachment size; this conservative 5 MB raw budget leaves room for encoding and email content, but also check the actual hosting request limit and current Resend limits. No Resend backend is present in this repository, so delivery and those server-side checks still need integrating and testing. Public submission remains disabled.


## Privacy and integration readiness
The public `privacy.html` page is a clearly marked draft, with unknown controller details, lawful bases, retention periods and provider/transfer arrangements left for confirmation. It is linked from the footer and enquiry form. It is not legal approval.

See [cookie and tracking audit](docs/COOKIE-AUDIT.md) for current source findings and remaining deployed-provider checks, and [backend integration contract](docs/ENQUIRY-INTEGRATION.md) for the proposed PHP/Workers interface, attachment budgets, Resend sender/recipient requirements and activation checklist. No backend has been connected. External Google Fonts remain to preserve typography; no cookie banner has been introduced.

## Enquiry email template
Server-side presentation lives in `_email/render-enquiry.js`. Run `npm test` for rendering/security tests and `npm run email:preview` for fictional HTML/plain-text samples written outside the website to `/tmp/johnsjobs-email-preview/`. See [email template instructions](docs/EMAIL-TEMPLATE.md) for configuration, the PHP/Workers adaptation and future delivery sequence. No emails are sent, and the form remains disabled. `_dev` fixtures and `_email` modules are excluded from Pages and the local website server; preserve those exclusions on future hosting.
