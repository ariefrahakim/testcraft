# Page map — {{APP_NAME}}

One row per module. qa-codegen reads this BEFORE generating to avoid creating a
duplicate page object (CLAUDE.md §3), and appends to it after.

| Module | Route | Page object | Locator file | Notes |
|---|---|---|---|---|
| login | `/login` | `pages/login/login.page.ts` | `locators/login/login.locator.ts` | Seeded by `/qa-agent:setup`. Selectors are form-attribute fallbacks — promote to testids on first heal. |
