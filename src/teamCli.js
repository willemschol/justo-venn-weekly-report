import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const NPX_COMMAND = process.platform === "win32" ? "npx.cmd" : "npx";

function getTeamCliEnv() {
  return {
    ...process.env,
    JUSTO_TEAM_CLI_INTERACTIVE: "false",
    NODE_OPTIONS: "",
  };
}

function parseJsonLines(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[")) {
    return JSON.parse(trimmed);
  }

  if (trimmed.startsWith("{") && !trimmed.includes("\n{")) {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [parsed];
  }

  return trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export async function runTeamCliJson(args) {
  const { stdout } = await execFileAsync(
    NPX_COMMAND,
    ["@getjusto/team-cli", ...args, "--format", "json"],
    {
      env: getTeamCliEnv(),
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  return parseJsonLines(stdout);
}
