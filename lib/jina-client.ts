import 'server-only';

// Use Jina Reader to fetch readable text for a URL:
// curl example:
//   curl "https://r.jina.ai/https://example.com" -H "Authorization: Bearer <JINA_API_KEY>"
export async function fetchReadableViaJina(url: string): Promise<string> {
  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) return '';
  const readerUrl = `https://r.jina.ai/${url}`;
  const res = await fetch(readerUrl, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) return '';
  return res.text();
}

// Optional: summarize text using a custom Jina summarizer endpoint if configured.
// If not configured, fall back to a short trimmed snippet.
export async function summarizeText(text: string): Promise<string> {
  const endpoint = process.env.JINA_API_URL; // optional: your summarizer endpoint
  const apiKey = process.env.JINA_API_KEY;

  // If you have a Jina summarizer endpoint, call it here
  if (endpoint && apiKey) {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: text, length: 80 }), // adjust per your endpoint spec
    });
    if (resp.ok) {
      const data = await resp.json().catch(() => ({} as any));
      const summary = data?.summary ?? data?.data?.summary ?? '';
      if (summary) return summary;
    }
  }

  // Fallback: crude truncation as a 1-2 sentence teaser
  const trimmed = text.replace(/\s+/g, ' ').trim();
  return trimmed.slice(0, 220) + (trimmed.length > 220 ? '…' : '');
}
