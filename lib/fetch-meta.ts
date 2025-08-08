import 'server-only';
import * as cheerio from 'cheerio';

export async function fetchMeta(url: string): Promise<{ title: string; favicon: string; html: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    const html = await res.text();
    const $ = cheerio.load(html);
    const title =
      $('title').first().text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      url;

    let favicon =
      $('link[rel~="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href') ||
      '';

    if (favicon && !favicon.startsWith('http')) {
      const base = new URL(url);
      try {
        favicon = new URL(favicon, base.origin).toString();
      } catch {
        favicon = '';
      }
    }
    if (!favicon) {
      const domain = new URL(url).hostname;
      favicon = `https://www.google.com/s2/favicons?domain=${domain}`;
    }

    return { title, favicon, html };
  } catch {
    const domain = new URL(url).hostname;
    return {
      title: url,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}`,
      html: '',
    };
  }
}
