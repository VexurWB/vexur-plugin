---
name: conversations
description: "Read and reply to Messenger, Instagram, WhatsApp and SMS conversations, assign and triage them, pause the bot on one thread, switch auto-replies on per channel, write keyword rules, build and publish Auto Reply journeys, and read reply metrics for a campaign."
---

> Vexur's `conversations` playbook, version 2. With the Vexur connector connected, call `get_skill` with key `conversations` first and follow that live version wherever the two differ.

# Run the inbox and auto-replies after launch

## When to use
Anything that happens after a campaign goes live and people start talking back: reading DMs and comments, replying, deciding who handles what, switching the auto-reply engine on, writing a keyword rule, building or publishing a journey that answers comments and DMs, checking what the bot has done, and reporting reply metrics. If the task is about the campaign container, ads or pages, use the `campaign` skill; this one owns the conversation once it exists.

## The four things that reach a real person
Each of these puts words in front of a customer. Confirm with the user before every one. A connection without Send / publish for that area is refused, with the app surface that still does it:
- `send_conversation_reply` sends one message to one customer, from the user, now.
- `set_auto_reply_channel` with mode suggest or autopilot switches automated replies on for every conversation on that channel.
- `create_auto_reply_rule` with `enable: true`, or `update_auto_reply_rule` with `enabled: true`, makes a rule live.
- `publish_auto_reply_journey` makes a journey live. It needs `acknowledge_compliance: true`, which the OWNER gives; never pass it on your own initiative. The database runs its own publish checks and refuses on any error-severity issue; return the issues, fix them with `update_auto_reply_journey`, try again.

Everything else here is reading or internal inbox state (assign, triage, pause) and needs no confirmation.

## Identify a conversation
`list_conversations` returns a `conversation_ref` per row. Pass it back exactly as received: social threads are `{channel, thread_key, connection_id}` (the connection id is part of the identity, because the same customer can message two connected Pages), SMS and WhatsApp threads are `{channel, conversation_id}`. Never build one by hand.

## Reading
1. `list_conversations` with the filters the user asked for. `unread: true` means the customer spoke last (social) or the thread is unread (SMS/WhatsApp). `origin` filters social threads by how they started: `ad` (click-to-message ad), `post`, `ref` (m.me/ig.me link). `campaign` on a row is the attribution from campaign_contacts.
2. `get_conversation` for the thread and its recent messages. Each message carries `author` and `automated`. An automated send is labelled with its AI name, for example "Alex AI (AI)" or "Automation": say so when you summarise it, and never present an automated reply as something a person wrote.
3. `get_campaign_conversations` for the threads that belong to one hub campaign: contacts attributed through a social DM or comment, plus threads that started from one of the campaign's click-to-message ads.

## Replying
- Social replies go through Meta. Meta only accepts a reply inside the window the customer's own message opens (24 hours for Messenger and Instagram). A thread with `can_reply: false` has no inbound message yet. If the send is refused for the window, return the refusal text as it came back; do not paraphrase it and do not retry.
- SMS and WhatsApp replies go through the SMS send path, which checks consent and opt-outs first. A refused send names the reason (opted out, no consent); do not work around it.
- `quick_replies` are Messenger/Instagram only: at most 13, 20 characters each. The tap comes back as a normal inbound message.
- A human reply pauses the bot on that thread for the channel's human pause window automatically. To take over for longer, `pause_conversation_automation` with `paused: true` and optional `minutes`; `paused: false` resumes. This pauses ONE thread, never the channel.

## Triage
- `assign_conversation` to a teammate (`assignee_user_id`), to yourself (`assign_to_me: true`) or unassign (`assignee_user_id: null`). The assignee must be on the team that owns the thread.
- `set_conversation_status`: open (needs an answer), pending (waiting on the customer), resolved (done). `snoozed` with `snooze_until` is social only; SMS and WhatsApp use pending instead.

## Auto-replies: the engine
1. `list_auto_reply_channels` first. It tells you per channel whether the engine is on, the mode, the hold delay and human pause, and whether the feature is available to this team at all (`available`, `availability_reason`). Only the team owner can change these; a member is refused.
2. mode `suggest`: rules fire, AI drafts are held for a person to approve. mode `autopilot`: AI replies send on their own after the hold delay. mode `off` disables the channel.
3. `set_auto_reply_channel` changes one channel. Turning a channel on is a release; see the top of this playbook.

## Auto-replies: rules
- A rule is deterministic: keyword (needs `keywords`), away_hours (needs `active_hours`), comment (Messenger/Instagram only, optionally scoped with `post_ids`), new_conversation, story_reply, ref_link (the ref codes go in `keywords`).
- Create it DISABLED (`create_auto_reply_rule` without `enable`), then `preview_auto_reply` with a message a customer would actually send to see what fires, then enable it with `update_auto_reply_rule` `enabled: true` once the user has approved the copy.
- `reply_variants` rotate; give two or three so replies never look canned. `public_reply_variants` are the public comment text on comment rules (text only; attachments go in the private reply).
- `hub_campaign_id` on a rule is a reporting link: `get_campaign_readiness` and `get_campaign_conversations` read it. Attach or detach later with `attach_auto_reply_to_campaign`.
- Delete only when asked; `enabled: false` keeps the rule and its history.

## Auto-replies: journeys
- A journey is a workflow on the auto_reply surface: one trigger (`social_dm_received`, `social_comment_received`, `social_link_clicked`, `sms_received`, `whatsapp_received`) plus an ordered chain of actions. Read `list_workflow_triggers` and `list_workflow_actions` first and use their ids and `config_fields` names; the tools refuse a key that is not in the catalogue, because the dispatcher would otherwise match nothing.
- `reply_to_social_comment` only works after `social_comment_received`. `send_social_dm`, `social_follow_up`, `send_sms` and `send_whatsapp` need `config.message`. An `ai_auto_reply` step should be followed by a send step whose message is `{{ai_reply_text}}`, with a handoff for uncertain, complaint, finance, legal and "speak to a person" messages.
- `create_auto_reply_journey` creates a DRAFT and returns `publish_issues`. Fix errors with `update_auto_reply_journey` (a live journey must be paused first with `pause_auto_reply_journey`). Publish only as described at the top. Attach it to a campaign with `hub_campaign_id` or `attach_auto_reply_to_campaign`.
- Branching (if_else, multi_branch, percent_split, for_each, goto) cannot be built here; say so and point the user at Conversations > Auto-replies.

## Watching it work
- `get_auto_reply_activity`: what is held in the queue right now, what the engine did recently and why (sent, skipped, escalated, failed), the 7-day tallies, and per-journey metrics.
- `get_conversation_metrics` (team or one `campaign_id`, last N days): inbound volume by channel, automated versus human replies, median minutes to first reply, engine outcomes, journey clicks. Counts are live reads under the user's access; say "in the last N days" and never invent a number the tool did not return.
- For a campaign with a click-to-message ad or linked posts, `get_campaign_readiness` includes a Replies programme that warns when nothing is attached to answer the conversations the campaign will open. It is a warning, never a launch blocker.

## Failure handling
- "not on a team yet": auto-replies are a team setting; the user creates the team in Team Lab.
- "Only the team owner": a member cannot change engine settings, rules or journeys; tell the user who can.
- "not available yet" on pause for SMS/WhatsApp, or on rule hub_campaign_id: the database is behind the worker; say so plainly and offer the app route.
- Any refusal that names review or Send / publish: relay it, including the app route; do not retry.
