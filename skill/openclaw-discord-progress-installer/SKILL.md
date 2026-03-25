---
name: openclaw-discord-progress-installer
description: Install and configure the OpenClaw Discord progress capability from a GitHub release wrapper. Use when the user wants Discord task progress cards, wants to package the feature for ClawHub, or needs safe multi-bot setup guidance that avoids duplicate cards.
---

# Discord Progress Sync Installer

Use this skill when the user wants to install, package, or enable the Discord real-time task progress capability for OpenClaw.

## What This Skill Does

- Explains how to install the capability from GitHub
- Guides safe Discord account configuration
- Explains how to avoid duplicate progress cards in multi-bot setups
- Explains the default strict progress mode so casual chat does not create cards
- Points to the release wrapper structure without embedding private secrets

## What This Skill Does Not Do

- It does not carry private tokens
- It does not modify personal `.env` files automatically
- It does not publish a whole OpenClaw checkout

## Workflow

1. Read `references/install.md` for the install/release flow.
2. If the user asks about multi-bot mode, also read `references/multi-bot.md`.
3. Keep the guidance focused on:
   - GitHub release wrapper
   - OpenClaw fork or branch that holds runtime code
   - ClawHub skill as the install entrypoint
4. Explicitly warn against sharing:
   - `openclaw.json`
   - `.env`
   - bot tokens
   - private IDs

## Output Expectations

When helping the user install or publish this capability:

- Give the GitHub repo role first
- Give the ClawHub skill role second
- Provide exact file locations when relevant
- Mention duplicate-card prevention when Discord has multiple accounts

## References

- Install flow: `references/install.md`
- Multi-bot guidance: `references/multi-bot.md`
