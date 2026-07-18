"""ThreatLens — application entry point.

Run locally with:  streamlit run app.py

Local-first, zero recurring cost. A persistent left rail switches between the
three views specified in the SRD (DASH-FR-01/02/03).
"""
import streamlit as st

from threatlens.db import init_db
from threatlens.ui import style, campaign_view, email_analysis_view, research_view

VIEWS = {
    "Campaigns": campaign_view,
    "Email Analysis": email_analysis_view,
    "Research": research_view,
}


def main() -> None:
    st.set_page_config(
        page_title="ThreatLens — CTI Research Console",
        page_icon="🛡️",
        layout="wide",
        initial_sidebar_state="expanded",
    )
    init_db()
    style.inject_css()

    with st.sidebar:
        st.markdown("## ◈ ThreatLens")
        st.markdown(
            "<div class='tl-tag'>CTI Research Console</div>",
            unsafe_allow_html=True,
        )
        st.write("")
        choice = st.radio(
            "Navigation",
            list(VIEWS.keys()),
            label_visibility="collapsed",
        )
        st.divider()
        st.caption("Version 1 · Phishing Intelligence")
        st.caption("Local-first · $0 recurring cost")

    VIEWS[choice].render()


if __name__ == "__main__":
    main()
