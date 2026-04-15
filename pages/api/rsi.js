export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  const ETFS = ["TQQQ","SOXL","UPRO","FAS","SQQQ","TECL","TNA","LABU","SOXS","SPXU","TZA","TECS","FAZ","LABD"];

  function calcRSI(closes, period=14) {
    if(closes.length < period+1) return null;
    let g=[],l=[];
    for(let i=1;i<closes.length;i++){const d=closes[i]-closes[i-1];g.push(d>0?d:0);l.push(d<0?-d:0);}
    let ag=g.slice(0,period).reduce((a,b)=>a+b,0)/period;
    let al=l.slice(0,period).reduce((a,b)=>a+b,0)/period;
    for(let i=period;i<g.length;i++){ag=(ag*(period-1)+g[i])/period;al=(al*(period-1)+l[i])/period;}
    if(al===0) return 100;
    return Math.round((100-100/(1+ag/al))*100)/100;
  }

  function getHist(closes){
    const h=[];
    for(let i=16;i<=closes.length;i++){const r=calcRSI(closes.slice(0,i));if(r!==null)h.push(r);}
    return h.slice(-20);
  }

  async function fetchOne(sym){
    for(const q of ["query1","query2"]){
      try{
        const r=await fetch(`https://${q}.finance.yahoo.com/v8/finance/chart/${sym}?interval=1wk&range=1y`,{headers:{"User-Agent":"Mozilla/5.0"}});
        if(!r.ok) continue;
        const d=await r.json();
        const res=d?.chart?.result?.[0]; if(!res) continue;
        const cl=(res.indicators?.quote?.[0]?.close||[]).filter(v=>v!=null);
        if(cl.length<16) continue;
        const price=Math.round(cl[cl.length-1]*100)/100;
        const prev=cl[cl.length-2];
        const change=prev?Math.round(((cl[cl.length-1]-prev)/prev)*10000)/100:0;
        const hist=getHist(cl);
        return {price,change,rsi:calcRSI(cl),prevRsi:hist.length>=2?hist[hist.length-2]:null,rsiHistory:hist};
      }catch(e){continue;}
    }
    return null;
  }

  try{
    const results={};
    await Promise.all(ETFS.map(async s=>{const d=await fetchOne(s);if(d)results[s]=d;}));
    res.status(200).json({data:results,timestamp:new Date().toISOString()});
  }catch(e){res.status(500).json({error:e.message});}
}
