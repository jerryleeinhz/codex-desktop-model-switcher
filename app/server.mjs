#!/usr/bin/env node
import { createServer } from "node:http";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, writeFile, access } from "node:fs/promises";
import { spawn } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4310);
const HOST = "127.0.0.1";
const home = homedir();
const codexConfigPath = join(home, ".codex", "config.toml");
const launchAgentPath = join(home, "Library", "LaunchAgents", "com.codex.deepseek-proxy.plist");
const codexAppPath = "/Applications/Codex.app";
const indexHtmlPath = join(__dirname, "static", "index.html");

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || `${HOST}:${PORT}`}`);

    if (req.method === "GET" && url.pathname === "/") {
      const html = await readFile(indexHtmlPath, "utf8");
      return send(res, 200, html, "text/html; charset=utf-8");
    }

    if (req.method === "GET" && url.pathname === "/api/status") {
      return sendJson(res, 200, await getStatus());
    }

    if (req.method === "POST" && url.pathname === "/api/switch/openai") {
      await setDesktopModel({ model: "gpt-5.5", provider: "openai" });
      return sendJson(res, 200, await getStatus("Switched Desktop default to OpenAI."));
    }

    if (req.method === "POST" && url.pathname === "/api/switch/deepseek") {
      await ensureProxyConfigured();
      await setDesktopModel({ model: "deepseek-v4-pro", provider: "deepseek" });
      return sendJson(res, 200, await getStatus("Switched Desktop default to DeepSeek."));
    }

    if (req.method === "POST" && url.pathname === "/api/proxy/start") {
      await runCommand("launchctl", ["bootstrap", `gui/${process.getuid()}`, launchAgentPath], { allowFailure: true });
      await runCommand("launchctl", ["kickstart", "-k", `gui/${process.getuid()}/com.codex.deepseek-proxy`], { allowFailure: true });
      return sendJson(res, 200, await getStatus("Requested DeepSeek proxy start."));
    }

    if (req.method === "POST" && url.pathname === "/api/proxy/stop") {
      await runCommand("launchctl", ["bootout", `gui/${process.getuid()}`, launchAgentPath], { allowFailure: true });
      return sendJson(res, 200, await getStatus("Requested DeepSeek proxy stop."));
    }

    if (req.method === "POST" && url.pathname === "/api/codex/open") {
      await runCommand("open", ["-a", codexAppPath], { allowFailure: false });
      return sendJson(res, 200, await getStatus("Asked macOS to open Codex Desktop."));
    }

    if (req.method === "POST" && url.pathname === "/api/codex/relaunch") {
      await runCommand("osascript", ["-e", 'tell application "Codex" to quit'], { allowFailure: true });
      await delay(1200);
      await runCommand("open", ["-a", codexAppPath], { allowFailure: false });
      return sendJson(res, 200, await getStatus("Asked macOS to relaunch Codex Desktop."));
    }

    return sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Codex Desktop Model Switcher listening at http://${HOST}:${PORT}`);
});

async function getStatus(message = null) {
  const config = await readCodexConfig();
  const model = extractTopLevelValue(config, "model");
  const provider = extractTopLevelValue(config, "model_provider") || "openai";
  const proxyHealthy = await checkProxyHealth();
  const codexInstalled = await pathExists(codexAppPath);
  const deepseekProviderConfigured = /^\[model_providers\.deepseek\]$/m.test(config);

  return {
    message,
    desktop: {
      model,
      provider,
      codexInstalled
    },
    deepseek: {
      providerConfigured: deepseekProviderConfigured,
      proxyHealthy
    }
  };
}

async function readCodexConfig() {
  try {
    return await readFile(codexConfigPath, "utf8");
  } catch {
    throw new Error(`Could not read ${codexConfigPath}. Install Codex first.`);
  }
}

async function setDesktopModel({ model, provider }) {
  const original = await readCodexConfig();
  const next = updateTopLevelConfig(updateTopLevelConfig(original, "model", model), "model_provider", provider);
  await writeFile(codexConfigPath, next, "utf8");
}

function updateTopLevelConfig(content, key, value) {
  const line = `${key} = "${value}"`;
  const topLevelPattern = new RegExp(`^${escapeRegex(key)}\\s*=\\s*"[^"]*"\\s*$`, "m");

  if (topLevelPattern.test(content)) {
    return content.replace(topLevelPattern, line);
  }

  const lines = content.split("\n");
  const insertAt = findTopLevelInsertionIndex(lines);
  lines.splice(insertAt, 0, line);
  return lines.join("\n");
}

function findTopLevelInsertionIndex(lines) {
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].startsWith("[")) {
      return index;
    }
  }
  return lines.length;
}

function extractTopLevelValue(content, key) {
  for (const line of content.split("\n")) {
    if (line.startsWith("[")) break;
    const match = line.match(new RegExp(`^${escapeRegex(key)}\\s*=\\s*"([^"]*)"`));
    if (match) return match[1];
  }
  return null;
}

async function ensureProxyConfigured() {
  if (!(await pathExists(launchAgentPath))) {
    throw new Error("DeepSeek LaunchAgent is missing. Install the bridge first in the companion repository.");
  }
}

async function checkProxyHealth() {
  try {
    const response = await fetch("http://127.0.0.1:8787/health");
    return response.ok;
  } catch {
    return false;
  }
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function runCommand(command, args, { allowFailure }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "ignore" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0 || allowFailure) {
        resolve();
        return;
      }
      reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function send(res, statusCode, body, contentType) {
  res.writeHead(statusCode, { "Content-Type": contentType });
  res.end(body);
}

function sendJson(res, statusCode, payload) {
  send(res, statusCode, JSON.stringify(payload), "application/json; charset=utf-8");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
