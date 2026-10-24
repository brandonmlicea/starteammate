<p align="center">
  <a href="https://pi.dev">
    <img alt="Starteammate logo" src="https://pi.dev/logo-auto.svg" width="128">
  </a>
</p>
<p align="center">
  <a href="https://discord.com/invite/3cU7Bz4UPx"><img alt="Discord" src="https://img.shields.io/badge/discord-community-5865F2?style=flat-square&logo=discord&logoColor=white" /></a>
  <a href="https://www.npmjs.com/package/starteammate"><img alt="npm" src="https://img.shields.io/npm/v/starteammate?style=flat-square&logo=npm&logoColor=white" /></a>
</p>

> New issues and PRs from new contributors are closed automatically. Maintainers review closed submissions daily. See [CONTRIBUTING.md](https://github.com/earendil-works/pi/blob/main/CONTRIBUTING.md).

# Starteammate

Starteammate is a minimal, extensible agent harness that you can make your own.

Adapt Starteammate to your workflows, not the other way around. Customize Starteammate with [extensions](docs/extensions.md), [skills](docs/skills.md), [prompt templates](docs/prompt-templates.md), and [themes](docs/themes.md). Bundle them as [Starteammate packages](docs/packages.md) and share via npm or git.

Starteammate ships with powerful defaults but skips features like sub-agents and plan mode. Ask Starteammate to build what you want, or install a package that does it your way.

Use Starteammate [interactively](docs/usage.md), automate it in [print or JSON mode](docs/cli.md), control it over [RPC](docs/rpc.md), or build apps with the [Starteammate TypeScript SDK](docs/sdk.md). See [OpenClaw](https://github.com/OpenClaw/OpenClaw) for a real-world integration.

## Getting started

Install the command-line interface:

```bash
curl -fsSL https://pi.dev/install.sh | sh
```

On Windows:

```shell
powershell -c "irm https://pi.dev/install.ps1 | iex"
```

The installer pins all dependencies and updates Starteammate with `starteammate update`. Alternatively, install directly with npm, which does not pin transitive dependencies:

```bash
npm install -g --ignore-scripts starteammate
```

Starteammate requires Node.js 22.19 or newer. The macOS, Linux, and Windows installers can install it if needed. Starteammate does not require dependency lifecycle scripts for a normal npm installation.

On macOS and Linux, Nix users can install the latest release with `nix profile add github:earendil-works/starteammate/stable`. See the [quickstart](docs/quickstart.md#1-install-starteammate) for updating and pinning releases.

Start Starteammate in the directory where you want it to work:

```bash
cd /path/to/project
starteammate
```

For a built-in AI provider, run `/login` inside Starteammate to connect a subscription or API key. Then give Starteammate a task.

See the [documentation](docs/index.md) for full setup and usage instructions.

## Share your OSS coding agent sessions

If you use Starteammate for open source work, please share your coding agent sessions.

Public OSS session data helps improve models, prompts, tools, and evaluations using real development workflows.

For the full explanation, see [this post on X](https://x.com/badlogicgames/status/2037811643774652911).

To publish sessions, use [`badlogic/starteammate-share-hf`](https://github.com/badlogic/pi-share-hf) using a Hugging Face account and the Hugging Face CLI.

- [Demo video](https://x.com/badlogicgames/status/2041151967695634619) on how to publish Starteammate sessions
- Published Starteammate development sessions: [`badlogicgames/starteammate-mono` on Hugging Face](https://huggingface.co/datasets/badlogicgames/pi-mono).

## Development

Clone the repository, install its dependencies, and run Starteammate from source:

```bash
git clone https://github.com/earendil-works/pi
cd starteammate
npm install --ignore-scripts
./starteammate-test.sh
```

`starteammate-test.sh` can be called from any directory and preserves the caller's working directory.

Before submitting changes, run:

```bash
npm run check
./test.sh
```

Read [CONTRIBUTING.md](https://github.com/earendil-works/pi/blob/main/CONTRIBUTING.md) before opening an issue or pull request. It defines the contribution gate, issue quality bar, and required checks. Read [AGENTS.md](https://github.com/earendil-works/pi/blob/main/AGENTS.md) for repository-specific implementation, testing, dependency, and release rules.

## License

MIT
