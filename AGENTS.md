# Agent Guide for Super Productivity

This file is written for AI coding agents that need to work in this repository. It assumes no prior knowledge of the project. Read `CLAUDE.md` first for task-specific guidance, then refer to this document for project context, commands, conventions, and architecture.

> **Important:** This working tree is a personal fork of the upstream Super Productivity project. The `README.md` banner and `MODS.md` describe personal modifications (custom cursor, particles, stamps, background) layered on top of the original application. Upstream is authored by Johannes Millan and contributors.

---

## Project Overview

Super Productivity is an advanced, open-source todo-list and time-tracking application. It supports timeboxing, time tracking, break reminders, a Pomodoro timer, personal metrics, and integrations with issue providers such as Jira, Trello, GitHub, GitLab, Gitea, OpenProject, Linear, ClickUp, and Azure DevOps. It also supports CalDAV, Dropbox, WebDAV, and a first-party SuperSync server for backup and synchronization.

The project is privacy-first: user data stays local unless the user explicitly configures sync. There are no analytics or user accounts.

The same frontend codebase targets three runtimes:

- **Web / PWA** (`ng serve`, `npm run startFrontend`, `npm run buildFrontend:prodWeb`)
- **Electron desktop** (`npm start`, `npm run dist`, `electron-builder`)
- **Android / iOS** via Capacitor (`npm run dist:android`, `npm run dist:ios:prod`)

---

## Technology Stack

| Layer              | Technology                                                                                                |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| Frontend framework | Angular 21 (standalone components, zoneless change detection via `provideZonelessChangeDetection`)        |
| Language           | TypeScript 5.9                                                                                            |
| State management   | NgRx 21 (`@ngrx/store`, `@ngrx/effects`, `@ngrx/entity`) with meta-reducers                               |
| Reactive library   | RxJS 7                                                                                                    |
| UI components      | Angular Material, plus ~40 reusable components in `src/app/ui/`                                           |
| Styling            | SCSS with CSS custom properties (design tokens)                                                           |
| Desktop shell      | Electron 41                                                                                               |
| Mobile shell       | Capacitor 8                                                                                               |
| Build tooling      | Angular CLI / `@angular-devkit/build-application`, `electron-builder`, Vite for plugin packages           |
| Testing            | Jasmine + Karma for unit tests; Playwright for E2E tests                                                  |
| i18n               | `ngx-translate` (edit only `src/assets/i18n/en.json`)                                                     |
| Sync engine        | Operation-log based sync with vector clocks; split across `src/app/op-log` and the `packages/*` workspace |

---

## Repository Layout

### Root configuration

- `package.json` — main npm scripts, dependencies, Volta pin to Node `22.18.0`.
- `angular.json` — Angular CLI project `sp2`; build outputs to `.tmp/angular-dist`.
- `tsconfig.json` — solution-style TypeScript config referencing `src/tsconfig.app.json`, `src/tsconfig.spec.json`, and `src/tsconfig.worker.json`.
- `eslint.config.js` — ESLint flat config with Angular, TypeScript, Prettier, and local sync rules.
- `capacitor.config.ts` — Capacitor mobile configuration.
- `docker-compose.yaml` — PostgreSQL + SuperSync server + web app + WebDAV for E2E testing.
- `build/electron-builder*.yaml` — platform-specific Electron builder configs.

### Source code (`src/`)

- `src/main.ts` — Angular bootstrap entry point; imports NgRx modules, providers, and the root `AppComponent`.
- `src/app/app.component.ts` / `app.routes.ts` — root component and router configuration.
- `src/app/app.constants.ts` — runtime platform detection (`IS_ELECTRON`, `IS_WEB_BROWSER`, etc.).
- `src/app/core/` — cross-cutting services: persistence, date/time, platform detection, error handling, HTTP, theme, notifications, data initialization, etc.
- `src/app/core-ui/` — shell-level UI components (header, side nav, layout, shortcuts, work-context menu, etc.).
- `src/app/features/` — feature modules: tasks, projects, tags, planner, worklog, schedule, reminders, issue providers, config, metrics, onboarding, etc.
- `src/app/pages/` — routed page components.
- `src/app/ui/` — shared reusable UI primitives (dialogs, inputs, pipes, etc.).
- `src/app/root-store/` — root NgRx store, meta-reducer registry, and shared meta-reducers for task/tag/project cross-cutting state.
- `src/app/op-log/` — operation-log sync implementation: capture, apply, encryption, persistence, validation, sync providers, and the SuperSync provider.
- `src/app/imex/` — import/export, local backup, and sync-related dialogs.
- `src/app/pfapi/` — legacy persistence-friendly API (`pfapi`) used by some storage paths.
- `src/app/plugins/` — plugin runtime: store, UI host, OAuth redirect, issue-provider integration, initializer.
- `src/app/mods/` — **personal-fork additions**: custom cursor, background, particles, stamps, and the mods panel. See `MODS.md`.
- `src/assets/` — static assets, i18n JSON files, themes, fonts, bundled plugins, sounds, and cursor images.
- `src/environments/` — environment configs (`environment.ts`, `environment.prod.ts`, `environment.stage.ts`).
- `src/styles/` — global SCSS, design tokens, themes, mixins, utility classes, and component overrides.

