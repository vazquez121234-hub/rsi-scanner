import { useState, useEffect, useCallback } from "react";
import Head from "next/head";

const META = {
  TQQQ: { n:"Nasdaq-100 3x 롱", t:"S", d:"long", p:"SQQQ" },
  SOXL: { n:"반도체 3x 롱", t:"S", d:"long", p:"SOXS" },
  UPRO: { n:"S&P500 3x 롱", t:"S", d:"long", p:"SPXU" },
  TNA:  { n:"러셀2000 3x 롱", t:"S", d:"long", p:"TZA" },
  TECL: { n:"기술섹터 3x 롱", t:"A", d:"long", p:"TECS" },
  FAS:  { n:"금융섹터 3x 롱", t:"A", d:"long", p:"FAZ" },
  LABU: { n:"바이오 3x 롱", t:"A", d:"long", p:"LABD" },
  SQQQ: { n:"Nasdaq-100 3x 숏", t:"S", d:"short", p:"TQQQ" },
  SOXS: { n:"반도체 3x 숏", t:"S", d:"short", p:"SOXL" },
  SPXU: { n:"S&P500 3x 숏", t:"S", d:"short", p:"UPRO" },
  TZA:  { n:"러셀2000 3x 숏", t:"S", d:"short", p:"TNA" },
  TECS: { n:"기술섹터 3x 숏", t:"A", d:"short", p:"TECL" },
  FAZ:  { n:"금융섹터 3x 숏", t:"A", d:"short", p:"FAS" },
  LABD: { n:"바이오 3x 숏", t:"A", d:"short", p:"LABU" },
};
const SYMBOLS = Object.keys(META);

const sig = (r, d) => {
  if (r == null) return { t:"—", c:"#444", i:"" };
  if (r <= 30) return { t:d==="long"?"강력매수":"숏매수", c:"#00ff87", i:"🟢" };
  if (r <= 35) return { t:d==="long"?"매수관심":"숏관심", c:"#ffd000", i:"🟡" };
  if (r >= 70) return { t:d==="long"?"매도전환":"숏매도", c:"#ff4466", i:"🔴" };
  if (r >= 65) return { t:d==="long"?"매도관심":"숏주의", c:"#ff8844", i:"🟠" };
  return { t:"관망", c:"#5a7a94", i:"⚪" };
};

function RsiBar({ rsi }) {
  if (rsi == null) return <div style={{height:6,borderRadius:3,background:"#111a26",width:"100%"}}/>;
  const c = sig(rsi).c;
  return (
    <div style={{position:"relative",height:6,borderRadius:3,background:"#111a26",width:"100%"}}>
      <div style={{position:"absolute",left:"30%",top:-2,bottom:-2,width:1,background:"#00ff87",opacity:.35}}/>
      <div style={{position:"absolute",left:"70%",top:-2,bottom:-2,width:1,background:"#ff4466",opacity:.35}}/>
      <div style={{position:"absolute",left:`${Math.max(2,Math.min(98,rsi))}%`,top:-3,width:10,height:12,borderRadius:5,background:c,transform:"translateX(-5px)",boxShadow:`0 0 8px ${c}55`,transition:"left .5s"}}/>
    </div>
  );
}

