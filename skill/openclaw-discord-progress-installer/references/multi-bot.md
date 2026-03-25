# Multi-Bot Guidance

## Goal

Enable Discord progress sync without duplicate cards or double replies.

## Rules

1. Use one bot token per account.
2. Disable `channels.discord.accounts.default` in production unless you intentionally use it.
3. Do not let two accounts share the same token.
4. Keep each bot scoped to its own channels or responsibilities where possible.

## Duplicate Card Root Cause

Duplicate cards usually happen when:

- `default` and a named account are both enabled
- both accounts resolve to the same `DISCORD_BOT_TOKEN`
- the same inbound Discord message is consumed twice

## Recommended Config Shape

```json
{
  "channels": {
    "discord": {
      "defaultAccount": "money",
      "accounts": {
        "default": {
          "enabled": false
        },
        "money": {
          "enabled": true,
          "token": {
            "source": "env",
            "provider": "default",
            "id": "DISCORD_BOT_TOKEN_MONEY"
          }
        },
        "ops": {
          "enabled": true,
          "token": {
            "source": "env",
            "provider": "default",
            "id": "DISCORD_BOT_TOKEN_OPS"
          }
        }
      }
    }
  }
}
```

## Verification

After configuration:

- check channel status
- confirm only one account is bound to each bot ID
- send one real Discord test message
- verify that exactly one progress card is created
