"""Shared styling and small HTML render helpers for the ThreatLens UI.

The base palette comes from .streamlit/config.toml; this adds the console-style
touches (mono labels, chips, verdict card, weighted bars) that Streamlit widgets
don't cover natively.
"""
import streamlit as st

_CSS = """
<style>
  :root { --tl-accent:#0e7c86; --tl-crit:#c4402f; --tl-warn:#a9770a; --tl-safe:#2c7a53; }
  .tl-tag { font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
            font-size: 11px; letter-spacing:.06em; color:#6f7f86; text-transform:uppercase; }
  .tl-crumb { font-family: ui-monospace, Consolas, monospace; font-size:11px; color:#8a97a0; letter-spacing:.05em; }
  .tl-panel { border:1px solid rgba(120,140,150,.28); border-radius:10px; padding:14px 16px; }
  .tl-h5 { font-size:13.5px; font-weight:650; margin:0 0 10px; }

  /* weighted / SHAP-style bars */
  .tl-bar { display:grid; grid-template-columns:150px 1fr 46px; align-items:center; gap:10px; margin:7px 0; font-size:13px; }
  .tl-bar .n { color:#5a6a72; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .tl-track { height:9px; background:rgba(120,140,150,.20); border-radius:20px; overflow:hidden; }
  .tl-fill { height:100%; background:var(--tl-accent); border-radius:20px; }
  .tl-bar .v { text-align:right; font-family:ui-monospace,Consolas,monospace; font-size:11.5px; color:#5a6a72; }

  /* chips */
  .tl-chips { display:flex; flex-wrap:wrap; gap:7px; }
  .tl-chip { font-family:ui-monospace,Consolas,monospace; font-size:11px; padding:4px 11px; border-radius:20px;
             background:#f9efd8; color:#a9770a; border:1px solid rgba(169,119,10,.35); }
  .tl-chip.off { background:rgba(120,140,150,.12); color:#8a97a0; border-color:rgba(120,140,150,.25); }

  /* verdict card */
  .tl-verdict { display:flex; align-items:center; gap:16px; border-radius:10px; padding:16px 18px;
                border:1px solid var(--tl-crit); background:#fbe6e2; }
  .tl-gauge { width:60px; height:60px; border-radius:50%; flex:none; display:grid; place-items:center; }
  .tl-gauge > span { width:46px; height:46px; border-radius:50%; background:#fff; display:grid; place-items:center;
                     font-weight:700; font-size:14px; }
  .tl-verdict .vl { font-family:ui-monospace,Consolas,monospace; font-size:11px; letter-spacing:.09em;
                    text-transform:uppercase; color:var(--tl-crit); }
  .tl-verdict .vv { font-size:21px; font-weight:700; line-height:1.15; }
  .tl-verdict .vs { font-size:12.5px; color:#5a6a72; }

  /* IOC list */
  .tl-ioc { font-family:ui-monospace,Consolas,monospace; font-size:12px; }
  .tl-ioc div { display:flex; gap:10px; margin:6px 0; }
  .tl-ioc .t { color:#8a97a0; width:66px; flex:none; }
  .tl-fail { color:var(--tl-crit); font-weight:600; }
</style>
"""


def inject_css() -> None:
    st.markdown(_CSS, unsafe_allow_html=True)


def crumb(text: str) -> None:
    st.markdown(f"<span class='tl-crumb'>{text}</span>", unsafe_allow_html=True)


def weighted_bars(rows, suffix: str = "%") -> None:
    """rows: iterable of (label, value). Bars scale to the max value."""
    rows = list(rows)
    hi = max((v for _, v in rows), default=1) or 1
    html = ["<div>"]
    for label, val in rows:
        pct = round(100 * val / hi)
        html.append(
            f"<div class='tl-bar'><span class='n'>{label}</span>"
            f"<span class='tl-track'><span class='tl-fill' style='width:{pct}%'></span></span>"
            f"<span class='v'>{val}{suffix}</span></div>"
        )
    html.append("</div>")
    st.markdown("".join(html), unsafe_allow_html=True)


def chips(states: dict) -> None:
    """states: {label: bool}. True = active/detected."""
    parts = ["<div class='tl-chips'>"]
    for label, on in states.items():
        cls = "tl-chip" if on else "tl-chip off"
        parts.append(f"<span class='{cls}'>{label}</span>")
    parts.append("</div>")
    st.markdown("".join(parts), unsafe_allow_html=True)


def verdict_card(prediction: str, confidence: float, subtitle: str) -> None:
    pct = round(confidence * 100)
    gauge = (
        f"background:conic-gradient(var(--tl-crit) 0 {pct}%,"
        f"rgba(120,140,150,.25) {pct}% 100%);"
    )
    st.markdown(
        f"<div class='tl-verdict'>"
        f"<div class='tl-gauge' style='{gauge}'><span>{pct}%</span></div>"
        f"<div><div class='vl'>Prediction</div>"
        f"<div class='vv'>{prediction}</div>"
        f"<div class='vs'>{subtitle}</div></div></div>",
        unsafe_allow_html=True,
    )


def ioc_list(iocs: dict) -> None:
    rows = ["<div class='tl-ioc'>"]
    for k, v in iocs.items():
        cls = "tl-fail" if str(v).lower() == "fail" else ""
        rows.append(f"<div><span class='t'>{k.upper()}</span><span class='{cls}'>{v}</span></div>")
    rows.append("</div>")
    st.markdown("".join(rows), unsafe_allow_html=True)
