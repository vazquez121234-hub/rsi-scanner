import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";

/* ── 롱 ETF만 표시 ── */
const LONGS = [
  { s:"TQQQ", n:"나스닥100 3x", g:"core", w:40 },
  { s:"UPRO", n:"S&P500 3x", g:"core", w:35 },
  { s:"FAS",  n:"금융섹터 3x", g:"core", w:25 },
  { s:"SOXL", n:"반도체 3x",  g:"sat",  w:20 },
  { s:"TECL", n:"기술섹터 3x", g:"etc",  w:0 },
  { s:"TNA",  n:"러셀2000 3x", g:"etc",  w:0 },
  { s:"LABU", n:"바이오 3x",  g:"etc",  w:0 },
];
// 숏 ETF는 API에서 데이터만 가져오고 카드에는 안 보여줌

const zn = r => {
  if (r == null) return { t:"대기", c:"#2e4260", lv:0 };
  if (r <= 30) return { t:"강력매수", c:"#2dd4a0", lv:1 };
  if (r <= 35) return { t:"매수관심", c:"#f0c040", lv:2 };
  if (r >= 70) return { t:"매도전환", c:"#f06080", lv:5 };
  if (r >= 65) return { t:"매도관심", c:"#e88a40", lv:4 };
  return { t:"관망", c:"#2e4260", lv:3 };
};

const dir = (c, p) => {
  if (c == null || p == null) return { i:"", c:"#2e4260", d:0 };
  const d = Math.round((c - p) * 10) / 10;
  if (d > 3) return { i:"↑↑", c:"#2dd4a0", d };
  if (d > 0.5) return { i:"↗", c:"#5ed5a8", d };
  if (d < -3) return { i:"↓↓", c:"#f06080", d };
  if (d < -0.5) return { i:"↘", c:"#d4687a", d };
  return { i:"→", c:"#2e4260", d };
};

function RsiMeter({ rsi, size = 140 }) {
  const cx = size/2, cy = size/2 + 8, rad = size/2 - 10;
  const arc = (s, e) => {
    const sa = (s-90)*Math.PI/180, ea = (e-90)*Math.PI/180;
    return `M ${cx+rad*Math.cos(sa)} ${cy+rad*Math.sin(sa)} A ${rad} ${rad} 0 ${e-s>180?1:0} 1 ${cx+rad*Math.cos(ea)} ${cy+rad*Math.sin(ea)}`;
  };
  const ang = rsi != null ? (rsi/100*180-90)*Math.PI/180 : null;
  const c = zn(rsi).c;
  return (
    <svg width={size} height={size*.65} viewBox={`0 0 ${size} ${size*.65}`}>
      <path d={arc(-90,90)} fill="none" stroke="#1c2d4a" strokeWidth="8" strokeLinecap="round"/>
      <path d={arc(-90,-36)} fill="none" stroke="#2dd4a0" strokeWidth="8" strokeLinecap="round" opacity=".18"/>
      <path d={arc(-36,-27)} fill="none" stroke="#f0c040" strokeWidth="8" strokeLinecap="round" opacity=".1"/>
      <path d={arc(27,36)} fill="none" stroke="#e88a40" strokeWidth="8" strokeLinecap="round" opacity=".1"/>
      <path d={arc(36,90)} fill="none" stroke="#f06080" strokeWidth="8" strokeLinecap="round" opacity=".18"/>
      {ang != null && <>
        <line x1={cx} y1={cy} x2={cx+(rad-14)*Math.cos(ang)} y2={cy+(rad-14)*Math.sin(ang)} stroke={c} strokeWidth="3" strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r="4" fill={c}/>
      </>}
      <text x={cx} y={cy+22} textAnchor="middle" fill={c} fontSize={size*.17} fontWeight="800" className="mono">{rsi != null ? rsi.toFixed(1) : "—"}</text>
    </svg>
  );
}

