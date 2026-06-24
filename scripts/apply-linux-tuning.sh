#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

sudo cp "$ROOT_DIR/infra/linux/99-lavalink.conf" /etc/sysctl.d/99-lavalink.conf
sudo sysctl --system

sudo cp "$ROOT_DIR/infra/linux/lavalink-limits.conf" /etc/security/limits.d/lavalink.conf

echo "Linux kernel and limits tuning applied."
