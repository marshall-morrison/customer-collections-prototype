/* ============================================================
   Collections Agent — mock prototype
   Canonical item taxonomy across three regions:
     future[]   — planned_email | scheduled_task
     proposed[] — PRD action set (billing/invoice CRUD = 1 tool)
     happened[] — typed chronological events; emails are clickable
   ============================================================ */

// ---- icon set (inline SVG, 14x14, currentColor) ----
const ICON = {
  email:    `<svg class="ico" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="1" y="2.5" width="12" height="9" rx="1.2"/><path d="M1.5 3.5L7 7.5L12.5 3.5"/></svg>`,
  agent:    `<svg class="ico" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="2.5" y="4" width="9" height="7" rx="1.5"/><path d="M7 4V1.8M5 7.5h.01M9 7.5h.01"/><circle cx="7" cy="1.4" r="1"/></svg>`,
  user:     `<svg class="ico" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="7" cy="4.5" r="2.3"/><path d="M2.5 12c.6-2.6 2.4-3.8 4.5-3.8S11 9.4 11.5 12"/></svg>`,
  clock:    `<svg class="ico" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="7" cy="7" r="5.3"/><path d="M7 4v3.2l2.1 1.3"/></svg>`,
  task:     `<svg class="ico" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="2" y="2.5" width="10" height="9.5" rx="1.2"/><path d="M4.3 6.2l1.2 1.2 2-2.2M4.3 9.6l1.2 1.2 2-2.2"/></svg>`,
  reminder: `<svg class="ico" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3.2 6a3.8 3.8 0 017.6 0c0 3 1 4 1 4H2.2s1-1 1-4z"/><path d="M5.6 12.2a1.6 1.6 0 002.8 0"/></svg>`,
  dollar:   `<svg class="ico" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M7 1.8v10.4M9.2 3.8c-.5-.6-1.3-1-2.2-1-1.4 0-2.4.8-2.4 1.9 0 2.6 4.9 1.3 4.9 4 0 1.2-1.1 2-2.5 2-1 0-1.9-.4-2.4-1.1"/></svg>`,
  alert:    `<svg class="ico" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M7 1.8L13 12H1z"/><path d="M7 5.6v3M7 10.2h.01"/></svg>`,
  handshake:`<svg class="ico" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M1.5 5.5L4 4l3 2 1.5-1 4 2.5M1.5 5.5v3l3 2.5 1.2-1M7 6l2 1.8 1.5-1"/></svg>`,
  pause:    `<svg class="ico" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5 3v8M9 3v8"/></svg>`,
  play:     `<svg class="ico" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M4 2.8l7 4.2-7 4.2z"/></svg>`,
  ban:      `<svg class="ico" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="7" cy="7" r="5.2"/><path d="M3.3 3.3l7.4 7.4"/></svg>`,
  doc:      `<svg class="ico" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3 1.8h5l3 3v7.4H3z"/><path d="M8 1.8v3h3"/></svg>`,
  x:        `<svg class="ico" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 4l6 6M10 4l-6 6"/></svg>`,
  check:    `<svg class="ico" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 7.5L5 10.5L9 4M7 9.5L9.5 4"/></svg>`,
};

// ===== Canonical type registries =====
const FUTURE_KINDS = {
  planned_email:  { label: "Planned email", icon: "email" },
  scheduled_task: { label: "Scheduled task", icon: "task" },
};

const PROPOSED_KINDS = {
  send_email:             { label: "Send email", icon: "email" },
  schedule_task:          { label: "Schedule task", icon: "task" },
  update_contacts:        { label: "Update billing contacts", icon: "user" },
  update_addresses:       { label: "Update addresses", icon: "user" },
  update_po:              { label: "Update PO number", icon: "doc" },
  mark_pending:           { label: "Mark invoice pending", icon: "clock" },
  match_transactions:     { label: "Match open transactions", icon: "dollar" },
  modify_sequence:        { label: "Modify dunning sequence", icon: "reminder" },
  billing_invoice_update: { label: "Billing / invoice update", icon: "doc" },
  escalate:               { label: "Escalate / route to owner", icon: "alert" },
};

// happened: invoiceScoped → render the invoice number inline
const HAPPENED_KINDS = {
  agent_executed: { label: "Agent action",   icon: "agent",     invoiceScoped: false },
  email:          { label: "Email",          icon: "email",     invoiceScoped: false, clickable: true },
  ptp_logged:     { label: "Promise to pay logged", icon: "handshake", invoiceScoped: true },
  ptp_broken:     { label: "Promise to pay broken", icon: "alert", invoiceScoped: true },
  payment_failed: { label: "Payment failed", icon: "alert",     invoiceScoped: true },
  payment_applied:{ label: "Payment applied",icon: "dollar",    invoiceScoped: true },
  dunning_paused: { label: "Dunning paused — invoice moved to pending", icon: "pause", invoiceScoped: true },
  invoice_voided: { label: "Invoice voided", icon: "ban",       invoiceScoped: true },
  dunning_resumed:{ label: "Dunning resumed",icon: "play",      invoiceScoped: true },
  agent_paused:   { label: "Agent paused for this customer",  icon: "pause", invoiceScoped: false },
  agent_resumed:  { label: "Agent resumed for this customer", icon: "play",  invoiceScoped: false },
};

const FLAG_LABELS = { opened: "opened", clicked: "link clicked", bounced: "bounced", failed: "failed" };
const BAD_FLAGS = new Set(["bounced", "failed"]);

// ============================================================
//  SYNTHETIC IDENTITIES (reused across scenarios)
// ============================================================
// Customer (the payer) | Merchant (the Tabs user billing them) | System | Agent
const CUST = { name: "Dana Reed", org: "Meridian Group", email: "finance@meridiangroup.com" };
const CUST_AP = { name: "AP Team", org: "Meridian Group", email: "ap@meridiangroup.com" };
const MERCH = { name: "Carl Quint", org: "General Catalyst", email: "carl@generalcatalyst.com" };

// ---- builders to keep scenario data terse ----
const email = (o) => ({ kind: "email", direction: "in", senderType: "customer", flags: {}, ...o });
const exec = (action, details, date, time) => ({ kind: "agent_executed", action, details, date, time });

