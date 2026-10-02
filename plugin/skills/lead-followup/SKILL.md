---
name: lead-followup
description: "Triages leads and drives fast first contact. Use when the user mentions new leads, enquiries, unworked leads, follow-up, or who has not been contacted. Reads leads and prepares reply drafts; MCP has no send-to-contact tool, the user sends."
---

> Vexur's `lead-followup` playbook, version 3. With the Vexur connector connected, call `get_skill` with key `lead-followup` first and follow that live version wherever the two differ.

# Triage leads and drive fast first contact

## When to use
The user mentions new leads, enquiries, unworked leads, follow-up, speed to lead, or asks who has not been contacted yet. Also the standing follow-through after any campaign launch or landing page publish.

## Why speed matters
First contact within minutes materially improves contact and qualification odds compared with waiting hours. Work the oldest unworked leads and the highest-intent sources first, and state how old each lead is.

## Prerequisites
None. This playbook is read and draft only: the MCP surface has no direct send-to-contact and no lead-status tool. (A scheduled email campaign can technically target contact_ids, but that is bulk campaign machinery, not 1:1 follow-up; do not use it as a workaround.) The deliverable is a triaged queue plus ready-to-send drafts the user sends from their own channels. Never claim a message was sent.

## Steps
1. Campaign leads: `get_campaign_unworked_leads` (campaign_id) returns one row per attributed contact with their first outbound touch after attribution, plus unworked_count, worked_count and the median first-response minutes. Find the campaign_id with `list_campaigns`: call with status active first, then sweep other statuses (results are newest-first, not sorted by status).
2. Page leads: `list_page_submissions` (page_id or slug) unions native page submissions and form submissions attributed to the page. Form rows carry name, email and phone as top-level fields; native page rows carry the raw `data` payload instead, so read contact details out of `data`. Both carry UTM fields and referrer.
3. Prioritise: unworked before worked, oldest first; use UTM source and the originating page or campaign to judge intent.
4. Resolve context before drafting (read before write): `get_landing_page` or `get_form` for what the person actually enquired about, `get_campaign_performance` for the campaign frame. Never invent enquiry details; if the source cannot be resolved, draft a generic but honest message and flag the gap.
5. Draft a short first message per lead, specific to their enquiry, referencing what they asked about.
6. Hand over: present the queue (name, contact, source, age) with each draft, and be explicit that sending and lead-status updates happen outside MCP.
7. Report the funnel honestly: unworked_count and median first-response minutes are the numbers to move.

## Rules and gotchas
- Leads carry only what the forms captured; never fabricate contact details or enquiry content.
- Leads are personal data: summarise, do not dump full submission payloads when a summary does the job.
- The same person can appear through both the page union and the campaign attribution; dedupe by email before counting.
- `get_campaign_unworked_leads` is per campaign; a full sweep means iterating the campaigns from `list_campaigns`.

## Failure handling
- Empty result on a campaign known to have leads: check attribution first (pages linked with `link_landing_page_to_campaign`, posts carrying hub_campaign_id) rather than assuming zero enquiries.
- Page not found by slug: `list_landing_pages` for the right slug or id.

## Done means
A prioritised queue with age and source, a ready-to-send draft per lead, honest funnel numbers, and zero claims that anything was sent.
