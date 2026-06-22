/* ============================================================
   Low-fi tabbed Collections Agent page (v3).
   Mirrors the Figma wireframe: Sidebar · header band ·
   Actions / Activity / Scheduled / Global Settings tabs.
   Reuses the same scenario set as the original prototype so
   you can click through different cases. Mostly text + grey
   blocks on purpose — stays low fidelity.
   ============================================================ */

// ---- label maps ----
const PROPOSED = {
  send_email:             "Send email",
  schedule_task:          "Schedule task",
  update_contacts:        "Update billing contacts",
  update_addresses:       "Update addresses",
  update_po:              "Update PO number",
  mark_pending:           "Mark invoice pending (pause dunning)",
  match_transactions:     "Match open transactions",
  modify_sequence:        "Modify dunning sequence",
  billing_invoice_update: "Billing / invoice update",
  escalate:               "Escalate / route to owner",
};
const FUTURE = { planned_email: "Planned email", scheduled_task: "Scheduled task" };
const HAPPENED = {
  agent_executed: "Agent action", email: "Email",
  ptp_logged: "Promise to pay logged", ptp_broken: "Promise to pay broken",
  payment_failed: "Payment failed", payment_applied: "Payment applied",
  dunning_paused: "Dunning paused", dunning_resumed: "Dunning resumed",
  invoice_voided: "Invoice voided", agent_paused: "Agent paused",
  agent_resumed: "Agent resumed",
};
const FLAG_LABELS = { opened: "opened", clicked: "link clicked", bounced: "bounced", failed: "failed" };

// ---- synthetic identities ----
const CUST = { name: "Dana Reed", org: "Meridian Group", email: "finance@meridiangroup.com" };
const MERCH = { name: "Carl Quint", org: "General Catalyst", email: "carl@generalcatalyst.com" };
const email = (o) => ({ kind: "email", direction: "in", senderType: "customer", flags: {}, ...o });
const exec  = (action, details, date, time) => ({ kind: "agent_executed", action, details, date, time });

