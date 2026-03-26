# Install Flow

## Purpose

This capability is best shared as:

- a GitHub repository that contains the release wrapper and export tooling
- a ClawHub skill that points users to the GitHub release and explains setup

## Recommended Packaging Flow

1. Keep the runtime code changes in an OpenClaw fork or feature branch.
2. Use the wrapper repository to document and package the release.
3. Export the release files from an OpenClaw checkout with:

```bash
scripts/export-openclaw-overlay.sh /path/to/openclaw
```

4. Review the exported overlay under `overlay/openclaw/`.
5. Push the wrapper repository to GitHub.
6. Publish the skill folder to ClawHub.

## What Users Install

Users should treat the GitHub repository as the source of truth for:

- release files
- install instructions
- multi-bot notes
- progress mode behavior
- safety warnings

Users should treat the ClawHub skill as:

- an installer/guide layer
- a discoverable entrypoint
- a concise usage and configuration helper

## User Installation Paths

### Quick Install Command

For users who are already inside an OpenClaw checkout:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/LC-86/openclaw-discord-progress/main/install.sh)
```

Install into a specific target checkout:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/LC-86/openclaw-discord-progress/main/install.sh) -- --target /path/to/openclaw
```

Skip build and restart:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/LC-86/openclaw-discord-progress/main/install.sh) -- --no-build --no-restart
```

### Path 1: Guided Install Through ClawHub

1. Install the skill.
2. Open this skill folder:

```text
skill/openclaw-discord-progress-installer/
```

3. Read:

- `references/install.md`
- `references/multi-bot.md`

4. Clone the paired GitHub repository.
5. Copy the runtime overlay files from `overlay/openclaw/` into the matching paths in your OpenClaw checkout.
6. Rebuild OpenClaw:

```bash
pnpm build
```

7. Restart the gateway:

```bash
openclaw gateway restart --json
```

8. Send one real Discord test message and confirm that only one progress card appears.
9. Verify chat filtering:

- send one casual message such as `算了，先这样吧`
- confirm that no progress card is created in default `strict` mode
- send one explicit task request and confirm that a card does appear

### Path 2: Direct Install From GitHub

1. Clone the GitHub repository.
2. Review the exported files in `overlay/openclaw/`.
3. Copy those files into your OpenClaw checkout.
4. Rebuild OpenClaw.
5. Restart the gateway.
6. Run a real Discord verification.

## Maintainer Packaging Flow

If you are the maintainer of the release wrapper:

1. Keep feature work in an OpenClaw fork or branch.
2. Export changed files into the release wrapper:

```bash
./scripts/export-openclaw-overlay.sh /path/to/openclaw
```

3. Review the exported files.
4. Commit and push the wrapper repository.
5. Publish the ClawHub skill.

## Required Safety Checks

Before publishing:

- remove private config files
- remove `.env`
- remove all tokens
- remove session artifacts
- review guild/channel/user IDs

## Runtime Notes

The feature depends on OpenClaw Discord runtime hooks. It is not a standalone prompt-only skill.

Default runtime behavior:

- `OPENCLAW_DISCORD_PROGRESS_MODE=strict`
- casual chat should not create progress cards
- real task execution still creates cards when the request is task-like or the run enters tool execution
- users can switch modes from Discord with `/progress strict|auto|verbose|off`
