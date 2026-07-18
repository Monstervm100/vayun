# Get a Free Public URL (Vercel) — Step by Step

Time needed: ~10 minutes. Cost: $0 (Vercel Hobby tier, no credit card).
Result: a link like `https://chessmaster-academy.vercel.app` anyone can open.

The git repository is already prepared (committed, with the right ignore rules).

## Step 1 — Put the code on GitHub

1. Create a free account at https://github.com/signup (skip if you have one)
2. Go to https://github.com/new
   - Repository name: `chessmaster-academy`
   - Visibility: **Private** is fine (Vercel can deploy private repos)
   - Do NOT tick "Add a README" — the project already has one
   - Click **Create repository**
3. GitHub shows you commands for "push an existing repository". In PowerShell:

```powershell
cd "C:\Users\bhans\OneDrive\Documents\vayun bhansali chess academy"
git remote add origin https://github.com/YOUR-USERNAME/chessmaster-academy.git
git push -u origin master
```

(A window pops up asking you to sign in to GitHub the first time.)

## Step 2 — Deploy on Vercel

1. Create a free account at https://vercel.com/signup → choose **"Continue with GitHub"**
2. Click **Add New… → Project**
3. Pick `chessmaster-academy` from the list → **Import**
4. ⚠️ ONE IMPORTANT SETTING — **Root Directory**: click **Edit** and select `frontend`
   (the repo contains backend + docs too; Vercel should build only the frontend)
5. Leave everything else as detected (Framework: Next.js) → click **Deploy**
6. Wait ~2 minutes → you get your public URL 🎉

Share that URL with anyone. Each visitor automatically gets their own saved
progress in their own browser and can continue any day right where they left off.

## Step 3 (optional, 3 min) — Make the visit counter permanent

On Vercel's serverless platform, the tracker needs a tiny free database:

1. In your Vercel project: **Storage** tab → **Create Database** → choose
   **Upstash (Redis)** from the marketplace → free plan → link it to the project
2. Vercel automatically adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`
   environment variables — the app detects them and switches storage automatically
3. **Deployments** tab → ⋯ menu on the latest deployment → **Redeploy**

Skip this step and everything still works — only the Admin visit counter
resets between deployments.

## Updating the live site later

After any code change:

```powershell
cd "C:\Users\bhans\OneDrive\Documents\vayun bhansali chess academy"
git add -A
git commit -m "describe your change"
git push
```

Vercel redeploys automatically on every push — live in ~2 minutes.

## Notes

- **Progress & "continue where you left off"**: works out of the box — progress
  lives in each visitor's browser (localStorage) and survives closing the tab,
  rebooting, and coming back weeks later. It is per-browser: the same child on
  a different device starts fresh (cross-device accounts are the backend's job,
  a later milestone).
- **The Python backend** (accounts, cloud sync, family links) is NOT part of this
  deploy — the app runs fully in guest mode without it. When you want accounts,
  it can be hosted free on Render/Railway and connected via `NEXT_PUBLIC_API_URL`.
- **Free-tier limits**: Vercel Hobby is generous (100 GB bandwidth/month) —
  plenty for a school club. Stockfish runs in each visitor's browser, so heavy
  use costs the server almost nothing.
