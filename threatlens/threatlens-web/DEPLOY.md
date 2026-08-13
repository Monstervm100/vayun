# Deploying ThreatLens on Vercel

The web app is a static site **plus** Python serverless functions (in `api/`) that
power the live phishing feed, the research news scan, and the visitor counter.
Everything uses only the Python standard library — no dependencies to install.

## 1. Import the project
1. Go to https://vercel.com and sign in with GitHub.
2. **Add New… → Project** → import the `vayun` repository.
3. **Root Directory:** click *Edit* and choose **`threatlens/threatlens-web`**.
4. **Framework Preset:** *Other*. Leave Build Command empty; Output Directory default.
5. **Deploy.** You'll get a public URL like `https://vayun-xxxx.vercel.app`.

Vercel automatically serves the static files and turns each file in `api/` into an
endpoint: `/api/feed`, `/api/research`, `/api/hit`, `/api/stats`.

## 2. Turn on the visitor counter (optional)
The counter needs a tiny key-value store (Vercel KV / Upstash Redis):
1. In the project → **Storage → Create Database → KV** (Upstash Redis) → connect it
   to this project. Vercel injects `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
2. **Redeploy** (Deployments → ⋯ → Redeploy). The sidebar counter now shows
   "👥 N people · M visits".

Without KV, `/api/hit` returns 503 and the counter simply stays hidden — nothing breaks.

## What it stores (privacy)
- `threatlens:total` — an integer of total page opens.
- `threatlens:visitors` — a Redis SET of anonymous, browser-generated ids.
No IP addresses, no cookies, no personal data.
