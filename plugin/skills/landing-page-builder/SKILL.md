---
name: landing-page-builder
description: "Everything landing pages: build pages with the two-phase token contract, wire and repair {{VEXUR_*}} connectors (forms, calendars, booking links, webinars, quiz, phone, reviews), create lead forms, hand drafts off for publishing on review-first connections, and read page leads. Use for any landing page task."
---

> Vexur's `landing-page-builder` playbook, version 8. With the Vexur connector connected, call `get_skill` with key `landing-page-builder` first and follow that live version wherever the two differ.

# Landing pages: build, wire connectors, and capture leads

## When to use
Anything landing page shaped: create or edit a page, funnel, opt-in, quiz, VSL, webinar or booking page; wire or repair its {{VEXUR_*}} connectors; create the lead form a page embeds; or read a page's leads. Standing rule: every landing page task starts with `get_landing_page_workflow`, and its `workflow_steps` win over anything here.

Inner routing: building a page is Part 1. Bindings and validation are Part 2. Forms are Part 3. Reading leads is Part 4.

## Part 1: Build a landing page

### Steps
1. `get_landing_page_workflow`. It returns the steps, the binding rules, the account brand and `connector_resources` (forms, calendar widgets with `calendar_connected`, webinars, `default_booking_url`, team phone). Note `publish_mode`: `handoff` means this connection finishes pages as drafts and the user publishes them in Vexur. If the response has no `publish_mode`, treat it as `handoff`. If the calendar widgets carry no `calendar_connected`, `list_event_types` returns it for the account.
2. Ask the user for the offer, the audience and any real proof. Never invent statistics, testimonials or brand details. Describe the call or offer only as the user states it: never add a format, guarantee or promise they did not give. A real customer's quote, name or screenshot goes on the page only after the user confirms that person agreed to it being published.
3. Missing a form or calendar? Create it (Part 3, `create_calendar_widget`), then run step 1 again. For an event page, only use a webinar whose `starts_at` is still ahead: a page for a past session takes registrations for nothing.
4. `create_landing_page` WITHOUT `generated_html`. The response (`created:false`, a `generation_prompt`) is the contract, not an error.
5. Write one complete, self-contained HTML document from `generation_prompt`, using only {{VEXUR_*}} tokens whose connectors exist. The form and calendar embeds draw their own card: put each token in a plain column with no background, border, padding or shadow (a calendar column gets `min-height:560px`), never inside a card of your own.
6. `create_landing_page` again with the same `user_prompt`, `conversion_goal`, `template_id` and `intake`, plus `generated_html` and the ids from `connector_resources` (`form_id`, `calendar_widget_build_id` with `calendar_config_version`, `booking_url`, `webinar_event_id`). You get the id, slug and `editor_url`. A draft is saved even with readiness issues; read `connector_issues` and `next_step`.
7. `validate_landing_page_connectors`. Fix every severity=error issue (Part 2) and validate again.
8. Finish:
   - `publish_mode: direct`: tell the user exactly what goes live (title and address), get their yes in the chat, then `publish_landing_page`. Open `public_url` and confirm real form fields and a working calendar render, never raw {{VEXUR_*}} text. A connection publishes directly when its owner ticked Send / publish for Landing pages (Team Lab > Integrations > MCP & AI, Manage access).
   - `publish_mode: handoff`: do NOT call publish. Give the user the `editor_url` (it opens this page in Vexur) and tell them to publish it there, Marketing Lab > Landing Pages (publishing any draft form it uses first, in Marketing Lab > Lead Capture > Forms). Never say the page is live.

