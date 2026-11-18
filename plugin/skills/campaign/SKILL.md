---
name: campaign
description: "Plans, targets, assembles, launches and reports a multi-channel hub campaign: container and audience, email, SMS and paid ad drafts, linked pages, blogs and sequences, launch, then performance. Use when the user wants to run or review a campaign, send an email blast, set a campaign audience, or draft paid ads. Paid ads: ask the goal, destination and budget first. MCP publishes ads with publish_ad_campaign after a clear yes (Meta spends at publish; Google and LinkedIn need go_live: true); it never sends SMS."
---

> Vexur's `campaign` playbook, version 12. With the Vexur connector connected, call `get_skill` with key `campaign` first and follow that live version wherever the two differ.

# Run a multi-channel campaign

## When to use
Any hub campaign work: planning a push, setting the audience, sending an email blast, drafting paid ads, drafting SMS, assembling email plus social plus pages plus sequences under one campaign, launching, and reading results. This one playbook owns everything campaign shaped.

## The three campaign concepts (never conflate)
- Hub campaigns: planning containers in Marketing Lab that everything links to (`create_campaign`, `list_campaigns`, `update_campaign`, `get_campaign_readiness`, `launch_campaign`).
- Ad-builder drafts: paid ad specs created by `create_ad_campaign_draft` and edited by `update_ad_campaign_draft`. A draft spends nothing. `publish_ad_campaign` (confirm_spend: true) creates the real ad on Meta, Google or LinkedIn. Do not pass confirm_spend: true, for any platform, until the person has said yes to the read-back in section C. On Meta, confirm_spend: true is itself the spend approval: Meta ignores go_live and the ad starts delivering at publish. Google and LinkedIn also start spending at publish, but publish refuses until go_live: true is passed (unless the start date is in the future). A future start date makes everything wait for that date.
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

### C. Paid piece

Paid ads spend real money, so the questions come before the draft. Before you create any draft, ask the person these four things and wait for the answers. Do not guess, and do not fill a gap with a default. If an answer is partial (a budget with no dates, an objective with no destination), ask again for the missing part.

1. What do we pay for? One action: a form fill, a booking, a phone call, a message, visits to a page, or video views or likes. This sets the objective. There is no default objective: the tool refuses to create a draft without one. A messaging block alone implies a messages ad, but still ask. If the person asks for leads and a form on their own page, confirm that the page tracks the Lead event (conversion_event) rather than assuming it does.
2. Where do people land? Four choices: a Facebook instant form (platform_config.meta.lead_form_id, leads ads only, Meta only), the customer's own page, a booking page, or messages (objective messages with the messaging block, no destination_url needed, Meta only). Every choice except messages and an instant form needs the page address. LinkedIn and website ads cannot be published without one.
3. How much? A budget in dollars and the start and end dates. A daily budget works on every platform. A total (lifetime) budget works on Meta only, because Google Ads refuses a total budget. Do not offer a total budget for Google.
4. Which campaign does it belong to? Use `list_campaigns` and pass its id as `hub_campaign_id`.

Then follow these steps.

