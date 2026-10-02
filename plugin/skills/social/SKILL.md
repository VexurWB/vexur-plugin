---
name: social
description: "Use for organic social: drafting, scheduling and publishing posts, stories and reels across Facebook, Instagram, LinkedIn, Google Business, TikTok and YouTube, and for getting media into the Vexur library. Covers choosing WHICH connected account posts, token expiry and reconnects, approval modes and Meta publish proof. Not for paid ads or campaign launches."
---

> Vexur's `social` playbook, version 4. With the Vexur connector connected, call `get_skill` with key `social` first and follow that live version wherever the two differ.

# Social: posts, reels, and media

## When to use
Organic social work end to end: drafting, scheduling and publishing posts and stories across Facebook, Instagram, LinkedIn, GBP, TikTok and YouTube; publishing reels from rendered video; and getting media assets into or out of the Vexur library (which every post, reel and ad depends on). Not for paid ads or campaign launches: that is the campaign playbook.

Inner routing: ordinary posts and stories are Part 1. Reels (a finished 9:16 MP4) are Part 2. Media ingestion and management is Part 3; read it before attaching any asset.

## Part 1: Draft, schedule and publish social posts

### When to use
Any organic social content task: feed posts, carousels, stories, multi-platform captions, scheduling, or publishing now. Reels are Part 2 of this playbook.

### Prerequisites
Two reads before any draft, and one rule that outranks both.

`list_social_connections` tells you which platforms can actually publish (platforms_ready vs platforms_not_connected vs platforms_needing_reconnect), which accounts have expired, and how many accounts each platform has. Read its warnings[] array and relay it. `get_social_platform_specs` gives the live caption limits, media caps, supported post types and scheduling semantics; fetch it before writing captions, do not rely on memory.

The rule: **a platform is not a destination.** "LinkedIn" is not an answer to "where does this post go", because most accounts have a personal profile and one or more company pages connected at once, and Facebook accounts often have several pages. Never let the tool choose for you and never choose for the user. Name the account, confirm it, then draft.

### Steps
1. `list_social_connections`. For every target platform, count the connected accounts. One account means you can proceed. More than one means you must ask the user which account before drafting, quoting the account names back to them.
2. `get_social_platform_specs` and shape content within each platform limits (for example Instagram requires media and caps captions at 2200 characters; LinkedIn has no reel or story types; Google Business is images only and connect-only today).
3. Draft with `create_social_post_draft`: shared body, platforms array, post_type, media by URL or media_ids from the library, and per_platform overrides for platform captions, connection_id, first_comment (Instagram and Facebook only), TikTok privacy_level, or YouTube privacy_status. Pass per_platform.<platform>.connection_id for every platform that has more than one connected account. A platform with exactly one account is wired for you.
4. Read the response. connections_wired names the exact destination account per platform; state it back to the user ("posting to Page: Vexur, not your personal profile"). notes[] carries validation warnings, expiry warnings, the accounts that were NOT used, missing-connection warnings, and any silent status downgrade.
5. Schedule by passing schedule_at on the draft, or later with `schedule_social_post`. The scheduler cron claims due rows every 5 minutes and publishes through the full validation engine.
6. To publish immediately, `publish_social_post`. Then read the returned post state; do not assume success. published_to tells you the account each platform actually went to.
7. Verify with `get_social_post`: status, platform_post_ids, error_message.

