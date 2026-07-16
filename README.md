# Vayun 🚀

Projects built for **Vayun Bro** — created by **Mithil Bhansali**.

| Project | What it is |
|---|---|
| [reasoninglab/](reasoninglab/) | 🧠 **ReasoningLab** — AI-powered adaptive math-reasoning trainer for Grade 5–6 Math Kangaroo prep. React + TypeScript + Tailwind client, Express + Claude tutor server. |

## Deploying ReasoningLab on Vercel

The client is a self-contained SPA (all progress stored in the browser; the AI tutor gracefully falls back to a built-in Socratic coach when the API is absent), so it deploys as a static Vite site:

1. Import this repo on [vercel.com/new](https://vercel.com/new)
2. Set **Root Directory** to `reasoninglab/client`
3. Framework preset: **Vite** (build `npm run build`, output `dist`) — auto-detected
4. Deploy 🎉

See [reasoninglab/README.md](reasoninglab/README.md) for full docs and local development.
