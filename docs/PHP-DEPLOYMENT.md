# PHP 8.3 / Resend deployment for Maciek

Prepared 4 November 2026. Code is implemented and locally tested with mocked delivery. **Not deployed, no real credentials configured, no live email sent.** Do not enable public sending until the business authorises an actual-host delivery test and privacy/launch confirmations are resolved.

## Architecture and prerequisites

PHP 8.3 uses cURL, OpenSSL, JSON, fileinfo, built-in image metadata parsing and hash functions; no Composer package, database, shell execution, GD or image-processing service is required. PHP never calls exec/system/shell_exec. PHP handles temporary uploads and the endpoint removes verified temporary upload files in a finally block; PHP also cleans them at request end. Nothing is moved into public storage.

- Public endpoint: `/home/johnsjobs/public_html/api/enquiry.php`.
- Private config: `/home/johnsjobs/resend-config.php`.
- Private library: `/home/johnsjobs/johnsjobs-backend/{enquiry.php,renderer.php}`.
- Private writable state directory: `/home/johnsjobs/johnsjobs-state/`.
- `dirname(__DIR__, 2)` from the installed endpoint resolves to `/home/johnsjobs`, so both config and library are outside public_html. Moving the endpoint into a differently nested folder requires reviewing this path.

Maciek must confirm that PHP runs as the correct hosting account and can read the private files/write the state directory; that the web server passes HTTPS=on or SERVER_PORT=443 for actual TLS requests; and that cURL can reach `https://api.resend.com/emails` with valid CA trust. Forwarded IP/protocol headers are deliberately not trusted. If TLS or a proxy terminates upstream, configure the verified web-server/SAPI settings, not a client-controlled X-Forwarded header bypass.

## Build the deployment tree (offline)

```
npm run deploy:prepare -- https://johnsjobs.uk /tmp/johnsjobs-deployment
```

Use the confirmed apex or www hostname. Output must be a new empty directory outside the checkout. This command performs no network requests, DNS changes, upload or email send. It creates:

```
public_html/
  index.html
  privacy.html
  styles.css
  app.js
  robots.txt
  sitemap.xml
  .user.ini
  assets/logo-116.webp
  assets/logo-232.webp
  assets/team-768.webp
  assets/team-1024.webp
  assets/team-1536.webp
  api/enquiry.php
johnsjobs-backend/
  enquiry.php
  renderer.php
resend-config.example.php
```

Upload exactly the contents of `public_html/` into `/home/johnsjobs/public_html/`, preserving paths. Upload `johnsjobs-backend/` to `/home/johnsjobs/johnsjobs-backend/`, **never beneath public_html**. The placeholder example is for reference outside the public directory, not a live configuration. Do not upload `_dev`, `_email`, `_php`, tests, docs, sample emails, source originals, Node server, Git files or credentials into public_html. Back up the old site and confirm the SEO migration/redirect checklist before replacing it.

The production page opts into `./api/enquiry.php`; the GitHub Pages source does not. The submit button initially stays disabled on both: production JavaScript enables it only after a successful readiness GET and token-age delay. If config/PHP is absent, it remains unavailable with phone/email alternatives. Native form submission remains disabled even without JavaScript. Operational coming-soon messaging is hidden only once the backend reports readiness. Marketing copy, form layout and imagery remain unchanged.

## Private configuration

Using Maciek's secure hosting editor or SFTP, create `/home/johnsjobs/resend-config.php` from `_php/resend-config.example.php`. Enter the real key there only. Set:

- `enabled` to `false` initially.
- `api_key` to a least-privilege Resend sending key for the verified johnsjobs.uk domain.
- `token_secret` to at least 64 cryptographically random hexadecimal characters. Maciek may generate this privately using a password manager or `php -r 'echo bin2hex(random_bytes(32)), PHP_EOL;'` if PHP CLI is available. Do not expose a public secret-generator page or paste secrets into chat.
- `allowed_origin` to exactly `https://johnsjobs.uk` or `https://www.johnsjobs.uk`, matching the canonical site, without a trailing slash.
- `state_dir` to `/home/johnsjobs/johnsjobs-state`.