### Rules
- Two-phase create is mandatory, and so is `update_landing_page`'s two-phase edit (omit `generated_html` to get the `refinement_prompt`).
- Only drafts can be edited through MCP. A published page is edited in Vexur, Marketing Lab > Landing Pages. Do not unpublish a live page to edit it: ads and links pointing at it break while it is down.
- Section-based pages (built in the app editor) are edited and published in the editor only.
- Branding: the user's values win, then `connector_resources.brand`, then defaults. Never invent brand colours the account already has.
- Never add tracking scripts, pixels, custom form handlers, booking fetch calls or CRM endpoints to the HTML. Vexur injects tracking and wires every connector.
- Write times and dates the page states as facts with their real timezone, and never build a countdown to a date that will pass while the page is live. A calendar embed shows each visitor times in their own timezone, so never state the host's hours or timezone beside it.
- Slugs are unique across Vexur; the create response gives a free one. MCP cannot rename a slug.

### Done means
Validation shows zero errors, and either `publish_landing_page` returned a `public_url` that renders working connectors, or (handoff) the user has the `editor_url` and knows exactly what to publish and where.

## Part 2: Wire and repair connectors

### Token map
- {{VEXUR_FORM:*}} needs `form_id`. The suffix (`:lead`, `:survey`) is a label only; it never selects a form.
- {{VEXUR_CALENDAR:*}} needs `calendar_widget_build_id` (carry `calendar_config_version`). The widget only takes bookings when `calendar_connected` is true.
- {{VEXUR_BOOKING_LINK}} needs `booking_url` (use `connector_resources.default_booking_url`). Without one it scrolls to an on-page calendar if the page has one; otherwise validation errors with `missing_booking_url`.
- {{VEXUR_WEBINAR:*}} / {{VEXUR_WEBINAR_LINK}} need `webinar_event_id`.
- {{VEXUR_PHONE}} is a whole call button: never nest it inside a link, button or label. Use {{VEXUR_PHONE_NUMBER}} for the number in a sentence and {{VEXUR_PHONE_LINK}} for an href. The team phone is used when no intake number is set.
- {{VEXUR_REVIEWS}} / {{VEXUR_REVIEWS_LINK}} need `google_review_url`.
- {{VEXUR_QUIZ}} needs `quiz_topic` (an error without it). Its gate asks for name, email and Mobile.
- Any other {{VEXUR_*}} token is an `unknown_token` error. Fix the spelling; never leave it for the visitor to see.

### Errors (block publish and handoff)
`unknown_token`, `missing_form_binding`, `form_not_found`, `form_not_published`, `missing_calendar_binding`, `calendar_widget_not_found`, `calendar_widget_disabled`, `calendar_not_connected`, `missing_booking_url`, `missing_webinar_binding`, `missing_quiz_topic`.

### Warnings (resolve when practical)
`connector_unused` (bound but the token is missing), `form_missing_custom_html` (iframe fallback), `webinar_not_published`, `missing_reviews_url`, `quiz_cta_unbound`, `calendar_connection_unverified`.

### Repairs
- Patch bindings on a DRAFT with `update_landing_page_connectors` (id plus only the fields to change), then validate again. Never regenerate the page to fix a binding. On a published page it refuses: the user changes connections in Vexur.
- `calendar_not_connected`: the widget owner (or its pinned host) connects Google or Microsoft in Team Lab > Integrations > Inbox & Calendar, or bind a widget whose `calendar_connected` is true.
- Ids come only from `gather_connector_resources` / `connector_resources`. Your own and your team's forms and calendar widgets are bindable; anything else fails ownership.

## Part 3: Lead forms

1. `list_forms` (and `get_form`) first; reuse before creating.
2. `create_form` with stable field ids (`name`, `email`, `mobile`). Every lead form includes a required Mobile field (`type: tel`, label Mobile).
3. On a direct connection `create_form` publishes by default. On a review-first connection it saves a DRAFT: bind it to the draft page and tell the user to publish the form in Marketing Lab > Lead Capture > Forms before the page.
4. `update_form` edits a draft freely. A live form is edited in Vexur on a review-first connection, and `update_form` never takes a live form offline.
5. Only a published form takes submissions, so a page cannot go live on a draft form.

## Part 4: Leads
`list_page_submissions` returns a page's leads, both native page submissions and Vexur form submissions attributed to the page. A page's conversions count every lead it produced: form submissions, quiz and webinar sign-ups, and bookings made from it. Report counts as they come back; never estimate.
