# Architecture

## Core Pieces

1. UI layer
   A small macOS app, menu-bar app, or local web UI.

2. Config layer
   Reads and updates `~/.codex/config.toml`.

3. Bridge layer
   Reuses the DeepSeek proxy pattern:
   `responses` from Codex -> local proxy -> DeepSeek `chat/completions`

4. Process layer
   Checks proxy health and optionally launches or relaunches Codex Desktop.

## Proposed Flow

When the user clicks "Use DeepSeek":

1. ensure the DeepSeek proxy config exists
2. ensure the proxy process is running
3. set:
   - `model = "deepseek-v4-pro"`
   - `model_provider = "deepseek"`
4. optionally launch or relaunch Codex Desktop

When the user clicks "Use OpenAI":

1. set:
   - `model = "gpt-5.5"`
   - `model_provider = "openai"`
2. optionally relaunch Codex Desktop

## Reused Assets

The existing DeepSeek bridge implementation from the earlier repository should be vendored or imported into this project rather than rewritten from scratch.

## MVP UI

The first version only needs:

- current model label
- current provider label
- DeepSeek proxy health indicator
- "Switch to DeepSeek" button
- "Switch to OpenAI" button
- "Open Codex Desktop" button

