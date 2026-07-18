"""Campaign View (DASH-FR-01).

Attack trends, common techniques, and a campaign timeline.
Sources: Threat Intelligence Engine, Taxonomy, Data Collection.
"""
import streamlit as st

from threatlens.modules import data_collection, taxonomy, threat_intel
from threatlens.ui import style


def render() -> None:
    stats = data_collection.get_dataset_stats()

    col_t, col_c = st.columns([3, 1])
    with col_t:
        st.subheader("Campaign Overview")
    with col_c:
        style.crumb("/ campaigns")

    # --- KPI tiles ---
    k1, k2, k3, k4 = st.columns(4)
    k1.metric("Samples", f"{stats['samples']:,}", "+6.2% wk")
    k2.metric("Campaigns", stats["campaigns"], "+3 new")
    k3.metric("Top Technique", "Credential Theft", "41% of set")
    k4.metric("AI-Generated", f"{stats['ai_generated_pct']}%", "rising")

    st.write("")
    left, right = st.columns([1.5, 1])

    with left:
        st.markdown("<div class='tl-h5'>Attack trend — volume over time</div>", unsafe_allow_html=True)
        st.line_chart(threat_intel.get_trend(), height=220, color="#0e7c86")

    with right:
        st.markdown("<div class='tl-h5'>Common techniques</div>", unsafe_allow_html=True)
        dist = taxonomy.get_distribution()
        style.weighted_bars(dist.items())

    st.write("")
    st.markdown("<div class='tl-h5'>Campaign timeline</div>", unsafe_allow_html=True)
    st.caption("Correlated by shared IOC / infrastructure (TI-FR-04)")
    st.dataframe(
        threat_intel.get_campaigns(),
        width="stretch",
        hide_index=True,
    )