1. `list_media` for the media_ids.
2. `create_ad_campaign_draft` with hub_campaign_id, name, platforms (meta_ads, google_ads, linkedin_ads), the objective the person chose, budget, budget_type (AUD), copy fields (headline, primary_text, ad_description, cta_type, destination_url, or the messaging block, or the lead form id), dates and media_ids. There is no default objective; the tool refuses to create a draft without one.
3. ALWAYS pass targeting. An empty targeting graph makes Meta run the ad across the whole country, and the tool warns when you leave it out. Use targeting.locations with radius_km for a service area, or targeting.country for a national push. Every Meta location needs latitude and longitude or publish refuses, and a Meta ad needs a location or country AU.
4. housing_category defaults to TRUE and is correct for property, real estate and buyers-agent ads. It sets Meta's Special Ad Category HOUSING, which strips age, gender and postcode targeting and forces a 15km minimum radius. Set it false only for an ad that is genuinely not about housing, and say why. Read back its real setting and tell the person.
5. ALWAYS pass hub_campaign_id when assembling a campaign: omitting it silently creates a brand new hub campaign named after the ad, the main duplicate trap.
6. Unknown or foreign media_ids do not error; they are silently omitted. Compare the returned creative_ids length with the media_ids you sent. If a media_ids mismatch shows, re-run `list_media` and re-attach the missing ones.
7. `update_ad_campaign_draft` merges copy rather than replacing it and returns `configured`: false means the ad cannot publish yet and the notes say what is missing (creatives, copy, destination URL). It refuses live, publishing and archived specs, because editing those desynchronises Vexur from the platform.
8. Likes or engagement: do not use these for a campaign whose goal is leads, traffic or sales. The draft tool accepts it with a warning, and publish refuses it, only when the ad is likes and comments inside a hub campaign whose goal is leads, traffic or sales. Unless the person has said in their own words that they want likes, ask them. Pass their exact words in platform_config.meta.engagement_acknowledgement. Never write it for them and never pass true.
9. Before `publish_ad_campaign`, read back in plain English: the goal, the objective, where the click goes, the creative and copy (headline and primary text), the targeting area, the budget and the dates. Then say one of two things. If there is no future start date: "This goes live and starts spending as soon as you say yes." If there is one: "This starts on <date> and spends from then." Get a clear yes. Do not pass confirm_spend: true, for any platform, until the person has said yes to that read-back. For Google and LinkedIn, also pass go_live: true on publish, and only after that yes.
10. After publish, quote every warning word for word before you say the ad is set up. Read data.warnings and the notes (the draft warnings: whole country, Advantage+ audience, automatic placements, engagement ad, missing latitude or longitude) and data.platform_warnings (the platform's own warnings). A warning such as "Meta will not be told when someone fills in your form" means the ad cannot learn who converts. If a warning says that, tell the person before you say the ad is set up, and do not call the ad ready. Fix it or tell them. Also relay the publish note about missing 4:5 or 9:16 creatives and the currency mismatch note.
11. `publish_ad_campaign` returns status, activated, platforms, notes, warnings, platform_warnings and ads_url. It does not return still_not_delivering or blockers. After publish, check `list_ad_campaigns` (and `get_campaign_readiness`) and say the ad is live only when the ad itself, not only the campaign, reads active. If you use `resume_ad_campaign`, read still_not_delivering on its answer.
12. Check results after launch. `get_ad_performance` covers synced campaigns only, so a fresh ad has no numbers yet: use `list_ad_campaigns` first to see whether it has synced and is delivering, and wait for the next sync before reading numbers. Once it has synced, call `get_ad_performance` for spend, results and cost per result, and `get_campaign_performance` for the whole hub campaign including ads made in Ads Manager. Look after the first full day of delivery and again after a few days. If it is spending with no result, tell the person, then check the objective, the conversion event and the page, in that order. Any spend limit you suggest before judging an ad is a rule of thumb the person must agree to. Do not state a dollar figure as if the platform required it.

Google and LinkedIn, and publishing:
- `publish_ad_campaign` publishes Google and LinkedIn as well as Meta, and they start spending at publish. Publish refuses until go_live: true is passed after the person says yes to the spend (unless the start date is in the future). Meta ignores go_live.
- Google: google-ads-create supports SEARCH, DISPLAY and PERFORMANCE_MAX (the campaign_type field). Search ads need 3 headlines (30 characters at most), 2 descriptions (90 at most), at least 1 keyword and an https:// address. A total budget is refused, so use a daily one. If the tool refuses, read the reason to the person. Do not work around it.
- LinkedIn: ask for the destination URL. Nothing is substituted for a missing one. Audience choices (industry, seniority, job function) must be ids or urn:li: values, because names are refused, and company_targeting is not supported. If the tool refuses, read the reason to the person.
- Messages ads run on Meta only. Google and LinkedIn refuse them.
- Publish also refuses when this connection or the caller lacks Send / publish for ads, when the spec is already live, and when creatives, copy or the objective are missing.
- A spec marked partially_live can be published again, and the platforms already live are skipped. A draft marked publishing for under 10 minutes must be left alone: do not publish it again.
- `launch_campaign` never publishes paid drafts, and that is deliberate, so a multi-channel launch cannot start spending money by accident. Paid goes live only through `publish_ad_campaign` after the yes in step 9, or in Marketing Lab.

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
- Forms, calendar widgets and client video testimonials: `link_form_to_campaign`, `link_calendar_widget_to_campaign` and `link_video_testimonial_to_campaign` put them on the campaign map, and the same tools unlink them.
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
- `get_ad_performance` covers synced campaigns only; a fresh draft or a fresh ad has no metrics by definition.
- Paid ads go live only through `publish_ad_campaign` after the person's yes to the read-back (section C step 9), or when a person releases them in Marketing Lab. Meta spends at publish, so confirm_spend: true is itself the spend approval.
- Deleting library media that an ad creative references breaks the creative; keep campaign media in the library.
- Meta posts without a verified public URL land partially_published. The campaign being active does not mean every piece shipped.

## Failure handling
- Launch or blog publish refused (no Send / publish): stop, explain, offer the two real paths.
- content_failed above zero: quote failure_messages, fix the named pieces (connection, media, caption), publish them individually; do not re-launch.
- "audience.tags is required for type tags" (and the contact_ids, segment_id and pipeline_stage_id equivalents): supply the companion field.
- "hub_campaign_id was not found (or is not accessible)": `list_campaigns` and use a real id, or omit only for a genuinely standalone piece.
- "Only draft, failed or paused ad specs can be edited here" (or a refusal naming a live, publishing or archived spec): the ad is live or being published; changes belong in Marketing Lab > Ads. Publish also accepts a partially_live spec, which the edit tool does not.
- "This post is not attached to a Website Lab site": attach it in the blog editor before publishing.
- blockers[] non-empty at preflight: fix each one before launching, not after.

## Done means
One container with no duplicate, an audience actually set (or the user told plainly that it targets everyone), every piece attached and accounted for, housing compliance correct on any property ad, an explicit user confirmation before launch, every count and failure reason reported with the notes, SMS flagged for manual release in Marketing Lab, and paid ads released by `publish_ad_campaign` only after a clear yes to the read-back (or by a person in Marketing Lab), and follow-up pointed at `get_campaign_unworked_leads`.

### Click-to-message ads and replies
- `create_ad_campaign_draft` / `update_ad_campaign_draft` accept `objective: "messages"` with a `messaging` block `{ destination: messenger | instagram | whatsapp, welcome_message, quick_replies? (max 4, 80 characters each) }`. destination_url is optional on a messages ad. Meta only.
- A messages ad opens conversations, so something has to answer them: attach a rule or journey with `attach_auto_reply_to_campaign` (or `hub_campaign_id` on the rule/journey). `get_campaign_readiness` shows a Replies programme that warns when nothing is attached; it never blocks launch.
- Reading and answering those conversations is the `conversations` skill (`get_skill` conversations).
- `create_sequence` also takes `sms` steps (text; consent warning applies) and, on the `social_dm_received` trigger only, `social_dm` steps (message; sends inside Meta's messaging window).
