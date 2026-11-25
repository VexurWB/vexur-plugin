---
name: ai-avatar-video
description: "Make a video with the person's own AI avatar, from the readiness check to a finished cut in Reel Studio: script first, look stills, a preview still, one proof clip, then the takes, with a cost line in every reply. Use for any talking video, scene clip, voice-over or look made with make_avatar_video, make_avatar_scene_clip, make_avatar_voiceover or make_avatar_look, and before approving or editing avatar clips."
---

> Vexur's `ai-avatar-video` playbook, version 1. With the Vexur connector connected, call `get_skill` with key `ai-avatar-video` first and follow that live version wherever the two differ.

# AI avatar video

## When to use
The person wants a video of themselves made with their AI avatar: a reel, an ad, a founder message, a campaign video. Read this before the first avatar call. For cutting, captions and exports also read the reel editing playbook.

The cost of avatar video is rejected takes, not the price per second. Words and stills are cheap, clips are not. So the order below spends on clips last.

## The path, in order

### 0. Check it can be done
Call `get_my_avatar` first. Read `avatar_ready`.
- `ready: true`: carry on.
- `ready: false`: tell the person in one line what `why` and `clears_it` say, and stop. If `retry_after` has a time, call `get_my_avatar` once after that time. If `needs_the_person` is true, only they can clear it. Do not try other tools to get around it and do not retry in a loop.

### 1. Is the idea makeable
One person on screen (the avatar), one place, short shots. Other people only in the background. A second speaking character, or the same extra person in two shots, does not work: say so before anything is made and offer a version with the avatar alone.

### 2. Lock the script, word for word
Nothing is generated until the person says yes to the exact words.
- One or two short lines per clip. About 2.5 words a second.
- Hook, problem, how the product fixes it, call to action. The call to action's key word must appear earlier in the script.
- Every claim and number comes from the person or their account. Never invent one.
- Write the spoken script the way it should sound:
  - A word in capitals is spelled out letter by letter. Write it in lower case. Keep capitals for captions.
  - "lead" is spoken as "led". Write "leed". Captions keep the real spelling.
  - Avoid a possessive on a brand name ("Vexur's" sounds like "Vex's").
  - Spell an acronym the way it should sound.

### 3. Agree the look with stills
`make_avatar_look` makes two stills per round (description up to 600 characters). Show both, let the person pick, then `keep_avatar_look` the one they chose. Every clip is made from that look. Describe the place, the light, what they wear and what their hands are doing. Leave empty space at the top of the frame if text will sit there.

### 4. Preview the scene with one still
Before paying for a scene clip, call `make_avatar_scene_clip` with `preview_still: true` and the same description. You get one picture in seconds for about a third of an 8 second clip. Check the place, the framing, the outfit and who else is in shot. It comes from the picture model, so it shows no movement or sound and the clip can frame things a little differently. Show the person the link (it lasts about an hour and is not saved).

### 5. One proof clip of the hardest shot
Make one clip of 5 to 8 seconds of the shot most likely to fail: the call to action line, a pan to another person, wind and movement. Check it yourself before showing it: are the words right, is there an invented face or logo. Change one thing per retry. After two takes of the same shot, change the line or the shot.

### 6. The takes, cheapest route first
- `make_avatar_voiceover` for lines spoken over screens or footage. It is the cheapest way to hear a line, so test a risky word here first.
- `make_avatar_scene_clip` for every shot of the person somewhere. It is the only one where hair, clothes and background move. 5 to 15 seconds. Ask for the sound you want in the description (wind, traffic); without it the clip is near silent.
- `make_avatar_video` only for one short exact line to camera. It is one still photo with the lips moving, and it jumps a little about every 10.7 seconds, so keep it to 10 seconds or cover each join with a cutaway.

Each paid call is two calls: the first returns the price and makes nothing; the second sends `confirm_cost: true` and `agreed_cents`. Send `hub_campaign_id` on every make call for a campaign.

### 7. The cost line
Every make answer carries `usage`: what was made today and for the campaign, and the cost so far. Put `usage.cost_line` in every reply that makes or shows a video. "Free for owners" means the owner is not charged; the estimate is still what it cost.

### 8. Approve the clips
A clip must be approved by the person whose avatar it is before it can be used. Show them the `watch_url` from `get_avatar_video`. They approve it in Vexur (Marketing Lab, Content, AI Avatar, Videos), or they say yes in the chat and you call `approve_avatar_video` with `person_said_yes: true`. Only on their own yes to that exact clip. Never on your own judgement.

### 9. Cut it in Reel Studio
With the `media_id` of each approved clip: `get_reel_capabilities`, `create_reel_project`, `edit_reel_project`, `preview_reel`, then `queue_reel_exports`. Lettering and captions are added in the edit, never asked of the video model. Vertical 9:16 first, other shapes after. A queued preview is not a rendered one: wait for it once, do not poll in a loop.

### 10. Check it, then show it
Watch for: the words actually spoken, a face or logo the model invented, frozen hair in a shot that should move, captions over the face. Give the person the finished video, one line on what you checked, one line on what only they can judge (lip sync, how natural it looks, "leed" against "led"), and the cost line. Nothing is posted until they say so.

## What the tools cannot do
- No second recurring character. Other people are background only, and their faces can come out as the avatar's face.
- Scene clips garble long lines and can drop a brand name. Short lines only.
- A talking video moves only the face.
- There is no cheaper video preview than the still in step 4.
- Building the avatar and deleting videos happen only in the app.
