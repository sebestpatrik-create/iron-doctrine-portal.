:root{
  --iron:#16130E; --iron-2:#1E1810; --iron-3:#2A2117;
  --cream:#ECE3CF; --cream-dim:#B8AC8E;
  --gold:#C79A3B; --gold-bright:#E4BC58; --oxblood:#9A3D2A; --bronze:#7A6336;
  --line:rgba(199,154,59,.26);
}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:var(--iron);color:var(--cream);font-family:'Spectral',Georgia,serif;font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
body::after{content:"";position:fixed;inset:0;z-index:9999;pointer-events:none;opacity:.05;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
::selection{background:var(--gold);color:var(--iron)}
a{color:inherit;text-decoration:none}
.eyebrow{font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.32em;font-size:.7rem;font-weight:600;color:var(--gold)}
.wrap{max-width:1080px;margin:0 auto;padding:0 26px}
.muted{color:var(--cream-dim);font-style:italic}

/* NAV */
nav{position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:16px 26px;background:rgba(20,17,12,.92);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.brand{font-family:'Anton',sans-serif;text-transform:uppercase;letter-spacing:.06em;font-size:1.15rem;line-height:1}
.brand b{color:var(--gold);font-weight:400}
.member{display:flex;align-items:center;gap:12px}
.member .label{font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.2em;font-size:.62rem;color:var(--cream-dim)}
.avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(150deg,var(--gold),var(--bronze));color:var(--iron);display:grid;place-items:center;font-family:'Oswald',sans-serif;font-weight:700;font-size:.78rem;letter-spacing:.04em}

/* HERO */
header.hero{position:relative;overflow:hidden;padding:74px 0 64px;border-bottom:1px solid var(--line)}
.sunburst{position:absolute;top:-30%;right:-12%;width:680px;aspect-ratio:1;opacity:.4;pointer-events:none}
header.hero::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 80% 0%,rgba(199,154,59,.10),transparent 55%),linear-gradient(180deg,transparent 60%,var(--iron))}
.hero-inner{position:relative;z-index:2}
.hero-eyebrow{margin-bottom:18px}
h1.greet{font-family:'Anton',sans-serif;text-transform:uppercase;line-height:.9;letter-spacing:.01em;font-size:clamp(2.8rem,8vw,5.4rem);margin:0 0 8px -.03em}
h1.greet b{color:var(--gold);font-weight:400}
.hero-line{color:var(--cream-dim);font-size:1.15rem;max-width:540px;margin:18px 0 30px}
.actions{display:flex;flex-wrap:wrap;gap:13px}
.btn{font-family:'Oswald',sans-serif;font-weight:600;text-transform:uppercase;letter-spacing:.13em;font-size:.8rem;padding:14px 26px;border-radius:2px;cursor:pointer;border:1px solid var(--gold);display:inline-flex;align-items:center;gap:9px;transition:transform .15s ease,background .2s,color .2s}
.btn-primary{background:var(--gold);color:var(--iron)}
.btn-primary:hover{background:var(--gold-bright);transform:translateY(-2px)}
.btn-ghost{background:transparent;color:var(--gold)}
.btn-ghost:hover{background:rgba(199,154,59,.12);transform:translateY(-2px)}

/* SECTIONS */
section{padding:60px 0;border-bottom:1px solid var(--line)}
.sec-head{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-bottom:28px;flex-wrap:wrap}
.sec-title{font-family:'Anton',sans-serif;text-transform:uppercase;font-size:clamp(1.9rem,4.5vw,2.8rem);line-height:1;letter-spacing:.01em;margin-top:8px}

