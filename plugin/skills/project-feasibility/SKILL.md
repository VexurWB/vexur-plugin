---
name: project-feasibility
description: "Create, read, test and report a Project Feasibility (subdivision, strata, amalgamation, multi-unit or commercial development) with Vexur's own engine, rates first and every rate backed by evidence. Use for any development deal; never model one as a New Build."
---

> Vexur's `project-feasibility` playbook, version 2. With the Vexur connector connected, call `get_skill` with key `project-feasibility` first and follow that live version wherever the two differ.

# Project Feasibility

Use for any development deal: a site bought to subdivide, amalgamate, or build several units,
strata warehouses, townhouses or apartments. A New Build is one dwelling on one lot only: never
model a development as a New Build.

## 1. Find or start the project
- `list_feasibility_projects` (search the address) before creating, so a project is not duplicated.
- New site: `create_feasibility_project` with a fresh `request_id`. It saves a private draft and
  returns the full result, `filled_in` (the app defaults it used) and `warnings`. Tell the user
  which defaults it used and act on every warning.

## 2. Evidence before rates
Find the evidence yourself in your browser or web search; the connector stores it, it does not
search for it.
- Site: land area, building, zoning (the state planning map, not the agent's words), last sale.
- Land: sold development or improved sites nearby, as $/m2 of land.
- End sales: sold units like the scheme's products, as $/m2 of floor, newest first, plus new
  stock asking prices. Say whether each price is inc GST, + GST or unknown.
- Build: a published cost guide or builder price per m2 of GFA, by floor (ground, mezzanine,
  externals, demolition).
Attach every comparable with its `source` link (`comparables` on create, or
`add_feasibility_comparables`), set against the product it supports.

## 3. Inputs
- Sale prices: give `sale_price_per_m2` or `sale_price` per product. A "+ GST" price goes in with
  `price_includes_gst: false`; the engine holds every sale price GST-inclusive.
- Construction as rate lines (`costs.construction`: area x $/m2), or a build rate on the product,
  never both.
- Do not type lines for land tax, Water Corporation headworks or Western Power in WA: the sheet
  already prices them. A warning names any line that double counts.
- Programme, funding and GST as the deal really is; anything left out takes the app default.

## 4. Report back, rates first
Lead with the rates and where each came from: areas and site cover, land $/m2, build $/m2 by
floor, sale $/m2 per product, fees, contingency, escalation, finance. Then the per-m2 stack
against the net sale rate, then profit per +/-$100/m2 of build and sale rate, the break-even sale
rate and the residual land value at the target margin. Totals and IRR come last.
- What-ifs: `run_feasibility` (nothing is saved).
- Changes: `update_feasibility_project` with `expected_updated_at` from the last read.
- PDF: `generate_feasibility_report`.

## 5. Rules
- Never calculate a result by hand: quote the engine.
- Never say a rate is evidenced when it is your estimate; say which are estimates.
- No financial-product advice.
