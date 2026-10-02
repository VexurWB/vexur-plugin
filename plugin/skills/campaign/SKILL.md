---
name: campaign
description: "Plans, targets, assembles, launches and reports a multi-channel hub campaign: container and audience, email, SMS and paid ad drafts, linked pages, blogs and sequences, launch, then performance. Use when the user wants to run or review a campaign, send an email blast, set a campaign audience, or draft paid ads. MCP publishes ads with publish_ad_campaign (paused unless go_live); it never sends SMS."
---

> Vexur's `campaign` playbook, version 10. With the Vexur connector connected, call `get_skill` with key `campaign` first and follow that live version wherever the two differ.

# Run a multi-channel campaign

## When to use
Any hub campaign work: planning a push, setting the audience, sending an email blast, drafting paid ads, drafting SMS, assembling email plus social plus pages plus sequences under one campaign, launching, and reading results. This one playbook owns everything campaign shaped.

## The three campaign concepts (never conflate)
- Hub campaigns: planning containers in Marketing Lab that everything links to (`create_campaign`, `list_campaigns`, `update_campaign`, `get_campaign_readiness`, `launch_campaign`).
- Ad-builder drafts: paid ad specs created by `create_ad_campaign_draft` and edited by `update_ad_campaign_draft`. `publish_ad_campaign` ships one to Meta PAUSED (confirm_spend: true); nothing spends until go_live: true or a person activates it in Ads Manager.
- Platform-synced ad campaigns: read-only mirrors of live Meta, Google and LinkedIn campaigns (`list_ad_campaigns` source synced, `get_ad_performance`).

