# ToolHub.pk — Free Online Tools

A collection of **27 free online utilities**: PDF tools, image tools, calculators,
text tools, generators, converters and developer tools. Built with
**Next.js 16 (App Router) + TypeScript + Tailwind CSS v4**.

**Tagline:** Free Online Tools — Fast, Private, No Sign-up (مفت آن لائن ٹولز)

## Features

- **27 working tools**, each on its own SEO-friendly page (`/tools/[slug]`)
  - **PDF** (pdf-lib, 100% client-side): merge, split by page ranges, compress
  - **Image** (canvas, 100% client-side): resize, compress with quality slider, convert (JPG/PNG/WebP), crop with drag select
  - **Calculators**: age, percentage, EMI (PKR sliders), BMI, discount, Pakistan salary tax (indicative)
  - **Text**: word counter, case converter, lorem ipsum, slug generator, remove duplicate lines
  - **Generators**: QR code (PNG download), password + strength meter, color picker, bulk UUID
  - **Converters**: units (length/weight/temp/area/speed), currency with live rates (Frankfurter API, PKR default)
  - **Developer**: JSON formatter/validator, Base64, URL encoder
- Catchy gradient hero with big search, category sections, popular-tools row
- Each tool page: how-to steps, FAQ (with FAQ schema), related tools
- AdSense-ready `<AdSlot>` placeholders (no real ad code included)
- SEO: per-page metadata, `sitemap.xml` (all tool URLs), `robots.txt`
- About / Contact / Privacy pages (Privacy includes AdSense/cookie disclosure)
- Fully responsive, inline SVG icons, no external image hotlinking
- **Privacy:** all file processing happens in the browser — files never leave the device

## Run locally

```bash
cd tools-hub
npm install
npm run dev
# open http://localhost:3000
```

## Build

```bash
npm run build   # must pass cleanly
npm start
```

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Framework preset **Next.js** is auto-detected — no custom settings needed.
4. Click **Deploy**. Your live link: `https://<project>.vercel.app`.
5. (Optional) Add your custom domain in Vercel → Settings → Domains.
6. (Optional) For AdSense: paste your AdSense script tag where marked in
   `app/layout.tsx`, then replace the `<AdSlot>` placeholders with your ad units.

## Notes & caveats

- **Currency rates** come from the free Frankfurter API (ECB reference rates);
  the tool shows a friendly notice if offline.
- **Pakistan tax calculator** uses the latest known salary slabs and is labelled
  **indicative** — verify with FBR; update slabs after each budget.
- **PDF compress** re-saves with object streams (modest savings); it does not
  downsample images.
- **Contact form** is a non-sending demo — wire it to Formspree or a backend
  before launch.
- Tool count target was 27; see the final report for any tools that could not
  be shipped.
