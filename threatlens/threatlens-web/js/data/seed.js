/* Seed dataset — illustrative phishing + legitimate (ham) samples.
   Loaded into the mock DB on first run. `label` is the ground-truth class,
   used by the Test Runner to check predictions.
   Fields mirror the SRD/SDD samples schema. */
TL.seed = {
  samples: [
    // --- Phishing ---
    { source: "seed", collected_at: "2026-06-28", sender: "it-support@secure-mail-verify.co",
      subject: "Your account will be suspended within 24 hours",
      body: "We detected an issue. Verify your password now to avoid suspension. Sign in to confirm your account.",
      url: "http://sec-login.co/verify?id=8821", domain_age_days: 3, spf_fail: true, label: "Credential Theft" },

    { source: "seed", collected_at: "2026-06-25", sender: "it-support@secure-mail-verify.co",
      subject: "Account suspended - immediate action required",
      body: "Your Microsoft 365 account is locked. Verify your credentials immediately to restore access.",
      url: "http://sec-login.co/verify?id=9007", domain_age_days: 3, spf_fail: true, label: "Credential Theft" },

    { source: "seed", collected_at: "2026-06-27", sender: "billing@invoice-portal-pay.com",
      subject: "Outstanding invoice #4471 - payment required",
      body: "Please review the attached invoice and process payment immediately to avoid a penalty.",
      url: "http://invoice-portal-pay.com/pay", domain_age_days: 5, spf_fail: true, label: "Financial Scam" },

    { source: "seed", collected_at: "2026-06-24", sender: "rewards@prize-claim-now.info",
      subject: "Congratulations! You have won a reward",
      body: "Claim your prize now before it expires. Limited time offer, click to claim your reward.",
      url: "http://prize-claim-now.info/claim", domain_age_days: 8, spf_fail: true, label: "Financial Scam" },

    { source: "seed", collected_at: "2026-06-23", sender: "noreply@login-account.info",
      subject: "Unusual sign-in activity detected",
      body: "We detected a new sign-in. Verify it was you by confirming your login credentials.",
      url: "http://login-account.info/confirm", domain_age_days: 6, spf_fail: true, label: "Fake Login Page" },

    { source: "seed", collected_at: "2026-06-14", sender: "ceo@corp-exec-mail.net",
      subject: "Urgent request - are you available?",
      body: "I need you to process a wire transfer discreetly. Reply asap, this is time sensitive.",
      url: "", domain_age_days: 11, spf_fail: true, label: "Business Email Compromise" },

    { source: "seed", collected_at: "2026-06-19", sender: "docs@docs-share-secure.co",
      subject: "Shared document: Q2 report.zip",
      body: "A document has been shared with you. Download the attachment to view: report.zip",
      url: "http://docs-share-secure.co/download", domain_age_days: 4, spf_fail: true, label: "Malware Delivery" },

    // --- Legitimate (ham) ---
    { source: "seed", collected_at: "2026-06-20", sender: "jklein@enron.com",
      subject: "Meeting notes from today",
      body: "Hi team, please find the notes from today's meeting. Let me know if I missed anything. Thanks.",
      url: "", domain_age_days: 4200, spf_fail: false, label: "Legitimate" },

    { source: "seed", collected_at: "2026-06-21", sender: "newsletter@github.com",
      subject: "Your weekly repository digest",
      body: "Here is a summary of activity across your repositories this week. View details on your dashboard.",
      url: "https://github.com/dashboard", domain_age_days: 6000, spf_fail: false, label: "Legitimate" },

    { source: "seed", collected_at: "2026-06-22", sender: "colleague@company.com",
      subject: "Reminder: project deadline tomorrow",
      body: "Just a reminder that the project deadline is tomorrow. Please review the document when you can.",
      url: "", domain_age_days: 3000, spf_fail: false, label: "Legitimate" },

    { source: "seed", collected_at: "2026-06-18", sender: "auto-confirm@amazon.com",
      subject: "Your order has shipped",
      body: "Thanks for your order. Your payment was received and your package is on the way.",
      url: "https://amazon.com/orders", domain_age_days: 9000, spf_fail: false, label: "Legitimate" }
  ]
};
