---
name: portfolio-blueprint
description: "Read a Blueprint household, its properties and loans, the Growth Engine plan, scenarios, the numbers Vexur calculated, the ledger and saved reports, and load a client's spreadsheet or fact find into their Blueprint or intake draft, prepared and summarised first."
---

> Vexur's `portfolio-blueprint` playbook, version 3. With the Vexur connector connected, call `get_skill` with key `portfolio-blueprint` first and follow that live version wherever the two differ.

# Portfolio Blueprint

Use when the user asks about their own Blueprint or a client's (net worth, cash flow, borrowing
capacity, properties and loans, the Growth Engine plan, scenarios, the ledger, tax packs, BAS), or
gives you a spreadsheet, fact find or statements to load into a Blueprint.

## 1. Find the household
Call `list_blueprint_households` first. `own` is the user's own Blueprint; `clients` are Blueprint
clients with an account (use `household_user_id`); `clients_without_account` are clients still to
link (use `client_access_id`). A false area in `can_view` is closed: say the client has not shared it.
A client who is not in Vexur yet has to be added there first; there is no tool to add or invite one.

## 2. Reading
- Net worth, cash flow, borrowing capacity, the forecast: `get_blueprint_forecast`.
- People, income, super, expenses, goals, entities: `get_blueprint_household`.
- Properties with loans, rent and ownership: `get_blueprint_portfolio`.
- Growth Engine plan: `get_growth_plan`. Scenarios: `list_blueprint_scenarios`, `get_scenario_analysis`, `compare_blueprint_scenarios`.
- Ledger, loans, depreciation, saved reports: `get_portfolio_ledger`, `get_property_loans`, `get_depreciation_schedule`, `list_portfolio_reports`, `get_portfolio_report`.
- Never calculate a figure yourself. Quote Vexur's numbers and their date (`computed_at`); when
  `inputs_changed_since` is true, say opening the Blueprint in Vexur refreshes them.

## 3. Uploading a client's numbers
1. Read every sheet or page the user gave you. Ask instead of guessing: ownership split (joint does
   not mean 50/50), owner-occupied or investment, full dates (never turn a two-digit year into a
   century), offset balance, how much of each loan is for investment, whether a super figure is
   personal super or an SMSF, and anything the document contradicts itself on.
2. Units: rent per week, living expenses per year, rates as percents, money in AUD. Salary growth,
   super growth and inflation are one rate for the whole household. Cash in an
   offset belongs on the loan, not in cash. An SMSF goes in entities, not personal super.
3. Target: a Blueprint that exists (`household_user_id`, needs the client's edit boxes for
   Blueprint, properties and entities) or a client without an account (`client_access_id`, fills
   their intake draft, which they check and finish before it becomes their Blueprint).
4. Call `prepare_blueprint_upload`. `needs_answers`: ask each question, then prepare again.
   `refused`: tell the user why. `ready`: show the WHOLE summary, `check_first` first, then the
   values that change (now and after) and everything being added, and wait for a clear yes.
5. Call `save_blueprint_upload` with the `upload_id` and `confirmed: true`. Then say where to see it.
6. Never save into a Blueprint whose people differ from the document's unless the user confirms it
   is the right household. Names and emails already in a Blueprint never change; properties already
   there are never overwritten (edit those in Vexur).

## 4. Rules
- No personal financial advice: describe what the plan and numbers show.
- A financial year is named by the year it ends (2026 is 1 July 2025 to 30 June 2026).
- Ownership structures are individuals, companies, trusts and SMSFs. Never give a count.
- Report and video links are private and expire in an hour. Never post them publicly.
