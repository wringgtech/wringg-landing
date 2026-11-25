# WRINGG Landing Page

WRINGG’s approved blue/mint marketing website, built alongside the existing Next.js legal and support pages. Cloudflare continues to deploy the static `out` directory.

## Brand

- Company: WRINGG
- Tagline: Wash. Wear. Repeat.
- Domain: wringg.in
- Location: BTM Layout, Bengaluru
- WhatsApp: +91 72002 32473
- Email: hello@wringg.in

## Routes

- `/` - approved interactive landing page
- `/pricing/` - visual pricing, machine matching and special-care products
- `/our-story/` - responsive scroll-driven neighbourhood story
- `/commercial-laundry/` - commercial partner email-draft enquiry
- `/privacy` - Privacy Policy
- `/user-privacy` - native-app privacy disclosures
- `/delete-account` - Account-deletion instructions
- `/terms` - Terms & Conditions
- `/refund` - Refund & Cancellation Policy
- `/shipping` - Shipping & Delivery Policy
- `/contact` - Contact page

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production Build

```bash
npm run build
```

This project uses `output: "export"` in `next.config.ts`. `prebuild` compiles the shared download-link helper, Next exports the current legal/help routes, and `postbuild` copies the four approved marketing HTML documents into their canonical paths in `out`. The build does not replace current legal text or company details.

## Cloudflare production deployments

The `wringg` Worker serves `wringg.in` and builds from `wringgtech/wringg-landing`. Pushes and merged pull requests to `main` trigger Cloudflare Workers Builds and deploy the resulting static site.

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Root directory | `/` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Build watch paths | `*` |
| Automatic builds | Enabled |

Cloudflare installs dependencies from `package-lock.json` before running the build. Next.js exports the site to `out`, and `wrangler.jsonc` deploys those static assets to the existing `wringg` Worker. Build credentials are managed in Cloudflare.

After a push, open **Workers & Pages → wringg → Deployments → View build history**. Confirm that the build uses the expected `main` commit and that the new deployment is active, then check `https://wringg.in/privacy/` and `https://wringg.in/delete-account/`. A failed build leaves the previous successful deployment serving the website.

## Local Cloudflare preview

Preview the production export locally:

```bash
npm run preview
```

For an authenticated deployment from a local repository checkout:

```bash
npm run deploy
```

Both scripts build the static export first. The Wrangler configuration is in `wrangler.jsonc`.

## Editing the approved design

- `website/pages/index.html`: homepage, washer controls, booking toggle, role tabs and partner presentation.
- `website/pages/pricing.html`: care/pricing page and product selectors.
- `website/pages/our-story.html`: six-chapter motion story, including phone presentation and note/reply reveals.
- `website/pages/commercial-laundry.html`: email-draft enquiry page; the website does not submit business details.
- `public/wringg-*.css` and `public/wringg-*.js`: editable page styling and interactions. `wringg-base.css` is the standalone base stylesheet captured from the approved design; it has no dependency on generated Next paths.
- `public/assets/`: only the imagery referenced by the approved pages, including the corrected original-artwork transparent logo.
- `public/fonts/`: the same self-hosted Plus Jakarta Sans font files used by the approved preview.
- `src/app/*/page.tsx`, `legal-content.ts` and `company-details.ts`: existing legal/support content and company information.

The marketing pages use static Next Route Handlers to serve the same HTML in development, so they do not hydrate or depend on old generated Next JavaScript. `scripts/export-marketing.mjs` fixes their output paths for Cloudflare’s directory-style URLs. All source assets are local to this repository; the public preview is not a runtime dependency. Follow ordinary anchor links between marketing and legal pages.

The source design is the approved WRINGG V13 preview from 25 November 2026, including the transparent original-contour logo, corrected phone star, mobile sticky story scenes, care prices (shoes ₹149, curtains ₹219 per panel, bags ₹209, carpets ₹148 per piece), and qualified earning-potential copy. The story is explicitly imagined, and homemade sweets are a personal gesture rather than a promised service benefit.

## Pilot CTA Links

- **Join Pilot / Book Pickup:** the active [Website Pilot customer download link](https://go.wringg.in/r/7f48272933034476b52ba92c90f53907). Washmate's existing download service opens Google Play on Android and shows its download page with a QR code on desktop.
- **Become Partner:** the [Wringg Partner Google Play listing](https://play.google.com/store/apps/details?id=in.wringg.partner), including the navigation link.
- **WhatsApp support:** remains available at +91 72002 32473.

Download links preserve every incoming `utm_*` field, including custom fields and encoded values. Direct Google Play links also carry these fields in the install-referrer parameter. Other incoming query parameters are not forwarded. The existing Washmate service records the Website Pilot campaign; storing individual incoming UTM values there is a separate backend change.

Run `npm run test:links` to check UTM forwarding and install-referrer encoding.

## Validation

```bash
npm run build
node --experimental-strip-types --test tests/*.test.mjs
```

`public/marketing-downloads.js` uses a browser module generated from the unchanged production `src/app/download-links.ts`, retaining UTM forwarding and Google Play install-referrer behavior. It also shows Android handoff feedback and restores links when a user returns. Internal marketing navigation retains only `utm_*` campaign parameters; unrelated query values are not forwarded.