Create the private state directory, owner-writable by PHP, ideally mode 0700. Use restrictive config/library/file permissions (config/state files 0600 where the hosting model permits) and the correct owner; do not use 0777. The endpoint uses umask 0077 and discards accidental output from the private config before returning JSON. Ensure the private files cannot be requested over HTTP and do not enter hosting public backups/downloads.

Do not change the hardcoded sender/recipient using request fields: sender is `JohnsJobs Enquiries <enquiries@johnsjobs.uk>`, recipient `john@johnsjobs.uk`, Reply-To is only the validated customer email. Verify the Resend sending domain and its required DNS records before testing. No recipient override or public test/debug switch exists.

## Upload and size settings

The supplied `.user.ini` requests `upload_max_filesize=5M`, `post_max_size=8M`, `max_file_uploads=6`, `memory_limit=128M`, `max_input_vars=50`, `max_execution_time=30`, `display_errors=Off`. Maciek must confirm effective settings (CGI/FPM may cache .user.ini; other SAPIs may require control-panel settings). Six uploads are allowed through PHP parsing so the endpoint can reject a sixth rather than silently truncate it to five. Block direct `.user.ini` downloads through the hosting server and remove any diagnostic phpinfo page after checking settings.

Application budgets use decimal bytes: <=5,000,000 per file, <=5 files, <=5,000,000 total raw attachments, <=6,000,000 HTTP Content-Length, <=8,000,000 serialized Resend JSON bytes. The existing browser preparation still targets JPEG <=1 MB each / <=5 MB overall, 1600px longest edge. Untrusted clients cannot bypass the server total/file/count limits. PHP upload limits are a second layer, not a substitute for the application checks.

