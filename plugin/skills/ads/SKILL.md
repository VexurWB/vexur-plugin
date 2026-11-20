---
name: ads
description: "Paid ads on Facebook, Instagram, Google and LinkedIn: ask the goal, where people land and the budget first. Ads go live when published (or on a future start date). Read the confirmation sentence word for word, get a clear yes, then publish."
---

> Vexur's `ads` playbook, version 6. With the Vexur connector connected, call `get_skill` with key `ads` first and follow that live version wherever the two differ.

# Paid ads

Paid ads spend real money and they start spending when you publish. Ask first, draft second, publish only after a clear yes.

## 1. Ask these in order, and wait for each answer

Do not guess. Do not fill a gap with a default. If an answer is partial, ask again for the missing part. The draft tool refuses with the missing question, and nothing is created.

1. What do you want this ad to get you? Offer these, in these words, and let the person pick one. Send the code in `goal_key`:
   - Get enquiries on a Facebook or Instagram form, counted as Leads (`enquiry_meta_form`)
   - Get messages (Messenger, Instagram, WhatsApp), counted as Conversations started (`messages`)
   - Send people to a listing or page, counted as Landing page views (`listing_visits`)
   - Get seen by more local people, counted as People reached (`reach`)
   - Get video views, counted as Video views (`video_views`)
   - Get likes, follows or post reactions (not enquiries), counted as Reactions or likes (`engage_not_leads`)
   - Get enquiries on one of my Vexur pages or forms, counted as Form leads (`enquiry_page`). Facebook and Instagram only. It needs a Vexur page or form as the destination (`vexur_page`) and the Meta pixel on that page.
   - Not available on customer accounts yet, so do not offer them as choices: booked calls or appointments, counted as Bookings (`booked_call`); event or webinar sign-ups, counted as Registrations (`event_signup`); online sales, counted as Purchases (`online_sales`); job applicants, counted as Applicants (`job_applicants`)
   There is no default and no "Other". Never pick for the person, and never pick the likes goal because the copy says "comment" or "like". `objective` is an old alias: do not send it. Phone call ads (`phone_calls`) are not on the menu because Vexur cannot count calls. If the person asks for one, say so plainly. The tool's own question may still list phone calls (`phone_calls`) or the goals above without a label. Follow this menu and say so: customer accounts are refused `phone_calls` too (it is a new ability, open to test accounts only), so never offer it.
   The four goals in the last bullet have not been proven on a live ad yet. On a customer account the tool refuses them with the reason that the goal has not been proven on Facebook and Instagram yet, so it cannot be published from a customer account. Only a test account or an older draft can use them, so no `goal_unproven` warning appears and you must not promise one. If the person asks for one, read the reason to them and offer a proven goal: Leads on a Facebook form, Form leads on a Vexur page, Messages, Landing page views, Reach, Video views or Likes. Google and LinkedIn also refuse goals they cannot run, with a reason: read it and offer Facebook and Instagram.
2. Which campaign does it belong to? Use `list_campaigns` and pass `hub_campaign_id`. Leaving it out silently creates a new hub campaign named after the ad (the duplicate trap), even though the tool notes it. If there is no campaign yet, `create_campaign` needs a goal (leads, traffic, awareness, engagement or sales): ask, there is no default. The ad's goal must match the campaign's goal. If it does not, say so in plain words ("This campaign is for enquiries, but this ad is set to get likes") and ask what they want. A mismatch is refused unless the person writes, in their own words, why they want it. Pass their exact words in `hub_goal_acknowledgement` (it is saved as `acknowledgements.hub_goal_mismatch`; the tool still accepts the old field, but use this one name only). Never write it for them and never pass true.
3. Where do people land? For every goal that sends people somewhere this is required and you must not infer it. Send it in `destination` with a `kind`:
   - `instant_form`: a Facebook or Instagram form (Meta only, and the form must be active and on the same Page the ad runs from). Call `list_meta_lead_forms`, let the person pick, and pass `destination.form_id`. If there is none, ask for the form name, the type (`more_volume` is quick to fill in, `higher_intent` adds a review step so there are fewer, warmer leads), the questions, the privacy policy link and the thank-you link. `page_id` is needed when the person has more than one Facebook Page. `create_meta_lead_form` creates a real form on their Page and needs their approval each time, like publishing: read the form back (name, questions, privacy link, thank-you link) and wait for the yes before you call it. If the connection cannot publish, say so and give them the Marketing Lab link instead.
   - `vexur_page` or `vexur_calendar`: one of the team's published Vexur pages, forms or booking calendars, with `destination.url` and `destination.label`.
   - `messages_app`: `{ kind: "messages_app", messaging_app: "messenger" | "instagram" | "whatsapp" }` together with the `messaging` block `{ destination, welcome_message, quick_replies? }` (welcome message up to 1000 characters, up to 4 quick replies of 80 characters). The two apps must match.
   - `phone`: a number in `destination.phone`.
   - `other_url`: a typed web address, the last choice.
   The draft answer says in plain words where people will land. Read that sentence to the person and fix it if it is not what they meant.
