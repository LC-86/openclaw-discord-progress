# Changelog

All notable changes to `openclaw-discord-progress` are documented in this file.

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