// ============================================================
//  SCENARIOS
// ============================================================
const SCENARIOS = {
  "00 · Canonical reference (all item types)": () => ({
    note: "Legend, not a real case. Shows every canonical item type so we can agree on each tile's anatomy: every FUTURE kind, every PROPOSED action, and every HAPPENED event. Click any email to open it in the middle.",
    summary: "Reference scenario for design review. One of each canonical item in every region. Invoice-scoped events show the invoice number; emails are clickable and carry status badges.",
    todayCount: "— reference —",
    future: [
      { kind: "planned_email", subject: "Payment reminder — invoice XXA2415", to: CUST.email, sequenceStep: "Reminder 2 of 4", anchorLabel: "3 days after due date", invoice: "XXA2415", date: "Jun 20, 2026", time: "8:00 AM" },
      { kind: "scheduled_task", prompt: "Re-check XXA2415; if unpaid and no reply, send follow-up.", invoice: "XXA2415", date: "Jun 16, 2026", time: "8:00 AM" },
    ],
    proposed: [
      { kind: "send_email", desc: "Reply to the customer with the updated invoice", invoice: "XXA2415" },
      { kind: "schedule_task", desc: "Re-check payment in 5 days, then escalate if still unpaid" },
      { kind: "update_contacts", desc: "Set main billing contact to ap@meridiangroup.com" },
      { kind: "update_addresses", desc: "Update billing + shipping address on file" },
      { kind: "update_po", desc: "Set PO number to 12345", invoice: "XXA2415" },
      { kind: "mark_pending", desc: "Move invoice to pending while payment verifies", invoice: "XXA2415" },
      { kind: "match_transactions", desc: "Match $10,890 incoming payment to XXA2415" },
      { kind: "modify_sequence", desc: "Insert a 7-day check-in into this customer's sequence" },
      { kind: "billing_invoice_update", desc: "Edit billing terms / void / create invoice (simplified single tool)", invoice: "XXA2415" },
      { kind: "escalate", desc: "Route to account owner — outside agent capability" },
    ],
    happened: [
      exec("Agent ran scheduled task", "Re-check fired: customer hadn't paid, sent the next follow-up.", "Jun 5, 2026", "8:00 AM"),
      email({ direction: "out", senderType: "agent", subject: "Re: invoice XXA2415", preview: "Thanks — the updated invoice with PO 12345 is attached…", body: "Hi Dana,\n\nThanks for flagging that. The updated invoice XXA2415 with PO 12345 applied is attached, and I've updated your billing contact.\n\nBest,\nCollections", flags: { opened: true, clicked: true }, date: "Jun 5, 2026", time: "11:00 AM" }),
      email({ direction: "in", senderType: "customer", senderName: CUST.name, org: CUST.org, subject: "Re: invoice XXA2415", preview: "Can you apply PO 12345 and resend?", body: "Can you apply PO 12345 and resend? Thanks.\n\nDana", flags: { opened: true }, date: "Jun 4, 2026", time: "9:02 AM" }),
      email({ direction: "in", senderType: "merchant", senderName: MERCH.name, org: MERCH.org, subject: "Heads up on Meridian", preview: "Looping our AR in — they may be slow this month.", body: "Looping our AR in — Meridian may be slow this month given a system migration.\n\nCarl", date: "Jun 3, 2026", time: "5:10 PM" }),
      email({ direction: "out", senderType: "system", systemKind: "dunning", subject: "Your invoice is past due", preview: "This is a reminder that invoice XXA2415 is past due…", body: "This is an automated reminder that invoice XXA2415 is past due.", flags: { bounced: true }, date: "Jun 1, 2026", time: "8:00 AM" }),
      email({ direction: "out", senderType: "system", systemKind: "invoice", subject: "Invoice XXA2415", preview: "Your invoice XXA2415 for $10,890 is attached…", body: "Your invoice XXA2415 for $10,890 is attached. Due Oct 31.", flags: { opened: true }, date: "May 16, 2026", time: "10:30 AM" }),
      { kind: "ptp_logged", invoice: "XXA2415", details: "Customer committed to pay $10,890 by Jun 2 via ACH.", date: "May 28, 2026", time: "10:05 AM" },
      { kind: "ptp_broken", invoice: "XXA2415", details: "Promised payment date passed with no payment.", date: "Jun 2, 2026", time: "12:00 AM" },
      { kind: "payment_failed", invoice: "XXA2415", amount: "$10,890", reasonCode: "R01", reasonText: "Insufficient funds", date: "Jun 3, 2026", time: "2:20 AM" },
      { kind: "payment_applied", invoice: "XXA2415", amount: "$10,890", details: "Payment posted and applied; balance $0.00.", date: "Jun 6, 2026", time: "2:04 PM" },
      { kind: "dunning_paused", invoice: "XXA2415", details: "Moved to pending while payment verifies.", date: "May 30, 2026", time: "1:05 PM" },
      { kind: "invoice_voided", invoice: "XXA2416", details: "Duplicate invoice voided.", date: "May 22, 2026", time: "9:30 AM" },
      { kind: "dunning_resumed", invoice: "XXA2415", details: "Payment not confirmed — invoice returned to overdue, dunning resumed.", date: "Jun 4, 2026", time: "8:00 AM" },
      { kind: "agent_paused", details: "User paused all agent activity for this customer.", date: "May 10, 2026", time: "9:00 AM" },
      { kind: "agent_resumed", details: "User resumed agent activity for this customer.", date: "May 12, 2026", time: "9:00 AM" },
    ],
  }),

  "01 · Single action — reply & resend": () => ({
    note: "The common case. 74% of plans are single-action. Stresses Need #1 (context in 0–2 clicks) and #2 at its floor: the page must make ONE action feel like complete, finished work — not look sparse.",
    summary: "Meridian Group asked to apply PO 12345 to invoice XXA2415 ($10,890) and resend it. No dispute, balance still outstanding. One action covers it.",
    todayCount: "34 events to date",
    future: [
      { kind: "planned_email", subject: "Payment reminder — XXA2415", to: CUST.email, sequenceStep: "Reminder 2 of 4", anchorLabel: "5 days after due date", invoice: "XXA2415", date: "Jun 18, 2026", time: "8:00 AM" },
    ],
    proposed: [
      { kind: "send_email", desc: "Reply to Dana Reed — invoice XXA2415 with PO 12345 applied, billing contact updated", invoice: "XXA2415" },
    ],
    happened: [
      email({ direction: "in", senderType: "customer", senderName: CUST.name, org: CUST.org, subject: "Re: invoice XXA2415", preview: "Can you apply PO 12345 and resend?", body: "Can you apply PO 12345 and resend? Thanks.\n\nDana", flags: { opened: true }, date: "Jun 4, 2026", time: "9:02 AM" }),
      email({ direction: "out", senderType: "system", systemKind: "invoice", subject: "Invoice XXA2415", preview: "Your invoice XXA2415 for $10,890 is attached…", body: "Your invoice XXA2415 for $10,890 is attached. Due Oct 31.", flags: { opened: true }, date: "May 16, 2026", time: "10:31 AM" }),
      { kind: "agent_executed", action: "Agent issued invoice", details: "XXA2415 for $10,890 issued, due Oct 31.", date: "May 16, 2026", time: "10:30 AM" },
    ],
  }),

  "02 · Just wait — schedule-only re-check": () => ({
    note: "The single most common output: schedule_task alone = 51% of ALL plans. Stresses the doc 'reality' bullet + scenario #32 — how does a lone 'wait and re-check' register as real work without burying the list under hundreds of identical re-checks?",
    summary: "Invoice resent with PO applied; no reply yet and nothing overdue enough to act on. The only move is to wait and re-check.",
    todayCount: "12 events to date",
    future: [
      { kind: "scheduled_task", prompt: "Re-check XXA2415 on Jun 12. If still unpaid and no customer reply, send the next dunning follow-up.", invoice: "XXA2415", date: "Jun 12, 2026", time: "8:00 AM" },
    ],
    proposed: [
      { kind: "schedule_task", desc: "Re-check XXA2415 on Jun 12; if unpaid and no reply, send the next follow-up", invoice: "XXA2415" },
    ],
    happened: [
      email({ direction: "out", senderType: "agent", subject: "Re: invoice XXA2415", preview: "Resending with PO 12345 applied…", body: "Hi Dana — resending XXA2415 with PO 12345 applied. Let me know if you need anything else.", flags: { opened: true }, date: "Jun 5, 2026", time: "11:00 AM" }),
      exec("Agent updated PO + scheduled re-check", "Applied PO 12345, updated billing contact, scheduled a re-check for Jun 12.", "Jun 5, 2026", "10:58 AM"),
    ],
  }),

  "03 · The pile-up — many events, one plan": () => ({
    note: "Stresses Need #1 (context when it gets big) + scenario #2 (pile-up) + the PRD's EVENT(S) accordion. One plan is the sum of agent reasoning across W-9 ask → promise-to-pay → ACH failure → angry reply. User must see ALL feeding events, not just the latest.",
    summary: "A lot happened since the last plan: the customer requested a W-9, promised to pay, then the ACH payment failed, then replied upset that the contract “was effective through April 30.” The agent reconciled all four into one plan.",
    todayCount: "78 events to date",
    future: [
      { kind: "scheduled_task", prompt: "If ACH still failed or no reply by Jun 12, escalate to account owner.", invoice: "XXA2415", date: "Jun 12, 2026", time: "9:00 AM" },
    ],
    proposed: [
      { kind: "send_email", desc: "Send the requested W-9 to Dana Reed", invoice: "XXA2415" },
      { kind: "send_email", desc: "Acknowledge the contract-end-date concern; clarify the period billed", invoice: "XXA2415" },
      { kind: "send_email", desc: "Provide a fresh payment link (prior ACH failed)", invoice: "XXA2415" },
      { kind: "mark_pending", desc: "Hold reminders 5 days while the above resolves", invoice: "XXA2415" },
    ],
    happened: [
      email({ direction: "in", senderType: "customer", senderName: CUST.name, org: CUST.org, subject: "Re: invoice XXA2415", preview: "Our contract was effective through April 30 — why are we being billed?", body: "Our contract was effective through April 30 — why are we being billed for this period? This needs to be sorted before we pay.", flags: { opened: true }, date: "Jun 4, 2026", time: "4:12 PM" }),
      { kind: "payment_failed", invoice: "XXA2415", amount: "$10,890", reasonCode: "R01", reasonText: "Insufficient funds", date: "Jun 3, 2026", time: "2:20 AM" },
      { kind: "ptp_logged", invoice: "XXA2415", details: "Customer committed to pay by Jun 2 via ACH.", date: "May 28, 2026", time: "10:05 AM" },
      email({ direction: "in", senderType: "customer", senderName: CUST.name, org: CUST.org, subject: "W-9 request", preview: "Please send a W-9 before we can process payment.", body: "Please send a W-9 before we can process payment. Thanks, Dana", flags: { opened: true }, date: "May 24, 2026", time: "1:40 PM" }),
    ],
  }),

  "04 · Escalated — dispute + sensitive relationship": () => ({
    note: "Stresses Need #10 (escalation) + scenario #4. Two escalation types coexist (relationship-sensitive AND invoice dispute); the doc says treat them the same UX-wise. Agent gets awareness only — no behavior change beyond 'proceed with caution.' Escalations also fire to Slack.",
    summary: "⚠︎ ESCALATED (dispute + relationship). Customer formally disputes XXA2415 claiming services were never delivered, and the thread has turned tense (hinting at non-renewal). Agent is proceeding with caution and proposing routing, not sends.",
    todayCount: "112 events to date",
    future: [],
    proposed: [
      { kind: "escalate", desc: "Notify Priya (AE) — open dispute + churn risk. Mark resolved only from this page." },
      { kind: "mark_pending", desc: "Hold all automated reminders until the dispute clears", invoice: "XXA2415" },
      { kind: "send_email", desc: "Draft (needs review): acknowledge dispute, request proof-of-delivery thread — do not auto-send", invoice: "XXA2415" },
    ],
    happened: [
      email({ direction: "in", senderType: "customer", senderName: CUST.name, org: CUST.org, subject: "Re: past due XXA2415", preview: "We dispute this charge — these services were never delivered…", body: "We dispute this charge — these services were never delivered. Frankly, we may not renew. Please stop the reminders.", flags: { opened: true }, date: "Jun 2, 2026", time: "3:30 PM" }),
      email({ direction: "out", senderType: "system", systemKind: "dunning", subject: "Second notice — XXA2415 past due", preview: "Invoice XXA2415 remains past due…", body: "Invoice XXA2415 remains past due. Full statement attached.", flags: { opened: true }, date: "May 28, 2026", time: "8:00 AM" }),
      exec("Agent flagged account high-risk", "Two unanswered reminders; flagged for review.", "May 27, 2026", "6:15 PM"),
      email({ direction: "out", senderType: "system", systemKind: "dunning", subject: "Reminder — XXA2415", preview: "A friendly reminder that XXA2415 is due…", body: "A friendly reminder that invoice XXA2415 is now past due.", flags: { opened: false }, date: "May 20, 2026", time: "8:00 AM" }),
    ],
  }),

  "05 · False engagement — all noise": () => ({
    note: "Stresses Need #3 (signal engagement WITHOUT opening each email) + scenario #10. The thread looks busy but every reply is non-human: AP-portal auto-ack, a 'request received' bot, an OOO auto-responder, and the merchant's own collector. Activity ≠ engagement — the page must visually separate hot human replies from noise.",
    summary: "Lots of recent activity on the thread, but none of it is the customer engaging: an AP-portal acknowledgement, a ticketing bot, an out-of-office auto-reply, and our own merchant collector chasing. No human at the customer has actually responded.",
    todayCount: "41 events to date",
    future: [
      { kind: "scheduled_task", prompt: "Re-check after the OOO end date (Jun 16); only then send a fresh follow-up to a live contact.", invoice: "XXA2415", date: "Jun 16, 2026", time: "8:00 AM" },
    ],
    proposed: [
      { kind: "schedule_task", desc: "Wait past the auto-responder return date (Jun 16) before any further send", invoice: "XXA2415" },
    ],
    happened: [
      email({ direction: "in", senderType: "other", senderName: "Mailer Daemon (auto-reply)", subject: "Out of office", preview: "Out of office, returning Jun 16. This inbox is unmonitored.", body: "Out of office until Jun 16. This inbox is unmonitored.", date: "Jun 5, 2026", time: "5:01 PM" }),
      email({ direction: "in", senderType: "other", senderName: "Zendesk (bot)", subject: "Request received — #88231", preview: "Your request has been received and a ticket was created.", body: "Your request has been received. Ticket #88231 created.", date: "Jun 4, 2026", time: "11:22 AM" }),
      email({ direction: "in", senderType: "other", senderName: "Coupa AP Portal", subject: "Invoice received into AP", preview: "(empty body) — portal acknowledgement", body: "Invoice received into the AP queue. No action required.", date: "Jun 3, 2026", time: "9:00 AM" }),
      email({ direction: "out", senderType: "merchant", senderName: MERCH.name, org: MERCH.org, subject: "Chasing payment", preview: "Just following up on the outstanding balance…", body: "Just following up on the outstanding balance for Meridian. — Carl", flags: { opened: true }, date: "Jun 2, 2026", time: "4:30 PM" }),
    ],
  }),

  "06 · Conflicting invoice states (4 invoices)": () => ({
    note: "Stresses scenario #21 + #9 + #31 (OTHER_BLOCKING) + the PRD invoice filter & cross-invoice rule. One customer, four open invoices in contradictory states at once. ~$320k in play. How does a single page hold four conflicting states clearly?",
    summary: "Oscilar has 4 open invoices in different states simultaneously: INV-101 paid-pending verification, INV-102 disputed (tax), INV-103 current/not yet due, INV-104 in active dunning. Total open ≈ $320,000.",
    todayCount: "96 events to date",
    future: [
      { kind: "planned_email", subject: "Payment reminder — INV-104", to: CUST.email, sequenceStep: "Reminder 3 of 4", anchorLabel: "14 days after due date", invoice: "INV-104", date: "Jun 19, 2026", time: "8:00 AM" },
      { kind: "scheduled_task", prompt: "Confirm INV-101 AP payment posted; if so, mark paid and close.", invoice: "INV-101", date: "Jun 13, 2026", time: "9:00 AM" },
    ],
    proposed: [
      { kind: "mark_pending", desc: "Disputed (tax) — hold reminders on this invoice only", invoice: "INV-102" },
      { kind: "send_email", desc: "Standard dunning follow-up on the overdue invoice", invoice: "INV-104" },
      { kind: "match_transactions", desc: "Confirm the AP payment cleared before closing", invoice: "INV-101" },
    ],
    happened: [
      { kind: "payment_applied", invoice: "INV-101", amount: "$84,000", details: "AP portal shows payment scheduled; not yet cleared.", date: "Jun 4, 2026", time: "8:15 AM" },
      email({ direction: "in", senderType: "customer", senderName: CUST.name, org: "Oscilar", subject: "Re: INV-102", preview: "The tax line on INV-102 is wrong.", body: "The tax line on INV-102 is wrong — please correct before we pay.", flags: { opened: true }, date: "Jun 2, 2026", time: "2:00 PM" }),
      email({ direction: "out", senderType: "system", systemKind: "dunning", subject: "INV-104 past due", preview: "Invoice INV-104 is past due…", body: "Invoice INV-104 is past due. Please remit at your earliest convenience.", flags: { opened: true, clicked: true }, date: "May 30, 2026", time: "8:00 AM" }),
      { kind: "agent_executed", action: "Agent issued invoice", details: "INV-103 issued, not yet due.", date: "May 28, 2026", time: "9:00 AM" },
    ],
  }),

  "07 · Unverified payment — paid by check": () => ({
    note: "Stresses scenario #11 + #29 (the promise mutates across a thread). Customer claims payment but the agent can't confirm it cleared. The agent PAUSES dunning on the unverifiable claim and surfaces the decision to the user rather than acting. Trust-critical: surface the work, don't silently proceed.",
    summary: "Customer says XXA2415 was “paid by check #38016,” but no payment has posted and the claim has shifted twice (check → stop payment → will rewire). Agent paused dunning on the unverified claim and is asking how to proceed rather than acting on its own.",
    todayCount: "53 events to date",
    future: [
      { kind: "scheduled_task", prompt: "If nothing clears by Jun 14, resurface to the user.", invoice: "XXA2415", date: "Jun 14, 2026", time: "9:00 AM" },
    ],
    proposed: [
      { kind: "escalate", desc: "Needs your call — agent recommends HOLDING dunning until payment is confirmed. Won't act until you direct it." },
      { kind: "send_email", desc: "Draft: request check image / wire confirmation to verify", invoice: "XXA2415" },
    ],
    happened: [
      email({ direction: "in", senderType: "customer", senderName: CUST.name, org: CUST.org, subject: "Re: XXA2415", preview: "Actually we'll rewire it — please disregard the check.", body: "Actually we'll rewire it — please disregard the check. (3rd change of story)", flags: { opened: true }, date: "Jun 5, 2026", time: "10:10 AM" }),
      email({ direction: "in", senderType: "customer", senderName: CUST.name, org: CUST.org, subject: "Re: XXA2415", preview: "We put a stop payment on the check, sorry.", body: "We put a stop payment on the check, sorry.", flags: { opened: true }, date: "Jun 3, 2026", time: "4:45 PM" }),
      email({ direction: "in", senderType: "customer", senderName: CUST.name, org: CUST.org, subject: "Payment sent", preview: "This was paid by check #38016.", body: "This was paid by check #38016 last week.", flags: { opened: true }, date: "May 30, 2026", time: "1:00 PM" }),
      { kind: "dunning_paused", invoice: "XXA2415", details: "Paused pending payment verification on the check claim.", date: "May 30, 2026", time: "1:05 PM" },
    ],
  }),

  "08 · Work on a paid invoice": () => ({
    note: "Stresses scenario #12 (Cityblock asked for a W-9 after the invoice was paid; agent marked NO_ACTION) + partial execution #7. The invoice is settled but there's still real work. Does a paid invoice vanish, or does the page keep surfacing actionable asks tied to it?",
    summary: "XXA2415 is fully paid ($0 balance). After payment, the customer asked for a W-9 and a billing-contact change. The contact change auto-executed under policy; the W-9 send needs review.",
    todayCount: "29 events to date",
    future: [],
    proposed: [
      { kind: "send_email", desc: "Send the signed W-9 to the requesting contact (needs review)", invoice: "XXA2415" },
    ],
    happened: [
      exec("Agent updated billing contact (auto)", "Auto-executed under policy: main billing contact → ap@meridiangroup.com.", "Jun 5, 2026", "11:32 AM"),
      email({ direction: "in", senderType: "customer", senderName: CUST.name, org: CUST.org, subject: "Re: paid — couple asks", preview: "Now that this is paid — can you send a W-9 and update our billing contact?", body: "Now that this is paid — can you send a W-9 and update our billing contact to ap@meridiangroup.com?", flags: { opened: true }, date: "Jun 5, 2026", time: "11:30 AM" }),
      { kind: "payment_applied", invoice: "XXA2415", amount: "$10,890", details: "Payment applied; balance now $0.00.", date: "Jun 3, 2026", time: "2:04 PM" },
      email({ direction: "out", senderType: "agent", subject: "Re: invoice XXA2415", preview: "Resending with PO applied…", body: "Resending XXA2415 with PO applied. Thanks!", flags: { opened: true, clicked: true }, date: "May 16, 2026", time: "10:31 AM" }),
    ],
  }),

  "09 · Can't-do-it — route & draft only": () => ({
    note: "Stresses scenario #20/#33 + the PRD 'actions the agent can't do right now.' Customer wants a card charge reversed; the agent can't reverse charges or issue credits. It must honestly propose a draft + a route — not fake a 'reverse charge' button.",
    summary: "Taktile wants the $42,436 card charge reversed over an unexpected $1,236 fee and will pay by ACH instead. The agent can't reverse a charge or issue a credit — it can only draft a reply and route to the account owner / billing.",
    todayCount: "47 events to date",
    future: [
      { kind: "scheduled_task", prompt: "Confirm billing actioned the reversal; follow up on ACH.", invoice: "INV-4347", date: "Jun 13, 2026", time: "9:00 AM" },
    ],
    proposed: [
      { kind: "send_email", desc: "Draft (needs review): acknowledge the fee concern, confirm ACH path — do not promise a reversal", invoice: "INV-4347" },
      { kind: "escalate", desc: "Hand the reversal request to billing — outside agent capability" },
      { kind: "billing_invoice_update", desc: "Reverse card charge", invoice: "INV-4347", unavailable: true },
    ],
    happened: [
      email({ direction: "in", senderType: "customer", senderName: "Sam Okafor", org: "Taktile", subject: "Reverse the card charge", preview: "Please reverse the $42,436 card charge — unexpected $1,236 fee. We'll pay by ACH.", body: "Please reverse the $42,436 card charge — there was an unexpected $1,236 fee. We'll pay by ACH instead.", flags: { opened: true }, date: "Jun 4, 2026", time: "3:15 PM" }),
      { kind: "payment_failed", invoice: "INV-4347", amount: "$42,436", reasonCode: "card_declined", reasonText: "Reversal requested by customer", date: "Jun 4, 2026", time: "3:20 PM" },
      { kind: "agent_executed", action: "Agent captured card payment", details: "Card charge of $42,436 captured, incl. $1,236 processing fee.", date: "Jun 1, 2026", time: "9:00 AM" },
    ],
  }),

  "10 · Mixed-verdict 4-action plan": () => ({
    note: "Stresses Need #2 (hefty 3–4 action plan usability) + scenario #16 + #27 (transaction with a proposed match) + #30 (dead invoice loop, L.A. Care 267 days). The rare-but-critical multi-action case where verdicts differ per action.",
    summary: "APIsec spans three invoices and needs a 4-action plan: verify a cash-app match, send a reminder, update a PO, and change a contact. Expect to approve some, reject one, and edit one before executing.",
    todayCount: "61 events to date",
    future: [
      { kind: "scheduled_task", prompt: "L.A. Care INV-9002 is 267 days past due — if no reply after reminder, escalate / give up loop.", invoice: "INV-9002", date: "Jun 14, 2026", time: "9:00 AM" },
    ],
    proposed: [
      { kind: "match_transactions", desc: "Match the $410k incoming payment to Sun Life INV-9001", invoice: "INV-9001" },
      { kind: "send_email", desc: "Dunning follow-up on L.A. Care INV-9002 (edit copy before sending)", invoice: "INV-9002" },
      { kind: "update_po", desc: "Set PO on Trace3 INV-9003 to 778812", invoice: "INV-9003" },
      { kind: "update_contacts", desc: "Change contact on Sun Life — likely reject, looks stale", invoice: "INV-9001" },
    ],
    happened: [
      { kind: "payment_applied", invoice: "INV-9001", amount: "$410,000", details: "ACH received; proposed match to Sun Life INV-9001 (unverified).", date: "Jun 4, 2026", time: "7:45 AM" },
      email({ direction: "in", senderType: "customer", senderName: "Trace3 AP", org: "Trace3", subject: "PO going forward", preview: "Use PO 778812 going forward.", body: "Use PO 778812 going forward on all invoices.", flags: { opened: true }, date: "Jun 3, 2026", time: "2:30 PM" }),
      email({ direction: "out", senderType: "system", systemKind: "dunning", subject: "INV-9002 past due (267 days)", preview: "Invoice INV-9002 is severely past due…", body: "Invoice INV-9002 is 267 days past due. Please remit immediately.", flags: { opened: false }, date: "May 20, 2026", time: "8:00 AM" }),
      { kind: "ptp_broken", invoice: "INV-9002", details: "Prior promise to pay lapsed; no response since.", date: "May 18, 2026", time: "12:00 AM" },
    ],
  }),

  "11 · Paused — customer on lockdown": () => ({
    note: "Stresses the product decision 'pause agent vs. pause dunning' + scenario #5. Full kill switch: all dunning, outbound, and agent activity are off until a human unpauses. The page must make a hard STOP obviously different from quiet-but-healthy (scenario 12).",
    summary: "⏸ PAUSED. The collections agent is fully paused for this customer — all dunning, all outbound, and all agent activity are off until someone unpauses. Nothing is scheduled and no plan will be proposed in this state.",
    todayCount: "58 events to date",
    future: [],
    proposed: [],
    happened: [
      { kind: "agent_paused", details: "“Customer is on lockdown until further notice.” Paused all agent activity.", date: "Jun 5, 2026", time: "9:15 AM" },
      email({ direction: "in", senderType: "customer", senderName: "CFO", org: CUST.org, subject: "Account on hold", preview: "Please halt all communications about our account.", body: "Please halt all communications about our account until further notice.", flags: { opened: true }, date: "Jun 4, 2026", time: "4:50 PM" }),
      exec("Agent sent statement of account", "Last plan executed before the pause.", "Jun 2, 2026", "8:00 AM"),
    ],
  }),

  "12 · Quiet but healthy — a month on autopilot": () => ({
    note: "Stresses the trust view + the doc 'reality' bullet (only 6.5% of plans ever execute; 92% sit in NEEDS_REVIEW; a month of letting it run produces a backlog of re-checks, not sends). Scenario #8: how does the page say 'nothing needs you, and that's GOOD' without looking empty or broken?",
    summary: "You let the agent run for a month. Most plans were re-checks that resolved themselves; a couple of sends auto-executed under policy. Nothing needs your review right now — and that's the healthy state, not an empty one.",
    todayCount: "204 events to date",
    future: [
      { kind: "planned_email", subject: "Payment reminder — XXA2231", to: CUST.email, sequenceStep: "Reminder 1 of 4", anchorLabel: "On due date", invoice: "XXA2231", date: "Jun 20, 2026", time: "8:00 AM" },
      { kind: "scheduled_task", prompt: "Routine re-check of INV-2231; no action unless still unpaid.", invoice: "INV-2231", date: "Jun 16, 2026", time: "8:00 AM" },
    ],
    proposed: [],
    happened: [
      { kind: "payment_applied", invoice: "INV-2230", amount: "$22,400", details: "Paid in full; auto-closed.", date: "Jun 4, 2026", time: "10:00 AM" },
      exec("Agent sent reminder (auto)", "Auto-executed under policy: routine reminder on INV-2231.", "Jun 1, 2026", "8:00 AM"),
      exec("Agent ran scheduled task (auto)", "Re-check fired — customer had already paid; closed with no action.", "May 25, 2026", "8:00 AM"),
      exec("Agent ran scheduled task (auto)", "Re-check fired; rescheduled, nothing due.", "May 18, 2026", "8:00 AM"),
    ],
  }),
};
const SCENARIO_KEYS = Object.keys(SCENARIOS);

