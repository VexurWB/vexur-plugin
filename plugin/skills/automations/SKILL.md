---
name: automations
description: "Build a trigger-and-steps automation from the live catalogue, check it for a real contact before it goes on, change it in place, and clear away old copies. Use for \"when X happens, do Y\" requests, follow-up flows, stage-change alerts, date and weekly triggers, and anything the user calls a workflow or automation."
---

> Vexur's `automations` playbook, version 3. With the Vexur connector connected, call `get_skill` with key `automations` first and follow that live version wherever the two differ.

# Automations: build, check and change them

## When to use
Any request shaped like "when this happens, do that": a form comes in, a lead ad arrives, a tag is added, a deal moves stage, an agreement is signed, a date comes round, or a weekly check. Also changing, checking or tidying automations that already exist. For a timed nurture that every new contact walks through from their own start date, use `create_sequence` instead. For finding out why a live automation misbehaved, read `get_automation_runs` first (the `crm` playbook covers debugging).

## The rule that matters most
Change an automation, never copy it. Every change goes through `update_automation` on the same automation. A second copy is how an account ends up with v1 to v11 of one flow and nobody knows which one is live. `list_automations` before building: if one already does most of the job, change that one.

## Steps
1. **Pick the trigger.** `list_workflow_triggers` (filter by `context` or `search`). Use the trigger id as `trigger_type`, and only keys from its `filter_keys` in `trigger_config`. Any other key makes every enrolment silently skip, so the tool refuses it. Never invent a trigger id or a key.
2. **Pick the context.** It must be one the trigger fires in, or the automation is never selected. The trigger's own `context` says which:
   - `marketing`: contacts, forms, tags, lead ads, bookings, email, social and marketing pipelines.
   - `ba_crm`: buyers-agency client work: clients, briefs, properties, agreements, documents, invoices, settlement.
   - `team`: the team's own inbox and people: email received, email from a VIP, no reply in 48 hours, a member joining or leaving.
   - Triggers whose context is `all` (webinar registration, WhatsApp received, appointment cancelled, call completed, manual enrol) fire anywhere: use the context of the work they belong to.
   - `opportunity_stage_changed` fires in both `marketing` (marketing pipelines) and `ba_crm` (client pipelines). Ask which pipeline if it is not obvious, and get its ids from `list_pipelines`.
3. **Pick the steps.** `list_workflow_actions` with the same context. Use each action's id as `action_type` and only keys from its `config_fields`. Steps run top to bottom; `wait` pauses between them. Never invent an action id: there is no `send_dm` or `send_message`.
4. **Build it.** `create_automation`. It is always created switched off. Report the `review_url`.
5. **Check it.** `list_contacts` for one real contact, then `preview_automation` with that `contact_id`. Show the user the filled-in email subjects and bodies. Fix every error with `update_automation` and preview again until `error_count` is 0.
6. **Switching it on.** Read back who it reaches and what it sends, and get an explicit yes. Then `set_automation_active` with `is_active: true` when this connection has Send / publish for Automations. A connection without it is refused on purpose: the user switches it on in Vexur, Automations.

## Common requests (confirm in the catalogue, which always wins)
| The user says | trigger_type | trigger_config keys |
| --- | --- | --- |
| a form comes in | `form_submitted` | `form_id` (or `form_ids`, `page_id`) |
| a Meta or Google lead ad comes in | `ad_lead_received` | `form_id`, `page_id`, `platform`, `campaign_id` |
| a tag is added | `contact_tag_added` | `tag` or `tags` |
| a deal moves stage | `opportunity_stage_changed` | `pipeline_id`, `stage_id` |
| someone books a time | `appointment_booked` | `service_type`, `duration_minutes` |
| someone registers for a webinar | `webinar_registered` | `webinar_id` |
| a birthday or other contact date | `date_trigger` | `date_field`, `days_offset`, `offset_direction` |
| days before or after settlement | `ba_date_trigger` | `days_offset`, `offset_direction` |
| every Monday at 9 | `schedule_recurring` (or `ba_schedule_recurring`) | `frequency`, `day_of_week`, `time_of_day` (the user's profile timezone) |
| an agreement is signed | `ba_agreement_signed` | none |
| only when I add someone myself | `manual_enroll` | none |

Actions most flows need: `send_email`, `send_sms`, `send_whatsapp`, `wait`, `add_tag`, `remove_tag`, `create_task`, `add_note` and `update_field` work in every context. `send_social_dm` and `reply_to_social_comment` are marketing actions that only reach someone who messaged or commented first; a flow that answers DMs and comments is an Auto Reply journey (`get_skill` conversations). Buyers-agency actions start with `ba_` and run only in `ba_crm`.

## Merge tags
- Contact: `{{first_name}}`, `{{last_name}}`, `{{full_name}}`, `{{email}}`, `{{phone}}`, `{{company}}`. A missing first name reads "there".
- From the trigger: deal, property, booking and sender tags (`{{property_address}}`, `{{appointment_date}}`, `{{sender_name}}` and the rest) fill at run time; the preview leaves them as written.
- `{{ai_output}}` is the text an `ai_generate_content` step wrote. It only exists AFTER that step, so the AI step goes first.
- A tag Vexur does not know only fills if the trigger carries a field with exactly that name (a form field, a webhook value). Otherwise the reader sees it as written. The preview warns about these.
- Images in an email: put the media library item's public URL in an `<img>` tag in the body, with alt text (`list_media`, or `upload_media` to bring one in). Library URLs do not expire. Email cannot play video: use a thumbnail image that links to the video.

## Changing an automation
1. `get_automation` first. It returns every step's config, so you can see exactly what you are replacing.
2. `update_automation` with only what changes. `steps`, when you send it, is the COMPLETE new chain in order: send every step you want to keep.
3. Changing the trigger drops filters that belong to the old one; send `trigger_config` for the new trigger.
4. It refuses, and changes nothing, when the automation is switched on (pause it first), archived (restore it first), part-way through for any contact, or built with branches (edit those in the visual builder; you can still rename it or change its trigger).
5. `preview_automation` again after every change.

## Tidying up
- `archive_automation` clears old copies away. Archived automations never run, drop out of `list_automations`, and come back with `archived: false`. Nothing is deleted.
- Permanent deletion happens in Vexur, not here. If the user wants a copy gone for good, archive it and tell them where Delete is.
- It refuses a switched-on automation: archiving never stops one that is running.

## Rules and gotchas
- Linear only. `if_else`, `multi_branch`, `percent_split`, `for_each` and `goto` are refused; branches are built in the visual builder. Say so and offer the closest linear version.
- Sending steps reach real people once the automation is on. Confirm the recipient, subject and body with the user before it is switched on.
- SMS and WhatsApp steps need consent evidence per contact; the tool notes it.
- Credits: some actions cost credits per run; the create response lists them.

## Failure handling
- "not filters for": remove the key, or use one from the trigger's `filter_keys`.
- "runs in context ... Pass context": rebuild or update with the context it names.
- "Unknown action_type" or "Unknown trigger_type": pick from `list_workflow_actions` or `list_workflow_triggers`.
- "is a branching action": build the linear part here and tell the user where the branch is drawn.
- "is switched on" / "is archived" / "part-way through": the refusal names the next step; say it to the user rather than working around it.

## Done means
The automation exists once (no copies), `preview_automation` shows no errors for a real contact, the user has seen the filled-in messages, and it was switched on only after their explicit yes, or they know to switch it on in Vexur.
