# Landing Page Scorecard

Score a public landing page across messaging, trust, CTA density, offer visibility, and SEO basics.

## Deploy to Cloudflare

Replace `https://github.com/lindoai/landing-page-scorecard` with the final public repo URL when this tool is split into its own repository.

```md
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/lindoai/landing-page-scorecard)
```

## Features

- category scores for SEO, messaging, trust, CTA, and offer
- simple total score
- JSON-friendly output for audits and automation

## Local development

```bash
npm install
npm run dev
npm run typecheck
```

## Deploy

```bash
npm run deploy
```

## Production env

- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

## API

### GET `/api/score?url=https://example.com`

Returns JSON score output.
