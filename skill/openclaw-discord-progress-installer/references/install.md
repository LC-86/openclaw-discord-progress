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
- safety warnings

Users should treat the ClawHub skill as:

- an installer/guide layer
- a discoverable entrypoint
- a concise usage and configuration helper

## Required Safety Checks

Before publishing:

- remove private config files
- remove `.env`
- remove all tokens
- remove session artifacts
- review guild/channel/user IDs

## Runtime Notes

The feature depends on OpenClaw Discord runtime hooks. It is not a standalone prompt-only skill.