// ============================================================
//  SCENARIOS (same set as the original prototype)
// ============================================================
const SCENARIOS = {
  "00 · Canonical reference (all item types)": () => ({
    note: "Legend, not a real case. Every canonical item in every region so we can agree on each tile's anatomy.",
    customer: "Meridian Group",
    future: [
      { kind: "planned_email", subject: "Payment reminder — XXA2415", to: CUST.email, sequenceStep: "Reminder 2 of 4", anchorLabel: "3 days after due date", invoice: "XXA2415", date: "Jun 20, 2026", time: "8:00 AM" },
      { kind: "scheduled_task", prompt: "Re-check XXA2415; if unpaid and no reply, send follow-up.", invoice: "XXA2415", date: "Jun 16, 2026", time: "8:00 AM" },
    ],
    proposed: [
      { kind: "send_email", desc: "Reply to the customer with the updated invoice", invoice: "XXA2415" },
      { kind: "schedule_task", desc: "Re-check payment in 5 days, then escalate if still unpaid" },
      { kind: "update_contacts", desc: "Set main billing contact to ap@meridiangroup.com" },
      { kind: "update_po", desc: "Set PO number to 12345", invoice: "XXA2415" },
      { kind: "mark_pending", desc: "Move invoice to pending while payment verifies", invoice: "XXA2415" },
      { kind: "match_transactions", desc: "Match $10,890 incoming payment to XXA2415" },
      { kind: "escalate", desc: "Route to account owner — outside agent capability" },
    ],
    happened: [
      exec("Agent ran scheduled task", "Re-check fired: customer hadn't paid, sent the next follow-up.", "Jun 5, 2026", "8:00 AM"),
      email({ direction: "out", senderType: "agent", subject: "Re: invoice XXA2415", body: "Hi Dana,\n\nThe updated invoice XXA2415 with PO 12345 applied is attached, and I've updated your billing contact.\n\nBest,\nCollections", flags: { opened: true, clicked: true }, date: "Jun 5, 2026", time: "11:00 AM" }),
      email({ senderName: CUST.name, org: CUST.org, subject: "Re: invoice XXA2415", body: "Can you apply PO 12345 and resend? Thanks.\n\nDana", flags: { opened: true }, date: "Jun 4, 2026", time: "9:02 AM" }),
      { kind: "ptp_logged", invoice: "XXA2415", details: "Customer committed to pay $10,890 by Jun 2 via ACH.", date: "May 28, 2026", time: "10:05 AM" },
      { kind: "payment_failed", invoice: "XXA2415", amount: "$10,890", reasonCode: "R01", reasonText: "Insufficient funds", date: "Jun 3, 2026", time: "2:20 AM" },
      { kind: "dunning_paused", invoice: "XXA2415", details: "Moved to pending while payment verifies.", date: "May 30, 2026", time: "1:05 PM" },
    ],
  }),

  "01 · Single action — reply & resend": () => ({
    note: "The common case. 74% of plans are single-action. The page must make ONE action feel like complete, finished work.",
    customer: "Meridian Group",
    future: [
      { kind: "planned_email", subject: "Payment reminder — XXA2415", to: CUST.email, sequenceStep: "Reminder 2 of 4", anchorLabel: "5 days after due date", invoice: "XXA2415", date: "Jun 18, 2026", time: "8:00 AM" },
    ],
    proposed: [
      { kind: "send_email", desc: "Reply to Dana Reed — invoice XXA2415 with PO 12345 applied, billing contact updated", invoice: "XXA2415", cites: ["ask"] },
    ],
    happened: [
      email({ id: "ask", senderName: CUST.name, org: CUST.org, subject: "Re: invoice XXA2415", body: "Can you apply PO 12345 and resend? Thanks.\n\nDana", flags: { opened: true }, date: "Jun 4, 2026", time: "9:02 AM" }),
      { kind: "agent_executed", action: "Agent issued invoice", details: "XXA2415 for $10,890 issued, due Oct 31.", date: "May 16, 2026", time: "10:30 AM" },
    ],
  }),

  "02 · Just wait — schedule-only re-check": () => ({
    note: "The single most common output: schedule_task alone = 51% of all plans. How does 'wait and re-check' register as real work?",
    customer: "Meridian Group",
    future: [
      { kind: "scheduled_task", prompt: "Re-check XXA2415 on Jun 12. If still unpaid and no customer reply, send the next dunning follow-up.", invoice: "XXA2415", date: "Jun 12, 2026", time: "8:00 AM" },
    ],
    proposed: [
      { kind: "schedule_task", desc: "Re-check XXA2415 on Jun 12; if unpaid and no reply, send the next follow-up", invoice: "XXA2415" },
    ],
    happened: [
      email({ direction: "out", senderType: "agent", subject: "Re: invoice XXA2415", body: "Hi Dana — resending XXA2415 with PO 12345 applied. Let me know if you need anything else.", flags: { opened: true }, date: "Jun 5, 2026", time: "11:00 AM" }),
      exec("Agent updated PO + scheduled re-check", "Applied PO 12345, updated billing contact, scheduled a re-check for Jun 12.", "Jun 5, 2026", "10:58 AM"),
    ],
  }),

  "03 · The pile-up — many events, one plan": () => ({
    note: "One plan = the sum of agent reasoning across W-9 ask → promise-to-pay → ACH failure → angry reply. User must see ALL feeding events.",
    customer: "Meridian Group",
    needsYou: "If you think the contract end-date dispute is genuinely live, route it to the account owner before I send.",
    future: [
      { kind: "scheduled_task", prompt: "If ACH still failed or no reply by Jun 12, escalate to account owner.", invoice: "XXA2415", date: "Jun 12, 2026", time: "9:00 AM" },
    ],
    proposed: [
      { kind: "send_email", desc: "Send the requested W-9 to Dana Reed", invoice: "XXA2415", cites: ["w9"] },
      { kind: "send_email", desc: "Acknowledge the contract-end-date concern; clarify the period billed", invoice: "XXA2415", cites: ["dispute"] },
      { kind: "send_email", desc: "Provide a fresh payment link (prior ACH failed)", invoice: "XXA2415", cites: ["ach", "ptp"] },
      { kind: "mark_pending", desc: "Hold reminders 5 days while the above resolves", invoice: "XXA2415", cites: ["ptp", "dispute"] },
    ],
    happened: [
      email({ id: "dispute", senderName: CUST.name, org: CUST.org, subject: "Re: invoice XXA2415", body: "Our contract was effective through April 30 — why are we being billed for this period? This needs to be sorted before we pay.", flags: { opened: true }, date: "Jun 4, 2026", time: "4:12 PM" }),
      { id: "ach", kind: "payment_failed", invoice: "XXA2415", amount: "$10,890", reasonCode: "R01", reasonText: "Insufficient funds", date: "Jun 3, 2026", time: "2:20 AM" },
      { id: "ptp", kind: "ptp_logged", invoice: "XXA2415", details: "Customer committed to pay by Jun 2 via ACH.", date: "May 28, 2026", time: "10:05 AM" },
      email({ id: "w9", senderName: CUST.name, org: CUST.org, subject: "W-9 request", body: "Please send a W-9 before we can process payment. Thanks, Dana", flags: { opened: true }, date: "May 24, 2026", time: "1:40 PM" }),
    ],
  }),

  "04 · Escalated — dispute + sensitive relationship": () => ({
    note: "Two escalation types coexist (relationship-sensitive AND invoice dispute). Agent proceeds with caution, proposes routing not sends.",
    customer: "Meridian Group",
    escalated: true,
    needsYou: "Open dispute + churn risk. Mark resolved only from this page after you've reviewed.",
    future: [],
    proposed: [
      { kind: "escalate", desc: "Notify Priya (AE) — open dispute + churn risk. Mark resolved only from this page.", cites: ["disp"] },
      { kind: "mark_pending", desc: "Hold all automated reminders until the dispute clears", invoice: "XXA2415", cites: ["disp"] },
      { kind: "send_email", desc: "Draft (needs review): acknowledge dispute, request proof-of-delivery thread — do not auto-send", invoice: "XXA2415", cites: ["disp"] },
    ],
    happened: [
      email({ id: "disp", senderName: CUST.name, org: CUST.org, subject: "Re: past due XXA2415", body: "We dispute this charge — these services were never delivered. Frankly, we may not renew. Please stop the reminders.", flags: { opened: true }, date: "Jun 2, 2026", time: "3:30 PM" }),
      email({ direction: "out", senderType: "system", systemKind: "dunning", subject: "Second notice — XXA2415 past due", body: "Invoice XXA2415 remains past due. Full statement attached.", flags: { opened: true }, date: "May 28, 2026", time: "8:00 AM" }),
      exec("Agent flagged account high-risk", "Two unanswered reminders; flagged for review.", "May 27, 2026", "6:15 PM"),
    ],
  }),

  "05 · False engagement — all noise": () => ({
    note: "The thread looks busy but every reply is non-human: auto-ack, a bot, an OOO responder, our own collector. Activity ≠ engagement.",
    customer: "Meridian Group",
    future: [
      { kind: "scheduled_task", prompt: "Re-check after the OOO end date (Jun 16); only then send a fresh follow-up to a live contact.", invoice: "XXA2415", date: "Jun 16, 2026", time: "8:00 AM" },
    ],
    proposed: [
      { kind: "schedule_task", desc: "Wait past the auto-responder return date (Jun 16) before any further send", invoice: "XXA2415" },
    ],
    happened: [
      email({ senderType: "other", senderName: "Mailer Daemon (auto-reply)", subject: "Out of office", body: "Out of office until Jun 16. This inbox is unmonitored.", date: "Jun 5, 2026", time: "5:01 PM" }),
      email({ senderType: "other", senderName: "Zendesk (bot)", subject: "Request received — #88231", body: "Your request has been received. Ticket #88231 created.", date: "Jun 4, 2026", time: "11:22 AM" }),
      email({ senderType: "other", senderName: "Coupa AP Portal", subject: "Invoice received into AP", body: "Invoice received into the AP queue. No action required.", date: "Jun 3, 2026", time: "9:00 AM" }),
      email({ direction: "out", senderType: "merchant", senderName: MERCH.name, org: MERCH.org, subject: "Chasing payment", body: "Just following up on the outstanding balance for Meridian. — Carl", flags: { opened: true }, date: "Jun 2, 2026", time: "4:30 PM" }),
    ],
  }),

  "06 · Conflicting invoice states (4 invoices)": () => ({
    note: "One customer, four open invoices in contradictory states at once. ~$320k in play. How does one page hold four conflicting states clearly?",
    customer: "Oscilar",
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
      email({ senderName: CUST.name, org: "Oscilar", subject: "Re: INV-102", body: "The tax line on INV-102 is wrong — please correct before we pay.", flags: { opened: true }, date: "Jun 2, 2026", time: "2:00 PM" }),
      email({ direction: "out", senderType: "system", systemKind: "dunning", subject: "INV-104 past due", body: "Invoice INV-104 is past due. Please remit at your earliest convenience.", flags: { opened: true, clicked: true }, date: "May 30, 2026", time: "8:00 AM" }),
    ],
  }),

  "07 · Unverified payment — paid by check": () => ({
    note: "Customer claims payment but the agent can't confirm it cleared. Agent paused dunning on the claim and asks how to proceed rather than acting.",
    customer: "Meridian Group",
    needsYou: "Agent recommends HOLDING dunning until payment is confirmed. Won't act until you direct it.",
    future: [
      { kind: "scheduled_task", prompt: "If nothing clears by Jun 14, resurface to the user.", invoice: "XXA2415", date: "Jun 14, 2026", time: "9:00 AM" },
    ],
    proposed: [
      { kind: "escalate", desc: "Needs your call — agent recommends HOLDING dunning until payment is confirmed.", cites: ["s3", "s2", "s1"] },
      { kind: "send_email", desc: "Draft: request check image / wire confirmation to verify", invoice: "XXA2415", cites: ["s3"] },
    ],
    happened: [
      email({ id: "s3", senderName: CUST.name, org: CUST.org, subject: "Re: XXA2415", body: "Actually we'll rewire it — please disregard the check. (3rd change of story)", flags: { opened: true }, date: "Jun 5, 2026", time: "10:10 AM" }),
      email({ id: "s2", senderName: CUST.name, org: CUST.org, subject: "Re: XXA2415", body: "We put a stop payment on the check, sorry.", flags: { opened: true }, date: "Jun 3, 2026", time: "4:45 PM" }),
      email({ id: "s1", senderName: CUST.name, org: CUST.org, subject: "Payment sent", body: "This was paid by check #38016 last week.", flags: { opened: true }, date: "May 30, 2026", time: "1:00 PM" }),
      { kind: "dunning_paused", invoice: "XXA2415", details: "Paused pending payment verification on the check claim.", date: "May 30, 2026", time: "1:05 PM" },
    ],
  }),

  "08 · Work on a paid invoice": () => ({
    note: "Invoice settled ($0 balance) but there's still real work: a W-9 ask and a contact change. Does a paid invoice vanish, or keep surfacing asks?",
    customer: "Meridian Group",
    future: [],
    proposed: [
      { kind: "send_email", desc: "Send the signed W-9 to the requesting contact (needs review)", invoice: "XXA2415" },
    ],
    happened: [
      exec("Agent updated billing contact (auto)", "Auto-executed under policy: main billing contact → ap@meridiangroup.com.", "Jun 5, 2026", "11:32 AM"),
      email({ senderName: CUST.name, org: CUST.org, subject: "Re: paid — couple asks", body: "Now that this is paid — can you send a W-9 and update our billing contact to ap@meridiangroup.com?", flags: { opened: true }, date: "Jun 5, 2026", time: "11:30 AM" }),
      { kind: "payment_applied", invoice: "XXA2415", amount: "$10,890", details: "Payment applied; balance now $0.00.", date: "Jun 3, 2026", time: "2:04 PM" },
    ],
  }),

  "09 · Can't-do-it — route & draft only": () => ({
    note: "Customer wants a card charge reversed; the agent can't reverse charges or issue credits. It must honestly propose a draft + a route.",
    customer: "Taktile",
    future: [
      { kind: "scheduled_task", prompt: "Confirm billing actioned the reversal; follow up on ACH.", invoice: "INV-4347", date: "Jun 13, 2026", time: "9:00 AM" },
    ],
    proposed: [
      { kind: "send_email", desc: "Draft (needs review): acknowledge the fee concern, confirm ACH path — do not promise a reversal", invoice: "INV-4347" },
      { kind: "escalate", desc: "Hand the reversal request to billing — outside agent capability" },
      { kind: "billing_invoice_update", desc: "Reverse card charge", invoice: "INV-4347", unavailable: true },
    ],
    happened: [
      email({ senderName: "Sam Okafor", org: "Taktile", subject: "Reverse the card charge", body: "Please reverse the $42,436 card charge — there was an unexpected $1,236 fee. We'll pay by ACH instead.", flags: { opened: true }, date: "Jun 4, 2026", time: "3:15 PM" }),
      { kind: "payment_failed", invoice: "INV-4347", amount: "$42,436", reasonCode: "card_declined", reasonText: "Reversal requested by customer", date: "Jun 4, 2026", time: "3:20 PM" },
      { kind: "agent_executed", action: "Agent captured card payment", details: "Card charge of $42,436 captured, incl. $1,236 processing fee.", date: "Jun 1, 2026", time: "9:00 AM" },
    ],
  }),

  "10 · Mixed-verdict 4-action plan": () => ({
    note: "A 4-action plan across three invoices: verify a cash-app match, send a reminder, update a PO, change a contact. Approve some, reject one, edit one.",
    customer: "APIsec",
    future: [
      { kind: "scheduled_task", prompt: "L.A. Care INV-9002 is 267 days past due — if no reply after reminder, escalate / give up loop.", invoice: "INV-9002", date: "Jun 14, 2026", time: "9:00 AM" },
    ],
    proposed: [
      { kind: "match_transactions", desc: "Match the $410k incoming payment to Sun Life INV-9001", invoice: "INV-9001", cites: ["pay"] },
      { kind: "send_email", desc: "Dunning follow-up on L.A. Care INV-9002 (edit copy before sending)", invoice: "INV-9002", cites: ["broke"] },
      { kind: "update_po", desc: "Set PO on Trace3 INV-9003 to 778812", invoice: "INV-9003", cites: ["po"] },
      { kind: "update_contacts", desc: "Change contact on Sun Life — likely reject, looks stale", invoice: "INV-9001" },
    ],
    happened: [
      { id: "pay", kind: "payment_applied", invoice: "INV-9001", amount: "$410,000", details: "ACH received; proposed match to Sun Life INV-9001 (unverified).", date: "Jun 4, 2026", time: "7:45 AM" },
      email({ id: "po", senderName: "Trace3 AP", org: "Trace3", subject: "PO going forward", body: "Use PO 778812 going forward on all invoices.", flags: { opened: true }, date: "Jun 3, 2026", time: "2:30 PM" }),
      { id: "broke", kind: "ptp_broken", invoice: "INV-9002", details: "Prior promise to pay lapsed; no response since.", date: "May 18, 2026", time: "12:00 AM" },
    ],
  }),

  "11 · Paused — customer on lockdown": () => ({
    note: "Full kill switch: all dunning, outbound, and agent activity are off until a human unpauses. A hard STOP, obviously different from quiet-but-healthy.",
    customer: "Meridian Group",
    paused: true,
    future: [],
    proposed: [],
    happened: [
      { kind: "agent_paused", details: "“Customer is on lockdown until further notice.” Paused all agent activity.", date: "Jun 5, 2026", time: "9:15 AM" },
      email({ senderName: "CFO", org: CUST.org, subject: "Account on hold", body: "Please halt all communications about our account until further notice.", flags: { opened: true }, date: "Jun 4, 2026", time: "4:50 PM" }),
      exec("Agent sent statement of account", "Last plan executed before the pause.", "Jun 2, 2026", "8:00 AM"),
    ],
  }),

  "12 · Quiet but healthy — a month on autopilot": () => ({
    note: "A month of autopilot: most plans were re-checks that resolved themselves; a couple sends auto-executed. Nothing needs you — the healthy state, not empty.",
    customer: "Meridian Group",
    future: [
      { kind: "planned_email", subject: "Payment reminder — XXA2231", to: CUST.email, sequenceStep: "Reminder 1 of 4", anchorLabel: "On due date", invoice: "XXA2231", date: "Jun 20, 2026", time: "8:00 AM" },
      { kind: "scheduled_task", prompt: "Routine re-check of INV-2231; no action unless still unpaid.", invoice: "INV-2231", date: "Jun 16, 2026", time: "8:00 AM" },
    ],
    proposed: [],
    happened: [
      { kind: "payment_applied", invoice: "INV-2230", amount: "$22,400", details: "Paid in full; auto-closed.", date: "Jun 4, 2026", time: "10:00 AM" },
      exec("Agent sent reminder (auto)", "Auto-executed under policy: routine reminder on INV-2231.", "Jun 1, 2026", "8:00 AM"),
      exec("Agent ran scheduled task (auto)", "Re-check fired; rescheduled, nothing due.", "May 18, 2026", "8:00 AM"),
    ],
  }),
};
const KEYS = Object.keys(SCENARIOS);

