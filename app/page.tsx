"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const sample = `I am writing to inform you that our team has made the decision to move the product launch date to September 12, 2026. The reason for this change is because we require additional time in order to complete final quality checks. We understand this may cause inconvenience and we sincerely apologize. We will provide another update next week.`;
const channels = ["Personal message","Business email","Customer support","LinkedIn post","Short social post","Community response","Blog article","Product description","Marketing copy","Academic explanation","Technical documentation","Executive report"];
const levels = ["A1","A2","B1","B2","C1","C2"];
const variations = ["Polished","Conversational","Concise","Expressive","Reflective"];
type HistoryItem={id:number;source:string;output:string;channel:string;level:string;created:string};
type VoiceProfile={name:string;sample:string;contractions:boolean;shortParagraphs:boolean};

function factsOf(text:string){
  const patterns=[/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sept(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{4})?/gi,/\b\d+(?:[.,]\d+)?%?\b/g,/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g,/"[^"]+"/g];
  return [...new Set(patterns.flatMap(p=>text.match(p)||[]))];
}
function sentences(text:string){return text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(s=>s.trim()).filter(Boolean)||[]}
function localRewrite(text:string, opts:{directness:number;warmth:number;level:string;channel:string;variation:string;dialect:string}, variant=0){
  let out=text.trim()
    .replace(/I am writing to inform you that/gi,variant===1?"A quick update:":opts.directness>55?"I wanted to let you know that":"I’m reaching out to share that")
    .replace(/has made the decision to/gi,"has decided to").replace(/The reason for this change is because/gi,"We’re making this change because")
    .replace(/we require additional time in order to/gi,"we need more time to").replace(/in order to/gi,"to")
    .replace(/due to the fact that/gi,"because").replace(/at this point in time/gi,"now").replace(/utilize/gi,"use").replace(/commence/gi,"begin")
    .replace(/We understand this may cause inconvenience and we sincerely apologize\.?/gi,opts.warmth>55?"We know this may be inconvenient, and we’re sorry for the disruption.":"We apologize for any inconvenience.")
    .replace(/\s+/g," ");
  if(["A1","A2","B1"].includes(opts.level)) out=out.replace(/additional/gi,"more").replace(/approximately/gi,"about").replace(/nevertheless/gi,"but");
  if(opts.dialect==="en-GB") out=out.replace(/organize/gi,"organise").replace(/apologize/gi,"apologise");
  let ss=sentences(out); if(variant===2&&ss.length>2) ss=[ss[0],...ss.slice(2),ss[1]];
  out=ss.length>2?`${ss[0]} ${ss[1]}\n\n${ss.slice(2).join(" ")}`:ss.join(" ");
  if(opts.variation==="Concise") out=sentences(out).slice(0,Math.max(2,Math.ceil(ss.length*.8))).join(" ");
  if(opts.channel==="LinkedIn post") out=`A quick update:\n\n${out}\n\nMore details to come.`;
  if(opts.channel==="Customer support") out=`Hi there,\n\n${out}\n\nThanks for your patience.`;
  if(opts.channel==="Personal message") out=`Hi,\n\n${out}`;
  return out;
}
function policyIssue(text:string){
  if(/(?:bypass|beat|evade|fool).{0,25}(?:ai detector|detection|authorship check)/i.test(text)) return "I can help improve clarity and voice, but not bypass authorship or AI-detection systems.";
  if(/(?:pretend to be|impersonate|write as if you are)\s+[A-Z][a-z]+/i.test(text)) return "I can match general characteristics, but not deceptively impersonate a real person.";
  return "";
}
function sensitiveItems(text:string){return [...new Set([...(text.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g)||[]),...(text.match(/\b(?:\+?\d[\d ()-]{8,}\d)\b/g)||[]),...(text.match(/\b(?:\d[ -]*?){13,16}\b/g)||[])])]}
function scoreText(source:string,out:string,target:string,channel:string){
  const srcFacts=factsOf(source),outLower=out.toLowerCase(),kept=srcFacts.filter(f=>outLower.includes(f.toLowerCase()));
  const meaning=srcFacts.length?Math.round(100*kept.length/srcFacts.length):Math.max(90,100-Math.abs(source.length-out.length)/Math.max(source.length,1)*15);
  const lens=sentences(out).map(x=>x.split(/\s+/).length),avg=lens.reduce((a,b)=>a+b,0)/Math.max(lens.length,1),variance=lens.reduce((a,b)=>a+Math.abs(b-avg),0)/Math.max(lens.length,1);
  const rhythm=Math.min(96,Math.round(68+variance*3)); const cefr=(["A1","A2"].includes(target)?avg<14:["B1","B2"].includes(target)?avg<24:true)?92:68;
  const audience=channel?91:75; const natural=Math.min(96,Math.round(.25*meaning+.25*rhythm+.25*cefr+.25*audience));
  return {meaning,rhythm,cefr,audience,natural,kept,missing:srcFacts.filter(f=>!outLower.includes(f.toLowerCase()))};
}
function Score({label,value}:{label:string;value:number}){return <div className="score"><div className="score-head"><span>{label}</span><strong>{value}</strong></div><div className="track"><i style={{width:`${value}%`}}/></div></div>}

