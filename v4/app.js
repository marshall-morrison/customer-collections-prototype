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
    invoices: ["INV-2241"],
    overdueAmt: 10890,
    eventSummary: "Dana requested a W-9 and billing contact update before processing payment",
    proposedActions: ["Send email","Update primary billing contact"],
    escalated: false,
    planStatus: "review",
    ageDays: 3,
  },
];

const SCENARIO = {
  customer: "Meridian Group",
  agentSummary: `**Dana Reed at Meridian Group** replied to the INV-2241 thread with two requests: a signed W-9 before they can process payment, and an update to the billing contact on file to ap@meridiangroup.com.

INV-2241 for **$10,890** is 21 days past due — the prior dunning reminder was opened but no payment followed.

Sending the W-9 and updating the contact are both low-risk actions that should unblock payment. Holding on next dunning steps until these are resolved.`,
  invoices: [
    { num:"INV-2241", sent:"May 16, 2026", due:"Jun 1, 2026", amount:10890, od:21 },
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
  proposed: [
    { kind:"update_contacts", desc:"Update primary billing contact → ap@meridiangroup.com", editableContact:"ap@meridiangroup.com" },
    { kind:"send_email", desc:"Reply to Dana Reed with signed W-9 attached, confirm billing contact update", invoice:"INV-2241",
      attachments:[{name:"W-9_GeneralCatalyst.pdf"},{name:"INV-2241.pdf"}],
      draft:{ to:"finance@meridiangroup.com", cc:"ap@meridiangroup.com", subject:"Re: INV-2241 — W-9 + billing contact",
        body:"Hi Dana,\n\nThanks for flagging both — the signed W-9 is attached. I've also updated the billing contact to ap@meridiangroup.com as requested.\n\nA fresh copy of INV-2241 is attached as well. Let me know if anything else is needed.\n\nBest,\nPriya Sharma\nGeneral Catalyst" },
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
      // Dana's inbound — customer email, not tracked via Postmark, no engagement data
      { id:"e3", dir:"in", entity:"customer",
        from:{name:"Dana Reed",email:"finance@meridiangroup.com"},
        to:[{name:"Priya Sharma",email:"billing@generalcatalyst.com",badge:null}], cc:[],
        date:"Jun 4, 2026", time:"2:14 PM",
        body:"Hi,\n\nBefore we can process payment we need a signed W-9 from your company. Also, please update our billing contact to ap@meridiangroup.com going forward.\n\nThanks,\nDana",
        attachments:[], badges:[] },
    ],
    agentReplyDraft:"Hi Dana,\n\nThanks for flagging both — the signed W-9 is attached. I've also updated the billing contact to ap@meridiangroup.com as requested.\n\nA fresh copy of INV-2241 is attached as well. Let me know if anything else is needed.\n\nBest,\nPriya Sharma\nGeneral Catalyst",
  },
];

// ============================================================
//  ROUTING STATE
// ============================================================
let view = "inbox";
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
    const escDot = r.escalated ? `<span title="Escalated" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#e07c2a;margin-left:7px;vertical-align:middle"></span>` : "";
    const actLine = r.proposedActions.map(a=>`<div style="font-size:12.5px;color:var(--ink);margin-bottom:2px">${esc(a)}</div>`).join("");
    return `<tr data-customer="${r.id}" style="${r.escalated?"border-left:3px solid #e07c2a":""}">
      <td><span class="cust-name">${esc(r.customer)}</span>${escDot}</td>
      <td>${invTags}</td>
      <td><span class="overdue-amt">${fmtMoney(r.overdueAmt)}</span></td>
      <td style="font-size:12.5px;color:var(--helper);max-width:280px;line-height:1.45">${esc(r.eventSummary)}</td>
      <td>${actLine}</td>
      <td>${statusChip}</td>
      <td class="r"><span class="age-num">${r.ageDays}d</span></td>
    </tr>`;
  }).join("");
  return `
    <div class="crumb">Invoicing <span>›</span> <b>Collections Inbox</b></div>
    <div class="inbox-wrap">
      <div class="inbox-head"><h1>Collections Inbox</h1></div>
      ${(()=>{
        const n = WORKLIST.filter(r=>r.planStatus==="review").length;
        const openLabel = n===1 ? "customer with open agent actions to close out" : "customers with open agent actions to close out";
        const dot = n>0 ? `<span class="stat-dot-tr tab-dot"></span>` : "";
        return `<div class="stat-strip">
          <div class="stat-box">
            ${dot}
            <div class="stat-num ${n===0?"zero":""}">${n}</div>
            <div class="stat-label">${openLabel}</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">8</div>
            <div class="stat-label">agent actions executed this month</div>
          </div>
        </div>`;
      })()}
      <table class="inbox-table">
        <thead><tr>
          <th>Customer</th><th>Open invoices</th><th>Total overdue</th>
          <th>Event</th><th>Agent actions</th><th>Plan status</th><th class="r">Age</th>
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
    <div class="em-card-head" data-toggle-header="${em.id}">
      <div class="em-head-left">
        <div class="em-name-row">
          <span class="ent-strip ${ec}" style="margin:0">${label}</span>
          <span class="em-name">${esc(em.from.name)}</span>
        </div>
        ${headerSummary}
      </div>
      <span class="em-date">${esc(em.date)} · ${esc(em.time)}</span>
    </div>
    ${headerDetail}
    <div class="em-card-body">${esc(em.body)}</div>
    ${attach}${footer}
  </div>`;
}

