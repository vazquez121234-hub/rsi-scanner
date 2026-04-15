export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  const ETFS = [
    "TQQQ","SOXL","UPRO","TNA","TECL","FAS","LABU",
    "SQQQ","SOXS","SPXU","TZA","TECS","FAZ","LABD"
  ];

  function calcRSI(closes, period = 14) {
    if (closes.length < period + 1) return null;
    let gains = [], losses = [];
    for (let i = 1; i < closes.length; i++) {
      const d = closes[i] - closes[i - 1];
      gains.push(d > 0 ? d : 0);
      losses.push(d < 0 ? -d : 0);
    }
    let ag = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let al = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < gains.length; i++) {
      ag = (ag * (period - 1) + gains[i]) / period;
      al = (al * (period - 1) + losses[i]) / period;
    }
    if (al === 0) return 100;
    return Math.round((100 - 100 / (1 + ag / al)) * 100) / 100;
  }

  function getRsiHistory(closes) {
    const hist = [];
    for (let i = 16; i <= closes.length; i++) {
      const r = calcRSI(closes.slice(0, i));
      if (r !== null) hist.push(r);
    }
    return hist.slice(-20);
  }

  async function fetchOne(symbol) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1wk&range=1y&includePrePost=false`;
    try {
      const r = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (!r.ok) throw new Error(r.status);
      const data = await r.json();
      const result = data?.chart?.result?.[0];
      if (!result) return null;
      const q = result.indicators?.quote?.[0];
      if (!q) return null;
      const closes = (q.close || []).filter(v => v != null);
      if (closes.length < 16) return null;
      const price = closes[closes.length - 1];
      const prev = closes[closes.length - 2];
      const change = prev ? Math.round(((price - prev) / prev) * 10000) / 100 : 0;
      const rsi = calcRSI(closes);
      const rsiHistory = getRsiHistory(closes);
      return { price: Math.round(price * 100) / 100, change, rsi, rsiHistory };
    } catch (e) {
      return null;
    }
  }

  try {
    const results = {};
    const promises = ETFS.map(async (sym) => {
      const data = await fetchOne(sym);
      if (data) results[sym] = data;
    });
    await Promise.all(promises);
    res.status(200).json({ data: results, timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
