#!/bin/bash
# deploy.sh — Copy app-source/ into docs/ for GitHub Pages deployment
# Usage: ./deploy.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE="$SCRIPT_DIR/app-source"
DEST="$SCRIPT_DIR/docs"

# Sanity checks
if [ ! -f "$SOURCE/index.html" ]; then
  echo "ERROR: app-source/index.html not found. Nothing to deploy."
  exit 1
fi

# Read version
VERSION="unknown"
if [ -f "$SOURCE/VERSION" ]; then
  VERSION=$(cat "$SOURCE/VERSION" | tr -d '[:space:]')
fi

echo "Deploying Idea Capture v${VERSION}..."
echo ""

# Copy source to docs
cp "$SOURCE/index.html" "$DEST/index.html"

echo "Deployed:"
echo "  app-source/index.html -> docs/index.html"
echo ""
echo "Version: $VERSION"
echo "File size: $(wc -c < "$DEST/index.html" | tr -d ' ') bytes"
echo ""
echo "Next steps:"
echo "  1. Open docs/index.html in browser to verify"
echo "  2. git add docs/"
echo "  3. git commit -m 'deploy v${VERSION}'"
echo "  4. git push"
echo ""
echo "Done."
