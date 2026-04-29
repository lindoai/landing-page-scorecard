import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { parseHTML } from 'linkedom';
import { readTurnstileTokenFromUrl, verifyTurnstileToken } from '../_shared/turnstile';
import { renderTextToolPage, turnstileSiteKeyFromEnv } from '../_shared/tool-page';

type Env = { Bindings: { TURNSTILE_SITE_KEY?: string; TURNSTILE_SECRET_KEY?: string } };

const app = new Hono<Env>();
app.use('/api/*', cors());
app.get('/', (c) => c.html(renderTextToolPage({ title: 'Landing Page Scorecard', description: 'Score a landing page across messaging, SEO, trust, CTA, and offer signals.', endpoint: '/api/score', sample: '{ "total": 78, "categories": { "seo": 20 } }', siteKey: turnstileSiteKeyFromEnv(c.env), buttonLabel: 'Score' })));
app.get('/health', (c) => c.json({ ok: true }));
app.get('/api/score', async (c) => {
  const captcha = await verifyTurnstileToken(c.env, readTurnstileTokenFromUrl(c.req.url), c.req.header('CF-Connecting-IP'));
  if (!captcha.ok) return c.json({ error: captcha.error }, 403);
  const normalized = normalizeUrl(c.req.query('url') ?? '');
  if (!normalized) return c.json({ error: 'A valid http(s) URL is required.' }, 400);
  const html = await fetchHtml(normalized);
  if (!html) return c.json({ error: 'Failed to fetch page.' }, 502);
  const { document } = parseHTML(html);
  const text = (document.body?.textContent || '').replace(/\s+/g, ' ').toLowerCase();
  const title = document.title || '';
  const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
  const ctaCount = document.querySelectorAll('a,button').length;
  const trustSignals = countMatches(text, /(testimonial|trusted|review|case study|clients|agencies|customers)/g);
  const pricingSignals = countMatches(text, /(pricing|\$|€)/g);
  const seo = (title ? 10 : 0) + (description ? 10 : 0);
  const messaging = Math.min(20, Math.max(0, title.length > 10 ? 10 : 0) + (document.querySelectorAll('h1,h2').length > 1 ? 10 : 0));
  const trust = Math.min(20, trustSignals * 4);
  const cta = Math.min(20, ctaCount >= 3 ? 20 : ctaCount * 5);
  const offer = Math.min(20, pricingSignals > 0 ? 20 : 6);
  const total = seo + messaging + trust + cta + offer;
  return c.json({ url: normalized, total, categories: { seo, messaging, trust, cta, offer }, details: { title, description, ctaCount, trustSignals, pricingSignals } });
});

function countMatches(value: string, regex: RegExp) { return value.match(regex)?.length ?? 0; }
async function fetchHtml(url: string) { const r = await fetch(url, { headers: { accept: 'text/html,application/xhtml+xml' } }).catch(() => null); return r?.ok ? r.text() : null; }
function normalizeUrl(value: string): string | null { try { return new URL(value.startsWith('http') ? value : `https://${value}`).toString(); } catch { return null; } }
export default app;
