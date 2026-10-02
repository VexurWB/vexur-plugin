---
name: contacts-and-deals
description: "Work the people and the pipeline: find and update contacts, move deals through stages, run the Action Centre task list, read segments and buyer briefs, and debug automations. Use when the user asks about a contact, deal, pipeline stage, task, meeting note or buyer brief, or an automation that misbehaves."
---

> Vexur's `crm` playbook, version 3. With the Vexur connector connected, call `get_skill` with key `crm` first and follow that live version wherever the two differ.

# CRM: contacts, deals, tasks and automations

## When to use
Anything about people and the work around them: contacts and companies, deals and pipelines, the Action Centre task list, saved segments, buyer briefs, and the automations that move people through it all. Also the follow-through after lead-followup: that playbook drafts first contact, this one records what happened.

## The shape of the data
- **Contact** - the person. `list_contacts` searches name, email and company, and filters by tag, lifecycle stage or source. Archived contacts are excluded.
- **Deal** (pipeline opportunity) - what you are trying to win, sitting in one stage of one pipeline. Link it to a contact wherever you can.
- **Task** - a single action in the Action Centre, optionally linked to a contact or a deal.
- **Segment** - a saved audience of contacts. Read-only here; it is what campaigns target.
- **Buyer brief** - what a client is looking for, feeding the off-market marketplace.
- **Automation** - a workflow that enrols contacts and runs steps against them.

**Where someone is up to is the DEAL's stage, not the contact's `lifecycle_stage`.** `lifecycle_stage` is a free-text label on the contact record. The pipeline the customer actually reports on is built from deals. When asked where a person or a job stands, read the deal.

## Prerequisites
Call `list_pipelines` before any deal work. You need a pipeline_id and a stage_id, stage ids belong to one pipeline, and there is no way to guess a correct one.

## Steps
1. **Find before you write.** `list_contacts` / `list_deals` / `list_tasks` to get the id, then the matching `get_*` when you need the full record. Never write against an id you did not read back.
2. **Page properly.** These lists return a page plus `next_cursor`. Pass the cursor back for the next page. One page is not the whole account: never answer "how many" off a single page.
3. **Contacts.** `create_contact` needs at least a name, email or phone. Search the email with `list_contacts` first - nothing dedupes for you. `update_contact` changes only the fields you pass.
4. **Deals.** `create_deal` needs a title; omitting pipeline_id/stage_id drops it in the default pipeline's first stage. `update_deal` moves it (`stage_id`) or closes it (`status` open/won/lost).
5. **Tasks.** `create_task` needs a title; link contact_id or opportunity_id where it belongs. Finish work with `complete_task`, not `update_task`.
6. **Automations, when something looks wrong.** `get_automation` for the real step chain, then `get_automation_runs` for the errors, then `list_automation_enrollments` filtered to the failed ones. Read the log before forming a theory.
7. **Report with ids.** Say what changed and give the id, so the customer can open it.

## Rules and gotchas
- **Consent is not yours to set.** Neither create nor update can touch newsletter or marketing-consent fields; those stay under the app's consent controls. If asked to opt someone in, say where it happens.
- Contacts created here are stamped source `mcp`. Do not dress that up as something else.
- `update_deal` with status won or lost stamps the close date itself. Do not also set a date by hand.
- **Buyer briefs are created INACTIVE on purpose.** Activating one publishes it to the off-market marketplace, and the customer does that in the app. Never report a new brief as live.
- **`set_automation_active` is a live switch.** Pausing stops enrolment and steps for everyone in that workflow, not just the contact in front of you. Read back what the automation does and get explicit confirmation before pausing.
- Segments are read-only on this surface. To act on one, target it from a campaign (`get_skill` campaign).
- Contact records are personal data. Summarise, count, and name only who is relevant. Do not dump full records or bulk-list people when a short answer does the job.

## Notes, meetings, consent, imports and briefs
- `add_contact_note` writes to the contact's activity timeline (what the app shows under Activity); `update_contact` changes the static notes field. Neither sends anything to the person.
- Meeting notes from Google Meet, Zoom or Fireflies: `list_meeting_notes` (filter `match_status` to unmatched or review_required for the ones that never reached a contact), `get_meeting_note`, and `attach_meeting_note` to put one on the right contact's timeline.
- Consent: `get_contact_consent` reads it, and missing consent means unknown, never permission. `record_contact_opt_out` records an opt-out and can only ever revoke.
- Imports and merges are preview first: `preview_contact_import` (up to 100 rows, a preview_id valid for 15 minutes) then `import_contacts`; `preview_contact_merge` then `merge_contacts`, which cannot be undone. Show the user the preview and get a yes before either.
- Buyer briefs: `list_buyer_briefs`, `get_buyer_brief`, `create_buyer_brief` (a title and a description, plus the criteria you actually have), `update_buyer_brief` (inactive briefs only), and `match_properties_to_brief` to scan live off-market listings for candidates. Nothing is sent to anyone.
- Deals: `get_deal` for one deal with its timeline. For a buyers-agency client's onboarding, `get_client_onboarding_status`, and `update_client_onboarding` for manual steps only; system, legal verification and signature steps cannot be overridden.

## Fields the database constrains
These are CHECK-constrained. The tool schema carries the enums, but a client holding a stale tool list may show them as free text - use these values, not prose:
- `timeline`: urgent | 1-3_months | 3-6_months | 6-12_months | flexible. (Note the underscores. "3-6 months" with a space is rejected.)
- `purchase_type`: owner_occupier | investment | development | renovation | flexible
- `preferred_states`: NSW | VIC | QLD | SA | WA | TAS | NT | ACT
- task `priority`: low | medium | high | urgent
- task `task_source`: marketing | buyers_agent | admin_todo | compliance | other
- Deal `status`: open | won | lost. Brief `status` is set for you (inactive) and changed in the app.

## Failure handling
- **Deal will not move:** re-read `list_pipelines`. A stage_id from a different pipeline is the usual cause.
- **Nothing found by name:** search is not fuzzy. Try the email, or a shorter fragment.
- **A create fails validation:** contacts need one of name/email/phone; deals and tasks need a title. Ask for the missing field rather than inventing one.
- **Something downstream will not send or sync:** `get_integration_health` before blaming the record.

## Done means
The record was read before it was written, deals sit in a real stage of a real pipeline, completions went through `complete_task`, anything outward-facing (consent, brief activation) was left to the customer, and you reported what changed with ids.
