/**
 * Single source of truth for the versions the plugin ships to every scaffolded
 * repo. `init.mjs` reads these when writing `package.json`; `upgrade.mjs` reads
 * them to reconcile an existing repo's `package.json` against a newer plugin
 * release.
 *
 * Two shapes:
 *
 *  - `PINNED_DEVDEPS`  — packages the plugin owns end-to-end. `/qa-agent:upgrade`
 *                        will bring these up to the value listed here (writing
 *                        the same exact string, no caret). Bumping these here
 *                        is how a Playwright / reporter / BDD upgrade rolls out
 *                        to every team.
 *
 *  - `FLOATING_DEVDEPS` — tooling packages (eslint, typescript, tsx, types).
 *                        Written on init with a caret range and NEVER touched
 *                        by `/qa-agent:upgrade` — teams may pin these to
 *                        anything internally without triggering a diff.
 *
 * Adding a new pinned dep? Put it here, then reference it from
 * `scripts/init.mjs` (build), `scripts/upgrade.mjs` (sync), and the CHANGELOG
 * entry that introduced the pin.
 */

/** Exact-pinned devDependencies the plugin manages. Bump via a plugin release. */
export const PINNED_DEVDEPS = {
  "@playwright/test": "1.59.1",
  // Qase is the TMS on BOTH stacks (§7 of CLAUDE.md) — the reporter must
  // ship everywhere or `shared/bdd/fixtures.ts` and `utils/qase-helper.ts`
  // fail at import on the azure scaffold.
  "playwright-qase-reporter": "2.5.3",
};

/** Exact-pinned devDependencies that only apply on a specific stack. */
export const STACK_PINNED_DEVDEPS = {
  jira: {},
  azure: {},
};

/** Exact-pinned devDependencies that only apply for a specific dev style. */
export const STYLE_PINNED_DEVDEPS = {
  tdd: {},
  bdd: {
    "playwright-bdd": "9.2.0",
  },
};

/** Caret-ranged devDependencies (tooling — plugin does not police the version). */
export const FLOATING_DEVDEPS = {
  "@eslint/js": "^9.17.0",
  "@types/node": "^22.10.5",
  dotenv: "^16.4.7",
  eslint: "^9.17.0",
  tsx: "^4.19.2",
  typescript: "^5.7.3",
  "typescript-eslint": "^8.19.1",
};

/** Every pinned dep that applies to a given (styles, stack) tuple. */
export function pinnedDevDepsFor(styles, stack) {
  const out = { ...PINNED_DEVDEPS, ...(STACK_PINNED_DEVDEPS[stack] ?? {}) };
  for (const style of styles) Object.assign(out, STYLE_PINNED_DEVDEPS[style] ?? {});
  return out;
}
