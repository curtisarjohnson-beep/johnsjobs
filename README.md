# JohnsJobs
Responsive website for a Luton waste clearance business. Plain HTML, CSS and JavaScript with a small Node static server; no installation or build step required.

## Development
Use Node 24 or a current supported Node LTS. From this directory run `npm run dev`. The server listens on port 3000 (override with `PORT`). Run `npm run check` for JavaScript syntax checks.

## Content
Contact buttons use the provided telephone numbers and email addresses. WhatsApp is intentionally awaiting confirmation that the mobile number accepts business WhatsApp messages. The header uses the supplied original logo, and About us uses the supplied team photograph. The hero van remains an animated illustration. Google Fonts is optional; system fonts provide a fallback. No form backend, analytics or cookies are included.

## Before publication
Confirm all copy and contact details with the business owner, replace placeholder artwork, check mobile and tablet layouts, and arrange production hosting with HTTPS and the domain. Nothing is automatically deployed by running this project.

CSS and JavaScript links in index.html include content-version query strings to avoid stale browser caches. Update the corresponding version whenever editing these assets.
