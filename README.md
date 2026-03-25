# OpenClaw Discord Progress

OpenClaw Discord Progress adds low-noise, real-time task progress cards to Discord agent workflows.

It is designed for OpenClaw-based Discord bots that need:

- one live task card per run
- ongoing card updates during execution
- a final frozen report card on completion
- support for both normal messages and slash commands
- reduced noisy status spam in busy channels
- safer multi-bot deployment guidance to avoid duplicate cards

## Release Layout

This project intentionally separates distribution into two layers:

- GitHub repository: the release wrapper, exported runtime file overlay, manifest, and documentation
- ClawHub skill: the install and enablement entrypoint for guided setup

This keeps the actual capability easy to inspect on GitHub while allowing ClawHub users to discover and activate it through a lightweight skill package.

## What Is Included

- `overlay/openclaw/`
  Exported source overlay containing the OpenClaw files touched by this feature
- `manifests/openclaw-release-files.txt`
  The release manifest for the exported overlay
- `scripts/export-openclaw-overlay.sh`
  Helper script that copies release files from an OpenClaw checkout
- `skill/openclaw-discord-progress-installer/`
  ClawHub-ready installer skill with setup guidance and multi-bot safety notes

## Key Capability

### Main Card

- Creates one Discord progress card per task
- Edits the same card throughout execution
- Freezes the card as a final report when the task completes

### Channel Noise Control

- Successful runs keep the channel focused on the main card and final reply
- Intermediate status spam is reduced
- Failure paths can still emit a separate signal when needed

### Multi-Bot Safety

- warns against duplicate account listeners
- documents one-token-per-account setup
- explains why `accounts.default` should usually be disabled in production

## What You Must Not Publish

Never commit or publish:

- personal `openclaw.json`
- `.env` files
- Discord bot tokens
- gateway tokens
- private guild, channel, or user IDs unless you explicitly want them public
- transcripts, session logs, or personal memory files

## Recommended Publishing Flow

1. Keep the runtime implementation in an OpenClaw fork or feature branch.
2. Export the release files:

```bash
./scripts/export-openclaw-overlay.sh /path/to/openclaw
```

3. Review the exported overlay.
4. Push this repository to GitHub.
5. Publish the ClawHub skill from:

```text
skill/openclaw-discord-progress-installer/
```

## Multi-Bot Rules

- one Discord bot token per account
- disable `accounts.default` in production unless intentionally used
- never let two accounts share the same bot token
- keep each bot scoped to its own channel responsibility when possible

## Suggested Distribution Model

- OpenClaw fork or branch: actual runtime integration
- This repository: release packaging and public install docs
- ClawHub skill: discoverable guided installer

## Repository Status

This repository is intended to be the public packaging layer for the feature. It does not replace the upstream OpenClaw codebase.
