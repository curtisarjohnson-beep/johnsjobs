# Enquiry email presentation

Implemented 4 November 2026. Presentation only; no Resend SDK, key, API call or submission activation.

## Renderer

`_email/render-enquiry.js` exports `renderEnquiry(enquiry, configuration?)`, category labels and default envelope configuration. It is a pure ES module with no Node-only dependencies, so it can be imported by a future Workers backend. For PHP, port the presentation and validation with `htmlspecialchars(..., ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')`, explicit email/header validation and newline-to-`<br>` conversion after escaping; PHP cannot import the JS module directly. Reuse these tests/fixtures to check equivalent output. Hosting remains undecided.

Input matches the form's trimmed `fullName`, `email`, `phone`, `location`, `category` machine value and `description`. Add `attachments`, an array of up to five metadata objects: `{ originalFilename?: string, filename?: string }`. Original filename is displayed when available, otherwise the safe stored filename or `Photo N`. The module never reads files or trusts these names as disk paths. The current browser canvas produces JPEG filenames; if the backend needs the original source names, preserve them as separately validated metadata when that integration is implemented. Do not infer file type from a display name.

Output: `{ fromName, fromAddress, to, replyTo, subject, html, text }`. Defaults are:

- From name `JohnsJobs Enquiries`, address `enquiries@johnsjobs.uk`.
- To `john@johnsjobs.uk`.
- Reply-To validated customer email.
- Subject `New JohnsJobs Enquiry — [allowlisted category label] — [location]`.

These are central configuration values, not repeated throughout HTML. Optional configuration can override `fromName`, `fromAddress`, `to`, `subjectPrefix` on the server. Never populate sender/recipient configuration from customer input. Use the provider's structured address fields where supported; otherwise format the configured envelope safely on the server.

All free-text body/filename values are HTML-escaped. Description CRLF is normalised and newlines become `<br>` only after escaping. Plain text uses the same validated data. Single-line header values reject CR/LF and control characters; category values are allowlisted. Phone and email links are constructed from validated values and URI/HTML encoded. These checks are defence in depth, not a replacement for the full backend validation contract.

HTML uses table layout, inline Arial/Helvetica styles, a text brand header, a 600px fluid container and an Outlook conditional wrapper. It contains no scripts, external styles/fonts, tracking, embedded photos or data URLs. Photo metadata is a summary only; actual validated bytes must be attached separately. No photos yields “No photos attached.”

## Development-only visual preview

Run `npm run email:preview`. The fictional James Mitchell fixture uses an example.com email and a UK fictional-use mobile number. This writes HTML/text variants with three attachments and with no photos to `/tmp/johnsjobs-email-preview/`. Optional output location: `npm run email:preview -- /tmp/another-preview`.

Open generated HTML locally or inspect it in a local development browser. It is a static visual preview of a prospective email; generating/opening it sends nothing. Do not put output into the site's public folder or serve it as a production feature. The website server allowlist excludes `_email` and `_dev`. GitHub Pages Jekyll configuration excludes both directories and does not build generated /tmp files. On a future non-Jekyll host or a Pages deployment with `.nojekyll`, explicitly exclude these directories from published artifacts as well. Source remains visible in the public GitHub repository; no real customer data belongs in fixtures or snapshots.

## Future delivery sequence

1. Receive and validate text/files, spam/rate limits and request size according to `ENQUIRY-INTEGRATION.md`. Validate decoded image content, not just metadata/MIME.
2. Prepare safe attachment bytes and filenames, then derive display metadata from the accepted file list. Do not claim attachments exist unless they are included in the delivery payload.
3. Call `renderEnquiry` on that validated data/configuration; catch validation errors before sending. Use both `html` and `text` in the future Resend message.
4. Supply the centrally configured sender/recipient and validated customer Reply-To. Attach accepted photo bytes separately using Resend's then-current server API. Do not include bytes/base64 in the template.
5. Access the verified-domain Resend credentials only through private backend secret configuration; no frontend keys or committed secrets.
6. Call Resend only once the backend is implemented, with the duplicate/time-out handling in the integration contract. Return genuine provider-acceptance success or a safe error; preserve customer data on failure. Test actual delivery/bounces before activation.

`npm test` covers escaping, line breaks, header injection, malformed inputs, attachment/no-photo variants, configuration isolation, category parity and absence of active/external HTML content. `npm run check` checks syntax. Local Chromium layout checks are useful but do not establish real Gmail/Outlook/mobile-email rendering; inbox/client tests remain required when the backend is available. The public form stays disabled.
