/* ============================================================
   Collections Agent — v4
   Two views: Collections Inbox (worklist table) + Customer detail
   ============================================================ */

// ============================================================
//  ICONS
// ============================================================
const SV = (p) => `<svg viewBox="0 0 16 16" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICON = {
  check: SV('<path d="M3 8.5l3 3 7-7"/>'),
  x: SV('<circle cx="8" cy="8" r="6.2"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5"/>'),
  clip: SV('<path d="M12.5 7.5l-5.5 5.5a3.5 3.5 0 01-5-5l6-6a2 2 0 013 3l-5.5 5.5a.5.5 0 01-.7-.7l5-5"/>'),
  user: SV('<circle cx="8" cy="5" r="2.6"/><path d="M3 14c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5"/>'),
  flagOut: `<svg viewBox="0 0 16 16" width="100%" height="100%"><line x1="3.5" y1="2" x2="3.5" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M3.5 2.5 L12.5 5.5 L3.5 9.5 Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  flagFill: `<svg viewBox="0 0 16 16" width="100%" height="100%"><line x1="3.5" y1="2" x2="3.5" y2="14" stroke="#e8333a" stroke-width="1.5" stroke-linecap="round"/><path d="M3.5 2.5 L12.5 5.5 L3.5 9.5 Z" fill="#e8333a" stroke="#e8333a" stroke-width="1" stroke-linejoin="round"/></svg>`,
};

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
function mdToHtml(t){ return t.trim().split(/\n\n+/).map(p=>`<p>${p.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,' ')}</p>`).join(''); }
function initials(n){ return n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(); }
function entityClass(e){ return {customer:"customer",system:"system",dunning:"system",agent:"agent",merchant:"merchant"}[e]||"system"; }
function entityLabel(ec, override){ return override || {customer:"Customer",system:"System",dunning:"Dunning",agent:"Agent",merchant:"Merchant"}[ec]||"System"; }

// ============================================================
//  DATA
// ============================================================
const WORKLIST = [
  {
    id: "meridian",
    customer: "Meridian Group",
    invoices: ["INV-2241","INV-2243"],
    outstandingAmt: 15890,
    overdueAmt: 10890,
    eventSummary: "Dana requested a W-9 and billing contact update before processing payment",
    proposedActions: ["Send email","Update primary billing contact"],
    escalated: false,
    planStatus: "review",
    lastEvent: "Jun 4, 2026",
  },
];

const SCENARIO = {
  customer: "Meridian Group",
  agentSummary: `**Dana Reed at Meridian Group** replied to the INV-2241 thread with two requests: a signed W-9 before they can process payment, and an update to the billing contact on file to ap@meridiangroup.com.

INV-2241 for **$10,890** is 21 days past due — the prior dunning reminder was opened but no payment followed.

Sending the W-9 and updating the contact are both low-risk actions that should unblock payment. Holding on next dunning steps until these are resolved.`,
  invoices: [
    { num:"INV-2241", due:"Jun 1, 2026", amount:10890, od:21, status:"Overdue" },
  ],
  events: [
    { kind:"invoice_aged",    date:"Apr 25, 2026", time:"12:00 AM", text:"INV-2241 crossed 30 days past due — $10,890", agent:false },
    { kind:"update_po",       date:"May 5, 2026",  time:"10:30 AM", text:"Agent set PO 12345 on INV-2241", agent:true },
    { kind:"update_contacts", date:"May 6, 2026",  time:"9:45 AM",  text:"Agent updated primary billing contact to ap@meridiangroup.com", agent:true },
    { kind:"match_tx",        date:"May 20, 2026", time:"3:10 PM",  agent:true,
      html:`Agent matched payment $10,233.60 from Meridian Group to <a href="#" onclick="return false" style="color:var(--ink);text-decoration:underline">INV-22275</a> (<a href="#" onclick="return false" style="color:var(--ink);text-decoration:underline">→ transaction</a>)` },
    { kind:"ptp_logged",      date:"May 28, 2026", time:"10:05 AM", text:"Promise to pay logged — $10,890 by Jun 2 via ACH", agent:false },
    { kind:"invoice_pending", date:"May 30, 2026", time:"1:05 PM",  text:"INV-2241 moved to pending and dunning paused: customer says payment sent", agent:true },
    { kind:"invoice_resumed", date:"Jun 1, 2026",  time:"8:00 AM",  text:"INV-2241 moved back to overdue and dunning resumed: payment not confirmed", agent:true },
    { kind:"payment_failed",  date:"Jun 1, 2026",  time:"11:42 PM", text:"Payment failed — $10,890 on INV-2241 (R01 insufficient funds)", agent:false },
    { kind:"scheduled_task",  date:"Jun 2, 2026",  time:"9:00 AM",  text:"Agent confirmed INV-2241 hadn't been paid by the PTP date and drafted a follow-up", agent:true },
    { kind:"payment_applied", date:"Jun 2, 2026",  time:"11:30 AM", text:"Payment applied — $5,500 to INV-2241 ($5,390 remaining)", agent:false },
    { kind:"ptp_broken",      date:"Jun 2, 2026",  time:"12:00 AM", text:"Promise to pay broken — $10,890 due Jun 2, not received", agent:false },
    { kind:"credit_memo",     date:"Jun 3, 2026",  time:"10:00 AM", agent:true,
      html:`Credit memo $415 created and applied to <a href="#" onclick="return false" style="color:var(--ink);text-decoration:underline">INV-8826</a> (<a href="#" onclick="return false" style="color:var(--ink);text-decoration:underline">→ view memo</a>)` },
    { kind:"escalated",       date:"Jun 3, 2026",  time:"2:30 PM",  text:"Agent marked customer as escalated: customer threatened to churn", agent:true },
    { kind:"invoice_voided",  date:"Jun 4, 2026",  time:"9:15 AM",  text:"INV-2242 voided (duplicate)", agent:true },
  ],
  scheduled: [
    { type:"agent_task", id:"st1", date:"Jun 10, 2026", time:"9:00 AM",
      prompt:"Re-check if INV-2241 has been paid. If not and there has been no customer reply, send the next dunning follow-up. If they replied, re-plan." },
    { type:"dunning", id:"d1", date:"Jun 12, 2026", time:"8:00 AM",
      step:"Reminder 2 of 4", to:"finance@meridiangroup.com", subject:"Following up — invoice INV-2241 still outstanding" },
    { type:"dunning", id:"d2", date:"Jun 19, 2026", time:"8:00 AM",
      step:"Reminder 3 of 4", to:"finance@meridiangroup.com", subject:"INV-2241 — please remit" },
    { type:"dunning", id:"d3", date:"Jun 26, 2026", time:"8:00 AM",
      step:"Final notice", to:"finance@meridiangroup.com", subject:"Final notice — INV-2241" },
  ],

  // events that triggered these agent actions — email IDs or inline event objects
  newEvents: [
    { type:"email", id:"e3a" },
    { type:"email", id:"e3b" },
    { type:"event", kind:"payment_failed", date:"Jun 1, 2026", time:"11:42 PM",
      text:"Payment failed — $10,890 on INV-2241 (R01 insufficient funds)", agent:false },
  ],

  proposed: [
    { kind:"update_contacts", desc:"Update primary billing contact → ap@meridiangroup.com", editableContact:"ap@meridiangroup.com" },
    { kind:"send_email", desc:"Reply to Dana Reed with signed W-9 attached, confirm billing contact update", invoice:"INV-2241",
      attachments:[{name:"W-9_GeneralCatalyst.pdf"}],
      draft:{ to:"finance@meridiangroup.com", cc:"ap@meridiangroup.com", subject:"Re: INV-2241 — W-9 + billing contact",
        body:"Hi Dana,\n\nThanks for flagging both — the signed W-9 is attached. I've also updated the billing contact to ap@meridiangroup.com as requested.\n\nLet me know if anything else is needed.\n\nBest,\nPriya Sharma\nGeneral Catalyst",
        attachments:[{name:"W-9_GeneralCatalyst.pdf"}] },
    },
  ],
};

