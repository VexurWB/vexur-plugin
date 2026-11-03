---
name: portfolio-blueprint
description: "Read, model and change a household's Portfolio Blueprint through Vexur's own engine: forecasts and what-ifs, the Growth Engine Strategy and plan, household, properties, entities, Scenario Analysis, the ledger, reports, and spreadsheet uploads."
---

> Vexur's `portfolio-blueprint` playbook, version 6. With the Vexur connector connected, call `get_skill` with key `portfolio-blueprint` first and follow that live version wherever the two differ.

# Portfolio Blueprint

Vexur is the engine and you are the front end: you can read, model and change everything in a
household's Portfolio Blueprint, and every figure comes from Vexur's own engine. Use this when the
user asks about their own Blueprint or a client's (net worth, cash flow, borrowing capacity,
properties and loans, the Growth Engine plan and Strategy, PPR mortgage reduction, scenarios, the
ledger, reports), wants to try or make a change, or gives you a spreadsheet or fact find to load.

## 1. Find the household
Call `list_blueprint_households` first. `own` is the user's own Blueprint; `clients` are Blueprint
clients with an account (use `household_user_id`); `clients_without_account` are clients still to
link (use `client_access_id`). A false area in `can_view` is closed: say the client has not shared
it. Changing an area needs the client's edit box for it as well.

## 2. Numbers: always from Vexur, never your own maths
- `run_blueprint_forecast` runs the household through the Growth Engine now (default 30 years, up
  to 50): the headline (net worth, passive income, PPOR loan, the year it is fully offset, extra
  debt repaid, retirement), the Growth Plans comparison (Do Nothing, this plan, saved Growth Plans)
  and yearly rows. If retirement falls after the forecast, run more years.
- To answer "what if", pass `changes` (plan, planned_purchases, household, properties, entities):
  it runs on a copy and saves nothing. Show the user what moved, then ask before saving.
- Reads: `get_blueprint_household_inputs` (people, income, children, expenses, assets, debts,
  goals, assumptions, with ids), `get_blueprint_portfolio` (properties, loans, rent, ownership,
  entities), `get_growth_plan` (plan, Strategy, planned purchases), `list_blueprint_scenarios`,
  `compare_blueprint_scenarios`, Scenario Analysis (`list_scenario_analyses`,
  `run_scenario_analysis`), the ledger and loans (`get_portfolio_ledger`, `get_property_loans`,
  `get_depreciation_schedule`, `list_ledger_categories`, `find_ledger_duplicates`).

## 3. Changing a Blueprint
Every write saves straight away and answers with before, after and what moved; the screen shows the
same. Say what will change and get a clear yes first, then report the before and after.
- Growth Engine: `update_growth_engine_settings` (Strategy: `surplus_cash_use` = repay_ppor pays the
  home loan down each year end, the PPR mortgage reduction; the cash kept back; the start year;
  `retirement_ppor_payoff`; max LVR; and plan settings), `save_planned_purchase`,
  `delete_planned_purchase`, `reorder_planned_purchases`, `save_growth_plan`, `rename_growth_plan`,
  `restore_growth_plan` (overwrites the plan on screen: save it first if it should be kept),
  `delete_growth_plan`, `set_growth_plan_comparison`.
- Household: `update_blueprint_household`, `save_blueprint_expenses`, `save_blueprint_children`,
  `save_blueprint_assets`, `save_blueprint_liabilities` and their deletes, `add_blueprint_second_person`, `remove_blueprint_second_person`.
- Properties and entities: `save_blueprint_property` (with loans, rent, ownership, assumptions),
  `delete_blueprint_property`, `save_blueprint_entity`, `delete_blueprint_entity`.
- Scenario Analysis: `save_scenario_analysis`, `rename_scenario_analysis`,
  `delete_scenario_analysis`, `send_scenario_to_growth_engine`.
- Portfolio Management: `save_ledger_transaction`, `update_ledger_lines`, `split_ledger_line`,
  `delete_ledger_lines`, `restore_ledger_line`, `set_ledger_duplicates_dismissed`,
  `save_property_loan`, `delete_property_loan`, `save_loan_movement`, `save_property_depreciation`.
- Reports: `generate_blueprint_report` (Property Brief or Growth Engine report PDF, saved to their
  reports), `generate_investment_capacity_report`, `generate_scenario_analysis_report`, `generate_financial_year_report` (Portfolio, Annual Forecast, Income and Expenditure, Tax Summary, BAS/GST and the Tax Pack for one entity or property, for a financial year), `export_blueprint_excel` (the Export to Excel workbook).
  Each returns a private link that lasts an hour.
- Deletes need the connection's Portfolio Blueprint Delete box. Prefer switching a planned purchase
  off (status skipped) to deleting it.

## 4. Uploading a client's numbers
1. Read every sheet or page. Ask instead of guessing: ownership split (joint does not mean 50/50),
   owner-occupied or investment, full dates, offset balance, how much of each loan is for
   investment, personal super or an SMSF, and anything the document contradicts itself on.
2. Units: rent per week, living expenses per year, money in AUD; each tool's fields say whether a
   rate is a percent or a fraction. Cash in an offset belongs on the loan. An SMSF goes in entities.
3. Call `prepare_blueprint_upload`; answer `needs_answers`; on `ready` show the WHOLE summary and
   wait for a yes; then `save_blueprint_upload` with `confirmed: true`. For one change to an existing
   Blueprint, use the write tools in section 3 instead.

## 5. Rules
- No personal financial advice: describe what the plan and numbers show.
- A financial year is named by the year it ends (2026 is 1 July 2025 to 30 June 2026).
- Never give a count of ownership structures; they are individuals, companies, trusts and SMSFs.
- Report links are private and expire in an hour. Never post them publicly.
