import { useCallback, useEffect, useRef, useState } from 'react';
import { createScene } from './scene.js';
import { INFO, STAGES, DOCS, STEPS } from './data.js';

const status = (l) => (l <= 10 ? 'Critical' : l <= 30 ? 'Low Gas' : 'Normal');
const COL = { Normal: '#2fbf71', 'Low Gas': '#f0a020', Critical: '#e5383b' };
const ADV = { Normal: 'No action needed. The level is comfortable.', 'Low Gas': 'Plan a refill soon.', Critical: 'Arrange a refill promptly.' };
const now = () => new Date().toLocaleTimeString();

function useSim() {
  const [level, setLevel] = useState(100), [run, setRun] = useState(false), [log, setLog] = useState([{ t: now(), m: 'Simulation ready at 100%', s: 'Normal' }]);
  const [hist, setHist] = useState([100]), [cap, setCap] = useState(14.2), [tare, setTare] = useState(15), [use, setUse] = useState(0.4), [stamp, setStamp] = useState(now());
  const prev = useRef('Normal'), lr = useRef(100); lr.current = level;
  const set = useCallback((v, why) => { v = Math.max(0, Math.min(100, Math.round(Number(v) || 0))); const s = status(v); setLevel(v); setStamp(now()); setHist((h) => [...h.slice(-59), v]);
    if (why || s !== prev.current) setLog((l) => [{ t: now(), m: why || `Status changed to ${s} at ${v}%`, s }, ...l].slice(0, 30)); prev.current = s; }, []);
  useEffect(() => { if (!run) return undefined; const id = setInterval(() => { const n = lr.current - 1; if (lr.current <= 0) { setRun(false); return; } set(n); if (n <= 0) { setRun(false); setLog((l) => [{ t: now(), m: 'Simulation finished: cylinder empty', s: 'Critical' }, ...l]); } }, 500); return () => clearInterval(id); }, [run, set]);
  const reset = () => { setRun(false); setLevel(100); setHist([100]); prev.current = 'Normal'; setStamp(now()); setLog([{ t: now(), m: 'Simulation reset to 100%', s: 'Normal' }]); };
  const mass = (cap * level) / 100, st = status(level);
  return { level, set, run, setRun, log, hist, cap, setCap, tare, setTare, use, setUse, stamp, reset, mass, weight: tare + mass, days: use > 0 && mass > 0 ? mass / use : 0, st };
}

function Viewer({ sim, mode, view, rotate, prog, sel, onSelect, children }) {
  const box = useRef(), lab = useRef(), api = useRef(null), cb = useRef(onSelect), [err, setErr] = useState(false); cb.current = onSelect;
  useEffect(() => { const a = createScene(box.current, lab.current, { onSelect: (id) => cb.current && cb.current(id), onError: () => setErr(true) }); api.current = a; return () => { if (a) a.dispose(); api.current = null; }; }, []);
  useEffect(() => { api.current && api.current.setLevel(sim.level, sim.st); }, [sim.level, sim.st]);
  useEffect(() => { api.current && api.current.setMode(mode); }, [mode]);
  useEffect(() => { api.current && view && api.current.setView(view.n); }, [view]);
  useEffect(() => { api.current && api.current.setRotate(rotate); }, [rotate]);
  useEffect(() => { api.current && prog != null && api.current.setExplode(prog); }, [prog]);
  useEffect(() => { api.current && api.current.select(sel); }, [sel]);
  return (<div className="viewer"><div ref={box} className="gl" /><div ref={lab} className="labels" />
    {err && <div className="fallback">3D view unavailable: WebGL could not start in this browser. Try Chrome or Edge with hardware acceleration on.</div>}
    <div className="legend"><i style={{ background: COL[sim.st] }} />Level bar = estimated remaining LPG (simulated), not an internal sensor reading</div>{children}</div>);
}

