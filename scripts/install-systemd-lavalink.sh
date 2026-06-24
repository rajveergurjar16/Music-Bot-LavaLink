#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 /path/to/Lavalink.jar"
  exit 1
fi

JAR_PATH="$1"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

sudo useradd --system --home /opt/lavalink --shell /usr/sbin/nologin lavalink 2>/dev/null || true
sudo mkdir -p /opt/lavalink
sudo mkdir -p /opt/lavalink/logs /opt/lavalink/plugins /opt/lavalink/data

sudo cp "$JAR_PATH" /opt/lavalink/Lavalink.jar
sudo cp "$ROOT_DIR/infra/lavalink/application.yml" /opt/lavalink/application.yml

if [[ ! -f /opt/lavalink/.env ]]; then
  sudo cp "$ROOT_DIR/infra/lavalink/.env.example" /opt/lavalink/.env
  echo "Created /opt/lavalink/.env - edit it before starting service."
fi

sudo cp "$ROOT_DIR/infra/systemd/lavalink.service" /etc/systemd/system/lavalink.service
sudo chown -R lavalink:lavalink /opt/lavalink

sudo systemctl daemon-reload
sudo systemctl enable lavalink

echo "Systemd unit installed. Edit /opt/lavalink/.env and then run:"
echo "sudo systemctl start lavalink"
