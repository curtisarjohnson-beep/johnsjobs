# Technical SEO and migration — 4 November 2026

## Scope and current demo

Visible copy and one-page design are locked. Homepage and privacy-page visible body-text comparisons against the pre-change files were identical; no headings, paragraphs, service descriptions, reviews, slogans or CTA wording was rewritten, added, removed or rearranged. The privacy page already existed. No new marketing pages were created.

Both demo pages use `noindex,follow`. No canonical or `og:url` designates the GitHub Pages demo or prematurely designates the existing production site. No demo sitemap is advertised or submitted. This keeps the demo viewable; it is not password protection. Search engines must revisit a previously indexed URL to discover noindex, and removal is not immediate or guaranteed by deployment alone.

`robots.txt` allows crawling so noindex can be read. A project hosted at `/johnsjobs/` cannot control the GitHub host's root `/robots.txt`; page-level noindex is the demo safeguard. The included robots file becomes authoritative only when placed at the root of the eventual production host. Do not use Disallow to try to enforce noindex.

## Implemented

- Existing titles and descriptions retained; Open Graph type/site/title/description/locale and Twitter summary metadata added using existing non-visible metadata. No demo canonical/URL or production image URL is introduced prematurely.
- Organization JSON-LD contains confirmed name, mobile, email and service areas only. No fabricated address, registration details, opening hours, ratings, reviews, credentials or environmental claims. Production URL/identifier/logo are injected only into separate production artifacts. Valid schema does not promise Google rich-result eligibility or rankings.
- Existing service/process/about/contact sections labelled using their existing headings; IDs/ARIA do not change the visible text or section order.
- WebP responsive logo (116/232px) and team photo (768/1024/1536px), retaining original aspect ratios, existing rendered dimensions and alt text. Full-resolution team WebP is lossless; smaller variants use high-quality Lanczos downsampling and lossless encoding. No new cropping or image content. Originals remain in Git but are excluded from the Pages build and not copied into production artifacts.
- Original logo ~1,097 KB; 116px variant ~14 KB and 232px ~44 KB. Original team photo ~2,270 KB; 768px ~441 KB, 1024px ~745 KB, 1536px ~1,503 KB. Browser choice depends on display size/pixel density; these are asset sizes, not measured real-world Core Web Vitals improvements.
- Font loading moved from CSS `@import` to head stylesheet links/preconnects using the identical DM Sans/Manrope families, weights and display=swap. No font substitution or self-hosting silently introduced; Google remains a provider and the cookie audit is updated.
- Demo local server supports optimized assets/robots; private preview/template paths remain unserved. Development tooling is still excluded from Pages.

Rebuild images, if needed, with `python _dev/optimize-images.py` using Pillow (build-time only, not a website dependency).

## Separate production preparation

Only at the approved launch stage, after confirming apex versus www:

```
npm run seo:production -- https://johnsjobs.uk /tmp/johnsjobs-production
```

The command requires an empty directory outside the checkout. It generates an allowlisted static artifact set, not a deployment. The demo source remains noindex. It accepts only HTTPS `johnsjobs.uk` or `www.johnsjobs.uk` and rejects output inside the checkout. Do not run it to change GitHub Pages' demo publication.

Generated production changes: homepage index/follow, confirmed-origin self-canonical, matching `og:url`, absolute logo social-image URLs and Organization URL/@id/logo; privacy self-canonical and index/follow; root sitemap containing both existing indexable pages; root robots declaring that sitemap. It does not add an enquiry backend or enable submission. Future PHP/Workers code and private credentials must be deployed separately under the integration contract.

## Migration checklist — not performed

1. Inventory the current johnsjobs.uk site's indexable URLs, status codes, backlinks and Search Console coverage before replacement. Preserve existing value; redirect old useful URLs to genuinely relevant destinations, not indiscriminately to the homepage. New content/pages require separate approval.
2. Confirm the preferred HTTPS apex/www hostname; implement one-hop permanent redirects from alternatives and `/index.html` to `/` where supported, preserving meaningful fragments/query handling. Enforce HTTPS and a valid certificate. Host redirects cannot be implemented by HTML canonical tags alone.
3. Complete the business/privacy/backend launch decisions separately. Both existing production pages are now index/follow at the owner’s request; keep resolving any policy confirmations separately.
4. Build into a new empty output directory. Preview and verify every canonical/schema/social URL matches the actual destination and that ONLY production homepage indexing is enabled. Upload the artifact set to the correct host; configure compression/cache policy there. Keep a rollback copy of the prior site.
5. Verify live HTTP statuses, headers (including any X-Robots-Tag), page source, robots and sitemap at the domain root. Check there is no inherited hosting noindex or robots block. Confirm old URL redirects, assets, contact links, mobile layout and unchanged form state. Exclude `_dev`, `_email`, docs, sample emails, originals and backend secrets from public artifacts.
6. Verify the domain in Google Search Console, submit the production sitemap, inspect/request indexing of the live homepage and monitor crawling/404s/redirects. Keep the separate GitHub demo noindex; optionally retire it or redirect to production after an explicit decision.
7. Validate production structured data and rendered HTML using appropriate Google/Schema.org tools. Run production Lighthouse/PageSpeed and inspect real Core Web Vitals when field data becomes available. Local checks do not establish external crawlers' state, inbox delivery or production speed.

## Recommendations only — no content/page changes made

After approval, consider evidence-based service/location pages, links from the Google Business Profile, and fuller business details if appropriate for LocalBusiness data. First audit existing production pages and verify the legal/trading entity/address. Do not invent an address for a service-area business, create thin duplicated location pages, add self-serving review stars or rewrite the locked wording to target keywords. Self-hosting the identical fonts is a future provider/privacy choice; it was not required to preserve today's typography.

## Validation

Node syntax checks and 11 automated email/SEO tests pass, including demo protection, schema constraints, production artifact generation and output safeguards. Browser checks at 320, 390, 768, 1024 and 1440px compared both pages' heading positions and dimensions with the pre-change versions (within 1px), loaded optimized images, checked no overflow, internal section links, demo noindex and disabled submission. External fonts were blocked for deterministic layout comparisons; production font/network performance still requires testing. No browser JavaScript exceptions occurred. No email delivery or live production changes were performed.

## Confirmed PHP host update
The separate `deploy:prepare` command now assembles the confirmed PHP integration alongside production SEO artifacts; see `PHP-DEPLOYMENT.md`. The default SEO preparation command and GitHub Pages demo still do not opt into enquiries. No production DNS/site deployment has been made.
