---
name: property-analysis
description: "Reads saved Propalyser analyses and suburb market profiles. Use when the user asks about a saved deal or analysis, wants deals compared or summarised, or needs suburb statistics. Also creates, runs and reports residential analyses with Vexur's own engine. Numbers always come from the engine, never recalculated by hand."
---

> Vexur's `property-analysis` playbook, version 8. With the Vexur connector connected, call `get_skill` with key `property-analysis` first and follow that live version wherever the two differ.

# Review Propalyser analyses and research suburbs

## When to use
The user asks about a saved Propalyser analysis or deal, wants deals compared, wants a client summary of an analysis, or needs suburb market statistics. Reading and comparing works for every analysis type. Residential analyses can also be created, run and reported here; commercial and childcare analyses are set up in Propalyser in the app.

## Prerequisites
None for saved analyses (RLS scoped: own plus team-shared). Suburb research uses the account's configured provider (Settings > Research); profile calls can consume paid research quota.

## Steps
1. `list_property_analyses` to find the deal: filter project_type (residential, commercial, childcare) or search by name. Rows carry headline inputs (suburb, state, value, weekly rent) and the analysis's own saved results (gross and net yield, year 1 cash flow, IRR, ROE).
2. `get_property_analysis` for the inputs and assumptions: property_data holds every input (price, LVR, interest rate, loan term, rent, growth rates, purchase and holding costs); calculated_stats holds the saved headline results.
2b. `get_analysis_report_data` when the task is to write anything report-shaped — a client summary, a cash-flow narrative, a tax or exit position, a commercial covenant or rent-roll section. This is the only tool that carries the year-by-year figures.
3. Report Propalyser's numbers verbatim. Never recompute, adjust, or correct them: the saved results are exactly what the app shows, and matching the app is the point. If an assumption looks off, say so and suggest the user edits it in Propalyser; never present recalculated figures as the analysis.
4. Rate units are as stored and vary by field (some decimals, some percentages). Quote values as stored and do not convert between forms.
5. Suburb research: `suggest_suburbs` resolves a name to locality_id candidates; `get_suburb_profile` with the chosen locality_id returns the canonical profile. Call profile once per suburb, never in a loop over a list.
6. Comparing deals: fetch each in full and compare saved results only, stating each analysis's own assumptions next to its numbers. Two deals with different growth assumptions are not directly comparable; say so.

## Rules and gotchas
- Residential only: `create_property_analysis` saves a private draft with explicit assumptions (money in AUD, rates as percentages), `update_property_analysis` replaces its inputs and clears earlier results, `run_property_analysis` calculates it with Vexur's own engine and returns the saved report data, and `generate_analysis_report` saves a private PDF (`get_analysis_report_status` says whether the PDF predates the inputs). Ask the user for every assumption you do not have; never fill one in. Nothing is shared with a client and nothing here is a recommendation. Commercial and childcare analyses, and deleting any analysis, happen in Propalyser in the app.
- calculated_stats can be missing on old or unfinished analyses; report that the analysis has no saved results rather than inventing any.
- Saved-results coverage differs by type. Residential analyses persist the classic stats (yields, year 1 cash flow, IRR, ROE). Childcare analyses persist their own key family (capRate, dscr, initialYield, developmentMargin, irr). Commercial analyses usually persist NOTHING (the app computes them on open), so has_saved_stats false is normal for commercial: say the analysis has no saved results and point the user at Propalyser, never invent figures.
- Suburb profile failures are informative, not retryable: no_connection means no provider is connected (Settings > Research), plan_blocked means the research plan excludes that data, admin_only means HtAG search is gated on this account. Relay the reason; do not retry blindly.
- report_url on an analysis is a signed download link for its generated PDF, valid for about an hour. It is only ever present when the caller is the person who generated the report, so a team-shared analysis returns report_url null with a report_note explaining it; relay that rather than guessing a URL.
- Writing a full report: call `get_analysis_report_data`. It returns the analyser's own report data for the analysis — the year-by-year projection, the year 1 gross-rent-to-after-tax bridge, the depreciation detail, the disposal and CGT working, the bull/base/bear set, and for commercial the rent roll, lease expiry profile, outgoings recovery, DSCR covenant table and exit-yield sensitivity grid. Pass `sections` to fetch only part of it. `get_property_analysis` stays the source for the inputs and assumptions; use both.
- Everything in that payload is final. Money is AUD per annum unless a field says otherwise, rates are percent numbers (6.5 means 6.5%), and figures are rounded to six decimal places. Never recalculate, re-derive, re-round or "correct" a figure, and never fill a gap with an estimate.
- Read `meta.caveats` before writing a word and repeat what it says. It carries the limits the analyser knows about — a gross-lease schedule whose tenancy scenarios do not apply, a tenancy holding over on an expired lease, or two IRRs that are not interchangeable. Presenting a stated limitation as a result is the one failure this tool is built to prevent.
- `report_data_available: false` means nobody has opened the analysis in Propalyser since this data started being stored. Say so and ask the owner to open it once; do not estimate the missing sections. `stale: true` means the inputs moved after the data was built — still usable, but say it.

## Failure handling
- Analysis not found: `list_property_analyses` and confirm the name with the user.
- Ambiguous suburb: `get_suburb_profile` lists the candidates with locality ids; pick with the user or pass the state.

## Done means
The user got Propalyser's own numbers with their assumptions stated, suburb data attributed to its provider, and zero recalculated or invented figures.