const THREADS = [
  { id:"t1", subject:"INV-2241 — W-9 + billing contact",
    emails:[
      // Invoice send — system/Postmark, engagement data available
      { id:"e1", dir:"out", entity:"system", entityLabel:"Invoice Sent",
        from:{name:"Invoice Sent",email:"billing@generalcatalyst.com"},
        to:[{name:"Dana Reed",email:"finance@meridiangroup.com",badge:"opened"}], cc:[],
        date:"May 1, 2026", time:"10:31 AM",
        body:"Hi Dana,\n\nYour invoice INV-2241 for $10,890 is attached. Payment is due Jun 1, 2026. Please use the link below to pay securely online.\n\nThanks,\nGeneral Catalyst",
        attachments:[{name:"INV-2241.pdf",type:"PDF"}], badges:["opened"] },
      // Agent email — confirms PO applied + billing contact updated
      { id:"e_agent", dir:"out", entity:"agent",
        from:{name:"Collections Agent",email:"billing@generalcatalyst.com"},
        to:[{name:"Dana Reed",email:"finance@meridiangroup.com",badge:"opened"}], cc:[],
        date:"May 6, 2026", time:"11:15 AM",
        body:"Hi Dana,\n\nJust confirming — I've applied PO 12345 to INV-2241 and updated the primary billing contact to ap@meridiangroup.com as requested.\n\nA fresh copy of INV-2241 is attached.\n\nBest,\nGeneral Catalyst Collections",
        attachments:[{name:"INV-2241.pdf",type:"PDF"}], badges:["opened"] },
      // Dunning reminder 1 — Postmark dunning, engagement data available
      { id:"e2", dir:"out", entity:"dunning",
        from:{name:"Dunning",email:"billing@generalcatalyst.com"},
        to:[{name:"Dana Reed",email:"finance@meridiangroup.com",badge:"opened"}], cc:[],
        date:"May 25, 2026", time:"8:00 AM",
        body:"Hi Dana,\n\nJust a reminder that invoice INV-2241 for $10,890 is due in one week on Jun 1. Please let us know if you have any questions.\n\nGeneral Catalyst",
        attachments:[], badges:["opened"] },
      // Priya's personal follow-up — merchant email, NOT via Postmark, no engagement data
      { id:"e_priya", dir:"out", entity:"merchant",
        from:{name:"Priya Sharma",email:"priya@generalcatalyst.com"},
        to:[{name:"Dana Reed",email:"finance@meridiangroup.com",badge:null}], cc:[],
        date:"May 29, 2026", time:"3:20 PM",
        body:"Hi Dana,\n\nJust wanted to follow up personally — let me know if there's anything blocking payment on INV-2241. Happy to hop on a quick call.\n\nPriya",
        attachments:[], badges:[] },
      // Dunning reminder 2 — Postmark dunning, engagement data available
      { id:"e2b", dir:"out", entity:"dunning",
        from:{name:"Dunning",email:"billing@generalcatalyst.com"},
        to:[{name:"Dana Reed",email:"finance@meridiangroup.com",badge:"opened"}], cc:[],
        date:"Jun 2, 2026", time:"8:05 AM",
        body:"Hi Dana,\n\nInvoice INV-2241 for $10,890 was due yesterday and remains unpaid. Please remit at your earliest convenience or reach out if you need assistance.\n\nGeneral Catalyst",
        attachments:[], badges:["opened","clicked"] },
      // Dana email 1 — billing contact request
      { id:"e3a", dir:"in", entity:"customer",
        from:{name:"Dana Reed",email:"finance@meridiangroup.com"},
        to:[{name:"Priya Sharma",email:"billing@generalcatalyst.com",badge:null}], cc:[],
        date:"Jun 4, 2026", time:"2:14 PM",
        body:"Hi,\n\nPlease update our billing contact on file to ap@meridiangroup.com going forward. All invoices and correspondence should go there.\n\nThanks,\nDana",
        attachments:[], badges:[] },
      // Dana email 2 — W-9 request (follow-up on same thread a few minutes later)
      { id:"e3b", dir:"in", entity:"customer",
        from:{name:"Dana Reed",email:"finance@meridiangroup.com"},
        to:[{name:"Priya Sharma",email:"billing@generalcatalyst.com",badge:null}], cc:[],
        date:"Jun 4, 2026", time:"2:18 PM",
        body:"Also — before we can process payment we'll need a signed W-9 from your company. Can you send that over as well?\n\nDana",
        attachments:[], badges:[] },
    ],
    agentReplyDraft:"Hi Dana,\n\nThanks for flagging both — the signed W-9 is attached. I've also updated the billing contact to ap@meridiangroup.com as requested.\n\nA fresh copy of INV-2241 is attached as well. Let me know if anything else is needed.\n\nBest,\nPriya Sharma\nGeneral Catalyst",
  },
];

// ============================================================
//  ROUTING STATE
// ============================================================
let view = "inbox";
let filterOpen = false;
let agentPanelOpen = false;
let activeTab = "actions";
// detail state
let actionState = {};
let editingCard = null;
let editValues = {};
let expandedCard = null;
let threadExpanded = false;
// activity state
let selectedEmailId = null;
let threadOpenEmails = new Set();
let expandedHeaders = new Set();
let showBcc = false;
let attachPickerOpen = false;
let agentEscalated = false;
let agentPaused = false;
// scheduled tab state
let editingTask = null;       // task id being edited
let deletedTasks = new Set(); // task ids deleted this session
let recipientPills = {}; // {actionIdx: {to:[...], cc:[...]}}
let openNewEvents = new Set(); // which new-event email IDs are expanded

const AVAILABLE_ATTACHMENTS = [
  { name:"W-9_GeneralCatalyst.pdf", type:"PDF" },
  { name:"INV-2241.pdf", type:"PDF" },
  { name:"Contract_GC_Meridian_2026.pdf", type:"PDF" },
  { name:"Statement_of_Account_Jun2026.pdf", type:"PDF" },
];
let selectedAttachments = {};

// ============================================================
//  NAV
// ============================================================
let contractsOpen = false;
let prevView = "inbox"; // to return from detail back to correct parent
let invoicingOpen = true;

function renderNav(){
  const needsReview = WORKLIST.filter(r=>r.planStatus==="review").length;
  const badge = needsReview>0 ? `<span class="nav-badge">${needsReview}</span>` : "";
  const inboxActive = view==="inbox" ? " active" : "";

  const html = `
    <div class="nav-item"><span class="ni-label">Overview</span></div>
    <div class="nav-item" data-nav-customers style="cursor:pointer"><span class="ni-label">Customers</span></div>
    <div class="nav-item"><span class="ni-label">Product catalog</span></div>
    <div class="nav-item" data-toggle-contracts style="cursor:pointer">
      <span class="ni-label">Contracts</span>
      <span class="ni-chev">${contractsOpen?"↓":"›"}</span>
    </div>
    ${contractsOpen?`
      <div class="nav-sub">All contracts</div>
      <div class="nav-sub">Agent calibration</div>
      <div class="nav-sub">Renewals</div>
    `:""}
    <div class="nav-item" data-toggle-invoicing style="cursor:pointer">
      <span class="ni-label">Invoicing</span>
      <span class="ni-chev">${invoicingOpen?"↓":"›"}</span>
    </div>
    ${invoicingOpen?`
      <div class="nav-sub">Billing</div>
      <div class="nav-sub">Kanban</div>
      <div class="nav-sub">Credit memos</div>
    `:""}
    <div class="nav-item${inboxActive}" data-nav-inbox style="display:flex;align-items:center;cursor:pointer">
      <span class="ni-label">Collections Inbox</span>${badge}
    </div>
    <div class="nav-item"><span class="ni-label">Usage</span><span class="ni-chev">›</span></div>
    <div class="nav-item"><span class="ni-label">Revenue</span><span class="ni-chev">›</span></div>
    <div class="nav-item"><span class="ni-label">Reporting</span><span class="ni-chev">›</span></div>
    <div class="nav-item"><span class="ni-label">Data</span><span class="ni-chev">›</span></div>`;

  $("rail-nav").innerHTML = html;
  $("rail-nav").querySelector("[data-toggle-contracts]").onclick = ()=>{ contractsOpen=!contractsOpen; renderNav(); };
  const nc = $("rail-nav").querySelector("[data-nav-customers]");
  if(nc) nc.onclick = ()=>{ view="customer"; render(); };
  const ti = $("rail-nav").querySelector("[data-toggle-invoicing]");
  if(ti) ti.onclick = ()=>{ invoicingOpen=!invoicingOpen; renderNav(); };
  $("rail-nav").querySelectorAll("[data-nav-inbox]").forEach(el=>el.onclick=()=>{ view="inbox"; render(); });
}

