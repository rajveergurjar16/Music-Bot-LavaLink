#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   BOT_SERVER_IP=1.2.3.4 ./ufw.rules.sh
#
# This keeps Lavalink private and only allows your bot host to reach 2333.

if [[ -z "${BOT_SERVER_IP:-}" ]]; then
  echo "BOT_SERVER_IP is required. Example: BOT_SERVER_IP=1.2.3.4 ./ufw.rules.sh"
  exit 1
fi

sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow from "${BOT_SERVER_IP}" to any port 2333 proto tcp
sudo ufw --force enable
sudo ufw status verbose