// ============================================================
//  STATE
// ============================================================
let state = SCENARIOS[SCENARIO_KEYS[0]]();
let openedEmailRef = null; // identity of the email shown in the work area
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---- email helpers ----
function emailSenderLabel(e) {
  switch (e.senderType) {
    case "customer": return `${e.senderName || "Customer"} — ${e.org || "Customer"}`;
    case "merchant": return `${e.senderName || "Merchant"} — ${e.org || "Merchant"}`;
    case "agent":    return "Agent";
    case "system":   return `System · ${e.systemKind === "dunning" ? "Dunning" : "Invoice send"}`;
    default:         return e.senderName || e.from || "Email";
  }
}
function flagBadges(flags) {
  if (!flags) return "";
  return Object.keys(FLAG_LABELS)
    .filter((f) => flags[f])
    .map((f) => `<span class="badge ${BAD_FLAGS.has(f) ? "bad" : "info"}">${FLAG_LABELS[f]}</span>`)
    .join("");
}
const emailKey = (e) => `${e.date}|${e.time}|${e.subject}`;

// ---- chronological sort (so every scenario reads as one timeline) ----
const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
function parseDT(item) {
  const d = (item.date || "").trim();
  const m = /^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/.exec(d);
  if (!m) return 0;
  let hh = 0, mm = 0;
  const tm = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec((item.time || "12:00 AM").trim());
  if (tm) { hh = (+tm[1]) % 12; if (/pm/i.test(tm[3])) hh += 12; mm = +tm[2]; }
  return new Date(+m[3], MONTHS[m[1]] ?? 0, +m[2], hh, mm).getTime();
}
// newest/latest first (descending) — top of column is farthest future, bottom is oldest past
const byNewestFirst = (a, b) => parseDT(b) - parseDT(a);