4. Which platforms? Facebook and Instagram (`meta_ads`) are fully built. Google Ads runs Search ads only: `platform_config.google.campaign_type` is SEARCH or left out, and Display, Performance Max and Demand Gen are refused with the reason, so do not offer them and do not suggest them as a way round a refusal. A Google Search ad needs 3 headlines (30 characters at most), 2 descriptions (90 at most), at least 1 keyword and an https:// address. LinkedIn needs a destination URL (nothing is substituted for a missing one), and its industry, seniority and job function choices must be ids or urn:li: values because names are refused. A goal a ticked platform cannot run is refused with a plain reason. Read the reason to the person and offer Facebook and Instagram. Do not work around it. Call ads, Customer Match lists, LinkedIn Lead Gen Forms and LinkedIn job title or company list targeting are built but not proven: if asked, say so and give the reason the tool returns.
5. Who should see it? Places with a radius: each entry in `targeting.locations` is `{ name, lat, lng, radius_km }`, and `lat` and `lng` are needed on Facebook and Instagram: publish refuses a Meta location without them, so never leave them out. A Meta ad needs a location or the country AU. Or all of Australia (`whole_australia`). Other `targeting` fields: `country` (two letters, for example AU), `age_min`, `age_max`, `genders` (stripped on housing ads). And `audience_temperature`: `cold` (new people), `warm_retarget` (people who already know you) or `exclude_clients` (new people, existing clients left out).
6. How much, and for how long? Send `budget` in dollars with `budget_type`, and the start and end dates. A daily budget works on every platform. A total budget (`lifetime`) needs an end date and works on Facebook and Instagram only, which is what the tool itself says, so do not offer it for Google or LinkedIn. Google and LinkedIn need a daily budget. A team spend limit can refuse a budget or a total.
7. What are you advertising? Send `advertiser_type`: `property_services`, `finance_credit`, `employment` or `other`. Ask once. It decides the advertising rules and which warnings you see. If you leave it out, the draft tool asks for it. On a later ad the tool names the last answer and asks whether this one is the same, so confirm with the person's yes rather than asking from scratch.
8. Who gets the leads? Send `lead_owner`, for enquiry goals, when the team has more than one person.
9. What does the ad say, and which pictures or video? `list_media` for media ids. Ask for both a 4:5 and a 9:16 picture or video before the upload (see `get_skill campaign` section C2 for the sizes), because only publish warns about crops. Write plain, factual copy: what it is, who it is for, what the person does next. Do not promise results or outcomes. The draft tool checks the headline, the primary text and the description for banned claims. Each warning appears in the answer's `notes` list, starting "Check the wording." and naming the phrase. Read each one to the person and fix the wording. A claim that promises guaranteed returns is refused with an error on `create_ad_campaign_draft`, `update_ad_campaign_draft` and `publish_ad_campaign`: nothing is made, changed or published until it is reworded. Phrases that say a business is compliant, audit-proof, cleared or screened (for example "AUSTRAC compliant", "audit-proof", "no AML flags") are warned about every time, because the ad cannot know it is true for each reader. Whether a given phrase is unlawful is not confirmed: it is the team's rule, so do not tell the person it is the law.
10. If the goal is likes on Facebook or Instagram, `engage_target` is required (`post_reactions` or `page_likes`). Ask which.

## 2. Housing rule

The housing ad category stays ON by default for property ads. Whether Meta applies it to Australian targeting is not confirmed yet, so do not switch it off on a guess. It removes age, gender and postcode choices and forces a minimum radius of 15 miles (about 25 km), not 15 km. The exception is built in: for `advertiser_type` `finance_credit` or `employment`, and for the `job_applicants` goal, housing is switched OFF and Meta's own special category for finance or jobs applies instead, which also limits targeting. Always read back the real setting in the confirmation, on or off, and name the other category when one applies. Set housing to false yourself only for an ad that is genuinely not about housing and is not one of those types, and say why. The parameter is `housing_category` (true or false). Leave it out to keep the default ON.

## 3. Draft

Call `create_ad_campaign_draft` with `goal_key`, `destination`, `budget`, `budget_type`, `advertiser_type`, `audience_temperature`, `hub_campaign_id`, name, platforms, dates, targeting (never leave it empty: an empty targeting graph runs the ad across the whole country), copy and media ids. Compare the returned creative count with the media ids you sent, because unknown media ids are silently left out.

Placements: automatic unless the person wants manual. Manual is `placements: { mode: "manual", selected: [...platforms], facebook_positions: [...], instagram_positions: [...] }`. `selected` is required for manual. Without the position lists Meta can show the ad in every position, so ask which positions the person wants. Facebook Reels is `facebook_reels`. If the answer says placements were widened or ignored, tell the person.

