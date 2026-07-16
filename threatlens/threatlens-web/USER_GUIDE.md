# ThreatLens — User Guide

A friendly, screen-by-screen walkthrough. No coding needed — just click along.
By the end you'll understand every part of the tool well enough to explain it to someone else.

---

## 1. What is ThreatLens?

Most phishing tools only answer **"is this email dangerous — yes or no?"**
ThreatLens goes further and answers **why**:

- Why is this email malicious?
- Which clues gave it away?
- What trick was the attacker using?
- How can a person spot the same attack next time?

Think of it as a **miniature cyber-security lab** that collects real phishing scams,
analyses them, explains its decisions in plain language, and teaches you along the way.

---

## 2. How to open it

1. Make sure the app is running. In **PowerShell**, run:
   ```powershell
   python "C:\Users\bhans\OneDrive\Documents\threat analysis\threatlens-web\server.py"
   ```
   (Keep that window open — closing it stops the app.)
2. Open your browser and go to:  **http://localhost:8000**

> 💡 It also works by double-clicking `index.html`, but running `server.py` is better
> because it unlocks the **live internet features** (pulling real phishing scams and news).

**The screen has two parts:**
- **Left sidebar** — the menu (Campaigns, Email Analysis, Live Scams, Research, Test Runner) plus buttons for the threat feed, theme, and resetting data.
- **Main area** — whatever screen you picked.

> 🎨 **Tip:** the `◐ Theme` button switches light/dark. `↺ Reset DB` wipes everything back to the starting sample data if you ever want a clean slate.

---

## 3. Campaigns  🗂️

**What it's for:** the big-picture dashboard — what's happening across all the scams in the system.

What you'll see:
- **KPI tiles** at the top — total samples, number of campaigns, the most common technique, and how many are legitimate.
- **Attack trend** chart — how many scams arrived over time.
- **Common techniques** — a ranked bar chart of scam types.
- **Campaign timeline** — a table where related scams are grouped into "campaigns" because they share a clue (like the same web domain). Under it is a **legend** explaining the short codes (CRED, BEC, FIN, LOGIN, MALWARE).

> ✅ **Try this:** hover over a code like **CRED** in the Type column — a tooltip shows its full name (Credential Theft).

**Talking point:** a *campaign* is when many emails come from the same attacker operation. ThreatLens spots this by finding a **shared IOC** (Indicator of Compromise) — for example the same domain appearing in lots of emails.

---

## 4. Email Analysis  🔍 (the heart of the tool)

**What it's for:** analyse one email and understand the verdict.

**Steps:**
1. **Pick a sample** from the dropdown. Its **subject and body appear in a preview box** right below, so you can read the actual email.
2. *(Optional)* paste your own email text, or upload a `.eml`/`.txt` file.
3. Click **Analyze ▸**.

**What you get:**
- **Verdict card** — Phishing or Not phishing, with a confidence % (the coloured dial).
- **Why? — explanation** — the clues that drove the decision, each with a weight that adds up to 100%. *Hover any clue* (they have a dotted underline) to read what it means.
- **Manipulation techniques** — which psychological tricks were used (fear, urgency, authority, curiosity, reward).
- **Indicators (IOCs)** — the technical evidence: sender, domain, URL, SPF result, brand being impersonated.
- **Understanding this verdict** — a plain-English panel answering the four big questions (why malicious, which indicators, what techniques, how to recognise it).

> ✅ **Try this — see a scam get caught:** pick the "account will be suspended within 24 hours" sample → Analyze → notice **Urgency language** and **Suspicious URL behavior** in the explanation.
>
> ✅ **Try this — see a false-alarm avoided:** pick the "Meeting notes" or Amazon order sample → Analyze → it says **Not phishing**. A good detector must *not* flag safe emails.
>
> ✅ **Try this — a negative test by hand:** upload a made-up `.exe` file → it's **rejected** for safety.

**Talking point:** the explanation uses a method called **SHAP (SHapley Additive exPlanations)** — it fairly divides the "credit" for a decision across all the clues, so you can see *which* clue mattered and by how much.

---

## 5. Live Scams  🌐

**What it's for:** see and refresh **real** phishing scams pulled from the internet.

