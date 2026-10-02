---
name: task-router
description: "Start here: routes any Vexur task to the right area playbook and carries the shared conventions (draft, schedule, publish and launch verbs, Perth-default times, and what each connection may publish). Use first whenever the owning playbook is not obvious."
---

> Vexur's `task-router` playbook, version 17. With the Vexur connector connected, call `get_skill` with key `task-router` first and follow that live version wherever the two differ.

# Start here: routing and conventions

## When to use
First call on any Vexur task when the owning playbook is not obvious, and the home of the conventions every flow shares. The area playbooks below plus this router cover the full tool surface. Route first, then execute.

## Routing map
- Landing pages, funnels, opt-in pages, reusable lead forms, and page leads: `get_skill` landing-page-builder. Any landing page task also starts at `get_landing_page_workflow`.
- Social posts, stories, reels, and media into or out of the library: `get_skill` social.
- Editing a video in Reel Studio (analysing footage, cutting and captioning a reel project, hook variations, background exports): `get_skill` vexur-reel-editor. Scheduling or publishing the finished reel stays with social.
- Campaigns of any kind, campaign audiences and targeting, email blasts, SMS drafts, paid ad drafts, nurture sequences, launches, and campaign reporting: `get_skill` campaign. It also disambiguates the three campaign concepts (hub campaigns, ad-builder drafts, platform-synced ad campaigns).
- New enquiries, unworked leads, and follow-up: `get_skill` lead-followup.
- Contacts, companies, deals and pipelines, the Action Centre task list, saved segments, buyer briefs, and debugging an automation that misbehaves: `get_skill` crm.
- Building or changing an automation ("when this happens, do that", follow-ups, date or weekly triggers): `get_skill` automations. Note that where a person is up to is the deal's stage, not the contact's lifecycle_stage.
- Inbox, DMs, comments, replies, WhatsApp/SMS threads, auto-replies, keyword rules, Auto Reply journeys, reply metrics: `get_skill` conversations. Replying to a customer, switching a channel on, enabling a rule and publishing a journey all reach real people; confirm first; each needs this connection's Send / publish permission for that area.
- Saved Propalyser analyses and suburb research: `get_skill` property-analysis.
- Properties the agency FOUND for a client: adding one from an agent's email or an off-market listing, updating it, moving it along the board, or clearing it out: `get_skill` ba-property-pipeline. Distinct from the two above: a buyer brief is what the client WANTS, a Propalyser analysis is the numbers on a property, and this is the client's actual property board.
- The customer's own website: changing its wording, images, pages or styling and previewing the change: `get_skill` website-editor. This is their real website, a different product from landing pages, and it is edited through a file snapshot rather than GitHub. The customer publishes the change from Website Lab.
- Blog posts in the Website Lab blog CMS (drafting, templates, scheduling, releasing): `get_skill` blog. `launch_campaign` never publishes blog drafts; release them with `publish_blog_post` or from the blog editor in the app.
- Newsletter issues and campaign emails to a list (drafting, editing, audience count, performance): `get_skill` newsletter-email. The send itself stays a human action in the app.
- Working a shift as one of the organisation's AI roles (clock in, backlog, proposals, lessons, report, clock out): `get_skill` org-role.
- No playbook yet, so read each tool's own description and confirm with the user before any write: the team Knowledge vault (`search_knowledge`, `get_knowledge_note`, `create_knowledge_note`), client documents and e-signature (`list_client_documents`, `create_document_draft`, `request_document_signature`), invoices and expenses (`list_invoices`, `create_invoice_draft`, `send_invoice`), Blueprint household and portfolio scenarios (`get_blueprint_household`, `compare_blueprint_scenarios`), Meta ad audiences (`list_ad_audiences`, `create_ad_audience`, `sync_ad_audience`), client video testimonials (`list_video_testimonials`, `publish_video_testimonial`), and tracking pixels (`get_tracking_settings`, `set_default_pixels`).

## Lifecycle verbs (the same everywhere)
- Draft: content create_* tools (posts, reels, email, ads, blog, landing pages) write a row and nothing ships. Exceptions: `create_form` publishes the form by default (pass publish false for a draft) and `create_calendar_widget` creates the widget enabled. A published form or enabled widget is embeddable, but nothing is sent to any audience. Passing schedule_at to a create tool is a Schedule, not a Draft: the row lands scheduled and ships automatically (unless a review-first connection or missing publish permission downgrades it; see Publishing permission below).
- Schedule: arms auto-publishing (the social scheduler cron runs every 5 minutes; email sends at schedule_at). Times without a UTC offset are read as Australia/Perth; past times are rejected.
- Publish and launch: make content public NOW (`publish_landing_page`, `publish_form`, `publish_social_post`, `publish_blog_post`, `launch_campaign`). Read back exactly what will happen and get explicit user confirmation first.
- Unpublish and delete: `unpublish_landing_page` reverts to draft. Post deletes are guarded by status (draft, failed or pending approval only; unschedule first; published never). `delete_media` is NOT guarded: it removes the row and the stored file, and only warns when ad creatives reference it.

## Publishing permission
Each connection's own permissions, ticked when it was connected, decide what it may publish, send or schedule. There is no account-wide approval setting. When a publish or schedule is refused or comes back pending_approval, this connection lacks Send / publish for that area, or was made on an older consent screen and needs review: drafts still save, and the user publishes in Vexur or ticks Send / publish for this connection in Team Lab > Integrations > MCP & AI. Always report the true stored status, never the intent.

## Done means
The task is running under the right area playbook (loaded with `get_skill`), with the owning tool identified before any write.