const Metric = ({ k, v, c }) => (<div className="metric"><span>{k}</span><b style={{ color: c }}>{v}</b></div>);
function Metrics({ s }) {
  return (<div className="metrics"><Metric k="Gas remaining (est.)" v={`${s.level}%`} c={COL[s.st]} /><Metric k="LPG mass (est.)" v={`${s.mass.toFixed(2)} kg`} /><Metric k="Days remaining (est.)" v={s.days ? s.days.toFixed(1) : '0'} />
    <Metric k="Total weight (sim.)" v={`${s.weight.toFixed(2)} kg`} /><Metric k="Device status" v={s.st} c={COL[s.st]} /><Metric k="Wi-Fi (simulated)" v="Connected" c="#3aa0ff" />
    <Metric k="Last simulated update" v={s.stamp} /><Metric k="Alert" v={s.st === 'Normal' ? 'None' : s.st} c={COL[s.st]} /></div>);
}
function Chart({ hist }) {
  const n = hist.length, pts = hist.map((v, i) => `${n === 1 ? 150 : 10 + (i / (n - 1)) * 280},${110 - v})`).join(' ');
  return (<svg viewBox="0 0 300 120" className="chart"><line x1="10" x2="290" y1="80" y2="80" stroke="#f0a020" strokeDasharray="3 3" /><line x1="10" x2="290" y1="100" y2="100" stroke="#e5383b" strokeDasharray="3 3" />
    <text x="12" y="77" fill="#f0a020" fontSize="7">30% low</text><text x="12" y="97" fill="#e5383b" fontSize="7">10% critical</text><polyline fill="none" stroke="#e0452b" strokeWidth="2" points={pts} /><text x="150" y="10" fill="#9aa4b5" fontSize="8" textAnchor="middle">Simulated usage trend (gas %)</text></svg>);
}
const Alert = ({ s }) => (<div className="alert" style={{ borderColor: COL[s.st] }}><b style={{ color: COL[s.st] }}>{s.st === 'Normal' ? 'Normal' : s.st === 'Low Gas' ? 'Low Gas warning' : 'CRITICAL warning'}</b><p>{ADV[s.st]}</p></div>);
const Log = ({ log }) => (<div className="log">{log.map((l, i) => <div key={i}><span>{l.t}</span><i style={{ background: COL[l.s] }} />{l.m}</div>)}</div>);
function Controls({ s }) {
  const sc = [['A Full', 100], ['B Normal', 65], ['C Low Gas', 25], ['D Critical', 8]];
  return (<div className="panel"><h3>Simulated sensor controls</h3><label>Gas level: {s.level}%<input type="range" min="0" max="100" value={s.level} onChange={(e) => s.set(e.target.value)} /></label>
    <div className="row">{sc.map(([n, v]) => <button key={n} onClick={() => s.set(v, `Scenario ${n}: ${v}%`)}>{n}</button>)}</div>
    <div className="row"><button onClick={() => s.setRun(true)} disabled={s.run || s.level <= 0}>{s.hist.length > 1 && s.level < 100 ? 'Resume' : 'Run'} consumption</button><button onClick={() => s.setRun(false)} disabled={!s.run}>Pause</button><button onClick={s.reset}>Reset</button></div>
    <div className="row small"><label>Capacity kg<input type="number" min="1" value={s.cap} onChange={(e) => s.setCap(Math.max(1, +e.target.value || 1))} /></label><label>Tare kg (illustrative)<input type="number" min="0" value={s.tare} onChange={(e) => s.setTare(Math.max(0, +e.target.value || 0))} /></label><label>Use kg/day (illustrative)<input type="number" min="0" step="0.1" value={s.use} onChange={(e) => s.setUse(Math.max(0, +e.target.value || 0))} /></label></div>
    <p className="hint">Mass = capacity x level / 100. Weight = tare + mass. Days = mass / daily use. Simulated values only.</p></div>);
}

function Studio({ sim, go, stud, setStud }) {
  const { mode, prog, sel, rotate } = stud, [view, setView] = useState(null); const info = sel && INFO[sel];
  const m = (x) => setStud((o) => ({ ...o, mode: x, prog: null })), v = (n) => setView({ n, k: Math.random() });
  return (<div className="studio"><Viewer sim={sim} mode={mode} view={view} rotate={rotate} prog={prog} sel={sel} onSelect={(id) => setStud((o) => ({ ...o, sel: id }))} />
    <aside><div className="panel"><h3>Views</h3><div className="grid">
      {[['Product View', 'product'], ['Exploded View', 'exploded'], ['Internal Components', 'internal'], ['Assembly View', 'assembly']].map(([n, x]) => <button key={n} className={mode === x ? 'on' : ''} onClick={() => m(x)}>{n}</button>)}
      {[['Front View', 'front'], ['Side View', 'side'], ['Top View', 'top'], ['Isometric', 'iso']].map(([n, x]) => <button key={n} onClick={() => v(x)}>{n}</button>)}
      <button onClick={() => { v('iso'); m('product'); }}>Reset Camera</button><button className={rotate ? 'on' : ''} onClick={() => setStud((o) => ({ ...o, rotate: !o.rotate }))}>Rotate Model</button></div>
      <label>Explode timeline<input type="range" min="0" max="1" step="0.01" value={prog == null ? (mode === 'exploded' ? 1 : 0) : prog} onChange={(e) => setStud((o) => ({ ...o, mode: 'exploded', prog: +e.target.value }))} /></label>
      <div className="row"><button onClick={() => m('exploded')}>Disassemble</button><button onClick={() => m('assembly')}>Assemble Product</button></div></div>
    <div className="panel"><h3>{info ? info[0] : 'Component information'}</h3>{info ? (<><p>{info[1]}</p><p><b>Position:</b> {info[2]}</p><p><b>Next in chain:</b> {info[3]}</p></>) : <p>Click any part of the model to see its purpose and where it sits in the system.</p>}</div>
    <div className="panel"><h3>Dimensions (conceptual estimates)</h3><p>Base: about 320 mm diameter, 30 to 40 mm high<br />Cylinder: about 300 mm diameter, domestic 14.2 kg type<br />Weight: base under 1.5 kg (target)</p></div></aside></div>);
}