// ---- instant-context blurb per scenario (the agent-written brief) ----
const CONTEXT = {
  "00 · Canonical reference (all item types)": "Reference scenario for design review — one of each canonical item in every region.",
  "01 · Single action — reply & resend": "Meridian asked to apply PO 12345 to XXA2415 ($10,890) and resend it. No dispute, balance still outstanding. One action covers it.",
  "02 · Just wait — schedule-only re-check": "Invoice resent with PO applied; no reply yet and nothing overdue enough to act on. The only move is to wait and re-check.",
  "03 · The pile-up — many events, one plan": "Since your last review four things stacked up on XXA2415: a W-9 ask, a promise to pay, a failed ACH attempt, and a reply pushing back that “contract was effective through April 30.” Net: still unpaid, payment blocked, billing-period question open.",
  "04 · Escalated — dispute + sensitive relationship": "Customer formally disputes XXA2415 claiming services were never delivered, and the thread has turned tense (hinting at non-renewal). Agent is proposing routing, not sends.",
  "05 · False engagement — all noise": "Lots of recent thread activity, but none is the customer engaging: an AP-portal ack, a ticketing bot, an OOO auto-reply, and our own collector chasing. No human has responded.",
  "06 · Conflicting invoice states (4 invoices)": "Oscilar has 4 open invoices in different states at once: INV-101 paid-pending, INV-102 disputed (tax), INV-103 current, INV-104 in active dunning. Total open ≈ $320,000.",
  "07 · Unverified payment — paid by check": "Customer says XXA2415 was “paid by check #38016,” but no payment posted and the claim shifted twice (check → stop payment → will rewire). Agent paused dunning and is asking how to proceed.",
  "08 · Work on a paid invoice": "XXA2415 is fully paid ($0 balance). After payment the customer asked for a W-9 and a billing-contact change. The contact change auto-executed; the W-9 send needs review.",
  "09 · Can't-do-it — route & draft only": "Taktile wants the $42,436 card charge reversed over an unexpected $1,236 fee and will pay by ACH instead. The agent can't reverse a charge — only draft a reply and route to billing.",
  "10 · Mixed-verdict 4-action plan": "APIsec spans three invoices and needs a 4-action plan: verify a cash-app match, send a reminder, update a PO, and change a contact. Expect to approve some, reject one, edit one.",
  "11 · Paused — customer on lockdown": "The collections agent is fully paused for this customer — all dunning, outbound, and agent activity are off until someone unpauses. Nothing is scheduled.",
  "12 · Quiet but healthy — a month on autopilot": "You let the agent run for a month. Most plans were re-checks that resolved themselves; a couple of sends auto-executed. Nothing needs your review right now.",
};