// ============================================================
//  RENDER — prototype
// ============================================================
function render() {
  $("agentSummary").textContent = state.summary;
  $("todayCount").textContent = state.todayCount;

  // ---- proposed (active plan) ----
  const pc = state.proposed.length;
  $("proposedCount").textContent = `${pc} Proposed Action${pc === 1 ? "" : "s"}`;
  $("proposedList").innerHTML = state.proposed.map((p) => {
    const k = PROPOSED_KINDS[p.kind] || PROPOSED_KINDS.send_email;
    const inv = p.invoice ? ` <span class="inv-chip">${esc(p.invoice)}</span>` : "";
    if (p.unavailable) {
      return `<div class="plan-item unavailable">
        <div class="desc">${ICON.ban}<span><b>${esc(k.label)}</b>${inv}<br>${esc(p.desc)}</span></div>
        <span class="na-tag">Not available to agent</span>
      </div>`;
    }
    return `<div class="plan-item">
      <div class="desc">${ICON[k.icon]}<span><b>${esc(k.label)}</b>${inv}<br>${esc(p.desc)}</span></div>
      <div class="linklike">${ICON.x} Reject</div>
      <button class="btn sm">${ICON.check} Approve</button>
    </div>`;
  }).join("") || `<div class="desc" style="color:var(--cloud500);font-size:12px;padding-left:0">No plan pending review.</div>`;

  // ---- future (planned emails + scheduled tasks) ----
  $("scheduledList").innerHTML = state.future.map((f) => {
    const k = FUTURE_KINDS[f.kind] || FUTURE_KINDS.scheduled_task;
    const inv = f.invoice ? ` <span class="inv-chip">${esc(f.invoice)}</span>` : "";
    let title, detail;
    if (f.kind === "planned_email") {
      title = `${esc(f.subject)}`;
      detail = `To ${esc(f.to)} · ${esc(f.sequenceStep || "Sequence email")} · ${esc(f.anchorLabel || "")}`;
    } else {
      title = "Scheduled task";
      detail = esc(f.prompt);
    }
    return `<div class="entry future-entry muted">
      <div class="ico-col">${ICON.clock}</div>
      <div class="body">
        <div class="etitle">${ICON[k.icon]} ${title}${inv}</div>
        <div class="edetails">${detail}</div>
      </div>
      <div class="edate"><div>${esc(f.date)}</div><div>${esc(f.time)}</div></div>
    </div>`;
  }).join("") || `<div class="entry future-entry muted"><div class="ico-col"></div><div class="body"><div class="edetails">Nothing scheduled.</div></div></div>`;

  // ---- happened (typed, chronological) ----
  $("pastList").innerHTML = state.happened.map((e) => renderHappened(e)).join("")
    || `<div class="entry"><div class="dot-col"></div><div class="body"><div class="edetails" style="color:var(--cloud500)">No events yet.</div></div></div>`;

  // wire email clicks
  document.querySelectorAll("#pastList .entry.email").forEach((el) => {
    el.addEventListener("click", () => {
      const i = +el.dataset.i;
      openEmail(state.happened[i]);
    });
  });

  positionTimelineLine();
}