function Spark({ data }) {
  if (!data || data.length < 2) return null;
  const w=100,h=24,mn=Math.min(...data,25),mx=Math.max(...data,75),rng=mx-mn||1;
  const y=v=>h-((v-mn)/rng)*h;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${y(v)}`).join(" ");
  const last=data[data.length-1];
  const lc=last<=30?"#00ff87":last>=70?"#ff4466":"#4ea8de";
  return(
    <svg width={w} height={h} style={{display:"block",marginTop:4}}>
      <line x1="0" y1={y(30)} x2={w} y2={y(30)} stroke="#00ff87" strokeWidth=".5" opacity=".3" strokeDasharray="2,2"/>
      <line x1="0" y1={y(70)} x2={w} y2={y(70)} stroke="#ff4466" strokeWidth=".5" opacity=".3" strokeDasharray="2,2"/>
      <polyline points={pts} fill="none" stroke="#4ea8de" strokeWidth="1.5"/>
      <circle cx={w} cy={y(last)} r="2.5" fill={lc}/>
    </svg>
  );
}

export default function Home() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [ts, setTs] = useState(null);
  const [tab, setTab] = useState("all");
  const [sel, setSel] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rsi");
      const json = await res.json();
      if (json.data) { setData(json.data); setTs(json.timestamp); }
    } catch(e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const r = s => data[s]?.rsi ?? null;
  const cnt = SYMBOLS.filter(s => r(s) != null).length;
  const buyN = SYMBOLS.filter(s => r(s) != null && r(s) <= 30).length;
  const sellN = SYMBOLS.filter(s => r(s) != null && r(s) >= 70).length;

  const list = (() => {
    let l = SYMBOLS.map(s => ({ s, ...META[s] }));
    if (tab==="long") l=l.filter(e=>e.d==="long");
    else if (tab==="short") l=l.filter(e=>e.d==="short");
    else if (tab==="S") l=l.filter(e=>e.t==="S");
    else if (tab==="A") l=l.filter(e=>e.t==="A");
    else if (tab==="buy") l=l.filter(e=>r(e.s)!=null&&r(e.s)<=35);
    else if (tab==="sell") l=l.filter(e=>r(e.s)!=null&&r(e.s)>=65);
    return l.sort((a,b)=>(r(a.s)??999)-(r(b.s)??999));
  })();

  const timeStr = ts ? new Date(ts).toLocaleString("ko-KR",{timeZone:"Asia/Seoul"}) : "";

  return (
    <>
      <Head>
        <title>3x ETF 주봉 RSI 스캐너</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet"/>
      </Head>
      <style jsx global>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#060a12;color:#a0b8cc;font-family:'Noto Sans KR',sans-serif;-webkit-font-smoothing:antialiased}
        @keyframes glow{0%,100%{box-shadow:0 0 4px rgba(0,255,135,.2)}50%{box-shadow:0 0 18px rgba(0,255,135,.5)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh"}}>
        {/* HEADER */}
        <div style={{padding:"16px 16px 12px",borderBottom:"1px solid rgba(20,36,58,.25)"}}>
          <h1 style={{fontSize:18,fontWeight:900,color:"#4ea8de",fontFamily:"monospace"}}>3x ETF 주봉 RSI</h1>
          <p style={{fontSize:10,color:"#2e4a60",marginTop:2}}>S/A급 14종목 · 주봉 RSI(14) · 토스증권 동일 기준</p>

          <button onClick={load} disabled={loading} style={{
            width:"100%",marginTop:10,padding:12,borderRadius:8,
            background:loading?"rgba(78,168,222,.04)":"linear-gradient(135deg,rgba(78,168,222,.12),rgba(78,168,222,.04))",
            border:"1px solid rgba(78,168,222,.2)",color:"#4ea8de",
            fontSize:13,fontWeight:700,cursor:loading?"default":"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",gap:8
          }}>
            {loading ? <><div style={{width:14,height:14,border:"2px solid rgba(78,168,222,.3)",borderTopColor:"#4ea8de",borderRadius:"50%",animation:"spin .7s linear infinite"}}/> 불러오는 중...</> : `🔄 새로고침${cnt>0?` (${cnt}/14)`:"" }`}
          </button>

          {ts && <p style={{fontSize:8,color:"#1a2e44",marginTop:6,textAlign:"center"}}>{timeStr} 기준 · {cnt}/14 로드</p>}
        </div>

        {/* SIGNAL SUMMARY */}
        {cnt > 0 && (
          <div style={{padding:"8px 16px",display:"flex",gap:8}}>
            <div style={{
              flex:1,padding:10,borderRadius:8,textAlign:"center",
              background:buyN>0?"rgba(0,255,135,.06)":"rgba(0,255,135,.02)",
              border:`1px solid rgba(0,255,135,${buyN>0?.25:.1})`
            }}>
              <div style={{fontSize:10,color:"#00ff87"}}>매수 RSI≤30</div>
              <div style={{fontSize:30,fontWeight:900,color:"#00ff87",margin:"2px 0",fontFamily:"monospace"}}>{buyN}</div>
              <div style={{fontSize:8,color:"#1a2e44"}}>롱 100% 진입</div>
            </div>
            <div style={{
              flex:1,padding:10,borderRadius:8,textAlign:"center",
              background:sellN>0?"rgba(255,68,102,.06)":"rgba(255,68,102,.02)",
              border:`1px solid rgba(255,68,102,${sellN>0?.25:.1})`
            }}>
              <div style={{fontSize:10,color:"#ff4466"}}>매도 RSI≥70</div>
              <div style={{fontSize:30,fontWeight:900,color:"#ff4466",margin:"2px 0",fontFamily:"monospace"}}>{sellN}</div>
              <div style={{fontSize:8,color:"#1a2e44"}}>롱60 숏40 전환</div>
            </div>
          </div>
        )}

        {/* TABS */}
        <div style={{padding:"4px 16px 8px",display:"flex",gap:4,flexWrap:"wrap"}}>
          {[{k:"all",l:"전체"},{k:"long",l:"롱"},{k:"short",l:"숏"},{k:"S",l:"S급"},{k:"A",l:"A급"},{k:"buy",l:"매수구간"},{k:"sell",l:"매도구간"}].map(x=>(
            <button key={x.k} onClick={()=>setTab(x.k)} style={{
              padding:"5px 10px",borderRadius:5,fontSize:11,cursor:"pointer",
              border:`1px solid ${tab===x.k?"#4ea8de":"transparent"}`,
              background:tab===x.k?"rgba(78,168,222,.1)":"rgba(8,14,24,.5)",
              color:tab===x.k?"#4ea8de":"#2e4a64",transition:"all .15s"
            }}>
              {x.l}
              {x.k==="buy"&&buyN>0&&<b style={{color:"#00ff87",marginLeft:2}}>({buyN})</b>}
              {x.k==="sell"&&sellN>0&&<b style={{color:"#ff4466",marginLeft:2}}>({sellN})</b>}
            </button>
          ))}
        </div>

        {/* CARD LIST */}
        <div style={{padding:"0 16px 16px",display:"flex",flexDirection:"column",gap:6}}>
          {list.map(e => {
            const rv=r(e.s), sg=sig(rv,e.d), isL=e.d==="long";
            return (
              <div key={e.s+e.d} onClick={()=>setSel(e)} style={{
                background:"rgba(8,14,24,.95)",border:`1px solid ${rv!=null&&rv<=30?"rgba(0,255,135,.3)":rv!=null&&rv>=70?"rgba(255,68,102,.3)":"rgba(20,36,58,.4)"}`,
                borderRadius:8,padding:"10px 12px",cursor:"pointer",
                transition:"all .15s",
                animation:rv!=null&&rv<=30?"glow 2s ease infinite":"none",
              }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <span style={{fontSize:14,fontWeight:800,color:isL?"#4ea8de":"#e8556d",fontFamily:"monospace"}}>{e.s}</span>
                    <span style={{fontSize:7,padding:"1px 4px",borderRadius:3,background:isL?"#4ea8de0f":"#e8556d0f",color:isL?"#4ea8de":"#e8556d"}}>{isL?"BULL":"BEAR"}</span>
                    <span style={{fontSize:7,fontWeight:800,color:e.t==="S"?"#ffd700":"#00ff87"}}>{e.t}</span>
                    <span style={{fontSize:9,color:"#1e3a54"}}>{e.n}</span>
                  </div>
                  <div style={{textAlign:"right",minWidth:55}}>
                    <div style={{fontSize:20,fontWeight:900,color:sg.c,lineHeight:1,fontFamily:"monospace"}}>{rv!=null?rv.toFixed(1):"—"}</div>
                    <div style={{fontSize:8,color:sg.c,marginTop:1}}>{sg.i} {sg.t}</div>
                  </div>
                </div>
                <RsiBar rsi={rv}/>
              </div>
            );
          })}
        </div>

        {(tab==="buy"||tab==="sell")&&list.length===0&&cnt>0&&(
          <div style={{textAlign:"center",padding:"24px",color:"#1e3a54",fontSize:11}}>
            {tab==="buy"?"RSI 35↓ 종목 없음":"RSI 65↑ 종목 없음"} — 시그널 대기
          </div>
        )}

        {/* DETAIL MODAL */}
        {sel && (
          <div onClick={()=>setSel(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
            <div onClick={x=>x.stopPropagation()} style={{background:"#0a1018",border:"1px solid rgba(78,168,222,.18)",borderRadius:12,padding:20,maxWidth:380,width:"100%",maxHeight:"80vh",overflowY:"auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:22,fontWeight:900,color:sel.d==="long"?"#4ea8de":"#e8556d",fontFamily:"monospace"}}>
                  {sel.s} <span style={{fontSize:11,color:sel.t==="S"?"#ffd700":"#00ff87"}}>{sel.t}급</span>
                </span>
                <button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:"#2e4a64",fontSize:20,cursor:"pointer"}}>✕</button>
              </div>
              <div style={{fontSize:11,color:"#3a5a74",marginBottom:14}}>{sel.n} · 페어: {sel.p}</div>

              {/* BIG RSI */}
              <div style={{textAlign:"center",marginBottom:14}}>
                <div style={{fontSize:56,fontWeight:900,color:sig(r(sel.s),sel.d).c,fontFamily:"monospace"}}>{r(sel.s)!=null?r(sel.s).toFixed(1):"—"}</div>
                <div style={{fontSize:14,color:sig(r(sel.s),sel.d).c,marginTop:2}}>{sig(r(sel.s),sel.d).i} {sig(r(sel.s),sel.d).t}</div>
                <div style={{fontSize:9,color:"#1e3a54",marginTop:4}}>주봉 RSI(14)</div>
              </div>

              <div style={{marginBottom:12}}><RsiBar rsi={r(sel.s)}/></div>

              {/* RSI HISTORY */}
              {data[sel.s]?.rsiHistory && (
                <div style={{marginBottom:14,padding:10,background:"rgba(8,14,24,.7)",borderRadius:6,border:"1px solid rgba(20,36,58,.15)"}}>
                  <div style={{fontSize:9,color:"#1e3a54",marginBottom:4}}>최근 20주 RSI 추이</div>
                  <Spark data={data[sel.s].rsiHistory}/>
                </div>
              )}

              {/* PRICE + CHANGE */}
              {data[sel.s]?.price && (
                <div style={{display:"flex",gap:8,marginBottom:12}}>
                  <div style={{flex:1,background:"rgba(8,14,24,.7)",borderRadius:6,padding:8,border:"1px solid rgba(20,36,58,.15)"}}>
                    <div style={{fontSize:8,color:"#1e3a54"}}>현재가</div>
                    <div style={{fontSize:15,fontWeight:700,color:"#dde5ed",marginTop:2,fontFamily:"monospace"}}>${data[sel.s].price}</div>
                  </div>
                  <div style={{flex:1,background:"rgba(8,14,24,.7)",borderRadius:6,padding:8,border:"1px solid rgba(20,36,58,.15)"}}>
                    <div style={{fontSize:8,color:"#1e3a54"}}>주간 등락</div>
                    <div style={{fontSize:15,fontWeight:700,color:data[sel.s].change>=0?"#00ff87":"#ff4466",marginTop:2,fontFamily:"monospace"}}>{data[sel.s].change>=0?"+":""}{data[sel.s].change}%</div>
                  </div>
                </div>
              )}

              {/* STRATEGY */}
              <div style={{background:"rgba(8,14,24,.7)",borderRadius:6,padding:10,border:"1px solid rgba(20,36,58,.15)"}}>
                <div style={{fontSize:11,fontWeight:700,color:"#4ea8de",marginBottom:4}}>📋 전략</div>
                <div style={{fontSize:10,color:"#4a6a84",lineHeight:1.8}}>
                  {r(sel.s)!=null&&r(sel.s)<=30&&<><b style={{color:"#00ff87"}}>✅ 강력매수 구간</b><br/>롱 100% 비중 · 분할매수 추천</>}
                  {r(sel.s)!=null&&r(sel.s)>30&&r(sel.s)<=35&&<><b style={{color:"#ffd000"}}>🟡 매수관심</b><br/>RSI 30 접근 시 진입 준비</>}
                  {r(sel.s)!=null&&r(sel.s)>35&&r(sel.s)<65&&<><b style={{color:"#4a6a84"}}>⏳ 관망</b><br/>RSI 30/70 도달 대기</>}
                  {r(sel.s)!=null&&r(sel.s)>=65&&r(sel.s)<70&&<><b style={{color:"#ff8844"}}>🟠 매도관심</b><br/>숏 전환 준비 · {sel.p} 대기</>}
                  {r(sel.s)!=null&&r(sel.s)>=70&&<><b style={{color:"#ff4466"}}>🔴 매도/숏 전환</b><br/>롱 60% 축소 · {sel.p} 숏 40% 진입</>}
                  {r(sel.s)==null&&<>데이터 없음</>}
                </div>
              </div>

              <button onClick={()=>setSel(null)} style={{
                width:"100%",marginTop:10,padding:10,borderRadius:6,
                background:"rgba(78,168,222,.06)",border:"1px solid rgba(78,168,222,.12)",
                color:"#4ea8de",fontSize:12,cursor:"pointer"
              }}>닫기</button>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{padding:"12px 16px",borderTop:"1px solid rgba(20,36,58,.1)",fontSize:8,color:"#0e1a28",textAlign:"center",lineHeight:1.6}}>
          주봉 RSI(14) · Yahoo Finance 실시간<br/>
          토스증권 동일 계산 기준 · 새로고침 무제한 무료<br/>
          ⚠ 투자 참고용 · 3배 레버리지 = 고위험
        </div>
      </div>
    </>
  );
}
