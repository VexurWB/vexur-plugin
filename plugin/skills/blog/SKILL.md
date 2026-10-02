---
name: blog
description: "Draft a blog post from the account's blog template into the Website Lab blog CMS with the SEO fields, images and campaign link filled, then release it only on the user's say-so."
---

> Vexur's `blog` playbook, version 3. With the Vexur connector connected, call `get_skill` with key `blog` first and follow that live version wherever the two differ.

# Blog: draft, structure and release a post

## When to use
Writing or updating a blog post in the Website Lab blog CMS: a new article, a post that belongs to a campaign, a scheduled piece, or checking what is drafted and published. Not for the customer's website pages (website-editor) or landing pages (landing-page-builder).

## Prerequisites
`list_blog_templates` first. If the account has a default template, follow its heading outline and suggested tags; if the user names a structure, use the matching template. `list_blog_posts` with status draft so a second draft of the same subject is not written. When the post belongs to a push, `list_campaigns` for the hub campaign id.

## Steps
1. Agree the subject, the reader and the one thing they should do at the end. One post, one point.
2. Use the account's blog template (`list_blog_templates`) and write the body as plain sections: h2, h3, p, ul, ol, blockquote, img, table, strong, em, a (anything else is flattened to text). The vx-post house layout is for the Vexur team only: never use the `vx-post` wrapper for a customer's post. Never include a `<style>` block, and never write [INFO_CARD], [CTA] or [PULL_QUOTE] markers.
3. Images: reuse a library item from `list_media` or bring one in with `upload_media`, then reference its public URL in an img tag with alt text.
4. `create_blog_post_draft` with title, content_html, excerpt, slug (lowercase words and hyphens only), tags, meta_title (under 60 characters), meta_description (under 155), hub_campaign_id when it belongs to a campaign, and scheduled_for only when the user asked for a date. A time without a UTC offset is read as Australia/Perth.
5. Read the response back: the post id, its status and where it appears (Marketing Lab, CMS, Blog, then the blog editor).
6. Release only when asked. `publish_blog_post` publishes now, or schedules with scheduled_for. The post needs somewhere to appear (a Website Lab site, a public blog slug, a website blog URL, or the blog widget switched on); the tool says so when it has none. Launching a campaign never publishes its blog draft.

## Rules and gotchas
- There is no update tool. A plain draft is edited in the blog editor. Get the body right before creating it.
- Excerpt, meta title and meta description are what listings and search show. Write them rather than leaving them to be derived.
- Slugs are permanent once shared. Keep them to lowercase words and hyphens; apostrophes and punctuation have broken live links before.
- No em dashes, Australian spelling, no price, no compliance outcome claims, and never lead a title with AI. A claim needs a checkable basis or it is left out.
- A post scheduled for the future is invisible on the public blog until its time. A published post shows on every surface that carries the account's blog.

## Failure handling
- "needs somewhere to appear": the account has no blog surface set up. Point the user to Marketing Lab, CMS, Blog settings (public slug, website URL or widget) rather than retrying.
- A draft that opens empty in the editor means the HTML used unsupported markup; rewrite with the allowed tags.
- A scheduled_for in the past is refused: resend with an explicit offset, or publish now.

## Done means
A draft exists with title, excerpt, slug, tags and SEO fields filled, the body renders as sections in the editor, the campaign link is set when there is one, and it was published or scheduled only on the user's say-so with the outcome read back from the tool.