### Electron (`electron/`)

Node-side Electron code, compiled by `tsc -p electron/tsconfig.electron.json`.

- `electron/main.ts` — entry point; enforces single instance on non-macOS platforms.
- `electron/start-app.ts` — app bootstrap.
- `electron/main-window.ts` — BrowserWindow creation.
- `electron/ipc-handlers/` — IPC handlers for app control, data, exec, global shortcuts, Jira, system, etc.
- `electron/preload.ts` — preload script exposing a typed `window.ea` API.
- `electron/shared-with-frontend/` — constants and utilities shared with the frontend build.

### End-to-end tests (`e2e/`)

Playwright-based tests. See `e2e/CLAUDE.md` for detailed usage.

- `e2e/tests/` — test specs (~188 files).
- `e2e/pages/` — page objects (`workViewPage`, `taskPage`, `projectPage`, `settingsPage`, etc.).
- `e2e/fixtures/` — test fixtures and custom `test` object.
- `e2e/playwright.config.ts` — Playwright configuration.

### Packages (`packages/`)

Npm workspaces (see `package.json` `workspaces`).

- `packages/plugin-api/` — TypeScript definitions for the plugin API.
- `packages/plugin-dev/` — example plugins and SolidJS boilerplate.
- `packages/shared-schema/` — shared validation schemas and compatibility exports.
- `packages/sync-core/` — framework-agnostic sync primitives and vector-clock algorithms. Must not import Angular, NgRx, app code, or `@sp/shared-schema`.
- `packages/sync-providers/` — bundled sync provider implementations; may only use public `@sp/sync-core` exports.
- `packages/super-sync-server/` — first-party SuperSync server (NestJS/Prisma/PostgreSQL).
- `packages/vite-plugin/` — build helper for plugins.

---

## Build, Test, and Development Commands

All commands are run from the repository root.

### Development

```bash
npm install                 # install dependencies and run postinstall hooks
npm run env                 # generate src/app/config/env.generated.ts from .env
npm start                   # Electron dev build and launch
ng serve                    # web dev server (localhost:4200)
npm run startFrontend       # web dev server with env loading
npm run electron:watch      # watch-compile Electron code
```

### Production / Packaging

```bash
npm run build               # lint + production Angular build + Electron build
npm run dist                # full production desktop build + electron-builder
npm run dist:win            # Windows production build
npm run dist:linuxAndWin    # Linux + Windows production build
npm run dist:mac:mas        # Mac App Store build
npm run buildFrontend:prod:es6   # production web build with modern browserslist
npm run dist:android        # staging Android APK
npm run dist:android:prod   # release Android APK
npm run dist:ios:prod       # iOS sync
```

### Testing

```bash
npm test                    # all unit tests + timezone checks (Berlin, LA)
npm run test:file <path>    # single spec file
npm run test:watch          # Karma in watch mode
npm run test:fast           # unit tests without coverage / source maps
npm run test:tz:all         # unit tests across multiple timezones
npm run test:electron       # Node test runner for Electron *.test.cjs files
npm run e2e                 # all Playwright E2E tests
npm run e2e:file <path>     # single E2E file
npm run e2e:supersync       # SuperSync E2E suite (starts Docker services)
npm run e2e:webdav          # WebDAV sync E2E suite (starts Docker services)
```

### Code Quality

```bash
npm run checkFile <filepath>   # REQUIRED after every .ts/.scss change (Prettier + lint)
npm run lint                   # full lint (TS + SCSS + local rule specs)
npm run lint:ts                # Angular ESLint
npm run lint:scss              # Stylelint
npm run prettier               # multi-file formatting via pretty-quick
npm run prettier:file -- <fp>  # single-file Prettier
```