// ============================================================
//  DRAFT EDITOR
// ============================================================
function renderDraftEditor(draft, actionIdx){
  const selAttach = selectedAttachments[actionIdx] || new Set((draft.attachments||[]).map(a=>a.name));
  if(!selectedAttachments[actionIdx]) selectedAttachments[actionIdx] = selAttach;
  const attachChips = [...selAttach].map(name=>
    `<span class="draft-attach-chip" onclick="window.open('#','_blank')">📎 ${esc(name)}<span class="rm" data-rm-attach="${actionIdx}:${esc(name)}">×</span></span>`
  ).join("");
  const addBtn = `<span class="draft-attach-add" data-open-picker="${actionIdx}">+ Add attachment</span>`;
  const pickerHtml = attachPickerOpen===actionIdx
    ? `<div class="attach-picker">${AVAILABLE_ATTACHMENTS.filter(a=>!selAttach.has(a.name)).map(a=>
        `<div class="attach-picker-item" data-pick-attach="${actionIdx}:${esc(a.name)}">${esc(a.name)}</div>`
      ).join("")}</div>` : "";
  const rejectApprove = (actionIdx==="reply") ? `<button class="btn" style="padding:6px 16px">Send</button>` :
    `<button class="btn" data-rej="${actionIdx}"><span class="ic">${ICON.x}</span>Reject</button>
     <button class="btn" data-app="${actionIdx}"><span class="ic">${ICON.check}</span>Approve &amp; send</button>`;
  return `<div class="draft-editor">
    <div class="draft-fields">
      <div class="draft-field"><span class="df-label">To</span><input class="df-val" value="${esc(draft.to||"")}" style="border-bottom:1px solid var(--line2)"><span class="draft-bcc-toggle" data-toggle-bcc>BCC</span></div>
      <div class="draft-field"><span class="df-label">CC</span><input class="df-val" value="${esc(draft.cc||"")}" style="border-bottom:1px solid var(--line2)"></div>
      ${showBcc?`<div class="draft-field"><span class="df-label">BCC</span><input class="df-val" style="border-bottom:1px solid var(--line2)"></div>`:""}
      <div class="draft-field"><span class="df-label">Subj</span><input class="df-val" value="${esc(draft.subject||"")}"></div>
    </div>
    <textarea class="draft-body-area">${esc(draft.body||"")}</textarea>
    <div class="draft-attach-bar">${attachChips}${addBtn}${pickerHtml}</div>
    <div class="draft-footer">${rejectApprove}</div>
  </div>`;
}

