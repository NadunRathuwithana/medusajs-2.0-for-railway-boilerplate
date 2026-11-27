# Cardle V2 load test: run guide (owner, Windows PC)

Nothing here is run from the QA workspace or the VPS. You run it from your own PC, off-peak
(suggested: 02:00 to 05:00 Sri Lanka time).

**Read this first.** Dev and live share ONE Contabo VPS, ONE Postgres container and ONE Redis.
A heavy dev test uses live's CPU, RAM, DB connections and disk. Always run the live watcher
(step 4) in a second window, and stop at the first sign of trouble.

The scripts refuse to run if `STORE_URL` or `API_URL` contains `cardle.lk` without `dev.`.

## 1. Install k6 (Windows)

```powershell
winget install k6 --source winget
# or: choco install k6
k6 version
```
Close and reopen PowerShell after installing. Keep the PC on mains power and stop it sleeping:
`powercfg /change standby-timeout-ac 0`. Use a wired connection if you can. 500+ VUs also
need a decent upstream link; if your PC CPU hits 80%+ the results are your PC, not the server.

## 2. Set the environment (every new PowerShell window)

```powershell
cd <path to repo>\medusajs-2.0-for-railway-boilerplate
$env:STORE_URL = "https://dev.cardle.lk"
$env:API_URL   = "https://api-dev.cardle.lk"
$env:MEDUSA_PK = "<dev publishable key from Medusa admin, Settings > Publishable API keys>"
$env:BASIC_AUTH_USER = "<dev basic auth user>"
$env:BASIC_AUTH_PASS = Read-Host "Dev basic auth password"
$env:RUN_ID = "run-" + (Get-Date -Format "yyyyMMdd-HHmm")
New-Item -ItemType Directory -Force qa\load\results | Out-Null
```
Never paste these into chat or commit them. k6 reads them from the environment.

## 3. Before you start (checklist)

1. Confirm the publishable key is the DEV one and that `https://api-dev.cardle.lk/health` answers in a browser.
2. On dev, confirm `META_CONVERSIONS_API_ACCESS_TOKEN` is unset or `META_TEST_EVENT_CODE` is set, and
   `CARDLE_OPS_WEBHOOK_URL` is unset or points at a test sink. COD test orders fire the `order.placed`
   subscribers (Meta Purchase event, Cardle Ops webhook). Do not let QA orders reach real Meta or Cardle Ops.
3. Confirm dev Onepay is not in a mode that charges real cards (the webhook test only sends fake ids).
4. Tell anyone else using dev. Make sure no real customer test is running.
5. Check Redis: dev and live must use different Redis DB indexes or prefixes (see load-test.md, risk 4).
   `docker exec <redis> redis-cli -n 0 DBSIZE` vs `-n 1`. If both apps use the same index, STOP and do not run
   checkout, cart or webhook tests.

## 4. Live watcher (second PowerShell window, start 2 minutes before k6)

```powershell
powershell -ExecutionPolicy Bypass -File qa\load\live-watch.ps1
```
It hits live home + `/health` once every 10 s (1 request, not a load). Note the normal ms during the
baseline. **Stop k6 (Ctrl+C in its window) if** live latency is 2x its baseline for 3 readings, any
non-200 appears, or the line turns red.

## 5. Server-side watching (SSH to the VPS, a third window)

```bash
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"   # repeat every 10-15s
watch -n 5 'docker stats --no-stream'
uptime; free -m; df -h /
# Postgres connections, split by database (cardle_v2 = dev, railway = live):
docker exec -it <postgres-container> psql -U postgres -c "SELECT datname, state, count(*) FROM pg_stat_activity GROUP BY 1,2 ORDER BY 3 DESC;"
docker exec -it <postgres-container> psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
docker exec -it <postgres-container> psql -U postgres -c "SHOW max_connections;"
# slow / waiting queries:
docker exec -it <postgres-container> psql -U postgres -c "SELECT pid, datname, now()-query_start AS age, wait_event_type, left(query,80) FROM pg_stat_activity WHERE state<>'idle' ORDER BY age DESC LIMIT 10;"
# Redis:
docker exec -it <redis-container> redis-cli INFO memory | grep used_memory_human
docker exec -it <redis-container> redis-cli INFO stats | grep -E "instantaneous_ops|rejected"
```
Also open Coolify's server metrics (CPU, RAM, disk IO) and the `storefront`/`backend` app logs.
Watch for: `count(*) FROM pg_stat_activity` approaching `max_connections` (or backend pool exhaustion
errors, "Knex: Timeout acquiring a connection"), load average above the core count, swap in use,
`backend` restarts (OOM), `[rate-limit]` Redis errors.

