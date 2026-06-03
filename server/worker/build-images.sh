#!/bin/bash
set -euo pipefail

BUILDER="${BUILDER:-docker}"
DIR="$(cd "$(dirname "$0")/containers" && pwd)"

build() {
    local tag=$1 file=$2
    echo ""
    echo "══════════════════════════════════════════"
    echo "  Building: $tag  (using $BUILDER)"
    echo "══════════════════════════════════════════"
    $BUILDER build -t "$tag" -f "$DIR/$file" "$DIR"
}

build "online-editor-node"   "Containerfile.node"
build "online-editor-python" "Containerfile.python"
build "online-editor-go"     "Containerfile.go"
build "online-editor-jvm"    "Containerfile.jvm"
build "online-editor-rust"   "Containerfile.rust"

echo ""
echo "All sandbox images built."
$BUILDER images | grep "online-editor-"