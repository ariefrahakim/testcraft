import js from "@eslint/js";
import tseslint from "typescript-eslint";
import dotenv from "dotenv";

dotenv.config();

// The FE source checkout is read-only reference material, never linted.
// Its directory name is per-app, so it comes from .env (FE_REPO_ROOT)
// rather than being baked in here.
const FE_DIR = (process.env.FE_REPO_ROOT ?? "").replace(/^\.\//, "").replace(/\/+$/, "");
const FE_IGNORES = FE_DIR
  ? [
      `${FE_DIR}/`,
      // Cover any FE backup variant (e.g. `.bitbucket-backup/`, `-old/`) so a
      // rename does not accidentally pull the FE source into the lint scan.
      `${FE_DIR}.*/`,
      `${FE_DIR}-*/`,
    ]
  : [];

export default tseslint.config(
  {
    ignores: [
      "node_modules/",
      "reports/",
      "playwright-report/",
      ".features-gen/",
      ...FE_IGNORES,
      "fe-repo-dummy/",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // This config reads `.env` for the FE ignore path, so it needs Node
    // globals. The flat config lints itself as plain JS, where `process` is
    // not declared (typescript-eslint turns no-undef off for .ts, not .js).
    files: ["eslint.config.js"],
    languageOptions: { globals: { process: "readonly" } },
  },
  {
    rules: {
      // QA-Agent contract: no hard waits, no hardcoded selectors in specs/pages.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.property.name='waitForTimeout']",
          message:
            "Hard waits are banned. Use web-first assertions or expect.poll (see CLAUDE.md).",
        },
        {
          // Ban inline selector strings: page.locator('...') / .locator(`...`).
          // Selectors MUST come from a locators/<module>/*.locator.ts file,
          // e.g. page.locator(loginSelectors.emailInput).
          selector:
            "CallExpression[callee.property.name='locator'] > :matches(Literal, TemplateLiteral):first-child",
          message:
            "Hardcoded selector. Define it in locators/<module>/<module>.locator.ts and reference it (see CLAUDE.md §3/§6).",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      // `_`-prefixed params are intentionally unused. BDD step definitions
      // declare one param per cucumber-expression capture so playwright-bdd's
      // arity check passes, even when a pending body ignores them.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    // QA-Agent contract §5a — layer chain `Feature → Step → Page → Locator`.
    // A step (and a spec) may only reach one layer down: the page object. It
    // never imports a locator file; a missing capability is a new page-object
    // method, not an escape hatch. Raw selector strings are already banned
    // repo-wide by the `no-restricted-syntax` rule above.
    files: ["steps/**/*.ts", "tests/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/locators/**"],
              message:
                "Layer violation: steps and specs go through pages/<area>/<module>.page.ts, which is the only layer that reads locators/ (see CLAUDE.md §5a).",
            },
          ],
        },
      ],
    },
  },
  // #region qa-agent:tdd
  {
    // QA-Agent contract §6: specs are clean — only describe/test blocks and their
    // Arrange → Act → Assert. No free helper functions, interfaces, or type
    // aliases. Push UI logic to pages/<m>/<m>.page.ts, pure data/assertion
    // helpers to pages/<m>/<m>.helpers.ts, generic helpers to utils/.
    //
    // NOTE: no-restricted-syntax OVERRIDES (does not merge), so the two global
    // bans (hard waits, inline selectors) are repeated here for spec files.
    files: ["tests/e2e/**/*.spec.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.property.name='waitForTimeout']",
          message:
            "Hard waits are banned. Use web-first assertions or expect.poll (see CLAUDE.md).",
        },
        {
          selector:
            "CallExpression[callee.property.name='locator'] > :matches(Literal, TemplateLiteral):first-child",
          message:
            "Hardcoded selector. Define it in locators/<module>/<module>.locator.ts and reference it (see CLAUDE.md §3/§6).",
        },
        {
          selector:
            ":matches(Program, Program > ExportNamedDeclaration) > FunctionDeclaration",
          message:
            "No free functions in a spec. Move UI logic to pages/<m>/<m>.page.ts, pure data/assertion helpers to pages/<m>/<m>.helpers.ts, generic helpers to utils/ (see CLAUDE.md §6).",
        },
        {
          selector:
            ":matches(Program, Program > ExportNamedDeclaration) > VariableDeclaration > VariableDeclarator > :matches(ArrowFunctionExpression, FunctionExpression)",
          message:
            "No free functions in a spec. Move UI logic to pages/<m>/<m>.page.ts, pure data/assertion helpers to pages/<m>/<m>.helpers.ts, generic helpers to utils/ (see CLAUDE.md §6).",
        },
        {
          selector:
            ":matches(Program, Program > ExportNamedDeclaration) > :matches(TSInterfaceDeclaration, TSTypeAliasDeclaration)",
          message:
            "No type/interface declarations in a spec. Define shared shapes alongside the page object (pages/<m>/<m>.page.ts) or its helpers (see CLAUDE.md §6).",
        },
      ],
    },
  },
  // #endregion qa-agent:tdd
);