## 6. Order of tests

Always smoke before anything else. Do not run the next step unless the previous one was clean
and live stayed flat.

| Step | Script | Type | Notes |
|---|---|---|---|
| 1 | browse.js | smoke | 1 minute |
| 2 | cms.js | smoke | |
| 3 | cart.js | smoke | creates carts only |
| 4 | webhooks.js | smoke | fake payloads only |
| 5 | checkout-cod.js | smoke | creates REAL dev orders (a few) |
| 6 | browse.js | load | 17 min, up to 500 VUs |
| 7 | cms.js | load | |
| 8 | cart.js | load | default SCALE 0.2 (100 VUs) |
| 9 | browse.js | spike | 50 -> 2000 -> 50 |
| 10 | browse.js | soak | 70 min, 100 VUs, run on its own night |
| 11 | browse.js | stress | ONLY with your explicit decision, see below |

`checkout-cod.js` defaults to SCALE 0.02 (10 VUs at `load`) because every iteration creates a REAL dev order.
`webhooks.js` also defaults to SCALE 0.02: `/collect` calls the real Onepay status API.
Do not run `checkout-cod.js` load/stress/soak. A smoke or a short `load` with `-e SCALE=0.02` is enough.

## 7. Exact commands

Replace `<name>` with the script. `--summary-export` writes the JSON you send back.

```powershell
# SMOKE (1-5 VUs, 1 min)
k6 run -e TEST_TYPE=smoke --summary-export=qa\load\results\browse-smoke.json qa\load\browse.js
k6 run -e TEST_TYPE=smoke --summary-export=qa\load\results\cms-smoke.json qa\load\cms.js
k6 run -e TEST_TYPE=smoke --summary-export=qa\load\results\cart-smoke.json qa\load\cart.js
k6 run -e TEST_TYPE=smoke --summary-export=qa\load\results\webhooks-smoke.json qa\load\webhooks.js
k6 run -e TEST_TYPE=smoke --summary-export=qa\load\results\checkout-smoke.json qa\load\checkout-cod.js

# LOAD (ramp to 500 VUs, hold 10 min)
k6 run -e TEST_TYPE=load --summary-export=qa\load\results\browse-load.json qa\load\browse.js
k6 run -e TEST_TYPE=load --summary-export=qa\load\results\cms-load.json qa\load\cms.js
k6 run -e TEST_TYPE=load --summary-export=qa\load\results\cart-load.json qa\load\cart.js
# lighter first pass if you are nervous: add  -e SCALE=0.2  (100 VUs)

# SPIKE (50 -> 2000 -> 50)
k6 run -e TEST_TYPE=spike --summary-export=qa\load\results\browse-spike.json qa\load\browse.js
# start with -e SCALE=0.25 (50 -> 500 -> 12) before the full one

# SOAK (100 VUs, 60 min)
k6 run -e TEST_TYPE=soak --summary-export=qa\load\results\browse-soak.json qa\load\browse.js

# STRESS (500 / 1000 / 2500 / 5000). Loud warning is printed. 
# Up to 1000 VUs:
k6 run -e TEST_TYPE=stress -e SCALE=0.2 --summary-export=qa\load\results\browse-stress-1000.json qa\load\browse.js
# Above 1000 needs you to confirm explicitly:
$env:CONFIRM_OVER_1000 = "YES"
k6 run -e TEST_TYPE=stress --summary-export=qa\load\results\browse-stress-full.json qa\load\browse.js
```
Stress above 1000 VUs from one home PC is unrealistic (your CPU, uplink and Cloudflare will fail first,
and Cloudflare may rate-limit or block your IP for the whole `cardle.lk` zone, live included).
Recommended: do not run it until dev has its own server, or until you can generate load from a
separate cloud box. Never above 1000 while dev shares the VPS with live.