// ============================================================
//  STATE
// ============================================================
let key = KEYS[0];
let data = SCENARIOS[key]();
let tab = "actions";
let settingsOpt = 0;
let openEmail = null;          // index of expanded activity email
let openCite = null;           // "actionIdx:eventId" of expanded citation (per-action mode)
let byId = {};                 // event id -> happened event (per scenario)
let linkMode = "below";        // how actions link to events: below | per | footnotes | trace
let traceSel = null;           // {type:'action',i} | {type:'event',id} for trace mode
const drawers = { compose: false, instruct: false };

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

// ---- chronological helpers ----
function parseWhen(o){ const d = new Date(`${o.date} ${o.time||"12:00 AM"}`); return isNaN(d) ? 0 : d.getTime(); }
function sortDesc(arr){ return [...arr].sort((a,b)=>parseWhen(b)-parseWhen(a)); }
function sortAsc(arr){ return [...arr].sort((a,b)=>parseWhen(a)-parseWhen(b)); }

// short label for a cited event (the chip text)
function citeLabel(e){
  if (!e) return "missing event";
  if (e.kind === "email"){
    const arrow = e.direction === "out" ? "↗" : "✉";
    const who = e.senderName || (e.senderType==="agent"?"Agent":e.senderType==="system"?"System":"Customer");
    return `${arrow} “${e.subject||"(no subject)"}” · ${who} · ${e.date}`;
  }
  if (e.kind === "agent_executed") return `⚙ ${e.action} · ${e.date}`;
  return `• ${HAPPENED[e.kind]||e.kind}${e.invoice?` (${e.invoice})`:""} · ${e.date}`;
}
// full content shown when a citation chip is expanded
function citeBody(e){
  if (!e) return "(event not found)";
  if (e.kind === "email"){
    const who = e.senderName || (e.senderType==="agent"?"Collections agent":"Customer");
    return `${who}${e.org?` · ${e.org}`:""} — ${e.date} ${e.time||""}\n\n${e.body||"(no body)"}`;
  }
  const meta = [e.invoice, e.amount, e.reasonText, e.details].filter(Boolean).join(" · ");
  return `${HAPPENED[e.kind]||e.kind} — ${e.date} ${e.time||""}\n${meta}`;
}

