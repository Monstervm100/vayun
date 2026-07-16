/* Reporting & Dataset Export (REP-FR-01/02/03).
   Builds shareable artifacts and triggers browser downloads. */
TL.reporting = (function () {
  function download(filename, text, mime) {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return {
    /** REP-FR-01: curated dataset as CSV. */
    buildDatasetCsv() {
      const cols = ["id", "source", "collected_at", "sender", "subject", "url", "label"];
      const rows = [cols.join(",")];
      TL.db.getSamples().forEach(s => {
        rows.push(cols.map(c => '"' + String(s[c] == null ? "" : s[c]).replace(/"/g, '""') + '"').join(","));
      });
      return rows.join("\n");
    },
    exportDatasetCsv() { download("threatlens_dataset.csv", this.buildDatasetCsv(), "text/csv"); },

    /** REP-FR-02: taxonomy as JSON. */
    exportTaxonomyJson() {
      download("threatlens_taxonomy.json", JSON.stringify(TL.config.TAXONOMY, null, 2), "application/json");
    },

    /** REP-FR-03: technical report (Markdown). */
    buildReport() {
      const st = TL.dataCollection.getStats();
      const mc = TL.mlEngine.getModelComparison();
      let md = "# ThreatLens Report\n\n";
      md += `Generated: ${new Date().toISOString()}\n\n`;
      md += `## Dataset\n- Samples: ${st.samples}\n- Phishing: ${st.phishing}\n- Legitimate: ${st.legitimate}\n- Campaigns: ${st.campaigns}\n\n`;
      md += "## Model comparison\n| Model | Accuracy | Precision | Recall |\n|---|---|---|---|\n";
      mc.forEach(m => { md += `| ${m.model} | ${(m.accuracy*100).toFixed(1)}% | ${m.precision} | ${m.recall} |\n`; });
      return md;
    },
    exportReport() { download("threatlens_report.md", this.buildReport(), "text/markdown"); }
  };
})();
