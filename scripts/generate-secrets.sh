#!/usr/bin/env bash
set -euo pipefail

echo "LAVALINK_PASSWORD=$(openssl rand -base64 48)"
echo "LAVALINK_RESUME_KEY=$(openssl rand -base64 48)"
