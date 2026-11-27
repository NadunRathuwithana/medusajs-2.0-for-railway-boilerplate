import json,html,re,collections
iss=json.load(open('/tmp/issues.json'))
area={'shopping.md':'Shopping','v2-features.md':'V2 features','checkout.md':'Checkout & payments','emails.md':'Orders & emails','responsive.md':'Responsive & UI','performance-seo.md':'Performance & SEO','tracking.md':'Tracking','security.md':'Security','cutover.md':'Cutover'}
fixed={'SEC-01':'ac2fd54','SEC-02':'ac2fd54 (partial)','SEC-03':'86c6052','SEC-04':'86c6052','SEC-07':'86c6052','CUT-03':'86c6052','PAY-01':'86c6052','PAY-02':'86c6052','PAY-03':'232e90d','SEO-01':'noindex commit','SEO-02':'noindex commit','PERF-03':'noindex commit','V2F-01':'noindex commit','CUT-08':'noindex commit','CUT-07':'noindex commit','UI-01':'c3c92f4','UI-02':'c3c92f4','MAIL-01':'86c6052'}
owner={'CUT-01','CUT-02','CUT-04','MAIL-08','MAIL-12','MAIL-19','TRK-07','TRK-05','CUT-09','CUT-10','CUT-11'}
rows=[]
for f,i,t,s in iss:
    st='fixed' if i in fixed else ('owner' if i in owner else 'open')
    rows.append(dict(a=area[f],id=i,t=t,s=s if s!='?' else 'minor',st=st,c=fixed.get(i,'')))
cnt=collections.Counter((r['s'],r['st']) for r in rows)
tot=collections.Counter(r['s'] for r in rows)
openb=sum(1 for r in rows if r['s']=='blocker' and r['st']!='fixed')
byarea=collections.defaultdict(lambda:collections.Counter())
for r in rows:byarea[r['a']][r['s']]+=1
def e(x):return html.escape(str(x))
score=''
for a,c in byarea.items():
    n_open=sum(1 for r in rows if r['a']==a and r['st']!='fixed' and r['s']!='minor')
    status='fail' if any(r['a']==a and r['s']=='blocker' and r['st']!='fixed' for r in rows) else ('warn' if n_open else 'ok')
    lab={'fail':'Blocked','warn':'Issues open','ok':'Clear'}[status]
    score+=f'<div class="card"><span class="pill {status}">{lab}</span><h3>{e(a)}</h3><p class="mut">{c["blocker"]} blocker, {c["major"]} major, {c["minor"]} minor</p><p class="mut">{n_open} blocker/major still open</p></div>'
