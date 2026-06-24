# Contributing

Thanks for helping improve this project.

## Before You Open a Pull Request

- Keep changes focused and small.
- Run the generated deployment and bot example locally if your change touches runtime behavior.
- Do not commit secrets, `.env` files, logs, or runtime data.

## Suggested Workflow

1. Create a branch from `main`.
2. Make your change.
3. Test the affected config, script, or code path.
4. Update docs if behavior changed.
5. Open a pull request with a clear summary.

## Project Notes

- Production Lavalink config lives under `infra/lavalink/`.
- System tuning templates live under `infra/linux/`.
- Security templates live under `infra/security/`.
- The Discord.js + Poru example is in `examples/poru/`.

## Style

- Keep shell scripts POSIX-friendly where practical.
- Prefer safe defaults for production systems.
- Preserve existing formatting and file layout.