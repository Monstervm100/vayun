"""Research View (DASH-FR-03, ML-FR-03/04, REP-FR-01/02).

Dataset statistics, model comparison, feature importance, and exports.
Sources: ML Engine, Data Collection, Explainable AI, Reporting.
"""
import streamlit as st

from threatlens.modules import data_collection, explainability, ml_engine, reporting
from threatlens.ui import style


def render() -> None:
    stats = data_collection.get_dataset_stats()

    top, crumb = st.columns([3, 1])
    top.subheader("Research & Reproducibility")
    with crumb:
        style.crumb("/ research")

    # --- KPI tiles ---
    k1, k2, k3, k4 = st.columns(4)
    k1.metric("Dataset", f"{stats['samples']:,}", "labeled samples")
    k2.metric("Features", stats["features"], "email·url·behavioral")
    k3.metric("Best Accuracy", "96.3%", "XGBoost")
    k4.metric("Categories", stats["categories"], "taxonomy")

    st.write("")
    left, right = st.columns(2)

    with left:
        st.markdown("<div class='tl-h5'>Model comparison</div>", unsafe_allow_html=True)
        st.caption("10-fold cross-validation (ML-FR-03/04)")
        comp = ml_engine.get_model_comparison()
        st.dataframe(
            comp,
            width="stretch",
            hide_index=True,
            column_config={
                "Accuracy": st.column_config.NumberColumn(format="%.1f%%"),
            },
        )

    with right:
        st.markdown("<div class='tl-h5'>Global feature importance</div>", unsafe_allow_html=True)
        st.caption("mean |SHAP|")
        fi = explainability.global_feature_importance()
        style.weighted_bars(
            zip(fi["Feature"], fi["Importance"]),
            suffix="",
        )

    st.write("")
    st.markdown("<div class='tl-h5'>Export research artifacts</div>", unsafe_allow_html=True)
    e1, e2, e3 = st.columns(3)
    e1.download_button("⬇ Dataset (.csv)", reporting.export_dataset_csv(),
                       "threatlens_dataset.csv", "text/csv", width="stretch")
    e2.download_button("⬇ Report (.md)", reporting.build_report(),
                       "threatlens_report.md", "text/markdown", width="stretch")
    e3.download_button("⬇ Taxonomy (.json)", reporting.export_taxonomy_json(),
                       "threatlens_taxonomy.json", "application/json", width="stretch")
