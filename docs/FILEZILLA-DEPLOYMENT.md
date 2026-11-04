# JohnsJobs final FileZilla package

Prepared 4 November 2026 for two confirmed FTP roots. The bundle is configured for **https://johnsjobs.uk**. If the address bar redirects to www.johnsjobs.uk, confirm that before enabling enquiries: rebuild for that origin and match `allowed_origin`.

## Download and unzip

Download `_deployment/johnsjobs-production.zip` from the repository using GitHub's Download raw file button. Extract it locally. It contains `public_html/`, `private/`, `hosting/`, `START-HERE.md` and technical reference guides. All configuration values are placeholders; sending defaults to disabled. The bundle excludes the real API key and signing secret.

## 1. Website FTP account — opens directly inside public_html

Upload the **contents** of the package's `public_html/` into the remote directory you see on login. Do not create another public_html folder.

```
index.html
privacy.html
styles.css
app.js
robots.txt
sitemap.xml
api/
    enquiry.php
assets/
    logo-116.webp
    logo-232.webp
    team-768.webp
    team-1024.webp
    team-1536.webp
```

Merge folders and replace only the corresponding application files above. Keep the existing backup. Do not use a “delete everything first” or mirror/delete operation.

## 2. Configuration FTP account — opens directly inside /home/johnsjobs/private

Upload the **contents** of the package's `private/` into that account's initial remote directory. Do not create another private folder.

```
resend-config.php
johnsjobs-backend/
    enquiry.php
    renderer.php
johnsjobs-state/      (empty writable directory)
```

The included `resend-config.php` has placeholders and `enabled=false`. If there is already a real private config, do not overwrite its credentials with the example: edit/merge it securely instead. Put the real key and a freshly generated signing secret into this private server file only. Never upload private/ into public_html.

The installed endpoint at `/home/johnsjobs/public_html/api/enquiry.php` uses:

```php
$privateRoot = dirname(__DIR__, 2) . '/private';
$configFile = $privateRoot . '/resend-config.php';
$library = $privateRoot . '/johnsjobs-backend/enquiry.php';
```

This resolves to **/home/johnsjobs/private/resend-config.php**, not the parent account directory or the web directory. State defaults to **/home/johnsjobs/private/johnsjobs-state** through `__DIR__` in the config.

Keep directories private (0700) and config/state files 0600 where PHP runs as the same account. Maciek must confirm ownership/PHP read/write access; if a different PHP user needs access, use the appropriate restricted group permissions, not 0777.

## 3. Files to preserve

Keep existing `.htaccess`, `web.config`, `.well-known/`, `.user.ini`, `php.ini`, hosting verification files and other hosting-managed files/folders. None is included as an overwrite in public_html. `.well-known` may be needed for certificate renewal.

Ask Maciek to review existing rewrite/redirect and default-document rules. An old index.php or CMS catch-all can take priority over index.html or intercept api/enquiry.php. Do not delete these files or replace rewrite rules blindly. Maciek should adjust only what is necessary after reviewing the backup and redirects from old site URLs. This package does not prescribe a new server configuration or force a canonical-host redirect.

The separate `hosting/php-settings.user.ini.example` is a reference, **not a bulk-upload file**. If there is an existing .user.ini, merge only confirmed settings. Some directives need the hosting control panel rather than .user.ini. Confirm uploads enabled, per-file >=5 MB, post limit >=6 MB (8M suggested), at least 6 uploads allowed through PHP parsing, 128M memory and sufficient execution time. The application itself enforces stricter count/byte limits. Enable FileZilla's hidden-file display if needed to see existing dotfiles.

## 4. Configuration

Use the exact PHP array in the included private/resend-config.php. Keep `enabled=false` while preparing.

- Replace `api_key` with the Resend sending key privately.
- Replace `token_secret` with at least 64 cryptographically random hexadecimal characters, generated privately by Maciek/password-manager tooling. This is a separate secret, not the API key; do not use the example string or reuse a password.
- Keep `allowed_origin` exactly matching the final HTTPS host, without a trailing slash.
- Keep `state_dir` as `__DIR__ . '/johnsjobs-state'`.
- Save as plain UTF-8 PHP, not .txt. Do not add a closing PHP tag. Restrict permissions and do not paste secrets into chat or GitHub.

The example placeholders intentionally fail readiness checks; replacing only the API key is not enough. Existing real config/state must be preserved on subsequent deployments. Do not delete state during an uncertain-send retry window.

## 5. Deployment and test checklist

1. Confirm the backup includes hidden server files and that the final hostname is https://johnsjobs.uk. Resolve the remaining privacy/provider confirmations before public activation. Verify Resend's sender domain and the address enquiries@johnsjobs.uk.
2. Upload private backend/config/state first, with sending disabled; then upload the public application files. Preserve all server-managed files listed above. Ask Maciek to confirm PHP 8.3 extensions, upload settings, HTTPS server variables, permissions and outbound HTTPS/certificate trust.
3. Open the website on phone and desktop. Check new homepage loads rather than an old index.php/CMS, images, anchors, phone/email links, footer and privacy page. The form should remain disabled.
4. Open https://johnsjobs.uk/api/enquiry.php. With disabled config, expect unavailable JSON (HTTP 503); this is normal and sends no email. It must not display PHP source, a directory listing, private paths or credentials. Confirm private config/backend files are not web-accessible.
5. Enter the real key and random signing secret privately. **Only when an actual delivery test is authorised**, set `enabled=true`, save, then reload the page. The endpoint GET should return readiness JSON; it still sends no mail. The form enables after a short verification delay. If it does not, leave it disabled and ask Maciek to check settings; do not weaken HTTPS/Origin/permissions checks.
6. Submit fictional contact details and no photos, then a test with five supported photos. Confirm real receipt by John, expected subject/sender, working Reply-To and correct attachments. Resend acceptance is not proof of inbox delivery: check mailbox/spam and provider delivery/bounce results. These manual tests send real messages to john@johnsjobs.uk.
7. Check invalid fields, a sixth/oversized photo and a controlled failed send. Confirm no fake success, preserved details/photos and working call/email alternatives. For an uncertain send, retry unchanged after 30 seconds or contact John; do not start a fresh enquiry just to bypass a pending request.
8. After successful authorised testing, deliberately leave enabled for launch; otherwise restore enabled=false. Recheck production HTTPS, canonical/robots/sitemap and old URL redirects, and keep the backup/rollback plan. GitHub Pages remains a separate disabled demo.

For the detailed security/size contract and local test evidence, see PHP-DEPLOYMENT.md and PHP-QA.md. No real email or hosting upload was performed while preparing this package.