### Packages

```bash
npm run build:packages      # build all workspace packages
npm run plugins:build       # build plugin API + vite plugin + dev plugins
npm run sync-core:build     # build @sp/sync-core
npm run sync-providers:build# build @sp/sync-providers
npm run shared-schema:build # build @sp/shared-schema
```

---

## Code Style Guidelines

### Required checks

- **Run `npm run checkFile <filepath>` on every `.ts` or `.scss` file you modify** before finishing work.
- The project uses Prettier, ESLint (with `typescript-eslint`, `angular-eslint`, and local rules), and Stylelint.

### TypeScript

- Strict TypeScript. Avoid `any`; use proper types or `unknown` if the type is genuinely unknown.
- Explicit function return types are enforced.
- Arrow functions are preferred (`prefer-arrow/prefer-arrow-functions`).
- Prefer standalone components over `NgModules` for new code.
- Prefer Angular Signals over RxJS Observables where possible.
- Do not access the DOM directly; use Angular bindings or `viewChild()`.
- Do not subscribe without cleanup; use `takeUntilDestroyed()` or the `async` pipe.
- Avoid side effects in constructors.

### State management

- Never mutate NgRx state in reducers; always return new objects.
- Effects must inject `LOCAL_ACTIONS`, not `Actions` (`ALL_ACTIONS` is reserved for the op-log capture effect).
- Selector-based effects need `skipDuringSyncWindow()`.
- Multi-entity state changes should be handled by meta-reducers, not effect fan-outs.
- Read `docs/sync-and-op-log/contributor-sync-model.md` before changing synced state.

### Logging

- App code must use `Log.log({ id: task.id })` and related helpers from `src/app/core/log.ts`.
- Never log user content (`task.title`, etc.) because log history is exportable.
- Direct `console.*` calls are lint errors in `src/app/**/*.ts` (tests and the logger itself are exempt).

### Electron / platform guards

- Check `IS_ELECTRON` (or inject `IS_ELECTRON_TOKEN`) before using Electron-specific APIs.
- Use platform detection utilities in `src/app/util/` and `src/app/app.constants.ts`.

### Translations

- All UI strings go through `T` / `TranslateService`.
- Edit only `src/assets/i18n/en.json`. Other locale files are managed separately.

### Styling

See `docs/styling-guide.md` for the full guide. Key rules:

- Use CSS variables from `src/styles/_css-variables.scss` for colors, spacing, shadows, transitions, and z-index.
- Layout/positioning (flexbox, grid, dimensions) can be plain CSS.
- Check `src/app/ui/` before creating new styled elements.
- Keep component SCSS minimal; shared styles belong in `src/styles/components/` or as mixins.
- Use the 8px spacing grid (`--s`, `--s2`, `--s3`, etc.).
- Do not restyle Angular Material or shared `src/app/ui/` components locally for one-off needs.

---

## Testing Instructions

### Unit tests

- Unit tests are co-located with source files as `*.spec.ts`.
- Karma runs with ChromeHeadless by default.
- Tests are pinned to `TZ='Europe/Berlin'` by default; CI also runs a Los_Angeles timezone check.
- Use `npm run test:file <path>` for focused unit-test runs.

### E2E tests

- Playwright tests live in `e2e/tests/` and use page objects in `e2e/pages/`.
- Base URL defaults to `http://localhost:4242`; override with `E2E_BASE_URL`.
- Browser locale is pinned to `en-GB` for deterministic dates.
- Tests run in fully parallel mode locally but are capped to 3 workers in CI.
- Sync-related tests (`@webdav`, `@supersync`) require Docker services and have dedicated npm scripts.
- Critical E2E rules:
  1. Start every test with `await workViewPage.waitForTaskList()`.
  2. Use page objects, not raw `page.locator()`.
  3. Do not use `waitForTimeout()`; prefer `expect(...).toBeVisible()`.

---

## Sync, State, and Data Correctness

The application uses an operation-log-based sync model. Sync bugs can silently corrupt or lose user data across devices, so changes here are high-risk.

High-level invariants (lint-enforced where noted):