function RsiTrack({ rsi }) {
  if (rsi == null) return <div className="track"/>;
  const c = zn(rsi).c;
  return (
    <div className="track">
      <div className="track-mark" style={{ left:"30%" }}/>
      <div className="track-mark sell" style={{ left:"70%" }}/>
      <div className="track-dot" style={{ left:`${Math.max(3,Math.min(97,rsi))}%`, background:c, boxShadow:`0 0 8px ${c}88` }}/>
    </div>
  );
}

function Spark({ data }) {
  if (!data || data.length < 2) return null;
  const w=100, h=26, mn=Math.min(...data,25), mx=Math.max(...data,75), rg=mx-mn||1;
  const y = v => h - ((v-mn)/rg)*h;
  const pts = data.map((v,i)=>`${(i/(data.length-1))*w},${y(v)}`).join(" ");
  const last = data[data.length-1];
  const lc = last<=30 ? "#2dd4a0" : last>=70 ? "#f06080" : "#5ba4e6";
  return (
    <svg width={w} height={h} style={{ display:"block" }}>
      <line x1="0" y1={y(30)} x2={w} y2={y(30)} stroke="#2dd4a0" strokeWidth=".5" opacity=".25" strokeDasharray="2,2"/>
      <line x1="0" y1={y(70)} x2={w} y2={y(70)} stroke="#f06080" strokeWidth=".5" opacity=".25" strokeDasharray="2,2"/>
      <polyline points={pts} fill="none" stroke="#5ba4e6" strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx={w} cy={y(last)} r="2.5" fill={lc}/>
    </svg>
  );
}

/* ── 포트폴리오 자동 배분 ── */
function buildPlan(amount, data) {
  // 롱 ETF 중 RSI ≤ 35인 것만 매수 대상
  const core3 = LONGS.filter(e => e.g === "core");
  const sat = LONGS.find(e => e.g === "sat");

  const buyTargets = core3
    .filter(e => data[e.s]?.rsi != null && data[e.s].rsi <= 35)
    .map(e => ({ ...e, rsi: data[e.s].rsi }));

  // SOXL은 RSI 30 이하에서만
  if (sat && data[sat.s]?.rsi != null && data[sat.s].rsi <= 30) {
    buyTargets.push({ ...sat, rsi: data[sat.s].rsi });
  }

  buyTargets.sort((a, b) => a.rsi - b.rsi);

  // 매도 대상: 롱 ETF 중 RSI ≥ 65
  const sellTargets = LONGS
    .filter(e => (e.g === "core" || e.g === "sat") && data[e.s]?.rsi != null && data[e.s].rsi >= 65)
    .map(e => ({ ...e, rsi: data[e.s].rsi }));

  // SQQQ 헷지: TQQQ RSI ≥ 65일 때만
  const tqqRsi = data["TQQQ"]?.rsi;
  const showHedge = tqqRsi != null && tqqRsi >= 65;

  // 매수 배분 계산
  const buyActions = [];
  if (buyTargets.length > 0) {
    const totalW = buyTargets.reduce((a, b) => a + b.w, 0);
    buyTargets.forEach(e => {
      const pct = Math.round((e.w / totalW) * 100);
      const alloc = Math.round(amount * e.w / totalW);
      const price = data[e.s]?.price;
      const shares = price ? Math.floor(alloc / price) : 0;
      buyActions.push({ s:e.s, n:e.n, g:e.g, rsi:e.rsi, pct, alloc, shares, price });
    });
  }

  return { buyActions, sellTargets, showHedge, tqqRsi };
}