/* WORKOUT / BLOCKS */
.blocks .wk-h{font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.08em;font-size:1.05rem;color:var(--gold);font-weight:700;margin:26px 0 12px}
.blocks .wk-h3{font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.06em;font-size:.92rem;color:var(--cream);font-weight:600;margin:18px 0 8px}
.blocks .wk-p{color:var(--cream-dim);margin:8px 0}
.blocks .wk-li{color:var(--cream-dim);margin:4px 0}
.blocks .wk-quote{border-left:2px solid var(--gold);padding-left:14px;color:var(--cream-dim);font-style:italic;margin:12px 0}
.blocks .wk-hr{border:none;border-top:1px solid var(--line);margin:20px 0}
.workout{border:1px solid var(--line);border-radius:4px;overflow:hidden;background:linear-gradient(160deg,rgba(199,154,59,.05),transparent);margin:10px 0 4px}
.workout table{width:100%;border-collapse:collapse}
.workout th{font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.1em;font-size:.64rem;color:var(--gold);text-align:left;padding:13px 20px;border-bottom:1px solid var(--line);font-weight:600}
.workout th.r,.workout td.r{text-align:right}
.workout td{padding:12px 20px;border-bottom:1px solid rgba(199,154,59,.10);font-size:.96rem}
.workout tr:last-child td{border-bottom:none}
.workout td.ex{color:var(--cream)}
.workout td.num{font-family:'Oswald',sans-serif;color:var(--cream-dim);letter-spacing:.04em}

/* PROGRESS */
.prog-grid{display:grid;grid-template-columns:1.5fr 1fr;gap:26px;align-items:stretch}
.chart-card,.stat-stack{border:1px solid var(--line);border-radius:4px;padding:24px;background:var(--iron-2)}
.chart-card h3{font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.14em;font-size:.7rem;color:var(--cream-dim);margin-bottom:16px;font-weight:600}
.chart-svg{width:100%;height:auto;display:block}
.stat-stack{display:flex;flex-direction:column;justify-content:center;gap:20px}
.stat{display:flex;align-items:baseline;justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:16px}
.stat:last-child{border-bottom:none;padding-bottom:0}
.stat .k{font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.1em;font-size:.66rem;color:var(--cream-dim)}
.stat .v{font-family:'Anton',sans-serif;font-size:2rem;color:var(--cream);line-height:1}
.stat .v small{font-family:'Oswald',sans-serif;font-size:.9rem;color:var(--gold);font-weight:600;margin-left:4px}
@media(max-width:780px){.prog-grid{grid-template-columns:1fr}}

/* NUTRITION */
.macros{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:4px;overflow:hidden}
.macro{background:var(--iron);padding:26px 18px;text-align:center}
.macro .v{font-family:'Anton',sans-serif;font-size:2.3rem;line-height:1;color:var(--gold)}
.macro.kcal .v{color:var(--cream)}
.macro .k{font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.14em;font-size:.64rem;color:var(--cream-dim);margin-top:9px}
@media(max-width:620px){.macros{grid-template-columns:repeat(2,1fr)}}

/* SUPPLEMENTS */
.supps{display:flex;flex-wrap:wrap;gap:10px}
.supp{font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.08em;font-size:.74rem;color:var(--cream);border:1px solid var(--line);border-radius:2px;padding:11px 16px;background:linear-gradient(160deg,rgba(199,154,59,.06),transparent)}

/* CHECK-IN BAND */
.band{text-align:center;background:var(--cream);color:var(--iron);border:none}
.band .eyebrow{color:var(--oxblood)}
.band .sec-title{color:var(--iron);margin:8px 0 10px}
.band p{color:#5c5036;max-width:440px;margin:0 auto 26px}

/* FOOTER */
footer{padding:34px 0;text-align:center}
footer .fmark{font-family:'Anton',sans-serif;text-transform:uppercase;letter-spacing:.05em;font-size:1.05rem}
footer .fmark b{color:var(--gold);font-weight:400}
footer small{display:block;margin-top:9px;color:var(--cream-dim);font-size:.78rem;letter-spacing:.04em}

/* LANDING */
.landing{min-height:100vh;display:grid;place-items:center;text-align:center;padding:40px}
.landing .wordmark{font-family:'Anton',sans-serif;text-transform:uppercase;font-size:clamp(3rem,12vw,7rem);line-height:.9}
.landing .wordmark b{color:var(--gold);font-weight:400}
.landing p{color:var(--cream-dim);max-width:440px;margin:20px auto 0}
.demo-flag{background:var(--oxblood);color:var(--cream);text-align:center;font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.14em;font-size:.66rem;padding:8px}

@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
:focus-visible{outline:2px solid var(--gold-bright);outline-offset:3px}
