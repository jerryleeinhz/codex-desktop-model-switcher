# Feasibility: External UI Tool

## Chosen Direction

Build a standalone tool that controls Codex Desktop model configuration from its own UI.

## Why This Is Feasible

This repository does not need to modify Codex Desktop internals.

The tool can already rely on mechanisms we understand:

1. edit `~/.codex/config.toml`
2. manage the DeepSeek local proxy
3. inspect current model and provider settings
4. launch Codex Desktop after a switch

## What This Tool Can Do Reliably

1. Switch Desktop defaults between OpenAI and DeepSeek
2. Start and stop the local DeepSeek proxy
3. Show whether the proxy is healthy
4. Launch a new Codex Desktop session after switching

## Important Limitation

This tool is unlikely to change the model for the already-running live conversation inside the current Codex Desktop chat session unless Codex Desktop itself supports live session reconfiguration.

So the likely UX is:

1. choose a model in the external tool
2. apply config
3. open a new Desktop session or relaunch Desktop

## Why This Is Better Than Patching Codex Desktop

- safer across updates
- easier to maintain
- easier to distribute to another Mac
- clean repo ownership
- no app bundle reverse patching required

## Risks

- Codex Desktop may cache config until restart or new session
- upstream config keys may change
- DeepSeek bridge behavior may need periodic updates if Codex or DeepSeek changes request formats

## Verdict

This approach is practical and worth building.

