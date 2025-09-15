import DOMPurify from 'dompurify';

export async function postWithTimeout(url: string, payload: any, timeoutMs = 90000): Promise<any> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(id);
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`HTTP ${resp.status}: ${txt}`);
    }
    return await resp.json();
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === 'AbortError') throw new Error('timeout');
    throw err;
  }
}

export function safeNum(v: any, decimals = 0): string {
  const n = Number(v);
  if (!isFinite(n)) return (decimals === 0 ? '0' : (0).toFixed(decimals));
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function renderHtmlReportInIframe(iframeEl: HTMLIFrameElement | null, rawHtml: string) {
  if (!iframeEl) return;
  const sanitized = DOMPurify.sanitize(rawHtml, {ADD_ATTR: ['target', 'rel']});
  iframeEl.srcdoc = sanitized;
}
