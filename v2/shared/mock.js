/* ============================================================
   Shared mock data for the Collections Agent page prototypes.
   One rich scenario (Meridian Group — a multi-invoice pile-up)
   plus a catalog of every proposed-action artifact type.
   Every variation renders window.MOCK; none should mutate it.
   ============================================================ */
window.MOCK = {
  customer: { name: "Meridian Group", domain: "meridiangroup.com" },
  merchant: { name: "General Catalyst" },

  // ---- §3 instant context (the agent-written brief) ----
  instantContext: {
    // ~3 sentences: what happened + net state (dispute verdict when relevant)
    whatHappened: "Since your last review, four things stacked up on invoice INV-2241: Meridian asked for a W-9 before paying, promised to pay by ACH on Jun 2, that ACH attempt then failed (R01, insufficient funds), and their latest reply pushes back that “our contract was effective through April 30.” Net state: still unpaid, payment blocked, and a billing-period question open.",
    // 1–2 sentences: why this plan (discovery-backed), not the tool calls
    why: "Holding dunning because they’ve credibly committed to pay and just need the W-9 first — and the contract actually runs through May 31, so the billed period is correct.",
    // conditional "what's on you" — null when nothing
    needsYou: {
      type: "needs_judgment", // cannot_execute | policy_review | needs_judgment
      text: "If you think the contract end-date dispute is genuinely live, route it to the account owner before I send.",
    },
    trigger: "New inbound email from the customer",
  },

  // ---- §7 always-on invoice data + totals ----
  totals: { outstanding: "$54,200", overdue: "$31,800" },
  invoices: [
    { number: "INV-2241", amount: "$18,400", status: "overdue", daysOverdue: 22 },
    { number: "INV-2242", amount: "$9,300", status: "disputed", daysOverdue: 31 },
    { number: "INV-2243", amount: "$4,100", status: "current", daysOverdue: 0 },
    { number: "INV-2240", amount: "$22,400", status: "paid", daysOverdue: 0 },
  ],

  // ---- §2 the proposed plan (the live one to act on) ----
  proposedPlan: {
    count: 4,
    // each action = a kind + human title/desc + the editable artifact it opens
    actions: [
      {
        kind: "send_email",
        title: "Send email",
        desc: "Reply to Dana Reed — W-9 attached, clarify the period billed, fresh payment link",
        invoice: "INV-2241",
        artifact: {
          to: ["finance@meridiangroup.com"],
          cc: ["ap@meridiangroup.com"],
          subject: "Re: invoice INV-2241 — W-9 + updated payment link",
          body: "Hi Dana,\n\nThanks for flagging both — the signed W-9 is attached. On the contract question: your agreement runs through May 31, so INV-2241 covers a valid period. The prior ACH attempt didn’t go through, so here’s a fresh payment link.\n\nHappy to hop on a call if useful.\n\nBest,\nCollections",
          attachments: [
            { name: "W-9_GeneralCatalyst.pdf", type: "PDF" },
            { name: "INV-2241.pdf", type: "PDF" },
          ],
        },
      },
      {
        kind: "mark_pending",
        title: "Mark invoice pending (pause dunning)",
        desc: "Hold reminders on INV-2241 for 5 days while the above resolves",
        invoice: "INV-2241",
        artifact: { confirm: true, note: "Customer engaging in good faith; paused 5 days." },
      },
      {
        kind: "schedule_task",
        title: "Schedule task",
        desc: "Re-check INV-2241 on Jun 12; if still unpaid and no reply, send the next follow-up",
        invoice: "INV-2241",
        artifact: {
          runAt: "Jun 12, 2026 · 9:00 AM",
          prompt: "Check whether INV-2241 has been paid. If not and there’s been no customer reply, send the next dunning follow-up. If they replied, re-plan.",
        },
      },
      {
        kind: "escalate",
        title: "Escalate / route to owner",
        desc: "Flag the contract-end-date dispute to the account owner (your call)",
        invoice: "INV-2241",
        artifact: { escType: "Invoice dispute", reason: "Customer contests the billed period (“effective through April 30”). Needs human judgment before any commercial reply." },
      },
    ],
  },

  // ---- Catalog of every action flavor + its UI artifact (for showing the range) ----
  actionCatalog: [
    { kind: "send_email", title: "Send email", uiPattern: "Interactive editor",
      artifact: { to: ["finance@meridiangroup.com"], cc: ["ap@meridiangroup.com"], subject: "Re: INV-2241", body: "Short body…", attachments: [{ name: "INV-2241.pdf", type: "PDF" }] } },
    { kind: "schedule_task", title: "Schedule task", uiPattern: "Date/time + prompt",
      artifact: { runAt: "Jun 12, 2026 · 9:00 AM", prompt: "Re-check INV-2241; follow up if unpaid." } },
    { kind: "update_po", title: "Update PO number", uiPattern: "Single string",
      artifact: { invoice: "INV-2241", poNumber: "12345" } },
    { kind: "mark_pending", title: "Mark invoice pending", uiPattern: "Yes / no",
      artifact: { invoice: "INV-2241", confirm: true } },
    { kind: "update_customer", title: "Update customer details", uiPattern: "Optional-fields form",
      artifact: { primaryContact: { name: "Dana Reed", email: "ap@meridiangroup.com" }, ccContacts: [], billingAddress: "500 Howard St, San Francisco, CA 94105", shippingAddress: "" } },
    { kind: "match_transactions", title: "Match transactions → invoices", uiPattern: "Yes / no (confirm match)",
      artifact: { transactionId: "TXN-32103", amount: "$10,233.60", invoice: "INV-22275" } },
    { kind: "billing_invoice_update", title: "Billing / invoice update", uiPattern: "Interactive editor (like email)",
      artifact: { invoice: "INV-2241", mode: "edit", lineItems: [
        { desc: "Platform subscription — May", qty: 1, unitPrice: "$17,164", amount: "$17,164" },
        { desc: "Duplicate line (removed)", qty: 1, unitPrice: "$1,236", amount: "$1,236" },
      ], issueDate: "May 16, 2026", dueDate: "Jun 15, 2026" } },
    { kind: "escalate", title: "Escalate / route", uiPattern: "Flag + reason",
      artifact: { escType: "Invoice dispute", reason: "Customer contests the billed period." } },
    { kind: "apply_credit_memo", title: "Apply credit memo", uiPattern: "Small form",
      artifact: { invoice: "INV-8826", amount: "$415", reason: "Goodwill credit for service gap" } },
  ],

  // ---- §4 future scheduled ----
  future: [
    { kind: "planned_email", subject: "Payment reminder — INV-2241", to: "finance@meridiangroup.com",
      sequenceStep: "Reminder 2 of 4", anchor: "5 days after due date", invoice: "INV-2241",
      date: "Jun 18, 2026", time: "8:00 AM" },
    { kind: "scheduled_task", prompt: "Re-check INV-2241; if unpaid and no reply, send follow-up.",
      invoice: "INV-2241", date: "Jun 12, 2026", time: "9:00 AM" },
    { kind: "planned_email", subject: "Payment reminder — INV-2242", to: "finance@meridiangroup.com",
      sequenceStep: "Reminder 3 of 4", anchor: "14 days after due date", invoice: "INV-2242",
      date: "Jun 20, 2026", time: "8:00 AM" },
  ],
  // sequence meta for the future region (§4)
  sequence: { name: "Global", broken: true, brokenReason: "Agent paused dunning on INV-2241" },

  // ---- §1 activity log (typed, newest first) ----
  // email entries carry full body + thread for the work area (§5)
  happened: [
    { kind: "email", direction: "in", senderType: "customer", senderName: "Dana Reed", org: "Meridian Group",
      subject: "Re: invoice INV-2241", preview: "Our contract was effective through April 30 — why are we billed?",
      body: "Our contract was effective through April 30 — why are we being billed for this period? This needs sorting before we can pay. Also still need that W-9.\n\nDana",
      flags: { opened: true }, date: "Jun 4, 2026", time: "4:12 PM", invoice: "INV-2241" },
    { kind: "payment_failed", invoice: "INV-2241", amount: "$18,400", reasonCode: "R01", reasonText: "Insufficient funds", date: "Jun 3, 2026", time: "2:20 AM" },
    { kind: "ptp_logged", invoice: "INV-2241", details: "Customer committed to pay $18,400 by Jun 2 via ACH.", date: "May 28, 2026", time: "10:05 AM" },
    { kind: "email", direction: "in", senderType: "customer", senderName: "Dana Reed", org: "Meridian Group",
      subject: "W-9 request", preview: "Please send a W-9 before we can process payment.",
      body: "Please send a W-9 before we can process payment. Thanks, Dana",
      flags: { opened: true }, date: "May 24, 2026", time: "1:40 PM", invoice: "INV-2241" },
    { kind: "email", direction: "in", senderType: "customer", senderName: "AP Team", org: "Meridian Group",
      subject: "Re: INV-2242 tax line", preview: "The tax line on INV-2242 is wrong — please correct before we pay.",
      body: "The tax line on INV-2242 is wrong — please correct before we pay.",
      flags: { opened: true }, date: "Jun 2, 2026", time: "2:00 PM", invoice: "INV-2242" },
    { kind: "email", direction: "out", senderType: "system", systemKind: "dunning",
      subject: "Your invoice INV-2241 is past due", preview: "This is a reminder that INV-2241 is past due…",
      body: "This is an automated reminder that invoice INV-2241 is past due. Please remit at your earliest convenience.",
      flags: { opened: true, clicked: true }, date: "May 20, 2026", time: "8:00 AM", invoice: "INV-2241" },
    { kind: "agent_executed", action: "Agent applied PO + scheduled a re-check", details: "Applied PO 12345 to INV-2241 and scheduled a re-check.", date: "May 18, 2026", time: "10:58 AM" },
    { kind: "email", direction: "out", senderType: "agent", subject: "Invoice INV-2241 (PO applied)",
      preview: "Resending INV-2241 with PO 12345 applied…", body: "Hi Dana — resending INV-2241 with PO 12345 applied. Let me know if you need anything else.",
      flags: { opened: true }, date: "May 16, 2026", time: "10:31 AM", invoice: "INV-2241" },
    { kind: "payment_applied", invoice: "INV-2240", amount: "$22,400", details: "Paid in full; auto-closed.", date: "May 10, 2026", time: "10:00 AM" },
    { kind: "invoice_overdue", invoice: "INV-2241", amount: "$18,400", details: "Crossed due date (1 day past due).", date: "May 1, 2026", time: "12:00 AM" },
  ],

  // ---- §7 customer insights (the "Learn more" deep view) ----
  customerInsights: {
    fromKanban: [
      { label: "Payment timing", value: "Usually pays on the 1st–3rd of the month" },
      { label: "Payment lateness", value: "Runs ~12 days late on average; this one is worse" },
      { label: "Email opening timing", value: "Opens most email around 2:00 PM" },
    ],
    fromReports: [
      { label: "ARR", value: "$214,000" },
      { label: "Deferred revenue", value: "$48,200" },
      { label: "Recognized (billed)", value: "$166,000 YTD" },
      { label: "Avg days to pay (DSO)", value: "41 days" },
      { label: "Renewal", value: "Nov 30, 2026 · auto-renew" },
      { label: "Total outstanding", value: "$54,200" },
    ],
    companyInfo: { legalName: "Meridian Group, Inc.", tax: "EIN 47-1234567", address: "500 Howard St, San Francisco, CA 94105", terms: "Net 30", primaryContact: "Dana Reed · finance@meridiangroup.com" },
  },

  // ---- §6 NL surfaces ----
  nl: {
    handoffPlaceholder: "Tell the agent what to do… (e.g. “also CC their controller and hold dunning a week”)",
    discoveryExamples: ["Have they disputed before?", "What’s the payment history on INV-2242?", "Did we ever send a W-9?"],
  },

  // ---- §7 control-panel state ----
  controls: { agentPaused: false, dunningPaused: false, escalated: true },
};
