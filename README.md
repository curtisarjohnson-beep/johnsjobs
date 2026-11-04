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

## Enquiry form and PHP backend
The six-field form, optional photo picker and existing quote preselection remain in the same design. The GitHub Pages source stays disabled and never probes the PHP endpoint. Production code uses a same-origin readiness request, then signed-token multipart submissions, accessible loading/errors, retained data and acceptance-only success. Direct phone/email links remain available.

`npm run deploy:prepare -- https://johnsjobs.uk /tmp/johnsjobs-deployment` assembles a separate tree for the confirmed PHP 8.3 host. It does not deploy or send email. The config example defaults to disabled, and the real config/key must live at `/home/johnsjobs/resend-config.php`, outside public_html. See [Maciek's deployment guide](docs/PHP-DEPLOYMENT.md) for every file, permissions, limits and authorised test steps.

Optional photos: at most five JPEG/PNG/WebP originals, 5 MB each, compressed locally to <=1 MB each / <=5 MB total. PHP independently checks count, actual upload/type/structure/dimensions and byte budgets, and sends them only as attachments. No public image storage, database, Composer dependency or PHP shell execution is used.

`npm test` runs Node email/SEO/bundle tests. `npm run test:php` runs mocked backend tests on PHP 8.3; no real Resend key or network is needed. The form remains unavailable until the production endpoint is privately configured and an actual-host delivery test is authorised and completed.

## Privacy and integration readiness
The public `privacy.html` page is a clearly marked draft, with unknown controller details, lawful bases, retention periods and provider/transfer arrangements left for confirmation. It is linked from the footer and enquiry form. It is not legal approval.

See [cookie and tracking audit](docs/COOKIE-AUDIT.md) for current source findings and remaining deployed-provider checks, and [backend integration contract](docs/ENQUIRY-INTEGRATION.md) for the proposed PHP/Workers interface, attachment budgets, Resend sender/recipient requirements and activation checklist. PHP implementation is prepared; it has not been deployed or connected with production credentials. External Google Fonts remain to preserve typography; no cookie banner has been introduced.

## Enquiry email template
Server-side presentation lives in `_email/render-enquiry.js`. Run `npm test` for rendering/security tests and `npm run email:preview` for fictional HTML/plain-text samples written outside the website to `/tmp/johnsjobs-email-preview/`. See [email template instructions](docs/EMAIL-TEMPLATE.md) for configuration, the PHP/Workers adaptation and future delivery sequence. Preview commands send no emails; the demo form remains disabled. `_dev` fixtures and `_email` modules are excluded from Pages and the local website server; preserve those exclusions on future hosting.

## Technical SEO and launch settings
The GitHub Pages demo remains publicly viewable with page-level `noindex,follow`; do not submit it for indexing. See [technical SEO and migration notes](docs/TECHNICAL-SEO.md). The separate `npm run seo:production -- https://johnsjobs.uk /tmp/johnsjobs-production` command prepares production-only canonicals, indexing and sitemap into an empty directory outside this checkout. It does not deploy or enable enquiries. Run it only for an approved production launch after choosing the canonical hostname. Optimized WebP assets preserve the existing layout and copy; originals remain in Git for future editing.
