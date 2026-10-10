# Agent guide — abstractplay-designer

Svelte + Vite playground for designing boards and pieces with the [@abstractplay/renderer](https://github.com/AbstractPlay/renderer). No game rules — layout and visual experimentation only.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run check` | `svelte-check` / TypeScript |
| `npm run format` | Prettier |

Do not commit unless the user explicitly asks. Do not push unless asked.

## Changelog and versioning

This repo uses **Semantic Versioning** and **per-release changelog sections**. It does **not** use the monthly batching workflow from other Abstract Play repos. **Follow this document (and [`.cursor/rules/changelog-semver.mdc`](.cursor/rules/changelog-semver.mdc)) instead of user-level “changelog batched by calendar month” rules when working here.**

### When to update

Document **user-visible** changes in [`CHANGELOG.md`](CHANGELOG.md): new features, behaviour changes, notable fixes, removals. Skip refactors, test-only work, and trivial copy unless users would notice in the app.

When shipping a release (or preparing a version bump in the same change set):

1. Bump **`package.json`** `"version"` to match the new semver release.
2. Add a **new dated section** at the top of the changelog (immediately below the Keep a Changelog intro), **above** older `## [x.y.z]` headers.

### Section format

- Header: `## [MAJOR.MINOR.PATCH] - YYYY-MM-DD` (release date for that version).
- Headings: `### Added`, `### Changed`, `### Fixed`, `### Removed` as appropriate.
- Bullets: four spaces after the dash (`-   ...`), matching existing entries.
- **One version per section** — do not merge releases by calendar month or reuse an old section for unrelated work.

### Semver hints

- **PATCH** — backward-compatible bug fixes.
- **MINOR** — backward-compatible new functionality.
- **MAJOR** — breaking changes for users or saved data (rare; call out breaking bullets clearly).

### Do not

- Append to a prior month’s section or roll up entries across months.
- Use `[Unreleased]` or `1.0.0-ci`-style CI version labels (other AP repos use those; designer does not).
- Change `CHANGELOG.md` without aligning `package.json` when the change ships as a named version.

### Example

```markdown
## [1.8.0] - 2026-10-10

### Added

-   Play tab dice roller with saved notation presets (localStorage).
```

## Layout notes

- UI: Bulma-style classes (`box`, `level`, `apButton`, etc.) in `src/components/`.
- Persistent client state often uses `localStorage` via `src/stores/write*.ts` patterns.
