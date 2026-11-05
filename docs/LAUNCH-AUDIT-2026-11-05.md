# JohnsJobs launch audit — 5 November 2026

Scope: requested About us telephone CTA, production SEO artifacts, rate/state review, production cleanup guidance, and local functional checks. No unrelated marketing copy/design/animation or PHP sending logic was changed. No live email was sent.

## Access and evidence limits

A read-only HTTPS attempt to johnsjobs.uk was rejected by the execution environment's egress proxy (CONNECT 403). This is **not** evidence that the website itself returns 403. Consequently this report does not certify live HTTP headers, deployed file contents, server file inventory, Search Console indexing, actual permissions or inbox delivery. The owner reports the live form works; local mocks are separate evidence.

## Production SEO artifacts

| Page/file | Prepared result |
| --- | --- |
| Homepage | `index,follow`; self-canonical `https://johnsjobs.uk/` |
| Privacy page | `index,follow`; self-canonical `https://johnsjobs.uk/privacy.html` |
| sitemap.xml | Valid sitemap namespace; both URLs above; no demo URLs |
| robots.txt | User-agent `*`, empty Disallow, sitemap `https://johnsjobs.uk/sitemap.xml` |
| GitHub Pages demo | Both source pages remain `noindex,follow`; no production canonical injected into the demo |

Finding corrected: previous production output intentionally left privacy.html noindex/out of the sitemap. The owner now requests both pages be indexable, so only production generation has been updated accordingly. Indexability does not guarantee Google will index a page; unresolved policy confirmations remain a separate business matter and no policy wording was changed in this audit.

Upload the four files in `_deployment/johnsjobs-launch-update.zip`: index.html, privacy.html, robots.txt and sitemap.xml. Keep all backend files and the actual private config/state untouched. The About us link is now “Have a Chat with John”, `tel:07772591409`.

### Maciek's live verification

After uploading, check both pages return 200 on the canonical HTTPS hostname, not an old CMS response or an unexpected redirect. View source and confirm exactly one self-canonical and `index,follow`. Check response headers: no inherited X-Robots-Tag `noindex` or `none`, including in .htaccess/web.config/hosting settings. Confirm root robots and sitemap return the expected text/XML, not HTML errors or old cached versions. Verify the non-canonical host redirects to the chosen host, and inspect the sitemap URLs in Search Console after submission. Do not blindly replace existing redirect rules. If the actual canonical hostname is www, stop and rebuild with that origin rather than mixing apex/www metadata.

## Rate limiting and private state review

The current private service enforces five POST attempts per REMOTE_ADDR per fixed ten-minute bucket and 100 total per fixed hour. Invalid POSTs count too. Counters run before signed-token/field validation; GET readiness calls do not consume them and never send mail. State collections are bounded, lock-protected and pruned on later POSTs. Rate entries expire after their window; request/idempotency records expire after 24 hours. No database or browser cookie is used.

Config: `/home/johnsjobs/private/resend-config.php`. Default state: `/home/johnsjobs/private/johnsjobs-state/enquiry-state.json`. The directory must be readable/writable/searchable and existing file readable/writable by the PHP execution user; filesystem locking must work. Prefer directory 0700/file 0600 with correct ownership, or a restricted hosting group approved by Maciek. Do not use 0777, expose the directory over HTTP, clear it between tests or rotate the signing secret to bypass limits. Doing so invalidates tokens and can discard duplicate-send protection. Keep actual keys, secrets and state content out of screenshots/chat/logs.

Use the real server-provided REMOTE_ADDR; arbitrary forwarded headers are intentionally not trusted. If a reverse proxy/CDN is used, Maciek must configure trusted real-IP handling at the server to avoid making multiple visitors share one rate bucket. No proxy was assumed or configured in this audit.

### Safe live smoke test — zero intended emails

Coordinate with Maciek at a quiet time and use one known test IP, near the start of a fresh ten-minute bucket. Do not change the code/config, delete state or use genuine enquiry details. Verify the deployed endpoint is the reviewed release first.

Run this command **once at a time, no more than six times**, inspecting each response:

```
curl --include 'https://johnsjobs.uk/api/enquiry.php' \
  --header 'Origin: https://johnsjobs.uk' \
  --form 'token=invalid-rate-limit-audit' \
  --form 'website='
```

The deliberately invalid token and absent required fields cannot reach the Resend transport in this implementation. Expect 422 verification errors for available attempts and 429 once the bucket is used. Existing traffic may produce 429 sooner, or the global bucket may already be full. Stop after the first 429, or immediately on an unexpected 200/500/503, PHP source, redirect or non-JSON response; ask Maciek to diagnose rather than repeatedly retry. No real token, customer fields, photos or credentials are included. Never substitute a valid token/valid enquiry in a repeated rate test.

Afterward, let the bucket expire naturally; it may temporarily block genuine enquiries from that same test IP. Do not test the 100/hour cap by sending 100 live requests: the global cap, concurrency and idempotency behaviour are already covered by isolated mocked PHP tests. If production settings/policy make even six invalid requests undesirable, use only those offline tests.

## Cleanup inventory and preservation

The allowlisted production bundle contains no email-preview.html, fictional fixtures, test routes, phpinfo page, debug page, Git directory or dependency folders. The preview remains development-only; the live server inventory cannot be inspected here.

In FileZilla, identify and remove **only confirmed temporary copies**, if present: email-preview.html; generated enquiry.html/enquiry-no-photos.html preview files; uploaded preview ZIPs/backups; exposed `_dev/`, `_email/`, `_php/`, `_deployment/`, `.git/`, `node_modules/`; and any diagnostic phpinfo/test-mail/debug PHP scripts that Maciek confirms are temporary. Do not delete an arbitrary file merely because its name contains “test”. Keep backups securely outside public_html rather than publicly downloadable.

Preserve index.html, privacy.html, styles.css, app.js, robots.txt, sitemap.xml, assets/, **api/enquiry.php**, **private/resend-config.php**, **private/johnsjobs-backend/** and **private/johnsjobs-state/**. Keep hosting `.htaccess`, `web.config`, `.well-known/`, `.user.ini`, php.ini and verification files; ask Maciek to review legacy rewrites rather than deleting them. The four-file patch does not contain any of these hosting or private files.

## Functional audit evidence

Local browser checks use current generated production files and intercepted/mock API responses, not the live site. Tested 320/390/768/1440px layouts, mobile menu opening/closing, all in-page anchors, About us direct phone link, quote scroll/preselection, image loading, five photo selections, sixth rejection, individual removal, no horizontal overflow and both production indexing directives/canonicals.

Mock submission checks cover production readiness/unavailable states, demo zero enquiry requests, multipart photos, pending/loading controls, duplicate-click blocking, server field-error focus, provider/network failure messaging, preserved values/photos, rejection of fake success and accepted-only confirmation/locked controls. Direct call/email links remain present. Existing animation controls and code were not modified. Existing Node tests cover schema/canonical separation and cross-language categories. PHP mocked tests cover formats, byte limits, token/spam/rate checks and duplicate semantics without a network.

These tests cannot verify a real dialler/mail application, current social-profile redirects, real Resend delivery or actual hosting upload limits. The owner/Maciek should perform a single authorised no-photo enquiry and (only if not already verified) a single five-photo enquiry to confirm real receipt/Reply-To/attachments. Avoid repeating live sends as part of layout or rate-limit tests.

Validation completed for this audit: 13 Node tests and 46 isolated PHP checks passed, plus mocked browser navigation/upload/submission checks. No production test POSTs or Resend API calls were made.
