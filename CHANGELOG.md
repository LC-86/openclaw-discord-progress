# Changelog

All notable changes to `openclaw-discord-progress` are documented in this file.

## v1.0.1 - 2026-03-28

Compatibility maintenance release for `OpenClaw 2026.3.24`.

### Fixed

- Updated Discord message progress integration to use the current `plugin-sdk` subpaths for `channel-feedback`, `channel-inbound`, and `reply-history`
- Updated Discord native command integration to use the current `command-auth` subpath exports
- Restored the Discord message observer callbacks required for task-card start, delivery, and freeze behavior on newer OpenClaw builds

### Verification

- `pnpm build` passed against `OpenClaw 2026.3.24`
- `vitest`: `src/auto-reply/reply/commands-session.progress.test.ts` passed
- `vitest`: `extensions/discord/src/monitor/progress-sync.test.ts` passed
- `vitest`: `extensions/discord/src/monitor/native-command.commands-allowfrom.test.ts` passed

## v1.0.0 - 2026-03-26

Initial stable release.

### Added

- Discord real-time task progress card that updates the same message during a run
- Final report card with status, progress, runtime metrics, and summary
- Support for both normal Discord messages and slash commands
- Quick install script and bilingual documentation
- `/progress` command with interactive mode choices for `strict`, `auto`, `verbose`, and `off`

### Improved

- Reduced noisy timeline spam so successful runs mainly show the main card and final reply
- Smoothed progress percentages to avoid the old `0% -> 90% -> 100%` jump pattern
- Added stricter chat filtering so casual conversation no longer triggers a task card by default

### Fixed

- Prevented duplicate progress cards caused by duplicated Discord bot account wiring
- Added config-backed mode persistence so progress display mode survives restart

### Verification

- `vitest`: `src/auto-reply/reply/commands-session.progress.test.ts` passed
- `vitest`: `extensions/discord/src/monitor/progress-sync.test.ts` passed
- Full `tsc --noEmit` still reports existing unrelated errors in `feishu` and missing `matrix` dependencies