Resend's documentation host was blocked in this environment. Official Resend reference source checked on 4 November 2026: [sending overview](https://github.com/resend/resend-skills/blob/56d7bbf865beaafcdd21e820e16bbd02026c2647/skills/resend/references/sending/overview.md) lists attachments up to 40 MB; the same official repository's [email size reference](https://github.com/resend/resend-skills/blob/56d7bbf865beaafcdd21e820e16bbd02026c2647/skills/resend/references/inboxes.md) states the whole encoded email can be at most 40 MB. We conservatively budget the entire message well below 40 MB. Base64 takes `4 * ceil(rawBytes/3)` bytes: 5 MB becomes about 6.67 MB, plus the text/HTML/MIME overhead. JSON slash escaping is disabled to avoid inflating base64. Recheck current account/provider and hosting limits before launch; no actual limit-boundary email was sent.

## Validation and anti-abuse controls

Six required fields are trimmed and checked for UTF-8, length, whitespace, control/header characters, plausible phone/email and an exact category allowlist. Unknown sender/recipient fields are ignored. Uploaded paths must be actual PHP uploads. Actual bytes are checked with fileinfo and image metadata MIME agreement, signature/structure checks (PNG chunks/CRC/end, JPEG markers/end, WebP RIFF length), plus image dimension/pixel limits. Supplied extensions/MIME are not trusted. No GD extension was confirmed: this is bounded content/format validation, not a full raster decoder or antivirus scan. Images remain non-executable temporary files and generated attachment filenames are used; the original basename is escaped for display only.

A signed, IP-bound, one-hour token must be at least three seconds old; the empty offscreen honeypot is mandatory. Same-origin POST requires the exact Origin; cross-site Sec-Fetch-Site is rejected. HTTPS is required. No cookies, CAPTCHA widgets, third-party tracking or device storage are added. These controls deter basic automation; they do not replace operational spam monitoring.

Rate limits: five POST attempts per IP per ten-minute bucket and 100 total per hour, including invalid attempts. A bounded, locked private JSON state file stores HMAC IP/request fingerprints, counts, timestamps and acceptance/pending state—no raw IP, customer fields, photos, API key or provider response. Expired rate/request entries are pruned on later POSTs; at most 5,000 active entries per collection. Confirm this operational retention in the privacy review. Do not delete state during a pending retry window or allow it to fill the disk; include private state in appropriate access/cleanup planning.

Idempotency uses the signed token's nonce plus keyed fingerprints. Accepted retries return success without a second API call; concurrent/uncertain attempts wait 30 seconds and retry the same Resend Idempotency-Key. Changed data cannot reuse an uncertain/accepted request. Official [Resend idempotency reference](https://github.com/resend/resend-skills/blob/56d7bbf865beaafcdd21e820e16bbd02026c2647/skills/resend/references/sending/single-email-examples.md) specifies 24-hour key lifetime/256-character maximum. Our one-hour token lifetime stays inside it. After uncertainty, do not encourage a fresh token/new enquiry: the customer should retry unchanged within the window or call John.

cURL uses HTTPS only, normal TLS peer/host verification, no redirects, a five-second connect timeout and twenty-second overall timeout. Provider bodies, request content, photos and keys are not logged by the application. Maciek must also disable request-body/authorization logging in any hosting/WAF/APM tools. Do not rely on the application's log setting to control external web-server logging.

## Authorised production test and activation

1. Resolve the remaining privacy/hosting confirmations and obtain business authorisation for actual delivery testing. Confirm sender verification, key permissions, mailbox access, HTTPS/canonical origin, effective upload limits and private file permissions. Keep `enabled=false` until ready.
2. With Maciek, set `enabled=true` only for that authorised test window. An HTTPS GET to `/api/enquiry.php` should return readiness JSON, a token and no-store headers; it must not send mail. Missing/disabled config must return safe 503 without PHP paths/secrets. Do not publish the token or key.
3. Submit fictional data, first without photos and then with five supported test photos, on the actual hostname. Confirm real receipt by John, correct From, Reply-To, subject, escaped HTML/plain text and attachments. Provider acceptance alone is not proof of inbox delivery; check delivery/bounce events and mailbox spam.
4. Test invalid fields, sixth/oversized/mislabelled files, cross-origin rejection, rate limits, unavailable credentials, provider failure and network timeout. Confirm no success is shown on failure and entered data/photos stay on the page. Test duplicate clicks/retries and ensure only one provider message is created. Do not hit real rate tests with genuine customer data.
5. Check no credentials/private code/sample previews are publicly reachable; verify no sensitive logging, no public upload directory and temporary files are cleaned up. Remove temporary diagnostics/test messages as appropriate. Recheck mobile/keyboard use and all direct call/email links.
6. Only after successful testing, deliberately keep the backend enabled for public use and record the launch. Otherwise return `enabled=false`: the frontend will stay unavailable on the next readiness load and existing open pages receive a safe error on POST. Keep phone/email routes available permanently.

The generated bundle includes production SEO settings but does not deploy redirects/DNS or finalise the draft policy. Do not upload it as a casual GitHub Pages preview or claim enquiries are live from local tests.

## Local tests

With PHP 8.3 available: `npm run test:php`. Lint `_php/private/*.php`, `_php/public/enquiry.php`, `_php/resend-config.example.php`, `_php/tests/*.php` with `php -l`. The test script runs the service assertions and the malformed-config output-suppression check. Tests inject a mock transport and temporary-file verifier into the private library; HTTP input cannot activate either. The real public wrapper always uses is_uploaded_file and cURL.

This environment used official `php:8.3-cli` (8.3.36, image digest `sha256:600bce7c7acf524756e5aac989f4a763aed709960d7326970bb670f46efee53a`) with `--network none` for PHP checks. No network means the mocked tests cannot send email. No shell execution is used by production PHP. Existing JS tests and deployment-bundle tests run via `npm test`.
