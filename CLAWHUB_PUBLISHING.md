# ClawHub Publishing Copy

Use the folder below as the publish target:

```text
skill/openclaw-discord-progress-installer/
```

## Suggested Skill Title

OpenClaw Discord Progress Installer

## Suggested Short Description

Install and configure OpenClaw Discord task progress cards with low-noise updates, strict chat filtering, and multi-bot safety guidance.

## Suggested Long Description

This skill is the guided install entrypoint for OpenClaw Discord Progress.

It helps users:

- understand what the capability does
- install the release from GitHub
- configure Discord progress cards safely
- switch progress display mode directly from Discord with `/progress`
- avoid duplicate cards in multi-bot setups
- keep Discord task visibility high while reducing channel noise
- keep casual chat from generating unnecessary task cards by default

The actual runtime capability is distributed through the paired GitHub repository. This skill is intentionally lightweight and focuses on installation, configuration, and operational guidance.

## Suggested Tags

- openclaw
- discord
- progress
- task-tracking
- multi-bot
- installer

## Suggested Publish Notes

- Publish the skill only, not your private OpenClaw config
- Do not include `.env`, `openclaw.json`, or any token
- Point users to the GitHub repository as the source of truth for release files