`update_ad_campaign_draft` merges rather than replaces, and `configured: false` means it cannot publish yet (the notes say what is missing). It refuses live, publishing and archived drafts: changes to a live ad belong in Marketing Lab > Ads.

A copy warning on a draft is not an error. Nothing is blocked unless the answer says it is blocked. Quote the warning, fix the wording with `update_ad_campaign_draft`, and read the new confirmation sentence.

## 4. Before publish: read the confirmation

The draft answer carries a confirmation sentence and its `confirmation_hash`. Read the sentence to the person word for word. It names the goal, where people land, what is counted, who sees it, the spend and dates, and who gets the leads, and it quotes every warning. Do not summarise it. Anything under blocks must be fixed first.

For a Facebook or Instagram ad, call `preview_ad_campaign_draft` with the draft id before you read the confirmation. Meta checks the draft and nothing is created or spent. Quote anything it finds, word for word: the Page the ad would run as, Meta's warnings and anything that would stop the publish. It cannot draw a video ad, and it refuses a draft that is not set for Facebook and Instagram.

The sentence always ends "It goes live as soon as you publish." even when the spend part says "starting on <date>". Read both and say plainly: the ad is created at publish and delivers from that date.

If you change the draft with `update_ad_campaign_draft` after they heard it, read the new sentence and use the new hash: any change makes the old hash stale, and publish refuses a stale or missing one. Never make a hash up.

When they say yes, call `publish_ad_campaign` with `confirm_spend: true` and that `confirmation_hash`. All three platforms start at publish, or on the start date when it is in the future. Only Google and LinkedIn also need `go_live: true` when there is no future start date, passed after the yes. Do not pass `confirm_spend: true` before the person has said yes.

Publish refuses when the connection or the person lacks Send / publish for ads. It also refuses when tracking is not ready: the Meta pixel or the Lead or Schedule event is not reporting, a Google conversion action or LinkedIn rule is missing, or an online sales ad has no action to count chosen (Purchase or Add to cart). A team spend limit can refuse a budget or total. Read each block to the person and fix it. Never split the budget or change the goal to get round a limit or a tracking block.

A draft marked partially_live can be published again (the live platforms are skipped). A draft marked publishing for under 10 minutes must be left alone: do not publish it again. `launch_campaign` never publishes paid drafts.

## 5. After publish

- Quote every warning in `data.platform_warnings` and the notes before you say the ad is set up. A warning that Meta will not be told when someone fills in the form means the ad cannot learn who converts: say so, and do not call it ready.
- Relay the publish notes about a missing 4:5 or 9:16 creative and any currency mismatch note to the person, word for word.
- Say "live" only when the ad itself, not only the campaign, reads active. If it is in review, say it is waiting for the platform's review. Check `list_ad_campaigns` and `get_campaign_readiness`, and read `still_not_delivering` on any resume answer.
- If an ad has a future start date, look again about an hour after the start time. (The delivery check allows 45 minutes after a start before it flags a problem.)
- If `get_campaign_readiness` has `tracking_problem` set, quote it and do not call the ad working. If `follow_up` is `inactive`, say the follow-up emails are linked but switched off.

## 6. Is it working

`get_ad_performance` covers synced ads only, so a new ad has no numbers until the next sync. Before judging results, call `list_ad_campaigns` to see whether the ad has synced and is delivering, then look after the first full day of delivery and again after a few days. `get_campaign_performance` gives the whole hub campaign, including ads made in Ads Manager. Judge each ad by its own goal's result (the list in step 1), never by likes or clicks. The alarm figures only apply once an ad has been live 48 hours (24 hours for reach), so never raise an alarm on a new ad. After that: if an enquiry ad (form, page, booking, messages, sign-ups, applicants) has spent $50 with no result, a traffic, reach or video ad has spent $20 with none, or an online sales ad has spent $100 with no purchase, tell the person, then check the goal, the tracking event and the page, in that order. A likes goal has no alarm and is always labelled "not an enquiry goal". Phone calls have no alarm and cannot be counted. These figures are a rule of thumb the team can change; never say a platform requires them.

## 7. Things that go wrong

- Wrong goal: the goal cannot be changed on a draft or on a live Facebook campaign. Call `duplicate_ad_campaign_draft` with the right `goal_key`. The copy does not carry over the start or end dates, so set new dates and check where people land with `update_ad_campaign_draft`. Read the new confirmation sentence and publish only after the person says yes. Pause the old ad (`pause_ad_campaign`, then check each level) only after a separate yes to pausing it. Never pause it first, because the person may lose their only live ad.
- Pausing a campaign does not pause its ad sets and ads. Check each level.
- Spend changes: `update_ad_budget`, `resume_ad_campaign`, `set_ad_delivery` and `update_ad_end_date` can all change what is spent. Get the person's yes to the new spend first, every time.
- If a tool refuses, nothing was created on the platform unless the message says otherwise. Read the reason and fix it. Never retry a publish whose outcome is unknown: read it back first.
