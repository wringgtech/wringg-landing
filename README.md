# WRINGG Landing Page

Production-ready standalone landing page for WRINGG, built with Next.js, TypeScript, Tailwind CSS, and the App Router.

## Brand

- Company: WRINGG NETWORKS PRIVATE LIMITED
- Tagline: Wash. Wear. Repeat.
- Domain: wringg.in
- Location: BTM Layout, Bengaluru
- WhatsApp: +91 84385 08211
- Email: contact@wringg.in
- Registered address: 101, Oxford Towers, 139/88, HAL Old Airport Road, Hulsur Bazaar, Bangalore North, Bengaluru - 560008

## Routes

- `/` - landing page
- `/download` - shareable customer app smart link
- `/privacy` - Privacy Policy
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

## Cloudflare Worker Deployment

This project deploys as a Cloudflare Worker with static assets from the `out` directory.

Wrangler is included for CLI deployment.

```bash
npm run build
npm run worker:preview
```

Deploy the Worker:

```bash
npm run worker:deploy
```

If this is your first Cloudflare CLI deploy, authenticate first:

```bash
npx wrangler login
```

The Wrangler config is in `wrangler.jsonc`. Static assets are served from `out` using Workers static assets without an assets binding.

## Assets

The site uses the current WRINGG brand assets from `public`:

- Navbar: `public/LOGO+TEXT.jpg`
- Footer and metadata icon: `public/LOGO.jpg`
- Generated page visuals: `public/1 (2).png`, `public/1 (3).png`, `public/1 (4).png`, `public/1 (5).png`, `public/1.WEBP.png`, `public/2.WEBP.png`

## App download link

Share https://wringg.in/download in social profiles, messages, and QR codes.
Android visitors automatically go to the customer Google Play listing.
iPhone/iPad visitors go to the App Store once its verified URL is set in
`src/lib/app-links.mjs` (`appStoreLinks.ios`). Until then they see booking
support; desktop, unknown devices, and browsers without JavaScript see manual links.
iPadOS desktop-style user agents are detected using touch support.

Customer CTAs use this link; host onboarding continues through WhatsApp.
This is a store-routing smart link, not an installed-app Universal Link.
It works with the existing static Cloudflare deployment and needs no paid service.

Run routing checks with `node --test tests/app-links.test.mjs`.
