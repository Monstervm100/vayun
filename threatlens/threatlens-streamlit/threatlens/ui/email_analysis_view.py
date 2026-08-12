"""Email Analysis View (DASH-FR-02, XAI-FR-01/03).

Prediction, weighted explanation, indicators, and manipulation techniques.
Sources: ML Engine, Explainable AI, Human Manipulation, Threat Intelligence.
"""
import streamlit as st

from threatlens.modules import (
    data_collection,
    explainability,
    human_manipulation,
    ml_engine,
    threat_intel,
)
from threatlens.ui import style


def render() -> None:
    df = data_collection.load_sample_dataset()

    top, crumb = st.columns([3, 1])
    top.subheader("Email Analysis")
    with crumb:
        style.crumb("/ analyze")

    # --- sample input ---
    with st.container():
        c1, c2 = st.columns([3, 1])
        with c1:
            if not df.empty:
                labels = [f"#{r.id} — {r.subject}" for r in df.itertuples()]
                idx = st.selectbox("Select a sample", range(len(labels)),
                                   format_func=lambda i: labels[i])
                sample = df.iloc[idx].to_dict()
            else:
                sample = {}
            st.file_uploader("…or upload an .eml file", type=["eml", "txt"],
                             help="Processed locally — never uploaded to a server.")
        with c2:
            st.write("")
            st.write("")
            analyze = st.button("Analyze ▸", type="primary", width="stretch")

    if not (analyze or not df.empty):
        st.info("Select a sample and click Analyze.")
        return

    # --- verdict ---
    pred = ml_engine.predict(sample)
    st.write("")
    style.verdict_card(
        pred["prediction"],
        pred["confidence"],
        f"High confidence · model: {pred['model']} · {pred['model_agreement']}",
    )

    st.write("")
    left, right = st.columns([1.4, 1])

    with left:
        st.markdown("<div class='tl-h5'>Why? — explanation (SHAP)</div>", unsafe_allow_html=True)
        style.weighted_bars(explainability.explain(sample))
        st.write("")
        st.markdown("<div class='tl-h5'>Manipulation techniques</div>", unsafe_allow_html=True)
        style.chips(human_manipulation.analyze(sample))

    with right:
        st.markdown("<div class='tl-h5'>Indicators (IOCs)</div>", unsafe_allow_html=True)
        style.ioc_list(threat_intel.extract_iocs(sample))
        st.caption("Linked to CMP-0041 — shares domain with 311 other samples.")
