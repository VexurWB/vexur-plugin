---
name: newsletter-email
description: "Draft a newsletter issue to the consent-aware subscriber audience or an email inside a hub campaign, with the audience read first and the send left to the user in the app. Use when the user wants a newsletter or an email to a list."
---

> Vexur's `newsletter-email` playbook, version 3. With the Vexur connector connected, call `get_skill` with key `newsletter-email` first and follow that live version wherever the two differ.

# Newsletter issues and campaign emails

## When to use
Writing email that goes to a list: a newsletter issue to the subscriber audience, or an announcement email inside a hub campaign. Nurture that should reach people relative to when they join is a sequence; the campaign playbook owns that decision. Not for one-to-one replies (conversations).

## Prerequisites
`get_newsletter_audience` before writing a word. Zero means nobody would receive it, which is a subscriber problem, not a content one; say so and stop. `list_email_signatures` when the send will carry a sign-off, so the right signature id goes on a campaign email. A verified sending domain is set up in the app under Settings, Emails, Sending domain; without it nothing sends, and no tool substitutes for it.

## Two shapes
- Newsletter issue: `create_newsletter_draft`. One issue to the consent-aware subscriber list, saved unsent and unscheduled under Emails, Newsletter, Issues. This tool cannot send, schedule or test-send; the send is a human action in the app.
- Campaign email: `create_email_campaign_draft` with hub_campaign_id. Attaches the email to a campaign for reporting, inherits the campaign audience when none is given, and can carry a send time. Omit schedule_at at creation; set the time afterwards with `update_email_campaign_draft` and arm false, so the email keeps its slot as a draft until the campaign is launched.

## Steps
1. Confirm the audience count and the shape.
2. Write the subject (under 50 characters, specific, no price, never leading with AI), the preheader (under 90 characters, adding something the subject did not) and the body.
3. Body as HTML: short paragraphs, one action, one button. Give the button a real font stack ending in Arial, Helvetica, sans-serif (never font-family inherit, which Outlook renders as Times New Roman), put the padding on the table cell rather than the link, and do not link the logo. Do not write a footer notice or unsubscribe line; the send pipeline adds it.
4. Create the draft. Read back the id and status.
5. Edits: `update_newsletter_draft` for an issue still in draft, `update_email_campaign_draft` for a campaign email. Only the fields passed change; a scheduled, sending or sent item is refused and is edited in Marketing Lab.
6. Tell the user where the draft is and what remains theirs: test send, audience review, then Send now or Schedule in the app.
7. After a send, `get_newsletter_performance` or `get_email_analytics` for the numbers. The Analytics tab in the app is the authoritative figure when the two differ.

## Rules and gotchas
- Never widen the audience to get a bigger number. The default audience already excludes unsubscribed and non-consenting contacts.
- schedule_at without a UTC offset is read as Australia/Perth. A campaign email created with schedule_at is scheduled immediately and fires on its own clock, whether or not the campaign is ever launched.
- A multi-email campaign with no send times and no arm false sends every email at launch, in one minute.
- No SMS in any email flow, no compliance outcome claims, no price on a marketing send, Australian spelling, no em dashes.
- Report the true stored status. "Draft saved" is the normal end state of this playbook; "sent" is never something this playbook did.

## Failure handling
- Audience zero: stop, report, and point to the subscriber sources (the website signup widget, imported consent).
- A refused edit on a scheduled or sent item: say which state it is in and point to Marketing Lab.
- Sending domain not verified: the user sets it up under Settings, Emails, Sending domain.

## Done means
A draft issue or campaign email exists with subject, preheader and body, the audience count was read before writing, any send time is stored without arming (campaign email) or left unset (newsletter), and the user knows the send is theirs to make in the app.


<!-- design-section-v1 -->
## Design

Write the email so it looks designed, not typed.

- Structure: one idea per section. Open with a short h2 headline, then one line that says why this matters to the reader, then the body, then one button. Keep paragraphs to two or three short sentences and use an h2 for each new section.
- Pictures: use only pictures the team already has. Call list_media and use a file's file_url (an https address) as the image address. Never link a picture from another website, and never use an http address. Every img needs alt text and a width of 520 or less.
- Layout: tables with role="presentation" and inline styles only. No flexbox, no grid, no script, no video tag, no style block. Keep the whole email under about 80KB so Gmail does not cut it off.
- Break up text: after three short paragraphs, put in a picture, a row of figures built as a small table, or a quote. Never leave a wall of text.
- One button: one main call to action per email, and its words say what happens next, such as Book a free call. Use exactly this markup and keep class="agent-cta", because the team's brand shell repaints it in the team's button colour on send: <div data-cta-button="" data-email-block="button" style="display:flex;justify-content:flex-start;margin:16px 0;"><a href="https://..." class="agent-cta" style="display:inline-block;padding:12px 24px;background:#0d3a2a;color:#ffffff !important;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">Label</a></div>
- Colour and fonts: leave text colour, font family and font size unset so the brand shell's own apply. Never invent a brand colour.
- Body only: the logo header, footer, signature and unsubscribe link are added on send, so never write them.
- Finish: save the draft, tell the person where to review it, and never say it has been sent.
