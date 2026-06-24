# Production Lavalink v4 Stack (Beginner Friendly)

This repository now contains a complete production-ready Lavalink v4 setup for:

- Ubuntu 24.04
- Java 21
- 2 vCPU / 4GB RAM VPS
- Discord.js v14 + Poru
- 2-3 bots sharing one Lavalink node
- Practical concurrency target: 10-30 listeners

## What Was Generated

- Full Lavalink configuration
- Docker deployment setup
- Systemd deployment setup
- Security hardening templates
- Linux kernel tuning
- Prometheus + Grafana monitoring setup
- Production Poru example bot with fallback search chain

## Project Structure

```text
infra/
	lavalink/
		application.yml
		.env.example
		docker-compose.yml
		jvm.flags
		plugins/
		logs/
		data/
	linux/
		99-lavalink.conf
		lavalink-limits.conf
	monitoring/
		prometheus.yml
		grafana/dashboards/
			dashboard-provider.yml
			lavalink-overview.json
	security/
		ufw.rules.sh
		fail2ban-jail.local
		nginx-lavalink.conf
	systemd/
		lavalink.service

scripts/
	install-docker.sh
	deploy-docker.sh
	apply-linux-tuning.sh
	install-systemd-lavalink.sh
	generate-secrets.sh

examples/
	poru/
		package.json
		.env.example
		index.js
```

## Fastest Path (Recommended): Docker Deployment

1. Install Docker

```bash
./scripts/install-docker.sh
```

2. Apply Linux tuning

```bash
./scripts/apply-linux-tuning.sh
```

3. Create Lavalink env file

```bash
cd infra/lavalink
cp .env.example .env
```

4. Generate strong secrets

```bash
cd ../..
./scripts/generate-secrets.sh
```

Copy output values into `infra/lavalink/.env` for:

- `LAVALINK_PASSWORD`
- `LAVALINK_RESUME_KEY`

Also set:

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `APPLE_MUSIC_TOKEN`

5. Start Lavalink + monitoring stack

```bash
./scripts/deploy-docker.sh
```

6. Verify health

```bash
curl -s http://127.0.0.1:2333/health
curl -s http://127.0.0.1:2333/prometheus | head
```

## Optional Path: Systemd Deployment

Use this only if you do not want Docker.

1. Download Lavalink v4 jar.
2. Install unit:

```bash
./scripts/install-systemd-lavalink.sh /path/to/Lavalink.jar
```

3. Edit `/opt/lavalink/.env` with real credentials and secrets.
4. Start service:

```bash
sudo systemctl start lavalink
sudo systemctl status lavalink
```

## Security Hardening

1. Restrict Lavalink access via UFW (allow only bot host IP):

```bash
BOT_SERVER_IP=1.2.3.4 ./infra/security/ufw.rules.sh
```

2. Enable fail2ban using:

- `infra/security/fail2ban-jail.local`

3. If you expose Lavalink remotely, use reverse proxy config template:

- `infra/security/nginx-lavalink.conf`

Do not expose port 2333 publicly without IP allowlisting.

## Poru Example Bot

1. Setup example:

```bash
cd examples/poru
cp .env.example .env
npm install
```

2. Fill `.env` with:

- `DISCORD_TOKEN`
- `LAVALINK_HOST`
- `LAVALINK_PORT`
- `LAVALINK_PASSWORD`
- `LAVALINK_RESUME_KEY`

3. Start bot:

```bash
npm start
```

4. Commands:

- `!play <query or url>`
- `!skip`
- `!stop`
- `!now`

The example includes fallback resolution chain:

1. YouTube Music search
2. YouTube search
3. SoundCloud search
4. Direct query

## Audio Features Included

- 48kHz compatible Discord audio path
- Stable buffering and seek settings
- Session resume and recovery
- All common Lavalink filters enabled:
	- EQ
	- Bass-style boosts (via EQ presets in bot)
	- Nightcore/Vaporwave style (timescale)
	- Karaoke
	- Tremolo
	- Vibrato
	- Rotation
	- Distortion
	- Channel mix

## Supported Sources

- YouTube / YouTube Music (YouTube plugin)
- Spotify / Apple Music / Deezer metadata (LavaSrc plugin)
- SoundCloud
- Bandcamp
- Twitch
- Vimeo
- Internet radio and direct audio URLs

Notes:

- JioSaavn support is best handled in your bot metadata layer, then resolve via fallback search.
- Podcast feeds should be parsed in bot code, then pass episode audio URL to Lavalink.

## Monitoring

- Prometheus config: `infra/monitoring/prometheus.yml`
- Grafana dashboard files:
	- `infra/monitoring/grafana/dashboards/dashboard-provider.yml`
	- `infra/monitoring/grafana/dashboards/lavalink-overview.json`

Default local endpoints:

- Lavalink health: `http://127.0.0.1:2333/health`
- Lavalink metrics: `http://127.0.0.1:2333/prometheus`
- Prometheus: `http://127.0.0.1:9090`
- Grafana: `http://127.0.0.1:3000`

## Production Checklist

- [ ] Secrets generated and set
- [ ] API keys set for Spotify and Apple
- [ ] UFW configured with strict allowlist
- [ ] Lavalink health endpoint is UP
- [ ] Bot can play, skip, stop, reconnect
- [ ] Restart test passed (Lavalink restart during playback)
- [ ] Peak CPU and memory monitored in Grafana

## Scaling Guidance

Upgrade to 4 vCPU / 8GB when two or more are true:

- Sustained CPU > 70% at peak
- GC pauses frequently > 150-200 ms
- Track start latency regularly > 2.5s
- Concurrency frequently above 35 listeners

Move to multiple Lavalink nodes when:

- You need regional low latency
- You need failover node redundancy
- One node restart impacts too many active guilds