What you'll see:
- **Where this data comes from** — the sources (OpenPhish and URLhaus), so it's clear and copyright-safe.
- **⟳ Pull latest phishing scams** — fetches fresh, real phishing URLs live.
- **Pull history** — a dated log ("11 Jul — 4 scams"), so you can see the database growing over time.
- **Scam samples** table — every scam, with an **Analyze →** button that jumps straight to Email Analysis for that item.

> ✅ **Try this:** click **⟳ Pull latest phishing scams**, watch the history add a new dated row, then click **Analyze →** on any scam to see it explained.

**Talking point:** these are genuine phishing URLs reported by threat-intelligence feeds. Being on such a feed is itself a strong danger sign — ThreatLens shows this as the **"Threat-feed reputation"** factor.

> ℹ️ The live pull needs the app started with `server.py`. Offline, it falls back to a built-in simulator so it still works.

---

## 6. Research  📊 (three tabs)

Click **Research**, then switch between the three tabs at the top.

### Tab 1 — Model Metrics
- **How to read this tab** card explains everything in plain English.
- **Model comparison** — four detectors graded like students on a test. **Accuracy** = overall correctness, **Precision** = how often "phishing" is right (few false alarms), **Recall** = how much real phishing it caught (few misses).
- **Global feature importance** — which clues matter most overall (longer bar = more important).
- **Export** buttons — download the dataset (CSV), a report (MD), or the taxonomy (JSON).

### Tab 2 — Knowledge Base
Plain-language answers to the core questions (how phishing is made, how it evolves, how attackers manipulate people, which methods dominate, how ML detects threats, why systems decide as they do, how generative AI changed phishing), plus:
- **Sources & attribution** — links to trusted organisations (APWG, Verizon DBIR, FBI IC3, CISA…).
- **Glossary** — every acronym explained (CTI, IOC, SHAP, SPF, DKIM, MFA, BEC, CRED, FIN, LOGIN, MALWARE).
- **🌐 Scan the internet** — pulls the latest security-news headlines and appends them with a timestamp; each links back to its source.

> ✅ **Try this:** click **🌐 Scan the internet for latest intelligence** → new dated headlines appear.

### Tab 3 — Awareness & Safety
- **Who is targeted, and how** — a table of scams by age group (teens → seniors).
- **Be careful — protect yourself** — a practical checklist anyone can follow.

> ✅ **Try this:** read the checklist — these are the exact habits that stop most real scams.

---

## 7. Test Runner  ✅

**What it's for:** prove the tool actually works.

It runs **20 automatic checks** and shows ✓ PASS or ✗ FAIL for each:
- **Positive (POS)** — does it do the right thing on normal input? (e.g. correctly flags a phishing email)
- **Negative (NEG)** — does it stay safe on bad input? (e.g. rejects a huge file, doesn't wrongly flag a safe email)

Each row lists the **requirement ID** it verifies. All green = the app meets its written spec.

> ✅ **Try this:** open the tab (it runs automatically), then filter by **Positive** / **Negative**. Click **Run all tests** to re-run — useful after pulling new scams to confirm nothing broke (this is called *regression testing*).

**Talking point:** this is your *evidence*. Instead of *saying* "it works," you can *show* 20/20 passing, each traceable to a requirement.

---

## 8. A 5-minute tour (do these in order)

1. **Campaigns** — glance at the KPI tiles and the campaign table.
2. **Email Analysis** — analyse the "24 hours" sample; hover the explanation clues.
3. **Email Analysis** — analyse the "Meeting notes" sample; confirm **Not phishing**.
4. **Live Scams** — pull the feed; Analyze → one real scam.
5. **Research → Knowledge Base** — scan the internet; read the Glossary.
6. **Research → Awareness** — read the safety checklist.
7. **Test Runner** — confirm **20/20 passed**.

You've now used every feature. 🎉

---

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| Page won't open | Make sure `server.py` is running; use **http://localhost:8000** |
| "Pull feed" or "Scan internet" fails | You opened the file directly — start it with `server.py` for internet features |
| Something looks stale after an update | Refresh the page (the app uses cache-busting, but a hard refresh helps) |
| Want to start over | Sidebar → **↺ Reset DB** |

---

## 10. Where to go deeper

- **[README.md](README.md)** — developer-style reference (folder structure, architecture, the GitHub Action).
- **Project documents** (in the folder above this one): the SRD (requirements), SDD (design), and Test Cases — good for a report or presentation.
- **The code** — each file in `js/modules/` is one capability, with a comment at the top saying which requirement it implements.
