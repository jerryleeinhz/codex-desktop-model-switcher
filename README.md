# Codex Desktop Model Switcher

Codex Desktop Model Switcher is a standalone macOS-side tool for switching Codex Desktop between model configurations from a UI, without editing `~/.codex/config.toml` by hand.

This project is intentionally the **external app** route, not a patch to Codex Desktop itself.

## Goal

Provide a small UI that can:

- switch Codex Desktop between OpenAI and DeepSeek-backed configurations
- manage the local DeepSeek bridge lifecycle
- show the current active Desktop model config
- optionally launch or relaunch Codex Desktop after a switch

## Why This Project Exists

Directly modifying Codex Desktop's in-app model picker would require patching the upstream packaged app. That is fragile and likely to break on updates.

This project instead builds a separate control surface with a cleaner maintenance story.

## Planned Features

- desktop UI for model switching
- one-click switch to DeepSeek
- one-click switch back to OpenAI
- status view for:
  - current `model`
  - current `model_provider`
  - DeepSeek proxy health
- launch/relaunch Codex Desktop
- reuse the existing `responses -> chat/completions` DeepSeek bridge

## MVP

The current MVP is a local web UI that can:

- show the current Codex Desktop `model`
- show the current Codex Desktop `model_provider`
- show DeepSeek proxy health
- switch Desktop defaults to OpenAI
- switch Desktop defaults to DeepSeek
- start or stop the proxy
- open Codex Desktop

Start it with:

```bash
npm start
```

Then open:

```text
http://127.0.0.1:4310
```

This foreground mode is mainly for development. If you close the terminal, the UI service stops.

To keep it running in the background:

```bash
./scripts/install-launchagent.sh
```

To stop the background service:

```bash
./scripts/uninstall-launchagent.sh
```

## Repository Layout

- `docs/feasibility.md`
  External app feasibility and tradeoffs.
- `docs/architecture.md`
  Proposed app architecture.
- `docs/plan.md`
  Implementation plan.
- `scripts/bootstrap.sh`
  Local dev bootstrap placeholder.

## Recommendation

Build this as a small macOS app or menu-bar utility that edits Codex config safely and talks to the local bridge.

## Future Commands

Planned user-facing actions:

```text
Switch to DeepSeek
Switch to OpenAI
Check proxy status
Launch Codex Desktop
Relaunch Codex Desktop
Show current Desktop model
```