function renderHappened(e) {
  const i = state.happened.indexOf(e);
  const meta = HAPPENED_KINDS[e.kind] || HAPPENED_KINDS.agent_executed;
  const inv = meta.invoiceScoped && e.invoice ? ` <span class="inv-chip">${esc(e.invoice)}</span>` : "";
  const date = `<div class="edate"><div>${esc(e.date)}</div><div>${esc(e.time)}</div></div>`;

  if (e.kind === "email") {
    const sel = openedEmailRef === emailKey(e) ? " selected" : "";
    const dir = e.direction === "out" ? "Sent" : "Received";
    return `<div class="entry email${sel}" data-i="${i}" title="Open email">
      <div class="ico-col">${ICON.email}</div>
      <div class="body">
        <div class="etitle">${esc(emailSenderLabel(e))} <span class="dir-tag">${dir}</span> ${flagBadges(e.flags)}</div>
        <div class="edetails"><b>${esc(e.subject)}</b> — ${esc(e.preview || "")}</div>
      </div>
      ${date}
    </div>`;
  }

  let title, detail;
  if (e.kind === "agent_executed") {
    title = esc(e.action || "Agent action");
    detail = esc(e.details || "");
  } else if (e.kind === "payment_failed") {
    title = `${meta.label}${inv}`;
    detail = `${esc(e.amount || "")} — ${esc(e.reasonCode || "")}: ${esc(e.reasonText || "")}`;
  } else if (e.kind === "payment_applied") {
    title = `${meta.label}${inv}`;
    detail = `${esc(e.amount || "")}${e.details ? " — " + esc(e.details) : ""}`;
  } else {
    title = `${meta.label}${inv}`;
    detail = esc(e.details || "");
  }
  return `<div class="entry">
    <div class="dot-col"><div class="dot"></div></div>
    <div class="body">
      <div class="etitle">${ICON[meta.icon]} ${title}</div>
      ${detail ? `<div class="edetails">${detail}</div>` : ""}
    </div>
    ${date}
  </div>`;
}

