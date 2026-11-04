---
name: airbnb-analysis
description: "Build, run, explain and report an Airbnb (short-term rental) Propalyser analysis. Use when the user wants an Airbnb or short-term rental analysis, shares a PriceLabs Market Dashboard PDF or another market report, asks what a property would earn on Airbnb, or wants a client report for one. Claude reads the PDF itself; Vexur checks the figures and works every number with the app engine."
---

> Vexur's `airbnb-analysis` playbook, version 1. With the Vexur connector connected, call `get_skill` with key `airbnb-analysis` first and follow that live version wherever the two differ.

# Airbnb analysis from a market report

## When to use
The user wants to know what a property could earn as an Airbnb (short-term rental), shares a market report PDF (a PriceLabs Market Dashboard is the one this was built for), or wants a client report for an Airbnb analysis. Not for a development deal (project-feasibility) and not for a normal tenancy (property-analysis).

## The path, in order
1. Read the PDF yourself before you ask anything. You are the reader: open every page and copy what is PRINTED. Vexur does no reading for you.
2. Ask ONCE, and only for what is missing. Every reply carries still_missing; the usual list is the purchase price, the deposit and the loan's interest rate, the strata levies if it is a unit or townhouse, the council (and whether council approval is held or expected, in WA), the weekly rent as a normal tenancy if the user wants that comparison, and the buyer's tax rate or taxable income if they want after-tax figures. Never fill one of these in yourself.
3. Create the draft with create_str_analysis (a new UUID as request_id), sending the report as inputs.market_evidence so one call fills the revenue, or create it first and then call save_str_market_evidence. Say analysis_mode airbnb_only if no tenancy comparison is wanted (then no weekly rent is needed).
4. Tell the user the answer from summary, then every sentence in summary.warnings, then which inputs were not theirs (filled_in says whether each came from the team's saved Propalyser Defaults, from the analyser's rules, or from its starting values). Change any they disagree with using update_str_analysis: it changes only the inputs you name.
5. Try changes before making them: run_str_what_if changes nothing and returns before and after. Use cases true for Low, Typical and High under both fee responses, and sensitivity true for the nightly rate by occupancy grid.
6. Make the client report LAST, when the figures are agreed: generate_analysis_report (a designed PDF with the team's name and logo; the link is private and open for an hour). For a written narrative, call get_analysis_report_data: it returns the same sections the PDF prints.

## Reading the report
- Copy the printed labels, oldest month first, one row per month, as many months as the charts show. Never guess, interpolate or fill a gap: leave the figure out and say so. If a page is unclear, ask the user rather than estimating.
- Give each month's adr and occupancy, plus revenue, revpar and bookings per listing when the charts print them. Vexur checks rate times occupancy against RevPAR and revenue. If it refuses a month (severity fix, nothing saved), look at that label on the page again, correct it and send again.
- Give page_sources (the page number each figure came from) so the owner can check your reading. Give the report date and the market name exactly as printed.
- Median stay is not the average stay. The headline tile shows the median length of stay, which reads lower than the average; Vexur works the average stay from booked nights over bookings, which is what sets how many cleans a year there are.
- Listed vs booked vs ADR: the median listed price is what hosts ask, the median booked nightly rate is what guests actually paid, and ADR is the average earned per booked night. Revenue is worked from ADR and occupancy, never from the listed price.
- PriceLabs occupancy leaves out dates the host blocked, and its revenue leaves out cleaning fees (PriceLabs help, market dashboard methodology and terminology). So the nights a listing was open is its revenue over its RevPAR, and guest cleaning fees are added separately from the cleaning fee chart.
- The headline revenue often sits below the sum of the months. Part-year listings (a listing open for only some of the year) dilute the headline, so a listing open all year should beat it. The checks headline_gap and part_year_listings say so; say it plainly rather than quoting the headline as the expected income.

## Low, Typical and High
- Low is the 12 months before the latest 12 (needs 24 months), Typical is the latest 12 months as the average listing traded them, High is the latest 12 months with the listing open every night. With under 12 months there is no Low or High and no monthly cash flow, only one average.
- Typical is the default. Say which year the numbers use (summary.market_case) and give the Low and High from cases.

## The split fee and the two fee responses
- Airbnb moved to one host fee of 15.5% (software-connected hosts on 13 Oct 2026) and the old split fee, where guests paid roughly 14.1% to 16.5% on top and the host paid about 3%, is being phased out (airbnb.com.au help article 1857). A report made before the switch shows rates set under the split fee.
- fee_response guests_pay_same raises those rates by about 14.1% so guests pay the same total once the host pays 15.5%. hosts_absorb keeps the report's rates and the host pays 15.5% out of them, which is lower. Neither is a forecast of what Airbnb guests will accept; show both (cases does) and let the user choose. A report made after the switch needs no change.

## Saying the numbers
- Give year 1 AND year 2, and say whether they are before or after tax (summary.figures_are). If tax is off, say the figures are before tax and ask for the tax rate or income to turn it on.
- Year 2 is the honest number. Under the Treasury Laws Amendment (Tax Reform No. 1) Act 2026 (assented 26 June 2026), from the 2027-28 income year a loss on an established home bought from 7:30pm on 12 May 2026 carries forward instead of coming off other income, so year 1 can hold a tax refund that does not come back. New builds are outside the limit. Source: Vexur's tax reform rules, packages/investment-engine taxReform2026.
- Also give the worst month and the cash to hold for year 1 (both before tax), and read out the monthly rows if asked.
- WA and NSW night limits turn on the council. In Perth an unhosted stay needs council development approval to go past 90 nights in 12 months, and registration carries a yearly fee of $250 whether hosted or not (WA Planning, WA Consumer Protection, as held in Vexur's rules table). Without the council, the strict state figure is assumed and revenue may be understated, so ask. When approval is assumed, say so and tell the user to check it and the strata by-laws.

## Rules and limits
- These are estimates worked from a report of public listings and the inputs given. They are not a forecast for this property, and the report itself says it estimates from public listings. Say so.
- Drafts are private: only the owner sees them. Nothing here is shared with a client or sent anywhere.
- Never give financial advice or say whether to buy. Give the figures, the assumptions and the warnings, and leave the decision to the user and their advisers.
- Never recalculate, round again or adjust a figure the engine returned, and never make up an input. If the app changed an analysis since the connector wrote it, update_str_analysis refuses a one-at-a-time change: read it with get_property_analysis and send every input with replace_all true, or use run_str_what_if.
- Money is AUD and rates are percentages. Times are Perth time.

## Done means
The user has the year 1 and year 2 figures with the tax basis said, the warnings read out, every input that was not theirs named, the Low, Typical and High and both fee responses shown, and (if asked) the PDF link, with nothing invented and no advice given.
