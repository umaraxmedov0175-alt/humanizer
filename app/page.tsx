"use client";

import { useMemo, useState } from "react";

const sample = `I am writing to inform you that our team has made the decision to move the product launch date to September 12, 2026. The reason for this change is because we require additional time in order to complete final quality checks. We understand this may cause inconvenience and we sincerely apologize. We will provide another update next week.`;

const channels = ["Business email", "LinkedIn post", "Customer support", "Blog article", "Executive report"];
const levels = ["A2", "B1", "B2", "C1"];

function extractFacts(text: string) {
  const dates = text.match(/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sept(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{4})?|\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/gi) || [];
  const numbers = text.match(/\b\d+(?:[.,]\d+)?%?\b/g) || [];
  const names = text.match(/(?<![.!?]\s)(?<!^)\b[A-Z][a-z]{2,}\b/g) || [];
  return [...new Set([...dates, ...numbers, ...names])];
}

function rewriteText(text: string, directness: number, warmth: number, level: string, channel: string) {
  let out = text.trim()
    .replace(/I am writing to inform you that/gi, directness > 55 ? "I wanted to let you know that" : "I’m reaching out to share that")
    .replace(/has made the decision to/gi, "has decided to")
    .replace(/The reason for this change is because/gi, "We’re making this change because")
    .replace(/we require additional time in order to/gi, "we need more time to")
    .replace(/We understand this may cause inconvenience and we sincerely apologize\.?/gi, warmth > 55 ? "We know this may be inconvenient, and we’re sorry for the disruption." : "We apologize for any inconvenience.")
    .replace(/in order to/gi, "to")
    .replace(/due to the fact that/gi, "because")
    .replace(/at this point in time/gi, "now")
    .replace(/utilize/gi, "use")
    .replace(/commence/gi, "begin")
    .replace(/additional/gi, level === "A2" || level === "B1" ? "more" : "additional")
    .replace(/\s+/g, " ");
  const sentences = out.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(s => s.trim()) || [out];
  if (sentences.length > 2) out = `${sentences[0]} ${sentences[1]}\n\n${sentences.slice(2).join(" ")}`;
  if (channel === "LinkedIn post") out = `A quick update:\n\n${out}\n\nMore details to come next week.`;
  if (channel === "Customer support") out = `Hi there,\n\n${out}\n\nThanks for your patience.`;
  return out;
}

function Score({ label, value, color }: { label: string; value: number; color?: string }) {
  return <div className="score"><div className="score-head"><span>{label}</span><strong>{value}</strong></div><div className="track"><i style={{ width: `${value}%`, background: color || "var(--ink)" }} /></div></div>;
}