// ============================================================
//  EMAIL VIEWER (middle / work area)
// ============================================================
function openEmail(e) {
  if (!e || e.kind !== "email") return;
  openedEmailRef = emailKey(e);
  const dir = e.direction === "out" ? "Sent" : "Received";
  const fromLine = e.direction === "out"
    ? `finance@tabs.com${e.senderType === "agent" ? " (Agent draft/send)" : ""}`
    : esc(emailSenderLabel(e));
  const toLine = e.direction === "out" ? esc(e.to || CUST.email) : "finance@tabs.com";
  $("emailViewer").innerHTML = `
    <div class="ev-head">
      <div class="ev-row"><span class="ev-from">${fromLine}</span><span class="ev-when">${esc(e.date)} ${esc(e.time)}</span></div>
      <div class="ev-row2"><span class="ev-dir">${dir}</span> · to ${toLine} ${flagBadges(e.flags)}</div>
    </div>
    <div class="ev-card">
      <div class="ev-subj">${esc(e.subject)}</div>
      <div class="ev-body">${esc(e.body || e.preview || "").replace(/\n/g, "<br>")}</div>
    </div>`;
  // reflect selection in the timeline
  document.querySelectorAll("#pastList .entry.email").forEach((el) => {
    el.classList.toggle("selected", +el.dataset.i === state.happened.indexOf(e));
  });
}