## Prerequisites
Every content piece exists as a draft before launch (launch publishes and arms what is linked; it creates nothing). Creatives are media library items (get media in first via the social playbook's media section). Landing pages are published via the landing-page-builder playbook (`get_skill` landing-page-builder).

## Steps

### A. Container and audience
1. `create_campaign` with name, goal, channels, budget and dates. This is always safe to call first; every other tool attaches to it with hub_campaign_id.
2. Set the audience in the SAME call or immediately after with `update_campaign`. Call `list_audiences` first: segment_id and pipeline stage ids are uuids that cannot be guessed. Precedence at send time is segment_id, then audience_tags, then audience_pipeline_stage_ids. Leaving all three empty means every channel targets all contacts, and the tool says so in notes[]. Never present that as deliberate targeting.
3. Optional planning fields: channel_budgets (per-channel split), target_metric, target_value, target_cost_per_result_max. These drive the campaign pacing strip.
4. Declaring channel `sms` returns a note: MCP can draft SMS but never sends it.

### B. Email piece
1. `create_email_campaign_draft` with hub_campaign_id, subject and html_body. Optional: preheader, description, goal (defaults to leads), audience, schedule_at. Omit hub_campaign_id ONLY when the email is the whole campaign; the tool then creates the container for you and returns campaign_created true.
2. With no `audience` argument the email inherits the campaign's targeting when it has any, otherwise the consent-aware newsletter audience. Check the returned `audience` object and notes[] rather than assuming.
3. Explicit audience types and their required companion fields: newsletter (no companion), all, tags (audience.tags), contact_ids (audience.ids), segment_id (audience.segment_id). The tool rejects a type whose companion is missing; supply the companion, never switch to type all as a workaround.
4. schedule_at is ISO 8601; no offset means Australia/Perth; past times are rejected. When the caller lacks publish permission on the team, the email saves as a DRAFT instead and the reason appears in notes[]; the call still succeeds. Report the stored status, not the intent.
5. Never state an audience size as fact. newsletter_audience_rows can be null, and even a number is only currently matching rows: the consent gate at send time decides who actually receives. Phrase numbers as "currently matching rows".

### C. Paid piece (drafts only)
1. `list_media` for media_ids (ingest new assets first via the social playbook's media section).
2. `create_ad_campaign_draft` with hub_campaign_id, name, platforms (meta_ads, google_ads, linkedin_ads), objective (defaults to leads), budget and budget_type (AUD, defaults daily), copy fields (headline, primary_text, ad_description, cta_type, destination_url), dates and media_ids.
3. ALWAYS pass targeting. An empty targeting graph makes Meta run the ad across the whole country, and the tool warns when you leave it out. Use targeting.locations with radius_km for a service area, or targeting.country for a national push.
4. housing_category defaults to TRUE and is correct for property, real estate and buyers-agent ads. It sets Meta's Special Ad Category HOUSING, which strips age, gender and postcode targeting and forces a 15km minimum radius. Set it false only for an ad that is genuinely not about housing, and say why.
5. ALWAYS pass hub_campaign_id when assembling a campaign: omitting it silently creates a brand new hub campaign named after the ad, the main duplicate trap.
6. Unknown or foreign media_ids do not error; they are silently omitted. Compare the returned creative_ids length with the media_ids you sent; if shorter, re-run `list_media` and re-attach the missing ones.
7. Fix a draft with `update_ad_campaign_draft`, which merges copy rather than replacing it and returns `configured`: false means the ad cannot publish yet and the notes say what is missing (creatives, copy, destination URL). It refuses live, publishing and archived specs, because editing those desynchronises Vexur from the platform.
8. Ship it with `publish_ad_campaign` (ad_campaign_id, confirm_spend true, optional go_live). This creates the real campaign, ad set and ad on Meta, all PAUSED, so nothing spends until go_live is passed or someone activates in Marketing Lab. It refuses when this connection lacks Send / publish for ads, when the caller lacks publish permission, when the spec is already live, and when the draft is missing creatives, copy or a destination URL. It also warns when the attached creatives do not cover both feed and vertical shapes. `launch_campaign` still never publishes paid drafts; that is deliberate, so a multi-channel launch cannot start spending money by accident.

### C2. Creative sizes (say them BEFORE the user uploads)
Meta accepts a narrow band per placement and crops anything outside it. Advantage+ placements spans about 30 placement types, so one asset is the wrong shape nearly everywhere it runs. Tell the user these numbers up front, do not wait for a bad upload.

| Placement | Ratio | Pixels |
| --- | --- | --- |
| Feed (Facebook and Instagram), marketplace, search | 1:1 or 4:5 | 1080x1080 or 1080x1350 |
| Stories, Reels, WhatsApp status | 9:16 | 1080x1920 |
| Right column | 1:1 | 1080x1080 |

- Ask for BOTH a 4:5 and a 9:16. That pair covers every Meta placement.
- If only one is possible, take 4:5. It is valid in feed and wins the most screen. It is not valid for stories or reels.
- A 9:16 image in feed is centre cropped to 4:5, which eats a logo at the top and the last line at the bottom. Never ship 9:16 alone to an automatic placements ad set.
- Images max 30MB. Reels max 90s, stories max 120s. Video for stories and reels needs audio; a silent master is flagged by Meta even at the right ratio.
- Serving a different ratio per placement needs placement asset customization, which no MCP tool can express. That step is done in Ads Manager.

### D. Attach the rest
- Social: `create_social_post_draft` and `create_reel_draft` with hub_campaign_id.
- SMS: `create_sms_campaign_draft` with hub_campaign_id. It writes a draft and NEVER sends; the send is always released by a human in Marketing Lab. Audience inherits from the campaign the same way email does.
- Blog: `create_blog_post_draft` with hub_campaign_id. Launch never publishes blogs; release them with `publish_blog_post`, which needs the post attached to a Website Lab site.
- Pages: `link_landing_page_to_campaign` (page_id, campaign_id), pages already published. `list_landing_pages` with unlinked_only true finds pages still to attach.
- Sequences: `list_sequences` then `attach_sequence_to_campaign`. This links the sequence to the campaign; it does NOT activate it. An inactive sequence enrols nobody, and the tool says so in notes[].

### E. Launch (gated)
1. Preflight with `get_campaign_readiness`. It returns the same per-channel checklist the Campaign detail page shows, plus blockers[], ready_to_launch, audience_set and unscheduled_content. Use `get_campaign_performance` when you also need the full linked-asset inventory.
2. Read back to the user exactly what will happen before launching: which pieces publish now, which are armed for a future slot, the email audience description, and that paid ads will be skipped. Launch makes content public; get an explicit yes first, never launch speculatively.
3. `launch_campaign` sets the campaign active and then, per linked piece: a future send slot is ARMED to scheduled and fired later by the publish cron, and a piece with no slot or a past slot publishes immediately through the audited publish engine. Draft AND pending-approval pieces are both launched, because a manager launching counts as approving them.

### F. Report and follow up
1. Relay content_published, content_scheduled, content_failed, content_pending_approval, paid_ads_skipped, failure_messages and notes verbatim. content_scheduled is not a failure, it means armed for its slot. Never summarise a partial launch as a success.
2. `get_campaign_timeseries` for daily performance; `get_campaign_unworked_leads` for the speed-to-lead loop (see the lead-followup skill).

## Rules and gotchas
- Launch acts only on linked content that is draft or pending_approval with at least one platform. Scheduled, publishing and published pieces are untouched, which is correct: they are already armed or done.
- A connection without Send / publish for that area is refused `launch_campaign`, `publish_blog_post` and email scheduling. The two real paths: act in Marketing Lab, or tick Send / publish for this connection in Team Lab > Integrations > MCP & AI. Do not work around it.
- A caller without publish permission does not fail launch: linked content moves to pending_approval and the team owner is notified; the response says so in notes. Report that state, not "launched".
- Twitter platforms are silently dropped from each piece at launch; a note appears only when a piece was twitter-only and therefore skipped entirely.
- Launch reads linked content from both the junction table and hub_campaign_id, so anything created with hub_campaign_id is picked up. Still verify the counts in the launch response.
- `get_campaign_performance` returns linked_ads including ads created in Ads Manager and attributed here (origin platform). A live budgeted ad you did not author still counts against the campaign.
- `get_ad_performance` covers synced campaigns only; a fresh draft has no metrics by definition.
- Deleting library media that an ad creative references breaks the creative; keep campaign media in the library.
- Meta posts without a verified public URL land partially_published. The campaign being active does not mean every piece shipped.

## Failure handling
- Launch or blog publish refused (no Send / publish): stop, explain, offer the two real paths.
- content_failed above zero: quote failure_messages, fix the named pieces (connection, media, caption), publish them individually; do not re-launch.
- "audience.tags is required for type tags" (and the contact_ids, segment_id and pipeline_stage_id equivalents): supply the companion field.
- "hub_campaign_id was not found (or is not accessible)": `list_campaigns` and use a real id, or omit only for a genuinely standalone piece.
- "Only draft, failed or paused ad specs can be edited here": the ad is live; changes belong in Marketing Lab > Ads.
- "This post is not attached to a Website Lab site": attach it in the blog editor before publishing.
- blockers[] non-empty at preflight: fix each one before launching, not after.

## Done means
One container with no duplicate, an audience actually set (or the user told plainly that it targets everyone), every piece attached and accounted for, housing compliance correct on any property ad, an explicit user confirmation before launch, every count and failure reason reported with the notes, paid drafts and SMS flagged for manual release in Marketing Lab, and follow-up pointed at `get_campaign_unworked_leads`.

### Click-to-message ads and replies
- `create_ad_campaign_draft` / `update_ad_campaign_draft` accept `objective: "messages"` with a `messaging` block `{ destination: messenger | instagram | whatsapp, welcome_message, quick_replies? (max 4, 80 characters each) }`. destination_url is optional on a messages ad. Meta only.
- A messages ad opens conversations, so something has to answer them: attach a rule or journey with `attach_auto_reply_to_campaign` (or `hub_campaign_id` on the rule/journey). `get_campaign_readiness` shows a Replies programme that warns when nothing is attached; it never blocks launch.
- Reading and answering those conversations is the `conversations` skill (`get_skill` conversations).
- `create_sequence` also takes `sms` steps (text; consent warning applies) and, on the `social_dm_received` trigger only, `social_dm` steps (message; sends inside Meta's messaging window).