Useful extras: `-e THINK_MIN=0.5 -e THINK_MAX=1.5` (more aggressive users), `-e COLLECT=0` (skip /collect in webhooks.js),
`-e DOUBLE_SUBMIT=0` (single complete in checkout-cod.js), `-e ORDER_PACE_S=10`.

## 8. When to stop (Ctrl+C)

Stop immediately if any of these happen:
- live watcher: latency 2x baseline for 3 readings, any non-200, or a red line;
- `docker stats` shows backend or postgres at sustained 90%+ CPU of the whole VPS, or memory near the limit or swapping;
- `pg_stat_activity` count above ~80% of `max_connections`;
- k6 error rate above 5% for 2 minutes (k6 also aborts itself at 10% after 1 minute);
- any container restarts;
- your PC is above 80% CPU (results are then invalid).

After a stop, wait 10 minutes and confirm live is back to its baseline before doing anything else.

## 9. What to read in the k6 output

- `http_req_duration{kind:page}` p(95) below 800 ms (cached pages), `{kind:api}` p(95) below 2000 ms.
- `http_req_failed` below 1%.
- `rate_limited_429`: how many requests the rate limiter refused. A high number on browse/cms is a finding.
- `duplicate_orders` must be 0 (checkout). `orders_created`, `checkout_success`.
- Per-step breakdown is in the `name:` tags (`--out json=...` if you want raw points).

## 10. Share the results

Send me the `qa\load\results\*.json` files, plus: the time window you ran, your PC specs and connection,
the baseline and peak of the live watcher, and a screenshot of Coolify CPU/RAM and the
`pg_stat_activity` counts during the peak. Do not send anything containing the keys or passwords.
Results go into the tables in `qa/load-test.md` ("pending owner run").

## 11. Cleanup of QA orders and carts (DEV ONLY)

Everything created by `checkout-cod.js` has `metadata.qa_load = true`, email `qa-load+<n>@cardle.lk`,
and `metadata.qa_run = <RUN_ID>`. Carts from `cart.js` have the same metadata.

Run against the **dev** database `cardle_v2` only. Double-check the database name.

```bash
# 1. look first
docker exec -it <postgres-container> psql -U postgres -d cardle_v2 -c \
 "SELECT count(*) FROM \"order\" WHERE metadata->>'qa_load'='true';"
docker exec -it <postgres-container> psql -U postgres -d cardle_v2 -c \
 "SELECT count(*) FROM cart WHERE metadata->>'qa_load'='true' AND completed_at IS NULL;"

# 2. cancel the orders properly (releases reserved stock): in Medusa admin on DEV, filter orders by
#    email "qa-load+" and cancel them. Or via API with an admin token:
#    POST https://api-dev.cardle.lk/admin/orders/<order_id>/cancel
docker exec -it <postgres-container> psql -U postgres -d cardle_v2 -At -c \
 "SELECT id FROM \"order\" WHERE metadata->>'qa_load'='true' AND canceled_at IS NULL;"

# 3. abandoned QA carts: soft delete
docker exec -it <postgres-container> psql -U postgres -d cardle_v2 -c \
 "UPDATE cart SET deleted_at = now() WHERE metadata->>'qa_load'='true' AND completed_at IS NULL AND deleted_at IS NULL;"

# 4. (optional, after cancelling) hide the cancelled QA orders from dev reports
docker exec -it <postgres-container> psql -U postgres -d cardle_v2 -c \
 "UPDATE \"order\" SET deleted_at = now() WHERE metadata->>'qa_load'='true' AND canceled_at IS NOT NULL AND deleted_at IS NULL;"
```
Also check on dev: the stock levels of the products used (cancelling restores reservations),
and clear any fake Redis noise from `webhooks.js`: `redis-cli --scan --pattern 'onepay:attempt:QA_FAKE*'`
should return nothing (if it does, report it, do not delete blindly).