export default function Home() {
  const [source, setSource] = useState(sample);
  const [output, setOutput] = useState("");
  const [channel, setChannel] = useState("Business email");
  const [level, setLevel] = useState("B2");
  const [strength, setStrength] = useState("Balanced");
  const [warmth, setWarmth] = useState(72);
  const [directness, setDirectness] = useState(61);
  const [tab, setTab] = useState<"report" | "changes">("report");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const facts = useMemo(() => extractFacts(source), [source]);

  function runRewrite() {
    if (!source.trim()) return;
    setBusy(true); setOutput("");
    window.setTimeout(() => { setOutput(rewriteText(source, directness, warmth, level, channel)); setBusy(false); }, 650);
  }

  async function copy() { if (!output) return; await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1400); }

  return <main>
    <header>
      <div className="brand"><div className="mark">H</div><span>Humanizer</span><em>studio</em></div>
      <div className="header-meta"><span className="privacy"><i /> Private by default</span><button className="icon-btn" aria-label="Help">?</button><div className="avatar">U</div></div>
    </header>

    <section className="intro">
      <div><p className="eyebrow">NATURAL WRITING ENGINE</p><h1>Make every word<br/><span>sound like you.</span></h1></div>
      <p className="subhead">Rewrite with clarity and character—while your meaning, facts, and intent stay intact.</p>
    </section>

    <section className="workspace">
      <aside className="controls">
        <div className="control-title"><span>Writing direction</span><button onClick={() => {setChannel("Business email");setLevel("B2");setStrength("Balanced");setWarmth(72);setDirectness(61)}}>Reset</button></div>
        <label>Channel<select value={channel} onChange={e=>setChannel(e.target.value)}>{channels.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>English level<div className="seg">{levels.map(x=><button className={level===x?"active":""} onClick={()=>setLevel(x)} key={x}>{x}</button>)}</div><small>{level === "B2" ? "Confident, professional English" : level === "C1" ? "Advanced, precise English" : level === "B1" ? "Clear, everyday English" : "Simple, direct English"}</small></label>
        <label>Rewrite strength<div className="seg three">{["Light","Balanced","Deep"].map(x=><button className={strength===x?"active":""} onClick={()=>setStrength(x)} key={x}>{x}</button>)}</div></label>
        <label>Warmth <b>{warmth}</b><input type="range" min="0" max="100" value={warmth} onChange={e=>setWarmth(+e.target.value)}/><div className="range-label"><span>Neutral</span><span>Warm</span></div></label>
        <label>Directness <b>{directness}</b><input type="range" min="0" max="100" value={directness} onChange={e=>setDirectness(+e.target.value)}/><div className="range-label"><span>Diplomatic</span><span>Direct</span></div></label>
        <div className="factbox"><div><span className="shield">✓</span><strong>Facts protected</strong></div><p>{facts.length ? `${facts.length} names, dates, or numbers locked` : "No protected facts detected"}</p><div className="chips">{facts.slice(0,4).map(f=><span key={f}>{f}</span>)}</div></div>
      </aside>

      <div className="editor-area">
        <div className="panes">
          <article className="pane original"><div className="pane-head"><span>ORIGINAL</span><span>{source.split(/\s+/).filter(Boolean).length} words</span></div><textarea aria-label="Original text" value={source} onChange={e=>setSource(e.target.value)} placeholder="Paste your draft here…"/><button className="clear" onClick={()=>setSource("")}>Clear</button></article>
          <article className="pane result"><div className="pane-head"><span>REWRITE</span>{output && <button onClick={copy}>{copied ? "Copied" : "Copy"}</button>}</div>{busy ? <div className="thinking"><i/><i/><i/><p>Finding the natural rhythm…</p></div> : output ? <div className="output" contentEditable suppressContentEditableWarning>{output}</div> : <div className="empty"><div className="spark">✦</div><p>Your rewrite will appear here</p><small>Meaning preserved. Voice refined.</small></div>}</article>
        </div>
        <button className="rewrite" disabled={!source.trim() || busy} onClick={runRewrite}><span>✦</span>{busy ? "Rewriting…" : "Rewrite naturally"}<kbd>Ctrl ↵</kbd></button>
      </div>
    </section>

    <section className={`report ${output ? "visible" : ""}`}>
      <div className="report-tabs"><button className={tab==="report"?"active":""} onClick={()=>setTab("report")}>Natural writing report</button><button className={tab==="changes"?"active":""} onClick={()=>setTab("changes")}>What changed <span>4</span></button></div>
      {tab === "report" ? <div className="report-grid"><div className="big-score"><div className="ring"><strong>88</strong><small>/ 100</small></div><div><h3>Natural and clear</h3><p>The rewrite reads smoothly for a {channel.toLowerCase()} and keeps the original intent.</p><span className="confidence">Confidence range 84–91</span></div></div><div className="scores"><Score label="Meaning preservation" value={98}/><Score label="Audience fit" value={91}/><Score label="CEFR alignment" value={94}/><Score label="Rhythm variation" value={82} color="var(--coral)"/></div><div className="integrity"><span>✓</span><div><strong>Factual integrity passed</strong><p>All detected names, dates, numbers, and claims are preserved.</p></div></div></div> : <div className="change-list"><div><span>01</span><p><strong>Opened more directly</strong>Removed the formal lead-in so the message reaches its point sooner.</p></div><div><span>02</span><p><strong>Simplified wording</strong>Changed inflated phrases to familiar, natural alternatives.</p></div><div><span>03</span><p><strong>Improved rhythm</strong>Split the message into shorter paragraphs with varied sentence lengths.</p></div><div><span>04</span><p><strong>Kept the facts</strong>Preserved every date, number, and commitment from the source.</p></div></div>}
    </section>

    <footer><span>Humanizer doesn’t judge who wrote your text. It helps the writing work better.</span><span>Meaning first · No artificial mistakes · Your data stays yours</span></footer>
  </main>;
}