function openLatestEmail() {
  const firstEmail = state.happened.find((e) => e.kind === "email");
  if (firstEmail) { openEmail(firstEmail); }
  else {
    openedEmailRef = null;
    $("emailViewer").innerHTML = `<div class="ev-empty">No emails in this scenario.<br><span>Click an email in the timeline to open it here.</span></div>`;
  }
}

// blue vertical timeline line: from Today marker down through past events
function positionTimelineLine() {
  const line = $("tlLine"), today = document.querySelector(".today-marker"), past = $("pastList"), cols = document.querySelector(".columns");
  if (!today || !cols) return;
  const c = cols.getBoundingClientRect(), t = today.getBoundingClientRect(), p = past.getBoundingClientRect();
  const top = t.top - c.top + 4;
  line.style.top = top + "px";
  line.style.height = Math.max(p.bottom - c.top - 12 - top, 0) + "px";
}

// ============================================================
//  EDITOR DRAWER — generic, schema-driven
// ============================================================
const LIST_KINDS = { future: FUTURE_KINDS, proposed: PROPOSED_KINDS, happened: HAPPENED_KINDS };
const SELECT_FIELDS = {
  direction: ["in", "out"],
  senderType: ["customer", "merchant", "system", "agent", "other"],
  systemKind: ["invoice", "dunning"],
};
const LONG_FIELDS = new Set(["details", "preview", "body", "prompt", "desc", "summary"]);

const NEW = {
  future: () => ({ kind: "scheduled_task", prompt: "Re-check and follow up if unpaid.", invoice: "XXA2415", date: "Jun 20, 2026", time: "9:00 AM" }),
  proposed: () => ({ kind: "send_email", desc: "Describe the action", invoice: "" }),
  happened: () => email({ direction: "in", senderType: "customer", senderName: CUST.name, org: CUST.org, subject: "Re: invoice", preview: "…", body: "…", flags: { opened: true }, date: "Jun 1, 2026", time: "12:00 PM" }),
};

