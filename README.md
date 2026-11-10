# WRINGG Landing Page

Production-ready standalone landing page for WRINGG, built with Next.js, TypeScript, Tailwind CSS, and the App Router.

## Brand

- Company: WRINGG
- Tagline: Wash. Wear. Repeat.
- Domain: wringg.in
- Location: BTM Layout, Bengaluru
- WhatsApp: +91 84385 08211
- Email: hello@wringg.in

## Routes

- `/` - landing page
- `/privacy` - Privacy Policy
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

This project uses `output: "export"` in `next.config.ts`, so the static production site is generated in the `out` directory.

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

## Assets

The site uses the current WRINGG brand assets from `public`:

- Navbar: `public/LOGO+TEXT.jpg`
- Footer and metadata icon: `public/LOGO.jpg`
- Generated page visuals: `public/1 (2).png`, `public/1 (3).png`, `public/1 (4).png`, `public/1 (5).png`, `public/1.WEBP.png`, `public/2.WEBP.png`

## Pilot CTA Links

The landing page is currently in pilot mode. Primary CTAs use WhatsApp prefilled flows for early customer pickup requests and host onboarding, with button text framed as product actions instead of WhatsApp actions. These can later be swapped for app deep links or form URLs in `src/app/page.tsx`.