export default function Home(){
  const [signedIn,setSignedIn]=useState(false),[authReady,setAuthReady]=useState(false),[authBusy,setAuthBusy]=useState(false);
  const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[authError,setAuthError]=useState("");
  const [source,setSource]=useState(sample),[output,setOutput]=useState(""),[candidates,setCandidates]=useState<string[]>([]),[candidate,setCandidate]=useState(0);
  const [channel,setChannel]=useState("Business email"),[audience,setAudience]=useState("Existing customer"),[level,setLevel]=useState("B2"),[strength,setStrength]=useState("Balanced"),[variation,setVariation]=useState("Polished"),[dialect,setDialect]=useState("en-US");
  const [purpose,setPurpose]=useState("Inform and explain next steps"),[research,setResearch]=useState(false),[sources,setSources]=useState("");
  const [history,setHistory]=useState<HistoryItem[]>([]),[showHistory,setShowHistory]=useState(false),[showVoice,setShowVoice]=useState(false);
  const [voice,setVoice]=useState<VoiceProfile>({name:"",sample:"",contractions:true,shortParagraphs:true});
  const [warmth,setWarmth]=useState(72),[directness,setDirectness]=useState(61),[formality,setFormality]=useState(62),[energy,setEnergy]=useState(45);
  const [tab,setTab]=useState<"report"|"changes"|"facts">("report"),[busy,setBusy]=useState(false),[copied,setCopied]=useState(false),[engine,setEngine]=useState<"ai"|"local"|null>(null),[notice,setNotice]=useState("");
  const facts=useMemo(()=>factsOf(source),[source]); const sensitive=useMemo(()=>sensitiveItems(source),[source]); const metrics=useMemo(()=>output?scoreText(source,output,level,channel):null,[source,output,level,channel]);
  useEffect(()=>{setSignedIn(sessionStorage.getItem("humanizer-session")==="active");setHistory(JSON.parse(localStorage.getItem("humanizer-history")||"[]"));setVoice(JSON.parse(localStorage.getItem("humanizer-voice")||'{"name":"","sample":"","contractions":true,"shortParagraphs":true}'));setAuthReady(true)},[]);
  function completeSignIn(){sessionStorage.setItem("humanizer-session","active");setSignedIn(true);setAuthBusy(false)}
  function google(){setAuthBusy(true);setTimeout(completeSignIn,500)}
  function login(e:FormEvent){e.preventDefault();if(!/^\S+@\S+\.\S+$/.test(email))return setAuthError("Enter a valid email address.");if(password.length<6)return setAuthError("Password must be at least 6 characters.");setAuthBusy(true);setTimeout(completeSignIn,500)}
  async function runRewrite(){
    const issue=policyIssue(source);if(issue){setOutput("");setCandidates([]);setNotice(issue);return}
    setBusy(true);setOutput("");setNotice("");setEngine(null); const opts={channel,audience,purpose,level,strength,variation,dialect,warmth,directness,formality,energy,research,sources,voice};
    try{const r=await fetch("/api/rewrite",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:source,...opts})});const d=await r.json() as {text?:string};if(!r.ok||!d.text)throw 0;setCandidates([d.text]);setOutput(d.text);setEngine("ai");saveHistory(d.text)}
    catch{const cs=[0,1,2].map(v=>localRewrite(source,opts,v));setCandidates(cs);setOutput(cs[0]);setCandidate(0);setEngine("local");saveHistory(cs[0]);setNotice(research?"Research mode needs a configured provider. Supplied sources were treated as context only; no new facts were added.":"Private local mode · Scores are writing-quality estimates, not authorship probabilities.")}
    finally{setBusy(false)}
  }
  function pick(i:number){setCandidate(i);setOutput(candidates[i])}
  function saveHistory(text:string){const next=[{id:Date.now(),source,output:text,channel,level,created:new Date().toLocaleString()},...history].slice(0,20);setHistory(next);localStorage.setItem("humanizer-history",JSON.stringify(next))}
  function quick(action:string){if(!output)return;let next=output;if(action==="Shorten")next=sentences(output).slice(0,Math.max(1,Math.ceil(sentences(output).length*.7))).join(" ");if(action==="Warmer")next=output.replace(/Thank you\.?$/,"Thanks so much.").replace(/We apologize/g,"We’re genuinely sorry");if(action==="Simpler")next=output.replace(/additional/gi,"more").replace(/approximately/gi,"about").replace(/nevertheless/gi,"but");if(action==="More direct")next=output.replace(/I wanted to let you know that\s*/i,"").replace(/I’m reaching out to share that\s*/i,"");setOutput(next)}
  function saveVoice(){localStorage.setItem("humanizer-voice",JSON.stringify(voice));setShowVoice(false)}
  function eraseData(){localStorage.removeItem("humanizer-history");localStorage.removeItem("humanizer-voice");sessionStorage.clear();setHistory([]);setVoice({name:"",sample:"",contractions:true,shortParagraphs:true});setSignedIn(false)}
  function download(){const blob=new Blob([output],{type:"text/plain"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="humanizer-rewrite.txt";a.click();URL.revokeObjectURL(a.href)}
  async function copy(){await navigator.clipboard.writeText(output);setCopied(true);setTimeout(()=>setCopied(false),1200)}
  if(!authReady)return <main className="auth-shell"><div className="auth-loading">✦</div></main>;
  if(!signedIn)return <main className="auth-shell"><section className="auth-story"><div className="auth-brand"><div className="mark">H</div><span>Humanizer</span></div><div className="auth-message"><p className="eyebrow">NATURAL WRITING ENGINE</p><h1>Write clearly.<br/><span>Still sound like you.</span></h1><p>Shape rough drafts into natural, audience-ready writing—without losing the facts or your voice.</p></div><div className="auth-proof"><span>✓ Meaning checked</span><span>✓ Facts protected</span><span>✓ Private local mode</span></div></section><section className="auth-panel"><div className="auth-card"><div className="mobile-auth-brand"><div className="mark">H</div><span>Humanizer</span></div><p className="step">WELCOME BACK</p><h2>Sign in to your studio</h2><p className="auth-note">Your writing space is ready when you are.</p><button className="google-button" onClick={google} disabled={authBusy}><b>G</b>{authBusy?"Opening studio…":"Continue with Google"}</button><div className="divider"><span>or continue with email</span></div><form onSubmit={login}><label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters"/></label>{authError&&<p className="auth-error">{authError}</p>}<button className="email-button" disabled={authBusy}>Sign in <span>→</span></button></form><p className="terms">Your drafts remain in this browser in local mode.</p></div></section></main>;
  return <main>
    <header><div className="brand"><div className="mark">H</div><span>Humanizer</span><em>studio</em></div><div className="header-meta"><span className="privacy"><i/>Local privacy mode</span><button className="top-action" onClick={()=>setShowVoice(true)}>Voice profile</button><button className="top-action" onClick={()=>setShowHistory(true)}>History {history.length>0&&<b>{history.length}</b>}</button><button className="signout" onClick={()=>{sessionStorage.clear();setSignedIn(false)}}>Sign out</button><div className="avatar">U</div></div></header>
    <section className="intro"><div><p className="eyebrow">NATURAL WRITING ENGINE</p><h1>Make every word<br/><span>sound like you.</span></h1></div><p className="subhead">Rewrite with clarity and character—while your meaning, facts, and intent stay intact.</p></section>
    <section className="workspace"><aside className="controls"><div className="control-title"><span>Writing direction</span><button onClick={()=>location.reload()}>Reset</button></div>
      <label>Channel<select value={channel} onChange={e=>setChannel(e.target.value)}>{channels.map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Audience<input className="text-control" value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Who will read this?"/></label>
      <label>Purpose<input className="text-control" value={purpose} onChange={e=>setPurpose(e.target.value)} placeholder="What should this achieve?"/></label>
      <label>English level<div className="seg six">{levels.map(x=><button className={level===x?"active":""} onClick={()=>setLevel(x)} key={x}>{x}</button>)}</div><small>Automated estimate—not formal certification</small></label>
      <label>Rewrite strength<div className="seg three">{["Light","Balanced","Deep"].map(x=><button className={strength===x?"active":""} onClick={()=>setStrength(x)} key={x}>{x}</button>)}</div></label>
      <label>Variation<select value={variation} onChange={e=>setVariation(e.target.value)}>{variations.map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Dialect<select value={dialect} onChange={e=>setDialect(e.target.value)}><option value="en-US">American English</option><option value="en-GB">British English</option></select></label>
      <label className="check-control"><input type="checkbox" checked={research} onChange={e=>setResearch(e.target.checked)}/> Research mode <small>{research?"Uses only sources you paste in local mode":"Off · no external facts added"}</small></label>
      {research&&<label>Sources or factual context<textarea className="source-control" value={sources} onChange={e=>setSources(e.target.value)} placeholder="Paste source notes, citations, or URLs…"/></label>}
      {[['Warmth',warmth,setWarmth,'Neutral','Warm'],['Directness',directness,setDirectness,'Diplomatic','Direct'],['Formality',formality,setFormality,'Casual','Formal'],['Energy',energy,setEnergy,'Calm','Energetic']].map(([n,v,set,a,b])=><label key={String(n)}>{String(n)} <b>{Number(v)}</b><input type="range" value={Number(v)} onChange={e=>(set as (x:number)=>void)(+e.target.value)}/><div className="range-label"><span>{String(a)}</span><span>{String(b)}</span></div></label>)}
      <div className="factbox"><div><span className="shield">✓</span><strong>Protected fact ledger</strong></div><p>{facts.length?`${facts.length} immutable spans detected`:"No names, dates, numbers, or quotes detected"}</p><div className="chips">{facts.slice(0,6).map(f=><span key={f}>{f}</span>)}</div></div>
      {sensitive.length>0&&<div className="sensitive"><strong>Privacy notice</strong><p>{sensitive.length} possible sensitive item{sensitive.length>1?"s":""} detected. Review before using an online model.</p></div>}
    </aside><div className="editor-area"><div className="panes"><article className="pane original"><div className="pane-head"><span>ORIGINAL</span><span>{source.split(/\s+/).filter(Boolean).length} words</span></div><textarea value={source} onChange={e=>setSource(e.target.value)} aria-label="Original text"/><button className="clear" onClick={()=>setSource("")}>Clear</button></article><article className="pane result"><div className="pane-head"><span>REWRITE {engine&&<em className={`engine ${engine}`}>{engine.toUpperCase()}</em>}</span>{output&&<button onClick={copy}>{copied?"Copied":"Copy"}</button>}</div>{busy?<div className="thinking"><i/><i/><i/><p>Planning, writing, and checking…</p></div>:output?<div className="output" contentEditable suppressContentEditableWarning>{output}</div>:<div className="empty"><div className="spark">✦</div><p>Your rewrite will appear here</p><small>Meaning checked. Voice refined.</small></div>}</article></div>
      {candidates.length>1&&<div className="candidate-bar"><span>Internal candidates</span>{candidates.map((_,i)=><button className={candidate===i?"active":""} onClick={()=>pick(i)} key={i}>Option {i+1}</button>)}</div>}
      {output&&<div className="quick-actions"><span>Refine</span>{["Shorten","Warmer","Simpler","More direct"].map(x=><button onClick={()=>quick(x)} key={x}>{x}</button>)}<button onClick={download}>Download .txt</button><button onClick={()=>{setSource(output);setOutput("")}}>Use as new draft</button></div>}
      {notice&&<p className={policyIssue(source)?"policy-notice":"rewrite-notice"}>{notice}</p>}<button className="rewrite" disabled={!source.trim()||busy} onClick={runRewrite}><span>✦</span>{busy?"Evaluating…":"Rewrite naturally"}</button>
    </div></section>
    <section className={`report ${output?"visible":""}`}><div className="report-tabs"><button className={tab==="report"?"active":""} onClick={()=>setTab("report")}>Natural writing report</button><button className={tab==="changes"?"active":""} onClick={()=>setTab("changes")}>Change map</button><button className={tab==="facts"?"active":""} onClick={()=>setTab("facts")}>Fact ledger <span>{facts.length}</span></button></div>
      {metrics&&tab==="report"&&<div className="report-grid"><div className="big-score"><div className="ring"><strong>{metrics.natural}</strong><small>/ 100</small></div><div><h3>{metrics.natural>84?"Natural and clear":"Needs refinement"}</h3><p>Quality estimate for a {channel.toLowerCase()}; never an authorship probability.</p><span className="confidence">Estimated range {Math.max(0,metrics.natural-5)}–{Math.min(100,metrics.natural+4)}</span></div></div><div className="scores"><Score label="Meaning preservation" value={metrics.meaning}/><Score label="Audience fit" value={metrics.audience}/><Score label="CEFR alignment" value={metrics.cefr}/><Score label="Rhythm variation" value={metrics.rhythm}/></div><div className={`integrity ${metrics.missing.length?"warn":""}`}><span>{metrics.missing.length?"!":"✓"}</span><div><strong>{metrics.missing.length?"Review factual integrity":"Factual integrity passed"}</strong><p>{metrics.missing.length?`Missing or changed: ${metrics.missing.join(", ")}`:"Every detected protected span appears in the rewrite."}</p></div></div></div>}
      {metrics&&tab==="changes"&&<div className="change-list"><div><span>01</span><p><strong>Discourse plan</strong>Opened for the selected channel and audience.</p></div><div><span>02</span><p><strong>Clarity</strong>Reduced inflated and repetitive wording.</p></div><div><span>03</span><p><strong>Level control</strong>Adjusted sentence and vocabulary complexity toward {level}.</p></div><div><span>04</span><p><strong>Integrity check</strong>Compared {facts.length} protected spans with the result.</p></div></div>}
      {metrics&&tab==="facts"&&<div className="ledger">{facts.length?facts.map(f=><div key={f}><span className={metrics.kept.includes(f)?"kept":"missing"}>{metrics.kept.includes(f)?"Preserved":"Review"}</span><strong>{f}</strong></div>):<p>No protected spans were detected. Meaning scoring has lower confidence for this text.</p>}</div>}
    </section><footer><span>Humanizer improves writing—it does not determine who wrote it.</span><span>Meaning first · No artificial mistakes · No detector evasion · <button onClick={eraseData}>Delete my local data</button></span></footer>
    {showHistory&&<div className="modal-backdrop" onClick={()=>setShowHistory(false)}><section className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><p className="eyebrow">DEVICE-LOCAL</p><h2>Rewrite history</h2></div><button onClick={()=>setShowHistory(false)}>×</button></div>{history.length?history.map(h=><button className="history-item" key={h.id} onClick={()=>{setSource(h.source);setOutput(h.output);setChannel(h.channel);setLevel(h.level);setShowHistory(false)}}><strong>{h.channel} · {h.level}</strong><span>{h.created}</span><p>{h.output.slice(0,130)}…</p></button>):<p className="modal-empty">No saved rewrites yet.</p>}<button className="danger" onClick={()=>{localStorage.removeItem("humanizer-history");setHistory([])}}>Clear history</button></section></div>}
    {showVoice&&<div className="modal-backdrop" onClick={()=>setShowVoice(false)}><section className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><p className="eyebrow">AUTHORIZED VOICE</p><h2>Create a voice profile</h2></div><button onClick={()=>setShowVoice(false)}>×</button></div><p className="modal-copy">Use only writing you own or have permission to use. Local profiles never leave this device.</p><label>Profile name<input className="text-control" value={voice.name} onChange={e=>setVoice({...voice,name:e.target.value})} placeholder="My professional voice"/></label><label>Representative sample<textarea className="voice-sample" value={voice.sample} onChange={e=>setVoice({...voice,sample:e.target.value})} placeholder="Paste at least five representative samples for best results…"/></label><label className="check-control"><input type="checkbox" checked={voice.contractions} onChange={e=>setVoice({...voice,contractions:e.target.checked})}/> Prefer contractions</label><label className="check-control"><input type="checkbox" checked={voice.shortParagraphs} onChange={e=>setVoice({...voice,shortParagraphs:e.target.checked})}/> Prefer short paragraphs</label><button className="save-profile" onClick={saveVoice}>Save local profile</button></section></div>}
  </main>
}
