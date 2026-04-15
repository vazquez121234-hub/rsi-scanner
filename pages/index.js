import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";

const CORE=[
  {s:"TQQQ",n:"나스닥100",w:40,pair:"SQQQ",g:"core"},
  {s:"UPRO",n:"S&P500",w:35,pair:"SPXU",g:"core"},
  {s:"FAS",n:"금융섹터",w:25,pair:"FAZ",g:"core"},
];
const SAT={s:"SOXL",n:"반도체",pair:"SOXS",g:"sat"};
const ALL=[
  {s:"TQQQ",n:"나스닥100 3x 롱",g:"core"},{s:"UPRO",n:"S&P500 3x 롱",g:"core"},
  {s:"FAS",n:"금융섹터 3x 롱",g:"core"},{s:"SOXL",n:"반도체 3x 롱",g:"sat"},
  {s:"SQQQ",n:"나스닥100 3x 숏",g:"hedge"},
  {s:"TECL",n:"기술 3x 롱",g:"etc"},{s:"TNA",n:"러셀 3x 롱",g:"etc"},
  {s:"LABU",n:"바이오 3x 롱",g:"etc"},
  {s:"SOXS",n:"반도체 3x 숏",g:"etc"},{s:"SPXU",n:"S&P 3x 숏",g:"etc"},
  {s:"TZA",n:"러셀 3x 숏",g:"etc"},{s:"TECS",n:"기술 3x 숏",g:"etc"},
  {s:"FAZ",n:"금융 3x 숏",g:"etc"},{s:"LABD",n:"바이오 3x 숏",g:"etc"},
];

const zn=(r)=>{
  if(r==null)return{t:"대기",c:"var(--c-mute)",lv:0};
  if(r<=30)return{t:"강력매수",c:"var(--c-buy)",lv:1};
  if(r<=35)return{t:"매수관심",c:"var(--c-watch)",lv:2};
  if(r>=70)return{t:"매도전환",c:"var(--c-sell)",lv:5};
  if(r>=65)return{t:"매도관심",c:"var(--c-warn)",lv:4};
  return{t:"관망",c:"var(--c-mute)",lv:3};
};

const dr=(c,p)=>{
  if(c==null||p==null)return{i:"",c:"var(--c-mute)",d:0};
  const d=Math.round((c-p)*10)/10;
  if(d>3)return{i:"↑↑",c:"var(--c-buy)",d};if(d>0.5)return{i:"↗",c:"#5ed5a8",d};
  if(d<-3)return{i:"↓↓",c:"var(--c-sell)",d};if(d<-0.5)return{i:"↘",c:"#d4687a",d};
  return{i:"→",c:"var(--c-mute)",d};
};

function RsiMeter({rsi,size=120}){
  const cx=size/2,cy=size/2+8,rad=size/2-10;
  const arc=(s,e)=>{const sa=(s-90)*Math.PI/180,ea=(e-90)*Math.PI/180;return`M ${cx+rad*Math.cos(sa)} ${cy+rad*Math.sin(sa)} A ${rad} ${rad} 0 ${e-s>180?1:0} 1 ${cx+rad*Math.cos(ea)} ${cy+rad*Math.sin(ea)}`};
  const ang=rsi!=null?(rsi/100*180-90)*Math.PI/180:null;
  const c=zn(rsi).c;
  return(<svg width={size} height={size*.65} viewBox={`0 0 ${size} ${size*.65}`}>
    <defs><filter id="gl"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <path d={arc(-90,90)} fill="none" stroke="var(--c-card-border)" strokeWidth="8" strokeLinecap="round"/>
    <path d={arc(-90,-36)} fill="none" stroke="var(--c-buy)" strokeWidth="8" strokeLinecap="round" opacity=".2"/>
    <path d={arc(-36,-27)} fill="none" stroke="var(--c-watch)" strokeWidth="8" strokeLinecap="round" opacity=".12"/>
    <path d={arc(27,36)} fill="none" stroke="var(--c-warn)" strokeWidth="8" strokeLinecap="round" opacity=".12"/>
    <path d={arc(36,90)} fill="none" stroke="var(--c-sell)" strokeWidth="8" strokeLinecap="round" opacity=".2"/>
    {ang!=null&&<><line x1={cx} y1={cy} x2={cx+(rad-14)*Math.cos(ang)} y2={cy+(rad-14)*Math.sin(ang)} stroke={c} strokeWidth="3" strokeLinecap="round" filter="url(#gl)"/><circle cx={cx} cy={cy} r="4" fill={c}/></>}
    <text x={cx} y={cy+20} textAnchor="middle" fill={c} fontSize={size*.16} fontWeight="800" style={{fontFamily:"var(--f-mono)"}}>{rsi!=null?rsi.toFixed(1):"—"}</text>
  </svg>);
}