// ============================================================
//  DETAIL — header
// ============================================================
function renderDetailHeader(){
  const pendingCount = SCENARIO.proposed.filter((_,i)=>!actionState[i]).length;
  const inv = SCENARIO.invoices[0];
  const chip = `<span class="due-chip over">${inv.od}d overdue</span>`;
  const amt = fmtMoney(inv.amount);
  return `
    <div class="crumb">
      <span class="back" id="backBtn">← ${esc(SCENARIO.customer)}</span>
      <span>›</span> <b>Collections Agent</b>
    </div>
    <div style="padding:16px 22px 0;font-size:17px;font-weight:700">Collections Agent</div>
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
          <thead><tr><th>Invoice #</th><th>Sent</th><th>Due</th><th class="r">Amount</th></tr></thead>
          <tbody>
            <tr><td><a>${esc(inv.num)}</a></td><td>${esc(inv.sent)}</td><td>${esc(inv.due)}${chip}</td><td class="r">${amt}</td></tr>
            <tr class="tot"><td colspan="3">Total Outstanding</td><td class="r">${amt}</td></tr>
          </tbody>
        </table>
      </div>
    </section>
    <nav class="tabs">
      <button class="tab ${activeTab==="actions"?"active":""}" data-tab="actions">Agent Actions${pendingCount>0?`<span class="tab-dot"></span>`:""}</button>
      <button class="tab ${activeTab==="activity"?"active":""}" data-tab="activity">Activity</button>
    </nav>`;
}

// ============================================================
//  DETAIL — actions panel
// ============================================================
function renderTriggeringEvent(){
  const triggers = activityItems().filter(e=>e.type==="email"&&e.dir==="in").slice(0,2);
  if(!triggers.length) return "";
  return triggers.map(t=>renderEmailCard(t,{showThreadLink:true,threadId:t.threadId})).join("");
}

