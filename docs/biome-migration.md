# Migrating from ESLint and Prettier to Biome

This is a plan, not a change. Nothing in this pull request alters the build, the
linter or the formatter. An agent picks this up later and does the work.

## Goal

Replace ESLint and Prettier with [Biome](https://biomejs.dev/), one tool that
lints and formats, so the project keeps one config file and one pass over the
code instead of two toolchains with overlapping jobs.

The migration is done when `bun run lint`, `bun run format`, `bun run
format:check`, `bun run build` and `bun run test:e2e` all pass, the pre-commit
hook still blocks a bad commit, CI is green, and the diff on `src/` is either
empty or explained.

## What the project uses today

ESLint 9 with the flat config in `eslint.config.js`. It pulls in
`@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`,
`eslint-plugin-react-refresh` and `eslint-config-prettier`, which sits last and
turns off every rule that would argue with the formatter. It ignores `dist` and
`.claude`. One override relaxes two rules for the vendored FigUI files under
`src/components/ui`: `react-refresh/only-export-components`, because
`button.tsx` exports a `cva()` call, and `no-empty`, because `color-chit.tsx`
has an empty catch.

Prettier 3 with `.prettierrc`, `.prettierignore` and
`prettier-plugin-tailwindcss`, which sorts Tailwind class names. The plugin is
configured with `tailwindStylesheet: "./src/styles/app.css"` and
`tailwindFunctions: ["cn", "cva"]`.

The two run from four scripts in `package.json`: `lint`, `format`,
`format:check` and, on commit, `lint-staged` through the husky `pre-commit`
hook. `lint-staged` runs `eslint --max-warnings 0` on staged `.ts` and `.tsx`,
and `prettier --check` on staged `.ts`, `.tsx`, `.json`, `.html`, `.css`, `.md`
and `.yml`. `.github/workflows/ci.yml` runs `bun run lint` and `bun run
format:check` as separate steps.

The code is 51 TypeScript files across `src/` and `e2e/`, two stylesheets, two
GLSL shaders and one `index.html`. Thirty-four files carry `className`.

## What Biome cannot do yet

Three gaps decide the shape of this migration. Check each one against the
current Biome release before starting, because all three are moving.

Markdown and YAML have no formatter. Biome lists both as in progress for
parsing and formatting, and YAML has no linter either. Dropping Prettier
outright would stop `README.md`, `CHANGELOG.md`, `.changeset/*.md` and
`.github/workflows/ci.yml` from being checked at all.

HTML formatting is experimental and must be opted into. This repository has one
HTML file, `index.html`, so the stake is small, but the opt-in has to be
deliberate.

Tailwind class sorting is the real problem. Biome's `useSortedClasses` is a
nursery rule, which means experimental and open to change, and it is only
partially implemented. It takes a `functions` option, so `cn` and `cva` can be
named, but it does not read a Tailwind v4 stylesheet the way
`prettier-plugin-tailwindcss` reads `src/styles/app.css`. This project defines
many of its own utilities there and in the vendored `figui.css`, among them
`typography-body-medium`, `text-ink-secondary`, `shadow-400`, `inset-ring` and
the new `opacity-disabled`. Biome will not know any of them and will order them
as unknown classes.

## The decision this turns on

Pick one of these before writing any config. The first is the recommendation.

**Option A, Biome for code and Prettier for prose.** Biome lints and formats
`.ts`, `.tsx`, `.json` and `.css`. Prettier stays as a dev dependency but loses
`prettier-plugin-tailwindcss`, and only checks `.md` and `.yml`. ESLint and its
four plugins go. Class sorting moves to `useSortedClasses`, and the sorting is
verified by the experiment below before anyone relies on it.

**Option B, Biome as the linter only.** Biome replaces ESLint. Prettier keeps
formatting everything, including Tailwind class order, exactly as it does now.
This is the low-risk option: no formatting diff at all, and the plugin stack
still shrinks by four packages. Fall back to this if the sorting experiment
goes badly.

**Option C, Biome for everything.** Prettier is removed, Markdown and YAML stop
being checked, and `index.html` relies on the experimental HTML formatter. Only
take this if the current Biome release has closed those gaps.

### The sorting experiment

Do this before committing to Option A. On a scratch branch, configure Biome
with `useSortedClasses`, run it over `src/`, and read the diff on these three
files, which between them cover every awkward case in the codebase:

- `src/components/sections/FloatingToolbar.tsx`, where `cn()` composes long
  strings from the `PILL` and `TAB` constants
- `src/components/ui/button.tsx`, where `cva()` holds variant maps with
  `dark:`, `disabled:` and arbitrary variants
- `src/components/controls/ColorRow.tsx`, a plain component with conditional
  classes

Two questions decide it. Does Biome move the project's own utilities into a
sensible place, or scatter them? Does any reordering change which of two
utilities wins when both set the same property? `tailwind-merge` resolves
conflicts inside `cn()` at runtime, so the risk sits in the literal class
strings that never go through it. If either answer is bad, take Option B and
say so in the pull request.

## Steps

1. Branch from `main`. Add the tool with `bun add -d @biomejs/biome`.
2. Run `bunx biome migrate eslint --write` and then `bunx biome migrate
prettier --write`. The first reads `eslint.config.js`, including its
   `extends`, and needs Node to resolve the plugins. The second reads
   `.prettierrc`. Neither handles YAML config, which does not matter here.
   Consider `--include-inspired` to pick up rules Biome models on ESLint ones
   rather than ports exactly, and read what it adds before keeping it.
3. Read the generated `biome.json` line by line. The migration is a starting
   point, not an answer. Check the formatter options against the table below,
   and turn on `vcs.useIgnoreFile` so Biome respects `.gitignore`, which
   already covers `dist` and `.claude/worktrees`.
4. Re-create the FigUI exception as an `overrides` entry for
   `src/components/ui/**`, switching off Biome's equivalents of
   `react-refresh/only-export-components` and `no-empty`. The first is
   `useComponentExportOnlyModules` and the second is `noEmptyBlockStatements`.
   Confirm both names and their groups with `bunx biome explain <rule>`, since
   rules move between groups across releases.
5. Check that the React rules the project relies on are on:
   `useExhaustiveDependencies` and `useHookAtTopLevel`. The hooks rules caught
   a real bug in this codebase during the SelectRow work, when a ref was
   written during render, so they are not decoration.
6. Rewrite the scripts in `package.json`. `lint` becomes `biome lint .`,
   `format` becomes `biome format --write .`, and `format:check` becomes
   `biome format .`. Under Option A, add the narrowed Prettier call for `.md`
   and `.yml`. Consider `biome check` , which lints and formats in one pass, as
   a single `bun run check` script.
7. Update `lint-staged` in `package.json`. Under Option A the code entry
   becomes `biome check --write --no-errors-on-unmatched`, and a second entry
   keeps `prettier --check` for `*.{md,yml}`. Keep the hook failing on a
   warning, which is what `eslint --max-warnings 0` gives today.
8. Update `.github/workflows/ci.yml`. The `Lint` and `Check formatting` steps
   can become one step running `bunx biome ci .`, which is the command built
   for CI. Keep the build, the Playwright install and the e2e steps untouched.
9. Delete what is now dead: `eslint.config.js`, and the `@eslint/js`,
   `eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`,
   `eslint-config-prettier`, `typescript-eslint` and `globals` dev
   dependencies. Under Option A also drop `prettier-plugin-tailwindcss` and cut
   `.prettierrc` down to the options that still apply. Under Option B keep
   Prettier and its plugin exactly as they are.
10. Run the formatter once across the repository and commit the result as its
    own commit, separate from the config. A reviewer can then read the config
    change without wading through a whole-tree reformat.

## Formatter options to carry over

| Prettier option  | Current value | Biome equivalent                                  |
| ---------------- | ------------- | ------------------------------------------------- |
| `semi`           | `true`        | `javascript.formatter.semicolons: "always"`       |
| `singleQuote`    | `false`       | `javascript.formatter.quoteStyle: "double"`       |
| `tabWidth`       | `2`           | `formatter.indentWidth: 2`                        |
| `trailingComma`  | `"all"`       | `javascript.formatter.trailingCommas: "all"`      |
| `printWidth`     | `80`          | `formatter.lineWidth: 80`                         |
| `bracketSpacing` | `true`        | `javascript.formatter.bracketSpacing: true`       |
| `arrowParens`    | `"always"`    | `javascript.formatter.arrowParentheses: "always"` |
| `endOfLine`      | `"lf"`        | `formatter.lineEnding: "lf"`                      |

Biome defaults to tabs, so `formatter.indentStyle` must be set to `"space"`
explicitly. `biome migrate prettier` should do this, but check it.

## How to know it worked

Run all of these and expect them to pass:

```bash
bun run lint
bun run format:check
bun run build
bunx playwright install chromium   # once
bun run test:e2e
```

The end-to-end suite must report 11 passed, 0 failed. Run it twice: the test
named `the colour picker opens from the chit and edits in place` has been seen
to flake about once in six runs, and that flake predates this work.

Then check the diff itself. Under Option A, `git diff --stat` after the
formatting commit should touch class attributes and little else. Read the diff
on the three files named in the sorting experiment before pushing. Under Option
B the diff on `src/` should be empty.

Last, prove the hook still works: stage a file with a deliberate formatting
error and confirm the commit is refused.

## Rollback

Everything lives in one commit range on one branch, so `git revert` of the
merge is enough. Keep the ESLint and Prettier removal in its own commit, so
that commit alone can be reverted if Biome turns out to miss something the old
setup caught.

## Out of scope

Do not change any application code to satisfy a new rule beyond what the
formatter rewrites. If Biome reports a real problem in `src/`, note it in the
pull request and leave it for a separate change. Do not bump the version and do
not add a changeset: this is tooling, and `CHANGELOG.md` is for what people
notice in the app.
