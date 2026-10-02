---
name: ba-property-pipeline
description: "Add, update and remove properties on a buyers-agency client's board, including off-market stock that arrives by email."
---

> Vexur's `ba-property-pipeline` playbook, version 1. With the Vexur connector connected, call `get_skill` with key `ba-property-pipeline` first and follow that live version wherever the two differ.

# Property pipeline: put properties you found on a client's board

## When to use
Anything about the properties a buyers agency is working on for a client: adding one you were sent, recording an off-market listing from an agent's email, updating a listing that moved, moving a card along the board, or clearing one out. This is what the agency FOUND. What the client is LOOKING for is a buyer brief (`get_skill` crm), and saved Propalyser numbers and suburb research are `get_skill` property-analysis.

## Order of operations
1. `list_ba_clients` for the client id. Names come from the client's primary contact, so search by the person's name.
2. `list_ba_properties` with that `client_id`. Two things come back that you need: what is already on the board, and `pipeline_stages`, the ordered `stage_key`s this account actually uses. Stage keys are per account, never assume `shortlisted` exists.
3. `create_ba_property` once per property. Only `address` is required.
4. `update_ba_property` to change anything later, including moving a card by setting `status` to a stage_key from step 2.

## The address is the identity
A client holds at most one card per address, and Vexur decides sameness on the address with case and spacing ignored. Re-adding one comes back with `created: false` and the card they already have, and nothing is duplicated. That is what makes it safe to run over the same inbox, folder or thread more than once: work through everything and let the repeats fall out, rather than trying to remember what you added last time.

`create_ba_property` never lands a card in the wrong column either. Leave `status` out and a card with a client opens in that board's real first stage.

## Reading properties out of email
Record only what the message actually says. An off-market email is usually an address, a price or range, a few specifications and the agent's contact details, and that is a complete card.
- Off-market stock: set `is_off_market` true AND `listing_type` `off_market`. Set `source_site` to where it came from, for example `agent email`.
- Put the sending agent in `agent_name`, `agent_phone`, `agent_agency`, and any second agent in `additional_agents`.
- Keep the agent's own wording in `description`, and your read of it in `agent_notes`.
- Never infer a suburb, price or bedroom count that was not stated, and never guess a partial address into a full one. Leave the field out. A missing field is fixable later; an invented one becomes the record.
- No client yet? Leave `client_id` out and it waits in the unassigned pool.

## Units, so numbers mean what you think
- `price`, `purchase_price`, `potential_offer`, `last_sale_price`: dollars.
- `gross_rent`, `net_rent`, `outgoings`: ANNUAL dollars. `estimated_weekly_rent` is weekly.
- `cap_rate`, `estimated_gross_yield_pct`: percent as a number, 5.75 means 5.75%.
- `land_size`, `building_size`: square metres. `wale`: years.
- `settlement_date`, `last_sale_date`: YYYY-MM-DD. `auction_date` and `eoi_close_date` are free text, so copy the listing's own wording.

## What is not yours to fill in
Suburb medians, growth, yield and vacancy, and anything from the Stash enrichment, are filled by Vexur and are read-only here. Price history writes itself: change `price` on an existing card and the previous figure is kept with the date, so never hand-maintain it. `client_approval` is the client's own verdict, recorded by them in Client Lab; do not set it on their behalf. `inspection_time` is a scheduling instruction, not a stored field: it creates an inspection and then reads back empty.

## Removing a property
`delete_ba_property` is permanent and takes the notes, inspections and client feedback with it. Almost always the right move is `update_ba_property` to the account's rejected stage, which keeps the history and the reason. Only delete something added in error, and confirm with the user first.

## Done means
Every property in the source is on the right client's board with the fields the source actually gave, repeats reported as already held rather than duplicated, and nothing invented to fill a gap.