1. **Effects inject `LOCAL_ACTIONS`**, never `Actions`. (`no-actions-in-effects`)
2. **Prefer action-based effects**; selector-based effects need `skipDuringSyncWindow()`. (`require-hydration-guard`)
3. **Multi-entity changes are meta-reducers**, not effect fan-outs.
4. **Logical clock** goes through `DateService` (`getLogicalTodayDate`, `isToday`, `todayStr`). Pure reducers/selectors take `startOfNextDayDiffMs` and call `isTodayWithOffset` for replay determinism.
5. **`TODAY_TAG` (`'TODAY'`) is virtual** — never add it to `task.tagIds`; membership derives from `task.dueWithTime` or `task.dueDay`.
6. **Bulk dispatch loops** must `await new Promise(r => setTimeout(r, 0))` after the loop.
7. **`SYNC_IMPORT` / `BACKUP_IMPORT`** replace state and intentionally drop concurrent ops — this is by design.
8. **Vector clocks** are capped at `MAX_VECTOR_CLOCK_SIZE = 20`.
9. **Package boundaries**:
   - `@sp/sync-core` owns framework-agnostic sync primitives.
   - `@sp/sync-providers` owns bundled provider implementations and consumes only public `@sp/sync-core` exports.
   - `src/app` composes host-specific wiring (credentials, validators, OAuth, platform bridges).

Active architecture patterns are recorded in `ARCHITECTURE-DECISIONS.md`, including:

- `dueDay` / `dueWithTime` mutual exclusivity.
- Virtual `TODAY_TAG`.
- Sync package boundary direction.
- Batch uploads under RepeatableRead.
- Decoupled project completion.

---

## Plugin System

Super Productivity supports client-side plugins:

- `packages/plugin-api/` defines the plugin surface.
- `packages/plugin-dev/` contains example plugins and a SolidJS boilerplate.
- `src/app/plugins/` contains the runtime loader, store, UI host, and OAuth redirect handler.
- Plugins are built with `npm run plugins:build` and copied to `src/assets/bundled-plugins/`.
- Plugin documentation: `docs/plugin-development.md`.

---

## Personal Fork Mods (`src/app/mods/`)

This working tree includes a personal mods layer documented in `MODS.md`:

- Custom cursor with presets and uploaded images.
- Custom background (solid color or image) with blur/opacity.
- Canvas-based particle effects running outside Angular change detection.
- Draggable image stamps persisted in `localStorage`.
- A mods panel UI for configuration.

The mods are client-side only and use `localStorage` for persistence.

---

## Deployment and CI

- GitHub Actions workflows are in `.github/workflows/`.
- Key workflows:
  - `ci.yml` — lint, test, build.
  - `build.yml` / `manual-build.yml` — production desktop builds.
  - `build-android.yml`, `build-ios.yml` — mobile builds.
  - `build-update-web-app-on-release.yml` — web deployment.
  - `publish-to-hub-docker.yml` — Docker image publishing.
  - `supersync-docker.yml`, `supersync-server-tests.yml` — SuperSync server.
  - `e2e-scheduled.yml` — scheduled E2E runs.
  - `wiki-sync.yml` — syncs `docs/wiki/` to the GitHub Wiki.
- Desktop releases are packaged with `electron-builder` and published to GitHub Releases, Microsoft Store, Mac App Store, Snap, AUR, and Flathub.
- Mobile releases use Capacitor + Gradle (Android) and Xcode (iOS).

---

## Security and Privacy Considerations

- The app collects no analytics and stores data locally by default.
- Sync providers and integrations require explicit user configuration.
- Never log user content or secrets.
- Electron preload exposes a minimal typed API via `window.ea`.
- `.env` values are injected into `src/app/config/env.generated.ts` only at build time; do not commit `.env`.

---

## Commit Message Format

Use Angular conventional commits:

```
type(scope): description
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.

Examples:

- `feat(tasks): add recurring task support`
- `fix(sync): handle network timeout gracefully`
- `test(e2e): fix flaky sync tests`

Use `test:` (not `fix(test):`) for test-only changes. Include the issue number when fixing a specific issue.

---

## Key Documentation References

- `CLAUDE.md` — task-specific guidance and sync rules.
- `ARCHITECTURE-DECISIONS.md` — active architectural patterns.
- `docs/styling-guide.md` — styling rules and design tokens.
- `docs/documentation-guide.md` — when and how to update user-facing docs.
- `docs/sync-and-op-log/contributor-sync-model.md` — sync model for contributors.
- `docs/sync-and-op-log/package-boundaries.md` — sync package boundaries.
- `e2e/CLAUDE.md` — E2E test reference.
- `MODS.md` — documentation of the personal-fork mods.
- `packages/README.md` — package workspace overview.