### Rules and gotchas
- **Destination accounts.** `create_social_post_draft` REFUSES to guess when a platform has several connected accounts. The error lists every account with its connection_id, so ask the user, then retry with per_platform.<platform>.connection_id. Do not pick the first one, do not pick by name similarity, do not drop the platform to avoid the question. On LinkedIn a company page and a personal profile look alike in a list and are completely different publicly.
- **Company pages on LinkedIn** are just a different connection: choose the company connection_id and the post goes out as the company. There is no separate switch to flip.
- **Expiry is not the same as disconnected.** LinkedIn, Facebook and Instagram tokens CANNOT be refreshed by Vexur; when they expire the user must reconnect in Marketing Lab by hand, and anything scheduled past that date fails. YouTube, TikTok and Google Business refresh themselves. `list_social_connections` marks each account with expired, expires_soon, auto_refreshes and needs_reconnect, and lists platforms_needing_reconnect. When an account expires soon, say so before scheduling anything beyond that date.
- Twitter/X is not supported at all on this surface. Requests for it get "X/Twitter is not enabled for Vexur".
- schedule_at without a UTC offset is interpreted as Australia/Perth (+08:00, no DST). Date-only strings mean midnight Perth. Past times are rejected. When the user means another timezone, include the offset explicitly.
- schedule_at passed at draft time: a review-first connection, or a team member lacking publish permission, silently saves the post as pending_approval with the reason in notes[]. A connection without Send / publish for Social is refused the schedule instead. The call succeeds; only notes[] tells you.
- The standalone `schedule_social_post` tool on an existing post behaves differently: a review-first connection converts it to pending_approval (the reason arrives in a singular note field), but a caller lacking publish permission gets a hard error, not a silent conversion. Always report the true stored status, never "scheduled" by assumption.
- **A scheduled_at value does not mean a post is scheduled.** Unscheduling in the app leaves the old timestamp on a draft. `list_social_posts` sets scheduled_at_is_stale on any post whose slot has passed while it is not in scheduled status; such a post will never publish on its own. Never describe it as scheduled. Offer to reschedule it.
- `publish_social_post` refuses outright for a connection without Send / publish for Social and for posts already pending approval. That is policy, not a bug; the owner approves and publishes in Marketing Lab, or ticks Send / publish for this connection in Team Lab > Integrations > MCP & AI.
- Meta publish proof: a Facebook or Instagram post only counts as published once a verified public URL comes back. Otherwise the row lands in partially_published. After publishing, read the post platform state and report exactly what happened per platform.
- Media rules are enforced per platform at draft time: carousels need at least two items, stories exactly one, reels exactly one video. Fix validation errors by changing the draft, not by dropping platforms silently.
- Captions with UTM links: bake the parameters into the body or per-platform body; publishing adds none.
- Editing: `update_social_post` works on draft, pending_approval, scheduled and failed posts only. Media arrays REPLACE existing media; per_platform merges. Passing per_platform.<platform>.connection_id moves the post to a different account and says so in notes[]. Delete only drafts, failed or pending posts; unschedule first with `schedule_social_post` cancel:true.

### Failure handling
- "you have N connected <platform> accounts, so this post has no unambiguous destination": expected and correct. Show the user the listed accounts, ask which one, retry with connection_id. Never work around it.
- "connection_id ... is not a connected <platform> account": the id is stale or from another platform; re-read `list_social_connections`.
- Draft validation error: the message names the platform and limit; adjust content or platforms.
- Expiry warning in notes[]: the draft is saved, but tell the user which account needs reconnecting and that publishing will fail until they do it.
- Missing connection note: proceed if intended, but tell the user those platforms will fail until connected in Marketing Lab.
- partially_published after publish: report which platforms verified and which did not, with error_message; do not retry blindly.
- Schedule rejected as past: re-read the timezone assumption and resend with an explicit offset.

### Done means
The post is in the exact state the user asked for (draft, scheduled at a confirmed UTC instant, or published with per-platform proof), the destination account for every platform was named to the user rather than assumed, and any downgrade, expiry or partial result from notes[] has been reported honestly.

## Part 2: Publish a reel from a rendered video

### When to use
Turning an already rendered vertical video into a reel draft that is ready to review, schedule or publish across Instagram, Facebook, YouTube or TikTok.

### Prerequisites
A finished 9:16 MP4 on a public https URL. MCP does not render video. If the file exists only locally, move it through the Part 3 media pipeline first (`upload_media` from a URL, or `create_media_upload_url` plus PUT plus `register_uploaded_media`) and use the returned public URL. `list_social_connections` to confirm the target platforms can publish and to settle which account each one posts from.

### Steps
1. Confirm the video is rendered, vertical (1080x1920 or equivalent 9:16), MP4, and publicly reachable over https.
2. If the video needs importing, run the Part 3 media pipeline; the library import cap for video is 95MB, which also keeps reels under Instagram 100MB limit.
3. `create_reel_draft` with video_url and caption. Platforms default to instagram plus facebook when omitted. Pass poster_url for the cover, duration_seconds, width, height and size_bytes when known; they feed validation.
4. Pass connection_ids for any platform with more than one connected account, for example { "facebook": "<connection_id>" }. Without it the call is refused, exactly as in Part 1.
5. first_comment applies to Instagram and Facebook only; it is posted as the first comment after publish. It is ignored for other platforms.
6. Read connections_wired and notes[] in the response for the destination account, validation warnings, expiry warnings, missing connections, and approval downgrades.
7. Schedule with schedule_at on the draft or `schedule_social_post` later, or publish now with `publish_social_post`. Same timezone, approval and publish-proof rules as any social post.
8. Verify final state with `get_social_post`.