export default function Home() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [ts, setTs] = useState(null);
  const [tab, setTab] = useState("core");
  const [sel, setSel] = useState(null);
  const [auto, setAuto] = useState(false);
  const [amt, setAmt] = useState("");
  const [showCalc, setShowCalc] = useState(false);
  const tmRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rsi");
      const json = await res.json();
      if (json.data) { setData(json.data); setTs(json.timestamp); }
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (auto) tmRef.current = setInterval(load, 300000);
    else clearInterval(tmRef.current);
    return () => clearInterval(tmRef.current);
  }, [auto, load]);

  const r = s => data[s]?.rsi ?? null;
  const pr = s => data[s]?.prevRsi ?? null;
  const cnt = LONGS.filter(e => r(e.s) != null).length;
  const buyAlerts = LONGS.filter(e => (e.g==="core"||e.g==="sat") && r(e.s) != null && r(e.s) <= 35);
  const sellAlerts = LONGS.filter(e => (e.g==="core"||e.g==="sat") && r(e.s) != null && r(e.s) >= 65);
  const hasAlert = buyAlerts.length > 0 || sellAlerts.length > 0;
  const plan = showCalc && amt ? buildPlan(Number(amt.replace(/,/g,"")), data) : null;
  const fN = n => n ? Number(n).toLocaleString("ko-KR") : "";

  const filtered = (() => {
    let list = [...LONGS];
    if (tab === "core") list = list.filter(e => e.g === "core" || e.g === "sat");
    else if (tab === "buy") list = list.filter(e => r(e.s) != null && r(e.s) <= 35);
    else if (tab === "sell") list = list.filter(e => r(e.s) != null && r(e.s) >= 65);
    return list.sort((a, b) => (r(a.s) ?? 999) - (r(b.s) ?? 999));
  })();

  const timeStr = ts ? new Date(ts).toLocaleString("ko-KR", { timeZone:"Asia/Seoul" }) : "";

  return (<>
    <Head>
      <title>RSI 전략 스캐너</title>
      <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
      <meta name="theme-color" content="#0b1120"/>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600;700&display=swap" rel="stylesheet"/>
    </Head>
    <style jsx global>{`
      :root{--bg:#0b1120;--sf:#111b2e;--card:#141f35;--border:#1c2d4a;--text:#c8d8eb;--mute:#2e4260;--accent:#5ba4e6;--buy:#2dd4a0;--sell:#f06080;--watch:#f0c040;--warn:#e88a40}
      *{box-sizing:border-box;margin:0;padding:0}
      body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased}
      .mono{font-family:'IBM Plex Mono',monospace}
      @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      @keyframes glow{0%,100%{box-shadow:0 0 6px #2dd4a030}50%{box-shadow:0 0 20px #2dd4a050}}
      @keyframes glowR{0%,100%{box-shadow:0 0 6px #f0608030}50%{box-shadow:0 0 20px #f0608050}}
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
      @keyframes slideD{from{opacity:0;transform:translateY(-16px)}to{opacity:1;transform:translateY(0)}}
      .track{position:relative;height:6px;border-radius:3px;background:var(--sf)}
      .track-mark{position:absolute;top:-2px;bottom:-2px;width:1px;background:var(--buy);opacity:.25}
      .track-mark.sell{background:var(--sell)}
      .track-dot{position:absolute;top:-4px;width:12px;height:14px;border-radius:7px;transform:translateX(-6px);transition:left .6s cubic-bezier(.4,0,.2,1)}
      .card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px 16px;cursor:pointer;transition:all .2s;animation:fadeUp .4s ease both}
      .card:active{transform:scale(.985)}
      .card.buy-g{animation:glow 2.5s ease infinite,fadeUp .4s ease both;border-color:#2dd4a040}
      .card.sell-g{animation:glowR 2.5s ease infinite,fadeUp .4s ease both;border-color:#f0608040}
      .btn{padding:12px;border-radius:10px;border:none;font-family:'DM Sans',sans-serif;font-weight:700;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:8px;width:100%}
      .btn:active{transform:scale(.97)}
      .tab{padding:8px 14px;border-radius:8px;border:none;background:transparent;color:var(--mute);font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s}
      .tab.on{background:var(--accent);color:#fff}
      input[type=text]{outline:none;font-family:'IBM Plex Mono',monospace}
      input[type=text]:focus{border-color:var(--accent)}
    `}</style>

    <div style={{ maxWidth:480, margin:"0 auto", minHeight:"100vh", paddingBottom:20 }}>

      {/* ═══ ALERT BANNER ═══ */}
      {hasAlert && cnt > 0 && (
        <div style={{ animation:"slideD .4s ease" }}>
          {buyAlerts.length > 0 && (
            <div style={{ padding:"14px 20px", background:"linear-gradient(135deg,#2dd4a00c,#2dd4a004)", borderBottom:"2px solid #2dd4a030" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <div style={{ width:10, height:10, borderRadius:5, background:"var(--buy)", animation:"pulse 1.5s ease infinite" }}/>
                <span style={{ fontSize:16, fontWeight:800, color:"var(--buy)" }}>매수 시그널 {buyAlerts.length}개</span>
              </div>
              <p style={{ fontSize:12, color:"var(--buy)", opacity:.8, marginBottom:10 }}>
                {buyAlerts.map(e => `${e.s} RSI ${r(e.s).toFixed(0)}`).join(" · ")}
              </p>
              {!showCalc && (
                <button className="btn" onClick={() => setShowCalc(true)}
                  style={{ background:"#2dd4a015", color:"var(--buy)", fontSize:13, border:"1px solid #2dd4a030" }}>
                  💰 지금 바로 투자금을 입력하세요
                </button>
              )}
            </div>
          )}
          {sellAlerts.length > 0 && (
            <div style={{ padding:"14px 20px", background:"linear-gradient(135deg,#f060800c,#f0608004)", borderBottom:"2px solid #f0608030" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <div style={{ width:10, height:10, borderRadius:5, background:"var(--sell)", animation:"pulse 1.5s ease infinite" }}/>
                <span style={{ fontSize:16, fontWeight:800, color:"var(--sell)" }}>매도 시그널 {sellAlerts.length}개</span>
              </div>
              <p style={{ fontSize:12, color:"var(--sell)", opacity:.8 }}>
                {sellAlerts.map(e => `${e.s} RSI ${r(e.s).toFixed(0)}`).join(" · ")} → 롱 10%만 유지, 나머지 STRC 파킹
                {data["TQQQ"]?.rsi >= 65 && " · SQQQ +10% 익절 고려"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══ HEADER ═══ */}
      <div style={{ padding:"20px 20px 14px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, color:"#fff", letterSpacing:"-0.5px" }}>주봉 RSI 전략</h1>
            <p style={{ fontSize:11, color:"var(--mute)", marginTop:4 }}>3x 롱 ETF · RSI 30~35 매수 / 65~70 매도</p>
          </div>
          <button onClick={() => setAuto(!auto)} style={{
            padding:"6px 10px", borderRadius:6, fontSize:10, fontWeight:600, cursor:"pointer",
            background: auto ? "#2dd4a010" : "var(--sf)",
            border: `1px solid ${auto ? "#2dd4a030" : "var(--border)"}`,
            color: auto ? "var(--buy)" : "var(--mute)"
          }}>
            {auto ? "● LIVE" : "○ 5분"}
          </button>
        </div>

        <button className="btn" onClick={load} disabled={loading}
          style={{ marginTop:12, background: loading ? "var(--sf)" : "var(--accent)", color:"#fff", fontSize:14, opacity: loading ? .6 : 1 }}>
          {loading
            ? <><div style={{ width:14, height:14, border:"2px solid #fff4", borderTopColor:"#fff", borderRadius:"50%", animation:"spin .7s linear infinite" }}/> 갱신중...</>
            : `새로고침${cnt > 0 ? ` · ${cnt}/7` : ""}`
          }
        </button>

        {ts && <p style={{ fontSize:10, color:"var(--mute)", marginTop:8, textAlign:"center" }}>{timeStr}{auto ? " · 자동 갱신 중" : ""}</p>}
      </div>

      {/* ═══ SIGNAL BOXES ═══ */}
      {cnt > 0 && (
        <div style={{ padding:"0 20px 8px", display:"flex", gap:8 }}>
          <div onClick={() => { setTab("buy"); if (buyAlerts.length > 0) setShowCalc(true); }}
            style={{ flex:1, padding:"14px 12px", borderRadius:12, textAlign:"center", cursor:"pointer",
              background: buyAlerts.length > 0 ? "#2dd4a008" : "var(--sf)",
              border: `1px solid ${buyAlerts.length > 0 ? "#2dd4a025" : "var(--border)"}` }}>
            <div style={{ fontSize:11, fontWeight:600, color:"var(--buy)" }}>매수 RSI ≤ 35</div>
            <div className="mono" style={{ fontSize:32, fontWeight:900, color:"var(--buy)", margin:"4px 0" }}>{buyAlerts.length}</div>
            <div style={{ fontSize:10, color:"var(--mute)" }}>롱 100% 진입</div>
          </div>
          <div onClick={() => setTab("sell")}
            style={{ flex:1, padding:"14px 12px", borderRadius:12, textAlign:"center", cursor:"pointer",
              background: sellAlerts.length > 0 ? "#f0608008" : "var(--sf)",
              border: `1px solid ${sellAlerts.length > 0 ? "#f0608025" : "var(--border)"}` }}>
            <div style={{ fontSize:11, fontWeight:600, color:"var(--sell)" }}>매도 RSI ≥ 65</div>
            <div className="mono" style={{ fontSize:32, fontWeight:900, color:"var(--sell)", margin:"4px 0" }}>{sellAlerts.length}</div>
            <div style={{ fontSize:10, color:"var(--mute)" }}>익절 → STRC 파킹</div>
          </div>
        </div>
      )}

      {/* ═══ PORTFOLIO CALCULATOR (항상 접근 가능) ═══ */}
      {cnt > 0 && !showCalc && (
        <div style={{ padding:"0 20px 8px" }}>
          <button className="btn" onClick={() => setShowCalc(true)}
            style={{ background:"var(--sf)", color:"var(--accent)", fontSize:13, border:`1px solid var(--border)` }}>
            💰 투자금 입력 → 자동 포트폴리오 배분
          </button>
        </div>
      )}

      {showCalc && (
        <div style={{ margin:"0 20px 12px", padding:16, background:"var(--sf)", borderRadius:12, border:"1px solid var(--border)", animation:"slideD .3s ease" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <span style={{ fontSize:15, fontWeight:700, color:"#fff" }}>💰 포트폴리오 자동 배분</span>
            <button onClick={() => setShowCalc(false)} style={{ background:"var(--card)", border:"none", color:"var(--mute)", width:28, height:28, borderRadius:7, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
          </div>

          {/* 금액 입력 */}
          <div style={{ position:"relative" }}>
            <input type="text" inputMode="numeric" placeholder="투자금 입력"
              value={amt ? fN(amt) : ""}
              onChange={e => setAmt(e.target.value.replace(/[^0-9]/g, ""))}
              style={{ width:"100%", padding:"12px 40px 12px 14px", borderRadius:8, background:"var(--bg)", border:"1px solid var(--border)", color:"#fff", fontSize:16, fontWeight:600 }}
            />
            <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", color:"var(--mute)", fontSize:12, fontWeight:600 }}>원</span>
          </div>

          {/* 퀵 버튼 */}
          <div style={{ display:"flex", gap:6, marginTop:8 }}>
            {[100, 300, 500, 1000].map(v => (
              <button key={v} onClick={() => setAmt(String(v * 10000))}
                style={{ flex:1, padding:"6px 0", borderRadius:6, background:"var(--card)", border:"1px solid var(--border)", color:"var(--accent)", fontSize:11, fontWeight:600, cursor:"pointer" }}>
                {v}만
              </button>
            ))}
          </div>

          <p style={{ fontSize:9, color:"var(--mute)", marginTop:6 }}>
            핵심: TQQQ 40% · UPRO 35% · FAS 25% · SOXL(RSI≤30시) · 대기자금 STRC
          </p>

          {/* 배분 결과 */}
          {plan && (
            <div style={{ marginTop:12 }}>
              {plan.buyActions.length > 0 && (<>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--buy)", marginBottom:6 }}>📈 매수 배분</div>
                {plan.buyActions.map((a, i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", marginBottom:4, borderRadius:8, background:"#2dd4a006", border:"1px solid #2dd4a00d" }}>
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span className="mono" style={{ fontSize:14, fontWeight:800, color:"var(--accent)" }}>{a.s}</span>
                        <span style={{ fontSize:9, padding:"2px 5px", borderRadius:4, background: a.g==="core" ? "#5ba4e610" : "#f0c04010", color: a.g==="core" ? "var(--accent)" : "var(--watch)", fontWeight:700 }}>{a.g==="core"?"핵심":"위성"}</span>
                        <span style={{ fontSize:10, color:"var(--buy)" }}>RSI {a.rsi}</span>
                      </div>
                      <div style={{ fontSize:10, color:"var(--mute)", marginTop:2 }}>비중 {a.pct}%</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div className="mono" style={{ fontSize:15, fontWeight:800, color:"#fff" }}>{fN(a.alloc)}원</div>
                      <div className="mono" style={{ fontSize:10, color:"var(--mute)" }}>{a.shares}주 × ${a.price}</div>
                    </div>
                  </div>
                ))}
              </>)}

              {plan.buyActions.length === 0 && (
                <div style={{ padding:16, textAlign:"center", color:"var(--mute)", fontSize:12, background:"var(--card)", borderRadius:8 }}>
                  현재 RSI 35 이하 종목 없음<br/>
                  <span style={{ fontSize:10 }}>→ 전액 STRC(배당 11.5%) 파킹 권장</span>
                </div>
              )}

              {plan.sellTargets.length > 0 && (<>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--sell)", margin:"12px 0 6px" }}>📉 매도 / 전환 대상</div>
                {plan.sellTargets.map((a, i) => (
                  <div key={i} style={{ padding:"10px 12px", marginBottom:4, borderRadius:8, background:"#f060800a", border:"1px solid #f060800d", fontSize:11, color:"var(--text)" }}>
                    <span style={{ fontWeight:800, color:"var(--sell)" }}>{a.s}</span> RSI {a.rsi}
                    <span style={{ color:"var(--mute)" }}> → 롱 10% 유지 · 나머지 STRC 파킹</span>
                  </div>
                ))}
              </>)}

              {/* SQQQ 헷지: TQQQ RSI ≥ 65일 때만 표시 */}
              {plan.showHedge && (
                <div style={{ padding:"10px 12px", marginTop:8, borderRadius:8, background:"#f0c04008", border:"1px solid #f0c0400d" }}>
                  <span style={{ fontSize:11, fontWeight:700, color:"var(--watch)" }}>⚡ SQQQ 헷지 타이밍</span>
                  <p style={{ fontSize:10, color:"var(--text)", marginTop:4 }}>
                    TQQQ RSI {plan.tqqRsi} → SQQQ 10% 비중 매수 검토<br/>
                    <span style={{ color:"var(--warn)" }}>+10% 수익 도달 시 즉시 익절 · 장기 보유 절대 금지</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ TABS ═══ */}
      <div style={{ padding:"6px 20px 10px", display:"flex", gap:4 }}>
        {[{k:"core",l:"핵심 4종"},{k:"all",l:"전체"},{k:"buy",l:"매수구간"},{k:"sell",l:"매도구간"}].map(x => (
          <button key={x.k} className={`tab ${tab===x.k?"on":""}`} onClick={() => setTab(x.k)}>
            {x.l}
            {x.k==="buy" && buyAlerts.length>0 && <span style={{marginLeft:3,fontWeight:800}}>({buyAlerts.length})</span>}
            {x.k==="sell" && sellAlerts.length>0 && <span style={{marginLeft:3,fontWeight:800}}>({sellAlerts.length})</span>}
          </button>
        ))}
      </div>

      {/* ═══ ETF CARDS (롱만!) ═══ */}
      <div style={{ padding:"0 20px", display:"flex", flexDirection:"column", gap:6 }}>
        {filtered.map((e, i) => {
          const rv = r(e.s), pv = pr(e.s), z = zn(rv), d = dir(rv, pv);
          const isCore = e.g === "core", isSat = e.g === "sat";
          const d30 = rv != null ? Math.round((rv-30)*10)/10 : null;
          const d70 = rv != null ? Math.round((70-rv)*10)/10 : null;
          return (
            <div key={e.s} className={`card ${rv!=null&&rv<=30?"buy-g":rv!=null&&rv>=70?"sell-g":""}`}
              onClick={() => setSel(e)}
              style={{ animationDelay:`${i*.05}s`, borderLeft:`4px solid ${isCore?"var(--accent)":isSat?"var(--watch)":"var(--border)"}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span className="mono" style={{ fontSize:16, fontWeight:800, color:"#fff" }}>{e.s}</span>
                    {isCore && <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4, background:"#5ba4e610", color:"var(--accent)", fontWeight:700 }}>핵심</span>}
                    {isSat && <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4, background:"#f0c04010", color:"var(--watch)", fontWeight:700 }}>위성</span>}
                  </div>
                  <div style={{ fontSize:11, color:"var(--mute)", marginTop:2 }}>{e.n}</div>
                </div>
                <div style={{ textAlign:"right", minWidth:70 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:4 }}>
                    <span className="mono" style={{ fontSize:24, fontWeight:900, color:z.c, lineHeight:1 }}>{rv != null ? rv.toFixed(1) : "—"}</span>
                    {d.i && <span style={{ fontSize:16, color:d.c, fontWeight:800 }}>{d.i}</span>}
                  </div>
                  <div style={{ fontSize:10, fontWeight:600, color:z.c, marginTop:2 }}>{z.t}</div>
                </div>
              </div>
              {rv != null && (
                <div className="mono" style={{ display:"flex", justifyContent:"space-between", margin:"6px 0 4px", fontSize:9, color:"var(--mute)" }}>
                  <span style={{ color: d30 != null && d30 <= 5 ? "var(--buy)" : "var(--mute)", opacity: d30 != null && d30 <= 5 ? 1 : .4 }}>
                    30까지 {d30 > 0 ? d30 : "도달!"}
                  </span>
                  <span style={{ color: d.d !== 0 ? d.c : "var(--mute)", opacity: d.d !== 0 ? 1 : .4 }}>
                    전주 {d.d > 0 ? "+" : ""}{d.d}
                  </span>
                  <span style={{ color: d70 != null && d70 <= 5 ? "var(--sell)" : "var(--mute)", opacity: d70 != null && d70 <= 5 ? 1 : .4 }}>
                    70까지 {d70 > 0 ? d70 : "도달!"}
                  </span>
                </div>
              )}
              <RsiTrack rsi={rv}/>
            </div>
          );
        })}
      </div>

      {(tab==="buy"||tab==="sell") && filtered.length===0 && cnt>0 && (
        <div style={{ textAlign:"center", padding:30, color:"var(--mute)", fontSize:13 }}>
          {tab==="buy" ? "매수 시그널 없음" : "매도 시그널 없음"} — 대기 중
        </div>
      )}
      {!cnt && !loading && <div style={{ textAlign:"center", padding:"50px 20px", color:"var(--mute)", fontSize:14 }}>새로고침을 눌러주세요</div>}

      {/* ═══ DETAIL MODAL ═══ */}
      {sel && (
        <div onClick={() => setSel(null)} style={{ position:"fixed", inset:0, background:"rgba(6,10,18,.92)", backdropFilter:"blur(12px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16, animation:"fadeUp .25s ease" }}>
          <div onClick={x => x.stopPropagation()} style={{ background:"var(--sf)", border:"1px solid var(--border)", borderRadius:16, padding:24, maxWidth:400, width:"100%", maxHeight:"85vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,.6)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <span className="mono" style={{ fontSize:24, fontWeight:900, color:"#fff" }}>{sel.s}</span>
              <button onClick={() => setSel(null)} style={{ background:"var(--card)", border:"none", color:"var(--mute)", width:32, height:32, borderRadius:8, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
            </div>
            <div style={{ fontSize:12, color:"var(--mute)", marginBottom:16 }}>{sel.n}</div>

            <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
              <RsiMeter rsi={r(sel.s)} size={160}/>
            </div>

            <div style={{ textAlign:"center", marginBottom:14 }}>
              <div style={{ fontSize:14, fontWeight:600, color:zn(r(sel.s)).c }}>{zn(r(sel.s)).t}</div>
              {pr(sel.s) != null && r(sel.s) != null && (
                <div className="mono" style={{ fontSize:11, color:dir(r(sel.s),pr(sel.s)).c, marginTop:4 }}>
                  전주 {pr(sel.s).toFixed(1)} → {r(sel.s).toFixed(1)} ({dir(r(sel.s),pr(sel.s)).d > 0 ? "+" : ""}{dir(r(sel.s),pr(sel.s)).d})
                </div>
              )}
            </div>

            {data[sel.s]?.rsiHistory && (
              <div style={{ marginBottom:16, padding:12, background:"var(--card)", borderRadius:10, border:"1px solid var(--border)" }}>
                <div style={{ fontSize:10, color:"var(--mute)", marginBottom:6 }}>최근 20주 RSI 흐름</div>
                <Spark data={data[sel.s].rsiHistory}/>
              </div>
            )}

            {data[sel.s]?.price && (
              <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                <div style={{ flex:1, padding:10, background:"var(--card)", borderRadius:8, border:"1px solid var(--border)" }}>
                  <div style={{ fontSize:10, color:"var(--mute)" }}>현재가</div>
                  <div className="mono" style={{ fontSize:18, fontWeight:800, color:"#fff", marginTop:2 }}>${data[sel.s].price}</div>
                </div>
                <div style={{ flex:1, padding:10, background:"var(--card)", borderRadius:8, border:"1px solid var(--border)" }}>
                  <div style={{ fontSize:10, color:"var(--mute)" }}>주간 등락</div>
                  <div className="mono" style={{ fontSize:18, fontWeight:800, color: data[sel.s].change >= 0 ? "var(--buy)" : "var(--sell)", marginTop:2 }}>
                    {data[sel.s].change >= 0 ? "+" : ""}{data[sel.s].change}%
                  </div>
                </div>
              </div>
            )}

            <div style={{ padding:14, background:"var(--card)", borderRadius:10, border:"1px solid var(--border)" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"var(--accent)", marginBottom:6 }}>📋 전략 가이드</div>
              <div style={{ fontSize:12, color:"var(--text)", lineHeight:1.9 }}>
                {r(sel.s) != null && r(sel.s) <= 30 && <><span style={{color:"var(--buy)",fontWeight:700}}>✅ 강력매수 구간</span><br/>배분 비중만큼 분할매수 진입</>}
                {r(sel.s) != null && r(sel.s) > 30 && r(sel.s) <= 35 && <><span style={{color:"var(--watch)",fontWeight:700}}>🟡 매수관심</span><br/>RSI 30 접근 대기 · 소량 선진입 가능</>}
                {r(sel.s) != null && r(sel.s) > 35 && r(sel.s) < 65 && <><span style={{color:"var(--mute)",fontWeight:700}}>⏳ 관망</span><br/>대기자금은 STRC(배당 11.5%)에 파킹</>}
                {r(sel.s) != null && r(sel.s) >= 65 && r(sel.s) < 70 && <><span style={{color:"var(--warn)",fontWeight:700}}>🟠 매도관심</span><br/>익절 준비 · 롱 축소 대기</>}
                {r(sel.s) != null && r(sel.s) >= 70 && <><span style={{color:"var(--sell)",fontWeight:700}}>🔴 매도전환</span><br/>롱 10%만 유지 · 나머지 STRC 파킹<br/>{sel.s==="TQQQ"&&"SQQQ +10% 익절 검토"}</>}
                {r(sel.s) == null && <>새로고침 후 확인</>}
              </div>
            </div>

            <button className="btn" onClick={() => setSel(null)} style={{ marginTop:12, background:"var(--card)", color:"var(--accent)", fontSize:13, border:"1px solid var(--border)" }}>닫기</button>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={{ padding:"24px 20px 10px", textAlign:"center", fontSize:10, color:"var(--mute)", lineHeight:1.7, opacity:.4 }}>
        주봉 RSI(14) · Yahoo Finance · 5분 자동갱신<br/>
        TQQQ 40% · UPRO 35% · FAS 25% · SOXL 위성<br/>
        대기자금 STRC 파킹 · SQQQ는 TQQQ RSI≥65시에만<br/>
        ⚠ 투자 참고용 · 3배 레버리지 = 고위험
      </div>
    </div>
  </>);
}
