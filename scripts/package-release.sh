#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

VERSION="${1:-$(date +%Y%m%d-%H%M%S)}"
OUTPUT_DIR="$ROOT_DIR/release"
ARCHIVE_NAME="ziyu-downlow-${VERSION}.tar.gz"

mkdir -p "$OUTPUT_DIR"
rm -f "$OUTPUT_DIR/$ARCHIVE_NAME"

tar \
  --exclude='./node_modules' \
  --exclude='./apps/web/.next' \
  --exclude='./apps/admin/.next' \
  --exclude='./services/api/dist' \
  --exclude='./services/api/data' \
  --exclude='./release' \
  --exclude='./.git' \
  --exclude='./*.log' \
  -czf "$OUTPUT_DIR/$ARCHIVE_NAME" \
  .

echo "Created release archive: $OUTPUT_DIR/$ARCHIVE_NAME"