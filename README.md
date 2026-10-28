# JohnsJobs
Responsive website for a Luton waste clearance business. Plain HTML, CSS and JavaScript with a small Node static server; no installation or build step required.

## Development
Use Node 24 or a current supported Node LTS. From this directory run `npm run dev`. The server listens on port 3000 (override with `PORT`). Run `npm run check` for JavaScript syntax checks.

## Content
Contact buttons use the provided telephone numbers and email addresses. WhatsApp is intentionally awaiting confirmation that the mobile number accepts business WhatsApp messages. The header uses the supplied original logo, and About us uses the supplied team photograph. The hero van remains an animated illustration. Google Fonts is optional; system fonts provide a fallback. No form backend, analytics or cookies are included.

## Before publication
Confirm all copy and contact details with the business owner, replace placeholder artwork, check mobile and tablet layouts, and arrange production hosting with HTTPS and the domain. Nothing is automatically deployed by running this project.

CSS and JavaScript links in index.html include content-version query strings to avoid stale browser caches. Update the corresponding version whenever editing these assets.

## Online enquiries (not yet enabled)
The contact section includes a frontend form with six required fields: `fullName`, `phone`, `email`, `location`, `category` and `description`. Category values/options live in `index.html`. Quote links target `#enquiry-form`; service links use `data-job-category` to preselect a category. Telephone and email links remain direct links.

Validation in `app.js` runs on blur/change, corrects visible errors during typing, and validates all fields on an attempted submission. Errors use associated descriptions and `aria-invalid`; invalid attempts focus the first invalid field and preserve all values. Description height grows while typing.

`handleEnquirySubmission()` is the future integration boundary; `collectEnquiryData()` returns the trimmed six-field payload. No API call, storage, third-party provider or simulated success is implemented. The submit button is disabled. The form uses `method="dialog"` as an extra network safeguard even if JavaScript is unavailable: outside a dialog this cannot submit natively. Replace that only when introducing a real integration.

Before enabling public submission: implement a backend endpoint with server-side validation, spam protection and securely configured email delivery; confirm the privacy policy; implement real pending, success and failure responses plus accessible confirmation/error messages; preserve data after failures and prevent duplicates; test delivery end to end on production hosting. Only then enable the button. Keep direct-call and email routes permanently available. Never put credentials in frontend files. Do not use a `mailto:` form action as a substitute backend.