### Rules and gotchas
- One video per reel, exactly. The validator rejects a reel draft with zero or multiple media items, or with an image.
- MCP never renders, trims, captions or reformats video. If the source is not a finished 9:16 MP4, that work happens outside MCP, before this playbook.
- TikTok and YouTube are admin-pilot platforms. Drafting for them succeeds with a warning: TikTok posts may be forced private (SELF_ONLY) until the app audit passes, and YouTube uploads are forced private until Google verification completes. Tell the user this instead of promising public posts.
- Platform video constraints differ: Instagram reels 3 to 90 seconds and 100MB; Facebook reels 3 to 90 seconds and 1GB; TikTok 3 to 600 seconds and 287MB; YouTube up to 2GB. Check `get_social_platform_specs` when in doubt.
- Caption limits still apply (Instagram and TikTok 2200, YouTube 5000).
- schedule_at without an offset means Australia/Perth; past times are rejected.
- schedule_at at draft time from a review-first connection or without publish permission saves the post as pending_approval silently, with the reason in notes[]. The standalone `schedule_social_post` call converts to pending_approval for a review-first connection (reason in a singular note field), but a caller lacking publish permission gets a hard error instead. Report the true status from the response.
- `list_reel_drafts` is a different thing: it lists Reel Studio timeline projects the user edits and exports in the app. It does not list posts created by `create_reel_draft`; those are social posts, found via `list_social_posts`.

### Failure handling
- "requires a video" or "a reel needs exactly one video media item": the media array is wrong; send exactly one video item.
- "no unambiguous destination": pass connection_ids for that platform after asking the user.
- Video too large at import: 95MB is the pipeline cap; compress or shorten the render.
- partially_published after publish: a Meta platform did not return a verified public URL; report per-platform results and error_message.
- Missing connection note: the reel will fail on that platform at publish; have the user connect it in Marketing Lab.

### Done means
A reel post exists in the requested state with exactly one video, correct platforms, the destination account named to the user, first_comment only where supported, and any admin-pilot, expiry or approval caveats reported to the user verbatim.

## Part 3: Get media into and out of the library

### When to use
Any time a post, reel or ad needs a file that is not already in the Vexur media library, or the library needs cleaning up.

### Prerequisites
Know where the bytes are. There are exactly two ingestion paths and they do not mix: URL import when the file is already hosted publicly, and direct upload when you hold raw bytes with no public URL.

### Steps
1. Check first: `list_media` with type and search filters. Reuse existing items; every row has a public URL and an id usable in posts (media_ids), reels and ad creatives.
2. Path A, URL import: `upload_media` with a public https source_url. The worker fetches the file, enforces type and size, stores it, and returns media_id plus the library URL. Caps: images and audio 25MB, video 95MB. The URL must be https with no embedded credentials, and the response content type must be image/*, video/* or audio/*.
3. Path B, direct upload, three calls in strict order:
   a. `create_media_upload_url` with file_name and the real mime_type. Returns upload_url, storage_path and the future public_url.
   b. HTTP PUT the raw bytes to upload_url with the file Content-Type header. This step happens outside MCP.
   c. `register_uploaded_media` with the returned storage_path, file_name and mime_type. It verifies the object exists in storage, then inserts the library row and returns media_id plus url.
4. Use the media_id (not the raw URL) when attaching to `create_social_post_draft` media_ids or `create_ad_campaign_draft` media_ids; use the public URL where a tool wants a URL (reel video_url).

### Rules and gotchas
- Order matters on Path B. Calling `register_uploaded_media` before the PUT fails with "No file was found at storage_path. PUT the bytes to the signed upload_url first, then retry." That error means the upload step was skipped or failed, not that the tool is broken.
- storage_path must be exactly the value returned by `create_media_upload_url`; paths outside the caller own folder are rejected.
- Only image, video and audio MIME types are accepted on both paths. Documents and archives are not media library content.
- Size caps are hard: 25MB images and audio, 95MB video. The video cap exists because of the worker memory ceiling and keeps reels under Instagram 100MB limit. Oversized files must be compressed before ingestion.
- `delete_media` deletes the library row AND the stored file. It warns when the file is referenced by ad creatives: "This file is referenced by N ad creative(s); those creatives will lose their media." Surface that warning and confirm intent before deleting anything an ad uses.
- Files hosted outside Vexur storage: delete_media removes only the library row and says so in notes.
- Registered uploads land with category other and tag mcp; pass alt_text when available for accessibility downstream.

### Failure handling
- "Could not fetch source_url (HTTP ...)": the source is not publicly reachable; fix hosting or switch to Path B.
- "Unsupported content type" or "Unsupported mime_type": the file is not image, video or audio; do not force it.
- File over cap: the error names the size and the limit; shrink the asset, never retry unchanged.
- Registration says no file found: re-do the PUT with the correct Content-Type, confirm a 2xx from storage, then register again.

### Done means
The asset is in the library with a media_id and public URL, the consuming tool accepted that id or URL, and no delete removed media that live ad creatives still reference.