function Arch() {
  const [i, setI] = useState(0), s = STAGES[i];
  return (<div className="page"><h2>System architecture <em>(proposed, not implemented)</em></h2><div className="flow">{STAGES.map((x, k) => (<div key={k} className="stage"><button className={i === k ? 'on' : ''} onClick={() => setI(k)}>{x[0]}</button>{k < STAGES.length - 1 && <span className="arrow"><u /></span>}</div>))}</div>
    <div className="panel wide"><h3>{s[0]}</h3><table><tbody>{['Input', 'Processing', 'Output', 'Communication', 'Role in system'].map((h, k) => <tr key={h}><th>{h}</th><td>{s[k + 1]}</td></tr>)}</tbody></table></div></div>);
}
const Docs = () => (<div className="page"><h2>Project documentation</h2><div className="docs">{DOCS.map(([h, t]) => <div className="panel" key={h}><h3>{h}</h3><p>{t}</p></div>)}</div></div>);

export default function App() {
  const sim = useSim(), [page, setPage] = useState('overview'), [step, setStep] = useState(null);
  const [stud, setStud] = useState({ mode: 'product', prog: null, sel: null, rotate: false });
  const nav = [['overview', 'Overview'], ['studio', '3D Studio'], ['dashboard', 'Dashboard'], ['architecture', 'Architecture'], ['lab', 'Simulation Lab'], ['docs', 'Documentation']];
  useEffect(() => { if (step == null) return; const t = STEPS[step]; setPage(t.page); setStud((o) => ({ ...o, mode: t.mode, prog: null, sel: t.sel, rotate: step === 0 })); sim.set(t.level, `Presentation: ${t.title}`); /* eslint-disable-next-line */ }, [step]);
  const dash = (<div className="dash"><Metrics s={sim} /><div className="two"><div className="panel"><Chart hist={sim.hist} /></div><div><Alert s={sim} /><Controls s={sim} /></div></div><div className="panel"><h3>Recent activity (simulated)</h3><Log log={sim.log} /></div></div>);
  return (<div className="app"><header><b>GAS<span>SENSE</span></b><nav>{nav.map(([k, n]) => <button key={k} className={page === k ? 'on' : ''} onClick={() => { setStep(null); setPage(k); }}>{n}</button>)}</nav><button className="pres" onClick={() => setStep(0)}>Presentation</button></header>
    <div className="banner">Conceptual virtual prototype. All readings are simulated. The hardware has not been built, calibrated or tested.</div>
    <main>{page === 'overview' && (<div className="hero"><div><h1>GasSense<br /><small>Smart LPG Cylinder Monitoring</small></h1><p>A weighing base that sits under a standard cylinder, measures its total weight and would estimate the gas left, so a household can refill before the gas ends.</p>
      <div className="row"><button className="pri" onClick={() => setStep(0)}>Start Presentation</button><button onClick={() => { setStud((o) => ({ ...o, mode: 'exploded', prog: null })); setPage('studio'); }}>Explore Internal Components</button><button onClick={() => setPage('dashboard')}>Open Monitoring Dashboard</button></div>
      <ul><li>See the gas level at a glance</li><li>Early low-gas and critical warnings</li><li>Refill planning from estimated days left</li><li>Retrofit design for existing cylinders</li></ul></div>
      <Viewer sim={sim} mode="product" rotate sel={null} onSelect={() => {}} /></div>)}
      {page === 'studio' && <Studio sim={sim} stud={stud} setStud={setStud} />}
      {page === 'dashboard' && <div className="page"><h2>Monitoring dashboard <em>(simulated)</em></h2>{dash}</div>}
      {page === 'architecture' && <Arch />}
      {page === 'lab' && <div className="page"><h2>Simulation lab</h2><p className="hint">Thresholds: above 30% Normal, at or below 30% Low Gas, at or below 10% Critical (Critical wins). Illustrative values.</p>{dash}</div>}
      {page === 'docs' && <Docs />}</main>
    {step != null && (<div className="presbar"><div><small>Step {step + 1} of {STEPS.length}</small><h3>{STEPS[step].title}</h3><p>{STEPS[step].say}</p></div>
      <div className="row"><button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Previous</button><button className="pri" onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))} disabled={step === STEPS.length - 1}>Next</button>
        <button onClick={() => { setStep(null); setPage('studio'); }}>Back to model</button><button onClick={() => setStep(null)}>Exit</button></div></div>)}</div>);
}
