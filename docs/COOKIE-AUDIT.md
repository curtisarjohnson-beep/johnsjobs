# Cookie and tracking audit

Reviewed: 4 November 2026. Scope: all tracked application HTML, CSS, JavaScript, the local server, package manifest and documentation. This report describes the current source and local-browser checks, not a legal approval or a completed production-header audit.

## Findings

| Technology | Information accessed or stored | Purpose / assessment | Consent assessment |
| --- | --- | --- | --- |
| First-party HTML, CSS, JavaScript and images | Normal page requests; browsers may cache resources. No application cookies or persistent browser storage code. | Rendering and operating the requested site. | No application consent mechanism identified as needed for these functions. |
| Google Fonts stylesheet link | Requests to `fonts.googleapis.com` and font assets normally on `fonts.gstatic.com`; connection/request data can include IP, user agent and referrer according to browser policy. Browser resource caching may occur. | Typography. External service, not strictly necessary to enquire; system fonts are fallbacks. No analytics or cookie-setting code in this repository. | An external request alone does not establish a consent-cookie requirement. Verify actual provider responses/device access and current applicable UK rules before final launch. Consider self-hosting the same fonts to remove these requests without changing typography. Not silently removed in this task. |
| Photo file picker, Image decoding, canvas and blob/object URLs | Only files explicitly selected by the visitor; previews and resized copies in page memory. No upload or local/session storage. Removed photo URLs and temporary decode URLs are revoked. | User-requested local photo preparation; no fingerprint collection or transmission. | Appears necessary to provide the photo feature the user requests; no separate consent mechanism identified for this implementation. |
| HTML autocomplete | The browser may access its own saved name/contact/address data according to user settings. Site specifies semantic autocomplete hints, not a storage mechanism. | Completing the requested enquiry. | No site consent banner identified as needed for these ordinary user-controlled fields. |
| `tel:` / `mailto:` links | Opens the user's phone/email application; information sent by the user then follows that application's path. | Explicit user action to contact John. | No tracker or embedded widget and no site cookie consent identified. |
| GitHub Pages / future hosting | Provider infrastructure can process IP and request/security logs; exact retention, headers and cookies not established by repository inspection. | Hosting/security; final platform still to be decided. | Must verify deployed responses and provider arrangements. This report cannot classify unobserved cookies as strictly necessary. |

## Not found

No application cookies (`document.cookie` or server `Set-Cookie`), localStorage/sessionStorage, IndexedDB, service workers, Google Analytics, Tag Manager, Meta Pixel, advertising SDKs, tracking pixels, embedded frames/maps/videos, third-party scripts, CAPTCHAs or anti-spam libraries were found. `package.json` has no dependencies or install scripts. `app.js` has no fetch/XHR/beacon/WebSocket network submission. The photo canvas is for resizing requested photos, not a fingerprinting routine. Google Fonts is linked as a stylesheet in each page head; there are no external JavaScript imports. The static server implements no enquiry route.

## Decision for the current site

Do not add a cookie banner. No consent-requiring application storage or tracker was identified in the current source or local tests. This qualified conclusion is not a blanket claim that the hosting network, font provider or future backend never uses cookies. Assess applicable UK PECR consent rules separately from the UK GDPR lawful basis for personal data.

## Outstanding review before enabling enquiries

- Check the real GitHub Pages and final-host HTTP responses, cookies and browser storage on a fresh visit. Local tests cannot establish third-party/production behaviour; provider requests can be blocked in this environment.
- Confirm Google Fonts request handling/privacy terms, whether to self-host, and any transfer safeguards. Do not equate a lack of analytics with a lack of personal data processing.
- Identify the final host, mailbox provider, Resend processing region/terms and subprocessors; confirm log and backup retention.
- Choose backend spam/rate-limiting controls. Re-audit any CAPTCHA/widget or technology that reads/writes device information before enabling it.
- If a non-essential consent-requiring tracker is added, propose blocking it until opt-in with equally accessible reject/withdraw controls before implementing a banner.

## Reproduction

Search all runtime files and the manifest for cookie/storage APIs, network APIs, external URLs, iframes and external scripts. Inspect each match rather than treating a keyword as evidence of tracking. Check computed font fallbacks and browser requests/storage; photo blob URL requests are local and must not be mistaken for uploads. Repeat the deployed-site audit after the hosting move or any new dependency.
