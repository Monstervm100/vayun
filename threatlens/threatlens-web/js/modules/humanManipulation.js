/* Human Manipulation Analyzer (HM-FR-01/03/05).
   Detects psychological techniques and links each to triggering evidence. */
TL.humanManipulation = (function () {
  const LEX = {
    fear:      /(suspend|lock(ed)?|unauthoriz|penalt|terminat|breach|fail|locked out|deactivat)/i,
    urgency:   /(urgent|immediately|within 24 hours|24 hours|act now|asap|expires?|limited time|time sensitive|right away)/i,
    authority: /(it[-\s]?support|administrator|microsoft|bank|security team|ceo|help ?desk|official|account team)/i,
    curiosity: /\b(you have won|congratulations|click to (see|view)|exclusive|shared (a )?document|new sign-?in)\b/i,
    reward:    /\b(reward|prize|gift|bonus|refund|won|claim your)\b/i
  };

  return {
    /** analyze(sample) -> {present:{tech:bool}, evidence:{tech:matchedText}} (HM-FR-01/03) */
    analyze(sample) {
      const text = ((sample.subject || "") + " " + (sample.body || "") + " " + (sample.sender || ""));
      const present = {}, evidence = {};
      TL.config.MANIPULATION.forEach(tech => {
        const m = text.match(LEX[tech]);
        present[tech] = !!m;
        evidence[tech] = m ? m[0] : null;
      });
      return { present, evidence };
    }
  };
})();
