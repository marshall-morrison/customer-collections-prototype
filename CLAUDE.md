# Customer Collections Agent Prototype

A low-to-mid fidelity clickable prototype for the Tabs Collections Agent single-customer page. Built iteratively in vanilla HTML/CSS/JS — no build step, no framework.

## Running it

```bash
cd ~/collections-prototype
python3 -m http.server 8741
```

Open **http://localhost:8741/v4/** in your browser.

The active prototype is `v4/`. Older iterations (`v2/`, `v3/`) are preserved for reference.

## What this is

Tabs is an AR (accounts receivable) automation product. The Collections Agent is an AI that reads inbound customer emails, payment events, and billing history, then proposes actions (send a reply, update a contact, pause dunning, etc.) for a human to approve.

This prototype covers the **single-customer detail page** — what a merchant sees when they click into a customer from the Collections Inbox worklist. It's designed to let a designer (Ben) and a PM (Marshall) stress-test the information hierarchy and interaction patterns before engineering builds.

The prototype has two views:
- **Collections Inbox** — the worklist table (click a row to navigate to the customer detail page)
- **Customer detail page** — the main subject of this work, with four tabs: Agent Actions, Activity, Scheduled

There's also a **Customer page** (accessible via "Customers" in the nav) showing the Tabs customer profile with a "Collections Agent" deep-link.

## Design brief

The full functional requirements live in Notion:
**Customer Collections Agent Page Design Brief** — `37c17d4f80ce80d29a75cf2991030fbc`

The brief covers all 6 shapes (Agent Summary, Agent Actions, Activity, Scheduled, NL interaction, Control panel), the full activity log row taxonomy, action bird's-eye view specs, and open design decisions.

There's also an iteration subpage: **Iteration 2 — Tabbed flow: decisions & open tensions** (`38717d4f80ce8120845bd960e4e2f283`) which covers decisions made after moving to the tabbed layout.

## Key design decisions and why

### 1. Related events → Agent proposes (two-zone layout in Agent Actions)

The Agent Actions tab doesn't just show proposed actions — it shows the events that triggered those actions first. The two zones are:

- **Related events** (grey, read-only, past-feeling): the emails and events that caused the agent to generate these actions. Collapsed email cards, expandable inline. Click "View thread →" to go to the full thread in Activity.
- **Agent proposes N actions** (white, active): the actionable proposals. A connector line between the zones makes the cause→effect relationship explicit.

**Why**: Without seeing what triggered the actions, a user approving or rejecting has no context. But dumping the full activity log into the Actions tab creates info overload. The two-zone pattern is a curated slice — only what's relevant to the current proposal.

### 2. Activity log: email cards + timeline pattern

The Activity tab has two visual registers:

- **Email rows** — bordered cards, sender bold, body preview, date/time, engagement badges (opened/clicked/bounced). Clickable — opens full thread view.
- **Event rows** — Tabs-style timeline (vertical line, dots/bolts, right-aligned timestamps). Not clickable — the row text is the whole story.

Agent-executed events use a ⚡ bolt instead of a dot. All dots are filled solid.

**Why**: Emails are interactive (you open them, you reply from them). Events are log entries — they happened, there's nothing to do. Making them visually distinct prevents users from trying to click on "Payment failed" expecting something to happen.

Engagement badges (opened, clicked, bounced, failed) only appear on emails sent via Postmark (agent, dunning, system sends). Inbound customer emails and merchant-sent emails have no badges — we can't track those.

### 3. Full thread view (Activity tab) is full-width, not a split pane

Clicking an email in the Activity list opens the thread full-width (not a side panel). The thread shows emails oldest-first, Gmail-style: collapsed emails are grey/muted, the most recent is open. The agent draft reply (if any) is wrapped in an email card tile with a darker connector line separating it from the thread history.

**Why**: The split pane felt cluttered given the thread already needs a lot of vertical space. Full-width gives the emails room to breathe. The agent draft is visually connected to the thread via the connector line, making it clear this is "the response to the above."

The `▾` chevron next to recipient names is the only clickable element in an email header. Clicking it opens a modal overlay with from/to/cc details and a per-recipient engagement grid (delivered/opened/clicked/bounced/failed).

### 4. Send email card: collapsed bird's-eye + expand to edit

The send email action card shows a compact bird's-eye by default:
`Send email · [description] · N attachments · [Edit] [Reject] [Approve]`

Clicking "Edit" expands inline to show:
- "View thread" link (blue, deep-links to Activity)
- To/CC fields with Gmail-style pills (type + space to create a pill)
- Subject locked/greyed for thread replies (can't change the Re: subject)
- Body textarea
- Cancel · Save (right-aligned, tiny)
- Attachment picker (select from available files → shows as clickable pills)
- Reject / Approve & send

**Why**: The bird's-eye lets you approve simple cases without reading the full draft. The expand is for when you need to edit. Having Subject locked for thread replies avoids breaking the email thread.

### 5. Scheduled tab: agent tasks only, dunning as a computed line

The Scheduled tab shows agent scheduled tasks (editable: datetime + prompt, deletable) and computes the next dunning reminder date from the customer's dunning sequence. Individual dunning email tiles aren't shown — we can't reliably enumerate them from the data model.

**Why**: Dunning emails are system-managed. Showing individual tiles would require storing the full sequence per customer, which isn't currently available. The "Next dunning reminder: Jun 12 · Global dunning settings →" line gives the user the key fact without pretending we have the full schedule.

### 6. Worklist (Collections Inbox): two distinct columns

The worklist table has an **Event** column (natural language: "Dana requested a W-9 and billing contact update") and an **Agent actions** column (literal tool call names: "Send email", "Update primary billing contact"). These are intentionally different:

- Event = what the customer did / what happened
- Agent actions = what the agent is proposing to do about it

**Why**: Mixing them ("Dana asked for X so agent will do Y") in one cell loses the cause→effect distinction and makes the table hard to scan.

### 7. Additional affordances (always visible, above the invoice table)

Three controls live inline with the "Collections Agent" title, always visible regardless of which tab is active:

- **🚩 Escalation flag** — flat SVG icon, outline when off, filled red when on. Skeuomorphic single button. Hover: "Flag as escalated" / "Remove escalation flag". Drives a filterable escalated view on the worklist.
- **⏸ Pause Agent** — toggles to "▶ Resume Agent" when active. Hover: "Agent won't propose or take any actions on this customer."
- **Agent permissions** — small text link, routes to global collections agent policy page.

**Why they're in the title row**: These are customer-level and agent-level controls, not tab-specific. A user might want to pause the agent while looking at the Activity tab. Putting them in the title row means they're always reachable without tab-switching.

## Mock data

All data is in `v4/app.js`. The single scenario is **Meridian Group** — Dana Reed sent two emails asking for a W-9 and a billing contact update. The agent proposes sending a W-9 reply and updating the contact.

The `SCENARIO` object holds:
- `agentSummary` — the markdown brief (rendered in the blue box)
- `invoices` — outstanding invoice data
- `proposed` — the action cards
- `scheduled` — agent tasks and dunning data
- `newEvents` — which events (email IDs or inline event objects) triggered the current proposals
- `events` — all non-email activity log events

`THREADS` holds the email thread data used by both the Activity log and the draft editor's "View thread" link.

## Palette

```
--ink: #1c1c1a       (primary text)
--helper: #75786f    (secondary/muted)
--line: #e4e4e0      (borders)
--soft: #f6f6f4      (hover / background)
--blue: #2476d8      (interactive / links)
--warn: #a23a1e      (destructive / overdue)
--good: #3a7d44      (success)
--nav: #1e1f1d       (left nav background)
```