// ============================================================
//  CUSTOMER PAGE
// ============================================================
function renderCustomer(){
  const link = (title, desc, isAgent=false) =>
    `<div class="cust-link">
      <span class="${isAgent?"cl-title agent":"cl-title"}" ${isAgent?'data-nav-to-detail':""}>${title}</span>
      <p>${desc}</p>
    </div>`;
  return `
    <div class="crumb">Customers <span>›</span> <b>${esc(SCENARIO.customer)}</b></div>
    <div class="cust-page">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px">
        <div>
          <div class="cust-title">${esc(SCENARIO.customer)}</div>
          <div class="cust-meta">CREATED JAN 1, 2026 BY QBO &nbsp;|&nbsp; <a>EXTERNAL ID: MG-4412</a> &nbsp;|&nbsp; EXISTS IN QBO</div>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn" style="padding:7px 14px">↑ Upload contract</button>
          <button class="btn" style="padding:7px 14px">Settings &amp; more</button>
        </div>
      </div>

      <div class="cust-section">
        <div class="cust-section-title">Billing &amp; revenue — adjust line items and modify schedules</div>
        <div class="cust-grid">
          ${link("Billing terms","Billable terms and revenue recognition")}
          ${link("Credit Memos (0)","View credit memos for this customer")}
          ${link("Invoices (1)","Current service period invoices, historical invoices")}
          ${link("Contracts (1)","Contracts, amendments, MSAs, renewals")}
          ${link("Collections Agent","Collections agent status, proposed actions, activity log", true)}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div class="cust-section">
          <div class="cust-section-title">Obligations &amp; relationship management</div>
          <div>
            ${link("Key terms","Contract agreements that are not billed upon")}
            ${link("Renewal","AI-driven insights — Renewal types, dates, values and full audit logs")}
            ${link("Notes (0)","Store notes that help manage the relationship")}
          </div>
        </div>
        <div class="cust-section">
          <div class="cust-section-title">Profile — general invoice information</div>
          <div>
            ${link("Business information","Main contact name and email, additional contacts, billing address")}
            ${link("Additional fields","Department ID, Project name, Sales rep, etc.")}
            ${link("Taxes","Tax exemption status, VAT number, EIN")}
          </div>
        </div>
      </div>
    </div>`;
}

// ============================================================
//  INBOX VIEW
// ============================================================
function fmtMoney(n){ return "$"+n.toLocaleString("en-US",{minimumFractionDigits:2}); }

