/**
 * Template rendering shared by init.mjs and upgrade.mjs.
 *
 * Two transformations, applied in order:
 *
 *  1. **Region stripping** — a template may carry style-conditional blocks:
 *
 *       // #region qa-agent:bdd
 *       …BDD-only lines…
 *       // #endregion qa-agent:bdd
 *
 *     A region whose tag is not in the active style set is removed entirely
 *     (marker lines included). Markers of kept regions are removed too, so the
 *     generated file carries no scaffolding noise. Works with `//`, `#`, and
 *     `<!-- -->` comment syntaxes so the same helper serves .ts, .yml and .md.
 *
 *  2. **Placeholder substitution** — `{{VAR}}` → `vars.VAR`. An unknown
 *     placeholder is a hard error: a silently-unreplaced `{{FE_DIR}}` would
 *     ship broken config to a team that cannot see where it came from.
 */

const REGION_START = /^\s*(?:\/\/|#|<!--)\s*#region\s+qa-agent:([a-z-]+)\s*(?:-->)?\s*$/;
const REGION_END = /^\s*(?:\/\/|#|<!--)\s*#endregion\s+qa-agent:([a-z-]+)\s*(?:-->)?\s*$/;

/**
 * @param {string} text
 * @param {Set<string>} keep tags whose regions survive (e.g. new Set(["tdd"]))
 */
export function stripRegions(text, keep) {
  const out = [];
  /** @type {string[]} */
  const stack = [];

  for (const line of text.split("\n")) {
    const start = REGION_START.exec(line);
    if (start) {
      stack.push(start[1]);
      continue; // marker line itself is never emitted
    }
    const end = REGION_END.exec(line);
    if (end) {
      const open = stack.pop();
      if (open !== end[1]) {
        throw new Error(
          `unbalanced region marker: #endregion qa-agent:${end[1]} closes qa-agent:${open ?? "<none>"}`,
        );
      }
      continue;
    }
    // Inside any region whose tag is not kept → drop the line.
    if (stack.every((tag) => keep.has(tag))) out.push(line);
  }

  if (stack.length) {
    throw new Error(`unclosed region marker: qa-agent:${stack[stack.length - 1]}`);
  }
  return out.join("\n");
}

/**
 * @param {string} text
 * @param {Record<string, string>} vars
 * @param {string} label file name, for error messages
 */
export function substitute(text, vars, label) {
  const unknown = new Set();
  const rendered = text.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, name) => {
    if (!(name in vars)) {
      unknown.add(name);
      return match;
    }
    return vars[name];
  });
  if (unknown.size) {
    throw new Error(
      `${label}: unknown placeholder(s) ${[...unknown].map((n) => `{{${n}}}`).join(", ")}`,
    );
  }
  return rendered;
}

/**
 * @param {string} text
 * @param {Record<string, string>} vars
 * @param {Set<string>} styles
 * @param {string} label
 */
export function render(text, vars, styles, label) {
  return substitute(stripRegions(text, styles), vars, label);
}