// who-is-acting tag for an activity row
function actorOf(e){
  if (e.kind === "email"){
    if (e.direction === "out" && e.senderType === "agent") return ["agent","Agent"];
    if (e.direction === "out" && e.senderType === "system") return ["system","System"];
    if (e.direction === "out" && e.senderType === "merchant") return ["user","You"];
    if (e.senderType === "other") return ["system","Auto"];
    return ["cust","Customer"];
  }
  if (e.kind === "agent_executed" || e.kind.startsWith("agent_") || e.kind.startsWith("dunning_")) return ["agent","Agent"];
  return ["event","Event"];
}

// ============================================================
//  HEADER BAND
// ============================================================
function invStatusFor(e){
  if (e.kind === "payment_applied") return "paid";
  if (e.kind === "payment_failed" || e.kind === "ptp_broken") return "overdue";
  if (e.kind === "dunning_paused") return "pending";
  if (e.kind === "email" && /dispute|wrong|never delivered/i.test(e.body||"")) return "disputed";
  return null;
}
function renderBand(){
  $("custName").textContent = data.customer || "Customer";
  let ctx = esc(CONTEXT[key] || data.note || "");
  if (data.paused)    ctx = "⏸ PAUSED — " + ctx;
  if (data.escalated) ctx = "⚠︎ ESCALATED — " + ctx;
  if (data.needsYou)  ctx += `<span class="needs">→ Needs you: ${esc(data.needsYou)}</span>`;
  $("ctx").innerHTML = ctx;

  // derive a light invoice/status list from everything referenced
  const map = {};
  [...(data.proposed||[]), ...(data.future||[])].forEach(x=>{ if(x.invoice && !map[x.invoice]) map[x.invoice]="open"; });
  (data.happened||[]).forEach(e=>{ if(e.invoice){ const s=invStatusFor(e); if(s) map[e.invoice]=s; else if(!map[e.invoice]) map[e.invoice]="open"; }});
  const rows = Object.keys(map);
  $("invList").innerHTML = rows.length
    ? rows.map(inv=>`<div class="inv-row"><span>${esc(inv)}</span><span class="st ${map[inv]}">${map[inv]}</span></div>`).join("")
    : `<div class="inv-row"><span style="color:var(--helper)">No open invoices referenced</span></div>`;
}

// ============================================================
//  TAB: ACTIONS
// ============================================================
// the union of events cited anywhere in this plan, chronological, numbered
function citedEvents(){
  const ids = [];
  (data.proposed||[]).forEach(a=>(a.cites||[]).forEach(id=>{ if(!ids.includes(id)) ids.push(id); }));
  return ids.map(id=>byId[id]).filter(Boolean).sort((a,b)=>parseWhen(a)-parseWhen(b));
}
function shortEvt(e){
  if (e.kind === "email") return `“${e.subject||"(no subject)"}” — ${e.senderName||"Customer"}, ${e.date}`;
  if (e.kind === "agent_executed") return `${e.action}, ${e.date}`;
  return `${HAPPENED[e.kind]||e.kind}${e.invoice?` (${e.invoice})`:""}, ${e.date}`;
}
// the numbered event list (footnotes + trace modes)
function renderStrip(evs, numOf){
  const trace = linkMode === "trace";
  const rows = evs.map(e=>{
    let cls = "ev";
    if (trace && traceSel){
      const hot = traceSel.type === "event" ? traceSel.id === e.id
                : (data.proposed[traceSel.i].cites||[]).includes(e.id);
      cls += hot ? " hot" : " dim";
    }
    return `<div class="${cls}" ${trace?`data-ev="${e.id}"`:""}>
        <span class="num">${numOf[e.id]}</span><span class="et">${esc(shortEvt(e))}</span></div>`;
  }).join("");
  const hint = trace ? `<div class="hint">Tap an event — or an action — to trace the link between them.</div>` : "";
  return `<div class="evstrip ${trace?"trace":""}"><div class="h">What I'm responding to</div>${rows}${hint}</div>`;
}
function renderFootnote(a, numOf){
  if (!a.cites || !a.cites.length) return `<div class="fn fn-none">agent's own judgment — no specific trigger</div>`;
  const nums = a.cites.map(id=>numOf[id]).filter(Boolean).sort((x,y)=>x-y);
  return `<div class="fn">responding to ${nums.map(n=>`<span class="n">${n}</span>`).join("")}</div>`;
}