tr=''.join(f'<tr data-s="{r["s"]}" data-st="{r["st"]}" data-a="{e(r["a"])}"><td>{e(r["id"])}</td><td>{e(r["a"])}</td><td><span class="pill {r["s"]}">{r["s"]}</span></td><td>{e(r["t"])}</td><td><span class="pill st-{r["st"]}">{ {"fixed":"fixed","owner":"needs you","open":"open"}[r["st"]] }</span> <span class="mut">{e(r["c"])}</span></td></tr>' for r in rows)
areaopts=''.join(f'<option>{e(a)}</option>' for a in area.values())
fixrows=''.join(f'<tr><td><code>{e(c.split()[0])}</code></td><td>{e(m)}</td></tr>' for c,m in [
('ac2fd54','Escape HTML on the payment-return page (reflected XSS), stop logging the hash input with the Onepay salt, and request headers (SEC-01, SEC-02)'),
('232e90d','Serve the hardened Onepay callback at /api/collect as well as /collect (PAY-03)'),
('86c6052','Rate limits keyed per cart, not shared; server-side COD cap and CARD_5 guard at cart completion; /store/my-orders only returns the customer\'s own orders (SEC-03/04/07, CUT-03, PAY-01/02, MAIL-01)'),
('noindex','Dev sends noindex and robots disallow; sitemap hides the internal packing product; promo bar kept when the CMS row is missing; static images are cacheable (SEO-01/02, PERF-03, V2F-01)'),
('c3c92f4','Global and checkout error pages; 16px inputs on mobile so iOS does not zoom (UI-01, UI-02)')])
must=[('Give live its own Redis (or DB index). Dev and live share one today.','You','15 min'),
('After deploying V2 to live, run npx medusa db:migrate and db:sync-links in the live backend container. Take a pg_dump first.','You','20 min'),
('Check ONEPAY_BASE_URL is set on prod (Koko and Mintpay are unchanged from V1, so nothing to do there).','You','5 min'),
('Set NEXT_PUBLIC_ONEPAY_JS=true on the live storefront (build time) and confirm which callback URL Onepay calls.','You','10 min'),
('Live keeps its own data. Nothing is copied from dev. After the migration, create the V2 content in live Admin: promo bar, hero banners, add-ons, packing options, CARD_5 and Buy 2 Get 1 promotions.','You','30 min'),
('Create orders@, hello@, support@ mailboxes. Set RESEND_API_KEY, RESEND_FROM_EMAIL and SPF, DKIM, DMARC DNS.','You','60 min'),
('Make sure META_TEST_EVENT_CODE is empty on prod and the pixel IDs match. Rotate the Meta access token if the CAPI error log ever ran.','You','15 min'),
('Run the k6 smoke, then load tests on dev off peak, and read the results against the thresholds in qa/load-test.md.','You','2 h'),
('Re-test the fixes on dev after the next deploy (COD over 8,000 blocked, card promo on COD blocked, two parallel card payments).','Claude','30 min'),
('Decide the privacy page and consent banner wording for Meta, Google and CAPI (PDPA).','You','1 h'),
('Run the 15-step smoke test in qa/cutover.md right after go-live, with one small real card payment.','You','30 min'),
('Re-run this QA on live after cutover (read only: pages, tracking events, emails, one real payment, load canary).','Claude + You','half day')]
ck=''.join(f'<li><label><input type="checkbox" id="ck{i}" data-k="{i}"> <span>{e(m)}</span></label><span class="mut"> {o}, {t}</span></li>' for i,(m,o,t) in enumerate(must))
risk=[('Every page is rendered per request and sent no-store, so Cloudflare cannot cache HTML. An ad spike of about 45 pages/s lands on one Next process.','Make pages cacheable (remove headers() from the root layout, add revalidate to category calls), then retest','Claude','1 day'),
('Image optimizer (AVIF) runs on the same VPS with a 60 s cache.','Set images.minimumCacheTTL to a day or more, cache /_next/image in Cloudflare','Claude','1 h'),
('Dev and live share one VPS, Postgres and Redis. Dev load slows live.','Separate Redis now; run heavy dev tests only off peak with the live canary open','You','15 min'),
('Onepay watcher and reconcile are sequential with a 58 s lock; large pending backlog could overlap.','Renew the lock or cap each sweep, add rate limit on /collect','Claude','half day'),
('DB pool has no max set (likely 10) and one process serves API, subscribers and jobs.','Set pool max, consider a worker instance','You + Claude','2 h'),
('Order confirmation email lacks add-ons, packing, COD amount due and delivery window.','Update the template (V2F-02, MAIL-02/03)','Claude','half day'),
('Ops webhook is fire and forget, so a failure drops an order from Ops.','Add retry or a reconcile pass (MAIL-18)','Claude','half day')]
rk=''.join(f'<tr><td>{e(a)}</td><td>{e(b)}</td><td>{c}</td><td>{d}</td></tr>' for a,b,c,d in risk)
pay=[('COD','PASS','PASS','PASS','n/a','PASS','LKR 8,000 cap applies to COD only, now also checked on the backend (needs dev retest)'),
('OnePay','PASS','PASS','PASS','PASS','PASS','525/525 simulated, 105/105 repeat run, 11 real test-card runs pass'),
('Koko','PASS*','PASS*','PASS*','PASS*','PASS*','Code review only. Not configured on dev. Signature check correct'),
('Mintpay','PASS*','PASS*','PASS*','PASS*','PASS*','Code review only. Not configured on dev. Webhook is unverified, safe because authorize polls Mintpay')]
pt=''.join('<tr>'+''.join(f'<td>{e(x)}</td>' for x in r)+'</tr>' for r in pay)
trk=[('PageView','Browser Pixel','Fires, can repeat on colour or sort change (TRK-09)'),('ViewContent','Browser Pixel, GA4','Uses product id, other events use variant id (TRK-08)'),('AddToCart','Browser Pixel, GA4','Missing on product card, quick view and free-third dialog (TRK-06)'),('InitiateCheckout','Browser Pixel, GA4','Marked sent even if fbq is not loaded yet (TRK-04)'),('Purchase','Browser + CAPI','Dedup by order.id on both sides. CAPI fires from order.placed so tab-close orders still count. Browser send can be dropped after the Onepay redirect (TRK-04). GA4 purchase is browser only (TRK-13)')]
tt=''.join(f'<tr><td>{a}</td><td>{b}</td><td>{c}</td></tr>' for a,b,c in trk)
pages=['/lk','/lk/store','/lk/categories/tote-bags','/lk/products/artisan-canvas-tote','/lk/cart','/lk/checkout','/lk/account']
wd=[360,390,768,1024,1440]
rg=''.join('<tr><td>'+p+'</td>'+''.join('<td class="okc">no overflow</td>' for _ in wd)+'</tr>' for p in pages)
doc=f'''<title>Cardle V2 Launch QA</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
:root{{--bg:#f7f1e6;--surface:#fffaf1;--fg:#3a2a1f;--mut:#7a6857;--line:#e4d7c3;--acc:#9c5a2c;--ok:#2f7a4b;--warn:#b7791f;--bad:#b3392f;--okbg:#e0f0e5;--warnbg:#f8ecd2;--badbg:#f6dcd8}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#1d1611;--surface:#271e17;--fg:#efe3d3;--mut:#b09c86;--line:#41342a;--acc:#d9955a;--ok:#6fcb8f;--warn:#e3b04e;--bad:#ef7d72;--okbg:#1d3326;--warnbg:#3a2f17;--badbg:#42221f;color-scheme:dark}}}}
:root[data-theme="dark"]{{--bg:#1d1611;--surface:#271e17;--fg:#efe3d3;--mut:#b09c86;--line:#41342a;--acc:#d9955a;--ok:#6fcb8f;--warn:#e3b04e;--bad:#ef7d72;--okbg:#1d3326;--warnbg:#3a2f17;--badbg:#42221f;color-scheme:dark}}
body{{background:var(--bg);color:var(--fg);font:15px/1.55 "Inter",system-ui,sans-serif;padding-inline:max(16px,env(safe-area-inset-left,0px)) max(16px,env(safe-area-inset-right,0px))}}
*{{box-sizing:border-box}}
.wrap{{max-width:1080px;margin:0 auto;padding-block:0 64px}}
nav{{position:sticky;top:env(safe-area-inset-top,0px);background:var(--bg);border-bottom:1px solid var(--line);display:flex;gap:4px;overflow-x:auto;padding:8px 0;z-index:5}}
body::before{{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);background:var(--bg);z-index:10}}
nav a{{color:var(--mut);text-decoration:none;padding:6px 10px;border-radius:6px;white-space:nowrap;font-size:13px}}nav a:hover{{background:var(--line);color:var(--fg)}}
h1{{font:600 clamp(28px,5vw,44px)/1.1 "Space Grotesk",system-ui,sans-serif;margin:32px 0 8px;text-wrap:balance}}
h2{{font:600 22px "Space Grotesk",system-ui,sans-serif;margin:0 0 14px}}h3{{margin:6px 0 4px;font-size:15px}}
section{{padding:36px 0 8px;border-top:1px solid var(--line);margin-top:28px}}
.mut{{color:var(--mut);font-size:13px;margin:0}}
.verdict{{background:var(--badbg);border:1px solid var(--bad);border-radius:12px;padding:20px;margin:20px 0}}.verdict b.big{{font:700 28px "Space Grotesk",sans-serif;color:var(--bad)}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px}}
.card{{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:14px;min-width:0}}
.pill{{display:inline-block;padding:2px 8px;border-radius:99px;font-size:12px;font-weight:600;background:var(--line)}}
.pill.ok,.pill.minor,.pill.st-fixed{{background:var(--okbg);color:var(--ok)}}.pill.warn,.pill.major,.pill.st-owner{{background:var(--warnbg);color:var(--warn)}}.pill.fail,.pill.blocker,.pill.st-open{{background:var(--badbg);color:var(--bad)}}
.pill.minor{{background:var(--line);color:var(--mut)}}
.tw{{overflow-x:auto;border:1px solid var(--line);border-radius:10px;background:var(--surface)}}
table{{border-collapse:collapse;width:100%;font-size:13.5px}}th,td{{padding:8px 10px;text-align:left;border-bottom:1px solid var(--line);vertical-align:top}}th{{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--mut)}}
.okc{{color:var(--ok)}}
.filters{{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}}select,input[type=search]{{font:inherit;font-size:16px;padding:8px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--fg);min-width:0}}
ul.ck{{list-style:none;padding:0;display:grid;gap:8px}}ul.ck li{{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:10px}}ul.ck input{{margin-right:6px}}
.stats{{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-top:12px}}.stat b{{display:block;font:700 26px "Space Grotesk",sans-serif}}
code{{font-size:12.5px;background:var(--line);padding:1px 5px;border-radius:4px}}
.bar{{display:flex;height:14px;border-radius:7px;overflow:hidden;background:var(--line)}}
@media print{{nav,.filters{{display:none}}body{{background:#fff;color:#000}}section{{break-inside:avoid}}}}
</style>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Space+Grotesk:wght@600;700&display=swap">
<div class="wrap">
<nav><a href="#verdict">Verdict</a><a href="#score">Scorecard</a><a href="#issues">Issues</a><a href="#fixes">Fixes</a><a href="#pay">Payments</a><a href="#resp">Responsive</a><a href="#perf">Perf and SEO</a><a href="#trk">Tracking</a><a href="#load">Load</a><a href="#sec">Security</a><a href="#go">Go-live</a><a href="#risk">Risks</a><a href="#app">Appendix</a></nav>
<header><h1>Cardle V2 launch QA</h1><p class="mut">Target: dev.cardle.lk and api-dev.cardle.lk only. Live and the contabo branch untouched. Fixes are on branch v2-prelaunch-fixes. Report date 27 Nov 2026.</p></header>
<section id="verdict"><div class="verdict"><b class="big">GO for cutover, after the checklist</b><p>The code is ready. The checkout is solid and the security blocker is fixed. What is left is cutover setup on live (config, migrations, mailboxes) plus a re-run of this QA on live afterwards. Dev was missing live configs and credentials, so config findings are treated as cutover tasks, not code bugs. Live data stays as it is: nothing is copied from dev.</p></div>
<div class="stats"><div class="card stat"><b>{tot['blocker']}</b>blockers found</div><div class="card stat"><b>{tot['major']}</b>majors found</div><div class="card stat"><b>{tot['minor']}</b>minors found</div><div class="card stat"><b>{sum(1 for r in rows if r['st']=='fixed')}</b>fixed in code</div><div class="card stat"><b>{openb}</b>blockers still open</div></div>
<p class="mut" style="margin-top:12px">What was and was not checked: nine areas were reviewed from the code (read only). Browser checks on dev covered layout overflow at five widths on seven pages, 404 pages, headers and head tags. Not done: Lighthouse scores, a full screenshot set, live tracking events, and the load tests. The load tests are scripts for you to run. Counts include a few duplicate findings across areas.</p></section>
<section id="score"><h2>Scorecard by area</h2><div class="grid">{score}</div></section>
<section id="issues"><h2>All issues</h2><div class="filters"><select id="fs"><option value="">All severities</option><option>blocker</option><option>major</option><option>minor</option></select><select id="fa"><option value="">All areas</option>{areaopts}</select><select id="ft"><option value="">All status</option><option value="fixed">fixed</option><option value="owner">needs you</option><option value="open">open</option></select><input type="search" id="fq" placeholder="Search"></div><div class="tw"><table id="it"><thead><tr><th>ID</th><th>Area</th><th>Severity</th><th>Issue</th><th>Status</th></tr></thead><tbody>{tr}</tbody></table></div><p class="mut" id="cn"></p></section>
<section id="fixes"><h2>Fixes made</h2><p class="mut">Branch v2-prelaunch-fixes, small commits. These pass the type check. They are not yet re-tested on dev, because the branch is not deployed there.</p><div class="tw"><table><thead><tr><th>Commit</th><th>What changed</th></tr></thead><tbody>{fixrows}</tbody></table></div></section>
<section id="pay"><h2>Payments matrix</h2><div class="tw"><table><thead><tr><th>Method</th><th>Success</th><th>Fail</th><th>Cancel</th><th>Webhook race</th><th>Double submit</th><th>Notes</th></tr></thead><tbody>{pt}</tbody></table></div><p class="mut">* code review only. Onepay results are from today's simulation and real test-card runs (#10 to #21, #20 left for later).</p></section>
<section id="resp"><h2>Responsive</h2><div class="tw"><table><thead><tr><th>Page</th>{''.join(f'<th>{w}px</th>' for w in wd)}</tr></thead><tbody>{rg}</tbody></table></div><p class="mut">Measured in Chrome on dev. A screenshot grid was not captured. Open: tap targets under 44px (menu, cart, qty, slide dots), 14px inputs now 16px on mobile, no empty state for empty categories, duplicate mobile checkout summary.</p></section>
<section id="perf"><h2>Performance and SEO</h2><p class="mut">Lighthouse was not run. Findings are from code and headers.</p><div class="tw"><table><tbody><tr><td>HTML caching</td><td>no-store on every page. Root layout calls headers(), so nothing is static.</td></tr><tr><td>Images</td><td>Hero preloads three crops on every device. CMS banners are raw img tags. Optimizer cache is only 60 s.</td></tr><tr><td>Indexing</td><td>Dev is now noindex. Production canonical and sitemap use cardle.lk.</td></tr><tr><td>Sitemap</td><td>Internal packing product removed. Refund and category pages missing.</td></tr><tr><td>V1 to V2 URLs</td><td>Route tree matches contabo apart from two new API routes, so no V1 URL should 404. Product and collection handles in the live DB still need a check.</td></tr><tr><td>Copy mismatch</td><td>Home meta says free delivery. Policy is LKR 500, 3 to 10 working days.</td></tr></tbody></table></div></section>
<section id="trk"><h2>Tracking events</h2><div class="tw"><table><thead><tr><th>Event</th><th>Where</th><th>Finding</th></tr></thead><tbody>{tt}</tbody></table></div><p class="mut">From code. Not yet confirmed in a browser with the live pixel. CAPI match quality is weak: no user agent, phone hashed without 94.</p></section>
<section id="load"><h2>Load and capacity</h2><p>The scripts are ready in qa/load (k6, with a guard that refuses anything but dev). Nothing was run, so there is no measured breaking point yet. Run order and stop rules are in qa/load/run-guide.md.</p>
<div class="tw"><table><thead><tr><th>Modeled profile (100,000 visitors a day)</th><th>Concurrent</th><th>Pages/s</th><th>Backend req/s</th></tr></thead><tbody><tr><td>Peak hour</td><td>750</td><td>21</td><td>48</td></tr><tr><td>Ad spike</td><td>1,600</td><td>45</td><td>100</td></tr></tbody></table></div>
<p style="margin-top:10px"><b>Max safe concurrent users:</b> not measured. <b>Breaking point:</b> not measured. <b>Does the Contabo VPS handle launch:</b> probably for the modeled spike, but only after pages become cacheable and the image cache is raised. Today every page render and every AVIF image is computed on the VPS, and live shares it with dev.</p></section>
<section id="sec"><h2>Security</h2><div class="tw"><table><thead><tr><th>ID</th><th>Finding</th><th>State</th></tr></thead><tbody>
<tr><td>SEC-01</td><td>Reflected XSS on the payment-return page</td><td>fixed</td></tr>
<tr><td>SEC-02</td><td>Hash input and headers in logs. Request and response bodies with customer details still logged</td><td>partly fixed</td></tr>
<tr><td>SEC-03</td><td>Shared rate-limit bucket</td><td>fixed</td></tr>
<tr><td>SEC-04</td><td>Orders readable by anyone who registers the same email</td><td>fixed</td></tr>
<tr><td>SEC-05</td><td>/webhooks/onepay and /collect are unauthenticated</td><td>open</td></tr>
<tr><td>SEC-06</td><td>No rate limit on login, register, reset, promo</td><td>open</td></tr>
<tr><td>SEC-07</td><td>COD cap and card promo only in storefront</td><td>fixed</td></tr></tbody></table></div><p class="mut">No secrets found in the repo or its history. Cookies are httpOnly, sameSite strict, secure.</p></section>
<section id="go"><h2>Go-live checklist</h2><p class="mut">Ticks are saved in this browser only.</p><ul class="ck">{ck}</ul></section>
<section id="risk"><h2>Risks and recommendations</h2><div class="tw"><table><thead><tr><th>Risk</th><th>Recommendation</th><th>Owner</th><th>Effort</th></tr></thead><tbody>{rk}</tbody></table></div></section>
<section id="app"><h2>Appendix</h2><p class="mut">Full per-area reports are in the repo under qa/ (shopping, v2-features, checkout, emails, responsive, performance-seo, tracking, security, cutover, load-test). Dev test data to clean after QA: orders #514 to #523, their carts, and the test customer accounts. Not deleted yet, needs your OK.</p></section>
</div>
<script>
(function(){{var q=function(i){{return document.getElementById(i)}},rows=document.querySelectorAll('#it tbody tr');
function f(){{var s=q('fs').value,a=q('fa').value,t=q('ft').value,x=q('fq').value.toLowerCase(),n=0;rows.forEach(function(r){{var ok=(!s||r.dataset.s===s)&&(!a||r.dataset.a===a)&&(!t||r.dataset.st===t)&&(!x||r.textContent.toLowerCase().indexOf(x)>-1);r.hidden=!ok;if(ok)n++}});q('cn').textContent=n+' of '+rows.length+' shown'}}
['fs','fa','ft','fq'].forEach(function(i){{q(i).addEventListener('input',f)}});f();
document.querySelectorAll('.ck input').forEach(function(c){{try{{c.checked=localStorage.getItem('cardle-qa-'+c.dataset.k)==='1'}}catch(e){{}}c.addEventListener('change',function(){{try{{localStorage.setItem('cardle-qa-'+c.dataset.k,c.checked?'1':'0')}}catch(e){{}}}})}});}})();
</script>'''
open('/tmp/claude-0/-home-claude/55142965-9067-51c8-a0d2-31432cc0699b/scratchpad/REPORT-fragment.html','w').write(doc)
head='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
open('REPORT.html','w').write(head+doc.replace('<title>','<title>',1).replace('</style>\n<link','</style>\n<link',1)+'</head><body></body></html>' if False else head+'</head><body>'+doc+'</body></html>')
print(len(doc),dict(tot),openb)
