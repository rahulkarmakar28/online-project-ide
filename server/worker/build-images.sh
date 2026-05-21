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

build "sandbox-node"   "Containerfile.node"
build "sandbox-python" "Containerfile.python"
build "sandbox-go"     "Containerfile.go"
build "sandbox-jvm"    "Containerfile.jvm"
build "sandbox-rust"   "Containerfile.rust"

echo ""
echo "All sandbox images built."
$BUILDER images | grep "sandbox-"