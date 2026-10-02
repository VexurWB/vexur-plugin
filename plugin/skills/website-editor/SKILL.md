---
name: website-editor
description: "Change the wording, images, pages or styling of the customer's real website without them needing GitHub. Read and edit the file snapshot; the customer checks the change in Website Lab Preview or a preview link, then publishes it from Website Lab."
---

> Vexur's `website-editor` playbook, version 3. With the Vexur connector connected, call `get_skill` with key `website-editor` first and follow that live version wherever the two differ.

# Website: edit the customer's site and preview the change

## When to use
Any request to change the customer's actual website: reword a headline, fix a typo, swap a photo, update phone or email or fees, add or edit a page, or adjust colours or styling. Also use it when they ask what their site currently says.

Not this skill: landing pages and funnels are `get_skill` landing-page-builder, a different product. Blog posts are the blog tools. If the site does not appear in `list_websites`, Vexur has not built them one.

## What you are actually editing
The site is a real Next.js codebase, and Vexur keeps a snapshot of every file. You edit that snapshot. You cannot put a change live: the customer checks it and publishes it from Website Lab. The customer needs no GitHub account and should never be asked for one.

## How the customer checks a change
The customer's saved preview preference is added at the end of this playbook, and `update_website_files` repeats it after each save. Follow it.
- Check in Vexur (the default): the customer opens Preview in Website Lab to check the saved draft. Tell them the change is saved and they can open Preview. Call `deploy_website_preview` only when they ask for a preview link.
- Claude preview link: call `deploy_website_preview` straight after each save, then `get_website_build_status` once after about 90 seconds, and send them the preview URL.

## The loop, in order
1. `list_websites` to find the site. One site is the normal case, so do not ask which unless there are several.
2. `read_website_files` on the files you intend to change. Use `list_website_files` first when you do not know where something lives. NEVER edit a file you have not read in this conversation.
3. `update_website_files` with the COMPLETE new content of each file, plus `expected_updated_at` copied from the read.
4. Let the customer check the change the way their preview preference says.
5. Ask them to confirm it looks right.
6. After they approve it, tell them to publish it from Website Lab.

Never say a change is live until the customer has published it from Website Lab.

## Where things live on a Vexur-built site
- `lib/site.ts` holds business facts: agency name, phone, email, address, services, fees, team members, stats.
- `lib/i18n/translations.ts` holds the visible copy, often across several languages. Change every language, not only English.
- `app/` holds the pages and routes; `components/` holds the sections.
- `public/images/` holds images.
- Read the repo's own `CLAUDE.md` when it exists. It is the site's build rules and it wins over anything here.

Change a fact in `lib/site.ts` rather than hunting the same string through the components. If a value appears in both places, fix both.

## Editing rules
- Send whole files. A fragment, a diff, or a placeholder like "// rest unchanged" destroys the file, because the content you send replaces it entirely.
- Australian English, and no em dashes anywhere in customer-visible copy.
- Do not restructure layouts, redesign sections, or add libraries. Copy and content edits are safe; a layout rebuild is a template change and belongs with the Vexur team.
- Keep edits small. Several small changes beat one large one, because a failed build is easier to read.
- Never invent business facts. Ask for a real phone number, fee or testimonial rather than filling one in.
- Never hardcode an email address into a contact form. Forms post to Vexur already.

## expected_updated_at, and why writes get refused
`update_website_files` requires the `project_updated_at` value from your read. If it does not match, the write is refused and nothing changes.

That refusal is protection, not an error to work around: it means a developer pushed to the repo or someone edited in the app between your read and your write, and a blind write would have thrown their work away. Recover by reading the files again, reapplying your change to the fresh content, and writing again. Never retry with an older stamp.

`get_website` also reports `last_developer_push_at`. If it is recent, re-read before editing.

## Preview builds
When you build a preview link, it takes 1 to 3 minutes. Call `get_website_build_status` once, roughly 90 seconds after starting the preview, and again later if it is still running. Do not poll in a loop.

Builds fail reasonably often, usually because of a code mistake in the edit. When one fails, read `error_message` and `log_tail`, fix the file with `update_website_files`, and build the preview again. Tell the customer what broke in plain words; never report a failed build as done.

If a call returns a message about the session token expiring and refreshing, that is transient. Retry the same call in a few seconds. Do not restart the whole task.

## Refusals you may hit
- Legacy wizard site: its content lives in the Vexur page editor, not in code. It cannot be edited here.
- Repo unreadable: Vexur refused to build rather than publish an incomplete site. That needs the Vexur team, not a retry.

## Reporting back
Say what you changed, in the customer's words not the file's. "The homepage headline now reads X, and the phone number is updated in the header and footer" beats "edited lib/site.ts and translations.ts". Give the preview URL when you built one, or tell them to open Preview in Website Lab, and tell them to publish it from Website Lab when they are happy with it.
