# WRINGG Landing Page

Production-ready standalone landing page for WRINGG, built with Next.js, TypeScript, Tailwind CSS, and the App Router.

## Brand

- Company: WRINGG
- Tagline: Wash. Wear. Repeat.
- Domain: wringg.in
- Location: BTM Layout, Bengaluru
- WhatsApp: +91 72002 32473
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

- **Join Pilot / Book Pickup:** the active [Website Pilot customer download link](https://go.wringg.in/r/7f48272933034476b52ba92c90f53907). Washmate's existing download service opens Google Play on Android and shows its download page with a QR code on desktop.
- **Become Partner:** the [Wringg Partner Google Play listing](https://play.google.com/store/apps/details?id=in.wringg.partner), including the navigation link.
- **WhatsApp support:** remains available at +91 72002 32473.

Download links preserve every incoming `utm_*` field, including custom fields and encoded values. Direct Google Play links also carry these fields in the install-referrer parameter. Other incoming query parameters are not forwarded. The existing Washmate service records the Website Pilot campaign; storing individual incoming UTM values there is a separate backend change.

Run `npm run test:links` to check UTM forwarding and install-referrer encoding.

## Online booking (customer web)

The site includes a browser version of the customer app's booking flow:

- `/login` - phone OTP sign-in, then name for first-time customers
- `/book` - pickup address (browser location + typed address), service, clothes count, pickup slot, first-order coupon, cash-on-delivery order
- `/order?id=…` - order status
- `/orders` - active orders

The pages are client components that call the same Washmate Supabase edge functions as the mobile app (`src/lib/washmate`). There is no server of our own: the static export calls the backend from the browser, and the signed-in session (Supabase access and refresh tokens) is kept in `localStorage`. Payment is cash on delivery only.

Configure the backend at build time. Both values are public (the same anon key ships in the mobile app):

```bash
NEXT_PUBLIC_WASHMATE_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_WASHMATE_SUPABASE_ANON_KEY=<anon key>
```

Put them in `.env.local` for local work, and in the Cloudflare Workers Builds environment for production. When they are missing, the booking pages show a "Book in the WRINGG app" card instead of the form.

Requests identify as `x-app-id: in.wringg.customer` with no `x-app-version-code`. The backend's app-version gate treats this as an unversioned client; if the active `app_version_policies` row rejects unversioned clients, the pages show the same app fallback.

Run `npm test` for all unit tests.
