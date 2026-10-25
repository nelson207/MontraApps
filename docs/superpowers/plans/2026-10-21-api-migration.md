# API Migration (regenerated MontraPOSApi.ts) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** The apps compile and work against the regenerated API; screen customizations, news, users/me
and the credit-operation procedures use the real new endpoints.

**Decisions (user, 2026-10-21):** removed endpoints → marked placeholders (old URLs, demo fallback);
customer/people data stays in the app's draft; validation = app-side rules only (no server field rules).

## Global Constraints

- Old shapes live in `src/platform/api/legacy/legacyApi.ts` (copied from the previous generated file,
  TODO-marked); the generated file is never edited.
- Credit draft keeps the legacy CredOperDto shape; `credOperApi.ts` maps draft ⇄ new CredOperDto at
  the boundary (customer, people, correlationID, metadataResponse are app-only).
- Equipment renames at the boundary: brand↔equipmentBrand, model↔equipmentModel, version↔equipVersion,
  doors↔numOfDoors, enginesize↔engineSize, registrationDate↔licenceDate.

## Tasks

1. Legacy module: old types + the endpoints the API dropped (+ hooks).
2. Point old type / dropped-endpoint imports at the legacy module.
3. Auth on the new endpoints (login, 2FA, forgot / change password).
4. Credit procedures on the new endpoints through the mapping (new-credoper, new-intervention,
   calculate-credoper, financial-product-defaults, financial-products); demo backend on the new URLs.
5. Screen customizations: GET/POST /api/parametrization/screen-customizations.
6. News: GET /api/news?portal=, NewsDto (newsTypeId), image by id; news types placeholder {id,name}.
7. Users/me: profile read from /api/users/me (+ contacts); update stays a placeholder.
8. Verify: tsc all apps, lint, tests, five builds, browser smoke (login, wizard, news, settings).

## Review Focus

- Draft fields the new DTO lacks survive a calculate round trip (mapping merges, doesn't replace).
- Equipment renamed fields round-trip (brand → equipmentBrand → brand).
- Login with 2FA still reaches the dashboard in demo.
- News without a type name still shows (type label fallback).
- Saving application settings sends { screenIdentifier, configuration }.
