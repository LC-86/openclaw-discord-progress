#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/LC-86/openclaw-discord-progress.git"
REPO_BRANCH="${OPENCLAW_DISCORD_PROGRESS_REF:-main}"
SUPPORTED_OPENCLAW_VERSION="2026.3.24"
TARGET_DIR="${OPENCLAW_DIR:-}"
RUN_BUILD=1
RUN_RESTART=1

usage() {
  cat <<'EOF'
OpenClaw Discord Progress installer

Usage:
  bash install.sh [--target <openclaw-dir>] [--no-build] [--no-restart]

Environment:
  OPENCLAW_DIR                    Path to the target OpenClaw checkout
  OPENCLAW_DISCORD_PROGRESS_REF   Git ref to install, default: main

Quick install:
  bash <(curl -fsSL https://raw.githubusercontent.com/LC-86/openclaw-discord-progress/main/install.sh)

Recommended:
  Run the quick install command from inside your OpenClaw repository root.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      TARGET_DIR="${2:-}"
      shift 2
      ;;
    --no-build)
      RUN_BUILD=0
      shift
      ;;
    --no-restart)
      RUN_RESTART=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "$TARGET_DIR" ]]; then
  if [[ -f "./package.json" ]] && grep -q '"name":[[:space:]]*"openclaw"' "./package.json"; then
    TARGET_DIR="$(pwd)"
  fi
fi

if [[ -z "$TARGET_DIR" ]]; then
  echo "Unable to detect your OpenClaw checkout." >&2
  echo "Run this command from the OpenClaw repo root, or pass --target /path/to/openclaw." >&2
  exit 1
fi

if [[ ! -d "$TARGET_DIR" ]]; then
  echo "Target directory does not exist: $TARGET_DIR" >&2
  exit 1
fi

if [[ ! -f "$TARGET_DIR/package.json" ]] || ! grep -q '"name":[[:space:]]*"openclaw"' "$TARGET_DIR/package.json"; then
  echo "Target directory does not look like an OpenClaw checkout: $TARGET_DIR" >&2
  exit 1
fi

if command -v node >/dev/null 2>&1; then
  TARGET_VERSION="$(node -p "require(process.argv[1]).version" "$TARGET_DIR/package.json" 2>/dev/null || true)"
  if [[ -n "$TARGET_VERSION" ]] && [[ "$TARGET_VERSION" != "$SUPPORTED_OPENCLAW_VERSION" ]]; then
    echo "Warning: this release is verified against OpenClaw $SUPPORTED_OPENCLAW_VERSION, but your target checkout is $TARGET_VERSION." >&2
    echo "The install can still continue, but you should run pnpm build and one real Discord smoke test after applying the overlay." >&2
  fi
fi

if ! command -v git >/dev/null 2>&1; then
  echo "git is required but was not found." >&2
  exit 1
fi

if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync is required but was not found." >&2
  exit 1
fi

TEMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

echo "Cloning release wrapper from GitHub..."
git clone --depth 1 --branch "$REPO_BRANCH" "$REPO_URL" "$TEMP_DIR/release" >/dev/null 2>&1

OVERLAY_DIR="$TEMP_DIR/release/overlay/openclaw"
if [[ ! -d "$OVERLAY_DIR" ]]; then
  echo "Overlay directory missing in downloaded release." >&2
  exit 1
fi

echo "Applying overlay files into: $TARGET_DIR"
rsync -a "$OVERLAY_DIR"/ "$TARGET_DIR"/

if [[ $RUN_BUILD -eq 1 ]]; then
  if command -v pnpm >/dev/null 2>&1; then
    echo "Building OpenClaw..."
    (cd "$TARGET_DIR" && pnpm build)
  else
    echo "pnpm not found; skipping build." >&2
  fi
fi

if [[ $RUN_RESTART -eq 1 ]]; then
  if command -v openclaw >/dev/null 2>&1; then
    echo "Restarting OpenClaw gateway..."
    if ! (cd "$TARGET_DIR" && openclaw gateway restart --json); then
      echo "Gateway restart failed. You can rerun it manually:" >&2
      echo "  cd \"$TARGET_DIR\" && openclaw gateway restart --json" >&2
    fi
  else
    echo "openclaw command not found; skipping restart." >&2
  fi
fi

cat <<EOF

Install complete.

Next steps:
1. Send one real Discord message.
2. Confirm exactly one progress card is created.
3. Confirm the card updates in place and freezes into a final report.

Target OpenClaw checkout:
  $TARGET_DIR
EOF