function fieldControl(listKey, idx, key, val) {
  const dl = `data-list="${listKey}" data-i="${idx}" data-k="${key}"`;
  if (key === "kind") {
    const opts = Object.entries(LIST_KINDS[listKey]).map(([k, v]) =>
      `<option value="${k}" ${k === val ? "selected" : ""}>${v.label}</option>`).join("");
    return `<div class="fld"><label>kind</label><select ${dl}>${opts}</select></div>`;
  }
  if (SELECT_FIELDS[key]) {
    const opts = SELECT_FIELDS[key].map((o) => `<option ${o === val ? "selected" : ""}>${o}</option>`).join("");
    return `<div class="fld"><label>${key}</label><select ${dl}>${opts}</select></div>`;
  }
  if (LONG_FIELDS.has(key)) {
    return `<div class="fld" style="flex-basis:100%"><label>${key}</label><textarea ${dl}>${esc(val)}</textarea></div>`;
  }
  return `<div class="fld"><label>${key}</label><input ${dl} value="${esc(val)}"></div>`;
}

function flagControls(listKey, idx, flags) {
  const items = Object.keys(FLAG_LABELS).map((f) =>
    `<label class="flag"><input type="checkbox" data-list="${listKey}" data-i="${idx}" data-flag="${f}" ${flags && flags[f] ? "checked" : ""}> ${FLAG_LABELS[f]}</label>`).join("");
  return `<div class="fld" style="flex-basis:100%"><label>email status</label><div class="flag-row">${items}</div></div>`;
}

function cardFor(listKey, item, idx) {
  const fields = Object.entries(item)
    .filter(([k, v]) => k !== "flags" && typeof v !== "object")
    .map(([k, v]) => fieldControl(listKey, idx, k, v)).join("");
  const flags = item.kind === "email" ? flagControls(listKey, idx, item.flags) : "";
  return `<div class="ecard" data-list="${listKey}" data-i="${idx}">
    <div class="card-top"><span class="ix">#${idx + 1} · ${esc((LIST_KINDS[listKey][item.kind] || {}).label || item.kind)}</span><button class="del" data-del>Remove</button></div>
    <div class="ecard-grid">${fields}${flags}</div>
  </div>`;
}

function renderEditor() {
  $("summaryInput").value = state.summary;
  $("futureEditor").innerHTML = state.future.map((it, i) => cardFor("future", it, i)).join("") || emptyNote();
  $("proposedEditor").innerHTML = state.proposed.map((it, i) => cardFor("proposed", it, i)).join("") || emptyNote();
  $("happenedEditor").innerHTML = state.happened.map((it, i) => cardFor("happened", it, i)).join("") || emptyNote();
}
const emptyNote = () => `<div class="hint" style="margin:0">None yet — use “+ Add”.</div>`;

function wireEditor() {
  $("summaryInput").addEventListener("input", (e) => { state.summary = e.target.value; render(); });

  document.querySelectorAll("[data-add]").forEach((btn) => {
    if (btn.dataset.add === "summary") return;
    btn.addEventListener("click", () => {
      const list = btn.dataset.add;
      state[list].push(NEW[list]());
      renderEditor(); render();
    });
  });

  const body = document.querySelector(".drawer-body");
  body.addEventListener("input", onFieldChange);
  body.addEventListener("change", onFieldChange);
  body.addEventListener("click", (e) => {
    const del = e.target.closest("[data-del]");
    if (!del) return;
    const card = del.closest(".ecard");
    state[card.dataset.list].splice(+card.dataset.i, 1);
    renderEditor(); render();
  });
}

function onFieldChange(e) {
  const t = e.target;
  if (t.dataset.flag) {
    const it = state[t.dataset.list][+t.dataset.i];
    it.flags = it.flags || {};
    it.flags[t.dataset.flag] = t.checked;
    render(); return;
  }
  if (!t.dataset.k) return;
  const list = t.dataset.list, i = +t.dataset.i, k = t.dataset.k;
  state[list][i][k] = t.value;
  if (k === "kind") renderEditor(); // kind change → relabel card
  render();
}

// ============================================================
//  SCENARIO PICKER + DRAWER
// ============================================================
let currentScenario = SCENARIO_KEYS[0];

function loadScenario(name) {
  if (!SCENARIOS[name]) return;
  currentScenario = name;
  state = SCENARIOS[name]();
  // order both regions chronologically so the timeline reads as a narrative
  state.future.sort(byNewestFirst);
  state.happened.sort(byNewestFirst);
  $("scenarioSelect").value = name;
  $("scenarioTop").value = name;
  $("scnNote").textContent = state.note || "";
  $("scnCount").textContent = `${SCENARIO_KEYS.indexOf(name) + 1} / ${SCENARIO_KEYS.length}`;
  renderEditor();
  render();
  openLatestEmail();
}

function stepScenario(delta) {
  const i = SCENARIO_KEYS.indexOf(currentScenario);
  loadScenario(SCENARIO_KEYS[(i + delta + SCENARIO_KEYS.length) % SCENARIO_KEYS.length]);
}

function init() {
  [$("scenarioSelect"), $("scenarioTop")].forEach((sel) => {
    SCENARIO_KEYS.forEach((n) => {
      const o = document.createElement("option"); o.value = n; o.textContent = n; sel.appendChild(o);
    });
    sel.addEventListener("change", (e) => loadScenario(e.target.value));
  });
  $("resetBtn").addEventListener("click", () => loadScenario(currentScenario));
  $("prevScn").addEventListener("click", () => stepScenario(-1));
  $("nextScn").addEventListener("click", () => stepScenario(1));
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea, select")) return;
    if (e.key === "ArrowLeft") stepScenario(-1);
    if (e.key === "ArrowRight") stepScenario(1);
  });
  $("editFab").addEventListener("click", () => $("drawer").classList.add("open"));
  $("drawerClose").addEventListener("click", () => $("drawer").classList.remove("open"));

  wireEditor();
  // optional deep-link: #<1-based index> or #<scenario name>
  const h = decodeURIComponent(location.hash.replace(/^#/, ""));
  const byIdx = /^\d+$/.test(h) ? SCENARIO_KEYS[+h - 1] : null;
  const byName = SCENARIO_KEYS.find((k) => k === h || k.startsWith(h));
  loadScenario(byIdx || byName || SCENARIO_KEYS[0]);
}

window.addEventListener("hashchange", () => {
  const h = decodeURIComponent(location.hash.replace(/^#/, ""));
  const byIdx = /^\d+$/.test(h) ? SCENARIO_KEYS[+h - 1] : null;
  const byName = SCENARIO_KEYS.find((k) => k === h || k.startsWith(h));
  if (byIdx || byName) loadScenario(byIdx || byName);
});
window.addEventListener("resize", positionTimelineLine);
document.addEventListener("DOMContentLoaded", init);
