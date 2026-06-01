const DPS_BASE = "https://dps.psx.com.pk";
const TIMEOUT = Number(process.env.PSX_REQUEST_TIMEOUT_MS ?? 20000);

async function fetchText(path: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(`${DPS_BASE}${path}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json, text/html",
        "User-Agent": "psx-agent-research/1.0",
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      throw new Error(`DPS ${path}: ${res.status}`);
    }
    return res.text();
  } finally {
    clearTimeout(timer);
  }
}

/** EOD timeseries: [[unixTs, close, volume, open], ...] */
export async function getEodTimeseries(symbol: string): Promise<number[][]> {
  const text = await fetchText(`/timeseries/eod/${symbol.toUpperCase()}`);
  const json = JSON.parse(text) as { status?: number; data?: number[][] };
  return json.data ?? [];
}

export interface ParsedAnnouncement {
  symbol?: string;
  title: string;
  date?: string;
}

/** Best-effort parse of announcements page (HTML or embedded JSON) */
export async function getAnnouncementsForSymbol(
  symbol: string
): Promise<ParsedAnnouncement[]> {
  try {
    const text = await fetchText(
      `/announcements/companies?symbol=${symbol.toUpperCase()}`
    );
    const announcements: ParsedAnnouncement[] = [];
    const titleMatches = text.matchAll(/<a[^>]*>([^<]{10,200})<\/a>/gi);
    for (const m of titleMatches) {
      const title = m[1].trim();
      if (title.toLowerCase().includes(symbol.toLowerCase()) || title.length > 15) {
        announcements.push({ symbol, title, date: new Date().toISOString().slice(0, 10) });
      }
      if (announcements.length >= 10) break;
    }
    return announcements;
  } catch {
    return [];
  }
}
