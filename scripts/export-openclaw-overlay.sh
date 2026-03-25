#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <path-to-openclaw-checkout>" >&2
  exit 1
fi

SOURCE_ROOT="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MANIFEST="$REPO_ROOT/manifests/openclaw-release-files.txt"
OVERLAY_ROOT="$REPO_ROOT/overlay/openclaw"

if [[ ! -d "$SOURCE_ROOT" ]]; then
  echo "OpenClaw checkout not found: $SOURCE_ROOT" >&2
  exit 1
fi

if [[ ! -f "$MANIFEST" ]]; then
  echo "Manifest not found: $MANIFEST" >&2
  exit 1
fi

rm -rf "$OVERLAY_ROOT"
mkdir -p "$OVERLAY_ROOT"

while IFS= read -r relative_path; do
  [[ -z "$relative_path" ]] && continue
  src="$SOURCE_ROOT/$relative_path"
  dest="$OVERLAY_ROOT/$relative_path"
  if [[ ! -f "$src" ]]; then
    echo "Missing source file: $src" >&2
    exit 1
  fi
  mkdir -p "$(dirname "$dest")"
  cp "$src" "$dest"
done < "$MANIFEST"

echo "Overlay exported to: $OVERLAY_ROOT"
echo "Review the copied files before publishing."