function renderInbox(){
  const statusLabel = {review:"Needs Review",executing:"Executing",approved:"Approved",rejected:"Rejected"};
  const rows = WORKLIST.map(r=>{
    const invTags = r.invoices.map(i=>`<span class="inv-tag">${esc(i)}</span>`).join("");
    const statusChip = `<span class="plan-chip ${r.planStatus}">${statusLabel[r.planStatus]||r.planStatus}</span>`;
    const flagIcon = `<span style="display:inline-block;width:13px;height:13px;margin-right:6px;vertical-align:middle;opacity:${r.escalated?1:.2}">${r.escalated?ICON.flagFill:ICON.flagOut}</span>`;
    const actLine = r.proposedActions.map(a=>`<div style="font-size:12.5px;color:var(--ink);margin-bottom:2px">${esc(a)}</div>`).join("");
    return `<tr data-customer="${r.id}" style="${r.escalated?"border-left:3px solid #e07c2a":""}">
      <td style="white-space:nowrap">${flagIcon}<span class="cust-name">${esc(r.customer)}</span></td>
      <td>${invTags}</td>
      <td style="font-size:13px">${fmtMoney(r.outstandingAmt||r.overdueAmt)}</td>
      <td><span class="overdue-amt">${fmtMoney(r.overdueAmt)}</span></td>
      <td style="font-size:12.5px;color:var(--helper);max-width:220px;line-height:1.45">${esc(r.eventSummary)}</td>
      <td>${actLine}</td>
      <td>${statusChip}</td>
      <td style="font-size:12.5px;color:var(--helper);white-space:nowrap">${esc(r.lastEvent||"")}</td>
    </tr>`;
  }).join("");

  const filterDropdown = filterOpen ? `<div class="filter-dropdown">
    <div class="filter-option"><span>Latest status</span><span class="fo-chev">›</span></div>
    <div class="filter-option"><span>Escalation</span><span class="fo-chev">›</span></div>
    <div class="filter-option"><span>Total overdue</span><span class="fo-chev">›</span></div>
    <div class="filter-option"><span>Invoice due date</span><span class="fo-chev">›</span></div>
    <div class="filter-option"><span>Last event</span><span class="fo-chev">›</span></div>
    <div class="filter-option"><span>Customer</span><span class="fo-chev">›</span></div>
  </div>` : "";

  return `
    <div class="crumb">Invoicing <span>›</span> <b>Collections Inbox</b></div>
    <div class="inbox-wrap">
      <div class="inbox-head">
        <h1>Collections Inbox</h1>
      </div>
      ${(()=>{
        const n = WORKLIST.filter(r=>r.planStatus==="review").length;
        const openLabel = n===1 ? "customer with open agent actions to review" : "customers with open agent actions to review";
        return `<div class="stat-strip">
          <div class="stat-box">
            <div class="stat-num ${n===0?"zero":""}" style="${n>0?"color:#e8333a":""}">${n}</div>
            <div class="stat-label">${openLabel}</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">8</div>
            <div class="stat-label">agent actions executed this month</div>
          </div>
        </div>`;
      })()}
      <div style="margin-bottom:12px;position:relative;display:inline-block">
        <button class="filter-btn" id="filterBtn">☰ Add filter</button>
        ${filterDropdown}
      </div>
      <table class="inbox-table">
        <thead><tr>
          <th>Customer</th><th>Open invoices</th><th>Total outstanding</th><th>Total overdue</th>
          <th>Event</th><th>Agent actions</th><th>Latest status</th><th>Agent triggered</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// ============================================================
//  DETAIL — helpers
// ============================================================
function threadForEmailId(id){ return THREADS.find(t=>t.emails.some(e=>e.id===id))||null; }
function toMs(d,ti){ return new Date(`${d} ${ti||"12:00 AM"}`).getTime()||0; }

function activityItems(){
  const emails = THREADS.flatMap(t=>t.emails.map(e=>({type:"email",...e,threadId:t.id,threadSubject:t.subject})));
  const events = (SCENARIO.events||[]).map(e=>({type:"event",...e}));
  return [...emails,...events].sort((a,b)=>toMs(b.date,b.time)-toMs(a.date,a.time));
}

function openThread(emailId){
  selectedEmailId = emailId;
  threadOpenEmails = new Set([emailId]);
}
function deepLinkToThread(threadId){
  activeTab = "activity";
  const t = THREADS.find(t=>t.id===threadId); if(!t) return;
  const target = [...t.emails].reverse().find(e=>e.dir==="in")||t.emails[t.emails.length-1];
  openThread(target.id);
}

// ============================================================
//  SHARED EMAIL CARD
// ============================================================
function renderEmailCard(em, opts={}){
  const ec = entityClass(em.entity);
  const label = entityLabel(ec, em.entityLabel);
  const isHeaderOpen = expandedHeaders.has(em.id);
  const toNames = em.to.map(r=>r.name||r.email).join(", ");
  const ccNames = (em.cc||[]).map(r=>r.name||r.email).join(", ");

  const headerSummary = `<span class="em-to-summary">
    to <span class="to-names">${esc(toNames)}</span>
    ${ccNames?` cc <span class="to-names">${esc(ccNames)}</span>`:""}
    <span class="em-chevron" data-toggle-header="${em.id}">▾</span>
  </span>`;

  const engGrid = isHeaderOpen ? `<div class="eng-grid">
    <table>
      <thead><tr><th class="left">Recipient</th><th>Delivered</th><th>Opened</th><th>Clicked</th><th>Bounced</th><th>Failed</th></tr></thead>
      <tbody>${em.to.map(r=>{
        const o = !!(r.badge==="opened"||em.badges?.includes("opened"));
        const c = !!em.badges?.includes("clicked");
        const b = !!em.badges?.includes("bounced");
        const f = !!em.badges?.includes("failed");
        const chk = v=>v?`<span class="eng-yes">✓</span>`:`<span class="eng-no">—</span>`;
        return `<tr><td class="left">${esc(r.name||r.email)}</td><td>${chk(true)}</td><td>${chk(o)}</td><td>${chk(c)}</td><td>${chk(b)}</td><td>${chk(f)}</td></tr>`;
      }).join("")}</tbody>
    </table>
  </div>` : "";

  const headerDetail = isHeaderOpen ? `<div class="em-header-detail">
    <div class="em-header-grid">
      <span class="hg-label">from</span><span class="hg-val"><strong>${esc(em.from.name)}</strong> &lt;${esc(em.from.email)}&gt;</span>
      <span class="hg-label">to</span><span class="hg-val">${em.to.map(r=>`${esc(r.name)} &lt;${esc(r.email)}&gt;`).join("<br>")}</span>
      ${(em.cc||[]).length?`<span class="hg-label">cc</span><span class="hg-val">${em.cc.map(r=>`${esc(r.name||"")} &lt;${esc(r.email)}&gt;`).join("<br>")}</span>`:""}
      <span class="hg-label">date</span><span class="hg-val">${esc(em.date)} · ${esc(em.time)}</span>
    </div>${engGrid}
  </div>` : "";

  const attach = (em.attachments||[]).length
    ? `<div class="em-card-attach">${em.attachments.map(a=>`<span class="attach-pill">📎 ${esc(a.name)} · ${esc(a.type)}</span>`).join("")}</div>` : "";

  const footer = opts.showThreadLink
    ? `<div class="em-card-footer"><span class="thread-link" data-thread="${opts.threadId}" style="font-size:12.5px;color:var(--helper);cursor:pointer;text-decoration:underline">See entire thread →</span></div>` : "";

  return `<div class="em-card">
    <div class="em-card-head" style="cursor:default">
      <div class="em-head-left">
        <div class="em-name-row">
          <span class="ent-strip ${ec}" style="margin:0">${label}</span>
          <span class="em-name">${esc(em.from.name)}</span>
        </div>
        <span class="em-to-summary">
          to <span class="to-names">${esc(toNames)}</span>
          ${ccNames?` cc <span class="to-names">${esc(ccNames)}</span>`:""}
          <span class="em-chevron" data-header-modal="${em.id}">▾</span>
        </span>
      </div>
      <span class="em-date">${esc(em.date)} · ${esc(em.time)}</span>
    </div>
    <div class="em-card-body">${esc(em.body)}</div>
    ${attach}${footer}
  </div>`;
}

// ============================================================
//  DRAFT EDITOR
// ============================================================
function openComposeModal(){
  if(!recipientPills["compose"]) recipientPills["compose"]={to:[],cc:[]};
  const draft={to:"",cc:"",subject:"",body:"",attachments:[]};
  $("modal").innerHTML=`<div class="scrim" id="composeBg">
    <div class="modal" style="max-width:600px;padding:0;overflow:hidden;border-radius:12px">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--line)">
        <span style="font-size:15px;font-weight:700">Send reminder</span>
        <button class="btn" id="composeClose" style="padding:4px 10px;font-size:13px">×</button>
      </div>
      <div style="padding:16px 18px">${renderDraftEditor(draft,"compose")}</div>
    </div>
  </div>`;
  $("composeClose").onclick=()=>{ $("modal").innerHTML=""; recipientPills["compose"]={to:[],cc:[]}; };
  $("composeBg").onclick=(e)=>{ if(e.target.id==="composeBg"){ $("modal").innerHTML=""; recipientPills["compose"]={to:[],cc:[]}; } };
  // re-wire draft interactions inside modal
  const m=$("modal");
  m.querySelectorAll("[data-pill-input]").forEach(el=>el.onkeydown=(e)=>{
    if(e.key===" "||e.key===","||e.key==="Enter"){ e.preventDefault();
      const val=el.value.trim().replace(/,$/,""); if(!val) return;
      const [idx,field]=el.dataset.pillInput.split(":");
      if(!recipientPills[idx]) recipientPills[idx]={to:[],cc:[]};
      recipientPills[idx][field].push(val); el.value=""; const p=$("panel"); renderPanel(); openComposeModal(); }
  });
  m.querySelectorAll("[data-open-picker]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); attachPickerOpen=attachPickerOpen===el.dataset.openPicker?false:el.dataset.openPicker; $("modal").innerHTML=""; openComposeModal(); });
  m.querySelectorAll("[data-pick-attach]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); const [idx,name]=el.dataset.pickAttach.split(":"); if(!selectedAttachments[idx]) selectedAttachments[idx]=new Set(); selectedAttachments[idx].add(name); attachPickerOpen=false; $("modal").innerHTML=""; openComposeModal(); });
  m.querySelectorAll("[data-rm-attach]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); const [idx,name]=el.dataset.rmAttach.split(":"); if(selectedAttachments[idx]) selectedAttachments[idx].delete(name); $("modal").innerHTML=""; openComposeModal(); });
}

function openEmailHeaderModal(emailId){
  const allEmails = THREADS.flatMap(t=>t.emails);
  const em = allEmails.find(e=>e.id===emailId); if(!em) return;
  const chk = v=>`<span style="color:${v?"var(--ink)":"var(--line)"};font-weight:${v?"700":"400"}">${v?"✓":"—"}</span>`;
  const o = !!(em.badges||[]).includes("opened");
  const c = !!(em.badges||[]).includes("clicked");
  const b = !!(em.badges||[]).includes("bounced");
  const f = !!(em.badges||[]).includes("failed");
  const recipRows = [...em.to,...(em.cc||[])].map(r=>{
    const pf = em.to.includes(r)?"To":"CC";
    return `<tr>
      <td style="padding:5px 10px 5px 0;color:var(--helper);font-size:12px">${pf}</td>
      <td style="padding:5px 10px 5px 0;font-size:13px">${esc(r.name||"")} &lt;${esc(r.email)}&gt;</td>
      <td style="text-align:center;padding:5px 8px">${chk(true)}</td>
      <td style="text-align:center;padding:5px 8px">${chk(o)}</td>
      <td style="text-align:center;padding:5px 8px">${chk(c)}</td>
      <td style="text-align:center;padding:5px 8px">${chk(b)}</td>
      <td style="text-align:center;padding:5px 8px">${chk(f)}</td>
    </tr>`;
  }).join("");
  $("modal").innerHTML=`<div class="scrim" id="hdrBg">
    <div class="modal" style="max-width:520px">
      <div style="display:grid;grid-template-columns:55px 1fr;gap:5px 10px;font-size:13px;margin-bottom:16px">
        <span style="color:var(--helper);font-weight:600;text-align:right">from</span>
        <span><strong>${esc(em.from.name)}</strong> &lt;${esc(em.from.email)}&gt;</span>
        <span style="color:var(--helper);font-weight:600;text-align:right">date</span>
        <span>${esc(em.date)} · ${esc(em.time)}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12.5px">
        <thead><tr>
          <th style="text-align:left;padding:4px 10px 6px 0;color:var(--helper);border-bottom:1px solid var(--line2);font-size:11px"></th>
          <th style="text-align:left;padding:4px 10px 6px 0;color:var(--helper);border-bottom:1px solid var(--line2);font-size:11px">Recipient</th>
          <th style="text-align:center;padding:4px 8px 6px;color:var(--helper);border-bottom:1px solid var(--line2);font-size:11px">Delivered</th>
          <th style="text-align:center;padding:4px 8px 6px;color:var(--helper);border-bottom:1px solid var(--line2);font-size:11px">Opened</th>
          <th style="text-align:center;padding:4px 8px 6px;color:var(--helper);border-bottom:1px solid var(--line2);font-size:11px">Clicked</th>
          <th style="text-align:center;padding:4px 8px 6px;color:var(--helper);border-bottom:1px solid var(--line2);font-size:11px">Bounced</th>
          <th style="text-align:center;padding:4px 8px 6px;color:var(--helper);border-bottom:1px solid var(--line2);font-size:11px">Failed</th>
        </tr></thead>
        <tbody>${recipRows}</tbody>
      </table>
      <div style="display:flex;justify-content:flex-end;margin-top:16px">
        <button class="btn" id="hdrClose">Close</button>
      </div>
    </div>
  </div>`;
  $("hdrClose").onclick=()=>{ $("modal").innerHTML=""; };
  $("hdrBg").onclick=(e)=>{ if(e.target.id==="hdrBg") $("modal").innerHTML=""; };
}

function renderDraftEditor(draft, actionIdx){
  // init recipient pills from draft
  if(!recipientPills[actionIdx]){
    const toList = (draft.to||"").split(",").map(s=>s.trim()).filter(Boolean);
    const ccList = (draft.cc||"").split(",").map(s=>s.trim()).filter(Boolean);
    recipientPills[actionIdx] = {to: toList, cc: ccList};
  }
  const pills = recipientPills[actionIdx];

  // init attachments
  const selAttach = selectedAttachments[actionIdx] || new Set((draft.attachments||[]).map(a=>a.name));
  if(!selectedAttachments[actionIdx]) selectedAttachments[actionIdx] = selAttach;

  const isThread = draft.subject && draft.subject.startsWith("Re:");
  const isReply = actionIdx === "reply";

  // don't show "View thread" when already inside the thread (activity log)
  const threadLink = isThread && actionIdx !== "reply"
    ? `<span class="draft-thread-link thread-link" data-thread="t1">View thread</span>` : "";

  // recipient pill rows
  const pillsHtml = (list, field) => list.map(e=>
    `<span class="email-pill">${esc(e)}<span class="ep-rm" data-rm-pill="${actionIdx}:${field}:${esc(e)}">×</span></span>`
  ).join("") + `<input class="recip-input" placeholder="" data-pill-input="${actionIdx}:${field}">`;

  const subjectClass = isThread ? "subject-input greyed" : "subject-input";
  const subjectTitle = isThread ? 'title="Subject locked for thread replies"' : "";

  const attachPillsHtml = [...selAttach].map(name=>
    `<span class="attach-pill-tag" onclick="window.open('#','_blank')">📎 ${esc(name.split('/').pop())} <span class="ap-rm" data-rm-attach="${actionIdx}:${esc(name)}">×</span></span>`
  ).join("");

  const pickerItems = AVAILABLE_ATTACHMENTS.filter(a=>!selAttach.has(a.name));
  const pickerHtml = String(attachPickerOpen)===String(actionIdx) && pickerItems.length
    ? `<div class="attach-picker">${pickerItems.map(a=>
        `<div class="attach-picker-item" data-pick-attach="${actionIdx}:${esc(a.name)}">${esc(a.name)}</div>`
      ).join("")}</div>` : "";

  const footer = isReply
    ? `<button class="btn" style="padding:6px 16px">Send</button>`
    : `<button class="btn" data-rej="${actionIdx}"><span class="ic">${ICON.x}</span>Reject</button>
       <button class="btn" data-app="${actionIdx}"><span class="ic">${ICON.check}</span>Approve &amp; send</button>`;

  return `<div class="draft-editor">
    ${threadLink}
    <div class="recip-field">
      <span class="recip-label">To</span>${pillsHtml(pills.to,"to")}
    </div>
    <div class="recip-field">
      <span class="recip-label">CC</span>${pillsHtml(pills.cc,"cc")}
    </div>
    <div class="subject-field">
      <span class="subject-label">Subj</span>
      <input class="${subjectClass}" value="${esc(draft.subject||"")}" ${subjectTitle}>
    </div>
    <textarea class="draft-body-area">${esc(draft.body||"")}</textarea>
    <div class="draft-tiny">
      <span data-cancel-draft="${actionIdx}">Cancel</span>
      <span data-save-draft="${actionIdx}">Save</span>
    </div>
    <div class="attach-row" style="position:relative">
      ${attachPillsHtml}
      <span class="attach-add-btn" data-open-picker="${actionIdx}">+ Attachments</span>
      ${pickerHtml}
    </div>
    <div class="draft-footer">${footer}</div>
  </div>`;
}

// ============================================================
//  DETAIL — header
// ============================================================
function renderDetailHeader(){
  const pendingCount = SCENARIO.proposed.filter((_,i)=>!actionState[i]).length;
  const inv = SCENARIO.invoices[0];
  const chip = `<span style="font-size:12px;color:var(--warn);margin-left:5px">(${inv.od}d overdue)</span>`;
  const amt = fmtMoney(inv.amount);
  return `
    <div class="crumb">
      <span class="back" id="backBtn">← ${esc(SCENARIO.customer)}</span>
      <span>›</span> <b>Collections Agent</b>
    </div>
    <div style="padding:14px 22px 6px;display:flex;align-items:center;gap:12px">
      <span style="font-size:17px;font-weight:700">Collections Agent</span>
      <div class="top-actions">
        <button class="btn-icon ${agentEscalated?"flagged":""}" id="flagBtn">
          <span style="width:16px;height:16px;display:block">${agentEscalated?ICON.flagFill:ICON.flagOut}</span>
          <span class="icon-tip">${agentEscalated?"Remove escalation flag":"Flag as escalated"}</span>
        </button>
        <button class="btn-topbar ${agentPaused?"paused":""}" id="pauseBtn">
          ${agentPaused?"▶ Resume Agent":"⏸ Pause Agent"}
          <span class="icon-tip" style="right:0;left:auto">${agentPaused?"Resume: agent will start proposing actions":"Agent won't propose or take any actions on this customer"}</span>
        </button>
        <span class="perms-link" style="margin-left:4px">Agent permissions</span>
      </div>
    </div>
    <section class="finger">
      <div class="left">
        <div class="agent-summary">
          <div class="as-label">Agent Summary</div>
          <div class="as-body">${mdToHtml(SCENARIO.agentSummary)}</div>
        </div>
      </div>
      <div class="right">
        <div class="inv-h">Outstanding Invoices</div>
        <table class="inv">
          <thead><tr><th>Invoice #</th><th>Due</th><th>Status</th><th class="r">Amount</th></tr></thead>
          <tbody>
            <tr><td><a>${esc(inv.num)}</a></td><td>${esc(inv.due)}${chip}</td><td style="font-size:12.5px;color:var(--helper)">${esc(inv.status||"")}</td><td class="r">${amt}</td></tr>
            <tr class="tot"><td colspan="3">Total Outstanding</td><td class="r">${amt}</td></tr>
          </tbody>
        </table>
      </div>
    </section>
    <nav class="tabs">
      <button class="tab ${activeTab==="actions"?"active":""}" data-tab="actions">Actions${pendingCount>0?`<span class="tab-dot"></span>`:""}</button>
      <button class="tab ${activeTab==="activity"?"active":""}" data-tab="activity">Activity</button>
      <button class="tab ${activeTab==="scheduled"?"active":""}" data-tab="scheduled">Scheduled</button>
    </nav>`;
}

// ============================================================
//  DETAIL — actions panel
// ============================================================
function renderNewEventsZone(){
  const defs = SCENARIO.newEvents || [];
  if(!defs.length) return "";
  const allEmails = THREADS.flatMap(t=>t.emails.map(e=>({...e,threadId:t.id})));

  // resolve oldest first — tells the story in order
  const resolved = defs.map(d=>{
    if(d.type==="email"){ const em=allEmails.find(e=>e.id===d.id); return em?{...em,_kind:"email"}:null; }
    return {...d,_kind:"event"};
  }).filter(Boolean).sort((a,b)=>toMs(a.date,a.time)-toMs(b.date,b.time));

  const items = resolved.map(item=>{
    if(item._kind==="email"){
      const isOpen = openNewEvents.has(item.id);
      const preview = item.body.replace(/\s+/g," ").trim();
      const threadLinkHtml = isOpen && item.threadId
        ? `<div style="margin-top:10px"><span class="thread-link" data-thread="${item.threadId}" style="font-size:12.5px;color:var(--blue);cursor:pointer;text-decoration:underline">View thread →</span></div>` : "";
      return `<div class="re-card" data-toggle-ne="${item.id}">
        <div class="re-card-top">
          <span class="re-card-who">${esc(item.from.name)}</span>
          <span class="re-card-date">${esc(item.date)} · ${esc(item.time||"")}</span>
        </div>
        ${isOpen
          ? `<div class="re-card-body">${esc(item.body)}${threadLinkHtml}</div>`
          : `<div class="re-card-preview">${esc(preview)}</div>`}
      </div>`;
    } else {
      return `<div class="re-event-row">
        <span class="${item.agent?"ev-bolt":"ev-dot"}">${item.agent?"⚡":""}</span>
        <span class="re-event-text">${item.html||esc(item.text||"")}</span>
        <span class="re-event-stamp">${esc(item.date)}<br>${esc(item.time||"")}</span>
      </div>`;
    }
  }).join("");

  return `<div class="new-events-zone">
    <div class="proposal-divider" style="margin-top:0">
      <span class="pd-label">What happened</span>
    </div>
    <div class="re-timeline">${items}</div>
  </div>`;
}

function renderActionsPanel(){
  const p = SCENARIO.proposed;
  const pending = p.filter((_,i)=>!actionState[i]).length;
  const pendingLabel = pending>0
    ? `<span class="as-count"><span>${pending}</span> action${pending>1?"s":""} awaiting review ↓</span>`
    : `<span class="as-count" style="color:var(--good)">✓ All actions resolved</span>`;

  let html = renderNewEventsZone();
  const n = p.length;
  html += `<div class="proposal-divider">
    <span class="pd-label">Agent Proposes <span class="pd-count">${n}</span> Action${n!==1?"s":""}</span>
  </div>`;

  p.forEach((a,i)=>{
    const st = actionState[i];
    const isEmail = a.kind==="send_email";
    const isContact = a.kind==="update_contacts" && a.editableContact!=null;
    const isExpContact = expandedCard===i && isContact && !st;
    const isEditing = false; // contacts now use expandedCard pattern like email
    const attachHtml = (a.attachments||[]).map(att=>`<span class="attach-chip">📎 ${esc(att.name)}</span>`).join("");
    let acts="";
    if(st==="approved") acts=`<span class="verdict ok">✓ Approved</span>`;
    else if(st==="rejected") acts=`<span class="verdict no">Rejected</span>`;
    else acts=`<button class="btn" data-rej="${i}"><span class="ic">${ICON.x}</span>Reject</button><button class="btn" data-app="${i}"><span class="ic">${ICON.check}</span>Approve</button>`;
    let contactEdit="";
    if(isContact&&!st){
      const cur = editValues[i]!==undefined?editValues[i]:a.editableContact;
      if(isEditing){
        contactEdit=`<div style="margin-top:10px;display:flex;align-items:center;gap:8px"><span style="font-size:12px;color:var(--helper)">Primary contact</span><input id="ci${i}" value="${esc(cur)}" style="flex:1;border:1px solid var(--blue);border-radius:6px;padding:5px 9px;font-size:13px;font-family:inherit;outline:none"><button class="btn" data-save="${i}" style="padding:5px 12px">Save</button><span style="font-size:12px;color:var(--helper);cursor:pointer" data-canceledit="${i}">Cancel</span></div>`;
        acts="";
      } else {
        const val = editValues[i]!==undefined?editValues[i]:a.editableContact;
        contactEdit=`<span style="font-size:13px;color:#34352f;margin-left:8px">→ ${esc(val)}</span><span style="color:var(--blue);font-size:12px;cursor:pointer;margin-left:8px" data-edit="${i}">Edit</span>`;
      }
    }
    const attachCount = (a.attachments||[]).length;
    const isExpanded = expandedCard===i && isEmail && !st;
    const inlineDraft = isExpanded&&a.draft ? renderDraftEditor(a.draft,i) : "";

    if(isEmail){
      html+=`<div class="card ${st?"done":""}" style="flex-direction:column;align-items:stretch">
        <div class="se-collapsed">
          <div class="body" style="flex:1;min-width:0">
            <span class="title">Send email</span>
            <span class="desc">${esc(a.desc)}</span>
            ${attachCount?`<span class="se-meta">${attachCount} attachment${attachCount>1?"s":""}</span>`:""}
          </div>
          ${st
            ? `<span class="verdict ${st==="approved"?"ok":"no"}">${st==="approved"?"✓ Approved":"Rejected"}</span>`
            : `<button class="btn se-edit" data-expand="${i}">${isExpanded?"Close":"Edit"}</button>
               <button class="btn" data-rej="${i}"><span class="ic">${ICON.x}</span>Reject</button>
               <button class="btn" data-app="${i}"><span class="ic">${ICON.check}</span>Approve</button>`}
        </div>
        ${inlineDraft}
      </div>`;
    } else if(isContact){
      const curVal = editValues[i]!==undefined ? editValues[i] : a.editableContact;
      const contactExpanded = isExpContact ? `
        <div class="draft-editor" style="margin-top:12px">
          <div class="recip-field">
            <span class="recip-label" style="flex:0 0 80px;font-size:12px;font-weight:600;color:var(--helper)">Primary contact</span>
            <input id="ci${i}" value="${esc(curVal)}" style="flex:1;border:none;outline:none;font-size:13px;font-family:inherit;border-bottom:1px solid var(--line2);padding:4px 0;">
          </div>
          <div class="draft-tiny">
            <span data-canceledit="${i}">Cancel</span>
            <span data-save="${i}">Save</span>
          </div>
          <div class="draft-footer">
            <button class="btn" data-rej="${i}"><span class="ic">${ICON.x}</span>Reject</button>
            <button class="btn" data-app="${i}"><span class="ic">${ICON.check}</span>Approve</button>
          </div>
        </div>` : "";
      html+=`<div class="card ${st?"done":""}" style="flex-direction:column;align-items:stretch">
        <div class="se-collapsed">
          <div class="body" style="flex:1;min-width:0">
            <span class="title">Update billing contacts</span>
            <span class="se-meta">→ ${esc(curVal)}</span>
          </div>
          ${st
            ? `<span class="verdict ${st==="approved"?"ok":"no"}">${st==="approved"?"✓ Approved":"Rejected"}</span>`
            : `<button class="btn se-edit" data-expand="${i}">${isExpContact?"Close":"Edit"}</button>
               <button class="btn" data-rej="${i}"><span class="ic">${ICON.x}</span>Reject</button>
               <button class="btn" data-app="${i}"><span class="ic">${ICON.check}</span>Approve</button>`}
        </div>
        ${contactExpanded}
      </div>`;
    } else {
      html+=`<div class="card ${st?"done":""}" style="flex-direction:column;align-items:stretch">
        <div style="display:flex;align-items:center;gap:16px">
          <div class="body" style="flex:1">
            <span class="title">${esc(a.kind)}</span><span class="desc">${esc(a.desc)}</span>
          </div>
          <div class="acts">${acts}</div>
        </div>
      </div>`;
    }
  });
  return html||`<div class="empty">No actions pending.</div>`;
}

// ============================================================
//  DETAIL — activity panel
// ============================================================
function eventIcon(kind, isEmail, isAgent){
  if(isEmail)               return ["✉", false];
  if(isAgent)               return ["⚡", true];   // dark — agent-executed
  const m = {
    payment_failed:  ["✗", false],
    payment_applied: ["✓", false],
    ptp_logged:      ["⏎", false],
    ptp_broken:      ["⚠", false],
    invoice_aged:    ["⏱", false],
    invoice_voided:  ["∅", false],
    invoice_pending: ["⏸", false],
    invoice_resumed: ["▶", false],
    escalated:       ["!", false],
    match_tx:        ["↔", false],
    update_po:       ["#", false],
    update_contacts: ["◎", false],
    credit_memo:     ["$", false],
    scheduled_task:  ["⚡", true],
  };
  return m[kind] || ["·", false];
}

function renderActivityList(){
  const items = activityItems();
  const rows = items.map(item=>{
    if(item.type==="email"){
      const sender = item.from.name;
      const preview = item.body.replace(/\s+/g," ").trim();
      const badges = (item.badges||[]).map(b=>`<span class="badge ${b}">${b}</span>`).join("");
      const thread = threadForEmailId(item.id);
      const latestInThread = thread ? [...thread.emails].sort((a,b)=>toMs(b.date,b.time)-toMs(a.date,a.time))[0] : null;
      const isLatest = latestInThread && latestInThread.id===item.id;
      const draftBadge = (thread&&thread.agentReplyDraft&&isLatest) ? `<span class="draft-badge">✎ Agent draft</span>` : "";
      return `<div class="act-row email-row" data-open-email="${item.id}">
        <div class="email-row-top">
          <span class="email-row-who">${esc(sender)}${draftBadge}</span>
          <span class="email-row-date">${esc(item.date)} · ${esc(item.time||"")}</span>
        </div>
        <div class="email-row-body">${esc(preview)}</div>
        ${badges?`<div class="email-row-foot">${badges}</div>`:""}
      </div>`;
    } else {
      const marker = item.agent
        ? `<span class="ev-bolt">⚡</span>`
        : `<span class="ev-dot"></span>`;
      return `<div class="act-row" style="position:relative">
        ${marker}
        <span class="ar-body" style="flex:1;font-size:13px;color:var(--ink)">${item.html||esc(item.text||"")}</span>
        <span class="ar-datestamp">${esc(item.date)}<br>${esc(item.time||"")}</span>
      </div>`;
    }
  });
  // group consecutive event rows under a timeline wrapper; email rows stay flat
  let out = "";
  let i2 = 0;
  while(i2 < items.length){
    if(items[i2].type === "email"){
      out += rows[i2]; i2++;
    } else {
      let seg = "";
      while(i2 < items.length && items[i2].type !== "email"){
        seg += rows[i2]; i2++;
      }
      out += `<div class="act-timeline">${seg}</div>`;
    }
  }
  return `<div class="act-list">${out}</div>`;
}

function renderThreadFull(thread){
  const sorted = [...thread.emails].sort((a,b)=>toMs(a.date,a.time)-toMs(b.date,b.time));
  let html = `<div class="thread-view">
    <div class="thread-back-btn" data-back-activity>← Activity</div>
    <div style="font-size:16px;font-weight:700;margin-bottom:16px">${esc(thread.subject)} <span style="font-size:13px;font-weight:400;color:var(--helper)">${sorted.length} message${sorted.length>1?"s":""}</span></div>`;
  sorted.forEach((em,idx)=>{
    const isOpen = threadOpenEmails.has(em.id);
    if(!isOpen){
      const preview = em.body.replace(/\s+/g," ").trim();
      html+=`<div class="em-collapsed" data-expand-email="${em.id}" style="margin-bottom:8px">
        <span class="ec-who">${esc(em.from.name)}</span>
        <span class="ec-pre">${esc(preview)}</span>
        <span class="ec-date">${esc(em.date)}</span>
      </div>`;
    } else {
      html+=`<div data-expand-email="${em.id}">${renderEmailCard(em,{})}</div>`;
    }
  });
  if(thread.agentReplyDraft){
    html+=`<div style="display:flex;justify-content:center;padding:6px 0">
      <div style="width:1px;height:28px;background:#b0b0ab"></div>
    </div>
    <div class="em-card thread-draft" style="margin-bottom:0">
      <div class="em-card-head" style="cursor:default;padding-bottom:6px">
        <div class="em-head-left">
          <div class="em-name-row">
            <span class="ent-strip agent" style="margin:0">Agent</span>
            <span class="em-name" style="margin-left:6px">Collections Agent</span>
            <span style="font-size:12px;color:var(--helper);margin-left:8px;font-style:italic">Draft</span>
          </div>
        </div>
      </div>
      <div style="padding:0 14px 14px">${renderDraftEditor({
        to:thread.emails[thread.emails.length-1]?.from?.email||"",
        cc:"", subject:`Re: ${thread.subject}`, body:thread.agentReplyDraft, attachments:[]
      },"reply")}</div>
    </div>`;
  } else {
    html+=`<div class="reply-box" style="margin-top:8px">
      <textarea placeholder="Reply…"></textarea>
      <div class="rb-foot"><span class="rb-hint">Write a reply…</span><button class="btn" style="padding:6px 16px">Send</button></div>
    </div>`;
  }
  html+="</div>";
  return html;
}

function renderActivityPanel(){
  if(selectedEmailId){
    const thread = threadForEmailId(selectedEmailId);
    return thread ? renderThreadFull(thread) : renderActivityList();
  }
  return renderActivityList();
}

// ============================================================
//  SCHEDULED PANEL
// ============================================================
function renderScheduledPanel(){
  const all = (SCENARIO.scheduled||[]).sort((a,b)=>toMs(a.date,a.time)-toMs(b.date,b.time));
  const tasks = all.filter(s=>s.type==="agent_task" && !deletedTasks.has(s.id));
  const nextDunning = all.find(s=>s.type==="dunning");

  const dunningNote = nextDunning
    ? `<span style="font-size:12px;color:var(--helper)">Next dunning reminder: <strong style="color:var(--ink)">${esc(nextDunning.date)}</strong> &nbsp;·&nbsp; <span class="sched-settings-link">Global dunning settings →</span></span>`
    : `<span class="sched-settings-link" style="font-size:12px">Global dunning settings →</span>`;

  let html = `<div class="sched-header">
    <h3>Scheduled</h3>
    <div>${dunningNote}</div>
  </div>`;

  if(!tasks.length){
    return html + `<div class="empty">No agent scheduled tasks.</div>`;
  }

  tasks.forEach(s=>{
    const isEditing = editingTask===s.id;
    const preview = s.prompt.replace(/\s+/g," ").trim();
    const editForm = isEditing ? `
      <div class="sched-task-form">
        <div class="stf-row">
          <span class="stf-label">Date / time</span>
          <input class="stf-input" id="stf-date-${s.id}" value="${esc(s.date)} · ${esc(s.time)}">
        </div>
        <div class="stf-row" style="align-items:flex-start">
          <span class="stf-label">Prompt</span>
          <textarea class="stf-textarea" id="stf-prompt-${s.id}">${esc(s.prompt)}</textarea>
        </div>
        <div class="stf-actions">
          <span class="stf-delete" data-delete-task="${s.id}">Delete task</span>
          <div class="stf-tiny">
            <span data-cancel-task="${s.id}">Cancel</span>
            <span data-save-task="${s.id}">Save</span>
          </div>
        </div>
      </div>` : "";
    html+=`<div class="sched-tile">
      <div class="sched-tile-head">
        <div class="sched-tile-left">
          <div class="sched-tile-when">${esc(s.date)} · ${esc(s.time)}</div>
          <div class="sched-tile-title">Agent scheduled task</div>
          <div class="sched-tile-body" style="padding:4px 0 0;font-size:13px;color:var(--ink)">${esc(preview)}</div>
        </div>
        <span class="ent-strip agent" style="flex:0 0 auto;margin-top:2px">Agent</span>
      </div>
      <div class="sched-tile-foot">
        <span class="sf-note"></span>
        ${isEditing?"":
          `<button class="btn" data-edit-task="${s.id}" style="padding:5px 12px;font-size:12.5px">Edit</button>
           <button class="btn" data-delete-task="${s.id}" style="padding:5px 12px;font-size:12.5px;color:var(--warn)">Delete</button>`}
      </div>
      ${editForm}
    </div>`;
  });

  return html;
}

// ============================================================
//  PANEL + WIRING
// ============================================================
function renderPanel(){
  const p = $("panel"); if(!p) return;
  p.innerHTML = activeTab==="actions" ? renderActionsPanel()
    : activeTab==="activity" ? renderActivityPanel()
    : renderScheduledPanel();
  wire();
}

function wire(){
  const p = $("panel"); if(!p) return;
  p.querySelectorAll("[data-toggle-ne]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); const id=el.dataset.toggleNe; if(openNewEvents.has(id)) openNewEvents.delete(id); else openNewEvents.add(id); renderPanel(); });
  p.querySelectorAll("[data-app]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); actionState[+el.dataset.app]="approved"; expandedCard=null; renderPanel(); });
  p.querySelectorAll("[data-rej]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); actionState[+el.dataset.rej]="rejected"; expandedCard=null; renderPanel(); });
  p.querySelectorAll("[data-expand]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); const i=+el.dataset.expand; expandedCard=(expandedCard===i)?null:i; renderPanel(); });
  p.querySelectorAll("[data-edit]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); editingCard=+el.dataset.edit; renderPanel(); });
  p.querySelectorAll("[data-save]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); const i=+el.dataset.save; const inp=document.getElementById("ci"+i); if(inp) editValues[i]=inp.value; editingCard=null; renderPanel(); });
  p.querySelectorAll("[data-canceledit]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); editingCard=null; renderPanel(); });
  p.querySelectorAll("[data-open-email]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); openThread(el.dataset.openEmail); renderPanel(); });
  p.querySelectorAll("[data-back-activity]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); selectedEmailId=null; threadOpenEmails=new Set(); renderPanel(); });
  p.querySelectorAll("[data-expand-email]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); const id=el.dataset.expandEmail; if(threadOpenEmails.has(id)) threadOpenEmails.delete(id); else threadOpenEmails.add(id); renderPanel(); });
  p.querySelectorAll("[data-header-modal]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); openEmailHeaderModal(el.dataset.headerModal); });
  // pill add on space/comma
  p.querySelectorAll("[data-pill-input]").forEach(el=>el.onkeydown=(e)=>{
    if(e.key===" "||e.key===","||e.key==="Enter"){ e.preventDefault();
      const val=el.value.trim().replace(/,$/,"");
      if(!val) return;
      const [idx,field]=el.dataset.pillInput.split(":");
      if(!recipientPills[idx]) recipientPills[idx]={to:[],cc:[]};
      recipientPills[idx][field].push(val); el.value=""; renderPanel();
    }
  });
  // pill remove
  p.querySelectorAll("[data-rm-pill]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation();
    const [idx,field,email]=el.dataset.rmPill.split(":");
    if(recipientPills[idx]) recipientPills[idx][field]=recipientPills[idx][field].filter(x=>x!==email);
    renderPanel();
  });
  p.querySelectorAll("[data-edit-task]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); editingTask=el.dataset.editTask; renderPanel(); });
  p.querySelectorAll("[data-cancel-task]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); editingTask=null; renderPanel(); });
  p.querySelectorAll("[data-save-task]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); editingTask=null; renderPanel(); });
  p.querySelectorAll("[data-delete-task]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); deletedTasks.add(el.dataset.deleteTask); editingTask=null; renderPanel(); });
  p.querySelectorAll("[data-cancel-draft]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); expandedCard=null; renderPanel(); });
  p.querySelectorAll("[data-save-draft]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); expandedCard=null; renderPanel(); });
  p.querySelectorAll("[data-open-picker]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); attachPickerOpen=attachPickerOpen===el.dataset.openPicker?false:el.dataset.openPicker; renderPanel(); });
  p.querySelectorAll("[data-pick-attach]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); const [idx,name]=el.dataset.pickAttach.split(":"); if(!selectedAttachments[idx]) selectedAttachments[idx]=new Set(); selectedAttachments[idx].add(name); attachPickerOpen=false; renderPanel(); });
  p.querySelectorAll("[data-rm-attach]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); const [idx,name]=el.dataset.rmAttach.split(":"); if(selectedAttachments[idx]) selectedAttachments[idx].delete(name); renderPanel(); });
  p.querySelectorAll(".thread-link[data-thread]").forEach(el=>el.onclick=(e)=>{
    e.stopPropagation();
    deepLinkToThread(el.dataset.thread);
    activeTab="activity";
    document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.tab==="activity"));
    renderPanel();
  });
}

// ============================================================
//  RENDER + INIT
// ============================================================
function syncAgentPanel(){
  const side = $("agentSide"); if(!side) return;
  const isDetail = view==="detail";
  side.style.display = isDetail ? "" : "none";
  side.classList.toggle("open", isDetail && agentPanelOpen);
}

function render(){
  renderNav();
  syncAgentPanel();
  const agentTab = $("agentTab");
  if(agentTab) agentTab.onclick = ()=>{ agentPanelOpen=!agentPanelOpen; syncAgentPanel(); };
  const main = $("main-content");
  if(view==="customer"){
    main.innerHTML = renderCustomer();
    main.querySelectorAll("[data-nav-to-detail]").forEach(el=>el.onclick=()=>{
      view="detail"; actionState={}; editingCard=null; editValues={}; expandedCard=null;
      threadExpanded=false; selectedEmailId=null; threadOpenEmails=new Set();
      expandedHeaders=new Set(); selectedAttachments={}; showBcc=false; attachPickerOpen=false;
      openNewEvents=new Set(); recipientPills={}; agentEscalated=false; agentPaused=false;
      activeTab="actions"; render();
    });
    $("backBtn") && ($("backBtn").onclick=()=>{ view="inbox"; render(); });
  } else if(view==="inbox"){
    main.innerHTML = renderInbox();
    const fb=$("filterBtn"); if(fb) fb.onclick=(e)=>{ e.stopPropagation(); filterOpen=!filterOpen; render(); };
    document.onclick=()=>{ if(filterOpen){filterOpen=false;render();} };
    main.querySelectorAll("[data-customer]").forEach(row=>row.onclick=()=>{
      view="detail"; actionState={}; editingCard=null; editValues={}; expandedCard=null;
      threadExpanded=false; selectedEmailId=null; threadOpenEmails=new Set();
      expandedHeaders=new Set(); selectedAttachments={}; showBcc=false; attachPickerOpen=false;
      openNewEvents=new Set(); recipientPills={}; agentEscalated=false; agentPaused=false;
      activeTab="actions"; render();
    });
  } else {
    main.innerHTML = renderDetailHeader()+`<div class="panel" id="panel"></div>`;
    renderPanel();
    $("backBtn").onclick=()=>{ view="customer"; render(); };
    $("flagBtn").onclick=()=>{ agentEscalated=!agentEscalated; render(); };
    $("pauseBtn").onclick=()=>{ agentPaused=!agentPaused; render(); };
    main.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{
      if(b.dataset.tab==="settings") return;
      activeTab=b.dataset.tab;
      main.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));
      renderPanel();
    });
  }
}

render();