function renderActionsPanel(){
  const p = SCENARIO.proposed;
  const pending = p.filter((_,i)=>!actionState[i]).length;
  const pendingLabel = pending>0
    ? `<span class="as-count"><span>${pending}</span> action${pending>1?"s":""} awaiting review ↓</span>`
    : `<span class="as-count" style="color:var(--good)">✓ All actions resolved</span>`;

  let html = "";

  p.forEach((a,i)=>{
    const st = actionState[i];
    const isEmail = a.kind==="send_email";
    const isContact = a.kind==="update_contacts" && a.editableContact!=null;
    const isEditing = editingCard===i && isContact && !st;
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
        contactEdit=`<div style="margin-top:6px;font-size:13px;color:#34352f">Primary contact → ${esc(val)} <span style="color:var(--blue);font-size:12px;cursor:pointer;margin-left:6px" data-edit="${i}">Edit</span></div>`;
      }
    }
    const threadLink = isEmail&&a.draft
      ? `<div style="margin-top:4px"><span class="thread-link" data-thread="t1" style="font-size:12.5px;color:var(--helper);cursor:pointer;text-decoration:underline">See entire thread →</span></div>` : "";
    const inlineDraft = isEmail&&!st&&a.draft ? renderDraftEditor(a.draft,i) : "";
    html+=`<div class="card ${st?"done":""}" style="flex-direction:column;align-items:stretch">
      <div style="display:flex;align-items:center;gap:16px">
        <div class="body" style="flex:1">
          <span class="title">${esc({send_email:"Send email",update_contacts:"Update billing contacts"}[a.kind]||a.kind)}</span>${isContact?"":` <span class="desc">${esc(a.desc)}</span>`}
          ${attachHtml}
          <div class="meta">${a.invoice?`Invoice ${esc(a.invoice)}`:"Account-level"}</div>
          ${contactEdit}${threadLink}
        </div>
        ${!isEmail?`<div class="acts">${acts}</div>`:""}
      </div>
      ${inlineDraft}
    </div>`;
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
        <span class="em-num">${idx+1}</span>
        <span class="ec-who">${esc(em.from.name)}</span>
        <span class="ec-pre">${esc(preview)}</span>
        <span class="ec-date">${esc(em.date)}</span>
      </div>`;
    } else {
      html+=`<div data-expand-email="${em.id}">${renderEmailCard(em,{})}</div>`;
    }
  });
  if(thread.agentReplyDraft){
    html+=`<div style="margin-top:4px">${renderDraftEditor({
      to:thread.emails[thread.emails.length-1]?.from?.email||"",
      cc:"", subject:`Re: ${thread.subject}`, body:thread.agentReplyDraft, attachments:[]
    },"reply")}</div>`;
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
//  PANEL + WIRING
// ============================================================
function renderPanel(){
  const p = $("panel"); if(!p) return;
  p.innerHTML = activeTab==="actions" ? renderActionsPanel() : renderActivityPanel();
  wire();
}

function wire(){
  const p = $("panel"); if(!p) return;
  p.querySelectorAll("[data-app]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); actionState[+el.dataset.app]="approved"; expandedCard=null; renderPanel(); });
  p.querySelectorAll("[data-rej]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); actionState[+el.dataset.rej]="rejected"; expandedCard=null; renderPanel(); });
  p.querySelectorAll("[data-edit]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); editingCard=+el.dataset.edit; renderPanel(); });
  p.querySelectorAll("[data-save]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); const i=+el.dataset.save; const inp=document.getElementById("ci"+i); if(inp) editValues[i]=inp.value; editingCard=null; renderPanel(); });
  p.querySelectorAll("[data-canceledit]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); editingCard=null; renderPanel(); });
  p.querySelectorAll("[data-open-email]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); openThread(el.dataset.openEmail); renderPanel(); });
  p.querySelectorAll("[data-back-activity]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); selectedEmailId=null; threadOpenEmails=new Set(); renderPanel(); });
  p.querySelectorAll("[data-expand-email]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); const id=el.dataset.expandEmail; if(threadOpenEmails.has(id)) threadOpenEmails.delete(id); else threadOpenEmails.add(id); renderPanel(); });
  p.querySelectorAll("[data-toggle-header]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); const id=el.dataset.toggleHeader; if(expandedHeaders.has(id)) expandedHeaders.delete(id); else expandedHeaders.add(id); renderPanel(); });
  p.querySelectorAll("[data-toggle-bcc]").forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); showBcc=!showBcc; renderPanel(); });
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
function render(){
  renderNav();
  const main = $("main-content");
  if(view==="customer"){
    main.innerHTML = renderCustomer();
    main.querySelectorAll("[data-nav-to-detail]").forEach(el=>el.onclick=()=>{
      view="detail"; actionState={}; editingCard=null; editValues={}; expandedCard=null;
      threadExpanded=false; selectedEmailId=null; threadOpenEmails=new Set();
      expandedHeaders=new Set(); selectedAttachments={}; showBcc=false; attachPickerOpen=false;
      activeTab="actions"; render();
    });
    $("backBtn") && ($("backBtn").onclick=()=>{ view="inbox"; render(); });
  } else if(view==="inbox"){
    main.innerHTML = renderInbox();
    main.querySelectorAll("[data-customer]").forEach(row=>row.onclick=()=>{
      view="detail"; actionState={}; editingCard=null; editValues={}; expandedCard=null;
      threadExpanded=false; selectedEmailId=null; threadOpenEmails=new Set();
      expandedHeaders=new Set(); selectedAttachments={}; showBcc=false; attachPickerOpen=false;
      activeTab="actions"; render();
    });
  } else {
    main.innerHTML = renderDetailHeader()+`<div class="panel" id="panel"></div>`;
    renderPanel();
    $("backBtn").onclick=()=>{ view="customer"; render(); };
    main.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{
      if(b.dataset.tab==="settings") return;
      activeTab=b.dataset.tab;
      main.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));
      renderPanel();
    });
  }
}

render();