function renderActions(){
  const p = data.proposed || [];
  let html = `<div class="panel-head">
      <h3>Proposed actions</h3>
      <span class="sub">${p.length} in this plan</span>
      <div class="acts">
        <button class="linkbtn" data-act="compose">New email</button>
        <button class="linkbtn ${data.paused?'':'warn'}" data-act="pause">${data.paused?"Resume agent":"Pause agent"}</button>
        <button class="linkbtn" data-act="instruct">Give agent instruction</button>
      </div>
    </div>`;

  if (drawers.compose) html += drawerCompose();
  if (drawers.instruct) html += drawerInstruct();

  if (!p.length){
    return html + `<div class="empty">${data.paused
      ? "Agent is paused for this customer. No plan will be proposed until someone resumes it."
      : "Nothing needs you right now. The agent is on autopilot — recent plans resolved themselves or auto-executed under policy."}</div>`;
  }

  const hasCites = p.some(a=>a.cites && a.cites.length);
  if (hasCites){
    html += `<div class="moderow"><div class="modes">
      <button class="${linkMode==='below'?'on':''}" data-mode="below">Events below</button>
      <button class="${linkMode==='per'?'on':''}" data-mode="per">Per-action chips</button>
      <button class="${linkMode==='footnotes'?'on':''}" data-mode="footnotes">Footnotes</button>
      <button class="${linkMode==='trace'?'on':''}" data-mode="trace">Trace (tap to link)</button>
    </div></div>`;
  }

  const evs = hasCites ? citedEvents() : [];
  const numOf = {}; evs.forEach((e,idx)=>numOf[e.id]=idx+1);
  if (hasCites && (linkMode==="footnotes" || linkMode==="trace")) html += renderStrip(evs, numOf);

  p.forEach((a,i)=>{
    const unavail = a.unavailable;
    let cls = "card" + (unavail?" unavail":"");
    if (linkMode==="trace" && traceSel){
      const related = traceSel.type === "action" ? traceSel.i === i
                    : (a.cites||[]).includes(traceSel.id);
      cls += related ? " sel" : " dim";
    }
    let footer = "";
    if (hasCites){
      if (linkMode==="per")        footer = renderCites(a, i);
      else if (linkMode==="footnotes") footer = renderFootnote(a, numOf);
    }
    html += `<div class="${cls}" data-card="${i}">
        <div class="k">Proposed action ${i+1}${unavail?`<span class="badge cant">agent can't do this yet</span>`:``}</div>
        <div class="t">${esc(PROPOSED[a.kind]||a.kind)}</div>
        <div class="d">${esc(a.desc)}</div>
        <div class="meta">${a.invoice?`<span>Invoice ${esc(a.invoice)}</span>`:``}<span>${unavail?"routed instead":(linkMode==="trace"?"tap to trace · review to act":"tap to review · accept / edit / reject")}</span></div>
        ${footer}
      </div>`;
  });

  // "Events below": one shared block under the whole plan, each event fully expanded
  if (hasCites && linkMode==="below"){
    const rows = evs.map(renderEventFull).join("");
    html += `<div class="evstrip below"><div class="h">${evs.length} events behind this plan</div>${rows}</div>`;
  }
  return html;
}

// a fully-expanded event (the actual evidence — email body, payment detail, etc.)
function renderEventFull(e){
  const who = e.kind==="email" ? (e.senderName || (e.senderType==="agent"?"Collections agent":e.senderType==="system"?"System":"Customer")) : (HAPPENED[e.kind]||e.kind);
  const dir = e.kind==="email" ? (e.direction==="out" ? "Sent" : "Received") : "";
  const head = `<div class="ev-head"><span>${esc(who)}${e.org?` · ${esc(e.org)}`:""}</span><span class="ev-kind">${esc(dir||(e.invoice?`Invoice ${e.invoice}`:""))} · ${esc(e.date)} ${esc(e.time||"")}</span></div>`;
  let body;
  if (e.kind==="email"){
    body = `<div class="ev-subj">${esc(e.subject||"(no subject)")}</div><div class="ev-body">${esc(e.body||"(no body)")}</div>`;
  } else {
    const meta = [e.amount, e.reasonText, e.details].filter(Boolean).map(esc).join("\n");
    body = `<div class="ev-body">${meta||"—"}</div>`;
  }
  return `<div class="ev-full">${head}${body}</div>`;
}

// the low-fi citation row: which logged events this action is responding to
function renderCites(a, i){
  if (!a.cites || !a.cites.length) return "";
  const verb = a.kind === "send_email" ? "Replying to" : "Responding to";
  let chips = a.cites.map(id=>{
    const e = byId[id];
    const open = openCite === `${i}:${id}`;
    return `<button class="chip" data-cite="${i}:${id}">${esc(citeLabel(e))}</button>`;
  }).join("");
  let body = "";
  a.cites.forEach(id=>{ if (openCite === `${i}:${id}`) body = `<div class="cite-open">${esc(citeBody(byId[id]))}</div>`; });
  return `<div class="cites"><span class="clab">${verb} →</span>${chips}</div>${body}`;
}

// ============================================================
//  TAB: ACTIVITY  (interleaved agent / customer / event timeline)
// ============================================================
function renderActivity(){
  const items = sortDesc(data.happened || []);
  let html = `<div class="panel-head">
      <h3>Activity</h3><span class="sub">${items.length} events · newest first</span>
      <div class="acts">
        <button class="linkbtn" data-act="compose">New email</button>
      </div>
    </div>`;
  if (drawers.compose) html += drawerCompose();
  if (!items.length){ return html + `<div class="empty">No activity yet.</div>`; }

  html += `<div class="stream">`;
  items.forEach((e,i)=>{
    const [cls,who] = actorOf(e);
    const isEmail = e.kind === "email";
    let lbl, sub;
    if (isEmail){
      const dir = e.direction === "out" ? "→" : "←";
      const name = e.senderName || (e.senderType==="agent"?"Collections agent":e.senderType==="system"?"System":"Customer");
      lbl = `${dir} ${esc(e.subject||"(no subject)")}`;
      sub = `${esc(name)}${e.org?` · ${esc(e.org)}`:""}`;
    } else if (e.kind === "agent_executed"){
      lbl = esc(e.action); sub = esc(e.details||"");
    } else {
      lbl = esc(HAPPENED[e.kind]||e.kind);
      sub = [e.invoice?`Invoice ${e.invoice}`:"", e.amount?e.amount:"", e.reasonText?e.reasonText:"", e.details?e.details:""].filter(Boolean).map(esc).join(" · ");
    }
    const flags = isEmail ? Object.keys(e.flags||{}).filter(f=>e.flags[f]).map(f=>FLAG_LABELS[f]||f) : [];
    html += `<div class="row ${isEmail?'email':''}" ${isEmail?`data-email="${i}"`:""}>
        <div class="when">${esc(e.date)} · ${esc(e.time||"")}</div>
        <div class="who ${cls}">${who}</div>
        <div class="what">
          <div class="lbl">${lbl}</div>
          ${sub?`<div class="sub">${sub}</div>`:""}
          ${flags.length?`<div class="flags">${flags.join(" · ")}</div>`:""}
        </div>
      </div>`;
    if (isEmail && openEmail === i){
      html += `<div class="body-open">${esc(e.body||"(no body)")}</div>`;
    }
  });
  html += `</div>`;
  return html;
}

// ============================================================
//  TAB: SCHEDULED  (future agent actions)
// ============================================================
function renderScheduled(){
  const items = sortAsc(data.future || []);
  let html = `<div class="panel-head">
      <h3>Scheduled</h3><span class="sub">${items.length} upcoming · soonest first</span>
      <div class="acts">
        <button class="linkbtn ${data.paused?'':'warn'}" data-act="pause">${data.paused?"Resume agent":"Pause agent"}</button>
        <button class="linkbtn" data-act="instruct">Give agent instruction</button>
      </div>
    </div>`;
  if (drawers.instruct) html += drawerInstruct();
  if (!items.length){
    return html + `<div class="empty">${data.paused
      ? "Nothing scheduled — the agent is paused."
      : "Nothing scheduled right now."}</div>`;
  }
  html += `<div class="stream">`;
  items.forEach(f=>{
    const isMail = f.kind === "planned_email";
    const lbl = isMail ? `→ ${esc(f.subject)}` : esc(f.prompt);
    const sub = isMail
      ? [`${FUTURE[f.kind]}`, f.sequenceStep, f.anchorLabel, f.to?`to ${f.to}`:""].filter(Boolean).map(esc).join(" · ")
      : [`${FUTURE[f.kind]}`, f.invoice?`Invoice ${f.invoice}`:""].filter(Boolean).map(esc).join(" · ");
    html += `<div class="row">
        <div class="when">${esc(f.date)} · ${esc(f.time||"")}</div>
        <div class="who agent">Agent</div>
        <div class="what"><div class="lbl">${lbl}</div><div class="sub">${sub}</div></div>
      </div>`;
  });
  html += `</div>`;
  return html;
}

// ============================================================
//  TAB: SETTINGS (Global Settings)
// ============================================================
const SET_OPTS = [
  { name: "Agent status",      panel: () => toggleRow("Collections agent", data.paused?"Paused for this customer — no outbound, no plans":"Active — drafting and proposing plans", !data.paused, "agent") },
  { name: "Dunning sequence",  panel: () => `${toggleRow("Automated dunning", data.paused?"Off (agent paused)":"On — reminders fire on schedule", !data.paused, "dunning")}<p>Sequence: <b>Global</b> · Reminder 1–4, anchored to due date. ${data.proposed?.some(a=>a.kind==="mark_pending")?"<br>⚠︎ A proposed action would pause dunning on one invoice.":""}</p>` },
  { name: "Pause / hold",      panel: () => `<p>Two distinct levers:</p>${toggleRow("Pause agent (kill switch)","Stops everything — outbound, plans, scheduled tasks", !data.paused, "agent")}${toggleRow("Pause dunning only","Holds reminders but the agent keeps reading + planning", true, "dunning")}` },
  { name: "Billing contacts",  panel: () => `<p>Primary contact on file:</p><p><b>Dana Reed</b> · finance@meridiangroup.com<br>AP Team · ap@meridiangroup.com</p>` },
  { name: "Escalation",        panel: () => `${toggleRow("Escalation flag", data.escalated?"Flagged — proceed with caution; routed to owner":"Not escalated", data.escalated, "esc")}<p>Escalation is awareness only — the agent keeps working but proposes routing over sends, and pings Slack.</p>` },
  { name: "Notifications",     panel: () => `<p>Where this customer's agent activity is posted:</p><p>Slack <b>#collections</b> · daily digest email<br>Escalations → account owner in real time.</p>` },
];
function toggleRow(title, sub, on, k){
  return `<div class="toggle"><div><div class="tl">${esc(title)}</div><div class="ts">${esc(sub)}</div></div>
    <button class="pill ${on?'on':'off'}" data-toggle="${k}">${on?"ON":"OFF"}</button></div>`;
}
function renderSettings(){
  let html = `<div class="panel-head"><h3>Global settings</h3>
      <div class="acts"><button class="linkbtn" data-act="instruct">Give agent instruction</button></div></div>`;
  if (drawers.instruct) html += drawerInstruct();
  html += `<div class="settings"><div class="sidemenu">`;
  SET_OPTS.forEach((o,i)=>{ html += `<div class="opt ${i===settingsOpt?'active':''}" data-opt="${i}">${esc(o.name)}</div>`; });
  html += `</div><div class="setpanel"><h4>${esc(SET_OPTS[settingsOpt].name)}</h4>${SET_OPTS[settingsOpt].panel()}</div></div>`;
  return html;
}

// ---- low-fi drawers ----
function drawerCompose(){
  return `<div class="drawer"><button class="closex" data-close="compose">close ×</button>
    <h5>New email (low-fi compose)</h5>
    <input value="finance@meridiangroup.com" />
    <input value="Re: your invoice" />
    <textarea rows="3" placeholder="Write or let the agent draft…"></textarea>
    <button class="linkbtn">Send</button> &nbsp; <button class="linkbtn">Ask agent to draft</button></div>`;
}
function drawerInstruct(){
  return `<div class="drawer"><button class="closex" data-close="instruct">close ×</button>
    <h5>Give the agent an instruction</h5>
    <textarea rows="2" placeholder="e.g. also CC their controller and hold dunning a week"></textarea>
    <button class="linkbtn">Send to agent</button></div>`;
}

// ============================================================
//  RENDER + EVENTS
// ============================================================
function renderPanel(){
  const p = $("panel");
  if (tab === "actions")   p.innerHTML = renderActions();
  if (tab === "activity")  p.innerHTML = renderActivity();
  if (tab === "scheduled") p.innerHTML = renderScheduled();
  if (tab === "settings")  p.innerHTML = renderSettings();
  wirePanel();
}
function wirePanel(){
  $("panel").querySelectorAll("[data-card]").forEach(el=>el.onclick=()=>{
    if (linkMode==="trace"){
      const i = +el.dataset.card;
      traceSel = (traceSel && traceSel.type==="action" && traceSel.i===i) ? null : { type:"action", i };
      renderPanel(); return;
    }
    alert("Low-fi: opens the action's editor (send-email editor, schedule form, yes/no, escalate flag) with accept / edit / reject.");
  });
  $("panel").querySelectorAll("[data-cite]").forEach(el=>el.onclick=(ev)=>{
    ev.stopPropagation();
    openCite = (openCite===el.dataset.cite) ? null : el.dataset.cite;
    renderPanel();
  });
  $("panel").querySelectorAll("[data-mode]").forEach(el=>el.onclick=()=>{
    linkMode = el.dataset.mode; traceSel = null; openCite = null; renderPanel();
  });
  $("panel").querySelectorAll("[data-ev]").forEach(el=>el.onclick=(ev)=>{
    ev.stopPropagation();
    const id = el.dataset.ev;
    traceSel = (traceSel && traceSel.type==="event" && traceSel.id===id) ? null : { type:"event", id };
    renderPanel();
  });
  $("panel").querySelectorAll("[data-email]").forEach(el=>el.onclick=()=>{
    const i = +el.dataset.email; openEmail = (openEmail===i)?null:i; renderPanel();
  });
  $("panel").querySelectorAll("[data-act]").forEach(el=>el.onclick=()=>{
    const a = el.dataset.act;
    if (a==="pause"){ data.paused = !data.paused; renderBand(); renderPanel(); return; }
    drawers[a] = !drawers[a]; renderPanel();
  });
  $("panel").querySelectorAll("[data-close]").forEach(el=>el.onclick=()=>{ drawers[el.dataset.close]=false; renderPanel(); });
  $("panel").querySelectorAll("[data-opt]").forEach(el=>el.onclick=()=>{ settingsOpt=+el.dataset.opt; renderPanel(); });
  $("panel").querySelectorAll("[data-toggle]").forEach(el=>el.onclick=()=>{
    const k = el.dataset.toggle;
    if (k==="agent") data.paused = !data.paused;
    if (k==="esc")   data.escalated = !data.escalated;
    renderBand(); renderPanel();
  });
}

function setTab(t){
  tab = t; openEmail = null; openCite = null; traceSel = null;
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active", b.dataset.tab===t));
  renderPanel();
}
function load(k){
  key = k; data = SCENARIOS[k](); openEmail = null; openCite = null; traceSel = null; settingsOpt = 0;
  drawers.compose = drawers.instruct = false;
  byId = {}; (data.happened||[]).forEach(e=>{ if (e.id) byId[e.id] = e; });
  $("scenario").value = k;
  $("scenarioNote").textContent = data.note || "";
  renderBand(); renderPanel();
}

// ---- init ----
(function init(){
  const sel = $("scenario");
  KEYS.forEach(k=>{ const o=document.createElement("option"); o.value=k; o.textContent=k; sel.appendChild(o); });
  sel.onchange = ()=>load(sel.value);
  $("prev").onclick = ()=>{ const i=KEYS.indexOf(key); load(KEYS[(i-1+KEYS.length)%KEYS.length]); };
  $("next").onclick = ()=>{ const i=KEYS.indexOf(key); load(KEYS[(i+1)%KEYS.length]); };
  document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
  // optional deep-link: #s=<1-based index>&tab=<actions|activity|scheduled|settings>
  const h = new URLSearchParams(location.hash.slice(1));
  const si = parseInt(h.get("s"),10);
  load((si>=1 && si<=KEYS.length) ? KEYS[si-1] : KEYS[0]);
  if (["actions","activity","scheduled","settings"].includes(h.get("tab"))) setTab(h.get("tab"));
  if (["below","per","footnotes","trace"].includes(h.get("mode"))){ linkMode = h.get("mode"); renderPanel(); }
  if (h.get("sel")){                                    // e.g. &mode=trace&sel=event:disp or sel=action:0
    const [t,v] = h.get("sel").split(":");
    traceSel = t==="action" ? { type:"action", i:+v } : { type:"event", id:v };
    renderPanel();
  }
  if (h.get("cite")){ openCite = h.get("cite"); renderPanel(); }  // e.g. #s=4&tab=actions&cite=2:ach
})();
