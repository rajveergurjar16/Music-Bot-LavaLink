#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LAVA_DIR="$ROOT_DIR/infra/lavalink"

cd "$LAVA_DIR"

if [[ ! -f .env ]]; then
  echo "Missing .env. Copy .env.example to .env and set real secrets first."
  exit 1
fi

docker compose pull
docker compose up -d

echo "Lavalink stack is up."
docker compose ps