function RsiTrack({rsi}){
  if(rsi==null)return<div className="track"/>;
  const c=zn(rsi).c;
  return(<div className="track">
    <div className="track-zone track-buy" style={{left:"30%"}}/>
    <div className="track-zone track-sell" style={{left:"70%"}}/>
    <div className="track-dot" style={{left:`${Math.max(3,Math.min(97,rsi))}%`,background:c,boxShadow:`0 0 10px ${c==='var(--c-buy)'?'#2dd4a0':c==='var(--c-sell)'?'#f06080':'transparent'}`}}/>
  </div>);
}

function Spark({data}){
  if(!data||data.length<2)return null;
  const w=100,h=28,mn=Math.min(...data,25),mx=Math.max(...data,75),rg=mx-mn||1;
  const y=v=>h-((v-mn)/rg)*h;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${y(v)}`).join(" ");
  const last=data[data.length-1],lc=last<=30?"var(--c-buy)":last>=70?"var(--c-sell)":"var(--c-accent)";
  return(<svg width={w} height={h} style={{display:"block"}}>
    <line x1="0" y1={y(30)} x2={w} y2={y(30)} stroke="var(--c-buy)" strokeWidth=".5" opacity=".25" strokeDasharray="2,2"/>
    <line x1="0" y1={y(70)} x2={w} y2={y(70)} stroke="var(--c-sell)" strokeWidth=".5" opacity=".25" strokeDasharray="2,2"/>
    <polyline points={pts} fill="none" stroke="var(--c-accent)" strokeWidth="1.5" strokeLinejoin="round"/>
    <circle cx={w} cy={y(last)} r="2.5" fill={lc}/>
  </svg>);
}

function buildPlan(amt,data){
  const buys=[...CORE.filter(e=>data[e.s]?.rsi!=null&&data[e.s].rsi<=35)];
  if(data[SAT.s]?.rsi!=null&&data[SAT.s].rsi<=30) buys.push({...SAT,w:20});
  const sells=[...CORE.filter(e=>data[e.s]?.rsi!=null&&data[e.s].rsi>=65)];
  buys.sort((a,b)=>(data[a.s].rsi)-(data[b.s].rsi));
  if(buys.length===0&&sells.length===0) return null;
  const totalW=buys.reduce((a,b)=>a+b.w,0)||1;
  const buyActions=buys.map(e=>{const pct=Math.round(e.w/totalW*100);const alloc=Math.round(amt*e.w/totalW);const p=data[e.s]?.price;return{s:e.s,n:e.n,rsi:data[e.s].rsi,pct,alloc,shares:p?Math.floor(alloc/p):0,price:p};});
  const sellActions=sells.map(e=>({s:e.s,n:e.n,rsi:data[e.s].rsi,pair:e.pair}));
  const hedgeRsi=data["TQQQ"]?.rsi;
  return{buyActions,sellActions,hedge:hedgeRsi!=null&&hedgeRsi>=65};
}

export default function Home(){
  const [data,setData]=useState({});
  const [loading,setLoading]=useState(false);
  const [ts,setTs]=useState(null);
  const [tab,setTab]=useState("core");
  const [sel,setSel]=useState(null);
  const [auto,setAuto]=useState(false);
  const [amt,setAmt]=useState("");
  const [showCalc,setShowCalc]=useState(false);
  const tm=useRef(null);

  const load=useCallback(async()=>{
    setLoading(true);
    try{const r=await fetch("/api/rsi");const j=await r.json();if(j.data){setData(j.data);setTs(j.timestamp);}}catch(e){}
    setLoading(false);
  },[]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{if(auto)tm.current=setInterval(load,300000);else clearInterval(tm.current);return()=>clearInterval(tm.current);},[auto,load]);

  const r=s=>data[s]?.rsi??null, pr=s=>data[s]?.prevRsi??null;
  const cnt=ALL.filter(e=>r(e.s)!=null).length;
  const buyA=ALL.filter(e=>(e.g==="core"||e.g==="sat")&&r(e.s)!=null&&r(e.s)<=35);
  const sellA=ALL.filter(e=>(e.g==="core"||e.g==="sat")&&r(e.s)!=null&&r(e.s)>=65);
  const hasAlert=buyA.length>0||sellA.length>0;
  const plan=showCalc&&amt?buildPlan(Number(amt.replace(/,/g,"")),data):null;
  const fN=n=>n?Number(n).toLocaleString("ko-KR"):"";

  const filtered=(()=>{
    let l=[...ALL];
    if(tab==="core")l=l.filter(e=>["core","sat","hedge"].includes(e.g));
    else if(tab==="buy")l=l.filter(e=>r(e.s)!=null&&r(e.s)<=35);
    else if(tab==="sell")l=l.filter(e=>r(e.s)!=null&&r(e.s)>=65);
    return l.sort((a,b)=>(r(a.s)??999)-(r(b.s)??999));
  })();

  const timeStr=ts?new Date(ts).toLocaleString("ko-KR",{timeZone:"Asia/Seoul"}):"";

  return(<>
    <Head>
      <title>RSI 전략 스캐너</title>
      <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
      <meta name="theme-color" content="#0b1120"/>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600;700&display=swap" rel="stylesheet"/>
    </Head>
    <style jsx global>{`
      :root{
        --c-bg:#0b1120;--c-surface:#111b2e;--c-card:#141f35;--c-card-border:#1c2d4a;
        --c-text:#c8d8eb;--c-mute:#2e4260;--c-accent:#5ba4e6;
        --c-buy:#2dd4a0;--c-sell:#f06080;--c-watch:#f0c040;--c-warn:#e88a40;
        --f-body:'DM Sans',sans-serif;--f-mono:'IBM Plex Mono',monospace;
        --radius:12px;--shadow:0 4px 24px rgba(0,0,0,.4);
      }
      *{box-sizing:border-box;margin:0;padding:0}
      body{background:var(--c-bg);color:var(--c-text);font-family:var(--f-body);-webkit-font-smoothing:antialiased;overflow-x:hidden}
      @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      @keyframes glow{0%,100%{box-shadow:0 0 8px rgba(45,212,160,.15)}50%{box-shadow:0 0 24px rgba(45,212,160,.35)}}
      @keyframes glowR{0%,100%{box-shadow:0 0 8px rgba(240,96,128,.15)}50%{box-shadow:0 0 24px rgba(240,96,128,.35)}}
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
      @keyframes slideDown{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
      @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
      .track{position:relative;height:6px;border-radius:3px;background:var(--c-surface);overflow:visible}
      .track-zone{position:absolute;top:-2px;bottom:-2px;width:1px;opacity:.3}
      .track-buy{background:var(--c-buy)}.track-sell{background:var(--c-sell)}
      .track-dot{position:absolute;top:-4px;width:12px;height:14px;border-radius:7px;transform:translateX(-6px);transition:left .6s cubic-bezier(.4,0,.2,1)}
      .card{background:var(--c-card);border:1px solid var(--c-card-border);border-radius:var(--radius);padding:14px 16px;cursor:pointer;transition:all .2s;animation:fadeUp .4s ease both}
      .card:hover{border-color:var(--c-accent);transform:translateY(-1px);box-shadow:var(--shadow)}
      .card:active{transform:scale(.985)}
      .card.buy-glow{animation:glow 2.5s ease infinite,fadeUp .4s ease both;border-color:rgba(45,212,160,.3)}
      .card.sell-glow{animation:glowR 2.5s ease infinite,fadeUp .4s ease both;border-color:rgba(240,96,128,.3)}
      .tab{padding:8px 14px;border-radius:8px;border:none;background:transparent;color:var(--c-mute);font-family:var(--f-body);font-size:13px;font-weight:600;cursor:pointer;transition:all .2s}
      .tab:hover{color:var(--c-text)}
      .tab.on{background:var(--c-accent);color:#fff}
      .btn{padding:12px 20px;border-radius:10px;border:none;font-family:var(--f-body);font-weight:700;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px;width:100%}
      .btn:active{transform:scale(.97)}
      .overlay{position:fixed;inset:0;background:rgba(6,10,18,.92);backdrop-filter:blur(12px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeUp .25s ease}
      .modal{background:var(--c-surface);border:1px solid var(--c-card-border);border-radius:16px;padding:24px;max-width:400px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.6)}
      input[type=text]{font-family:var(--f-mono);outline:none}
      input[type=text]:focus{border-color:var(--c-accent)}
    `}</style>

    <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",paddingBottom:20}}>

      {/* ALERT BANNER */}
      {hasAlert&&cnt>0&&(<div style={{animation:"slideDown .5s ease"}}>
        {buyA.length>0&&(<div style={{padding:"16px 20px",background:"linear-gradient(135deg,rgba(45,212,160,.08),rgba(45,212,160,.02))",borderBottom:"2px solid rgba(45,212,160,.25)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <div style={{width:10,height:10,borderRadius:5,background:"var(--c-buy)",animation:"pulse 1.5s ease infinite"}}/>
            <span style={{fontSize:16,fontWeight:800,color:"var(--c-buy)"}}>매수 시그널 {buyA.length}개</span>
          </div>
          <div style={{fontSize:12,color:"var(--c-buy)",opacity:.8,marginBottom:10}}>{buyA.map(e=>`${e.s} RSI ${r(e.s).toFixed(0)}`).join(" · ")}</div>
          {!showCalc&&<button className="btn" onClick={()=>setShowCalc(true)} style={{background:"rgba(45,212,160,.12)",color:"var(--c-buy)",fontSize:13,border:"1px solid rgba(45,212,160,.25)"}}>💰 투자금 입력 → 자동 포트폴리오 배분</button>}
        </div>)}
        {sellA.length>0&&(<div style={{padding:"16px 20px",background:"linear-gradient(135deg,rgba(240,96,128,.08),rgba(240,96,128,.02))",borderBottom:"2px solid rgba(240,96,128,.25)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <div style={{width:10,height:10,borderRadius:5,background:"var(--c-sell)",animation:"pulse 1.5s ease infinite"}}/>
            <span style={{fontSize:16,fontWeight:800,color:"var(--c-sell)"}}>매도 시그널 {sellA.length}개</span>
          </div>
          <div style={{fontSize:12,color:"var(--c-sell)",opacity:.8}}>{sellA.map(e=>`${e.s} RSI ${r(e.s).toFixed(0)}`).join(" · ")} → SQQQ +10% 익절 → STRC 파킹</div>
        </div>)}
      </div>)}

      {/* HEADER */}
      <div style={{padding:"20px 20px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:800,color:"#fff",letterSpacing:"-0.5px"}}>주봉 RSI 전략</h1>
            <p style={{fontSize:11,color:"var(--c-mute)",marginTop:4}}>3x 레버리지 ETF · 기계적 매매 시스템</p>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>setAuto(!auto)} style={{padding:"6px 10px",borderRadius:6,fontSize:10,fontWeight:600,cursor:"pointer",background:auto?"rgba(45,212,160,.1)":"var(--c-surface)",border:`1px solid ${auto?"rgba(45,212,160,.25)":"var(--c-card-border)"}`,color:auto?"var(--c-buy)":"var(--c-mute)"}}>
              {auto?"● LIVE":"○ 5분"}
            </button>
          </div>
        </div>

        <button className="btn" onClick={load} disabled={loading} style={{marginTop:12,background:loading?"var(--c-surface)":"var(--c-accent)",color:"#fff",fontSize:14,opacity:loading?.6:1}}>
          {loading?<><div style={{width:14,height:14,border:"2px solid #fff4",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>갱신중...</>:`새로고침${cnt>0?` · ${cnt}/14`:""}`}
        </button>

        {ts&&<p style={{fontSize:10,color:"var(--c-mute)",marginTop:8,textAlign:"center"}}>{timeStr}{auto?" · 자동 갱신 중":""}</p>}
      </div>

      {/* PORTFOLIO CALCULATOR */}
      {showCalc&&(<div style={{margin:"0 20px 12px",padding:16,background:"var(--c-surface)",borderRadius:12,border:"1px solid var(--c-card-border)",animation:"slideDown .3s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{fontSize:15,fontWeight:700,color:"#fff"}}>💰 포트폴리오 배분</span>
          <button onClick={()=>setShowCalc(false)} style={{background:"none",border:"none",color:"var(--c-mute)",fontSize:18,cursor:"pointer",padding:4}}>✕</button>
        </div>
        <div style={{position:"relative"}}>
          <input type="text" inputMode="numeric" placeholder="투자금 입력" value={amt?fN(amt):""} onChange={e=>setAmt(e.target.value.replace(/[^0-9]/g,""))}
            style={{width:"100%",padding:"12px 40px 12px 14px",borderRadius:8,background:"var(--c-bg)",border:"1px solid var(--c-card-border)",color:"#fff",fontSize:16,fontWeight:600}}/>
          <span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",color:"var(--c-mute)",fontSize:12,fontWeight:600}}>원</span>
        </div>
        <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
          {[100,300,500,1000].map(v=><button key={v} onClick={()=>setAmt(String(v*10000))} style={{padding:"5px 10px",borderRadius:6,background:"var(--c-card)",border:"1px solid var(--c-card-border)",color:"var(--c-accent)",fontSize:11,fontWeight:600,cursor:"pointer"}}>{v}만</button>)}
        </div>

        {plan&&(<div style={{marginTop:14}}>
          {plan.buyActions.length>0&&(<>
            <div style={{fontSize:11,fontWeight:700,color:"var(--c-buy)",marginBottom:6}}>📈 매수 배분</div>
            {plan.buyActions.map((a,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",marginBottom:4,borderRadius:8,background:"rgba(45,212,160,.04)",border:"1px solid rgba(45,212,160,.08)"}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:14,fontWeight:800,color:"var(--c-accent)",fontFamily:"var(--f-mono)"}}>{a.s}</span>
                  <span style={{fontSize:10,color:"var(--c-buy)",fontWeight:600}}>RSI {a.rsi}</span>
                  <span style={{fontSize:10,color:"var(--c-mute)"}}>{a.pct}%</span>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:15,fontWeight:800,color:"#fff",fontFamily:"var(--f-mono)"}}>{fN(a.alloc)}원</div>
                <div style={{fontSize:10,color:"var(--c-mute)",fontFamily:"var(--f-mono)"}}>{a.shares}주 × ${a.price}</div>
              </div>
            </div>))}
          </>)}
          {plan.sellActions.length>0&&(<>
            <div style={{fontSize:11,fontWeight:700,color:"var(--c-sell)",margin:"10px 0 6px"}}>📉 매도/전환</div>
            {plan.sellActions.map((a,i)=>(<div key={i} style={{padding:"10px 12px",marginBottom:4,borderRadius:8,background:"rgba(240,96,128,.04)",border:"1px solid rgba(240,96,128,.08)"}}>
              <span style={{fontSize:12,fontWeight:700,color:"var(--c-sell)"}}>{a.s}</span>
              <span style={{fontSize:11,color:"var(--c-text)",marginLeft:6}}>→ 롱 10% 유지 · SQQQ +10% 익절 · 나머지 STRC</span>
            </div>))}
          </>)}
          {plan.hedge&&<div style={{padding:"10px 12px",borderRadius:8,background:"rgba(240,192,64,.04)",border:"1px solid rgba(240,192,64,.08)",marginTop:6}}>
            <span style={{fontSize:12,fontWeight:700,color:"var(--c-watch)"}}>⚡ SQQQ 헷지</span>
            <span style={{fontSize:11,color:"var(--c-text)",marginLeft:6}}>+10% 도달 시 즉시 익절</span>
          </div>}
          {plan.buyActions.length===0&&plan.sellActions.length===0&&<div style={{textAlign:"center",padding:16,color:"var(--c-mute)",fontSize:12}}>시그널 없음 — STRC 파킹 대기</div>}
        </div>)}
      </div>)}

      {/* SIGNAL CARDS */}
      {cnt>0&&(<div style={{padding:"0 20px 8px",display:"flex",gap:8}}>
        <div onClick={()=>{setTab("buy");if(buyA.length>0)setShowCalc(true);}} style={{flex:1,padding:"14px 12px",borderRadius:12,textAlign:"center",cursor:"pointer",background:buyA.length>0?"rgba(45,212,160,.06)":"var(--c-surface)",border:`1px solid ${buyA.length>0?"rgba(45,212,160,.2)":"var(--c-card-border)"}`,transition:"all .2s"}}>
          <div style={{fontSize:11,fontWeight:600,color:"var(--c-buy)"}}>매수 RSI ≤ 35</div>
          <div style={{fontSize:32,fontWeight:900,color:"var(--c-buy)",margin:"4px 0",fontFamily:"var(--f-mono)"}}>{buyA.length}</div>
          <div style={{fontSize:10,color:"var(--c-mute)"}}>롱 100% 진입</div>
        </div>
        <div onClick={()=>setTab("sell")} style={{flex:1,padding:"14px 12px",borderRadius:12,textAlign:"center",cursor:"pointer",background:sellA.length>0?"rgba(240,96,128,.06)":"var(--c-surface)",border:`1px solid ${sellA.length>0?"rgba(240,96,128,.2)":"var(--c-card-border)"}`,transition:"all .2s"}}>
          <div style={{fontSize:11,fontWeight:600,color:"var(--c-sell)"}}>매도 RSI ≥ 65</div>
          <div style={{fontSize:32,fontWeight:900,color:"var(--c-sell)",margin:"4px 0",fontFamily:"var(--f-mono)"}}>{sellA.length}</div>
          <div style={{fontSize:10,color:"var(--c-mute)"}}>SQQQ +10% 익절</div>
        </div>
      </div>)}

      {cnt>0&&!showCalc&&!hasAlert&&<div style={{padding:"0 20px 8px"}}><button className="btn" onClick={()=>setShowCalc(true)} style={{background:"var(--c-surface)",color:"var(--c-accent)",fontSize:12,border:"1px solid var(--c-card-border)"}}>💰 포트폴리오 계산기</button></div>}

      {/* TABS */}
      <div style={{padding:"6px 20px 10px",display:"flex",gap:4}}>
        {[{k:"core",l:"핵심"},{k:"all",l:"전체"},{k:"buy",l:"매수구간"},{k:"sell",l:"매도구간"}].map(x=><button key={x.k} className={`tab ${tab===x.k?"on":""}`} onClick={()=>setTab(x.k)}>
          {x.l}{x.k==="buy"&&buyA.length>0&&<span style={{marginLeft:4,fontWeight:800}}>({buyA.length})</span>}
          {x.k==="sell"&&sellA.length>0&&<span style={{marginLeft:4,fontWeight:800}}>({sellA.length})</span>}
        </button>)}
      </div>

      {/* ETF CARDS */}
      <div style={{padding:"0 20px",display:"flex",flexDirection:"column",gap:6}}>
        {filtered.map((e,i)=>{
          const rv=r(e.s),pv=pr(e.s),z=zn(rv),d=dr(rv,pv);
          const isC=e.g==="core",isS=e.g==="sat",isH=e.g==="hedge";
          const d30=rv!=null?Math.round((rv-30)*10)/10:null;
          const d70=rv!=null?Math.round((70-rv)*10)/10:null;
          return(<div key={e.s+e.g} className={`card ${rv!=null&&rv<=30?"buy-glow":rv!=null&&rv>=70?"sell-glow":""}`}
            onClick={()=>setSel(e)} style={{animationDelay:`${i*.04}s`,borderLeft:`4px solid ${isC?"var(--c-accent)":isS?"var(--c-watch)":isH?"var(--c-sell)":"var(--c-card-border)"}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:16,fontWeight:800,color:"#fff",fontFamily:"var(--f-mono)"}}>{e.s}</span>
                  {isC&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(91,164,230,.1)",color:"var(--c-accent)",fontWeight:700}}>핵심</span>}
                  {isS&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(240,192,64,.1)",color:"var(--c-watch)",fontWeight:700}}>위성</span>}
                  {isH&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(240,96,128,.1)",color:"var(--c-sell)",fontWeight:700}}>헷지</span>}
                </div>
                <div style={{fontSize:11,color:"var(--c-mute)",marginTop:2}}>{e.n}</div>
              </div>
              <div style={{textAlign:"right",minWidth:70}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:4}}>
                  <span style={{fontSize:24,fontWeight:900,color:z.c,fontFamily:"var(--f-mono)",lineHeight:1}}>{rv!=null?rv.toFixed(1):"—"}</span>
                  {d.i&&<span style={{fontSize:16,color:d.c,fontWeight:800}}>{d.i}</span>}
                </div>
                <div style={{fontSize:10,fontWeight:600,color:z.c,marginTop:2}}>{z.t}</div>
              </div>
            </div>
            {rv!=null&&(<div style={{display:"flex",justifyContent:"space-between",margin:"6px 0",fontSize:9,fontFamily:"var(--f-mono)",color:"var(--c-mute)"}}>
              <span style={{color:d30!=null&&d30<=5?"var(--c-buy)":"var(--c-mute)",opacity:d30!=null&&d30<=5?1:.4}}>30까지 {d30>0?d30:"도달!"}</span>
              <span style={{color:d.d!==0?d.c:"var(--c-mute)",opacity:d.d!==0?1:.4}}>전주 {d.d>0?"+":""}{d.d}</span>
              <span style={{color:d70!=null&&d70<=5?"var(--c-sell)":"var(--c-mute)",opacity:d70!=null&&d70<=5?1:.4}}>70까지 {d70>0?d70:"도달!"}</span>
            </div>)}
            <RsiTrack rsi={rv}/>
          </div>);
        })}
      </div>

      {(tab==="buy"||tab==="sell")&&filtered.length===0&&cnt>0&&<div style={{textAlign:"center",padding:30,color:"var(--c-mute)",fontSize:13}}>{tab==="buy"?"매수 시그널 없음":"매도 시그널 없음"} — 대기 중</div>}
      {!cnt&&!loading&&<div style={{textAlign:"center",padding:"50px 20px",color:"var(--c-mute)",fontSize:14}}>새로고침을 눌러주세요</div>}

      {/* MODAL */}
      {sel&&(<div className="overlay" onClick={()=>setSel(null)}>
        <div className="modal" onClick={x=>x.stopPropagation()}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:24,fontWeight:900,color:"#fff",fontFamily:"var(--f-mono)"}}>{sel.s}</span>
              {sel.g==="core"&&<span style={{fontSize:10,padding:"3px 8px",borderRadius:5,background:"rgba(91,164,230,.1)",color:"var(--c-accent)",fontWeight:700}}>핵심</span>}
            </div>
            <button onClick={()=>setSel(null)} style={{background:"var(--c-card)",border:"none",color:"var(--c-mute)",width:32,height:32,borderRadius:8,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
          <div style={{fontSize:12,color:"var(--c-mute)",marginBottom:16}}>{sel.n}</div>

          <div style={{display:"flex",justifyContent:"center",marginBottom:16}}><RsiMeter rsi={r(sel.s)} size={160}/></div>

          <div style={{textAlign:"center",marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:600,color:zn(r(sel.s)).c}}>{zn(r(sel.s)).t}</div>
            {pr(sel.s)!=null&&r(sel.s)!=null&&<div style={{fontSize:11,color:dr(r(sel.s),pr(sel.s)).c,marginTop:4,fontFamily:"var(--f-mono)"}}>전주 {pr(sel.s).toFixed(1)} → {r(sel.s).toFixed(1)} ({dr(r(sel.s),pr(sel.s)).d>0?"+":""}{dr(r(sel.s),pr(sel.s)).d})</div>}
          </div>

          {data[sel.s]?.rsiHistory&&<div style={{marginBottom:16,padding:12,background:"var(--c-card)",borderRadius:10,border:"1px solid var(--c-card-border)"}}><div style={{fontSize:10,color:"var(--c-mute)",marginBottom:6}}>최근 20주 흐름</div><Spark data={data[sel.s].rsiHistory}/></div>}

          {data[sel.s]?.price&&<div style={{display:"flex",gap:8,marginBottom:14}}>
            <div style={{flex:1,padding:10,background:"var(--c-card)",borderRadius:8,border:"1px solid var(--c-card-border)"}}><div style={{fontSize:10,color:"var(--c-mute)"}}>현재가</div><div style={{fontSize:18,fontWeight:800,color:"#fff",marginTop:2,fontFamily:"var(--f-mono)"}}>${data[sel.s].price}</div></div>
            <div style={{flex:1,padding:10,background:"var(--c-card)",borderRadius:8,border:"1px solid var(--c-card-border)"}}><div style={{fontSize:10,color:"var(--c-mute)"}}>주간</div><div style={{fontSize:18,fontWeight:800,color:data[sel.s].change>=0?"var(--c-buy)":"var(--c-sell)",marginTop:2,fontFamily:"var(--f-mono)"}}>{data[sel.s].change>=0?"+":""}{data[sel.s].change}%</div></div>
          </div>}

          <div style={{padding:14,background:"var(--c-card)",borderRadius:10,border:"1px solid var(--c-card-border)"}}>
            <div style={{fontSize:12,fontWeight:700,color:"var(--c-accent)",marginBottom:6}}>📋 전략 가이드</div>
            <div style={{fontSize:12,color:"var(--c-text)",lineHeight:1.9}}>
              {r(sel.s)!=null&&r(sel.s)<=30&&<><span style={{color:"var(--c-buy)",fontWeight:700}}>✅ 강력매수 구간</span><br/>투자금의 배분 비중만큼 분할매수</>}
              {r(sel.s)!=null&&r(sel.s)>30&&r(sel.s)<=35&&<><span style={{color:"var(--c-watch)",fontWeight:700}}>🟡 매수관심 구간</span><br/>RSI 30 접근 시 진입 준비 · 소량 선진입 가능</>}
              {r(sel.s)!=null&&r(sel.s)>35&&r(sel.s)<65&&<><span style={{color:"var(--c-mute)",fontWeight:700}}>⏳ 관망 구간</span><br/>RSI 30~35 또는 65~70 도달 대기<br/>대기자금은 STRC(배당 11.5%)에 파킹</>}
              {r(sel.s)!=null&&r(sel.s)>=65&&r(sel.s)<70&&<><span style={{color:"var(--c-warn)",fontWeight:700}}>🟠 매도관심 구간</span><br/>익절 준비 · SQQQ 진입 타이밍 관찰</>}
              {r(sel.s)!=null&&r(sel.s)>=70&&<><span style={{color:"var(--c-sell)",fontWeight:700}}>🔴 매도/전환 구간</span><br/>롱 10%만 유지<br/>SQQQ 매수 → +10% 익절 후 즉시 매도<br/>나머지 전액 STRC 파킹</>}
              {r(sel.s)==null&&<>새로고침 후 확인</>}
            </div>
          </div>

          <button className="btn" onClick={()=>setSel(null)} style={{marginTop:12,background:"var(--c-card)",color:"var(--c-accent)",fontSize:13,border:"1px solid var(--c-card-border)"}}>닫기</button>
        </div>
      </div>)}

      {/* FOOTER */}
      <div style={{padding:"20px 20px 10px",textAlign:"center",fontSize:10,color:"var(--c-mute)",lineHeight:1.7,opacity:.5}}>
        TQQQ 40% · UPRO 35% · FAS 25% · SOXL 위성<br/>
        주봉 RSI(14) · Yahoo Finance · 5분 자동갱신<br/>
        대기자금 STRC 파킹 · SQQQ +10% 익절 전용<br/>
        ⚠ 투자 참고용 · 3배 레버리지 = 고위험
      </div>
    </div>
  </>);
}
